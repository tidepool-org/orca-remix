import { type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';
import { apiRequest, apiRoutes } from '~/api.server';
import type {
  Patient,
  Clinician,
  Prescription,
} from '~/components/Clinic/types';

const ExportParamsSchema = z.object({
  type: z.enum(['patients', 'clinicians', 'prescriptions']),
});

const PATIENTS_PAGE_SIZE = 500;

export async function loader({ request, params }: LoaderFunctionArgs) {
  const clinicId = params.clinicId as string;
  const url = new URL(request.url);

  const parseResult = ExportParamsSchema.safeParse({
    type: url.searchParams.get('type') ?? undefined,
  });

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: 'Invalid export parameters. Required: ?type=patients|clinicians',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { type } = parseResult.data;

  try {
    const clinic = (await apiRequest(apiRoutes.clinic.get(clinicId))) as {
      name?: string;
      patientTags?: { id: string; name: string }[];
      sites?: { id: string; name: string }[];
    };

    const clinicName = clinic.name || clinicId;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (type === 'patients') {
      const patients = await fetchAllPatients(clinicId);

      const tagMap = new Map(
        (clinic.patientTags || []).map((t) => [t.id, t.name]),
      );
      const siteMap = new Map((clinic.sites || []).map((s) => [s.id, s.name]));

      const csv = patientsToCSV(patients, tagMap, siteMap);
      const filename = `${sanitizeFilename(clinicName)}-patients-${timestamp}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (type === 'clinicians') {
      const clinicians = await fetchAllClinicians(clinicId);
      const csv = cliniciansToCSV(clinicians);
      const filename = `${sanitizeFilename(clinicName)}-clinicians-${timestamp}.csv`;

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Prescriptions export
    const prescriptions = (await apiRequest(
      apiRoutes.prescription.getClinicPrescriptions(clinicId),
    )) as Prescription[];
    const csv = prescriptionsToCSV(prescriptions || []);
    const filename = `${sanitizeFilename(clinicName)}-prescriptions-${timestamp}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Export failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

async function fetchAllPatients(clinicId: string): Promise<Patient[]> {
  const allPatients: Patient[] = [];
  let offset = 0;

  // First request to get total count
  const firstPage = (await apiRequest(
    apiRoutes.clinic.getPatients(clinicId, {
      limit: PATIENTS_PAGE_SIZE,
      offset: 0,
    }),
  )) as { data: Patient[]; meta?: { count: number } };

  allPatients.push(...(firstPage.data || []));
  const total = firstPage.meta?.count || firstPage.data?.length || 0;
  offset += PATIENTS_PAGE_SIZE;

  // Fetch remaining pages
  while (offset < total) {
    const page = (await apiRequest(
      apiRoutes.clinic.getPatients(clinicId, {
        limit: PATIENTS_PAGE_SIZE,
        offset,
      }),
    )) as { data: Patient[]; meta?: { count: number } };

    allPatients.push(...(page.data || []));
    offset += PATIENTS_PAGE_SIZE;
  }

  return allPatients;
}

async function fetchAllClinicians(clinicId: string): Promise<Clinician[]> {
  const response = (await apiRequest(
    apiRoutes.clinic.getClinicians(clinicId, { limit: 1000 }),
  )) as Array<{
    id?: string;
    inviteId?: string;
    email?: string;
    name?: string;
    roles?: string[];
    createdTime?: string;
    updatedTime?: string;
  }>;

  // Filter out invites (only include actual clinicians)
  return (response || [])
    .filter((record) => record.id && !record.inviteId)
    .map((record) => ({
      id: record.id!,
      email: record.email || '',
      name: record.name || '',
      roles: record.roles || [],
      createdTime: record.createdTime || '',
      updatedTime: record.updatedTime || '',
    }));
}

function patientsToCSV(
  patients: Patient[],
  tagMap: Map<string, string>,
  siteMap: Map<string, string>,
): string {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Birth Date',
    'MRN',
    'Tags',
    'Sites',
    'Added',
  ];

  const rows = patients.map((p) => [
    p.id,
    p.fullName,
    p.email || '',
    p.birthDate || '',
    p.mrn || '',
    (p.tags || []).map((tagId) => tagMap.get(tagId) || tagId).join('; '),
    (p.sites || [])
      .map((s) => {
        const id = s.id || s.name || String(s);
        return siteMap.get(id) || id;
      })
      .join('; '),
    p.createdTime || '',
  ]);

  return toCSV(headers, rows);
}

function cliniciansToCSV(clinicians: Clinician[]): string {
  const headers = ['ID', 'Name', 'Email', 'Roles', 'Added'];

  const rows = clinicians.map((c) => [
    c.id,
    c.name,
    c.email,
    (c.roles || [])
      .map((r) => r.replace('CLINIC_', '').toLowerCase())
      .join('; '),
    c.createdTime || '',
  ]);

  return toCSV(headers, rows);
}

function prescriptionsToCSV(prescriptions: Prescription[]): string {
  const headers = [
    'ID',
    'Patient Name',
    'State',
    'Created',
    'Expires',
    'Patient Email',
    'MRN',
  ];

  const rows = prescriptions.map((p) => {
    const attrs = p.latestRevision?.attributes;
    const name = [attrs?.firstName, attrs?.lastName].filter(Boolean).join(' ');
    return [
      p.id,
      name || '',
      p.state || '',
      p.createdTime || '',
      p.expirationTime || '',
      attrs?.email || '',
      attrs?.mrn || '',
    ];
  });

  return toCSV(headers, rows);
}

function toCSV(headers: string[], rows: string[][]): string {
  const escapeField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const lines = [
    headers.map(escapeField).join(','),
    ...rows.map((row) => row.map(escapeField).join(',')),
  ];

  return lines.join('\n');
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
}
