import { createLocalStorageAdapter } from "../infra";
import type { Entry, EntryStatus, FinancialState, Ledger } from "../domain";

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

let state = storage.read()?.ledgers?.length ? storage.read()! : initialState;
const persist = () => storage.write(state);
const newId = () => crypto.randomUUID();

export const store = {
  getState: () => state,
  addLedger(name: string, description: string) {
    const ledger: Ledger = {
      id: newId(),
      name,
      description,
      color: "blue",
      createdAt: new Date().toISOString(),
      entries: [],
    };
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
