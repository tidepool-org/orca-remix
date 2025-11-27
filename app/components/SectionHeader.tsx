import { type LucideIcon } from 'lucide-react';

type SectionHeaderProps = {
  icon: LucideIcon;
  title: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
};

export default function SectionHeader({
  icon: Icon,
  title,
  as: Heading = 'h2',
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <Icon className="w-5 h-5" aria-hidden="true" />
      <Heading className="text-lg font-semibold">{title}</Heading>
    </div>
  );
}
