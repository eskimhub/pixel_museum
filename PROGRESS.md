# 진행 기록 (이어서 작업하기)

마지막 갱신: 2026-11-07. 새 세션에서는 이 파일과 [PLAN.md](PLAN.md)를 먼저 읽고 시작한다.

## 한눈에 보기

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 프로젝트 준비 (Three.js 저해상도 3D 뼈대) | 완료, 커밋됨 |
| 1 | 3D 미술관 공간 + 캐릭터 이동/충돌 | 완료, 커밋됨 (`053cc75`) |
| 2 | 전시 슬롯 13개 + 상호작용 | 완료, 로컬 커밋됨 (push 전) |
| 3~8 | Supabase, 업로드, 수정, 방문, 디자인, 배포 | 미착수 |

## 프로젝트 요약

- 이름: 김동구전 (미술관 이름 = 전시 이름)
- 3D(Three.js r160) 저해상도 렌더링으로 픽셀 느낌. 빌드 도구 없음. GitHub Pages 배포 예정 (`https://eskimhub.github.io/pixel_museum/`)
- 확정 결정: 슬롯 13개(벽 액자 12 + 중앙 조각상 1), 미술관 목록 기본 공개, 방 1개로 시작, **로그인 방식은 단계 3 시작 전에 결정**
- 작업 지침: [.bob/rules/coding-guidelines.md](.bob/rules/coding-guidelines.md) (가정을 먼저 밝히고, 최소 변경, 검증 기준을 정하고 끝까지 확인)

## 실행과 테스트

```bash
cd ~/Documents/pixel_museum && python3 -m http.server 8000
```

- 화면: `http://localhost:8000` (Chrome에서 WebGL이 막혀 있으면 Safari 사용. 이 Mac의 Chrome은 WebGL이 꺼져 있었다)
- 충돌 테스트: `tests/collision.test.html` (20개 통과)
- 슬롯 테스트: `tests/slots.test.html` (14개 통과)
- 이동 테스트: `tests/movement.test.html` (WebGL 필요, 16개 통과)
- 상호작용 테스트: `tests/interact.test.html` (WebGL 필요, 17개 통과)
- 스크린샷 확인용 URL
  - `tests/movement.test.html?shot=x,z&face=up|down|left|right` (플레이어를 그 위치에 놓고 렌더)
  - `tests/interact.test.html?slot=<id>` (해당 슬롯의 상세 패널을 연 상태로 렌더)
- 테스트 페이지에서 `js/main.js`를 import하면 `#prompt`, `#panel`, `#panel-*` 요소가 필요하다. 없으면 `panel.js`가 null을 참조해 `running...`에서 멈춘다
- 헤드리스 Chrome 실행 예 (macOS에는 `timeout` 명령이 없다):
  ```bash
  B="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "$B" --headless=new --no-sandbox --user-data-dir=/tmp/pm_chrome_x --use-gl=angle --use-angle=swiftshader \
    --enable-unsafe-swiftshader --window-size=960,600 --virtual-time-budget=6000 \
    --screenshot="$PWD/.bob/tmp/shot.png" "http://localhost:8000/tests/movement.test.html?shot=0,5&face=up"
  # 결과 확인은 --screenshot 대신 --dump-dom 으로 받아 PASS/FAIL/RESULT 줄을 grep
  ```
  - 스크린샷은 워크스페이스 안(`.bob/tmp/`)에 저장해야 읽을 수 있다 (`.gitignore`로 제외됨)
  - 연속 실행 시 WebGL 생성이 실패하는 경우가 있어, `--user-data-dir`을 매번 다르게 주고 한 번에 하나씩 실행한다
  - 헤드리스는 `requestAnimationFrame`이 돌지 않아, 테스트는 `window.__pm.update(dt)`를 직접 호출한다

## 파일 구조 (js/)

