import * as THREE from '../vendor/three.module.js';
import { CONFIG } from './config.js';
import { PLAYER, COLLIDERS, BOUNDS, SLOTS, nearestSlot } from './game/layout.js';
import { moveWithCollision } from './game/collision.js';
import { buildMuseum, buildLights } from './game/MuseumScene.js';
import { buildFrames } from './game/frames.js';
import { sampleArtworks } from './game/artworks.js';
import { Player } from './game/Player.js';
import { Input } from './game/Input.js';
import { openPanel, closePanel, isPanelOpen, showPrompt } from './ui/panel.js';
import { initAuthUi, isAuthOpen } from './ui/auth.js';
import { initUpload, prepareUpload, resetUpload } from './ui/upload.js';
import { getClient } from './supabaseClient.js';
import { loadMyMuseum, loadArtworks, describeError } from './data/museumApi.js';

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

// 전시 작품: 로그아웃 상태에서는 데모 작품, 로그인하면 내 미술관의 작품(Supabase)을 보여준다
const demoArtworks = sampleArtworks();
const artworks = {};
const { root: frameRoot, frames } = buildFrames();
scene.add(frameRoot);

/** 지금 전시할 작품 묶음으로 교체하고 액자 그림을 다시 입힌다 */
function showArtworks(map) {
  for (const k of Object.keys(artworks)) delete artworks[k];
  Object.assign(artworks, map);
  for (const [id, frame] of Object.entries(frames)) frame.setArtwork(artworks[id] ?? null);
}
showArtworks(demoArtworks);

// 로그인한 내 미술관 연결 정보. 없으면(로그아웃·불러오기 실패) 올리기 버튼이 나타나지 않는다.
let connection = null; // { client, museum, userId }

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

/** 슬롯 상세 패널을 연다. 내 미술관의 빈 자리면 올리기 버튼을 함께 보여준다 */
function showSlot(slot) {
  const art = artworks[slot.id];
  openPanel(slot, art, connection ? '이 자리에 작품을 올려 보세요.' : undefined);
  prepareUpload(slot, art);
}

function update(dt) {
  // 로그인 창이 열려 있으면 게임 입력을 모두 무시한다(입력창에서 친 글자가 이동으로 새지 않게)
  if (isAuthOpen()) {
    input.down.clear();
    input.pressed.clear();
    player.animate(dt, 0, 0, false);
    return;
  }

  // 상세 패널이 열려 있으면 닫기 입력만 받고 캐릭터는 움직이지 않는다
  if (isPanelOpen()) {
    if (input.consume('close')) { closePanel(); resetUpload(); }
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
  if (input.consume('interact') && nearSlot) showSlot(nearSlot);
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

const DEFAULT_STATUS = status.textContent;
function setStatus(text, isError = false) {
  status.textContent = text;
  status.className = isError ? 'hud-error' : '';
}

// 로그인 상태가 바뀌면 내 미술관을 읽어 전시를 바꾼다. 오래 걸리는 요청이 겹쳐도 마지막 요청만 반영한다.
let sessionSeq = 0;
let loadedFor = null;
async function onSession(session) {
  const userId = session?.user?.id ?? null;
  if (userId === loadedFor) return; // 토큰 갱신·중복 알림은 무시
  const mine = ++sessionSeq;
  loadedFor = userId;
  connection = null;
  if (!userId) {
    resetUpload();
    showArtworks(demoArtworks);
    setStatus(DEFAULT_STATUS);
    return;
  }
  showArtworks({});
  setStatus('내 미술관을 불러오는 중...');
  try {
    const client = await getClient();
    const museum = await loadMyMuseum(client, userId);
    if (!museum) throw new Error('내 미술관을 찾지 못했습니다. 잠시 뒤 다시 로그인해 주세요.');
    const mine_ = await loadArtworks(client, museum);
    if (mine !== sessionSeq) return;
    connection = { client, museum, userId };
    showArtworks(mine_);
    setStatus(DEFAULT_STATUS);
  } catch (err) {
    if (mine !== sessionSeq) return;
    loadedFor = null; // 다시 로그인 상태 알림이 오면 재시도할 수 있게 한다
    console.error('미술관 불러오기 실패', err);
    setStatus(describeError(err), true);
  }
}

initUpload({
  getConnection: () => connection,
  onUploaded(slotId, art) {
    artworks[slotId] = art;
    frames[slotId]?.setArtwork(art);
    showSlot(SLOTS.find((s) => s.id === slotId)); // 올린 작품을 패널에서 바로 보여준다
  },
});

// Supabase 설정이 있을 때만 로그인 UI가 나타난다(설정이 비어 있으면 아무 일도 하지 않는다)
initAuthUi(onSession).catch((e) => console.error('로그인 초기화 실패', e));

// 자동 테스트용: 헤드리스 브라우저는 requestAnimationFrame이 돌지 않아 update를 직접 호출한다
window.__pm = {
  player, input, camera, update, render: () => renderer.render(scene, camera), artworks, frames,
  setConnection: (c) => { connection = c; }, // 테스트에서 모의 서버 연결을 주입한다
};
