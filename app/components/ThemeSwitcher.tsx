import { Theme, useTheme } from 'remix-themes';
import { Sun, MoonStar } from 'lucide-react';
import { Button } from '@heroui/react';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useTheme();
  const Icon = theme === Theme.DARK ? Sun : MoonStar;
  const ariaLabel =
    theme === Theme.DARK ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <Button
      className="bg-transparent text-foreground"
      size="sm"
      isIconOnly
      aria-label={ariaLabel}
      onPress={() =>
        setTheme((prev) => (prev === Theme.DARK ? Theme.LIGHT : Theme.DARK))
      }
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
