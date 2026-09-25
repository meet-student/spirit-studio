import { CommandEmpty, CommandGroup } from '@mastra/playground-ui/components/Command';
import {
  CommandPaletteBody,
  CommandPaletteDialog,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteRail,
  CommandPaletteResults,
  CommandPaletteScope,
} from '@mastra/playground-ui/components/CommandPalette';
import { useMaybeSidebarState } from '@mastra/playground-ui/components/MainSidebar';
import { AgentIcon } from '@mastra/playground-ui/icons/AgentIcon';
import { McpServerIcon } from '@mastra/playground-ui/icons/McpServerIcon';
import { ToolsIcon } from '@mastra/playground-ui/icons/ToolsIcon';
import { WorkflowIcon } from '@mastra/playground-ui/icons/WorkflowIcon';
import {
  Cpu,
  EyeIcon,
  GaugeIcon,
  Layers3Icon,
  PackageIcon,
  PanelLeftIcon,
  RouteIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useNavigationCommand } from './use-navigation-command';
import { useAgents } from '@/domains/agents/hooks/use-agents';
import { usePermissions } from '@/domains/auth/hooks/use-permissions';
import { getPermissionForRoute, hasRoutePermission } from '@/domains/auth/route-permissions';
import { useIsCmsAvailable } from '@/domains/cms/hooks/use-is-cms-available';
import { useMCPServers } from '@/domains/mcps/hooks/use-mcp-servers';
import { useProcessors } from '@/domains/processors/hooks/use-processors';
import { useScorers } from '@/domains/scores/hooks/use-scorers';
import { useTools } from '@/domains/tools/hooks/use-all-tools';
import { useWorkflows } from '@/domains/workflows/hooks/use-workflows';
import { useLinkComponent } from '@/lib/framework';
import { useMastraPlatform } from '@/lib/mastra-platform';
import { bottomNav, mainNav } from '@/lib/nav/nav-items';
import type { NavItem } from '@/lib/nav/nav-items';

type CommandScope = 'all' | 'paths' | 'agents' | 'workflows' | 'tooling' | 'evaluation' | 'observability' | 'settings';

type ScopeOption = {
  id: CommandScope;
  label: string;
  icon: React.ReactNode;
  count: number;
};

function getRouteValue(item: NavItem, sectionTitle?: string) {
  return [item.name, item.url, sectionTitle, 'path route navigate'].filter(Boolean).join(' ');
}

function getRouteBadge(sectionTitle: string | undefined, translate: (key: string) => string) {
  if (!sectionTitle || sectionTitle === translate('sections.studio')) return translate('command.path');
  return sectionTitle;
}

function getTracesEntityPath(entity: string) {
  return `/traces?entity=${encodeURIComponent(entity)}`;
}

type NavigationSection = {
  key: string;
  title: string;
  titleKey?: string;
  items: NavItem[];
};

type NavigationPaths = ReturnType<typeof useLinkComponent>['paths'];
type SidebarContextValue = NonNullable<ReturnType<typeof useMaybeSidebarState>>;
type HandleSelect = (path: string) => void;
type AgentEntry = [string, { name: string }];
type WorkflowEntry = [string, { name: string }];
type ToolEntry = [string, { id: string }];
type ProcessorEntry = {
  id: string;
  name?: string;
  isWorkflow?: boolean;
};
type McpServerEntry = {
  id: string;
  name: string;
};
type ScorerEntry = [
  string,
  {
    scorer?: {
      config?: {
        id?: string;
        name?: string;
      };
    };
  },
];

const CommandRail = ({
  scopeOptions,
  activeScope,
  onScopeChange,
}: {
  scopeOptions: ScopeOption[];
  activeScope: CommandScope;
  onScopeChange: (scope: CommandScope) => void;
}) => (
  <CommandPaletteRail aria-label="Search categories">
    {scopeOptions.map(option => (
      <CommandPaletteScope
        key={option.id}
        icon={option.icon}
        label={option.label}
        count={option.count}
        active={activeScope === option.id}
        onSelect={() => onScopeChange(option.id)}
      />
    ))}
  </CommandPaletteRail>
);

