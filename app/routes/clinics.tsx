import { Outlet } from 'react-router';
import ErrorStack from '~/components/ErrorStack';

export async function loader() {
  return null;
}

export default function Clinics() {
  return <Outlet />;
}

export const handle = {
  breadcrumb: { href: '/clinics', label: 'Clinic Management' },
};

export function ErrorBoundary() {
  return <ErrorStack />;
}
