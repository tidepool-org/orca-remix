import { Theme, useTheme } from 'remix-themes';
import { Image, type ImageProps } from '@heroui/react';

import LightMark from './Orca_Mark_Light.svg';
import DarkMark from './Orca_Mark_Dark.svg';

type OrcaMarkProps = ImageProps & {
  theme?: Theme;
};

export default function OrcaMark(props: OrcaMarkProps) {
  const { theme: themeProp, src: srcProp, ...rest } = props;
  const [theme] = useTheme();
  const currentTheme = themeProp || theme;
  const src = srcProp || (currentTheme === Theme.DARK ? DarkMark : LightMark);

  return <Image removeWrapper src={src} width={32} alt="Orca Logo" {...rest} />;
}
