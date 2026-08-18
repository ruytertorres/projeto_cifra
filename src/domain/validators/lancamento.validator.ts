import type { Lancamento } from "../entities/Lancamento";

export function validarLancamento(lancamento: Omit<Lancamento, "id">) {
  if (!lancamento.description.trim()) throw new Error("Informe uma descrição.");
  if (!Number.isFinite(lancamento.amount) || lancamento.amount <= 0)
    throw new Error("O valor deve ser maior que zero.");
  if (!lancamento.category.trim()) throw new Error("Informe uma categoria.");
  if (!lancamento.date) throw new Error("Informe a data do lançamento.");
}
