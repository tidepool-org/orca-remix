import { Outlet } from 'react-router';
import ErrorStack from '~/components/ErrorStack';

export async function loader() {
  return null;
}

export default function Users() {
  return <Outlet />;
}

export const handle = {
  breadcrumb: { href: '/users', label: 'User Management' },
};

export function ErrorBoundary() {
  return <ErrorStack />;
}
