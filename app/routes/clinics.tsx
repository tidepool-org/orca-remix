import { Outlet } from '@remix-run/react';
import { Link } from '@nextui-org/react';

export async function loader() {
  return null;
}

export default function Clinics() {
  return <Outlet />;
}

export const handle = {
  breadcrumb: { href: '/clinics', label: 'Clinic Management' },
};
