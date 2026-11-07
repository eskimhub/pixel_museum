// 화면/게임 기본 설정. Supabase 키는 단계 3에서 추가한다.
export const CONFIG = {
  museumName: '김동구전',
  // 내부 렌더링 해상도를 화면 크기의 1/PIXEL_SCALE로 낮춰 픽셀 느낌을 만든다.
  pixelScale: 4,
  // 전시 슬롯: 벽 액자 12개 + 중앙 조각상 1개
  wallSlots: 12,
  statueSlots: 1,
};
