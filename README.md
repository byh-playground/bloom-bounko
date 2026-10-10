# BOUNKO · 바운코

블룸 세계관의 탑다운 2D 물리 액션 공 튕기기 게임입니다. 잔상을 보내 조준·충전하고, 타이밍에 맞춰 몸체를 돌진시켜 적과 충돌합니다. 전장을 탭해 구르며 피하고, 처치로 모은 성장 자원으로 기술과 기본 능력치를 강화합니다.

게임·스타일·도움말·상세 위키는 `index.html` 하나에 들어 있습니다. 현재 버전 **0.10.2**는 지정된 원본 Candidate를 이관한 등록본입니다. 아래 대표 사용자 흐름을 실제 브라우저로 확인했으며, 등록 상태는 Candidate를 유지하며, 공개 배포 구성은 아래에서 안내합니다.

## 실행

저장소를 내려받아 정적 HTTP 서버로 제공합니다. Node.js가 설치된 환경에서는 다음 명령으로 실행할 수 있습니다.

```sh
git clone https://github.com/byh-playground/bloom-bounko.git
cd bloom-bounko
npx --yes http-server . -p 8000 -c-1
```

브라우저에서 `http://localhost:8000/`을 열고 **게임 시작**을 선택합니다. 외부 라이브러리의 최초 로딩에는 인터넷 연결이 필요합니다. 공개 실행: **[BOUNKO](https://byh-playground.github.io/bloom-bounko/)**.

## 플레이와 조작

| 입력 | 동작 |
| --- | --- |
| 화면 아래 공격 버튼 / Space / Enter | 준비 상태에서 자동 조준 잔상을 발사하고, 잔상이 진행 중이면 그 방향으로 돌진합니다. 잔상의 이동과 목표까지 남은 거리에 따라 차지가 진행됩니다. |
| 전장 클릭 / 탭 | 해당 방향으로 구르며 이동·회피합니다. 공격 중 구르기는 진행 중인 공격을 취소합니다. |
| 대기 | 판을 마치고 대기 화면으로 돌아갑니다. |
| 설정 | 물리 실험 설정을 엽니다. 플레이 중에는 시뮬레이션이 일시정지됩니다. |
| 대기 화면의 업그레이드 / 도움말 / 상세 위키 | 성장 기술·능력치, 빠른 조작 설명, 전체 게임 규칙을 확인합니다. |

잔상 발사에는 현재 체력의 10%가 소모됩니다. 공격 성공 시 체력을 회복하며, 피해는 실제 충돌 속도로 계산합니다. 자세한 타이밍·반동·회피·보스·성장 규칙은 내장 위키를 참조합니다.

누적 처치·해금 기술·능력치 강화는 같은 브라우저와 같은 주소의 로컬 저장소에 보관됩니다. 진행 중인 판의 위치와 체력은 저장하지 않습니다. 기존 저장 키 `bloom-impulse-progression-v3`와 데이터 형식은 유지했습니다.

## 원본과 의존성

- 지정된 원본: `BLOOM_IMPULSE_0.10.2.html`, 279,094 bytes. 기존 Library 메타데이터는 버전 2, 2026-10-10 02:31:08.821802 UTC 갱신입니다. 직접 첨부를 통해 게시된 최초 등록 원본과 바이트 해시를 대조했습니다.
- 최초 원본 커밋: `7919b0c80e8dac8d6e16beced368010e7fcdbf16`.
- 원본 BUILD_ID: `20261010T102147+0900-shadow-contact-recoil`.
- 원본 SHA-256: `37e85266bd68a823fd0268785b5ecf554a7bb0f915b238fd80e9877d596ecd0a`.
- 현재 BUILD_ID: `20261010T031928Z-bounko-registration`.
- 현재 `index.html` SHA-256: `6be42151ed11ffdcc965131f1abfc436fafc846ea64328e1ee1503b903e34a30`.

| 의존성 | 실제 사용 경로 |
| --- | --- |
| Matter.js 0.20.0 | [jsDelivr npm 빌드](https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js) |
| Bloom GameKit | 커밋 `d1e2c385033ad04a7a004cfbe9558948ef07a6d1`의 루트 [rendering.js](https://github.com/byh-playground/bloom-gamekit/blob/d1e2c385033ad04a7a004cfbe9558948ef07a6d1/rendering.js), [input.js](https://github.com/byh-playground/bloom-gamekit/blob/d1e2c385033ad04a7a004cfbe9558948ef07a6d1/input.js), [simloop.js](https://github.com/byh-playground/bloom-gamekit/blob/d1e2c385033ad04a7a004cfbe9558948ef07a6d1/simloop.js) |

GameKit은 위 고정 커밋의 루트 ESM을 jsDelivr에서 가져옵니다. 초기 이관에서는 제목·대기 화면·접근성 이름·내장 위키를 BOUNKO로 정리하고, 실제 루트 import와 맞도록 의존성 설명을 수정했습니다. 게임 실행 모듈은 BUILD_ID 외에 원본과 동일하며, 밸런스·메커니즘·저장 계약을 유지했습니다. `.gitattributes`로 HTML의 LF 줄바꿈을 고정했습니다.

## Pages 정적 배포

[Pages workflow](.github/workflows/pages.yml)는 main 변경과 수동 실행에서 검증한 HTML을 정적 파일로 게시합니다. 한 job에서 checkout → Pages 설정 → 파일 준비 → artifact 업로드 → 배포를 수행합니다. 별도 게임 빌드나 테스트 매트릭스는 추가하지 않습니다.

배포 파일은 index.html, build.json, .nojekyll입니다. HTML은 저장소의 바이트를 그대로 사용하며, [build.json](https://byh-playground.github.io/bloom-bounko/build.json)에 배포 커밋·UTC 빌드 시각·게임 버전·BUILD_ID·HTML SHA-256을 자동으로 기록합니다. HTML의 BUILD_ID는 검증한 게임 원본을, build.json의 commit은 그 파일을 게시한 커밋을 식별합니다. 배포 상태는 저장소의 Actions에서 확인합니다.

GitHub Pages의 게시 소스는 Settings → Pages → Build and deployment → GitHub Actions입니다. 정적 파일 게시가 성공한 뒤에도 실제 공개 주소의 라이브러리 로딩과 부팅을 별도로 확인합니다.

## 개발 기준

[공통 개발 규칙](https://github.com/byh-playground/bloom-reference/blob/main/rules/development.html)과 [공통 프로젝트 관리 규칙](https://github.com/byh-playground/bloom-reference/blob/main/rules/project-management.html)을 참조합니다. 검증 정책의 원본은 [관리 규칙 §13](https://github.com/byh-playground/bloom-reference/blob/main/rules/project-management.html#verification)입니다. 후속 변경은 브랜치와 Draft PR에서 작업합니다.

## 실제 검증 범위

2026-10-10, 독립 Microsoft Edge 154.0.4258.62 프로세스·임시 프로필, 1000×800 화면, 실제 NVIDIA ANGLE/D3D11 WebGL 1 경로에서 대표 E2E가 **PASS (8.928초)** 했습니다. 실제 Matter.js 0.20.0과 위 고정 GameKit 모듈을 로드했으며 모의 라이브러리·게임 상태 강제 변경을 사용하지 않았습니다.

- 부팅 → BOUNKO 위키 → 게임 시작 → 전장 탭 회피 이동 → 잔상 발사·접촉 반동 → 충전 돌진 → 전투 → 대기 복귀 → 새로고침 후 성장 저장 복구.
- 회피 1회, 잔상 발사 4회, 명중 3회, 처치 1회와 적의 실제 반동 이동을 관측했습니다. 처치 1은 새로고침 후에도 유지됐습니다.
- 게임 JavaScript 오류는 없었습니다. 선택적 `/favicon.ico` 요청의 404는 비치명적 리소스 경고로 기록했습니다.
- 모바일 기기, 보스 클리어, 기술 해금 전체, 장시간 플레이, 기존 다른 주소의 저장 전달은 미검증입니다. FPS·성능 개선이나 전체 무회귀를 주장하지 않습니다.

실제 체크포인트·의존성·실패 시도·제한은 [검증 기록](docs/verification-2026-10-10.json)에 남겼습니다. 앞선 Chrome 탭의 1 FPS 제한 시도와 선택적 favicon을 치명적 오류로 분류했던 최초 실행도 기록에 포함됩니다.
