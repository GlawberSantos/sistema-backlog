// src/components/ui/Badge.tsx
import React from 'react';

type BadgeProps = {
  status: string;
  children: React.ReactNode;
};

const classByStatus: Record<string, string> = {
  Disponível: 'badge-disponivel',
  'Em Andamento': 'badge-andamento',
  'Em Execução': 'badge-andamento',
  Pendente: 'badge-pendente',
  'Pendente Agendamento': 'badge-pendente',
  Cancelado: 'badge-cancelado',
  Concluído: 'badge-concluido',
  Concluída: 'badge-concluido',
  'Não Concluído': 'badge-cancelado',
  'Não Concluída': 'badge-cancelado',
  Planejado: 'badge-planejado',
  Ativo: 'badge-ativo',
  Inativo: 'badge-inativo',
};

export const Badge: React.FC<BadgeProps> = ({ status, children }) => {
  const cls = classByStatus[status] || 'badge-pendente';
  return <span className={`badge ${cls}`}>{children}</span>;
};
