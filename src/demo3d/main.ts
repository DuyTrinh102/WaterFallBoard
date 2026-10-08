/**
 * Demo 2.5D — chỉ để đánh giá cảm giác và hiệu năng trên màn hình quán, CHƯA phải một phần của game.
 * Camera nhìn thẳng từ trên xuống (orthographic) để bàn đọc được từ bốn phía; có nút nghiêng camera
 * để so sánh. Dữ liệu bàn lấy từ engine thật (ván mô phỏng deterministic, bộ luật thử nghiệm).
 */
import "@fontsource/baloo-2/latin-800.css";
import "@fontsource/baloo-2/vietnamese-800.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import * as THREE from "three";
import { computeIncome } from "../games/thac-cong-vien/engine/income";
import { simulateGame } from "../games/thac-cong-vien/engine/simulate";
import type { CellId } from "../games/thac-cong-vien/engine/types";
import { fixtureThacV1 } from "../games/thac-cong-vien/rules/fixture-thac-v1";
import { MODEL_BUILDERS, mat, type Model } from "./models";
import "./demo.css";

const PLAYER_COLORS: Record<string, string> = { p1: "#E4572E", p2: "#2E6FDB", p3: "#1F9D55", p4: "#C27C00" };
const PLAYER_NAMES: Record<string, string> = { p1: "An", p2: "Bình", p3: "Chi", p4: "Dũng" };
// Ghế theo bố cục 4 người: An dưới, Bình trái, Chi trên, Dũng phải.
const SEAT_DIR: Record<string, THREE.Vector3> = {
  p1: new THREE.Vector3(0, 0, 4.6),
  p2: new THREE.Vector3(-8.6, 0, 0),
  p3: new THREE.Vector3(0, 0, -4.6),
  p4: new THREE.Vector3(8.6, 0, 0),
};

// ---------- Dữ liệu: một ván mô phỏng đến cuối (bàn kín công trình) ----------
const sim = simulateGame(fixtureThacV1, 4, "demo-3d");
const state = sim.state;
const topo = new Map(state.ruleset.topology.cells.map((c) => [c.id, c]));
const cellPos = (id: CellId) => {
  const c = topo.get(id)!;
  return new THREE.Vector3(c.col - 6.5, 0, c.row - 2.5);
};

// ---------- Renderer / scene ----------
const canvas = document.getElementById("scene") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#0D3B44");

scene.add(new THREE.HemisphereLight("#FFF8E8", "#28545A", 1.6));
const sun = new THREE.DirectionalLight("#FFFFFF", 2.2);
sun.position.set(-4, 12, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 5, bottom: -5, near: 1, far: 30 });
sun.shadow.bias = -0.0008;
scene.add(sun);

// Bàn: tấm đồng cỏ + thác nước động
const board = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.3, 6.3), mat("#EEF5E2", { flatShading: false }));
board.position.y = -0.15;
board.receiveShadow = true;
scene.add(board);

const waterTex = (() => {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? "#3A9FD2" : "#4FB3E3";
    g.fillRect(0, i * 32, 64, 32);
  }
  g.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 6; i++) g.fillRect(8 + ((i * 23) % 48), (i * 37) % 128, 10, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
})();
const falls = new THREE.Mesh(new THREE.PlaneGeometry(1, 6.2), new THREE.MeshStandardMaterial({ map: waterTex, roughness: 0.2 }));
falls.rotation.x = -Math.PI / 2;
falls.position.set(0.5, 0.011, 0); // cột 7 (giữa hai khu) có tâm x = 7 − 6.5
scene.add(falls);

// Ô: khối thấp màu theo chủ + số ô (đọc được từ hai phía)
function numberTexture(id: number, owned: boolean) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "800 34px 'Baloo 2', sans-serif";
  g.fillStyle = owned ? "#1B2A2F" : "#2E4A3F";
  g.fillText(String(id), 12, 36);
  g.save();
  g.translate(116, 92);
  g.rotate(Math.PI);
  g.font = "800 24px 'Baloo 2', sans-serif";
  g.fillStyle = "#8BA58F";
  g.fillText(String(id), 0, 0);
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const cellMeshes = new Map<THREE.Object3D, CellId>();
for (const tc of state.ruleset.topology.cells) {
  const cell = state.cells[tc.id];
  const color = cell.owner ? new THREE.Color(PLAYER_COLORS[cell.owner]).lerp(new THREE.Color("#F8FBF2"), 0.72) : new THREE.Color("#F8FBF2");
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
  const p = cellPos(tc.id);
  base.position.set(p.x, 0.04, p.z);
  base.receiveShadow = true;
  scene.add(base);
  cellMeshes.set(base, tc.id);
  if (cell.owner) {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.92), mat(PLAYER_COLORS[cell.owner]));
    rim.position.set(p.x, 0.02, p.z);
    scene.add(rim);
    const flag = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12), mat(PLAYER_COLORS[cell.owner]));
    flag.position.set(p.x + 0.36, 0.1, p.z - 0.36);
    scene.add(flag);
  }
}

