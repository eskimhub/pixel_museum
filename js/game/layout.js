// 방 배치 데이터. 3D 모델 생성(MuseumScene)과 충돌 판정(collision, 테스트)이 같은 값을 쓴다.
// 좌표계: x = 오른쪽, z = 화면 아래쪽(남쪽), y = 위. 단위는 임의의 "미터".

export const ROOM = {
  halfW: 10,   // x: -10 ~ 10
  halfD: 8,    // z: -8 ~ 8
  wallH: 4.2,
};

// 카펫(와인색)과 금색 무늬 테두리
export const CARPET = { halfW: 8, halfD: 6, border: 0.4 };

// 중앙 조각상 전시대 (슬롯 12번 자리)
export const PEDESTAL = { x: 0, z: 0, size: 2.8, height: 0.8 };

// 전시대를 둘러싼 로프 기둥 (한 변 길이 = half * 2). 관람객은 로프 안으로 들어갈 수 없다.
export const ROPE = { x: 0, z: 0, half: 2.1, thickness: 0.12, postSpacing: 1.4 };

export const BENCHES = [
  { x: -5.5, z: 0, w: 3.0, d: 0.9 },
  { x: 5.5, z: 0, w: 3.0, d: 0.9 },
];

export const PLANTS = [
  { x: -9, z: -7, size: 0.9 },
  { x: 9, z: -7, size: 0.9 },
  { x: -9, z: 7, size: 0.9 },
  { x: 9, z: 7, size: 0.9 },
];

export const PLAYER = { radius: 0.35, speed: 4, spawn: { x: 0, z: 4.5 } };

function box(x, z, w, d) {
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 };
}

const ropeSide = ROPE.half * 2 + ROPE.thickness;

// 플레이어가 지나갈 수 없는 사각형 영역
export const COLLIDERS = [
  box(ROPE.x, ROPE.z - ROPE.half, ropeSide, ROPE.thickness), // 로프 북
  box(ROPE.x, ROPE.z + ROPE.half, ropeSide, ROPE.thickness), // 로프 남
  box(ROPE.x - ROPE.half, ROPE.z, ROPE.thickness, ropeSide), // 로프 서
  box(ROPE.x + ROPE.half, ROPE.z, ROPE.thickness, ropeSide), // 로프 동
  ...BENCHES.map((b) => box(b.x, b.z, b.w, b.d)),
  ...PLANTS.map((p) => box(p.x, p.z, p.size, p.size)),
];

export const BOUNDS = {
  minX: -ROOM.halfW,
  maxX: ROOM.halfW,
  minZ: -ROOM.halfD,
  maxZ: ROOM.halfD,
};
