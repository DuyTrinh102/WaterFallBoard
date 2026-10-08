import * as THREE from "three";

/**
 * Mô hình low-poly cho 9 trò chơi, dựng bằng khối hình học có sẵn (không cần file mô hình ngoài).
 * Thiết kế để nhận ra được khi nhìn THẲNG TỪ TRÊN XUỐNG: mái sọc, đường ray, mặt nước…
 * Kích thước: nằm gọn trong ô 1×1, cao ≤ ~0.8.
 */

const mats = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const key = color + JSON.stringify(opts);
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, flatShading: true, ...opts });
    mats.set(key, m);
  }
  return m;
}

function mesh(geo: THREE.BufferGeometry, color: string, opts?: Partial<THREE.MeshStandardMaterialParameters>) {
  const m = new THREE.Mesh(geo, mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const INK = "#1B2A2F";
const WHITE = "#FFFDF7";

/** Mái hình nón sọc (rạp xiếc, đu quay): ghép các lát nón xen màu. */
function stripedCone(radius: number, height: number, colors: [string, string], segments = 12) {
  const g = new THREE.Group();
  for (let i = 0; i < segments; i++) {
    const geo = new THREE.ConeGeometry(radius, height, 1, 1, true, (i / segments) * Math.PI * 2, (Math.PI * 2) / segments);
    const m = mesh(geo, colors[i % 2], { side: THREE.DoubleSide });
    g.add(m);
  }
  return g;
}

export interface Model {
  group: THREE.Group;
  /** Chuyển động liên tục (quay, nhấp nhô…). */
  tick?: (t: number) => void;
}

function circus(): Model {
  const g = new THREE.Group();
  const wall = mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.22, 12), WHITE);
  wall.position.y = 0.11;
  const roof = stripedCone(0.4, 0.42, ["#E4572E", WHITE]);
  roof.position.y = 0.43;
  const pole = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), INK);
  pole.position.y = 0.72;
  const flag = mesh(new THREE.BoxGeometry(0.12, 0.07, 0.01), "#FFB400");
  flag.position.set(0.06, 0.78, 0);
  g.add(wall, roof, pole, flag);
  return { group: g, tick: (t) => (flag.rotation.y = Math.sin(t * 3) * 0.5) };
}

function ghost(): Model {
  const g = new THREE.Group();
  const house = mesh(new THREE.BoxGeometry(0.5, 0.32, 0.42), "#B9A8F0");
  house.position.y = 0.16;
  const roof = mesh(new THREE.ConeGeometry(0.42, 0.28, 4), "#7B4FD6");
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 0.46;
  const spook = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.17, 10, 8), WHITE);
  const tail = mesh(new THREE.ConeGeometry(0.13, 0.18, 10), WHITE);
  tail.rotation.x = Math.PI;
  tail.position.y = -0.12;
  spook.add(body, tail);
  spook.position.set(0.16, 0.7, 0.14);
  g.add(house, roof, spook);
  return { group: g, tick: (t) => (spook.position.y = 0.68 + Math.sin(t * 2) * 0.05) };
}

function rocket(): Model {
  const g = new THREE.Group();
  const pad = mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.06, 12), "#CFE3FF");
  pad.position.y = 0.03;
  const body = mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.48, 10), WHITE);
  body.position.y = 0.3;
  const nose = mesh(new THREE.ConeGeometry(0.11, 0.2, 10), "#E4572E");
  nose.position.y = 0.64;
  g.add(pad, body, nose);
  for (let i = 0; i < 4; i++) {
    const fin = mesh(new THREE.BoxGeometry(0.03, 0.16, 0.16), "#2E6FDB");
    const a = (i / 4) * Math.PI * 2;
    fin.position.set(Math.cos(a) * 0.14, 0.14, Math.sin(a) * 0.14);
    fin.rotation.y = -a;
    g.add(fin);
  }
  return { group: g, tick: (t) => (g.rotation.y = t * 0.6) };
}

function carousel(): Model {
  const g = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.08, 16), "#FFE7A8");
  base.position.y = 0.04;
  const spin = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const pole = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 5), "#C27C00");
    pole.position.set(Math.cos(a) * 0.28, 0.24, Math.sin(a) * 0.28);
    const horse = mesh(new THREE.BoxGeometry(0.08, 0.06, 0.04), i % 2 ? "#E4572E" : "#2E6FDB");
    horse.position.set(Math.cos(a) * 0.28, 0.2, Math.sin(a) * 0.28);
    horse.rotation.y = -a;
    spin.add(pole, horse);
  }
  const roof = stripedCone(0.44, 0.26, ["#FFB400", WHITE], 16);
  roof.position.y = 0.53;
  spin.add(roof);
  g.add(base, spin);
  return { group: g, tick: (t) => (spin.rotation.y = t * 0.8) };
}

