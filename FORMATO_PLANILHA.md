# Formato da Planilha para Importação

## Descrição

O sistema RedeX permite a importação em lote de ordens de serviço através de planilhas Excel (.xlsx ou .xls).

## Estrutura da Planilha

A primeira linha deve conter os cabeçalhos das colunas. O sistema aceita variações nos nomes das colunas.

### Colunas Obrigatórias

| Coluna | Variações Aceitas | Tipo | Exemplo |
|--------|-------------------|------|---------|
| numero_os | numero_os, numero os, os, ordem servico | Texto | OS-2024-001 |
| cliente | cliente, nome cliente, nome | Texto | João Silva |
| endereco | endereco, endereço, end | Texto | Rua das Flores, 123 |
| bairro | bairro | Texto | Centro |
| tipo_servico | tipo_servico, tipo servico, tipo serviço, servico | Texto | Ativação |
| data_abertura | data_abertura, data abertura, data | Data | 29/03/2026 |

### Colunas Opcionais

| Coluna | Variações Aceitas | Tipo | Exemplo | Padrão |
|--------|-------------------|------|---------|--------|
| cidade | cidade | Texto | São Paulo | "Não informado" |
| prioridade | prioridade | Texto | Alta | "Normal" |
| status | status | Texto | AC | "AC" |
| prazo | prazo, data prazo | Data | 05/04/2026 | null |

## Valores Permitidos

### tipo_servico
- Ativação
- Construção de rede
- Manutenção
- Preventiva

### prioridade
- Baixa
- Normal
- Alta
- Urgente

### status
- AC
- Falta RFB
- Faturado
- Pend Cliente / Comercial
- Tecnica
- Versionado

## Formatos de Data

O sistema aceita os seguintes formatos de data:
- DD/MM/AAAA (exemplo: 29/03/2026)
- DD-MM-AAAA (exemplo: 29-03-2026)
- AAAA-MM-DD (exemplo: 2026-03-29)
- Números seriais do Excel (são convertidos automaticamente)

## Exemplo de Planilha

| numero_os | cliente | endereco | bairro | cidade | tipo_servico | prioridade | status | data_abertura | prazo |
|-----------|---------|----------|--------|--------|--------------|------------|--------|---------------|-------|
| OS-2024-001 | Carlos Mendes | Rua das Flores, 123 | Centro | São Paulo | Ativação | Alta | AC | 24/03/2026 | 31/03/2026 |
| OS-2024-002 | Fernanda Lima | Av. Paulista, 456 | Bela Vista | São Paulo | Manutenção | Normal | Falta RFB | 26/03/2026 | 03/04/2026 |
| OS-2024-003 | Roberto Santos | Rua XV, 789 | Centro | Curitiba | Construção de rede | Urgente | Pend Cliente / Comercial | 22/03/2026 | 28/03/2026 |

## Como Importar

1. Acesse o sistema RedeX
2. Faça login com suas credenciais
3. No menu lateral, clique em **Importar Planilha**
4. Clique em **Selecionar arquivo** e escolha seu arquivo Excel
5. O sistema mostrará um preview dos dados
6. Verifique se os dados estão corretos
7. Clique em **Confirmar Importação**
8. O sistema processará os dados e mostrará o resultado:
   - Quantidade de registros importados com sucesso
   - Quantidade de erros (se houver)
   - Detalhes dos erros para correção

## Regras de Importação

1. **Ordens duplicadas**: Se um número de OS já existir no sistema, ele será ignorado
2. **Dados inválidos**: Linhas com dados obrigatórios faltando serão rejeitadas
3. **Valores padrão**: Campos opcionais vazios receberão valores padrão
4. **Validação**: O sistema valida todos os dados antes de inserir no banco

## Dicas

- Mantenha os dados organizados e consistentes
- Use os valores exatos para tipo_servico, prioridade e status
- Verifique as datas antes de importar
- Evite caracteres especiais nos números de OS
- Mantenha uma cópia de segurança antes de importações grandes

## Tratamento de Erros

Se houver erros na importação, o sistema mostrará:
- Qual linha teve erro
- Qual foi o problema encontrado
- Sugestão de correção

Você pode corrigir os erros na planilha e tentar importar novamente.

## Exemplo de Arquivo

Você pode criar uma planilha base com os seguintes passos:

1. Abra o Excel ou Google Sheets
2. Crie os cabeçalhos na primeira linha conforme a tabela acima
3. Preencha os dados nas linhas seguintes
4. Salve como arquivo .xlsx
5. Importe no sistema

## Limitações

- Tamanho máximo recomendado: 1000 linhas por importação
- Formatos aceitos: .xlsx, .xls
- Encoding: UTF-8 (para caracteres especiais)

## Suporte

Em caso de dúvidas ou problemas na importação:
1. Verifique se a planilha está no formato correto
2. Confirme se todos os campos obrigatórios estão preenchidos
3. Teste com uma planilha pequena primeiro (5-10 linhas)
4. Verifique os logs de erro para identificar o problema

---

**Nota**: Este sistema foi desenvolvido para fins acadêmicos como parte do curso de Análise e Desenvolvimento de Sistemas.
