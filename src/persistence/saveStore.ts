import { SCHEMA_VERSION } from "../games/thac-cong-vien/engine/game";
import { checkInvariants } from "../games/thac-cong-vien/engine/invariants";
import type { GameState } from "../games/thac-cong-vien/engine/types";

const DB_NAME = "thac-cong-vien";
const STORE = "saves";

export interface SaveRecord {
  schemaVersion: number;
  savedAt: string;
  state: GameState;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("indexedDB blocked"));
  });
}

export class SaveStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<boolean> {
    try {
      this.db = await openDb();
      return true;
    } catch {
      this.db = null;
      return false;
    }
  }

  get available() {
    return this.db !== null;
  }

  /** Ghi current + previousGood trong MỘT transaction; resolve chỉ khi đã commit. */
  save(state: GameState): Promise<void> {
    const db = this.db;
    if (!db) return Promise.reject(new Error("storage unavailable"));
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get("current");
      getReq.onsuccess = () => {
        if (getReq.result) store.put(getReq.result, "previousGood");
        const rec: SaveRecord = { schemaVersion: SCHEMA_VERSION, savedAt: new Date().toISOString(), state };
        store.put(rec, "current");
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("aborted"));
    });
  }

  private get(key: string): Promise<SaveRecord | undefined> {
    const db = this.db;
    if (!db) return Promise.resolve(undefined);
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** Không bao giờ ghi đè bản lỗi: trả về trạng thái để UI quyết định. */
  async load(): Promise<{ state: GameState | null; recovered: boolean; corrupt: SaveRecord | null }> {
    const cur = await this.get("current");
    if (!cur) return { state: null, recovered: false, corrupt: null };
    if (isValid(cur)) return { state: cur.state, recovered: false, corrupt: null };
    const prev = await this.get("previousGood");
    if (prev && isValid(prev)) return { state: prev.state, recovered: true, corrupt: cur };
    return { state: null, recovered: false, corrupt: cur };
  }

  async clear(): Promise<void> {
    const db = this.db;
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export function isValid(rec: unknown): rec is SaveRecord {
  try {
    const r = rec as SaveRecord;
    if (!r || r.schemaVersion !== SCHEMA_VERSION || !r.state || r.state.schemaVersion !== SCHEMA_VERSION) return false;
    if (!Array.isArray(r.state.players) || typeof r.state.round !== "number") return false;
    return checkInvariants(r.state).length === 0;
  } catch {
    return false;
  }
}

/** Chỉ một tab được ghi. Tab khác chuyển sang chỉ xem. */
let lockPromise: Promise<boolean> | null = null;
export function acquireWriterLock(): Promise<boolean> {
  // Ghi nhớ: gọi lại (vd. StrictMode chạy effect hai lần) không tự khoá chính mình.
  lockPromise ??= requestLock();
  return lockPromise;
}

function requestLock(): Promise<boolean> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) return Promise.resolve(true);
  return new Promise((resolve) => {
    locks
      .request("thac-cong-vien-writer", { ifAvailable: true }, (lock) => {
        if (!lock) {
          resolve(false);
          return undefined;
        }
        resolve(true);
        return new Promise<void>(() => {}); // giữ lock suốt đời tab
      })
      .catch(() => resolve(true));
  });
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
