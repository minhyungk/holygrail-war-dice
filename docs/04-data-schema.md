# 04. 데이터 구조

## 1. 원칙 [확정]
- 데이터는 **JSON 파일로 직접 관리**한다 (D-022). 시트(CSV) 원본과 빌드 변환은 쓰지 않는다.
- 모든 튜닝 수치는 `constants` 한 곳에만 둔다 (AGENTS.md 규칙 2, 설계 기둥 6).
- 모든 참조는 ID로 한다. 이름 문자열로 참조하지 않는다.
- 종류(훅, 효과 종류, 조건 종류)는 코드 enum, 인스턴스(스킬, 대사, 서번트)는 데이터 (D-008).

## 2. 검증 [제안]
- JSON 로드 시(또는 테스트에서) zod 스키마로 검증한다.
- 검증 항목:
  - 존재하지 않는 `hook_id` / `effect_type` / `condition_type` / `skill_id` / `servant_id` 참조
  - 어떤 훅에도 붙지 않은 스킬 (죽은 스킬 리포트)
  - 스킬이 하나도 없는 서번트
  - 필수 상황 태그에 대사가 없는 서번트 (`systems/text.md` §3.4 기준)
  - ID 중복, 랭크 범위 이탈
  - 코드가 `constants`에 없는 키를 참조하는지

## 3. ID 규칙 [확정]
snake_case, 접두사 고정, 한 번 정하면 변경 금지.
| 접두사 | 대상 |
|---|---|
| `sv_` | 서번트 |
| `ms_` | 마스터 |
| `fc_` | 진영 |
| `sk_` | 스킬 |
| `hk_` | 훅 |
| `ph_` | 국면 |
| `tx_` | 대사 |
| `tl_` | 타일 |
| `it_` | 아이템 |

## 4. 폴더 구조 [확정] (D-063, D-064)
서번트 관련 데이터는 서번트별 폴더에 모은다. 상세: `systems/narrative-engine.md` §5.1
```
data/
  servants/{servant_id}/  profile.json, skills.json, dialogue.json, voice.md
  masters/{master_id}/    profile.json, dialogue.json, voice.md  (`content/masters.md`)
  classes/{class}/        dialogue.json
  common/                 narrator.json
  constants.json, phases.json, hooks.json, effect_types.json, condition_types.json, skills.json(스킬 정의), tiles.json, items.json, masters/…
```
- 판 시작 시 그 판에 나오는 서번트 폴더만 불러온다 (D-065)
- 서번트 ID: `sv_{FGO 번호 4자리}_{영문 이름}` [확정] (D-066)

## 4.1 데이터 파일 목록
| 파일 | 내용 | 필요 시점 |
|---|---|---|
| `constants` | 모든 튜닝 수치 | P1 |
| `servants/{id}/profile` | 서번트 스탯/성향/태그 | P1 |
| `phases` | 국면 유형 | P1 |
| `skills` | 스킬 정의 | P1 |
| `servants/{id}/skills` | 서번트 × 스킬 × 랭크 연결 | P1 |
| `effect_types` | 효과 종류 목록 (코드 enum과 동기) | P1 |
| `condition_types` | 조건 종류 목록 (코드 enum과 동기) | P1 |
| `hooks` | 훅 목록 (참조용, 원본은 코드) | P1 |
| `servants/{id}/dialogue`, `classes/{class}/dialogue`, `common/narrator` | 대사 (형식: `systems/narrative-engine.md` §5) | P2 |
| `masters` | 마스터 정의 | P2 |
| `tiles` | 맵 타일 | P3 |
| `items` | 촉매, 제작물 | P3 |

## 5. 필드 정의
`legacy/data-templates/*.csv`의 헤더를 옮겨 온 것이다. 이 문서가 기준이며, CSV 템플릿은 참고용으로만 남긴다.

### constants
| 필드 | 설명 |
|---|---|
| `key` | 도메인 접두 + snake_case (`dice.`, `combat.`, `phase.`, `affinity.`, `mana.`, `day.`, `ai.`, `skill.`, `text.`) |
| `value` | 숫자, 문자열, 또는 표(객체) |
| `unit` | 단위 |
| `doc_ref` | 근거 문서 (예: `dice.md §3.1`) |
| `status` | 확정 / 제안 / TBD |
| `note` | 비고 |