const CommandResults = ({
  sidebar,
  activeScope,
  closeCommand,
}: {
  sidebar: SidebarContextValue | null;
  activeScope: CommandScope;
  closeCommand: () => void;
}) => {
  const { t } = useTranslation('navigation');
  if (!sidebar || (activeScope !== 'all' && activeScope !== 'settings')) return null;

  return (
    <CommandGroup heading={t('command.commands')}>
      <CommandPaletteItem
        value="toggle sidebar collapse expand layout panel"
        onSelect={() => {
          sidebar.toggleSidebar();
          closeCommand();
        }}
        icon={<PanelLeftIcon />}
        title={t('command.toggleSidebar')}
        subtitle={t('command.layout')}
      />
    </CommandGroup>
  );
};

const PathSectionResults = ({
  sections,
  handleSelect,
}: {
  sections: NavigationSection[];
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');

  return (
    <>
      {sections.map(section => (
        <CommandGroup key={section.key} heading={section.titleKey ? t(section.titleKey) : section.title}>
          {section.items.map(item => {
            const Icon = item.Icon;
            return (
              <CommandPaletteItem
                key={item.url}
                value={getRouteValue(item, section.title)}
                onSelect={() => handleSelect(item.url)}
                icon={<Icon />}
                title={item.translationKey ? t(item.translationKey) : item.name}
                subtitle={t('command.path')}
                path={item.url}
                badge={getRouteBadge(section.title, t)}
              />
            );
          })}
        </CommandGroup>
      ))}
    </>
  );
};

const AgentResults = ({
  visible,
  entries,
  paths,
  handleSelect,
}: {
  visible: boolean;
  entries: AgentEntry[];
  paths: NavigationPaths;
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible || entries.length === 0) return null;

  return (
    <CommandGroup heading={t('items.agents')}>
      {entries.map(([id, agent]) => (
        <CommandPaletteItem
          key={id}
          value={`${agent.name} ${id} chat agent conversation thread ${paths.agentLink(id)}`}
          onSelect={() => handleSelect(paths.agentLink(id))}
          icon={<AgentIcon />}
          title={agent.name}
          subtitle={t('command.agentChat')}
          path={paths.agentLink(id)}
          badge={t('command.agent')}
        />
      ))}
    </CommandGroup>
  );
};

const WorkflowResults = ({
  visible,
  entries,
  paths,
  handleSelect,
}: {
  visible: boolean;
  entries: WorkflowEntry[];
  paths: NavigationPaths;
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible || entries.length === 0) return null;

  return (
    <CommandGroup heading={t('items.workflows')}>
      {entries.map(([id, workflow]) => (
        <CommandPaletteItem
          key={id}
          value={`${workflow.name} ${id} graph workflow view ${paths.workflowLink(id)}`}
          onSelect={() => handleSelect(paths.workflowLink(id))}
          icon={<WorkflowIcon />}
          title={workflow.name}
          subtitle={t('command.workflowGraph')}
          path={paths.workflowLink(id)}
          badge={t('command.workflow')}
        />
      ))}
    </CommandGroup>
  );
};

const ToolResults = ({
  visible,
  entries,
  paths,
  handleSelect,
}: {
  visible: boolean;
  entries: ToolEntry[];
  paths: NavigationPaths;
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible || entries.length === 0) return null;

  return (
    <CommandGroup heading={t('items.tools')}>
      {entries.map(([id, tool]) => (
        <CommandPaletteItem
          key={id}
          value={`tool ${tool.id} ${id} ${paths.toolLink(id)}`}
          onSelect={() => handleSelect(paths.toolLink(id))}
          icon={<ToolsIcon />}
          title={tool.id}
          subtitle={t('command.toolDefinition')}
          path={paths.toolLink(id)}
          badge={t('command.tool')}
        />
      ))}
    </CommandGroup>
  );
};

const ProcessorResults = ({
  visible,
  entries,
  paths,
  handleSelect,
}: {
  visible: boolean;
  entries: ProcessorEntry[];
  paths: NavigationPaths;
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible || entries.length === 0) return null;

  return (
    <CommandGroup heading={t('items.processors')}>
      {entries.map(processor => {
        const displayName = processor.name || processor.id;
        const targetPath = processor.isWorkflow
          ? paths.workflowLink(processor.id) + '/graph'
          : paths.processorLink(processor.id);
        return (
          <CommandPaletteItem
            key={processor.id}
            value={`processor ${displayName} ${processor.id} ${targetPath}`}
            onSelect={() => handleSelect(targetPath)}
            icon={<Cpu />}
            title={displayName}
            subtitle={processor.isWorkflow ? t('command.workflowProcessor') : t('command.processor')}
            path={targetPath}
            badge={t('command.processor')}
          />
        );
      })}
    </CommandGroup>
  );
};

const McpServerResults = ({
  visible,
  entries,
  paths,
  handleSelect,
}: {
  visible: boolean;
  entries: McpServerEntry[];
  paths: NavigationPaths;
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible || entries.length === 0) return null;

  return (
    <CommandGroup heading={t('items.mcpServers')}>
      {entries.map(server => (
        <CommandPaletteItem
          key={server.id}
          value={`mcp server ${server.name} ${server.id} ${paths.mcpServerLink(server.id)}`}
          onSelect={() => handleSelect(paths.mcpServerLink(server.id))}
          icon={<McpServerIcon />}
          title={server.name}
          subtitle={t('command.mcpServer')}
          path={paths.mcpServerLink(server.id)}
          badge={t('command.mcp')}
        />
      ))}
    </CommandGroup>
  );
};

const ObservabilityResults = ({
  visible,
  agentEntries,
  workflowEntries,
  handleSelect,
}: {
  visible: boolean;
  agentEntries: AgentEntry[];
  workflowEntries: WorkflowEntry[];
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible) return null;

  return (
    <>
      <CommandGroup heading={t('sections.observability')}>
        <CommandPaletteItem
          value="observability traces telemetry signals /traces"
          onSelect={() => handleSelect('/traces')}
          icon={<EyeIcon />}
          title={t('items.traces')}
          subtitle={t('command.runtimeTraces')}
          path="/traces"
          badge={t('command.signal')}
        />
        <CommandPaletteItem
          value="metrics usage latency performance tokens /metrics"
          onSelect={() => handleSelect('/metrics')}
          icon={<GaugeIcon />}
          title={t('items.metrics')}
          subtitle={t('command.runtimeMetrics')}
          path="/metrics"
          badge={t('command.signal')}
        />
        <CommandPaletteItem
          value="logs events runtime /logs"
          onSelect={() => handleSelect('/logs')}
          icon={<EyeIcon />}
          title={t('items.logs')}
          subtitle={t('command.runtimeLogs')}
          path="/logs"
          badge={t('command.signal')}
        />
      </CommandGroup>

      {agentEntries.length > 0 && (
        <CommandGroup heading={t('command.agentTraces')}>
          {agentEntries.map(([id, agent]) => {
            const path = getTracesEntityPath(id);

            return (
              <CommandPaletteItem
                key={id}
                value={`${agent.name} ${id} traces agent observability telemetry`}
                onSelect={() => handleSelect(path)}
                icon={<EyeIcon />}
                title={agent.name}
                subtitle={t('command.agentTraces')}
                path={path}
                badge={t('command.trace')}
              />
            );
          })}
        </CommandGroup>
      )}

      {workflowEntries.length > 0 && (
        <CommandGroup heading={t('command.workflowTraces')}>
          {workflowEntries.map(([id, workflow]) => {
            const path = getTracesEntityPath(workflow.name);

            return (
              <CommandPaletteItem
                key={id}
                value={`${workflow.name} ${id} traces workflow observability telemetry`}
                onSelect={() => handleSelect(path)}
                icon={<EyeIcon />}
                title={workflow.name}
                subtitle={t('command.workflowTraces')}
                path={path}
                badge={t('command.trace')}
              />
            );
          })}
        </CommandGroup>
      )}
    </>
  );
};

const EvaluationResults = ({
  visible,
  entries,
  paths,
  handleSelect,
}: {
  visible: boolean;
  entries: ScorerEntry[];
  paths: NavigationPaths;
  handleSelect: HandleSelect;
}) => {
  const { t } = useTranslation('navigation');
  if (!visible || entries.length === 0) return null;

  return (
    <CommandGroup heading={t('items.scorers')}>
      {entries.map(([id, scorer]) => {
        const name = scorer.scorer?.config?.name || scorer.scorer?.config?.id || id;
        return (
          <CommandPaletteItem
            key={id}
            value={`scorer score evaluation ${name} ${id} ${paths.scorerLink(id)}`}
            onSelect={() => handleSelect(paths.scorerLink(id))}
            icon={<GaugeIcon />}
            title={name}
            subtitle={t('command.evaluationScorer')}
            path={paths.scorerLink(id)}
            badge={t('command.scorer')}
          />
        );
      })}
    </CommandGroup>
  );
};

export const NavigationCommand = () => {
  const { open, setOpen } = useNavigationCommand();
  const { navigate, paths } = useLinkComponent();
  const { isMastraPlatform } = useMastraPlatform();
  const sidebar = useMaybeSidebarState();
  const [activeScope, setActiveScope] = React.useState<CommandScope>('all');
  const { t } = useTranslation('navigation');

  const { data: agents = {} } = useAgents();
  const { data: workflows = {} } = useWorkflows();
  const { data: tools = {} } = useTools();
  const { data: processors = {} } = useProcessors();
  const { data: mcpServers = [] } = useMCPServers();
  const { data: scorers = {} } = useScorers();
  const { isCmsAvailable, isLoading: isCmsLoading } = useIsCmsAvailable();
  const { hasPermission, hasAnyPermission, isLoading: isPermissionsLoading } = usePermissions();

  const updateOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setActiveScope('all');
  };

  const closeCommand = () => updateOpen(false);

  const handleSelect = (path: string) => {
    navigate(path);
    closeCommand();
  };

  const filterNavItem = React.useCallback(
    (item: NavItem) => {
      if (item.hidden) return false;
      if (item.url === '/prompts' && !isCmsAvailable && !isCmsLoading) return false;
      if (isMastraPlatform && !item.isOnMastraPlatform) return false;

      const requiredPermission = getPermissionForRoute(item.url);
      if (isPermissionsLoading && requiredPermission && requiredPermission !== 'public') return false;

      return hasRoutePermission(requiredPermission, hasPermission, hasAnyPermission);
    },
    [hasAnyPermission, hasPermission, isCmsAvailable, isCmsLoading, isMastraPlatform, isPermissionsLoading],
  );

  const agentEntries = Object.entries(agents);
  const workflowEntries = Object.entries(workflows);
  const toolEntries = Object.entries(tools);
  const processorEntries = Object.values(processors).filter(p => p.phases && p.phases.length > 0);
  const scorerEntries = Object.entries(scorers);

  const navigationSections = React.useMemo(() => {
    const sections: NavigationSection[] = [];
    for (const section of mainNav) {
      const items = section.items.filter(filterNavItem);
      if (items.length > 0) sections.push({ key: section.key, title: section.title, titleKey: section.titleKey, items });
    }

    const studioItems: NavItem[] = [
      ...bottomNav.filter(filterNavItem),
      ...(!isMastraPlatform
        ? [
            {
              name: t('items.templates'),
              translationKey: 'items.templates',
              url: '/templates',
              Icon: PackageIcon,
              isOnMastraPlatform: false,
            },
          ]
        : []),
    ];

    if (studioItems.length === 0) return sections;
    return [...sections, { key: 'studio', title: t('sections.studio'), titleKey: 'sections.studio', items: studioItems }];
  }, [filterNavItem, isMastraPlatform, t]);

  const pathCount = navigationSections.reduce((count, section) => count + section.items.length, 0);
  const toolingCount = toolEntries.length + processorEntries.length + mcpServers.length;
  const evaluationCount = scorerEntries.length;
  const observabilityCount = agentEntries.length + workflowEntries.length + 3;
  const settingsCount = navigationSections.find(section => section.key === 'studio')?.items.length ?? 0;
  const allCount =
    pathCount + agentEntries.length + workflowEntries.length + toolingCount + evaluationCount + observabilityCount;

  const scopeOptions: ScopeOption[] = [
    { id: 'all', label: t('command.all'), icon: <SearchIcon />, count: allCount },
    { id: 'paths', label: t('command.paths'), icon: <RouteIcon />, count: pathCount },
    { id: 'agents', label: t('items.agents'), icon: <AgentIcon />, count: agentEntries.length },
    { id: 'workflows', label: t('items.workflows'), icon: <WorkflowIcon />, count: workflowEntries.length },
    { id: 'tooling', label: t('command.tooling'), icon: <Layers3Icon />, count: toolingCount },
    { id: 'evaluation', label: t('sections.evaluation'), icon: <GaugeIcon />, count: evaluationCount },
    { id: 'observability', label: t('items.intelligence'), icon: <EyeIcon />, count: observabilityCount },
    { id: 'settings', label: t('command.settings'), icon: <SlidersHorizontalIcon />, count: settingsCount },
  ];

  const showPaths = activeScope === 'all' || activeScope === 'paths';
  const showAgents = activeScope === 'all' || activeScope === 'agents';
  const showWorkflows = activeScope === 'all' || activeScope === 'workflows';
  const showTooling = activeScope === 'all' || activeScope === 'tooling';
  const showEvaluation = activeScope === 'all' || activeScope === 'evaluation';
  const showObservability = activeScope === 'all' || activeScope === 'observability';
  const showSettings = activeScope === 'settings';

  const visiblePathSections = React.useMemo(() => {
    const sections: NavigationSection[] = [];
    for (const section of navigationSections) {
      if (showSettings) {
        if (section.key === 'studio') sections.push(section);
        continue;
      }

      const isVisible =
        (activeScope === 'evaluation' && section.key === 'evaluation') ||
        (activeScope === 'observability' && section.key === 'observability') ||
        (showPaths && (activeScope === 'all' || section.key !== 'studio'));

      if (isVisible) sections.push(section);
    }
    return sections;
  }, [activeScope, navigationSections, showPaths, showSettings]);

  return (
    <CommandPaletteDialog
      open={open}
      onOpenChange={updateOpen}
      title={t('command.searchTitle')}
      description={t('command.searchDescription')}
    >
      <CommandPaletteInput placeholder={t('command.searchPlaceholder')} />
      <CommandPaletteBody>
        <CommandRail scopeOptions={scopeOptions} activeScope={activeScope} onScopeChange={setActiveScope} />
        <CommandPaletteResults aria-label={t('command.searchResults')} footer={<CommandPaletteFooter label={t('command.studioSearch')} />}>
          <CommandEmpty>{t('command.noResults')}</CommandEmpty>
          <CommandResults sidebar={sidebar} activeScope={activeScope} closeCommand={closeCommand} />
          <PathSectionResults sections={visiblePathSections} handleSelect={handleSelect} />
          <AgentResults visible={showAgents} entries={agentEntries} paths={paths} handleSelect={handleSelect} />
          <WorkflowResults
            visible={showWorkflows}
            entries={workflowEntries}
            paths={paths}
            handleSelect={handleSelect}
          />
          <ToolResults visible={showTooling} entries={toolEntries} paths={paths} handleSelect={handleSelect} />
          <ProcessorResults
            visible={showTooling}
            entries={processorEntries}
            paths={paths}
            handleSelect={handleSelect}
          />
          <McpServerResults visible={showTooling} entries={mcpServers} paths={paths} handleSelect={handleSelect} />
          <ObservabilityResults
            visible={showObservability}
            agentEntries={agentEntries}
            workflowEntries={workflowEntries}
            handleSelect={handleSelect}
          />
          <EvaluationResults
            visible={showEvaluation}
            entries={scorerEntries}
            paths={paths}
            handleSelect={handleSelect}
          />
        </CommandPaletteResults>
      </CommandPaletteBody>
    </CommandPaletteDialog>
  );
};
