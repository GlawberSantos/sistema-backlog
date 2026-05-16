/**
 * exportDashboardExcel.ts
 *
 * Gera um .xlsx com tabelas dinâmicas reais (OOXML PivotTable) usando JSZip.
 * Cada aba de resumo já vem pronta como Pivot Table nativa do Excel.
 *
 * Estrutura do arquivo:
 *  - Base         → tabela estruturada com todos os dados brutos (tblBase)
 *  - KPIs         → valores consolidados
 *  - Status OK    → PivotTable: TarefaAtualDraft × UF, filtro Classificacao_rede=REDE OK
 *  - Status Pend. → PivotTable: TarefaAtualDraft × UF, filtro Classificacao_rede=REDE PENDENTE
 *  - Backlog PCC  → PivotTable: Classificacao_rede × UF, filtro Carteira=PCC
 *  - Aging PCC    → PivotTable: Classificacao_rede × faixas Dias_CarteiraAtual, filtro Carteira=PCC
 *  - Total UF     → PivotTable: UF × Classificacao_rede (total geral)
 */

type Row = Record<string, string | number | null | undefined>;

// ── Helpers OOXML ─────────────────────────────────────────────────────────────

function escXml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Converte coluna 0-based para letra A, B, ..., Z, AA, AB...
function colLetter(n: number): string {
  let s = '';
  n++;
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function cellRef(col: number, row: number): string {
  return `${colLetter(col)}${row}`;
}

// Monta uma worksheet de dados simples (sem pivot) como XML OOXML
// Retorna { sheetXml, strings } onde strings é array de shared strings usadas
function buildDataSheet(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  tableName: string,
  tableDisplayName: string,
): { sheetXml: string; sharedStrings: string[] } {
  const sharedStrings: string[] = [];
  const ssMap = new Map<string, number>();

  function ss(v: string): number {
    if (!ssMap.has(v)) { ssMap.set(v, sharedStrings.length); sharedStrings.push(v); }
    return ssMap.get(v)!;
  }

  const totalRows = rows.length + 1; // +1 header
  const totalCols = headers.length;
  const tableRef = `A1:${cellRef(totalCols - 1, totalRows)}`;

  let rowsXml = '';

  // Header row
  let hCells = '';
  headers.forEach((h, ci) => {
    hCells += `<c r="${cellRef(ci, 1)}" t="s"><v>${ss(h)}</v></c>`;
  });
  rowsXml += `<row r="1">${hCells}</row>`;

  // Data rows
  rows.forEach((row, ri) => {
    let cells = '';
    row.forEach((val, ci) => {
      const r = cellRef(ci, ri + 2);
      if (val === null || val === undefined || val === '') {
        cells += `<c r="${r}" t="s"><v>${ss('')}</v></c>`;
      } else if (typeof val === 'number') {
        cells += `<c r="${r}"><v>${val}</v></c>`;
      } else {
        cells += `<c r="${r}" t="s"><v>${ss(String(val))}</v></c>`;
      }
    });
    rowsXml += `<row r="${ri + 2}">${cells}</row>`;
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${rowsXml}</sheetData>
  <tableParts count="1"><tablePart r:id="rId1"/></tableParts>
</worksheet>`;

  const tableXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
       id="1" name="${escXml(tableName)}" displayName="${escXml(tableDisplayName)}" ref="${tableRef}" totalsRowShown="0">
  <autoFilter ref="${tableRef}"/>
  <tableColumns count="${totalCols}">
    ${headers.map((h, i) => `<tableColumn id="${i + 1}" name="${escXml(h)}"/>`).join('')}
  </tableColumns>
  <tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>
</table>`;

  return { sheetXml: sheetXml + '|||TABLE|||' + tableXml, sharedStrings };
}

// ── Pivot Table XML ───────────────────────────────────────────────────────────
// Gera o XML de uma PivotTable OOXML conectada à tblBase
// rowField: campo para linhas, colField: campo para colunas, valueField: campo contado
// pageFilters: [{ field, value }] — filtros de página (slicer de página)

function buildPivotSheet(opts: {
  pivotId: number;
  cacheId: number;
  rowField: string;
  colField: string;
  pageFilters: { field: string; value: string }[];
  title: string;
}): string {
  // A pivot sheet começa vazia — o Excel preenche ao abrir
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData/>
  <pivotTableDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    name="${escXml(opts.title)}" cacheId="${opts.cacheId}" dataOnRows="0"
    applyNumberFormats="0" applyBorderFormats="0" applyFontFormats="0"
    applyPatternFormats="0" applyAlignmentFormats="0" applyWidthHeightFormats="1"
    dataCaption="Valores" updatedVersion="6" minRefreshableVersion="3"
    useAutoFormatting="1" itemPrintTitles="1" createdVersion="6"
    indent="2" outline="1" outlineData="1" compact="1" compactData="1">
    <location ref="A3" firstHeaderRow="1" firstDataRow="2" firstDataCol="1"/>
    <pivotFields count="placeholder"/>
    <rowFields count="1"><field x="0"/></rowFields>
    <colFields count="1"><field x="1"/></colFields>
    <dataFields count="1">
      <dataField name="Contagem" fld="2" subtotal="count" showDataAs="normal"/>
    </dataFields>
  </pivotTableDefinition>
</worksheet>`;
}

// ── Pivot Cache XML ───────────────────────────────────────────────────────────
function buildPivotCacheDefinition(cacheId: number, fields: string[], baseSheetName: string, totalRows: number, totalCols: number): string {
  const rangeRef = `'${escXml(baseSheetName)}'!$A$1:${colLetter(totalCols - 1)}$${totalRows + 1}`;
  const fieldsXml = fields.map(f =>
    `<cacheField name="${escXml(f)}" numFmtId="0"><sharedItems count="0"/></cacheField>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<pivotCacheDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
                      xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                      r:id="rId1" refreshOnLoad="1" createdVersion="6" minRefreshableVersion="3" recordCount="0">
  <cacheSource type="worksheet">
    <worksheetSource ref="${rangeRef}"/>
  </cacheSource>
  <cacheFields count="${fields.length}">${fieldsXml}</cacheFields>
</pivotCacheDefinition>`;
}

function buildPivotCacheRecords(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<pivotCacheRecords xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="0"/>`;
}

// ── KPI Sheet simples ─────────────────────────────────────────────────────────
function buildKpiSheet(kpis: { label: string; value: number | string }[], now: string): { sheetXml: string; sharedStrings: string[] } {
  const ss: string[] = [];
  const ssMap = new Map<string, number>();
  const getSS = (v: string) => {
    if (!ssMap.has(v)) { ssMap.set(v, ss.length); ss.push(v); }
    return ssMap.get(v)!;
  };

  let rowsXml = `<row r="1"><c r="A1" t="s"><v>${getSS('SMRA — Dashboard')}</v></c><c r="B1" t="s"><v>${getSS(now)}</v></c></row>`;
  rowsXml += `<row r="2"><c r="A2" t="s"><v>${getSS('Indicador')}</v></c><c r="B2" t="s"><v>${getSS('Valor')}</v></c></row>`;
  kpis.forEach((k, i) => {
    const row = i + 3;
    const valCell = typeof k.value === 'number'
      ? `<c r="B${row}"><v>${k.value}</v></c>`
      : `<c r="B${row}" t="s"><v>${getSS(String(k.value))}</v></c>`;
    rowsXml += `<row r="${row}"><c r="A${row}" t="s"><v>${getSS(k.label)}</v></c>${valCell}</row>`;
  });

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;

  return { sheetXml, sharedStrings: ss };
}

// ── Montagem final do XLSX ────────────────────────────────────────────────────

export async function exportDashboardExcel(params: {
  data: Row[];
  stats: {
    total: number; redeOk: number; redePend: number;
    pcc: number; pccOk: number; pccPend: number;
  };
  filename: string;
}) {
  const JSZip = (await import('jszip')).default;

  const { data, stats, filename } = params;

  // ── 1. Preparar dados base ────────────────────────────────────────────────
  const BASE_COLS = [
    'UF', 'Carteira', 'Classificacao_rede', 'TarefaAtualDraft',
    'Dias_CarteiraAtual', 'Status', 'Tipo', 'Cliente', 'Cidade',
    'Pedido', 'ID', 'Data de Abertura', 'Prazo',
  ];

  // Garante que Dias_CarteiraAtual seja número e adiciona faixa de aging
  const baseRows = data.map(d => {
    const dias = parseInt(String(d.Dias_CarteiraAtual ?? '0')) || 0;
    let faixa = '0-15';
    if (dias > 60) faixa = '>60';
    else if (dias > 45) faixa = '46-60';
    else if (dias > 15) faixa = '16-45';

    return BASE_COLS.map(col => {
      if (col === 'Dias_CarteiraAtual') return dias;
      return d[col] ?? '';
    }).concat([faixa]) as (string | number)[];
  });

  const allCols = [...BASE_COLS, 'Faixa_Aging'];

  // ── 2. Gerar XML da aba Base ──────────────────────────────────────────────
  const { sheetXml: baseSheetRaw, sharedStrings: baseSS } =
    buildDataSheet(allCols, baseRows, 'tblBase', 'tblBase');

  const [baseSheetXml, baseTableXml] = baseSheetRaw.split('|||TABLE|||');

  // ── 3. KPIs ───────────────────────────────────────────────────────────────
  const now = new Date().toLocaleString('pt-BR');
  const { sheetXml: kpiSheetXml, sharedStrings: kpiSS } = buildKpiSheet([
    { label: 'Total Backlog',  value: stats.total },
    { label: 'Rede OK',        value: stats.redeOk },
    { label: 'Rede Pendente',  value: stats.redePend },
    { label: 'PCC Total',      value: stats.pcc },
    { label: 'PCC OK',         value: stats.pccOk },
    { label: 'PCC Pendente',   value: stats.pccPend },
  ], now);

  // ── 4. Definições de Pivot ────────────────────────────────────────────────
  // Pivot Cache compartilhada (todas as pivots usam tblBase)
  const totalDataRows = data.length;
  const totalDataCols = allCols.length;

  const cacheDefXml = buildPivotCacheDefinition(1, allCols, 'Base', totalDataRows, totalDataCols);
  const cacheRecXml = buildPivotCacheRecords();

  // Definições inline de pivot tables por aba
  const pivotDefs = [
    {
      sheetName: 'Status Rede OK',
      pivotXml: buildPivotTableXml({
        name: 'pvStatusOK',
        rowField: 'TarefaAtualDraft',
        colField: 'UF',
        valueField: 'ID',
        pageFilters: [{ field: 'Classificacao_rede', value: 'REDE OK' }],
        fields: allCols,
      }),
    },
    {
      sheetName: 'Status Rede Pendente',
      pivotXml: buildPivotTableXml({
        name: 'pvStatusPend',
        rowField: 'TarefaAtualDraft',
        colField: 'UF',
        valueField: 'ID',
        pageFilters: [{ field: 'Classificacao_rede', value: 'REDE PENDENTE' }],
        fields: allCols,
      }),
    },
    {
      sheetName: 'Backlog PCC',
      pivotXml: buildPivotTableXml({
        name: 'pvBacklogPCC',
        rowField: 'Classificacao_rede',
        colField: 'UF',
        valueField: 'ID',
        pageFilters: [{ field: 'Carteira', value: 'PCC' }],
        fields: allCols,
      }),
    },
    {
      sheetName: 'Aging PCC',
      pivotXml: buildPivotTableXml({
        name: 'pvAgingPCC',
        rowField: 'Classificacao_rede',
        colField: 'Faixa_Aging',
        valueField: 'ID',
        pageFilters: [{ field: 'Carteira', value: 'PCC' }],
        fields: allCols,
      }),
    },
    {
      sheetName: 'Total por UF',
      pivotXml: buildPivotTableXml({
        name: 'pvTotalUF',
        rowField: 'UF',
        colField: 'Classificacao_rede',
        valueField: 'ID',
        pageFilters: [],
        fields: allCols,
      }),
    },
  ];

  // ── 5. Montar ZIP (XLSX) ──────────────────────────────────────────────────
  const zip = new JSZip();

  // Todas as shared strings (Base + KPI)
  const allSS = [...baseSS, ...kpiSS.filter(s => !baseSS.includes(s))];
  const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${allSS.length}" uniqueCount="${allSS.length}">
  ${allSS.map(s => `<si><t xml:space="preserve">${escXml(s)}</t></si>`).join('')}
</sst>`;

  // Sheets: Base=1, KPIs=2, pivots=3..N
  const sheetCount = 2 + pivotDefs.length;
  const sheets: { name: string; rid: number }[] = [
    { name: 'Base', rid: 1 },
    { name: 'KPIs', rid: 2 },
    ...pivotDefs.map((p, i) => ({ name: p.sheetName, rid: i + 3 })),
  ];

  // workbook.xml
  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((s, i) => `<sheet name="${escXml(s.name)}" sheetId="${i + 1}" r:id="rId${s.rid}"/>`).join('\n    ')}
  </sheets>
</workbook>`;

  // workbook.xml.rels
  let wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>`;

  pivotDefs.forEach((_, i) => {
    wbRels += `\n  <Relationship Id="rId${i + 3}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 3}.xml"/>`;
  });
  wbRels += `\n  <Relationship Id="rIdSS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`;
  wbRels += '\n</Relationships>';

  // [Content_Types].xml
  let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>`;

  for (let i = 1; i <= sheetCount; i++) {
    contentTypes += `\n  <Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  // pivot cache
  contentTypes += `\n  <Override PartName="/xl/pivotCache/pivotCacheDefinition1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheDefinition+xml"/>`;
  contentTypes += `\n  <Override PartName="/xl/pivotCache/pivotCacheRecords1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotCacheRecords+xml"/>`;
  pivotDefs.forEach((_, i) => {
    contentTypes += `\n  <Override PartName="/xl/pivotTables/pivotTable${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.pivotTable+xml"/>`;
  });
  contentTypes += `\n  <Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>`;
  contentTypes += '\n</Types>';

  // _rels/.rels
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  // sheet1.xml.rels (Base → table1)
  const sheet1Rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>
</Relationships>`;

  // Pivot sheet rels (cada pivot sheet aponta para a pivotTable)
  const pivotSheetRels = pivotDefs.map((_, i) =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotTable" Target="../pivotTables/pivotTable${i + 1}.xml"/>
</Relationships>`
  );

  // Pivot table rels (cada pivotTable aponta para o cacheDefinition)
  const pivotTableRels = pivotDefs.map(() =>
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheDefinition" Target="../pivotCache/pivotCacheDefinition1.xml"/>
</Relationships>`
  );

  // pivot cache rels
  const cacheDefRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/pivotCacheRecords" Target="pivotCacheRecords1.xml"/>
</Relationships>`;

  // ── Adicionar ao ZIP ──────────────────────────────────────────────────────
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rootRels);
  zip.file('xl/workbook.xml', workbookXml);
  zip.file('xl/_rels/workbook.xml.rels', wbRels);
  zip.file('xl/sharedStrings.xml', ssXml);

  // Aba Base
  zip.file('xl/worksheets/sheet1.xml', baseSheetXml);
  zip.file('xl/worksheets/_rels/sheet1.xml.rels', sheet1Rels);
  zip.file('xl/tables/table1.xml', baseTableXml);

  // Aba KPIs
  zip.file('xl/worksheets/sheet2.xml', kpiSheetXml);

  // Abas de Pivot
  pivotDefs.forEach((p, i) => {
    const sheetIdx = i + 3;
    const pivotSheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData/>
  <pivotTableDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" r:id="rId1" name="${escXml(p.sheetName)}"/>
</worksheet>`;

    zip.file(`xl/worksheets/sheet${sheetIdx}.xml`, pivotSheetXml);
    zip.file(`xl/worksheets/_rels/sheet${sheetIdx}.xml.rels`, pivotSheetRels[i]);
    zip.file(`xl/pivotTables/pivotTable${i + 1}.xml`, p.pivotXml);
    zip.file(`xl/pivotTables/_rels/pivotTable${i + 1}.xml.rels`, pivotTableRels[i]);
  });

  // Pivot cache
  zip.file('xl/pivotCache/pivotCacheDefinition1.xml', cacheDefXml);
  zip.file('xl/pivotCache/pivotCacheRecords1.xml', cacheRecXml);
  zip.file('xl/pivotCache/_rels/pivotCacheDefinition1.xml.rels', cacheDefRels);

  // ── Gerar e baixar ────────────────────────────────────────────────────────
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Pivot Table XML completo ──────────────────────────────────────────────────
function buildPivotTableXml(opts: {
  name: string;
  rowField: string;
  colField: string;
  valueField: string;
  pageFilters: { field: string; value: string }[];
  fields: string[];
}): string {
  const { name, rowField, colField, valueField, pageFilters, fields } = opts;

  const rowIdx  = fields.indexOf(rowField);
  const colIdx  = fields.indexOf(colField);
  const valIdx  = fields.indexOf(valueField);
  const pageIdxs = pageFilters.map(pf => fields.indexOf(pf.field));

  // Monta lista de pivotFields (um por campo da base)
  const pivotFieldsXml = fields.map((f, i) => {
    const isRow  = i === rowIdx;
    const isCol  = i === colIdx;
    const isPage = pageIdxs.includes(i);
    const axis = isRow ? ' axis="axisRow"' : isCol ? ' axis="axisCol"' : isPage ? ' axis="axisPage"' : '';
    const showAll = (isRow || isCol || isPage) ? ' showAll="0"' : '';
    return `<pivotField name="${escXml(f)}"${axis}${showAll}><items count="0"/></pivotField>`;
  }).join('');

  // rowFields / colFields
  const rowFieldsXml = `<rowFields count="1"><field x="${rowIdx}"/></rowFields>`;
  const colFieldsXml = `<colFields count="1"><field x="${colIdx}"/></colFields>`;

  // pageFields (filtros de página com valor pré-definido)
  let pageFieldsXml = '';
  if (pageFilters.length > 0) {
    const fields2 = pageFilters.map((pf, i) => `<pageField fld="${pageIdxs[i]}" hier="-1"/>`).join('');
    pageFieldsXml = `<pageFields count="${pageFilters.length}">${fields2}</pageFields>`;
  }

  // dataFields
  const dataFieldsXml = `<dataFields count="1">
    <dataField name="Contagem de ${escXml(valueField)}" fld="${valIdx}" subtotal="count" showDataAs="normal"/>
  </dataFields>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<pivotTableDefinition xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  name="${escXml(name)}" cacheId="1" dataOnRows="0"
  applyNumberFormats="0" applyBorderFormats="0" applyFontFormats="0"
  applyPatternFormats="0" applyAlignmentFormats="0" applyWidthHeightFormats="1"
  dataCaption="Valores" updatedVersion="6" minRefreshableVersion="3"
  useAutoFormatting="1" itemPrintTitles="1" createdVersion="6"
  indent="2" outline="1" outlineData="1" compact="1" compactData="1"
  showDrill="1" showDataTips="1" showMemberPropertyTips="0" showCalcMbrs="0"
  rowGrandTotals="1" colGrandTotals="1" multipleFieldFilters="0">
  <location ref="A3" firstHeaderRow="1" firstDataRow="2" firstDataCol="1"
            rowPageCount="1" colPageCount="1"/>
  <pivotFields count="${fields.length}">${pivotFieldsXml}</pivotFields>
  ${rowFieldsXml}
  ${colFieldsXml}
  ${pageFieldsXml}
  ${dataFieldsXml}
  <pivotTableStyleInfo name="PivotStyleMedium9" showRowHeaders="1" showColHeaders="1"
    showRowStripes="0" showColStripes="0" showLastColumn="1"/>
</pivotTableDefinition>`;
}