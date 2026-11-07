import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { PLAYER, COLLIDERS, BOUNDS, nearestSlot } from './game/layout.js';
import { moveWithCollision } from './game/collision.js';
import { buildMuseum, buildLights } from './game/MuseumScene.js';
import { buildFrames } from './game/frames.js';
import { sampleArtworks } from './game/artworks.js';
import { Player } from './game/Player.js';
import { Input } from './game/Input.js';
import { openPanel, closePanel, isPanelOpen, showPrompt } from './ui/panel.js';

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
scene.add(buildMuseum());
scene.add(buildLights());

// 전시 작품: 단계 2에서는 임시 데이터, 단계 4부터 Supabase 데이터로 바뀐다
const artworks = sampleArtworks();
const { root: frameRoot, frames } = buildFrames();
scene.add(frameRoot);
for (const [id, frame] of Object.entries(frames)) frame.setArtwork(artworks[id] ?? null);

const player = new Player(PLAYER.spawn);
scene.add(player.group);

const input = new Input();

// 3인칭 추적 카메라: 캐릭터의 뒤쪽 위에서 내려다본다. 방향은 고정이고 위치만 따라간다.
const CAM_OFFSET = { y: 10.5, z: 5.5 };
const LOOK_AHEAD = 2.5; // 캐릭터보다 조금 앞(북쪽)을 바라봐서 전시 공간이 더 보이게 한다
const CAM_MARGIN = 0.6; // 남쪽(뒤) 벽 안쪽에 머물러 벽이 시야를 가리지 않는다
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

function cameraTarget() {
  return {
    x: player.pos.x,
    z: Math.min(player.pos.z + CAM_OFFSET.z, BOUNDS.maxZ - CAM_MARGIN),
  };
}

function snapCamera() {
  const t = cameraTarget();
  camera.position.set(t.x, CAM_OFFSET.y, t.z);
  camera.lookAt(player.pos.x, 0.8, player.pos.z - LOOK_AHEAD);
}
snapCamera();

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

let nearSlot = null;

function update(dt) {
  // 상세 패널이 열려 있으면 닫기 입력만 받고 캐릭터는 움직이지 않는다
  if (isPanelOpen()) {
    if (input.consume('close')) closePanel();
    input.pressed.clear();
    player.animate(dt, 0, 0, false);
    return;
  }

  const dir = input.axis();
  const dx = dir.x * PLAYER.speed * dt;
  const dz = dir.z * PLAYER.speed * dt;
  const next = moveWithCollision(player.pos, dx, dz, PLAYER.radius, COLLIDERS, BOUNDS);
  const moved = Math.abs(next.x - player.pos.x) + Math.abs(next.z - player.pos.z) > 1e-6;
  player.pos = next;
  player.animate(dt, dir.x, dir.z, moved);

  // 근처 작품 안내 + 상호작용
  nearSlot = nearestSlot(player.pos);
  const label = nearSlot ? (artworks[nearSlot.id] ? '작품 보기' : '빈 자리 보기') : null;
  showPrompt(label && `E / Space: ${label}`);
  if (input.consume('interact') && nearSlot) openPanel(nearSlot, artworks[nearSlot.id]);
  input.pressed.clear();

  // 카메라 부드럽게 따라가기
  const t = cameraTarget();
  const k = Math.min(1, dt * 6);
  camera.position.x += (t.x - camera.position.x) * k;
  camera.position.z += (t.z - camera.position.z) * k;
  camera.lookAt(player.pos.x, 0.8, player.pos.z - LOOK_AHEAD);
}

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  // 탭이 오래 멈췄다 돌아와도 한 번에 순간이동하지 않도록 dt를 제한한다
  update(Math.min(clock.getDelta(), 0.05));
  renderer.render(scene, camera);
});

status.textContent = '이동: 방향키 / WASD · 작품 보기: E / Space';

// 자동 테스트용: 헤드리스 브라우저는 requestAnimationFrame이 돌지 않아 update를 직접 호출한다
window.__pm = { player, input, camera, update, render: () => renderer.render(scene, camera), artworks, frames };
