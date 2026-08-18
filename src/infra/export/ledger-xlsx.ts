import * as XLSX from "xlsx";
import type { Ledger } from "../../domain";

const headers = [
  "data",
  "descricao",
  "tipo",
  "valor",
  "categoria",
  "status",
  "observacao",
  "planilha",
  "transferencia_id",
  "ajuste_de",
];

const statusExportLabels: Record<string, string> = {
  planned: "a confirmar",
  pending: "pendente",
  overdue: "atrasado",
  important: "importante",
  dueSoon: "proximo de vencer",
  confirmed: "confirmado",
  paid: "pago",
  canceled: "cancelado",
};

export function downloadLedgerXlsx(ledger: Ledger) {
  const rows = ledger.entries.map((entry) => ({
    data: entry.date,
    descricao: entry.description,
    tipo: entry.type === "income" ? "entrada" : "saida",
    valor: entry.amount,
    categoria: entry.category,
    status: statusExportLabels[entry.status] ?? entry.status,
    observacao: entry.notes,
    planilha: ledger.name,
    transferencia_id: entry.transferId ?? "",
    ajuste_de: entry.adjustmentOf ?? "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  worksheet["!cols"] = [
    { wch: 13 },
    { wch: 32 },
    { wch: 10 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
    { wch: 36 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "lancamentos");
  XLSX.writeFile(workbook, `exportacao-${slugify(ledger.name)}.xlsx`);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
