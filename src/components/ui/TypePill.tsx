// src/components/ui/TypePill.tsx
type TypePillProps = {
  tipo: string;
};

const classByTipo: Record<string, string> = {
  Construção: 'type-construcao',
  Ativação: 'type-ativacao',
  Vistoria: 'type-alteracao',
};

export const TypePill: React.FC<TypePillProps> = ({ tipo }) => {
  const cls = classByTipo[tipo] || 'type-construcao';
  return <span className={`type-pill ${cls}`}>{tipo}</span>;
};
