import { Button } from '@mastra/playground-ui/components/Button';
import { EmptyState } from '@mastra/playground-ui/components/EmptyState';
import { ExternalLinkIcon, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NoExperimentsInfo = ({ onRunExperiment }: { onRunExperiment?: () => void }) => {
  const { t } = useTranslation('home');

  return (
    <EmptyState
      titleSlot={t('empty.noExperiments')}
      descriptionSlot={t('empty.experimentsDescription')}
      actionSlot={
        <div className="flex flex-col items-center gap-2">
          {onRunExperiment && (
            <Button variant="primary" onClick={onRunExperiment} icon={<Play />}>
              {t('actions.runExperiment')}
            </Button>
          )}
          <Button
            variant="ghost"
            render={<a href="https://mastra.ai/docs/evals/experiments" target="_blank" rel="noopener noreferrer" />}
            icon={<ExternalLinkIcon />}
          >
            {t('empty.experimentsDocumentation')}
          </Button>
        </div>
      }
      variant="fill"
    />
  );
};
