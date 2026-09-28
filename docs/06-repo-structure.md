# 06. 레포 구조
상태: [확정] (D-091)

## 1. 트리
```
AGENTS.md                에이전트 진입점 (먼저 읽기)
README.md                실행 방법
docs/                    기획 문서 (규칙의 원본)
  00~06-*.md             개요, 용어, 화면, UI, 데이터, 레거시, 레포 구조
  systems/               시스템별 규칙 (dice, combat, narrative-engine …)
  content/               콘텐츠 설계 (서번트 7기, 마스터, 맵)
  guides/                대사 작성 가이드 (스킬 링크)
  decisions.md           결정 로그
  open-questions.md      사용자가 답할 미정 사항
  archive/               지난 답변 원본
data/                    게임 데이터 (JSON, D-022). 사람이 편집하는 콘텐츠
  servants/{sv_id}/      profile · skills · dialogue · voice (D-063)
  masters/{ms_id}/       profile · dialogue · voice
  common/                공통 나레이션
  tiles.json             맵 25칸
public/assets/           정적 이미지 (빌드에 그대로 복사)
  map/                   후유키 타일 (낮 / 밤)
  seals/                 영주 획수별 이미지
src/                     게임 코드 (TypeScript)
  engine/                판정 엔진. 순수 TS (React/DOM 금지)
  narrative/             서술 엔진. 순수 TS
  data/                  데이터 스키마(zod)와 판 단위 로더. 순수 TS
  ui/                    React 화면, 디자인 토큰
  architecture.test.ts   AGENTS.md 규칙 검사
prototype/               검증용 임시 도구 (서술 시뮬레이터, 화면 목업)
legacy/                  레거시 자산 (코드 공유 안 함, 값·데이터만 참고. 05-legacy.md)
  data/  scripts/  data-templates/
.claude/skills/          AI 작성 가이드 (대사·나레이션)
.github/workflows/       GitHub Pages 배포
```

## 2. 계층 규칙
| 계층 | 할 수 있는 것 | 할 수 없는 것 |
|---|---|---|
| `src/engine` | 규칙 계산, 이벤트 생성, `rng.ts` 사용 | React/DOM/UI import, `Math.random` |
| `src/narrative` | 이벤트를 읽어 대사·나레이션 선택 | 게임 결과 변경, React/DOM/UI import |
| `src/data` | JSON 로딩·검증 | React/DOM/UI import |
| `src/ui` | 엔진 상태를 읽고 명령을 보냄 | 규칙 계산 |
- `src/architecture.test.ts`가 import와 `Math.random` 사용을 검사한다. 어기면 테스트가 실패한다

## 3. 데이터 규칙
- 모든 데이터 파일은 `src/data/data.test.ts`가 검증한다: ID 규칙, 대사 형식, 태그 안 id 중복, 자리표시자 목록, 사실 이름의 네임스페이스
- 판마다 필요한 서번트·마스터 폴더만 불러온다 (D-065, `src/data/load.ts`)
- 튜닝 수치는 `data/constants.json`에만 둔다 (AGENTS.md 규칙 2). 파일은 판정 엔진 구현(P2)에서 만든다

## 4. 배포
`main` 브랜치에 push하면 GitHub Actions가 테스트 → 빌드 → GitHub Pages 배포를 한다 (Q-141). 경로 기준은 상대 경로(`base: './'`)라 저장소 이름과 무관하다.

## 5. 다국어 대비 (D-086)
지금은 한국어만 쓴다. 대사 본문은 `data/` JSON에, 화면 문구는 `src/ui`에 있다. 다국어를 넣을 때는 화면 문구를 한 파일로 모으고, 대사 파일은 언어별로 나누는 방식을 쓴다 [제안].
