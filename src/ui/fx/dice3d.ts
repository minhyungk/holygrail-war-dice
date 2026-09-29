// 3D 다이스 (2d6, 정육면체).
// 결과는 엔진이 이미 정했다. 여기서는 정해진 눈으로 떨어지는 연출만 한다.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createRng } from '../../engine/rng';
import { drawCircle, REDUCED } from './circle';
import { pipLayout, pipRadius } from './pips';

const fx = createRng(0x6d2b79f5); // 연출용 (결과와 무관)
const SCALE = 0.4, G = -22, WALL = 1.55;
/** 앞쪽 벽(카메라 쪽 z) */
const FRONT = 0.95;
/** 두 주사위 중심의 최소 거리: 어떻게 돌아가 있어도 겹치지 않게 (한 변 2·SCALE의 대각선 + 여유) */
const MIN_GAP = SCALE * 2 * Math.SQRT2 * 1.08;
/** 멈추는 자리의 가로 위치 (가운데에서 좌우로) */
const HOME_X = MIN_GAP / 2 + 0.04;
const UP = new THREE.Vector3(0, 1, 0);

interface Face { val: number; normal: THREE.Vector3 }
interface Die {
  mesh: THREE.Mesh; mats: THREE.MeshPhysicalMaterial[]; sh: THREE.Mesh;
  vel: THREE.Vector3; ang: THREE.Vector3; state: 'rest' | 'fly' | 'settle'; t: number; bounces: number; val: number;
  s?: number; q0?: THREE.Quaternion; qT?: THREE.Quaternion; y0?: number; vxz?: THREE.Vector2; from?: THREE.Vector2; home?: THREE.Vector2;
}

/** 모서리를 둥글린 정육면체. BoxGeometry 면 순서(+x, -x, +y, -y, +z, -z)에 눈을 붙인다. 마주 보는 면의 합은 7 */
const FACE_VALS = [3, 4, 1, 6, 2, 5];
const FACE_NORMALS: [number, number, number][] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
function d6() {
  const geo = new RoundedBoxGeometry(2, 2, 2, 5, 0.3);
  const faces: Face[] = FACE_VALS.map((val, i) => ({ val, normal: new THREE.Vector3(...FACE_NORMALS[i]!) }));
  return { geo, faces, rest: 1 };
}

