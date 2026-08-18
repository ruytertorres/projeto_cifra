import type { EstadoFinanceiro } from "../../domain/entities/Tabela";

export interface StorageAdapter {
  read(): EstadoFinanceiro | null;
  write(state: EstadoFinanceiro): void;
}

export function createLocalStorageAdapter(key: string): StorageAdapter {
  return {
    read() {
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      try {
        return JSON.parse(saved) as EstadoFinanceiro;
      } catch {
        return null;
      }
    },
    write(state) {
      localStorage.setItem(key, JSON.stringify(state));
    },
  };
}
