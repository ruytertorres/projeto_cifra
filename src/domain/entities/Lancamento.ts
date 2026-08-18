export type TipoLancamento = "income" | "expense";
export type StatusLancamento = "planned" | "confirmed" | "paid" | "canceled";

export type Lancamento = {
  id: string;
  description: string;
  type: TipoLancamento;
  amount: number;
  category: string;
  date: string;
  status: StatusLancamento;
  notes: string;
};

export const isLancamentoEfetivo = (lancamento: Lancamento) =>
  lancamento.status === "confirmed" || lancamento.status === "paid";
