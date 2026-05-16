// src/components/ui/KpiCard.tsx
type KpiCardProps = {
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'cyan' | 'purple';
  icon?: string;
};

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, color, icon }) => {
  return (
    <div className={`kpi-card kpi-tone-${color}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {icon && <div className="kpi-icon">{icon}</div>}
    </div>
  );
};