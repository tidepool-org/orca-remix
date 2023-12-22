import { Theme, useTheme } from 'remix-themes';
import LightLogo from './Tidepool_Logo_Light.svg';
import DarkLogo from './Tidepool_Logo_Dark.svg';

import type { ImageProps } from '@nextui-org/react';
import { Image } from '@nextui-org/react';

type LogoProps = ImageProps & {
  theme?: Theme;
};

export default function Logo(props: LogoProps) {
  const { theme: themeProp, src: srcProp, ...rest } = props;
  const [theme] = useTheme();
  const currentTheme = themeProp || theme;
  const src = srcProp || (currentTheme === Theme.DARK ? DarkLogo : LightLogo);

  return (
    <Image removeWrapper src={src} width={200} alt="Tidepool Logo" {...rest} />
  );
}
