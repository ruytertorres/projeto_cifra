import { createLocalStorageAdapter } from "../infra";
import {
  type Entry,
  type EntryStatus,
  type FinancialState,
  type Ledger,
} from "../domain";

const storage = createLocalStorageAdapter("fluxo-financeiro:v1");
const now = new Date().toISOString();
const initialState: FinancialState = {
  activeLedgerId: "empresa",
  ledgers: [
    {
      id: "empresa",
      name: "Operação",
      description: "Entradas e gastos da operação",
      color: "teal",
      createdAt: now,
      entries: [],
    },
    {
      id: "projetos",
      name: "Projetos",
      description: "Receitas e custos por projeto",
      color: "gold",
      createdAt: now,
      entries: [],
    },
  ],
};

let state = initialState;
const listeners = new Set<() => void>();
const persist = () =>
  storage
    .write(state)
    .catch((error: unknown) =>
      console.error("Falha ao persistir dados:", error),
    );
const newId = () => crypto.randomUUID();

const ready = storage.read().then((saved) => {
  if (saved?.ledgers?.length) state = saved;
  listeners.forEach((listener) => listener());
});

export const store = {
  getState: () => state,
  ready,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addLedger(
    name: string,
    description: string,
    sharedFrom?: { ledgerId: string; amount: number },
  ) {
    const source = sharedFrom
      ? state.ledgers.find((ledger) => ledger.id === sharedFrom.ledgerId)
      : undefined;
    if (sharedFrom && !source)
      throw new Error("A planilha de origem não foi encontrada.");
    if (
      sharedFrom &&
      (!Number.isFinite(sharedFrom.amount) || sharedFrom.amount <= 0)
    ) {
      throw new Error("Informe um valor compartilhado maior que zero.");
    }
    const ledger: Ledger = {
      id: newId(),
      name,
      description,
      color: "blue",
      createdAt: new Date().toISOString(),
      entries: [],
    };
    if (sharedFrom && source) {
      const transferId = newId();
      const date = new Date().toISOString().slice(0, 10);
      const outgoing: Entry = {
        id: newId(),
        description: `Transferência para ${name}`,
        type: "expense",
        amount: sharedFrom.amount,
        category: "Transferência interna",
        date,
        status: "confirmed",
        notes:
          "Débito de compartilhamento: valor redistribuído antes de existir saldo suficiente na origem.",
        transferId,
      };
      const incoming: Entry = {
        id: newId(),
        description: `Saldo compartilhado de ${source.name}`,
        type: "income",
        amount: sharedFrom.amount,
        category: "Transferência interna",
        date,
        status: "confirmed",
        notes: "Valor recebido de outra planilha.",
        transferId,
      };
      ledger.entries.push(incoming);
      state = {
        ...state,
        ledgers: state.ledgers
          .map((item) =>
            item.id === source.id
              ? { ...item, entries: [...item.entries, outgoing] }
              : item,
          )
          .concat(ledger),
        activeLedgerId: ledger.id,
      };
      persist();
      return;
    }
    state = {
      ...state,
      ledgers: [...state.ledgers, ledger],
      activeLedgerId: ledger.id,
    };
    persist();
  },
  deleteLedger(id: string) {
    if (state.ledgers.length <= 1) {
      throw new Error("A última planilha não pode ser excluída.");
    }

    const remaining = state.ledgers.filter((ledger) => ledger.id !== id);
    const activeLedgerId =
      state.activeLedgerId === id ? remaining[0].id : state.activeLedgerId;
    state = { ...state, ledgers: remaining, activeLedgerId };
    persist();
  },
  updateLedger(id: string, name: string, description: string) {
    if (!name.trim()) throw new Error("Informe um nome para a planilha.");
    if (!state.ledgers.some((ledger) => ledger.id === id)) {
      throw new Error("Planilha não encontrada.");
    }
    state = {
      ...state,
      ledgers: state.ledgers.map((ledger) =>
        ledger.id === id
          ? { ...ledger, name: name.trim(), description: description.trim() }
          : ledger,
      ),
    };
    persist();
  },
  closePeriod(
    ledgerId: string,
    startDate: string,
    endDate: string,
    pdfFileName: string,
  ) {
    if (startDate > endDate)
      throw new Error("A data inicial deve ser anterior à data final.");
    const ledger = state.ledgers.find((item) => item.id === ledgerId);
    if (!ledger) throw new Error("Planilha não encontrada.");
    const periodEntries = ledger.entries.filter(
      (entry) => entry.date >= startDate && entry.date <= endDate,
    );
    if (!periodEntries.length)
      throw new Error("Não existem lançamentos neste período.");
    const effectiveEntries = periodEntries.filter(
      (entry) => entry.status === "confirmed" || entry.status === "paid",
    );
    const income = effectiveEntries
      .filter((entry) => entry.type === "income")
      .reduce((total, entry) => total + entry.amount, 0);
    const expense = effectiveEntries
      .filter((entry) => entry.type === "expense")
      .reduce((total, entry) => total + entry.amount, 0);
    const balance = income - expense;
    const carryDate = new Date(`${endDate}T12:00:00`);
    carryDate.setDate(carryDate.getDate() + 1);
    const carryEntry: Entry | null =
      balance === 0
        ? null
        : {
            id: newId(),
            description:
              balance > 0
                ? "Saldo transportado do fechamento"
                : "Débito transportado do fechamento",
            type: balance > 0 ? "income" : "expense",
            amount: Math.abs(balance),
            category: "Fechamento de período",
            date: carryDate.toISOString().slice(0, 10),
            status: "confirmed",
            notes: `Saldo do período de ${startDate} a ${endDate}. Arquivo: ${pdfFileName}`,
          };
    const closure = {
      id: newId(),
      startDate,
      endDate,
      closedAt: new Date().toISOString(),
      pdfFileName,
      entryIds: periodEntries.map((entry) => entry.id),
    };
    state = {
      ...state,
      ledgers: state.ledgers.map((item) =>
        item.id !== ledgerId
          ? item
          : {
              ...item,
              entries: [
                ...item.entries.filter(
                  (entry) => entry.date < startDate || entry.date > endDate,
                ),
                ...(carryEntry ? [carryEntry] : []),
              ],
              closures: [...(item.closures ?? []), closure],
            },
      ),
    };
    persist();
  },
  setActiveLedger(id: string) {
    if (state.ledgers.some((ledger) => ledger.id === id)) {
      state = { ...state, activeLedgerId: id };
      persist();
    }
  },
  addEntry(entry: Omit<Entry, "id">) {
    state = {
      ...state,
      ledgers: state.ledgers.map((ledger) =>
        ledger.id === state.activeLedgerId
          ? {
              ...ledger,
              entries: [...ledger.entries, { ...entry, id: newId() }],
            }
          : ledger,
      ),
    };
    persist();
  },
  addEntries(entries: Array<Omit<Entry, "id">>) {
    if (!entries.length) return;
    state = {
      ...state,
      ledgers: state.ledgers.map((ledger) =>
        ledger.id === state.activeLedgerId
          ? {
              ...ledger,
              entries: [
                ...ledger.entries,
                ...entries.map((entry) => ({ ...entry, id: newId() })),
              ],
            }
          : ledger,
      ),
    };
    persist();
  },
  correctEntry(entryId: string, correction: Omit<Entry, "id">) {
    let found = false;
    state = {
      ...state,
      ledgers: state.ledgers.map((ledger) => ({
        ...ledger,
        entries: ledger.entries
          .map((entry) => {
            if (entry.id !== entryId) return entry;
            found = true;
            return { ...entry, status: "canceled" as const };
          })
          .concat(
            ledger.entries.some((entry) => entry.id === entryId)
              ? [{ ...correction, id: newId(), adjustmentOf: entryId }]
              : [],
          ),
      })),
    };
    if (!found) throw new Error("Lançamento não encontrado.");
    persist();
  },
  updateEntryStatus(entryId: string, status: EntryStatus) {
    state = {
      ...state,
      ledgers: state.ledgers.map((ledger) => ({
        ...ledger,
        entries: ledger.entries.map((entry) =>
          entry.id === entryId ? { ...entry, status } : entry,
        ),
      })),
    };
    persist();
  },
};
