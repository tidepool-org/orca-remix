import { useState, useEffect } from 'react';
import { type MetaFunction, type ActionFunctionArgs } from 'react-router';
import { useActionData, useNavigation, useSubmit } from 'react-router';

import Well from '~/partials/Well';
import ClinicReportSection from '~/components/Reports/ClinicReportSection';
import ClinicMergeReportSection from '~/components/Reports/ClinicMergeReportSection';
import { apiRequest, apiRoutes } from '~/api.server';
import { useToast } from '~/contexts/ToastContext';

// Action response types
type ActionSuccess = {
  success: true;
  actionType: string;
  data?: unknown;
  count?: number;
};

type ActionError = {
  success: false;
  error: string;
};

type ActionResponse = ActionSuccess | ActionError;

// Merge report data type
type MergeReportData = {
  sourceClinic: { id?: string; name?: string; [key: string]: unknown };
  targetClinic: { id?: string; name?: string; [key: string]: unknown };
  sourcePatients: { data?: unknown[] } | unknown[];
  targetPatients: { data?: unknown[] } | unknown[];
  sourceClinicians: unknown[];
  targetClinicians: unknown[];
};

export const meta: MetaFunction = () => {
  return [
    { title: 'Reports | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Reports Dashboard' },
  ];
};

// Clinician type from API
type Clinician = {
  id?: string;
  clinicId?: string;
  clinicName?: string;
  userId?: string;
  name?: string;
  email?: string;
  roles?: string[];
  createdTime?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;

  if (actionType === 'generateClinicReport') {
    try {
      const createdFrom = formData.get('createdFrom') as string | null;
      const createdTo = formData.get('createdTo') as string | null;
      const ignoredUsernames = formData.get('ignoredUsernames') as
        | string
        | null;

      // Fetch all clinicians from the API
      const cliniciansResponse = await apiRequest<Clinician[]>(
        apiRoutes.clinic.getAllClinicians({
          limit: 10000, // Get all clinicians
          createdFrom: createdFrom || undefined,
          createdTo: createdTo || undefined,
        }),
      );

      let clinicians = Array.isArray(cliniciansResponse)
        ? cliniciansResponse
        : [];

      // Filter out ignored usernames if provided
      if (ignoredUsernames) {
        const ignored = ignoredUsernames
          .split(',')
          .map((u) => u.trim().toLowerCase())
          .filter(Boolean);

        clinicians = clinicians.filter(
          (c) => !ignored.includes((c.email || '').toLowerCase()),
        );
      }

      // Return the data for client-side Excel generation
      return Response.json({
        success: true,
        actionType: 'generateClinicReport',
        data: clinicians,
        count: clinicians.length,
      });
    } catch (error) {
      console.error('Error generating clinic report:', error);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate clinic report',
        },
        { status: 500 },
      );
    }
  }

  if (actionType === 'generateMergeReport') {
    try {
      const sourceClinicId = formData.get('sourceClinicId') as string;
      const targetClinicId = formData.get('targetClinicId') as string;

      if (!sourceClinicId || !targetClinicId) {
        return Response.json(
          {
            success: false,
            error: 'Both source and target clinic IDs are required',
          },
          { status: 400 },
        );
      }

      // Fetch both clinics' data for the report
      const [
        sourceClinic,
        targetClinic,
        sourcePatients,
        targetPatients,
        sourceClinicians,
        targetClinicians,
      ] = await Promise.all([
        apiRequest(apiRoutes.clinic.get(sourceClinicId)),
        apiRequest(apiRoutes.clinic.get(targetClinicId)),
        apiRequest(
          apiRoutes.clinic.getPatients(sourceClinicId, { limit: 1000 }),
        ),
        apiRequest(
          apiRoutes.clinic.getPatients(targetClinicId, { limit: 1000 }),
        ),
        apiRequest(
          apiRoutes.clinic.getClinicians(sourceClinicId, { limit: 1000 }),
        ),
        apiRequest(
          apiRoutes.clinic.getClinicians(targetClinicId, { limit: 1000 }),
        ),
      ]);

      // Return the data for client-side report generation
      return Response.json({
        success: true,
        actionType: 'generateMergeReport',
        data: {
          sourceClinic,
          targetClinic,
          sourcePatients,
          targetPatients,
          sourceClinicians,
          targetClinicians,
        },
      });
    } catch (error) {
      console.error('Error generating merge report:', error);
      return Response.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate merge report',
        },
        { status: 500 },
      );
    }
  }

  return Response.json(
    { success: false, error: 'Unknown action' },
    { status: 400 },
  );
}