/** 면 무늬: 상아색 바탕에 파인 눈. bump=true면 같은 자리의 높이 지도(흰 바탕, 검은 구멍) */
function faceTex(n: number, col: { body: string; pip: string; ace: string }, bump: boolean) {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const x = cv.getContext('2d')!;
  x.fillStyle = bump ? '#ffffff' : col.body;
  x.fillRect(0, 0, S, S);
  for (const [u, v] of pipLayout(n)) {
    const cx = u * S, cy = v * S, r = pipRadius(n) * S;
    if (bump) {
      const g = x.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.08);
      g.addColorStop(0, '#000000');
      g.addColorStop(0.8, '#303030');
      g.addColorStop(1, '#ffffff');
      x.fillStyle = g;
    } else {
      // 파인 자국: 위쪽 가장자리는 그늘, 아래쪽은 빛이 받쳐 준다
      x.beginPath();
      x.arc(cx, cy + r * 0.06, r * 1.06, 0, Math.PI * 2);
      x.fillStyle = 'rgba(255,255,255,.55)';
      x.fill();
      const ink = n === 1 ? col.ace : col.pip;
      const g = x.createRadialGradient(cx, cy + r * 0.25, r * 0.1, cx, cy, r);
      g.addColorStop(0, ink);
      g.addColorStop(0.75, ink);
      g.addColorStop(1, 'rgba(0,0,0,.85)');
      x.fillStyle = g;
    }
    x.beginPath();
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  if (!bump) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
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
  private shape = d6();
  /** 면 무늬 (눈 순서가 아니라 BoxGeometry 면 순서) */
  private faceMaps: { map: THREE.Texture; bump: THREE.Texture }[] = [];
  private shadow!: THREE.Texture;
  private ro: ResizeObserver | null = null;

  constructor(private readonly host: HTMLElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      this.renderer = null;
      return;
    }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    // 방 조명 반사: 둥근 모서리와 광택이 살아난다
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();
    host.prepend(this.renderer.domElement);
    // 비스듬한 시점으로 정육면체의 윗면과 옆면을 함께 보여 준다
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
    // 색은 토큰에서 (tokens.css --dice-*)
    const css = getComputedStyle(document.documentElement);
    const tok = (k: string, d: string) => css.getPropertyValue(k).trim() || d;
    const col = { body: tok('--dice-body', '#F4ECDA'), pip: tok('--dice-pip', '#1B2140'), ace: tok('--dice-pip-ace', '#B3202E') };
    this.faceMaps = this.shape.faces.map((f) => ({ map: faceTex(f.val, col, false), bump: faceTex(f.val, col, true) }));
    this.dice = [this.makeDie(), this.makeDie()];
    this.placeRest(this.dice[0]!, 3, -HOME_X, 0.3);
    this.placeRest(this.dice[1]!, 4, HOME_X, 0.1);
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
    for (const f of this.faceMaps) (f.map.dispose(), f.bump.dispose());
    this.scene.environment?.dispose();
    this.renderer?.dispose();
  }

  private makeDie(): Die {
    // 상아 주사위: 반투명한 듯한 광택(클리어코트) + 파인 눈(범프)
    const mats = this.faceMaps.map(({ map, bump }) => new THREE.MeshPhysicalMaterial({
      map,
      bumpMap: bump,
      bumpScale: 2.2,
      roughness: 0.38,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
      sheen: 0.25,
      sheenColor: new THREE.Color(0xfff4e0),
      emissive: 0x000000,
    }));
    const mesh = new THREE.Mesh(this.shape.geo, mats);
    mesh.scale.setScalar(SCALE);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(SCALE * 2.7, SCALE * 2.7), new THREE.MeshBasicMaterial({ map: this.shadow, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.scene.add(sh);
    return { mesh, mats, sh, vel: new THREE.Vector3(), ang: new THREE.Vector3(), state: 'rest', t: 0, bounces: 0, val: 1 };
  }
  private heading(q: THREE.Quaternion) {
    const v = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    return Math.atan2(v.z, v.x);
  }
  private targetQuat(val: number, yawFrom: THREE.Quaternion) {
    const kt = this.shape.faces.find((k) => k.val === val)!;
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
      // 멈추는 자리: 카메라 앞 가운데 쪽으로 부드럽게 끌어온다 (눈이 잘 보이도록). 두 자리는 MIN_GAP 이상 떨어져 있다
      const home = d.home!;
      m.position.x = d.from!.x + (home.x - d.from!.x) * e;
      m.position.z = d.from!.y + (home.y - d.from!.y) * e;
      if (d.s >= 1) d.state = 'rest';
    }
    this.syncShadow(d);
  }
  private separate() {
    const a = this.dice[0]!.mesh.position, b = this.dice[1]!.mesh.position;
    const dx = b.x - a.x, dz = b.z - a.z, dd = Math.hypot(dx, dz);
    if (dd < MIN_GAP && dd > 1e-4) {
      const p = (MIN_GAP - dd) / 2, nx = dx / dd, nz = dz / dd;
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
  glow(on: boolean) {
    this.dice.forEach((d) => {
      for (const m of d.mats) m.emissive.setHex(on ? 0x6a4e0c : 0x000000);
    });
    this.renderer?.render(this.scene, this.camera);
  }
  /** 정해진 눈(1~6 두 개)으로 던진다. 렌더러가 없으면 false */
  roll(values: number[], power: number, dirX: number): Promise<boolean> {
    return new Promise((res) => {
      if (!this.renderer) return res(false);
      this.glow(false);
      this.dice.forEach((d, k) => {
        d.val = values[k]!;
        d.state = 'fly';
        d.t = 0;
        d.bounces = 0;
        // 테이블 뒤쪽에서 나를 향해 굴린다 (멀어지면 눈이 안 보인다)
        d.mesh.position.set((k ? 0.5 : -0.5) + dirX * 0.3, 1.2, -1.3);
        d.vel.set(dirX * 1.2 + (fx.next() - 0.5) * 0.8, 1.8 + power * 1.0, 2.0 + power * 1.4 + (fx.next() - 0.5) * 0.6);
        d.home = new THREE.Vector2((k ? HOME_X : -HOME_X) + (fx.next() - 0.5) * 0.08, 0.3 + (fx.next() - 0.5) * 0.2);
        d.ang.set((fx.next() - 0.5) * 30, (fx.next() - 0.5) * 20, (fx.next() - 0.5) * 30);
      });
      if (REDUCED) {
        this.dice.forEach((d, k) => this.placeRest(d, d.val, k ? HOME_X : -HOME_X, 0));
        this.renderer.render(this.scene, this.camera);
        return res(true);
      }
      this.pending = () => res(true);
      this.last = performance.now();
      if (!this.raf) this.raf = requestAnimationFrame(this.loop);
    });
  }
}
