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
      className="bg-transparent text-[color:var(--text-muted)] min-w-[34px] w-[34px] h-[34px]"
      size="sm"
      isIconOnly
      aria-label={ariaLabel}
      onPress={() =>
        setTheme((prev) => (prev === Theme.DARK ? Theme.LIGHT : Theme.DARK))
      }
    >
      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
    </Button>
  );
}
