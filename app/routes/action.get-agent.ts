import { type LoaderFunctionArgs } from 'react-router';
import { jwtDecode } from 'jwt-decode';

export type Agent = {
  name?: string | undefined;
  picture?: string | undefined;
  email?: string | undefined;
};

const isAuthBypassed =
  process.env.NODE_ENV === 'development' &&
  process.env.DEV_AUTH_BYPASS === 'true';

export async function loader({ request }: LoaderFunctionArgs) {
  const pomeriumJWT = request.headers.get('x-pomerium-jwt-assertion');

  let agent: Agent = {};

  if (typeof pomeriumJWT === 'string') {
    try {
      agent = jwtDecode<Agent>(pomeriumJWT);
    } catch {
      console.warn('Failed to decode Pomerium JWT');
    }
  } else if (isAuthBypassed) {
    agent = {
      email: process.env.DEV_AUTH_EMAIL || 'dev@localhost',
      name: process.env.DEV_AUTH_NAME || 'Development User',
    };
  }

  const { name, picture, email } = agent;

  return {
    name,
    picture,
    email,
  };
}
