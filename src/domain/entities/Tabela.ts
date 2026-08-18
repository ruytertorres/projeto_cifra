import type { Lancamento } from "./Lancamento";

export type Tabela = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  entries: Lancamento[];
};

export type EstadoFinanceiro = {
  ledgers: Tabela[];
  activeLedgerId: string;
};
