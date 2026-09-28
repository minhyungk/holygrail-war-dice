# AGENTS.md — 6차 성배전쟁 (가칭, 프로젝트 id: `fsn6`)

AI 코딩 에이전트의 진입점. **코드를 쓰기 전에 반드시 읽는다.**

## 1. 상태 태그 (모든 문서 공통)
| 태그 | 의미 | 에이전트 행동 |
|---|---|---|
| `[확정]` | 사용자가 결정함 | 구현한다 |
| `[제안]` | AI/논의에서 나온 후보, 사용자 미확인 | **구현하지 않는다.** 필요하면 스텁만 두고 질문한다 |
| `[TBD]` | 미정 | **구현하지 않는다.** 임의로 채우지 말고 질문한다 |
| `[임시값]` | 사용자가 AI에게 임시로 정하라고 맡긴 값 | 구현한다. 나중에 바뀔 수 있으니 constants/토큰으로만 참조한다 |

사용자가 확인하면 태그를 `[확정]`으로 바꾸고 `decisions.md`에 기록한다.

## 2. 절대 규칙
1. 문서에 없는 규칙, 수치, 대사, 이름, 효과를 **만들어 넣지 않는다.** 필요하면 멈추고 질문한다.
2. 수치는 코드에 하드코딩하지 않는다. 모든 튜닝 수치는 `constants` 데이터에만 둔다 (`docs/04-data-schema.md`).
9. 폐기된 시스템(포섭, 평판, 사건, 연합, 진영 호감도)을 구현하지 않는다. 목록은 `docs/01-glossary.md` §6.
3. 모든 참조는 ID로 한다 (서번트 이름 문자열 참조 금지). ID 규칙은 `docs/04-data-schema.md`.
4. 게임 로직(`src/engine`)은 React/DOM을 import하지 않는다. UI는 엔진 상태를 읽고 명령을 보낼 뿐이다.
5. 모든 무작위는 시드 고정 RNG 모듈 하나를 통해서만 한다 (`Math.random` 직접 사용 금지).
6. **LLM은 판정에 관여하지 않는다.** LLM은 확정된 이벤트 로그를 글로 풀어 쓰는 용도로만 쓴다 (`docs/systems/text.md`).
7. 대사·텍스트 본문을 임의로 창작하지 않는다. 필요하면 `[[PLACEHOLDER: 상황태그]]`로 남긴다. 사용자가 범위를 지정해 초안을 요청한 경우만 예외이며, 이때 쓴 대사는 반드시 `status: draft`, `author: ai`로 표시한다 (D-060).
8. 문서에 없는 기능을 추가하지 않는다. 문서와 코드가 충돌하면 **문서가 우선**이고, 충돌 사실을 사용자에게 보고한다.

## 3. 작업 순서
1. 작업과 관련된 문서를 아래 표에서 찾아 **전부** 읽는다.
2. 관련 항목에 `[TBD]`/`[제안]`이 있으면 구현 전에 질문한다.
3. 규칙을 바꿔야 하면 코드보다 먼저 해당 문서와 `docs/decisions.md`를 수정한다 (사용자 승인 후).
4. 구현한다. 각 시스템 문서의 **예시(계산 사례)를 그대로 테스트 케이스로** 만든다.
5. 끝나면 문서와 코드가 어긋나는 곳이 없는지 대조하고 결과를 보고한다.

## 4. 문서 지도
| 작업 | 읽을 문서 |
|---|---|
| 전체 맥락 | `docs/00-overview.md`, `docs/01-glossary.md` |
| 화면/흐름 | `docs/02-screens-flow.md`, `docs/03-ui-style.md` |
| 레포 구조·계층 규칙 | `docs/06-repo-structure.md` |
| 데이터 | `docs/04-data-schema.md` |
| 레거시 자산 사용 | `docs/05-legacy.md` |
| 서번트/마스터/맵 콘텐츠 | `docs/content/servants-5th.md`, `docs/content/masters.md`, `docs/content/map-fuyuki.md` |
| 주사위/판정 | `docs/systems/dice.md`, `docs/systems/stats.md` |
| 전투 | `docs/systems/combat.md`, `docs/systems/phases.md`, `docs/systems/skills.md` |
| 낮 루프/맵/적 AI | `docs/systems/day-loop.md`, `docs/systems/mana.md` |
| 호감도/전투 후 선택 | `docs/systems/affinity.md` |
| 텍스트/대사/서술 엔진 | `docs/systems/narrative-engine.md`, `docs/systems/text.md` |
| 대사 초안 작성 | `.claude/skills/typemoon-dialogue/SKILL.md` (반드시 먼저 읽기) |
| 구현 순서 | `docs/roadmap.md` |
| 결정 이력 | `docs/decisions.md` |
| 미정 사항 모음 | `docs/open-questions.md` |

## 5. 완료 조건 (Definition of Done)
- 관련 문서의 예시가 자동 테스트로 통과한다.
- 새 하드코딩 수치·문자열이 없다 (있으면 constants/데이터로 이동).
- `[확정]`이 아닌 항목을 구현하지 않았다.
- 엔진 코드가 UI 코드에 의존하지 않는다.
- 변경한 규칙은 `decisions.md`에 기록됐다.

## 6. 기술 스택과 명령
TypeScript + React + Vite, 테스트는 Vitest, 스키마는 zod (D-057, D-091). 구조는 `docs/06-repo-structure.md`.
- `npm test`: 데이터 검증과 규칙 4·5 검사가 포함된다. 작업이 끝나면 반드시 통과시킨다
- `npm run build`: 타입 검사 + 배포 빌드
