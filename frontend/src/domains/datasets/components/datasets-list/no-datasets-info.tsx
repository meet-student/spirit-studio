import { Button } from '@mastra/playground-ui/components/Button';
import { EmptyState } from '@mastra/playground-ui/components/EmptyState';
import { ExternalLinkIcon, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface NoDatasetsInfoProps {
  onCreateClick?: () => void;
}

export const NoDatasetsInfo = ({ onCreateClick }: NoDatasetsInfoProps = {}) => {
  const { t } = useTranslation('home');

  return (
    <EmptyState
      titleSlot={t('empty.noDatasets')}
      descriptionSlot={t('empty.datasetsDescription')}
      actionSlot={
        <div className="flex flex-col items-center gap-2">
          {onCreateClick && (
            <Button variant="primary" onClick={onCreateClick} icon={<Plus />}>
              {t('actions.createDataset')}
            </Button>
          )}
          <Button
            variant="ghost"
            render={<a href="https://mastra.ai/docs/evals/datasets" target="_blank" rel="noopener noreferrer" />}
            icon={<ExternalLinkIcon />}
          >
            {t('empty.datasetsDocumentation')}
          </Button>
        </div>
      }
      variant="fill"
    />
  );
};
