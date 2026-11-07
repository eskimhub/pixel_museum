import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';

const canvas = document.getElementById('game');
const status = document.getElementById('hud-status');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
} catch (e) {
  status.textContent = 'WebGL을 사용할 수 없습니다. 브라우저 설정에서 "하드웨어 가속 사용"을 켜고 다시 열어주세요.';
  status.className = 'hud-error';
  throw e;
}
renderer.setPixelRatio(1);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1015);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.set(0, 6, 8);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(4, 8, 6);
scene.add(sun);

// 단계 0 확인용 바닥. 단계 1에서 실제 미술관 공간으로 교체한다.
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  new THREE.MeshLambertMaterial({ color: 0x6b1d2a })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

function resize() {
  const w = Math.max(1, Math.floor(window.innerWidth / CONFIG.pixelScale));
  const h = Math.max(1, Math.floor(window.innerHeight / CONFIG.pixelScale));
  // 세 번째 인자 false: CSS 크기는 건드리지 않고 내부 해상도만 낮춘다
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => renderer.render(scene, camera));

status.textContent = `Three.js r${THREE.REVISION} · ${renderer.domElement.width}x${renderer.domElement.height}`;
