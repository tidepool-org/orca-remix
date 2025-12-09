import { type LoaderFunctionArgs } from 'react-router';
import { apiRequestFile, apiRoutes } from '~/api.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = params.userId as string;
  const url = new URL(request.url);

  const format = (url.searchParams.get('format') as 'json' | 'xlsx') || 'xlsx';
  const bgUnits =
    (url.searchParams.get('bgUnits') as 'mmol/L' | 'mg/dL') || 'mg/dL';
  const startDate = url.searchParams.get('startDate') || undefined;
  const endDate = url.searchParams.get('endDate') || undefined;

  try {
    const apiResponse = await apiRequestFile(
      apiRoutes.export.getData(userId, {
        format,
        bgUnits,
        startDate,
        endDate,
      }),
    );

    // Get the content type and content disposition from the API response
    const contentType =
      apiResponse.headers.get('Content-Type') ||
      (format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/json');

    const contentDisposition =
      apiResponse.headers.get('Content-Disposition') ||
      `attachment; filename="TidepoolExport.${format}"`;

    // Stream the response body directly
    return new Response(apiResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);

    // Return an error response
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Export failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
