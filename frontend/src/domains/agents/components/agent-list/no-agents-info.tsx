import { Button } from '@mastra/playground-ui/components/Button';
import { EmptyState } from '@mastra/playground-ui/components/EmptyState';
import { ExternalLinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NoAgentsInfo = () => {
  const { t } = useTranslation('home');

  return (
    <EmptyState
      titleSlot={t('empty.noAgents')}
      descriptionSlot={t('empty.agentsDescription')}
      actionSlot={
        <Button
          variant="ghost"
          render={<a href="https://mastra.ai/docs/agents/overview" target="_blank" rel="noopener noreferrer" />}
          icon={<ExternalLinkIcon />}
        >
          {t('empty.agentsDocumentation')}
        </Button>
      }
      variant="fill"
    />
  );
};
