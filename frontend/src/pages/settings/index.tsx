import { PageLayout } from '@mastra/playground-ui/components/PageLayout';
import { ThemeToggle } from '@mastra/playground-ui/components/ThemeToggle';
import type { ThemeToggleOption } from '@mastra/playground-ui/components/ThemeToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mastra/playground-ui/components/Select';
import {
  SettingsContainer,
  SettingsDescription,
  SettingsGroup,
  SettingsHeader,
  SettingsLayout,
  SettingsRow,
  SettingsTitle,
} from '@mastra/playground-ui/new/settings';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { StudioConfigForm } from '@/domains/configuration/components/studio-config-form';
import { useStudioConfig } from '@/domains/configuration/context/studio-config-state';
import { navCrumb } from '@/domains/navigation/crumbs';
import { saveRequestLocale } from '@/i18n/request';
import { isLocale, localeLabels, normalizeLocale } from '@/i18n/routing';

const crumbs = [navCrumb('/settings')];

export const StudioSettingsPage = () => {
  const { baseUrl, headers, apiPrefix } = useStudioConfig();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const locale = normalizeLocale(i18n.resolvedLanguage);
  const themeOptions: ThemeToggleOption[] = [
    { value: 'system', label: t('common:theme.system'), icon: <Monitor /> },
    { value: 'light', label: t('common:theme.light'), icon: <Sun /> },
    { value: 'dark', label: t('common:theme.dark'), icon: <Moon /> },
  ];

  const changeLanguage = (nextLocale: string) => {
    if (!isLocale(nextLocale)) return;
    saveRequestLocale(nextLocale);
    void i18n.changeLanguage(nextLocale);
  };

  return (
    <PageLayout variant="fit" breadcrumbs={<PageBreadcrumbs crumbs={crumbs} />}>
      <h1 className="sr-only">{t('title')}</h1>
      <SettingsLayout>
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          <SettingsGroup>
            <SettingsHeader>
              <SettingsTitle>{t('general')}</SettingsTitle>
              <SettingsDescription>{t('storedInBrowser')}</SettingsDescription>
            </SettingsHeader>
            <SettingsContainer>
              <SettingsRow label={t('common:theme.label')} description={t('common:theme.description', { defaultValue: 'Customize the appearance of the studio.' })}>
                <ThemeToggle aria-label={t('common:theme.label')} options={themeOptions} />
              </SettingsRow>
              <SettingsRow label={t('language.label')} description={t('language.description')} htmlFor="studio-language">
                <Select value={locale} onValueChange={changeLanguage}>
                  <SelectTrigger id="studio-language" className="w-40" aria-label={t('language.label')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">{localeLabels.zh}</SelectItem>
                    <SelectItem value="en">{localeLabels.en}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsRow>
            </SettingsContainer>
          </SettingsGroup>

          <SettingsGroup>
            <SettingsHeader>
              <SettingsTitle>{t('connectionTitle')}</SettingsTitle>
              <SettingsDescription>
                {t('common:connection.description')}
              </SettingsDescription>
            </SettingsHeader>
            <StudioConfigForm variant="factory" initialConfig={{ baseUrl, headers, apiPrefix }} />
          </SettingsGroup>
        </div>
      </SettingsLayout>
    </PageLayout>
  );
};
