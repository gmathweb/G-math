export interface BadgeProps {
  icon?: string;
  label: string;
  color?: string;
  bgColor?: string;
}

export default function Badge({
  icon,
  label,
  color = 'var(--tp)',
  bgColor = 'var(--bg2)',
}: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ color, backgroundColor: bgColor }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
}
