/* store.ts — Estado e persistência local do controle financeiro */
import type { Entry, FinancialState, Ledger } from "./domain";
const storageKey = "fluxo-financeiro:v1";
const now = new Date().toISOString();
const starterState: FinancialState = {
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
function readState(): FinancialState {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return starterState;
  try {
    const state = JSON.parse(saved) as FinancialState;
    return state.ledgers?.length ? state : starterState;
  } catch {
    return starterState;
  }
}
let state = readState();
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}
function newId() {
  return crypto.randomUUID();
}
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
  setActiveLedger(id: string) {
    if (state.ledgers.some((ledger) => ledger.id === id)) {
      state = { ...state, activeLedgerId: id };
      persist();
    }
  },
  addEntry(entry: Omit<Entry, "id">) {
    const id = state.activeLedgerId;
    state = {
      ...state,
      ledgers: state.ledgers.map((ledger) =>
        ledger.id === id
          ? {
              ...ledger,
              entries: [...ledger.entries, { ...entry, id: newId() }],
            }
          : ledger,
      ),
    };
    persist();
  },
  updateEntryStatus(entryId: string, status: Entry["status"]) {
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
