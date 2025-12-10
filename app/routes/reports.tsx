import { type MetaFunction } from 'react-router';
import { Outlet } from 'react-router';
import Well from '~/partials/Well';

export const meta: MetaFunction = () => {
  return [
    { title: 'Reports | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Reports' },
  ];
};

export default function Reports() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Well>
        <h1 className="text-xl font-semibold mb-2">Reports</h1>
        <p className="text-default-500">
          Generate reports for clinic analysis and administration.
        </p>
      </Well>
      <Outlet />
    </div>
  );
}

export const handle = {
  breadcrumb: { href: '/reports', label: 'Reports' },
};
