import { Theme, useTheme } from 'remix-themes';
import { Image, type ImageProps } from '@heroui/react';

import LightLogo from './Tidepool_Logo_Light.svg';
import DarkLogo from './Tidepool_Logo_Dark.svg';

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