function train(): Model {
  const g = new THREE.Group();
  for (const z of [-0.07, 0.07]) {
    const rail = mesh(new THREE.BoxGeometry(0.86, 0.02, 0.02), "#7A6A55");
    rail.position.set(0, 0.03, z);
    g.add(rail);
  }
  const cars = new THREE.Group();
  const loco = mesh(new THREE.BoxGeometry(0.22, 0.16, 0.16), "#1F9D55");
  loco.position.set(0.18, 0.12, 0);
  const cab = mesh(new THREE.BoxGeometry(0.1, 0.12, 0.16), "#13703C");
  cab.position.set(0.08, 0.26, 0);
  const chimney = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.1, 6), INK);
  chimney.position.set(0.25, 0.25, 0);
  const wagon = mesh(new THREE.BoxGeometry(0.2, 0.12, 0.16), "#FFB400");
  wagon.position.set(-0.12, 0.1, 0);
  const wagon2 = mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), "#E4572E");
  wagon2.position.set(-0.32, 0.1, 0);
  cars.add(loco, cab, chimney, wagon, wagon2);
  g.add(cars);
  g.rotation.y = Math.PI / 4;
  return { group: g, tick: (t) => (cars.position.x = Math.sin(t * 0.9) * 0.06) };
}

function boat(): Model {
  const g = new THREE.Group();
  const water = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), "#4FB3E3", { roughness: 0.3 });
  water.position.y = 0.02;
  const hull = mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.1, 6), "#9C6B3F");
  hull.scale.set(1, 1, 2.6);
  hull.position.y = 0.1;
  const rider1 = mesh(new THREE.SphereGeometry(0.05, 8, 6), "#E4572E");
  rider1.position.set(0, 0.18, -0.08);
  const rider2 = mesh(new THREE.SphereGeometry(0.05, 8, 6), "#2E6FDB");
  rider2.position.set(0, 0.18, 0.08);
  const craft = new THREE.Group();
  craft.add(hull, rider1, rider2);
  g.add(water, craft);
  return { group: g, tick: (t) => { craft.rotation.y = t * 0.7; craft.position.y = Math.sin(t * 2.4) * 0.015; } };
}

function coaster(): Model {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.36, 0.12, -0.3),
      new THREE.Vector3(0.0, 0.7, -0.32),
      new THREE.Vector3(0.36, 0.3, -0.1),
      new THREE.Vector3(0.2, 0.55, 0.3),
      new THREE.Vector3(-0.25, 0.2, 0.32),
      new THREE.Vector3(-0.38, 0.35, 0.0),
    ],
    true,
  );
  const track = mesh(new THREE.TubeGeometry(curve, 64, 0.03, 6, true), "#E4572E");
  g.add(track);
  for (const p of curve.getSpacedPoints(8)) {
    const h = p.y;
    const post = mesh(new THREE.CylinderGeometry(0.012, 0.012, h, 4), "#7A6A55");
    post.position.set(p.x, h / 2, p.z);
    g.add(post);
  }
  const car = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.07), "#FFB400");
  g.add(car);
  return {
    group: g,
    tick: (t) => {
      const u = (t * 0.18) % 1;
      car.position.copy(curve.getPointAt(u)).add(new THREE.Vector3(0, 0.05, 0));
      car.lookAt(curve.getPointAt((u + 0.01) % 1).add(new THREE.Vector3(0, 0.05, 0)));
    },
  };
}

function wheel(): Model {
  const g = new THREE.Group();
  const legs = mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), INK);
  legs.position.set(0, 0.25, -0.12);
  const legs2 = legs.clone();
  legs2.position.z = 0.12;
  const rotor = new THREE.Group();
  rotor.add(mesh(new THREE.TorusGeometry(0.34, 0.025, 6, 24), "#C27C00"));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = mesh(new THREE.BoxGeometry(0.68, 0.012, 0.012), "#7A6A55");
    spoke.rotation.z = a;
    rotor.add(spoke);
    const cabin = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.1), ["#E4572E", "#2E6FDB", "#1F9D55", "#7B4FD6"][i % 4]);
    cabin.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0);
    rotor.add(cabin);
  }
  // Nghiêng mặt vòng quay 55° để nhìn từ trên xuống vẫn thấy hình tròn.
  const tilt = new THREE.Group();
  tilt.rotation.x = -0.95;
  tilt.position.y = 0.42;
  tilt.add(rotor);
  g.add(legs, legs2, tilt);
  return { group: g, tick: (t) => (rotor.rotation.z = t * 0.5) };
}

function splash(): Model {
  const g = new THREE.Group();
  const pool = mesh(new THREE.BoxGeometry(0.36, 0.05, 0.36), "#4FB3E3", { roughness: 0.25 });
  pool.position.set(0.18, 0.025, 0.18);
  const tower = mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), "#F6E1C3");
  tower.position.set(-0.3, 0.3, -0.3);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 0.6, -0.22),
    new THREE.Vector3(0.25, 0.48, -0.3),
    new THREE.Vector3(0.3, 0.3, 0.0),
    new THREE.Vector3(-0.15, 0.18, 0.1),
    new THREE.Vector3(0.1, 0.08, 0.2),
  ]);
  const slide = mesh(new THREE.TubeGeometry(curve, 40, 0.045, 8, false), "#2E6FDB");
  const drops: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const d = mesh(new THREE.SphereGeometry(0.03, 6, 4), WHITE);
    drops.push(d);
    g.add(d);
  }
  g.add(pool, tower, slide);
  return {
    group: g,
    tick: (t) =>
      drops.forEach((d, i) => {
        const u = (t * 0.5 + i / 3) % 1;
        d.position.set(0.18 + Math.cos(i * 2) * 0.1, 0.05 + Math.sin(u * Math.PI) * 0.15, 0.18 + Math.sin(i * 2) * 0.1);
      }),
  };
}

export const MODEL_BUILDERS: Record<string, () => Model> = { circus, ghost, rocket, carousel, train, boat, coaster, wheel, splash };
