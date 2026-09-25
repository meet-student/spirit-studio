import { ActionRow } from '@mastra/playground-ui/components/ActionRow';
import { Button } from '@mastra/playground-ui/components/Button';
import { SelectFieldBlock } from '@mastra/playground-ui/components/FormFieldBlocks';
import { ListSearch } from '@mastra/playground-ui/components/ListSearch';
import { XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DATASET_EXPERIMENT_OPTIONS } from './datasets-list/helpers';
import type { DatasetTargetType } from './target-type-options';
import { TargetFilter } from '@/domains/shared/components/target-filter';

export interface DatasetsToolbarTagOption {
  value: string;
  label: string;
}

export interface DatasetsToolbarProps {
  search: string;
  onSearchChange: (query: string) => void;
  experimentFilter: string;
  onExperimentFilterChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  tagOptions: DatasetsToolbarTagOption[];
  targetType: DatasetTargetType | '';
  onTargetTypeChange: (type: DatasetTargetType | '') => void;
  targetId: string;
  onTargetIdChange: (id: string) => void;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export function DatasetsToolbar({
  search,
  onSearchChange,
  experimentFilter,
  onExperimentFilterChange,
  tagFilter,
  onTagFilterChange,
  tagOptions,
  targetType,
  onTargetTypeChange,
  targetId,
  onTargetIdChange,
  onReset,
  hasActiveFilters,
}: DatasetsToolbarProps) {
  const { t } = useTranslation('home');
  const experimentOptions = DATASET_EXPERIMENT_OPTIONS.map(option => ({
    value: option.value,
    label:
      option.value === 'all'
        ? t('filters.allDatasets')
        : option.value === 'with'
          ? t('filters.withExperiments')
          : t('filters.withoutExperiments'),
  }));

  return (
    <ActionRow>
      <ActionRow.Start>
        <div className="max-w-120 flex-1">
          <ListSearch
            label={t('filters.searchDatasets')}
            placeholder={t('filters.datasetsPlaceholder')}
            value={search}
            onSearch={onSearchChange}
          />
        </div>
        <TargetFilter
          targetType={targetType}
          targetId={targetId}
          onTargetTypeChange={onTargetTypeChange}
          onTargetIdChange={onTargetIdChange}
        />
        <SelectFieldBlock
          label={t('filters.experiments')}
          labelIsHidden
          name="filter-experiments"
          options={experimentOptions}
          value={experimentFilter}
          onValueChange={onExperimentFilterChange}
          className="whitespace-nowrap"
        />
        {tagOptions.length > 1 && (
          <SelectFieldBlock
            label={t('filters.tags')}
            labelIsHidden
            name="filter-tags"
            options={tagOptions}
            value={tagFilter}
            onValueChange={onTagFilterChange}
            className="whitespace-nowrap"
          />
        )}
        {onReset && hasActiveFilters && (
          <Button onClick={onReset} size="sm" variant="default" icon={<XIcon />}>
            {t('actions.reset')}
          </Button>
        )}
      </ActionRow.Start>
    </ActionRow>
  );
}
