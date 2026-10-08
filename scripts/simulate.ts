// npm run simulate -- --players 4 --seed demo
import { createHash } from "node:crypto";
import { simulateGame } from "../src/games/thac-cong-vien/engine/simulate";
import { fixtureThacV1 } from "../src/games/thac-cong-vien/rules/fixture-thac-v1";

const args = process.argv.slice(2);
const arg = (name: string, def: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const players = Number(arg("players", "4")) as 3 | 4 | 5;
const seed = arg("seed", "demo");

const t0 = performance.now();
const r = simulateGame(fixtureThacV1, players, seed, { checkEvery: true });
const ms = (performance.now() - t0).toFixed(1);

console.log(`Ruleset: ${fixtureThacV1.id} (FIXTURE — không phải luật gốc)`);
console.log(`Người chơi: ${players} · seed: ${seed} · commands: ${r.commands} (bị từ chối: ${r.rejected}) · ${ms} ms`);
for (const round of Object.values(r.state.paidIncome)) {
  console.log(`Vòng ${round.round}: ` + round.players.map((p) => `${p.player}+${p.total}`).join("  "));
}
console.log("Kết quả:");
for (const row of r.state.result ?? []) {
  console.log(`  #${row.rank} ${row.player}: ${row.coins} xu, ${row.tilesOnBoard} tuile trên bàn`);
}
console.log(`Invariant: ${r.invariantErrors.length ? r.invariantErrors.join("; ") : "OK"}`);
const hash = createHash("sha256").update(JSON.stringify(r.state)).digest("hex").slice(0, 16);
console.log(`State hash: ${hash}`);
if (r.invariantErrors.length || r.state.phase !== "ended") process.exit(1);
