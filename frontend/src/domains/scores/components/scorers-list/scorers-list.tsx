import type { GetScorerResponse, RouteResponse } from '@mastra/client-js';
import { Badge } from '@mastra/playground-ui/components/Badge';
import {
  DataList as EntityList,
  DataListSkeleton as EntityListSkeleton,
  useDataListKeyboard,
} from '@mastra/playground-ui/components/DataList';
import type { DataListSort } from '@mastra/playground-ui/components/DataList';
import { AgentIcon } from '@mastra/playground-ui/icons/AgentIcon';
import { sortBy } from '@mastra/playground-ui/sort/sort-by';
import type { ListSort } from '@mastra/playground-ui/sort/sort-by';
import { WorkflowIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkComponent } from '@/lib/framework';

export type ScorersListItem = GetScorerResponse & { id: string };

export type ScorersSortKey = 'name' | 'source' | 'agents' | 'workflows';
export type ScorersSort = ListSort<ScorersSortKey>;

const sortAccessors = {
  name: (scorer: ScorersListItem) => scorer.scorer.config?.name || scorer.id,
  source: (scorer: ScorersListItem) => scorer.source,
  agents: (scorer: ScorersListItem) => scorer.agentIds?.length ?? 0,
  workflows: (scorer: ScorersListItem) => scorer.workflowIds?.length ?? 0,
};

export interface ScorersListProps {
  scorers: RouteResponse<'GET /scores/scorers'>;
  isLoading: boolean;
  search?: string;
  sourceFilter?: string;
  sort?: ScorersSort;
  onSortChange?: (direction: DataListSort, key: ScorersSortKey) => void;
  /** When provided, rows become buttons that call this instead of navigating to the scorer page. */
  onSelectScorer?: (scorer: ScorersListItem) => void;
  /** Highlights the row for the given scorer id (used with `onSelectScorer`). */
  selectedScorerId?: string;
  /** Whether keyboard roving is bound globally. Defaults to `true`. */
  keyboardGlobal?: boolean;
}

const COLUMNS = 'minmax(0,1fr) minmax(0,1.5fr) auto auto auto';

export function ScorersList({
  scorers,
  isLoading,
  search = '',
  sourceFilter = 'all',
  sort,
  onSortChange,
  onSelectScorer,
  selectedScorerId,
  keyboardGlobal = true,
}: ScorersListProps) {
  const { t } = useTranslation('home');
  const { paths, Link } = useLinkComponent();

  const scorerData = useMemo<ScorersListItem[]>(
    () =>
      Object.entries(scorers).map(([key, scorer]) => ({
        ...scorer,
        id: key,
      })),
    [scorers],
  );

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    const filtered = scorerData.filter(s => {
      const matchesSearch =
        !term ||
        s.scorer.config?.id?.toLowerCase().includes(term) ||
        s.scorer.config?.name?.toLowerCase().includes(term);
      const matchesSource = sourceFilter === 'all' || s.source === sourceFilter;
      return matchesSearch && matchesSource;
    });
    return sortBy(filtered, sort, sortAccessors);
  }, [scorerData, search, sourceFilter, sort]);

  const { containerRef, getRowProps } = useDataListKeyboard({ count: filteredData.length, global: keyboardGlobal });

  if (isLoading) {
    return <EntityListSkeleton columns={COLUMNS} />;
  }

  const sortFor = (key: ScorersSortKey) => (sort?.key === key ? sort.direction : undefined);

  return (
    <EntityList columns={COLUMNS} scrollRef={containerRef}>
      <EntityList.Top>
        {onSortChange ? (
          <>
            <EntityList.SortableTopCell sortKey="name" sort={sortFor('name')} onSortChange={onSortChange}>
              {t('table.name')}
            </EntityList.SortableTopCell>
            <EntityList.TopCell>{t('table.description')}</EntityList.TopCell>
            <EntityList.SortableTopCell sortKey="source" sort={sortFor('source')} onSortChange={onSortChange}>
              {t('table.source')}
            </EntityList.SortableTopCell>
            <EntityList.SortableTopCell
              sortKey="agents"
              sort={sortFor('agents')}
              onSortChange={onSortChange}
              align="end"
            >
              {t('table.agents')}
            </EntityList.SortableTopCell>
            <EntityList.SortableTopCell
              sortKey="workflows"
              sort={sortFor('workflows')}
              onSortChange={onSortChange}
              align="end"
            >
              {t('table.workflows')}
            </EntityList.SortableTopCell>
          </>
        ) : (
          <>
            <EntityList.TopCell>{t('table.name')}</EntityList.TopCell>
            <EntityList.TopCell>{t('table.description')}</EntityList.TopCell>
            <EntityList.TopCell>{t('table.source')}</EntityList.TopCell>
            <EntityList.TopCellSmart
              long={t('table.agents')}
              short={<AgentIcon />}
              tooltip={t('details.attachedCount', { resource: t('table.agents') })}
              className="text-center"
            />
            <EntityList.TopCellSmart
              long={t('table.workflows')}
              short={<WorkflowIcon />}
              tooltip={t('details.attachedCount', { resource: t('table.workflows') })}
              className="text-center"
            />
          </>
        )}
      </EntityList.Top>

      {filteredData.map((scorer, index) => {
        const name = scorer.scorer.config?.name || scorer.id;
        const description = scorer.scorer.config?.description || '';
        const agentCount = scorer.agentIds?.length ?? 0;
        const workflowCount = scorer.workflowIds?.length ?? 0;
        const isTrajectory = scorer.scorer.config?.type === 'trajectory';

        const cells = (
          <>
            <EntityList.NameCell>
              <span className="flex max-w-full min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate">{name}</span>
                {isTrajectory && (
                  <Badge size="xs" variant="purple" className="shrink-0">
                    trajectory
                  </Badge>
                )}
              </span>
            </EntityList.NameCell>
            <EntityList.DescriptionCell>{description}</EntityList.DescriptionCell>
            <EntityList.Cell>
              <Badge size="xs" variant={scorer.source === 'code' ? 'blue' : 'neutral'}>
                {scorer.source}
              </Badge>
            </EntityList.Cell>
            <EntityList.TextCell className="text-center">{agentCount || ''}</EntityList.TextCell>
            <EntityList.TextCell className="text-center">{workflowCount || ''}</EntityList.TextCell>
          </>
        );

        if (onSelectScorer) {
          return (
            <EntityList.RowButton
              key={scorer.id}
              featured={selectedScorerId === scorer.id}
              onClick={() => onSelectScorer(scorer)}
              {...getRowProps(index)}
            >
              {cells}
            </EntityList.RowButton>
          );
        }

        return (
          <EntityList.RowLink
            key={scorer.id}
            to={paths.scorerLink(scorer.id)}
            LinkComponent={Link}
            {...getRowProps(index)}
          >
            {cells}
          </EntityList.RowLink>
        );
      })}
    </EntityList>
  );
}