### servants
| 필드 | 설명 |
|---|---|
| `servant_id` | `sv_` |
| `name_ko` | 표시 이름 |
| `class` | 클래스 |
| `rank_str` `rank_end` `rank_agi` `rank_mana` `rank_luck` `rank_np` | 6스탯 랭크 문자열 (`systems/stats.md`) |
| `mana_pool` | 초기 마력. `systems/mana.md` §3.1 표에서 유도되므로 필드 불필요 [제안] |
| `alignment` | 성향: `good` / `neutral` / `evil` (D-056). 그 외(광기 등) 처리 [TBD]. Atlas에서 수집 |
| `temperament` | 성격 태그 (레거시 personality). 쓰임 [TBD] |
| `tags` | 속성 태그 |
| `sprite_id` `portrait_id` | 이미지 |
| `source_id` | 레거시 JSON(FGO collectionNo) 연결용 [제안] |
| `affinity_init` `affinity_coef` | 초기 호감도, 호감도 증감 계수 (`systems/affinity.md` §3.2) [제안] |

### masters
| 필드 | 설명 |
|---|---|
| `master_id` | `ms_` |
| `name_ko` | 표시 이름 |
| `faction_id` | `fc_` |
| `stats` | 마스터 스탯 (D-057). 종류 [TBD] |
| `temperament` | 성격 태그. 쓰임 [TBD] |
| `mana_pool` | 마스터 마력 |
| `reason_for_war_text_id` | 참전 이유 대사 `tx_` |
| `tags` | 태그 |
| `portrait_id` | 이미지 |

### phases
| 필드 | 설명 |
|---|---|
| `phase_id` | `ph_` |
| `name_ko` | 이름 |
| `attacker_stat` / `defender_stat` | 사용 스탯 (2개면 합산, D-018) |
| `selection_conditions` | 선택 조건 (`systems/phases.md` §3.2) |
| `notes` | 비고 |

### skills
| 필드 | 설명 |
|---|---|
| `skill_id` | `sk_` |
| `name_ko` | 이름 |
| `kind` | `generic` / `unique` / `noble_phantasm` |
| `hook_id` | 발동 훅 |
| `condition_type` + `condition_value` | 조건 종류 + 값 (자유 문장 금지) |
| `effect_type` + `effect_params` | 효과 종류 + 파라미터 |
| `rank_scaling` | 랭크 연동 여부 (범용은 Y) |
| `scaling_rule` | 랭크별 효과 크기 규칙 |
| `cost` / `cooldown` / `uses_per_battle` | 소모 / 재사용 |
| `text_id_on_trigger` | 발동 시 출력할 대사 `tx_` |
| `notes` | 비고 |

### servant_skills
| 필드 | 설명 |
|---|---|
| `servant_id` | `sv_` |
| `skill_id` | `sk_` |
| `rank` | 스킬 랭크 |
| `unlock_condition` | 해금 조건 (없으면 처음부터 보유) |

### effect_types / condition_types / hooks
| 파일 | 필드 |
|---|---|
| `effect_types` | `effect_type`, `params_schema`, `description`, `status` |
| `condition_types` | `condition_type`, `value_schema`, `description`, `status` |
| `hooks` | `hook_id`, `phase`, `description`, `order_priority`, `code_ref` |

### dialogue
| 필드 | 설명 |
|---|---|
| `text_id` | `tx_` |
| `speaker_id` | 화자 |
| `target_id` | 대상 (비우면 범용) |
| `situation_tag` | 상황 태그 (`systems/text.md` §3.4) |
| `condition_type` + `condition_value` | 추가 조건 |
| `priority` | 매칭 우선순위 |
| `text` | 본문 (자리표시자 허용, `systems/text.md` §3.3) |
| `notes` | 비고 |

### tiles
| 필드 | 설명 |
|---|---|
| `tile_id` | `tl_` |
| `name_ko` | 이름 |
| `adjacent_ids` | 인접 타일 |
| `terrain` | 지형: `open` / `urban` / `forest` / `river` (`content/map-fuyuki.md` §2) [제안] |
| `x` `y` | 좌표 |
| `tags` | 태그 (`center`, `landmark` 등) |

### items
| 필드 | 설명 |
|---|---|
| `item_id` | `it_` |
| `name_ko` | 이름 |
| `kind` | 촉매 / 제작물 |
| `effect_type` + `effect_params` | 효과 |
| `text_id` | 대사 `tx_` |

## 6. 정리 대상
- `legacy/data-templates/events.csv`, `contracts.csv`: 사건·연합 폐기(D-024)로 불필요
- `legacy/data-templates/masters.csv`의 `base_affinity_to_player`: 진영 호감도 폐기(D-029)로 불필요
- `legacy/data-templates/` 폴더는 당분간 유지 (D-057)
