import { Outlet } from '@remix-run/react';
import { Link } from '@nextui-org/react';

export async function loader() {
  return null;
}

export default function Users() {
  return <Outlet />;
}

export const handle = {
  breadcrumb: { href: '/users', label: 'User Management' },
};
