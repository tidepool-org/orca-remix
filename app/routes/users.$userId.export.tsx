import { type LoaderFunctionArgs } from 'react-router';
import { apiRequestFile, apiRoutes } from '~/api.server';
import { z } from 'zod';

// Schema for validating export query parameters
const ExportParamsSchema = z.object({
  format: z.enum(['json', 'xlsx']).default('xlsx'),
  bgUnits: z.enum(['mmol/L', 'mg/dL']).default('mg/dL'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = params.userId as string;
  const url = new URL(request.url);

  // Validate query parameters
  const parseResult = ExportParamsSchema.safeParse({
    format: url.searchParams.get('format') ?? undefined,
    bgUnits: url.searchParams.get('bgUnits') ?? undefined,
    startDate: url.searchParams.get('startDate') ?? undefined,
    endDate: url.searchParams.get('endDate') ?? undefined,
  });

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid export parameters',
        details: parseResult.error.errors,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const { format, bgUnits, startDate, endDate } = parseResult.data;

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
