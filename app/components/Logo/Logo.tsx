import { Theme, useTheme } from 'remix-themes';
import LightLogo from './Tidepool_Logo_Light.svg';
import DarkLogo from './Tidepool_Logo_Dark.svg';

import { Image } from '@nextui-org/react';

export default function Logo() {
  const [theme] = useTheme();
  const Logo = theme === Theme.DARK ? DarkLogo : LightLogo;

  return <Image src={Logo} width={200} alt="Tidepool Logo" />;
}
