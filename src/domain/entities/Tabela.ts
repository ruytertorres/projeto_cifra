import type { Lancamento } from "./Lancamento";

export type Tabela = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  entries: Lancamento[];
  closures?: PeriodoFechado[];
};

export type PeriodoFechado = {
  id: string;
  startDate: string;
  endDate: string;
  closedAt: string;
  pdfFileName: string;
  entryIds: string[];
};

export type EstadoFinanceiro = {
  ledgers: Tabela[];
  activeLedgerId: string;
};
