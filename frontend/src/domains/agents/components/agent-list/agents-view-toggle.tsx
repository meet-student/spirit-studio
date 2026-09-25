import { Button } from '@mastra/playground-ui/components/Button';
import { ButtonsGroup } from '@mastra/playground-ui/components/ButtonsGroup';
import { Columns2, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type AgentsView = 'compact' | 'list';

export interface AgentsViewToggleProps {
  view: AgentsView;
  onViewChange: (view: AgentsView) => void;
}

export function AgentsViewToggle({ view, onViewChange }: AgentsViewToggleProps) {
  const { t } = useTranslation('home');

  return (
    <ButtonsGroup aria-label={t('views.agents')}>
      <Button
        type="button"
        variant={view === 'list' ? 'default' : 'ghost'}
        size="icon-md"
        tooltip={t('views.list')}
        aria-pressed={view === 'list'}
        onClick={() => onViewChange('list')}
      >
        <List />
      </Button>
      <Button
        type="button"
        variant={view === 'compact' ? 'default' : 'ghost'}
        size="icon-md"
        tooltip={t('views.compact')}
        aria-pressed={view === 'compact'}
        onClick={() => onViewChange('compact')}
      >
        <Columns2 />
      </Button>
    </ButtonsGroup>
  );
}
