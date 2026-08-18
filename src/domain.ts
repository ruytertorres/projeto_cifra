/* domain.ts — Tipos e regras puras do controle financeiro */
export type EntryType = "income" | "expense";
export type EntryStatus = "planned" | "confirmed" | "paid" | "canceled";
export type Entry = {
  id: string;
  description: string;
  type: EntryType;
  amount: number;
  category: string;
  date: string;
  status: EntryStatus;
  notes: string;
};
export type Ledger = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  entries: Entry[];
};
export type FinancialState = { ledgers: Ledger[]; activeLedgerId: string };
export const statusLabels: Record<EntryStatus, string> = {
  planned: "Planejado",
  confirmed: "Confirmado",
  paid: "Pago",
  canceled: "Cancelado",
};
export const isEffective = (entry: Entry) =>
  entry.status === "confirmed" || entry.status === "paid";
export function calculateTotals(entries: Entry[]) {
  const effective = entries.filter(isEffective);
  const income = effective
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + entry.amount, 0);
  const expense = effective
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + entry.amount, 0);
  return { income, expense, balance: income - expense };
}
export function validateEntry(entry: Omit<Entry, "id">) {
  if (!entry.description.trim()) throw new Error("Informe uma descrição.");
  if (!Number.isFinite(entry.amount) || entry.amount <= 0)
    throw new Error("O valor deve ser maior que zero.");
  if (!entry.category.trim()) throw new Error("Informe uma categoria.");
  if (!entry.date) throw new Error("Informe a data do lançamento.");
}
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
