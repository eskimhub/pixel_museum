# 진행 기록 (이어서 작업하기)

마지막 갱신: 2026-11-07. 새 세션에서는 이 파일과 [PLAN.md](PLAN.md)를 먼저 읽고 시작한다.

## 한눈에 보기

| 단계 | 내용 | 상태 |
|---|---|---|
| 0 | 프로젝트 준비 (Three.js 저해상도 3D 뼈대) | 완료, 커밋됨 |
| 1 | 3D 미술관 공간 + 캐릭터 이동/충돌 | 완료, 커밋됨 (`053cc75`) |
| 2 | 전시 슬롯 13개 + 상호작용 | **진행 중** (데이터만 작성, 화면 연결 전, 미커밋) |
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
- 충돌 테스트: `http://localhost:8000/tests/collision.test.html` (현재 `RESULT ALL PASS`)
- 이동 테스트: `http://localhost:8000/tests/movement.test.html` (WebGL 필요, 단계 1 기준 16개 통과)
- 스크린샷 확인용 URL: `tests/movement.test.html?shot=x,z&face=up|down|left|right` (플레이어를 그 위치에 놓고 렌더)
- 헤드리스 Chrome 실행 예 (macOS에는 `timeout` 명령이 없다):
  ```bash
  B="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "$B" --headless=new --no-sandbox --user-data-dir=/tmp/pm_chrome_x --use-gl=angle --use-angle=swiftshader \
    --enable-unsafe-swiftshader --window-size=960,600 --virtual-time-budget=4000 \
    --screenshot="$PWD/.bob/tmp/shot.png" "http://localhost:8000/tests/movement.test.html?shot=0,5&face=up"
  ```
  - 스크린샷은 워크스페이스 안(`.bob/tmp/`)에 저장해야 읽을 수 있다 (`.gitignore`로 제외됨)
  - 연속 실행 시 WebGL 생성이 실패하는 경우가 있어, `--user-data-dir`을 매번 다르게 주고 한 번에 하나씩 실행한다
  - 헤드리스는 `requestAnimationFrame`이 돌지 않아, 테스트는 `window.__pm.update(dt)`를 직접 호출한다

## 파일 구조 (js/)

| 파일 | 역할 |
|---|---|
| `main.js` | 렌더러, 장면, 카메라, 메인 루프(`update(dt)`), `window.__pm`(테스트용) |
| `config.js` | 미술관 이름, `pixelScale: 4`, 슬롯 수 |
| `game/layout.js` | 방 크기, 카펫, 단상, 로프, 벤치, 화분, **슬롯 13개(`SLOTS`)**, `nearestSlot(pos)`, `COLLIDERS`, `BOUNDS` |
| `game/MuseumScene.js` | 방의 3D 모델(`buildMuseum`)과 조명(`buildLights`) |
| `game/Player.js`, `sprites.js` | 치비 2D 스프라이트 캐릭터 (4방향 x 3프레임, 코드로 그림, 그림자) |
| `game/textures.js` | 16x16 픽셀 텍스처를 코드로 생성 (`NearestFilter`) |
| `game/collision.js` | 축별 이동 충돌 (벽 따라 미끄러짐) |
| `game/Input.js` | 방향키 + WASD (`E`/`Space`는 아직 없음) |
| `game/artworks.js` | **임시 작품 6점** (슬롯 1,3,5,6,9,12). 단계 4에서 Supabase 데이터로 교체 |

## 단계 2: 지금까지 한 일과 남은 일

### 이미 작성됨 (커밋 전)
- `layout.js`: `FRAME_SPOTS`(북쪽 벽 6개 `x=-7.5..7.5, z=-7.85`, 서쪽 벽 3개 `x=-9.85`, 동쪽 벽 3개 `x=9.85`, 각각 z=-4,0,4), `SLOTS`(id 0~12, 각 슬롯에 관람 위치 `stand`), `STATUE_SLOT = 12`, `INTERACT_RADIUS = 1.6`, `nearestSlot(pos)`
- `artworks.js`: `sampleArtworks()` -> `{ [slotId]: { title, description, author, imageUrl } }`. 슬롯 1,3,5,6,9,12에 코드로 그린 64x48 그림