// Số ô vẽ sau khi font đóng gói đã nạp (canvas không tự vẽ lại khi font về).
async function buildLabels() {
  await Promise.all([document.fonts.load("800 34px 'Baloo 2'"), document.fonts.load("800 24px 'Baloo 2'")]).catch(() => undefined);
  for (const tc of state.ruleset.topology.cells) {
    const p = cellPos(tc.id);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: numberTexture(tc.id, !!state.cells[tc.id].owner), transparent: true }));
    label.rotation.x = -Math.PI / 2;
    label.position.set(p.x, 0.082, p.z);
    scene.add(label);
  }
}

// Công trình (thu nhỏ để chừa số ô ở góc trên-trái)
const MODEL_SCALE = 0.78;
interface Built {
  cell: CellId;
  model: Model;
  appearAt: number; // giây; Infinity = ẩn
}
const built: Built[] = [];
for (const tc of state.ruleset.topology.cells) {
  const cell = state.cells[tc.id];
  if (!cell.tile) continue;
  const type = state.tileTypes[cell.tile];
  const model = MODEL_BUILDERS[type]();
  const p = cellPos(tc.id);
  model.group.position.set(p.x + 0.06, 0.08, p.z + 0.08);
  scene.add(model.group);
  built.push({ cell: tc.id, model, appearAt: 0 });
}

// ---------- Camera: thẳng từ trên (mặc định) hoặc nghiêng để so sánh ----------
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
ortho.position.set(0, 30, 0);
ortho.up.set(0, 0, -1);
ortho.lookAt(0, 0, 0);
const persp = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
persp.position.set(0, 13, 13);
persp.lookAt(0, 0, 0.6);
let camera: THREE.Camera = ortho;

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  const aspect = w / h;
  // Khung nhìn: bàn 14×6 + chừa viền cho khay người chơi (giống bố cục 1920×1080 của game).
  const viewW = Math.max(19.2, 10.8 * aspect);
  const viewH = viewW / aspect;
  Object.assign(ortho, { left: -viewW / 2, right: viewW / 2, top: viewH / 2, bottom: -viewH / 2 });
  ortho.updateProjectionMatrix();
  persp.aspect = aspect;
  persp.updateProjectionMatrix();
}
window.addEventListener("resize", resize);

// ---------- Tương tác ----------
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const info = document.getElementById("info")!;
let bounce: { cell: CellId; t0: number } | null = null;
canvas.addEventListener("pointerup", (e) => {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects([...cellMeshes.keys()])[0];
  if (!hit) return;
  const id = cellMeshes.get(hit.object)!;
  const cell = state.cells[id];
  const type = cell.tile ? state.ruleset.attractionTypes.find((a) => a.id === state.tileTypes[cell.tile!]) : null;
  info.textContent = `Ô ${id} · ${cell.owner ? PLAYER_NAMES[cell.owner] : "chưa có chủ"}${type ? ` · ${TYPE_NAMES[type.id]} (đủ bộ ${type.maxSize})` : ""}`;
  bounce = { cell: id, t0: clock.getElapsedTime() };
});
const TYPE_NAMES: Record<string, string> = { circus: "Rạp xiếc", ghost: "Nhà ma", rocket: "Tên lửa", carousel: "Đu quay ngựa", train: "Tàu hoả", boat: "Thuyền máng", coaster: "Tàu lượn", wheel: "Vòng quay", splash: "Máng trượt nước" };

