import { jsPDF } from "jspdf";
import type { Entry, Ledger } from "../../domain";
import { formatarMoeda } from "../../shared/money";

export function downloadPeriodPdf(
  ledger: Ledger,
  entries: Entry[],
  startDate: string,
  endDate: string,
  totals: { income: number; expense: number; balance: number },
) {
  const pdf = new jsPDF();
  let y = 18;
  const lineHeight = 7;
  const fileName = `fechamento-${slugify(ledger.name)}-${startDate}-a-${endDate}.pdf`;
  const write = (text: string, size = 10) => {
    if (y > 275) {
      pdf.addPage();
      y = 18;
    }
    pdf.setFontSize(size);
    pdf.text(text, 15, y);
    y += lineHeight;
  };

  pdf.setFont("helvetica", "bold");
  write(`Fechamento de periodo - ${ledger.name}`, 16);
  pdf.setFont("helvetica", "normal");
  write(`Periodo: ${startDate} a ${endDate}`);
  write(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
  y += 4;
  write(`Entradas efetivas: ${formatarMoeda(totals.income)}`);
  write(`Gastos efetivos: ${formatarMoeda(totals.expense)}`);
  write(`Saldo do periodo: ${formatarMoeda(totals.balance)}`);
  y += 4;
  pdf.setFont("helvetica", "bold");
  write("Lancamentos arquivados", 12);
  pdf.setFont("helvetica", "normal");
  entries.forEach((entry) => {
    const description =
      entry.description.length > 55
        ? `${entry.description.slice(0, 52)}...`
        : entry.description;
    write(
      `${entry.date} | ${entry.type === "income" ? "Entrada" : "Saida"} | ${description}`,
    );
    write(
      `Categoria: ${entry.category} | Valor: ${formatarMoeda(entry.amount)} | Status: ${entry.status}`,
      9,
    );
    if (entry.notes) write(`Observacao: ${entry.notes}`, 9);
  });
  pdf.save(fileName);
  return fileName;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}
