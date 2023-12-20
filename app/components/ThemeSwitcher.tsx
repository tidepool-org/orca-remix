import { Theme, useTheme } from 'remix-themes';
import { Sun, Moon } from 'lucide-react';
export default function ThemeSwitcher() {
  const [theme, setTheme] = useTheme();
  const Icon = theme === Theme.DARK ? Sun : Moon;
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
