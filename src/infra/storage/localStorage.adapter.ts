import type { EstadoFinanceiro } from "../../domain/entities/Tabela";

export interface StorageAdapter {
  read(): Promise<EstadoFinanceiro | null>;
  write(state: EstadoFinanceiro): Promise<void>;
}

export function createLocalStorageAdapter(key: string): StorageAdapter {
  return {
    async read() {
      const database = await openDatabase(key);
      const saved = await readFromDatabase(database);
      if (saved) return saved;

      const legacy = localStorage.getItem(key);
      if (!legacy) return null;
      try {
        const state = JSON.parse(legacy) as EstadoFinanceiro;
        await writeToDatabase(database, state);
        return state;
      } catch {
        return null;
      }
    },
    async write(state) {
      const database = await openDatabase(key);
      await writeToDatabase(database, state);
    },
  };
}

function openDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function readFromDatabase(
  database: IDBDatabase,
): Promise<EstadoFinanceiro | null> {
  return new Promise((resolve, reject) => {
    const request = database
      .transaction("state", "readonly")
      .objectStore("state")
      .get("current");
    request.onsuccess = () =>
      resolve((request.result as EstadoFinanceiro | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

function writeToDatabase(
  database: IDBDatabase,
  state: EstadoFinanceiro,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = database
      .transaction("state", "readwrite")
      .objectStore("state")
      .put(state, "current");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
