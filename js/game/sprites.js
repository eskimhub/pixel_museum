import * as THREE from '../../vendor/three.module.js';

// 치비 스타일 캐릭터 스프라이트를 코드로 그린다 (4방향 x 3프레임: 0=서 있기, 1·2=걷기).
// 16x19 영역에 그린 뒤 사방 1px 여백에 어두운 외곽선을 자동으로 넣는다.

export const SPRITE_W = 18;
export const SPRITE_H = 21;

const HAIR = '#5a3520';
const HAIR_HI = '#8a5a34';
const SKIN = '#f6cfa8';
const SKIN_SH = '#e0b088';
const EYE = '#2a1a14';
const BLUSH = '#f0a08a';
const SHIRT = '#58b848';
const SHIRT_DK = '#3d8a35';
const PANTS = '#4a5a82';
const SHOES = '#6b4326';
const OUTLINE = '#2a1a14';

function drawChar(ctx, dir, frame) {
  const mirror = dir === 'left';
  const side = dir === 'left' || dir === 'right';
  // 그리는 영역은 16칸 폭. 왼쪽을 볼 때는 오른쪽 그림을 좌우 반전해서 그린다.
  const R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(mirror ? 16 - x - w : x, y, w, h);
  };

  // 걸음: 1이면 왼발, 2이면 오른발을 든다
  const liftL = frame === 1;
  const liftR = frame === 2;

  // 다리와 신발 (아래부터 그려서 몸이 위에 덮이게 한다)
  const leg = (x, lifted) => {
    if (lifted) {
      R(x, 15, 2, 1, PANTS);
      R(x, 16, 2, 2, SHOES);
    } else {
      R(x, 15, 2, 2, PANTS);
      R(x, 17, 2, 2, SHOES);
    }
  };
  if (side) {
    // 옆모습: 걸을 때 다리가 앞뒤로 벌어진다
    if (frame === 0) { leg(7, false); }
    else { leg(liftL ? 5 : 9, false); leg(liftL ? 9 : 5, true); }
  } else {
    leg(5, liftL);
    leg(9, liftR);
  }

  // 몸통
  if (side) {
    R(6, 10, 4, 5, SHIRT);
    R(6, 14, 4, 1, SHIRT_DK);
  } else {
    R(5, 10, 6, 5, SHIRT);
    R(5, 14, 6, 1, SHIRT_DK);
    if (dir === 'down') R(7, 10, 2, 1, SKIN);
  }

  // 팔: 다리와 반대쪽 팔이 앞으로 나간다
  if (side) {
    const sw = frame === 0 ? 0 : (liftL ? 1 : -1);
    R(7 + sw, 11, 2, 3, SHIRT_DK);
    R(7 + sw, 14, 2, 1, SKIN);
  } else {
    const aL = liftR ? -1 : 0;
    const aR = liftL ? -1 : 0;
    R(4, 11 + aL, 1, 3, SHIRT_DK);
    R(4, 14 + aL, 1, 1, SKIN);
    R(11, 11 + aR, 1, 3, SHIRT_DK);
    R(11, 14 + aR, 1, 1, SKIN);
  }

  // 머리
  if (dir === 'down') {
    R(3, 0, 10, 3, HAIR);
    R(3, 3, 2, 6, HAIR);
    R(11, 3, 2, 6, HAIR);
    R(5, 3, 6, 1, HAIR);
    R(5, 1, 3, 1, HAIR_HI);
    R(5, 4, 6, 5, SKIN);
    R(6, 9, 4, 1, SKIN_SH);
    R(6, 6, 1, 2, EYE);
    R(9, 6, 1, 2, EYE);
    R(5, 8, 1, 1, BLUSH);
    R(10, 8, 1, 1, BLUSH);
  } else if (dir === 'up') {
    R(3, 0, 10, 9, HAIR);
    R(4, 9, 8, 1, HAIR);
    R(5, 2, 3, 1, HAIR_HI);
    R(9, 5, 2, 1, HAIR_HI);
  } else {
    R(3, 0, 10, 3, HAIR);
    R(3, 3, 4, 6, HAIR);
    R(7, 3, 5, 1, HAIR);
    R(5, 1, 3, 1, HAIR_HI);
    R(7, 4, 5, 5, SKIN);
    R(7, 9, 4, 1, SKIN_SH);
    R(10, 6, 1, 2, EYE);
    R(10, 8, 1, 1, BLUSH);
  }
}

// 불투명 픽셀 바로 바깥쪽에 외곽선 색을 칠한다
function addOutline(ctx) {
  const img = ctx.getImageData(0, 0, SPRITE_W, SPRITE_H);
  const a = (x, y) => (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H ? 0 : img.data[(y * SPRITE_W + x) * 4 + 3]);
  const out = [];
  for (let y = 0; y < SPRITE_H; y++) {
    for (let x = 0; x < SPRITE_W; x++) {
      if (a(x, y) === 0 && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) out.push([x, y]);
    }
  }
  ctx.fillStyle = OUTLINE;
  for (const [x, y] of out) ctx.fillRect(x, y, 1, 1);
}

function makeFrame(dir, frame) {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  const ctx = canvas.getContext('2d');
  ctx.translate(1, 1);
  drawChar(ctx, dir, frame);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  addOutline(ctx);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** { down: [t0,t1,t2], up: [...], left: [...], right: [...] } */
export function makeCharacterTextures() {
  const set = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    set[dir] = [0, 1, 2].map((f) => makeFrame(dir, f));
  }
  return set;
}
