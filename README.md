# pixel_museum

**김동구전** - 픽셀 느낌의 3D 가상 미술관. 캐릭터를 조작해 미술관을 돌아다니고, 작품을 액자로 전시하며, 다른 사용자의 미술관을 방문한다.

- 개발 계획: [PLAN.md](PLAN.md)
- 배포 예정: GitHub Pages (`https://eskimhub.github.io/pixel_museum/`)

## 기술

- Three.js r160 (`vendor/`에 포함, 빌드 도구 없음)
- HTML / CSS / JavaScript (ES 모듈)
- Supabase (Auth, Database, Storage) - 단계 3부터

## 로컬 실행

ES 모듈은 `file://`로는 동작하지 않으므로 로컬 서버가 필요하다.

```bash
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 열기
```

## 진행 상황

- [x] 단계 0: 프로젝트 준비 (저해상도 3D 화면 확인)
- [ ] 단계 1: 미술관 공간 + 캐릭터 이동
- [ ] 단계 2: 전시 슬롯 13개(벽 액자 12 + 조각상 1) + 상호작용
- [ ] 단계 3~8: Supabase, 업로드, 수정, 방문, 디자인, 배포

## 라이선스

`vendor/three.module.js`는 MIT 라이선스 ([vendor/THREE_LICENSE.txt](vendor/THREE_LICENSE.txt)).
