import { Outlet } from 'react-router';
import ErrorStack from '~/components/ErrorStack';

export const handle = {
  breadcrumb: { href: '/users', label: 'User Management' },
};

export async function loader() {
  return null;
}

export default function Users() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return <ErrorStack />;
}
