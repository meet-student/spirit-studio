import { Button } from '@mastra/playground-ui/components/Button';
import { EmptyState } from '@mastra/playground-ui/components/EmptyState';
import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NoScorersInfo = () => {
  const { t } = useTranslation('home');

  return (
    <EmptyState
      titleSlot={t('empty.noScorers')}
      descriptionSlot={t('empty.scorersDescription')}
      actionSlot={
        <Button
          variant="ghost"
          render={<a href="https://mastra.ai/docs/evals/overview" target="_blank" rel="noopener noreferrer" />}
          icon={<ExternalLinkIcon />}
        >
          {t('empty.scorersDocumentation')}
        </Button>
      }
      variant="fill"
    />
  );
};
