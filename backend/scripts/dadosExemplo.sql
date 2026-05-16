-- Dados de Exemplo para o Sistema RedeX
-- Execute este script após inicializar o banco de dados

-- Criar usuários de exemplo (senhas: senha123)
INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES
('João Silva', 'joao@redex.com', '$2a$10$YyQZzp7EkGZ5YxJvZ6BZyOX7xqWJZ6gJZWZJZWZJZWZJZWZJZWZJ', 'Supervisor'),
('Maria Santos', 'maria@redex.com', '$2a$10$YyQZzp7EkGZ5YxJvZ6BZyOX7xqWJZ6gJZWZJZWZJZWZJZWZJZWZJ', 'Técnico'),
('Pedro Oliveira', 'pedro@redex.com', '$2a$10$YyQZzp7EkGZ5YxJvZ6BZyOX7xqWJZ6gJZWZJZWZJZWZJZWZJZWZJ', 'Técnico'),
('Ana Costa', 'ana@redex.com', '$2a$10$YyQZzp7EkGZ5YxJvZ6BZyOX7xqWJZ6gJZWZJZWZJZWZJZWZJZWZJ', 'Técnico')
ON CONFLICT (email) DO NOTHING;

-- Criar ordens de serviço de exemplo
INSERT INTO ordens_servico (numero_os, cliente, endereco, bairro, cidade, uf, tipo_servico, prioridade, status, tecnico_responsavel, data_abertura, prazo) VALUES
('OS-2024-001', 'Carlos Mendes', 'Rua das Flores, 123', 'Centro', 'São Paulo', 'SP', 'Ativação', 'Alta', 'Falta RFB', 3, CURRENT_DATE - 5, CURRENT_DATE + 2),
('OS-2024-002', 'Fernanda Lima', 'Av. Paulista, 456', 'Bela Vista', 'São Paulo', 'SP', 'Manutenção', 'Normal', 'AC', 3, CURRENT_DATE - 3, CURRENT_DATE + 5),
('OS-2024-003', 'Roberto Santos', 'Rua XV de Novembro, 789', 'Centro', 'Curitiba', 'PR', 'Construção de rede', 'Urgente', 'Pend Cliente / Comercial', 4, CURRENT_DATE - 7, CURRENT_DATE - 1),
('OS-2024-004', 'Julia Ferreira', 'Rua das Acácias, 321', 'Jardim Botânico', 'Rio de Janeiro', 'RJ', 'Preventiva', 'Baixa', 'AC', 5, CURRENT_DATE - 2, CURRENT_DATE + 10),
('OS-2024-005', 'Marcos Silva', 'Av. Atlântica, 654', 'Copacabana', 'Rio de Janeiro', 'RJ', 'Ativação', 'Alta', 'Falta RFB', 4, CURRENT_DATE - 4, CURRENT_DATE + 1),
('OS-2024-006', 'Patricia Souza', 'Rua da Consolação, 987', 'Consolação', 'São Paulo', 'SP', 'Manutenção', 'Normal', 'Tecnica', 3, CURRENT_DATE - 10, CURRENT_DATE - 2),
('OS-2024-007', 'Ricardo Alves', 'Rua dos Pinheiros, 147', 'Pinheiros', 'São Paulo', 'SP', 'Ativação', 'Normal', 'Faturado', NULL, CURRENT_DATE - 6, CURRENT_DATE + 3),
('OS-2024-008', 'Luciana Costa', 'Av. Faria Lima, 258', 'Itaim Bibi', 'São Paulo', 'SP', 'Construção de rede', 'Alta', 'Falta RFB', 5, CURRENT_DATE - 8, CURRENT_DATE + 7),
('OS-2024-009', 'Gabriel Martins', 'Rua Oscar Freire, 369', 'Jardins', 'São Paulo', 'SP', 'Preventiva', 'Baixa', 'AC', 4, CURRENT_DATE - 1, CURRENT_DATE + 15),
('OS-2024-010', 'Beatriz Rocha', 'Rua Augusta, 741', 'Consolação', 'São Paulo', 'SP', 'Manutenção', 'Urgente', 'Falta RFB', 3, CURRENT_DATE - 9, CURRENT_DATE)
ON CONFLICT (numero_os) DO NOTHING;

-- Adicionar observações de exemplo
INSERT INTO observacoes (ordem_servico_id, usuario_id, observacao) VALUES
(1, 3, 'Cliente contatado, agendamento confirmado para amanhã às 14h.'),
(1, 3, 'Material necessário já foi separado no estoque.'),
(3, 4, 'Aguardando chegada do cabo de fibra óptica. Previsão: 3 dias.'),
(5, 4, 'Instalação iniciada. Cliente solicita roteador Wi-Fi adicional.'),
(6, 3, 'Serviço Tecnica com sucesso. Cliente satisfeito.'),
(8, 5, 'Estrutura de rede montada. Falta configuração dos equipamentos.'),
(10, 3, 'Problema identificado: roteador com defeito. Será substituído.');

-- Verificar dados inseridos
SELECT 'Usuarios cadastrados:' as info, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'Ordens de servico:', COUNT(*) FROM ordens_servico
UNION ALL
SELECT 'Observacoes:', COUNT(*) FROM observacoes;
