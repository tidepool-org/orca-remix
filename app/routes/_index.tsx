import type { MetaFunction } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Tidepool ORCA' },
    { name: 'description', content: 'Welcome to Tidepool ORCA!' },
  ];
};

export default function Index() {
  return <div>Default content here</div>;
}