const clock = new THREE.Clock();
const coinGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: "#FFB400", metalness: 0.6, roughness: 0.3, emissive: "#6b4a00", emissiveIntensity: 0.3 });
interface Coin {
  mesh: THREE.Mesh;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t0: number;
  player: string;
  /** Số xu cộng vào khay khi đồng xu này tới nơi (chỉ đồng cuối của mỗi nhóm mang số). */
  amount: number;
}
const coins: Coin[] = [];
const totals: Record<string, number> = { p1: 0, p2: 0, p3: 0, p4: 0 };
const totalEls: Record<string, HTMLElement> = {};
for (const p of ["p1", "p2", "p3", "p4"]) totalEls[p] = document.querySelector(`[data-total="${p}"]`) as HTMLElement;

function replayBuild() {
  const now = clock.getElapsedTime();
  const order = [...built].sort((a, b) => a.cell - b.cell);
  order.forEach((b, i) => (b.appearAt = now + 0.3 + i * 0.06));
}

function payIncome() {
  const now = clock.getElapsedTime();
  const income = computeIncome(state);
  let k = 0;
  for (const pi of income.players) {
    for (const g of pi.groups) {
      const center = g.cells.reduce((acc, c) => acc.add(cellPos(c)), new THREE.Vector3()).divideScalar(g.cells.length);
      const n = Math.min(6, Math.max(1, Math.round(g.amount / 3)));
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(coinGeo, coinMat);
        m.castShadow = true;
        m.visible = false;
        scene.add(m);
        coins.push({ mesh: m, from: center.clone().setY(0.6), to: SEAT_DIR[pi.player].clone().setY(0.3), t0: now + k * 0.03 + i * 0.05, player: pi.player, amount: i === n - 1 ? g.amount : 0 });
      }
      k++;
    }
  }
}

document.getElementById("btn-build")!.addEventListener("click", replayBuild);
document.getElementById("btn-income")!.addEventListener("click", payIncome);
const tiltBtn = document.getElementById("btn-tilt")!;
tiltBtn.addEventListener("click", () => {
  camera = camera === ortho ? persp : ortho;
  tiltBtn.textContent = camera === ortho ? "Thử camera nghiêng" : "Về nhìn từ trên";
  document.body.classList.toggle("tilted", camera === persp);
});
const qualityBtn = document.getElementById("btn-quality")!;
let high = true;
function applyQuality() {
  renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio, 2) : 1);
  renderer.shadowMap.enabled = high;
  scene.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m) m.needsUpdate = true;
  });
  qualityBtn.textContent = high ? "Chất lượng: cao" : "Chất lượng: tiết kiệm";
  resize();
}
qualityBtn.addEventListener("click", () => {
  high = !high;
  applyQuality();
});

// ---------- Vòng lặp ----------
const fpsEl = document.getElementById("fps")!;
let frames = 0;
let lastFps = performance.now();
const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

function frame() {
  const t = clock.getElapsedTime();
  waterTex.offset.y = -t * 0.35;
  for (const b of built) {
    const k = THREE.MathUtils.clamp((t - b.appearAt) / 0.35, 0, 1);
    b.model.group.visible = k > 0;
    let s = MODEL_SCALE * (k >= 1 ? 1 : easeOutBack(k));
    if (bounce && bounce.cell === b.cell) {
      const u = t - bounce.t0;
      if (u < 0.5) s *= 1 + Math.sin(u * Math.PI * 2) * 0.12 * (1 - u / 0.5);
    }
    b.model.group.scale.setScalar(Math.max(0.0001, s));
    b.model.tick?.(t);
  }
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    const u = (t - c.t0) / 0.9;
    c.mesh.visible = u > 0;
    if (u <= 0) continue;
    if (u >= 1) {
      if (c.amount) {
        totals[c.player] += c.amount;
        totalEls[c.player].textContent = `+${totals[c.player]} xu`;
        totalEls[c.player].classList.remove("pop");
        void totalEls[c.player].offsetWidth;
        totalEls[c.player].classList.add("pop");
      }
      scene.remove(c.mesh);
      coins.splice(i, 1);
      continue;
    }
    c.mesh.position.lerpVectors(c.from, c.to, u);
    c.mesh.position.y += Math.sin(u * Math.PI) * 1.4;
    c.mesh.rotation.x = u * 8;
  }
  renderer.render(scene, camera);
  frames++;
  const now = performance.now();
  if (now - lastFps > 1000) {
    fpsEl.textContent = `${Math.round((frames * 1000) / (now - lastFps))} fps · ${renderer.domElement.width}×${renderer.domElement.height}px`;
    frames = 0;
    lastFps = now;
  }
  requestAnimationFrame(frame);
}

applyQuality();
void buildLabels();
requestAnimationFrame(frame);
