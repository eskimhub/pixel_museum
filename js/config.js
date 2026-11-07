// 화면/게임 기본 설정.
export const CONFIG = {
  museumName: '김동구전',
  // 내부 렌더링 해상도를 화면 크기의 1/PIXEL_SCALE로 낮춰 픽셀 느낌을 만든다.
  pixelScale: 4,
  // 전시 슬롯: 벽 액자 12개 + 중앙 조각상 1개
  wallSlots: 12,
  statueSlots: 1,
  // Supabase 대시보드 > Project Settings > API 의 Project URL 과 anon(public) key.
  // anon key는 공개되어도 되는 키다(접근 제어는 RLS가 한다). service_role 키는 절대 넣지 않는다.
  // 둘 다 비어 있으면 로그인 UI가 나타나지 않고 단계 2의 로컬 데이터로만 동작한다.
  supabaseUrl: '',
  supabaseAnonKey: '',
};
