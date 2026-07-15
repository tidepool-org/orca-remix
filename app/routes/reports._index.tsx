import { useState } from 'react';
import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { useLoaderData } from 'react-router';
import isArray from 'lodash/isArray';

import ClinicMergeReportSection from '~/components/Reports/ClinicMergeReportSection';
import { useToast } from '~/contexts/ToastContext';
import { clinicsSession } from '~/sessions.server';
import type { RecentClinic } from '~/components/Clinic/types';

export const meta: MetaFunction = () => {
  return [
    { title: 'Reports | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Reports Dashboard' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { getSession } = clinicsSession;
  const session = await getSession(request.headers.get('Cookie'));
  const recentClinics: RecentClinic[] = isArray(session.get('clinics'))
    ? session.get('clinics')
    : [];
  return { recentClinics };
}

export default function ReportsIndex() {
  const { recentClinics } = useLoaderData<typeof loader>();
  const { showToast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateMergeReport = async (
    sourceClinicId: string,
    targetClinicId: string,
  ) => {
    setIsGeneratingReport(true);

    try {
      const formData = new FormData();
      formData.append('sourceClinicId', sourceClinicId);
      formData.append('targetClinicId', targetClinicId);

      const response = await fetch('/reports/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate merge report');
      }

      // Download the binary xlsx response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merge-${sourceClinicId}-to-${targetClinicId}-${new Date().toISOString().replace(/:/g, '-')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Merge report downloaded', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate merge report';
      showToast(message, 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <ClinicMergeReportSection
        onGenerateReport={handleGenerateMergeReport}
        isLoading={isGeneratingReport}
        recentClinics={recentClinics}
      />
    </div>
  );
}
