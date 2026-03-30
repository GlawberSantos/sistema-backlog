# Correções Aplicadas ao Dashboard e Relatórios

## Problema Identificado
Após importar a planilha, o **Dashboard** exibia informações corretamente, mas **Relatório** e **Backlog** não traziam dados da planilha importada.

### Causa Raiz
Havia uma **incompatibilidade completa entre os status utilizados:**
- Status válidos no banco: `AC`, `Falta RFB`, `Faturado`, `Pend Cliente / Comercial`, `Tecnica`
- Status inválidos que as queries procuravam: `Versionado`, `Falta RFB`, `Faturado`, `Pend Cliente / Comercial`, `Técnica`, `Versionado`
- Campo de nomes mapeados incorretamente: queries retornavam campos diferentes do que o frontend esperava

---

## Correções Implementadas

### 1. Backend - `dashboardController.js`

#### Função: `getRelatorioBacklogPorUF()`
**Antes:**
```javascript
COUNT(CASE WHEN os.status = 'Versionado' THEN 1 END) as Versionado,
COUNT(CASE WHEN os.status = 'Falta RFB' THEN 1 END) as falta_rfb,
COUNT(CASE WHEN os.status = 'Faturado' THEN 1 END) as faturado,
COUNT(CASE WHEN os.status = 'Pend Cliente / Comercial' THEN 1 END) as pend_cliente_comercial,
COUNT(CASE WHEN os.status = 'Tecnica' THEN 1 END) as tecnica,
COUNT(CASE WHEN os.status = 'Versionado' THEN 1 END) as versionado,
```

**Depois:**
```javascript
COUNT(CASE WHEN os.status = 'AC' THEN 1 END) as ac,
COUNT(CASE WHEN os.status = 'Falta RFB' THEN 1 END) as em_execucao,
COUNT(CASE WHEN os.status = 'Faturado' THEN 1 END) as pendente_comercial,
COUNT(CASE WHEN os.status = 'Pend Cliente / Comercial' THEN 1 END) as pendente_material,
COUNT(CASE WHEN os.status = 'Tecnica' THEN 1 END) as concluido,
```

#### Função: `getRelatorioBacklogPorRegiao()`
- Aplicadas as mesmas correções de status e nomes de campos

#### Função: `getDashboardStats()`
- Removido `'Versionado'` das cláusulas `NOT IN`
- Substituído por simples `!= 'Tecnica'`

---

### 2. Frontend - `Backlog.jsx`

#### Função: `getStatusColor()`
- Corrigidos todos os status para os valores válidos
- Cores mapeadas corretamente

#### Select de Status
```javascript
<option value="AC">AC</option>
<option value="Falta RFB">Falta RFB</option>
<option value="Faturado">Faturado</option>
<option value="Pend Cliente / Comercial">Pend Cliente / Comercial</option>
<option value="Tecnica">Tecnica</option>
```

---

### 3. Frontend - `DetalhesOrdem.jsx`

#### Função: `getStatusColor()`
- Atualizada com status corretos

#### Select de Status
- Removida opção `"Versionado"` que não é um status válido

---

### 4. Frontend - `NovaOrdem.jsx`

#### Select de Status
- Removida opção `"Versionado"` que não é um status válido

---

## Status Válidos (Conforme FORMATO_PLANILHA.md)
| Status | Descrição |
|--------|-----------|
| `AC` | Ordem aberta, não iniciada |
| `Falta RFB` | Ordem em andamento |
| `Faturado` | Aguardando confirmação comercial |
| `Pend Cliente / Comercial` | Aguardando material/recursos |
| `Tecnica` | Ordem finalizada |

---

## Resultado
✅ Dashboard - Exibe informações corretamente  
✅ Relatório - Agora retorna dados da planilha importada  
✅ Backlog - Agora exibe ordens da planilha importada com filtros funcionais

---

## Como Testar
1. Importar uma planilha com as colunas corretas
2. Acessar Dashboard - dados devem aparecer nos gráficos
3. Acessar Relatórios - dados devem aparecer agrupados por UF/Região
4. Acessar Backlog - ordens devem listar e filtros devem funcionar
