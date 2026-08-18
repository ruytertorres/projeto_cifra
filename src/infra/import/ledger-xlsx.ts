import * as XLSX from "xlsx";
import type { Entry, EntryStatus, EntryType } from "../../domain";

const requiredColumns = [
  "data",
  "descricao",
  "tipo",
  "valor",
  "categoria",
  "status",
];
const statusMap: Record<string, EntryStatus> = {
  "a confirmar": "planned",
  pendente: "pending",
  atrasado: "overdue",
  importante: "important",
  proximo_de_vencer: "dueSoon",
  confirmado: "confirmed",
  pago: "paid",
  cancelado: "canceled",
};

export async function parseLedgerXlsx(
  file: File,
): Promise<Array<Omit<Entry, "id">>> {
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const sheet =
    workbook.Sheets.lancamentos ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("O arquivo não possui uma aba de lançamentos.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  if (!rows.length) throw new Error("A aba de lançamentos está vazia.");
  const columns = Object.keys(rows[0]).map(normalizeHeader);
  const missing = requiredColumns.filter((column) => !columns.includes(column));
  if (missing.length)
    throw new Error(`Colunas obrigatórias ausentes: ${missing.join(", ")}.`);
  return rows.map((row, index) => parseRow(row, index + 2));
}

function parseRow(
  row: Record<string, unknown>,
  line: number,
): Omit<Entry, "id"> {
  const data = formatDate(value(row, "data"));
  const description = String(value(row, "descricao")).trim();
  const typeValue = normalizeHeader(value(row, "tipo"));
  const category = String(value(row, "categoria")).trim();
  const statusValue = normalizeHeader(value(row, "status"));
  const amount = Number(String(value(row, "valor")).replace(",", "."));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data))
    throw new Error(`Linha ${line}: data deve usar AAAA-MM-DD.`);
  if (!description || !category)
    throw new Error(`Linha ${line}: descrição e categoria são obrigatórias.`);
  if (typeValue !== "entrada" && typeValue !== "saida")
    throw new Error(`Linha ${line}: tipo deve ser entrada ou saida.`);
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error(`Linha ${line}: valor deve ser positivo.`);
  if (!statusMap[statusValue])
    throw new Error(`Linha ${line}: status desconhecido (${statusValue}).`);
  return {
    description,
    type:
      typeValue === "entrada"
        ? ("income" as EntryType)
        : ("expense" as EntryType),
    amount,
    category,
    date: data,
    status: statusMap[statusValue],
    notes: String(value(row, "observacao")).trim(),
    transferId: String(value(row, "transferencia_id")).trim() || undefined,
    adjustmentOf: String(value(row, "ajuste_de")).trim() || undefined,
  };
}

function value(row: Record<string, unknown>, expected: string) {
  const key = Object.keys(row).find(
    (candidate) => normalizeHeader(candidate) === expected,
  );
  return key ? row[key] : "";
}

function normalizeHeader(value: unknown) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date)
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  return String(value).trim();
}
