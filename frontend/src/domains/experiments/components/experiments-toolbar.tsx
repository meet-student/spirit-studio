import { ActionRow } from '@mastra/playground-ui/components/ActionRow';
import { Badge } from '@mastra/playground-ui/components/Badge';
import { Button } from '@mastra/playground-ui/components/Button';
import { ButtonsGroup, ButtonsGroupText } from '@mastra/playground-ui/components/ButtonsGroup';
import { SelectFieldBlock } from '@mastra/playground-ui/components/FormFieldBlocks';
import { ListSearch } from '@mastra/playground-ui/components/ListSearch';
import { GitCompare, Play, XIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EXPERIMENT_STATUS_OPTIONS } from './experiments-list-options';
import type { DatasetTargetType } from '@/domains/datasets/components/target-type-options';
import { TargetFilter } from '@/domains/shared/components/target-filter';

export interface ExperimentsToolbarDatasetOption {
  value: string;
  label: string;
}

export interface ExperimentsToolbarProps {
  search: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  datasetFilter: string;
  onDatasetFilterChange: (value: string) => void;
  datasetOptions: ExperimentsToolbarDatasetOption[];
  targetType: DatasetTargetType | '';
  onTargetTypeChange: (type: DatasetTargetType | '') => void;
  targetId: string;
  onTargetIdChange: (id: string) => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  onRunClick?: () => void;
  runTooltip?: string;
  /** When omitted the Compare entry point is hidden. */
  onCompareClick?: () => void;
  /** When provided, the comparison selection controls replace the Compare/Run actions. */
  selection?: ExperimentsToolbarSelection;
}

export interface ExperimentsToolbarSelection {
  selectedCount: number;
  onExecuteCompare: () => void;
  onCancelSelection: () => void;
  /** When set, the "Compare Experiments" action is disabled and this reason is shown. */
  compareDisabledReason?: string;
}

export function ExperimentsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  datasetFilter,
  onDatasetFilterChange,
  datasetOptions,
  targetType,
  onTargetTypeChange,
  targetId,
  onTargetIdChange,
  onReset,
  hasActiveFilters,
  onRunClick,
  runTooltip,
  onCompareClick,
  selection,
}: ExperimentsToolbarProps) {
  const { t } = useTranslation('home');
  const canCompare = selection?.selectedCount === 2 && !selection.compareDisabledReason;
  const effectiveRunTooltip = runTooltip ?? t('tooltips.runExperiment');
  const statusOptions = EXPERIMENT_STATUS_OPTIONS.map(option => ({
    value: option.value,
    label: t(`filters.${option.value === 'all' ? 'allStatuses' : option.value}`),
  }));

  return (
    <ActionRow>
      <ActionRow.Start>
        <div className="max-w-120 flex-1">
          <ListSearch
            label={t('filters.searchExperiments')}
            placeholder={t('filters.experimentsPlaceholder')}
            value={search}
            onSearch={onSearchChange}
          />
        </div>
        <SelectFieldBlock
          label={t('filters.status')}
          labelIsHidden
          name="filter-status"
          options={statusOptions}
          value={statusFilter}
          onValueChange={onStatusFilterChange}
          className="whitespace-nowrap"
        />
        <SelectFieldBlock
          label={t('filters.dataset')}
          labelIsHidden
          name="filter-dataset"
          options={datasetOptions}
          value={datasetFilter}
          onValueChange={onDatasetFilterChange}
          className="whitespace-nowrap"
        />
        <TargetFilter
          targetType={targetType}
          targetId={targetId}
          onTargetTypeChange={onTargetTypeChange}
          onTargetIdChange={onTargetIdChange}
        />
        {onReset && hasActiveFilters && (
          <Button onClick={onReset} size="sm" variant="default" icon={<XIcon />}>
            {t('actions.reset')}
          </Button>
        )}
      </ActionRow.Start>
      {selection ? (
        <ActionRow.End>
          <ButtonsGroup className="whitespace-nowrap">
            <ButtonsGroupText className="gap-2">
              <Badge size="sm" variant={selection.selectedCount < 2 ? 'red' : 'green'}>
                {selection.selectedCount} / 2
              </Badge>
              {t('actions.selected')}
              {selection.compareDisabledReason && (
                <span className="text-accent2">· {selection.compareDisabledReason}</span>
              )}
            </ButtonsGroupText>
            <Button variant="primary" disabled={!canCompare} onClick={selection.onExecuteCompare} icon={<GitCompare />}>
              {t('actions.compareExperiments')}
            </Button>
            <Button icon={<X />} onClick={selection.onCancelSelection}>
              {t('actions.cancel')}
            </Button>
          </ButtonsGroup>
        </ActionRow.End>
      ) : (
        <ActionRow.End>
          {onCompareClick && (
            <Button
              onClick={onCompareClick}
              tooltip={t('tooltips.compareExperiments')}
              icon={<GitCompare />}
            >
              {t('actions.compare')}
            </Button>
          )}
          {onRunClick && (
            <Button onClick={onRunClick} tooltip={effectiveRunTooltip} variant="primary" icon={<Play />}>
              {t('actions.runExperiment')}
            </Button>
          )}
        </ActionRow.End>
      )}
    </ActionRow>
  );
}
