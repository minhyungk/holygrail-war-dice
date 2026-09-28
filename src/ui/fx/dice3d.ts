// 3D 다이스 (2d10, 오각 사다리꼴면체). prototype/mockup의 Dice 모듈을 옮긴 것.
// 결과는 엔진이 이미 정했다. 여기서는 정해진 눈으로 떨어지는 연출만 한다.
import * as THREE from 'three';
import { createRng } from '../../engine/rng';
import { drawCircle, REDUCED } from './circle';

const fx = createRng(0x6d2b79f5); // 연출용 (결과와 무관)
const SCALE = 0.55, G = -22, WALL = 1.55;
/** 앞쪽 벽(카메라 쪽 z)과 멈출 때 보기 좋은 자리로 끌어오는 정도 */
const FRONT = 0.95, HOME_PULL = 0.85;
const UP = new THREE.Vector3(0, 1, 0);

interface Kite { v: THREE.Vector3[]; val: number; normal: THREE.Vector3; dist: number; apex: THREE.Vector3; mid: THREE.Vector3 }
interface Die {
  mesh: THREE.Mesh; mat: THREE.MeshPhysicalMaterial; edge: THREE.LineBasicMaterial; sh: THREE.Mesh;
  vel: THREE.Vector3; ang: THREE.Vector3; state: 'rest' | 'fly' | 'settle'; t: number; bounces: number; val: number;
  s?: number; q0?: THREE.Quaternion; qT?: THREE.Quaternion; y0?: number; vxz?: THREE.Vector2; from?: THREE.Vector2; home?: THREE.Vector2;
}

