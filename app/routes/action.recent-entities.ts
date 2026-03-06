import { type LoaderFunctionArgs } from 'react-router';
import isArray from 'lodash/isArray';
import {
  usersSession,
  clinicsSession,
  patientsSession,
  cliniciansSession,
} from '~/sessions.server';
import type {
  RecentClinic,
  RecentClinician,
  RecentPatient,
} from '~/components/Clinic/types';
import type { RecentUser } from '~/components/User/types';

export type RecentEntity = {
  id: string;
  label: string;
  sublabel?: string;
  type: 'clinic' | 'user' | 'patient' | 'clinician';
  href: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const cookie = request.headers.get('Cookie');

  const [usersData, clinicsData, patientsData, cliniciansData] =
    await Promise.all([
      usersSession.getSession(cookie),
      clinicsSession.getSession(cookie),
      patientsSession.getSession(cookie),
      cliniciansSession.getSession(cookie),
    ]);

  const entities: RecentEntity[] = [];

  // Recent clinics
  const recentClinics: RecentClinic[] = isArray(clinicsData.get('clinics'))
    ? clinicsData.get('clinics')
    : [];
  for (const clinic of recentClinics) {
    entities.push({
      id: clinic.id,
      label: clinic.name,
      sublabel: clinic.shareCode,
      type: 'clinic',
      href: `/clinics/${clinic.id}`,
    });
  }

  // Recent users
  const recentUsers: RecentUser[] = isArray(usersData.get('users'))
    ? usersData.get('users')
    : [];
  for (const user of recentUsers) {
    entities.push({
      id: user.userid,
      label: user.fullName || user.username || user.userid,
      sublabel: user.username,
      type: 'user',
      href: `/users/${user.userid}`,
    });
  }

  // Recent patients and clinicians (stored per-clinic)
  for (const clinic of recentClinics) {
    const patients: RecentPatient[] = isArray(
      patientsData.get(`patients-${clinic.id}`),
    )
      ? patientsData.get(`patients-${clinic.id}`)
      : [];
    for (const patient of patients) {
      // Avoid duplicates (a patient could appear in multiple clinics)
      if (!entities.some((e) => e.id === patient.id && e.type === 'patient')) {
        entities.push({
          id: patient.id,
          label: patient.fullName,
          sublabel: patient.email,
          type: 'patient',
          href: `/clinics/${clinic.id}/patients/${patient.id}`,
        });
      }
    }

    let clinicians: RecentClinician[] = [];
    try {
      const raw = cliniciansData.get(`recentClinicians-${clinic.id}`);
      if (raw && typeof raw === 'string') {
        clinicians = JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    for (const clinician of clinicians) {
      if (
        !entities.some((e) => e.id === clinician.id && e.type === 'clinician')
      ) {
        entities.push({
          id: clinician.id,
          label: clinician.name,
          sublabel: clinician.email,
          type: 'clinician',
          href: `/clinics/${clinic.id}/clinicians/${clinician.id}`,
        });
      }
    }
  }

  return Response.json(entities);
}
