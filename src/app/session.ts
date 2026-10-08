import { useSyncExternalStore } from "react";
import { dispatch } from "../games/thac-cong-vien/engine/game";
import type { Command, DispatchResult, GameState } from "../games/thac-cong-vien/engine/types";
import type { SaveStore } from "../persistence/saveStore";

export type SaveStatus = "saved" | "memory" | "error" | "readonly";

export interface SessionSnapshot {
  state: GameState;
  saveStatus: SaveStatus;
}

let idCounter = 0;
export function newCommandId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Nguồn sự thật duy nhất cho UI. Mọi command đi qua hàng đợi tuần tự:
 * engine.dispatch → ghi bền vững → chỉ sau đó mới publish cho UI.
 */
export class GameSession {
  private snap: SessionSnapshot;
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private pending: GameState | null = null;

  constructor(state: GameState, private store: SaveStore | null, readonly: boolean) {
    this.snap = { state, saveStatus: readonly ? "readonly" : store?.available ? "saved" : "memory" };
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.snap;

  private publish(next: Partial<SessionSnapshot>) {
    this.snap = { ...this.snap, ...next };
    this.listeners.forEach((l) => l());
  }

  /** Lưu lần đầu (ván mới). */
  async persistInitial() {
    if (this.snap.saveStatus !== "saved") return;
    try {
      await this.store!.save(this.snap.state);
    } catch {
      this.publish({ saveStatus: "error" });
    }
  }

  run(command: Command, commandId = newCommandId()): Promise<DispatchResult> {
    const job = this.queue.then(async (): Promise<DispatchResult> => {
      const cur = this.snap.state;
      if (this.snap.saveStatus === "readonly" || this.snap.saveStatus === "error") {
        return { ok: false, state: cur, error: "wrongPhase" };
      }
      const r = dispatch(cur, { commandId, command });
      if (!r.ok || r.duplicate) return r;
      if (this.snap.saveStatus === "saved") {
        try {
          await this.store!.save(r.state);
        } catch {
          // Không publish state chưa ghi được; chặn thao tác tiếp theo.
          this.pending = r.state;
          this.publish({ saveStatus: "error" });
          return { ok: false, state: cur, error: "wrongPhase" };
        }
      }
      this.publish({ state: r.state });
      return r;
    });
    this.queue = job.catch(() => undefined);
    return job;
  }

  async retrySave() {
    const target = this.pending ?? this.snap.state;
    try {
      await this.store!.save(target);
      this.pending = null;
      this.publish({ state: target, saveStatus: "saved" });
    } catch {
      this.publish({ saveStatus: "error" });
    }
  }

  /** Dữ liệu cứu hộ: state bền vững cuối + state chưa ghi được (nếu có). */
  rescueData() {
    return { durable: this.snap.state, unsaved: this.pending };
  }
}

export function useSession(session: GameSession): SessionSnapshot {
  return useSyncExternalStore(session.subscribe, session.getSnapshot);
}