export default function ReportsIndex() {
  const actionData = useActionData<ActionResponse>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const { showToast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const isSubmitting = navigation.state === 'submitting';

  // Handle action results
  useEffect(() => {
    if (actionData) {
      if ('error' in actionData && actionData.error) {
        showToast(actionData.error, 'error');
        setIsGeneratingReport(false);
      } else if ('success' in actionData && actionData.success) {
        const successData = actionData as ActionSuccess;
        if (
          successData.actionType === 'generateClinicReport' &&
          successData.data
        ) {
          generateExcelReport(successData.data as Clinician[]);
          showToast(
            `Report generated with ${successData.count} records`,
            'success',
          );
        } else if (
          successData.actionType === 'generateMergeReport' &&
          successData.data
        ) {
          generateMergeExcelReport(successData.data as MergeReportData);
          showToast('Merge report generated', 'success');
        }
        setIsGeneratingReport(false);
      }
    }
  }, [actionData, showToast]);

  // Generate Excel report (client-side)
  const generateExcelReport = (clinicians: Clinician[]) => {
    // Create CSV content (simple approach without external library)
    const headers = [
      'User ID',
      'Email',
      'Name',
      'Clinic ID',
      'Clinic Name',
      'Role',
      'Created Time',
    ];

    const rows = clinicians.map((c) => [
      c.userId || '',
      c.email || '',
      c.name || '',
      c.clinicId || '',
      c.clinicName || '',
      (c.roles || []).join(', '),
      c.createdTime || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    // Download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinic-users-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate Merge Report (client-side)
  const generateMergeExcelReport = (data: MergeReportData) => {
    const sourcePatientsList = Array.isArray(data.sourcePatients)
      ? data.sourcePatients
      : (data.sourcePatients as { data?: unknown[] })?.data || [];
    const targetPatientsList = Array.isArray(data.targetPatients)
      ? data.targetPatients
      : (data.targetPatients as { data?: unknown[] })?.data || [];

    const reportContent = [
      '=== CLINIC MERGE ANALYSIS REPORT ===',
      '',
      'Generated: ' + new Date().toISOString(),
      '',
      '--- SOURCE CLINIC ---',
      `ID: ${data.sourceClinic?.id || 'N/A'}`,
      `Name: ${data.sourceClinic?.name || 'N/A'}`,
      `Patient Count: ${sourcePatientsList.length}`,
      `Clinician Count: ${data.sourceClinicians?.length || 0}`,
      '',
      '--- TARGET CLINIC ---',
      `ID: ${data.targetClinic?.id || 'N/A'}`,
      `Name: ${data.targetClinic?.name || 'N/A'}`,
      `Patient Count: ${targetPatientsList.length}`,
      `Clinician Count: ${data.targetClinicians?.length || 0}`,
      '',
      '--- MERGE SUMMARY ---',
      `Patients to transfer: ${sourcePatientsList.length}`,
      `Clinicians to transfer: ${data.sourceClinicians?.length || 0}`,
      `Total patients after merge: ${sourcePatientsList.length + targetPatientsList.length}`,
      '',
      '=== END OF REPORT ===',
    ].join('\n');

    // Download the file
    const blob = new Blob([reportContent], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinic-merge-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateClinicReport = async (options: {
    createdFrom?: string;
    createdTo?: string;
    ignoredUsernames?: string[];
  }) => {
    setIsGeneratingReport(true);
    const formData = new FormData();
    formData.append('actionType', 'generateClinicReport');
    if (options.createdFrom) {
      formData.append('createdFrom', options.createdFrom);
    }
    if (options.createdTo) {
      formData.append('createdTo', options.createdTo);
    }
    if (options.ignoredUsernames && options.ignoredUsernames.length > 0) {
      formData.append('ignoredUsernames', options.ignoredUsernames.join(','));
    }
    submit(formData, { method: 'post' });
  };

  const handleGenerateMergeReport = async (
    sourceClinicId: string,
    targetClinicId: string,
  ) => {
    setIsGeneratingReport(true);
    const formData = new FormData();
    formData.append('actionType', 'generateMergeReport');
    formData.append('sourceClinicId', sourceClinicId);
    formData.append('targetClinicId', targetClinicId);
    submit(formData, { method: 'post' });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <Well>
        <ClinicReportSection
          onGenerateReport={handleGenerateClinicReport}
          isLoading={isSubmitting || isGeneratingReport}
        />
      </Well>

      <Well>
        <ClinicMergeReportSection
          onGenerateReport={handleGenerateMergeReport}
          isLoading={isSubmitting || isGeneratingReport}
        />
      </Well>
    </div>
  );
}
