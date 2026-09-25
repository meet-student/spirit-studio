import { Card } from '@mastra/playground-ui/components/Card';
import { MainHeader } from '@mastra/playground-ui/components/MainHeader';
import { PageLayout } from '@mastra/playground-ui/components/PageLayout';
import { DatabaseIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { PageBreadcrumbs } from '@/components/ui/page-breadcrumbs';
import { CreateDatasetForm } from '@/domains/datasets/components/create-dataset-form';
import { isDatasetTargetType } from '@/domains/datasets/components/target-type-options';
import { navCrumb } from '@/domains/navigation/crumbs';

function CreateDatasetPage() {
  const { t } = useTranslation('home');
  const crumbs = [navCrumb('/datasets'), { id: 'dataset-new', label: t('createDataset.title') }];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const targetTypeParam = searchParams.get('targetType');
  const targetType = isDatasetTargetType(targetTypeParam) ? targetTypeParam : undefined;
  const targetIdsParam = searchParams.get('targetIds');
  const targetIds =
    targetType && targetIdsParam
      ? targetIdsParam
          .split(',')
          .map(id => id.trim())
          .filter(Boolean)
      : undefined;

  const handleSuccess = (datasetId: string) => {
    void navigate(`/datasets/${datasetId}`);
  };

  return (
    <PageLayout breadcrumbs={<PageBreadcrumbs crumbs={crumbs} />}>
      <h1 className="sr-only">{t('createDataset.title')}</h1>
      <div />
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-2xl overflow-y-auto px-4 py-5">
          <MainHeader className="mb-6 p-0">
            <MainHeader.Column>
              <MainHeader.Title>
                <DatabaseIcon /> {t('createDataset.title')}
              </MainHeader.Title>
              <MainHeader.Description>
                {t('createDataset.description')}
              </MainHeader.Description>
            </MainHeader.Column>
          </MainHeader>
          <Card className="p-4">
            <CreateDatasetForm
              targetType={targetType}
              targetIds={targetIds}
              onSuccess={handleSuccess}
              onCancel={() => void navigate(-1)}
            />
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

export { CreateDatasetPage };
export default CreateDatasetPage;
