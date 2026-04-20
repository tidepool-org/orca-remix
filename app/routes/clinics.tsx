import { Outlet } from 'react-router';
import ErrorStack from '~/components/ui/ErrorStack';

export const handle = {
  breadcrumb: { href: '/clinics', label: 'Clinic Management' },
};

export async function loader() {
  return null;
}

export default function Clinics() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return <ErrorStack />;
}
