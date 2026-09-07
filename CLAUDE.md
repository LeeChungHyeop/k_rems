# k_rems — 신재생통합관리시스템 데모

한수원 신재생에너지 통합 관리 시스템을 용역 발주하기 전에, 필요한 기능에 대해
**사용자 의견을 받기 위해 운영하는 데모 웹사이트**다. 실제 운영 시스템이 아니다.

## 스코프

이 프로젝트가 활성일 때는 **`k_rems/` 밖의 파일을 고치지 않는다.**
다른 프로젝트(`diet`, `k-allweather`) 참고는 가능하지만 수정은 확인을 받는다.
전체 규칙은 워크스페이스 루트 `../CLAUDE.md` 참고.

## 기본

```bash
npm run dev       # http://localhost:8080
npm test          # vitest
npm run build
```

- React 18 + Vite + shadcn/ui + Recharts + Leaflet.
- `HashRouter` + `base: "./"` — 정적 파일만 올리면 어디서든 도는 구성.
- git 루트는 이 폴더. remote `LeeChungHyeop/k_rems`.

## 데이터는 전부 목업이다

`src/data/mockData.ts` 하나에 모여 있다. 발전소 목록만 공공데이터포털의 실제
한수원 재생에너지 설비 현황(2025-06-30 기준)이고, 실시간 발전량·통신상태·알람은
데모용으로 만든 값이다. **실데이터 연동이라고 오해하지 말 것.**

데모의 목적이 "의견 수렴"이므로, 화면에 보이는 항목·용어·흐름이 실제 현업 담당자에게
어떻게 읽히는지가 중요하다. 기능을 줄이는 방향의 임의 단순화는 하지 말 것.

## Electron

데모를 서버 없이 exe로 배포하려고 넣어둔 경로다. 용량(347MB) 때문에 의존성은
지금 빼둔 상태이고, `electron/main.cjs`·`main` 필드·`package:win` 스크립트는 남아 있다.
패키징이 필요하면 먼저 되살린다:

```bash
npm i -D electron @electron/packager
```

## 기타

- Lovable에서 옮겨온 프로젝트라 `lovable-tagger`와 `index.html`의 lovable.app OG
  이미지 URL이 남아 있다. 외부에 데모를 공개할 거면 OG 태그부터 정리할 것.
- 패키지 매니저는 npm. `bun.lockb`가 남아 있지만 쓰지 않는다.
