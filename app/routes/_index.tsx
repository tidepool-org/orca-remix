import type { MetaFunction, LoaderFunctionArgs } from '@remix-run/node';

export const meta: MetaFunction = () => {
  return [
    { title: 'Tidepool ORCA' },
    { name: 'description', content: 'Welcome to Tidepool ORCA!' },
  ];
};

// export const loader = async ({ request }: LoaderFunctionArgs) => {
//   return {
//     theme: getTheme(),
//   };
// };

export default function Index() {
  return <div>Default content here</div>;
}