### 남은 일 (이 순서로)
1. `MuseumScene.js`: 벽 액자 3D 생성. 빈 슬롯은 빈 액자, 작품이 있으면 `imageUrl`을 텍스처(`NearestFilter`)로 입힌다. 액자 아래 작품 설명판(참고 이미지 2번). 조각상 슬롯(12)은 기존 조각상에 연결
2. `Input.js`: `E`/`Space`로 상호작용, `Esc`로 닫기
3. 상세 패널 UI: `index.html`에 패널, `css/style.css`에 스타일(와인/금색 팔레트), `js/ui/panel.js`. 제목, 설명, 작성자, 이미지. 빈 액자는 "비어 있는 액자"로 표시
4. `main.js`: `nearestSlot(player.pos)`로 근처 슬롯을 찾아 "E: 보기" 안내를 HUD에 표시. 패널이 열려 있는 동안 캐릭터 이동 정지
5. 테스트: 슬롯 13개가 방 안에 있고 서로 0.5 이상 떨어져 있는지, 모든 `stand` 위치가 충돌 영역 밖인지(= 실제로 설 수 있는지), 각 슬롯에서 `nearestSlot`이 자기 자신을 돌려주는지, `E`로 패널이 열리고 `Esc`로 닫히는지, 패널이 열려 있으면 이동하지 않는지
6. 스크린샷으로 액자, 안내, 패널 확인
7. `PLAN.md`(단계 2 완료 표시), `README.md` 진행 상황 갱신 후 커밋

### 확인할 점 (주의)
- 화분이 `(±9, ±7)`에 있고 충돌 크기 0.9다. 북쪽 벽 액자 `x=±7.5`와 겹치지 않는지, 동서 벽 액자 z=±4 `stand`가 화분·벤치와 겹치지 않는지 테스트로 확인할 것
- 벤치가 `x=±5.5, z=0`(폭 3.0)이다. 서쪽/동쪽 벽 액자 z=0의 `stand`(`x=-8.55`, `8.55`)는 벤치 바깥쪽이라 닿을 수 있어야 한다
- 이전 세션에서 `apply_diff`가 파일 줄 번호 불일치로 일부만 적용되는 일이 여러 번 있었다. 수정 후 `grep`으로 반영 여부를 꼭 확인할 것

## 알려진 한계와 남은 차이 (참고 이미지 대비)

- 전시 방식: 참고 이미지 1번은 카펫 위에 흰 전시대 여러 개를 놓는 구성인데, 지금은 벽 액자 + 중앙 단상 구성이다
- 벽 바깥의 어두운 영역이 넓게 보인다 (카메라가 높고 넓게 비춰서). 취향 문제라 보류
- 실제 키보드 조작감은 사람이 Safari에서 직접 확인하지 못했다 (자동 테스트는 키 이벤트를 흉내 낸다)
- 정리 대상: `tests/diag.html`은 삭제됨(외부에서도 삭제 확인). 헤드리스 서버가 세션에 묶여 있어 새 세션에서는 서버를 다시 띄워야 한다

## Git / 인증

- 원격: `origin` = https://github.com/eskimhub/pixel_museum.git, 브랜치 `main`
- 로컬 커밋 2개(단계 0, 1)는 아직 **push되지 않았다**. GitHub 인증이 안 돼 있어 `git push`가 `could not read Username`으로 실패한다
  - 해결: 터미널에서 직접 `git push origin main`을 실행해 인증 (Personal Access Token 또는 `brew install gh` 후 `gh auth login`)
- Git 사용자: `eskimhub` / `dmstjd914@gmail.com`
- Homebrew는 `~/homebrew`에 설치됨 (Intel Mac은 비공식 지원이라 대부분 소스 빌드)

## 다음 세션 시작 순서

1. 이 파일과 `PLAN.md`의 "단계 2" 섹션을 읽는다
2. `git status`로 미커밋 변경(`js/game/layout.js`, `js/game/artworks.js`)을 확인한다
3. 서버를 띄우고 `tests/collision.test.html`이 `ALL PASS`인지 확인한다 (`layout.js`를 바꿨으므로 회귀 확인)
4. 위 "남은 일" 1번부터 진행한다