function d10() {
  // 적도 10정점(높이 ±h 교대) + 극점 ±H. H = h(1+cos36°)/(1-cos36°)일 때 연(kite) 면이 정확히 평면이 된다.
  const h = 0.105, c36 = Math.cos(Math.PI / 5), H = (h * (1 + c36)) / (1 - c36);
  const R: THREE.Vector3[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    R.push(new THREE.Vector3(Math.cos(a), i % 2 ? -h : h, Math.sin(a)));
  }
  const T = new THREE.Vector3(0, H, 0), B = new THREE.Vector3(0, -H, 0);
  const upVals = [1, 3, 5, 7, 9];
  const kites: Kite[] = [];
  for (let k = 0; k < 5; k++) kites.push({ v: [T, R[2 * k]!, R[2 * k + 1]!, R[(2 * k + 2) % 10]!], val: upVals[k]! } as Kite);
  for (let j = 0; j < 5; j++) kites.push({ v: [B, R[2 * j + 1]!, R[(2 * j + 2) % 10]!, R[(2 * j + 3) % 10]!], val: 11 - upVals[(j + 3) % 5]! } as Kite);
  const pos: number[] = [];
  kites.forEach((kt) => {
    let [a, b, c, d] = kt.v as [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
    const cen = a.clone().add(b).add(c).add(d).multiplyScalar(0.25);
    if (b.clone().sub(a).cross(c.clone().sub(a)).dot(cen) < 0) [b, d] = [d, b];
    kt.normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    kt.dist = kt.normal.dot(a);
    kt.apex = a;
    kt.mid = b.clone().add(d).multiplyScalar(0.5);
    [[a, b, c], [a, c, d]].forEach((tri) => tri.forEach((p) => pos.push(p.x, p.y, p.z)));
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return { geo, kites, rest: kites[0]!.dist };
}
function numTex(n: number) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const x = cv.getContext('2d')!;
  // 어떤 주사위 색 위에서도 읽히도록: 흰 글자 + 어두운 테두리
  x.font = '900 92px Pretendard, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.lineJoin = 'round';
  x.shadowColor = 'rgba(255,228,150,.9)';
  x.shadowBlur = 12;
  x.lineWidth = 13;
  x.strokeStyle = 'rgba(24,14,34,.92)';
  x.strokeText(String(n), 64, 64);
  x.shadowBlur = 0;
  x.fillStyle = '#FFFFFF';
  x.fillText(String(n), 64, 64);
  if (n === 6 || n === 9) {
    x.fillStyle = 'rgba(20,12,28,.9)';
    x.fillRect(36, 106, 56, 14);
    x.fillStyle = '#FFFFFF';
    x.fillRect(40, 110, 48, 6);
  }
  const t = new THREE.CanvasTexture(cv);
  t.anisotropy = 4;
  return t;
}
function tableTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1024;
  const x = cv.getContext('2d')!;
  x.fillStyle = '#10152a';
  x.fillRect(0, 0, 1024, 1024);
  drawCircle(x, 1024, 0, 0.5);
  return new THREE.CanvasTexture(cv);
}
function shadowTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const x = cv.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,.6)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export class DiceTable {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  private dice: Die[] = [];
  private raf = 0;
  private last = 0;
  private pending: (() => void) | null = null;
  private shape = d10();
  private texs: Record<number, THREE.Texture> = {};
  private shadow!: THREE.Texture;
  private ro: ResizeObserver | null = null;
  /** 눈 1~10의 면 색 (tokens.css --dice-face-N) */
  private faceColor: Record<number, string> = {};
  /** 마지막으로 나온 두 눈의 면 색. 합산 칩도 같은 색을 쓴다 */
  lastColors: string[] = [];

  constructor(private readonly host: HTMLElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      this.renderer = null;
      return;
    }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.prepend(this.renderer.domElement);
    // 비스듬한 시점: 바로 위에서 보면 연 면 하나만 보여 10면체로 읽히지 않는다
    this.camera.position.set(0, 3.7, 3.9);
    this.camera.lookAt(0, 0, 0.15);
    this.scene.add(new THREE.HemisphereLight(0xfff3dd, 0x141a30, 0.55 * Math.PI));
    const key = new THREE.DirectionalLight(0xffe6c0, 1.0 * Math.PI);
    key.position.set(2.5, 5, 3);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x8fa8ff, 0.55 * Math.PI);
    rim.position.set(-3, 2, -4);
    this.scene.add(rim);
    const table = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ map: tableTex() }));
    table.rotation.x = -Math.PI / 2;
    this.scene.add(table);
    this.shadow = shadowTex();
    const css = getComputedStyle(document.documentElement);
    for (let v = 1; v <= 10; v++) this.faceColor[v] = css.getPropertyValue(`--dice-face-${v}`).trim() || '#EDE5D0';
    this.paintFaces();
    for (let n = 1; n <= 10; n++) this.texs[n] = numTex(n);
    this.dice = [this.makeDie(), this.makeDie()];
    this.placeRest(this.dice[0]!, 3, -0.6, 0.3);
    this.placeRest(this.dice[1]!, 8, 0.6, 0.1);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }

  get ok() {
    return !!this.renderer;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.renderer?.domElement.remove();
    this.renderer?.dispose();
  }

  private makeDie(): Die {
    // 면마다 다른 색의 보석 주사위: 정점 색(면 안에서 꼭짓점 쪽이 밝다) + 클리어코트 + 진주빛 무지개 광택
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      iridescence: 0.45,
      iridescenceIOR: 1.3,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xfff2d0),
      flatShading: true,
      emissive: 0x000000,
    });
    const mesh = new THREE.Mesh(this.shape.geo, mat);
    const edge = new THREE.LineBasicMaterial({ color: 0xf4d77a, transparent: true, opacity: 0.85 });
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.shape.geo, 15), edge));
    this.shape.kites.forEach((kt) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: this.texs[kt.val]!, transparent: true, depthWrite: false }));
      const p = kt.mid.clone().lerp(kt.apex, 0.3);
      const up = kt.apex.clone().sub(p);
      up.sub(kt.normal.clone().multiplyScalar(up.dot(kt.normal))).normalize();
      pl.position.copy(p.clone().add(kt.normal.clone().multiplyScalar(0.006)));
      pl.up.copy(up);
      pl.lookAt(pl.position.clone().add(kt.normal));
      mesh.add(pl);
    });
    mesh.scale.setScalar(SCALE);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: this.shadow, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.scene.add(sh);
    return { mesh, mat, edge, sh, vel: new THREE.Vector3(), ang: new THREE.Vector3(), state: 'rest', t: 0, bounces: 0, val: 1 };
  }
  private heading(q: THREE.Quaternion) {
    const v = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    return Math.atan2(v.z, v.x);
  }
  private targetQuat(val: number, yawFrom: THREE.Quaternion) {
    const kt = this.shape.kites.find((k) => k.val === val)!;
    const qA = new THREE.Quaternion().setFromUnitVectors(kt.normal, UP);
    return new THREE.Quaternion().setFromAxisAngle(UP, this.heading(qA) - this.heading(yawFrom)).multiply(qA);
  }
  private placeRest(d: Die, val: number, x: number, z: number) {
    d.mesh.quaternion.copy(this.targetQuat(val, new THREE.Quaternion().setFromAxisAngle(UP, fx.next() * 6.28)));
    d.mesh.position.set(x, this.shape.rest * SCALE, z);
    d.state = 'rest';
    this.syncShadow(d);
  }
  private syncShadow(d: Die) {
    d.sh.position.set(d.mesh.position.x, 0.01, d.mesh.position.z);
    const s = Math.max(0.35, 1 - d.mesh.position.y * 0.25);
    d.sh.scale.setScalar(s);
    (d.sh.material as THREE.MeshBasicMaterial).opacity = s;
  }
  resize() {
    if (!this.renderer) return;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 1.2 ? 44 : 34;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
  private step(d: Die, dt: number) {
    const m = d.mesh;
    if (d.state === 'fly') {
      d.t += dt;
      d.vel.y += G * dt;
      m.position.addScaledVector(d.vel, dt);
      const w = d.ang.length();
      if (w > 1e-4) m.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(d.ang.clone().divideScalar(w), w * dt));
      if (m.position.y < SCALE && d.vel.y < 0) {
        m.position.y = SCALE;
        d.vel.y *= -0.42;
        d.vel.x *= 0.76;
        d.vel.z *= 0.76;
        d.ang.multiplyScalar(0.7);
        d.bounces++;
      }
      const hz = Math.hypot(m.position.x, m.position.z);
      if (hz > WALL) {
        const nx = m.position.x / hz, nz = m.position.z / hz, dot = d.vel.x * nx + d.vel.z * nz;
        if (dot > 0) {
          d.vel.x -= 1.6 * dot * nx;
          d.vel.z -= 1.6 * dot * nz;
        }
        m.position.x = nx * WALL;
        m.position.z = nz * WALL;
      }
      // 앞쪽 벽: 카메라 앞을 지나쳐 화면 밖으로 나가지 않게
      if (m.position.z > FRONT && d.vel.z > 0) {
        m.position.z = FRONT;
        d.vel.z *= -0.45;
        d.ang.multiplyScalar(0.8);
      }
      if (d.t > 1.3 || (d.bounces >= 3 && d.vel.length() < 1.6)) {
        d.state = 'settle';
        d.s = 0;
        d.q0 = m.quaternion.clone();
        d.qT = this.targetQuat(d.val, m.quaternion);
        d.y0 = m.position.y;
        d.vxz = new THREE.Vector2(d.vel.x, d.vel.z);
        d.from = new THREE.Vector2(m.position.x, m.position.z);
      }
    } else if (d.state === 'settle') {
      d.s = Math.min(1, d.s! + dt / 0.6);
      const e = 1 - Math.pow(1 - d.s, 3);
      m.quaternion.copy(d.q0!).slerp(d.qT!, e);
      m.position.y = d.y0! + (this.shape.rest * SCALE - d.y0!) * e;
      // 멈추는 자리: 카메라 앞 가운데 쪽으로 부드럽게 끌어온다 (눈이 잘 보이도록)
      const home = d.home!;
      m.position.x = d.from!.x + (home.x - d.from!.x) * e * HOME_PULL;
      m.position.z = d.from!.y + (home.y - d.from!.y) * e * HOME_PULL;
      if (d.s >= 1) d.state = 'rest';
    }
    this.syncShadow(d);
  }
  private separate() {
    const a = this.dice[0]!.mesh.position, b = this.dice[1]!.mesh.position;
    const dx = b.x - a.x, dz = b.z - a.z, dd = Math.hypot(dx, dz);
    if (dd < 1.05 && dd > 1e-4) {
      const p = (1.05 - dd) / 2, nx = dx / dd, nz = dz / dd;
      a.x -= nx * p;
      a.z -= nz * p;
      b.x += nx * p;
      b.z += nz * p;
    }
  }
  private loop = (ts: number) => {
    const dt = Math.min(0.033, (ts - this.last) / 1000 || 0.016);
    this.last = ts;
    this.dice.forEach((d) => this.step(d, dt));
    this.separate();
    this.renderer!.render(this.scene, this.camera);
    if (this.dice.every((d) => d.state === 'rest')) {
      this.raf = 0;
      const p = this.pending;
      this.pending = null;
      p?.();
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };
  /** 면(연 모양)마다 눈에 맞는 색을 칠한다. 꼭짓점 쪽은 밝게, 반대쪽은 조금 어둡게 해서 보석처럼 */
  private paintFaces() {
    const cols: number[] = [];
    const white = new THREE.Color(0xffffff), black = new THREE.Color(0x000000);
    this.shape.kites.forEach((kt) => {
      const base = new THREE.Color(this.faceColor[kt.val]!);
      const apex = base.clone().lerp(white, 0.38);
      const side = base.clone();
      const far = base.clone().lerp(black, 0.22);
      // 정점 순서: (a, b, c), (a, c, d). a = 꼭짓점, c = 반대쪽 끝
      for (const c of [apex, side, far, apex, far, side]) cols.push(c.r, c.g, c.b);
    });
    this.shape.geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  }
  glow(on: boolean) {
    this.dice.forEach((d) => {
      d.mat.emissive.setHex(on ? 0x8a6a10 : 0x000000);
      d.edge.color.setHex(on ? 0xffffff : 0xf4d77a);
    });
    this.renderer?.render(this.scene, this.camera);
  }
  /** 정해진 눈(1~10 두 개)으로 던진다. 렌더러가 없으면 false */
  roll(values: number[], power: number, dirX: number): Promise<boolean> {
    return new Promise((res) => {
      if (!this.renderer) return res(false);
      this.lastColors = values.map((v) => this.faceColor[v] ?? '#EDE5D0');
      this.glow(false);
      this.dice.forEach((d, k) => {
        d.val = values[k]!;
        d.state = 'fly';
        d.t = 0;
        d.bounces = 0;
        // 테이블 뒤쪽에서 나를 향해 굴린다 (멀어지면 눈이 안 보인다)
        d.mesh.position.set((k ? 0.5 : -0.5) + dirX * 0.3, 1.2, -1.3);
        d.vel.set(dirX * 1.2 + (fx.next() - 0.5) * 0.8, 1.8 + power * 1.0, 2.0 + power * 1.4 + (fx.next() - 0.5) * 0.6);
        d.home = new THREE.Vector2((k ? 0.58 : -0.58) + (fx.next() - 0.5) * 0.2, 0.3 + (fx.next() - 0.5) * 0.2);
        d.ang.set((fx.next() - 0.5) * 30, (fx.next() - 0.5) * 20, (fx.next() - 0.5) * 30);
      });
      if (REDUCED) {
        this.dice.forEach((d, k) => this.placeRest(d, d.val, k ? 0.6 : -0.6, 0));
        this.renderer.render(this.scene, this.camera);
        return res(true);
      }
      this.pending = () => res(true);
      this.last = performance.now();
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    });
  }
}
