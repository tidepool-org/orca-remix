import { Theme, useTheme } from 'remix-themes';
import { Sun, MoonStar } from 'lucide-react';
export default function ThemeSwitcher() {
  const [theme, setTheme] = useTheme();
  const Icon = theme === Theme.DARK ? Sun : MoonStar;
  return (
    <button
      type="button"
      onClick={() =>
        setTheme((prev) => (prev === Theme.DARK ? Theme.LIGHT : Theme.DARK))
      }
    >
      <Icon />
    </button>
  );
}
