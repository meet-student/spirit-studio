import { createServer, request as proxyRequest } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const environment = (process.env.APP_ENV ?? 'local').trim().toLowerCase();
const environmentFile = environment === 'prod' ? '.env.production' : `.env.${environment}`;
const agentRoot = resolve(process.env.DRAMA_AGENT_ROOT ?? join(root, '..', 'drama-agent'));
const agentValues = readEnvFile(join(agentRoot, environmentFile));
const proxyPort = readPort(process.env.MASTRA_PROXY_PORT ?? '4111', 'MASTRA_PROXY_PORT');
const publicPort = readPort(process.env.PORT ?? '7337', 'PORT');
const agentUrl = new URL(
  process.env.DRAMA_AGENT_API_URL ?? `http://127.0.0.1:${agentValues.APP_PORT ?? '7818'}`,
);
const agentPathPrefix = agentUrl.pathname.replace(/\/$/u, '');
const internalKey = process.env.MASTRA_INTERNAL_API_KEY ?? agentValues.MASTRA_INTERNAL_API_KEY;

if (!internalKey) throw new Error(`MASTRA_INTERNAL_API_KEY is missing in ${environmentFile}`);
if (!['127.0.0.1', 'localhost', '::1'].includes(agentUrl.hostname) && process.env.ALLOW_REMOTE_AGENT !== 'true') {
  throw new Error(`Refusing remote Agent API ${agentUrl.hostname}; set ALLOW_REMOTE_AGENT=true for a controlled connection`);
}

await waitFor(`drama-agent at ${agentUrl.origin}`, () => requestOnce(new URL('/health', agentUrl)));

const server = createServer((incoming, response) => {
  void handleRequest(incoming, response).catch(error => {
    if (response.headersSent) {
      response.destroy(error instanceof Error ? error : undefined);
      return;
    }
    sendJson(response, incoming.headers.origin, 500, {
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  });
});

await listen(server, proxyPort);
process.stdout.write(
  [
    '独立 Mastra Studio 安全代理已启动',
    `代理: http://127.0.0.1:${proxyPort}`,
    `官方 Studio 前端: http://127.0.0.1:${publicPort}`,
    `连接业务 API: ${agentUrl.origin}`,
    '评测集、实验和 scorer 由业务 Mastra Runtime 的独立运行时表持久化。',
    '内部鉴权密钥只在代理服务端注入，不发送到浏览器。',
    '',
  ].join('\n'),
);

const close = () => server.close();
process.once('SIGINT', close);
process.once('SIGTERM', close);

async function handleRequest(incoming, response) {
  const requestUrl = new URL(incoming.url ?? '/', 'http://127.0.0.1');
  const origin = incoming.headers.origin;

  if (incoming.method === 'OPTIONS') {
    writeCors(response, origin, publicPort);
    response.writeHead(204);
    response.end();
    return;
  }

  if (requestUrl.pathname === '/health') {
    sendJson(response, origin, 200, { status: 'ok', proxy: 'mastra', upstream: agentUrl.origin });
    return;
  }

  if (
    requestUrl.pathname === '/' ||
    requestUrl.pathname === '/info' ||
    isMastraPath(requestUrl.pathname) ||
    isApiAlias(requestUrl.pathname)
  ) {
    forwardToAgent(incoming, response, requestUrl);
    return;
  }

  sendJson(response, origin, 404, { error: 'Mastra proxy route not found' });
}

function forwardToAgent(incoming, response, requestUrl) {
  const agentPath = toAgentPath(requestUrl.pathname);
  const headers = { ...incoming.headers };
  headers.host = agentUrl.host;
  headers['x-mastra-internal-key'] = internalKey;

  const upstream = proxyRequest(
    {
      protocol: agentUrl.protocol,
      hostname: agentUrl.hostname,
      port: agentUrl.port === '' ? undefined : agentUrl.port,
      method: incoming.method,
      path: `${agentPathPrefix}${agentPath}${requestUrl.search}`,
      headers,
    },
    upstreamResponse => {
      const responseHeaders = { ...upstreamResponse.headers };
      delete responseHeaders['access-control-allow-origin'];
      delete responseHeaders['access-control-allow-credentials'];
      writeCors(response, incoming.headers.origin, publicPort, responseHeaders);
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
      upstreamResponse.pipe(response);
    },
  );

  upstream.once('error', error => {
    if (response.headersSent) {
      response.destroy(error);
      return;
    }
    sendJson(response, incoming.headers.origin, 502, { error: 'Business API unavailable' });
  });
  incoming.pipe(upstream);
}

function isMastraPath(pathname) {
  return pathname === '/internal/mastra' || pathname.startsWith('/internal/mastra/');
}

function isApiAlias(pathname) {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function toAgentPath(pathname) {
  if (pathname === '/') return '/info';
  if (isApiAlias(pathname)) return `/internal/mastra${pathname.slice('/api'.length)}`;
  return pathname;
}

function writeCors(response, origin, port, headers = {}) {
  const allowedOrigin =
    origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}` ? origin : undefined;
  if (allowedOrigin) headers['access-control-allow-origin'] = allowedOrigin;
  headers['access-control-allow-credentials'] = 'true';
  headers['access-control-allow-headers'] = 'content-type, authorization, x-mastra-client-type';
  headers['access-control-allow-methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
  headers['access-control-allow-private-network'] = 'true';
  headers.vary = 'Origin';
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
}

function sendJson(response, origin, status, payload) {
  writeCors(response, origin, publicPort, { 'content-type': 'application/json; charset=utf-8' });
  response.writeHead(status);
  response.end(JSON.stringify(payload));
}

function requestOnce(url) {
  return new Promise((resolveRequest, rejectRequest) => {
    const request = proxyRequest(url, response => {
      response.resume();
      response.once('end', () => {
        if ((response.statusCode ?? 500) >= 400) rejectRequest(new Error(`HTTP ${response.statusCode}`));
        else resolveRequest();
      });
    });
    request.once('error', rejectRequest);
    request.end();
  });
}

async function waitFor(label, check) {
  const deadline = Date.now() + 15_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      await check();
      return;
    } catch (error) {
      lastError = error;
      await new Promise(resolveWait => setTimeout(resolveWait, 150));
    }
  }
  throw new Error(`${label} did not become available: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

function listen(serverToStart, port) {
  return new Promise((resolveListen, rejectListen) => {
    const onError = error => {
      serverToStart.off('listening', onListening);
      rejectListen(error);
    };
    const onListening = () => {
      serverToStart.off('error', onError);
      resolveListen();
    };
    serverToStart.once('error', onError);
    serverToStart.once('listening', onListening);
    serverToStart.listen(port, '127.0.0.1');
  });
}

function readPort(value, name) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error(`${name} must be a valid TCP port`);
  return port;
}

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const values = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/u)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#]*))\s*$/u);
    if (match) values[match[1]] = (match[2] ?? match[3] ?? match[4] ?? '').trim();
  }
  return values;
}
