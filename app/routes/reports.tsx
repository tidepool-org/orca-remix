import { type MetaFunction } from 'react-router';
import { Outlet } from 'react-router';
import SectionPanel from '~/components/ui/SectionPanel';

export const meta: MetaFunction = () => {
  return [
    { title: 'Reports | Tidepool ORCA' },
    { name: 'description', content: 'Tidepool ORCA Reports' },
  ];
};

export default function Reports() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <SectionPanel
        title="Reports"
        subtitle="Generate reports for clinic analysis and administration."
      />
      <Outlet />
    </div>
  );
}

export const handle = {
  breadcrumb: { href: '/reports', label: 'Reports' },
};
