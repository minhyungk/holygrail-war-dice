# 05. 레거시 자산

기존 "성배전쟁 시뮬레이션"에서 가져온 파일(`legacy/data/`, `legacy/scripts/`)의 용도와 주의사항.
레거시 코드는 새 엔진에 그대로 import하지 않는다. **값과 데이터만** 옮겨 쓴다 (`00-overview.md` §5).

## 1. 레거시와 새 설계의 차이 (값을 옮길 때 반드시 확인)
| 항목 | 레거시 | 새 설계 |
|---|---|---|
| 주사위 | d32 | 2d10 |
| 체력 | HP 100 수치 | 상태 3단계 |
| 전투 | 턴제 + 간합(거리) + 스탠스 | 국면 자동 진행 |
| 보구 | NP 게이지 100 | 마력 50 소모 |
| 호감도 | 6단계 (적대/경계/중립/신뢰/친밀/헌신) | 5단계 (`systems/affinity.md`) |
| 일수 | 14일 | 7일 |
| 서번트 ID | 숫자 (FGO collectionNo) | `sv_` 문자열 |

## 2. 사용 결정된 것
| 자산 | 용도 | 결정 |
|---|---|---|
| `types.ts` `statRankToScore` | 특수 랭크 표기(`?`, `None`) 변환값 | [확정] D-039. `systems/stats.md` §3.3 |
| ~~`config/ai.ts` + 승률식~~ | ~~적 AI~~ | D-051로 대체 (무작위 이동). 쓰지 않음 |

## 3. 재사용 후보 [제안]
| 자산 | 내용 | 쓸 곳 |
|---|---|---|
| `legacy/scripts/fetch-servants.mjs` | Atlas Academy API에서 서번트 데이터 수집 (KR/EN/JP) | 서번트 데이터, 확장(P6) |
| `legacy/scripts/fetch-dialogues.mjs` | 소환 / 전투 개시 / 보구 영창 / 패배 / 승리 대사 수집 | 대사 데이터 |
| `servants-*.json` | 서번트 408기 스탯·스킬 이름·보구·프로필 | 서번트 원본 |
| `dialogues-*.json` | 서번트별 대사 5종 | `systems/text.md` 대사 |
| `affinityDialogues.ts` | 인연 서번트 쌍 12쌍의 조우/전투 대사 | 특정 조합 대사 (`systems/text.md` §3.2 1층) |
| `narrativeTemplates/` | 조우·전투 묘사 템플릿 | 범용 대사 |
| `memoirTemplates/` | 우승 회고록 템플릿 | AI 에필로그 폴백 (`systems/text.md` §4) |
| `text/manaSupplyText.ts` | 마력 공급 결과별 문장 | 마력 공급 대사 |
| `traits.ts` | 서번트 속성 태그 | `servants.tags` |
| `config/affection.ts` | 성격별 호감도 증감 배율 | 호감도 계수 참고 |
| `skills/classSkills.ts` | 클래스 스킬 10종 → 효과 변환 구조 | 범용 스킬 설계 참고 |
| `legacy/data/map/fuyuki.ts` | 후유키 구역/노드 지도 | 타일 맵 참고 |

## 4. 알려진 문제
| 파일 | 문제 | 조치 |
|---|---|---|
| `servantPersonality.ts` | **ID 체계가 JSON과 다름.** 주석 기준 51=헤라클레스, 42=코지로, 15=에미야인데 `servants-*.json`에서는 47, 39, 11. 그대로 쓰면 성격·초기 호감도가 엉뚱한 서번트에 붙음 | 쓰기 전에 이름 기준으로 재매핑 |
| `servants-*.json` | 에미야 보구 `?` → 레거시 값 7(A), 코지로 보구 `None` → 5(C) | 처리 확정 (D-039) |
| `servants-*.json` | 성향(alignment) 필드 없음 | `fetch-servants.mjs`에 Atlas traits 수집 추가 필요 (D-056) |
| `types.ts` `statRankToScore` | `+++`, `EX+` 등 인식 못 함 | 시작 7기 해당 없음. 확장 시 `systems/stats.md` §3.2 규칙 사용 |
| `servants-*.json` | 스킬은 이름만 있고 설명이 없거나 FGO 게임 효과임 | 스킬은 훅/조건/효과로 직접 설계 |
| `dialogues-*.json` | 5개 상황만 있음 | 나머지 상황 태그 대사는 직접 작성 |
| 템플릿 전반 | 자리표시자가 `{A}`, `{B}`, `{무기}` 등으로 새 규칙과 다름 | `systems/text.md` §3.3에서 통일 |
| `config/combat.ts`, `classes.ts`, `statuses.ts`, `mana.ts` | HP·간합·NP 게이지 기반이라 새 설계와 스케일이 다름 | 값 이식 금지, 참고만 |

## 5. 저작권
FGO 대사·이미지·프로필은 TYPE-MOON/Aniplex 저작물이다. 화면 하단에 저작권 귀속 고지를 둔다 [확정] (D-057).