| 파일 | 역할 |
|---|---|
| `main.js` | 렌더러, 장면, 카메라, 메인 루프(`update(dt)`), 근처 슬롯 안내와 패널 연결, `window.__pm`(테스트용) |
| `config.js` | 미술관 이름, `pixelScale: 4`, 슬롯 수 |
| `game/layout.js` | 방 크기, 카펫, 단상, 로프, 벤치, 화분, **슬롯 13개(`SLOTS`)**, `nearestSlot(pos)`, `COLLIDERS`, `BOUNDS`, 스폰 `(0, 5.5)` |
| `game/MuseumScene.js` | 방의 3D 모델(`buildMuseum`)과 조명(`buildLights`) |
| `game/frames.js` | 벽 액자 12개 3D(`buildFrames`). `frames[id].setArtwork(art \| null)`로 이미지 교체 |
| `game/Player.js`, `sprites.js` | 치비 2D 스프라이트 캐릭터 (4방향 x 3프레임, 코드로 그림, 그림자) |
| `game/textures.js` | 16x16 픽셀 텍스처를 코드로 생성 (`NearestFilter`) |
| `game/collision.js` | 축별 이동 충돌 (벽 따라 미끄러짐) |
| `game/Input.js` | 방향키 + WASD, `E`/`Space` 상호작용, `Esc`/`E`/`Space` 닫기, `consume(action)` |
| `game/artworks.js` | **임시 작품 6점** (슬롯 1,3,5,6,9,12). 단계 4에서 Supabase 데이터로 교체 |
| `ui/panel.js` | 상세 패널 `openPanel/closePanel/isPanelOpen`, 안내 문구 `showPrompt` (`textContent`만 사용) |

## 단계 2 결과

- 벽 액자 12개(북 6, 서 3, 동 3) + 중앙 조각상 1개 = 슬롯 13개. 액자 아래 작품 설명판 스탠드
- 슬롯의 `stand`(관람 위치) 반경 1.6 안에 들어가면 "E / Space: 작품 보기" 또는 "빈 자리 보기" 안내가 뜬다
- `E`/`Space`로 상세 패널(이미지, 제목, 작가, 설명)이 열리고, 열려 있는 동안 캐릭터는 움직이지 않는다. `Esc`/`E`/`Space`로 닫는다
- 빈 슬롯은 "비어 있는 액자" / "비어 있는 전시대"로 표시
- 검증: 위 테스트 4종 모두 `RESULT ALL PASS`. 헤드리스 스크린샷으로 북·서·동쪽 벽 액자 방향, 빈 액자와 채워진 액자 구분, 패널 레이아웃을 확인함. 액자가 나무 패널·금 몰딩과 겹치거나 벽에서 눈에 띄게 떠 있지 않음

## 알려진 한계와 남은 차이 (참고 이미지 대비)

- 전시 방식: 참고 이미지 1번은 카펫 위에 흰 전시대 여러 개를 놓는 구성인데, 지금은 벽 액자 + 중앙 단상 구성이다
- 벽 바깥의 어두운 영역이 넓게 보인다 (카메라가 높고 넓게 비춰서). 취향 문제라 보류
- 실제 키보드 조작감과 패널 표시는 사람이 Safari에서 직접 확인하지 못했다 (자동 테스트는 키 이벤트를 흉내 내고, 시각 확인은 헤드리스 Chrome 스크린샷)
- 헤드리스 서버가 세션에 묶여 있어 새 세션에서는 서버를 다시 띄워야 한다

## Git / 인증

- 원격: `origin` = https://github.com/eskimhub/pixel_museum.git, 브랜치 `main`
- 로컬 커밋(단계 0, 1, 2)은 아직 **push되지 않았다**. GitHub 인증이 안 돼 있어 `git push`가 `could not read Username`으로 실패한다
  - 해결: 터미널에서 직접 `git push origin main`을 실행해 인증 (Personal Access Token 또는 `brew install gh` 후 `gh auth login`)
- Git 사용자: `eskimhub` / `dmstjd914@gmail.com`
- Homebrew는 `~/homebrew`에 설치됨 (Intel Mac은 비공식 지원이라 대부분 소스 빌드)

## 다음 세션 시작 순서

1. 이 파일과 `PLAN.md`의 "단계 3" 섹션을 읽는다
2. 서버를 띄우고 테스트 4종이 `ALL PASS`인지 확인한다
3. **단계 3 시작 전에 사용자에게 확인할 것:** 로그인 방식(이메일/비밀번호, 소셜, 익명 등) 결정, Supabase 프로젝트 생성 후 Project URL과 anon key 전달 (에이전트가 대신 만들 수 없다)
