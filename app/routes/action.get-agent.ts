import { LoaderFunctionArgs, json } from '@remix-run/node';
import { jwtDecode } from 'jwt-decode';

export type Agent = {
  name?: string | undefined;
  picture?: string | undefined;
  email?: string | undefined;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const pomeriumJWT = request.headers.get('x-pomerium-jwt-assertion');

  const { name, picture, email }: Agent =
    typeof pomeriumJWT === 'string' ? jwtDecode(pomeriumJWT) : {};

  return json({
    name,
    picture,
    email,
  });
}
