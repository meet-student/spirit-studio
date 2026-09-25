import { AgentIcon } from '@mastra/playground-ui/icons/AgentIcon';
import { DatasetsIcon } from '@mastra/playground-ui/icons/DatasetsIcon';
import { ExperimentsIcon } from '@mastra/playground-ui/icons/ExperimentsIcon';
import { LogsIcon } from '@mastra/playground-ui/icons/LogsIcon';
import { McpServerIcon } from '@mastra/playground-ui/icons/McpServerIcon';
import { MetricsIcon } from '@mastra/playground-ui/icons/MetricsIcon';
import { ProcessorIcon } from '@mastra/playground-ui/icons/ProcessorIcon';
import { PromptIcon } from '@mastra/playground-ui/icons/PromptIcon';
import { RequestContextIcon } from '@mastra/playground-ui/icons/RequestContextIcon';
import { ScorersIcon } from '@mastra/playground-ui/icons/ScorersIcon';
import { SettingsIcon } from '@mastra/playground-ui/icons/SettingsIcon';
import { ToolsIcon } from '@mastra/playground-ui/icons/ToolsIcon';
import { TraceIcon } from '@mastra/playground-ui/icons/TraceIcon';
import { WorkflowIcon } from '@mastra/playground-ui/icons/WorkflowIcon';
import { WorkspacesIcon } from '@mastra/playground-ui/icons/WorkspacesIcon';
import { BookIcon, ClipboardCheck, LayoutGrid } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  name: string;
  translationKey?: string;
  url: string;
  Icon: NavIcon;
  isOnMastraPlatform?: boolean;
  activePaths?: string[];
  /** When true, the item stays in the registry (so breadcrumbs/routes can resolve it) but is hidden from the sidebar and command palette. */
  hidden?: boolean;
  /** When true, the sidebar folds the item under "More" unless it was visited recently or the server reports it is in use. */
  foldable?: boolean;
}

export interface NavSection {
  key: string;
  title: string;
  titleKey?: string;
  href?: string;
  items: NavItem[];
}

// The Intelligence sidebar link is gated behind the dedicated MASTRA_SIGNALS_UI flag
// so the feature can be toggled independently of the platform config that the
// Intelligence route itself consumes.
const isSignalsEnabled =
  typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).MASTRA_SIGNALS_UI === 'true';

const signalsNavItem: NavItem = {
  name: 'Intelligence',
  translationKey: 'items.intelligence',
  url: '/intelligence',
  activePaths: ['/intelligence'],
  Icon: LayoutGrid,
  isOnMastraPlatform: true,
  // Kept in the registry so /intelligence routes and breadcrumbs always resolve, but
  // only surfaced in the sidebar/command palette when the flag is enabled.
  hidden: !isSignalsEnabled,
};

export const mainNav: NavSection[] = [
  {
    key: 'primitives',
    title: 'Primitives',
    titleKey: 'sections.primitives',
    items: [
      {
        name: 'Agents',
        translationKey: 'items.agents',
        url: '/agents',
        Icon: AgentIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Prompts',
        translationKey: 'items.prompts',
        url: '/prompts',
        Icon: PromptIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Workflows',
        translationKey: 'items.workflows',
        url: '/workflows',
        Icon: WorkflowIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Processors',
        translationKey: 'items.processors',
        url: '/processors',
        Icon: ProcessorIcon,
        isOnMastraPlatform: false,
        foldable: true,
      },
      {
        name: 'MCP Servers',
        translationKey: 'items.mcpServers',
        url: '/mcps',
        Icon: McpServerIcon,
        isOnMastraPlatform: true,
        foldable: true,
      },
      {
        name: 'Tools',
        translationKey: 'items.tools',
        url: '/tools',
        Icon: ToolsIcon,
        isOnMastraPlatform: true,
        foldable: true,
      },
      {
        name: 'Workspaces',
        translationKey: 'items.workspaces',
        url: '/workspaces',
        Icon: WorkspacesIcon,
        isOnMastraPlatform: true,
        foldable: true,
      },
      {
        name: 'Request Context',
        translationKey: 'items.requestContext',
        url: '/request-context',
        Icon: RequestContextIcon,
        isOnMastraPlatform: true,
      },
    ],
  },
  {
    key: 'evaluation',
    title: 'Evaluation',
    titleKey: 'sections.evaluation',
    items: [
      {
        name: 'Scorers',
        translationKey: 'items.scorers',
        url: '/scorers',
        Icon: ScorersIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Datasets',
        translationKey: 'items.datasets',
        url: '/datasets',
        Icon: DatasetsIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Experiments',
        translationKey: 'items.experiments',
        url: '/experiments',
        Icon: ExperimentsIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Review Queue',
        translationKey: 'items.reviewQueue',
        url: '/experiments/review-queue',
        Icon: ClipboardCheck,
        isOnMastraPlatform: true,
      },
    ],
  },
  {
    key: 'observability',
    title: 'Observability',
    titleKey: 'sections.observability',
    items: [
      {
        name: 'Metrics',
        translationKey: 'items.metrics',
        url: '/metrics',
        Icon: MetricsIcon,
        isOnMastraPlatform: true,
      },
      {
        name: 'Traces',
        translationKey: 'items.traces',
        url: '/traces',
        Icon: TraceIcon,
        isOnMastraPlatform: true,
      },
      signalsNavItem,
      {
        name: 'Logs',
        translationKey: 'items.logs',
        url: '/logs',
        Icon: LogsIcon,
        isOnMastraPlatform: true,
      },
    ],
  },
];

export const bottomNav: NavItem[] = [
  { name: 'Settings', translationKey: 'items.settings', url: '/settings', Icon: SettingsIcon, isOnMastraPlatform: false },
  { name: 'Resources', translationKey: 'items.resources', url: '/resources', Icon: BookIcon, isOnMastraPlatform: true },
];

const allItems: NavItem[] = [...mainNav.flatMap(s => s.items), ...bottomNav];

export function findNavItem(url: string): NavItem | undefined {
  return allItems.find(i => i.url === url);
}
