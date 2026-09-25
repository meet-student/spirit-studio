import { HeaderCreateAction } from '@/components/ui/header-create-action';
import { useCanCreateAgent } from '@/domains/agent-builder/hooks/use-can-create-agent';
import { useLinkComponent } from '@/lib/framework';
import { useTranslation } from 'react-i18next';

/**
 * Renders the "Create agent" CTA in the page header of the agents
 * listing page. Kept here (not in the route handle) because it depends on a
 * hook that resolves auth/feature flags.
 */
export function AgentHeaderCreateAction() {
  const { t } = useTranslation('home');
  const { canCreateAgent } = useCanCreateAgent();
  const { paths } = useLinkComponent();
  const createPath = paths.cmsAgentCreateLink();
  if (!canCreateAgent || !createPath) return null;
  return (
    <HeaderCreateAction href={createPath} tooltip={t('actions.newAgent')}>
      {t('actions.newAgent')}
    </HeaderCreateAction>
  );
}
