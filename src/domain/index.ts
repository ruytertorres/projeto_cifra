export type {
  Lancamento as Entry,
  StatusLancamento as EntryStatus,
  TipoLancamento as EntryType,
} from "./entities/Lancamento";
export type {
  EstadoFinanceiro as FinancialState,
  Tabela as Ledger,
} from "./entities/Tabela";
export { isLancamentoEfetivo as isEffective } from "./entities/Lancamento";
export { calcularTotais as calculateTotals } from "./services/dashboard.service";
export { validarLancamento as validateEntry } from "./validators/lancamento.validator";
export const statusLabels = {
  planned: "Planejado",
  confirmed: "Confirmado",
  paid: "Pago",
  canceled: "Cancelado",
} as const;
