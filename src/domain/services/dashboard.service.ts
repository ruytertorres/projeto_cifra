import { isLancamentoEfetivo, type Lancamento } from "../entities/Lancamento";

export function calcularTotais(
  lancamentos: Lancamento[],
  options: { incluirTransferencias?: boolean } = {},
) {
  const efetivos = lancamentos
    .filter(isLancamentoEfetivo)
    .filter(
      (lancamento) =>
        options.incluirTransferencias !== false || !lancamento.transferId,
    );
  const income = efetivos
    .filter((lancamento) => lancamento.type === "income")
    .reduce((total, lancamento) => total + lancamento.amount, 0);
  const expense = efetivos
    .filter((lancamento) => lancamento.type === "expense")
    .reduce((total, lancamento) => total + lancamento.amount, 0);
  return { income, expense, balance: income - expense };
}

export function calcularPendencias(lancamentos: Lancamento[]) {
  const pendentes = lancamentos.filter(
    (lancamento) => lancamento.status === "planned",
  );
  const income = pendentes
    .filter((lancamento) => lancamento.type === "income")
    .reduce((total, lancamento) => total + lancamento.amount, 0);
  const expense = pendentes
    .filter((lancamento) => lancamento.type === "expense")
    .reduce((total, lancamento) => total + lancamento.amount, 0);
  return { income, expense, count: pendentes.length };
}
