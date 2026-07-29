import { type MetaFunction } from 'react-router';
import { Outlet } from 'react-router';

export const meta: MetaFunction = () => {
  return [
    { title: 'Reports | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Reports' },
  ];
};

export const handle = {
  breadcrumb: { href: '/reports', label: 'Reports' },
};

export default function Reports() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[color:var(--text-faint)]">
          Administration
        </p>
        <h1 className="text-2xl font-bold text-[color:var(--text-heading)]">
          Reports
        </h1>
        <p className="text-sm text-[color:var(--text-muted)] mt-1">
          Generate reports for clinic analysis and administration.
        </p>
      </div>
      <Outlet />
    </div>
  );
}
