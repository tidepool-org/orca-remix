import { type ActionFunctionArgs } from 'react-router';
import { apiRequestFile, apiRoutes } from '~/api.server';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const sourceClinicId = formData.get('sourceClinicId') as string;
  const targetClinicId = formData.get('targetClinicId') as string;

  if (!sourceClinicId || !targetClinicId) {
    return Response.json(
      { error: 'Both source and target clinic IDs are required' },
      { status: 400 },
    );
  }

  try {
    const response = await apiRequestFile(
      apiRoutes.clinic.generateMergeReport(targetClinicId, sourceClinicId),
    );

    // Stream the binary xlsx response back to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="merge-${sourceClinicId}-to-${targetClinicId}-${new Date().toISOString().replace(/:/g, '-')}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating merge report:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate merge report',
      },
      { status: 500 },
    );
  }
}
