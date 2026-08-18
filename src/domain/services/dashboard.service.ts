import { isLancamentoEfetivo, type Lancamento } from "../entities/Lancamento";

export function calcularTotais(lancamentos: Lancamento[]) {
  const efetivos = lancamentos.filter(isLancamentoEfetivo);
  const income = efetivos
    .filter((lancamento) => lancamento.type === "income")
    .reduce((total, lancamento) => total + lancamento.amount, 0);
  const expense = efetivos
    .filter((lancamento) => lancamento.type === "expense")
    .reduce((total, lancamento) => total + lancamento.amount, 0);
  return { income, expense, balance: income - expense };
}
