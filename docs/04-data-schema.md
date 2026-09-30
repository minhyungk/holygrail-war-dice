# 04. 데이터 구조

## 1. 원칙 [확정]
- 데이터는 **JSON 파일로 직접 관리**한다 (D-022). 시트(CSV) 원본과 빌드 변환은 쓰지 않는다.
- 모든 튜닝 수치는 `constants` 한 곳에만 둔다 (AGENTS.md 규칙 2, 설계 기둥 6).
- 모든 참조는 ID로 한다. 이름 문자열로 참조하지 않는다.
- 종류(훅, 효과 종류, 조건 종류)는 코드 enum, 인스턴스(스킬, 대사, 서번트)는 데이터 (D-008).
- **범용 우선.** 서번트별 차이는 범용 → 유형·특성 → 개별 오버라이드 3층의 데이터로만 표현한다 (D-143, §7).

## 2. 현재 검증과 남은 검증
- `src/data/schema.ts`의 zod 스키마로 JSON을 검증한다. constants 키별 값 형식은 `src/data/constants.ts`에서 검증한다 (D-091).
- 현재 검사: 프로필 ID·랭크, 대사 형식·태그 안 ID 중복·자리표시자·사실 네임스페이스, constants 중복·값 형식, 국면 목록, 타일 인접 ID·중앙 타일.
- 없는 constants 키 참조는 타입 검사에서 검출한다.
- **구현 (D-142):** 스킬 효과 정의 스키마 검증, 보유 스킬 43개의 정의 존재 검사, 고정량 스킬의 constants 키 검사.
- **미구현:** 필수 대사 태그 커버리지, 사실 이름 전체 목록 검증, `classes/*/dialogue.json`의 자동 테스트 (현재 `data.test.ts` 목록에 없음). 필수 태그 기준은 Q-50이다.

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

## 4. 현재 데이터 파일 (D-063, D-064, D-137)
```text
data/
  servants/{servant_id}/  profile.json, skills.json, dialogue.json, voice.md
  masters/{master_id}/    profile.json, dialogue.json, voice.md
  classes/{class}/       dialogue.json
  common/                narrator.json, speech.json, beats.json, labels.json, summon.json
  constants.json
  phases.json
  tiles.json
```
- 서번트 ID: `sv_{FGO 번호 4자리}_{영문 이름}` (D-066). 판 시작 시 해당 판의 서번트·마스터 데이터를 불러온다 (D-065).
- `classes/{class}/dialogue.json`: 클래스 공통 대사. 7클래스 초안이 있다 (D-143, draft).
- 전역 스킬 효과 정의는 `data/common/skills.json`에 있다 (D-142, 형식은 아래 skills). `hooks`는 코드 `src/engine/hooks.ts`와 `schema.ts`의 `HOOK_IDS`, 효과·조건 종류는 `schema.ts`의 `SkillEffect`·`SkillWhen`으로 정의한다. `effect_types.json`, `condition_types.json`, `items.json`은 **예정 파일이며 현재 없다**. 현재 촉매 소환은 서번트 선택 방식이다.

### 파일별 역할
| 파일 | 내용 |
|---|---|
| `constants.json` | 판정·자원·AI·텍스트 튜닝 값 |
| `phases.json` | 국면 유형·사용 스탯·선택 방식 |
| `tiles.json` | 맵 25칸·역할·인접 관계·이미지 격자선 |
| `servants/{id}/profile.json` | 스탯·성향·성격·보구·이미지 |
| `servants/{id}/skills.json` | 보유 스킬 이름·랭크 목록 (효과 정의 아님) |
| `masters/{id}/profile.json` | 이름·출전·성향·미정 스탯·초상 슬롯 |
| `*/dialogue.json`, `common/narrator.json` | 태그별 대사·서술문 |
| `common/speech.json` | 서번트 공통 대사 (3층, D-151) |
| `common/beats.json` | 이벤트별 비트 크기·슬롯·조건 |
| `common/labels.json` | 클래스 이름·문장·미공개 호칭 등 |
| `common/summon.json` | 소환 영창과 작성·검수 정보 |

## 5. 필드 정의
현재 JSON·스키마와 맞춘 필드 목록이다 (D-137). CSV 템플릿은 레거시 참고용이다. 아래에서 예정으로 표시한 스킬·아이템 정의는 아직 구현하지 않는다.

### constants
파일: `data/constants.json` = `{ "constants": [ {key, value, unit, doc_ref, status, note}, … ] }`. `status`는 `확정` / `임시값`만 (제안·TBD 값은 넣지 않는다).
| 필드 | 설명 |
|---|---|
| `key` | 도메인 접두 + snake_case (`dice.`, `combat.`, `phase.`, `affinity.`, `mana.`, `day.`, `ai.`, `skill.`, `text.`, `stats.`) |
| `value` | 숫자, 문자열, 또는 표(객체) |
| `unit` | 단위 |
| `doc_ref` | 근거 문서 (예: `dice.md §3.1`) |
| `status` | 확정 / 임시값 |
| `note` | 비고 |

### servants — `profile.json`
| 필드 | 설명 |
|---|---|
| `servant_id`, `source_id` | 서번트 ID, FGO collectionNo |
| `name_ko`, `name_short_ko?` | 이름, 같은 비트 안에서 다시 부를 때의 축약명 |
| `class` | 7클래스 enum |
| `ranks` | `{str, end, agi, mana, luck, np}` 랭크 문자열 객체 |
| `alignment` | good / neutral / evil / null. 광기 등 null은 판정에서 중립 취급 (D-079) |
| `alignment_detail`, `alignment_verified` | 원문 성향·검증 여부 |
| `temperament` | 초기 호감도·증감 계수를 조회하는 성격 키 |
| `reaction_overrides?` | 선택 반응(`affinity.reaction`)의 서번트별 예외. 선택 이름 → 호감도 변화 (D-150, D-143 오버라이드) |
| `noble_phantasm` | `{name_ko, ruby_ko, rank, type_ko, special_attack}`. `special_attack`: 보구 특공 대상 Atlas 특성 id 배열 (없으면 `[]`, D-162) |
| `traits` | Atlas 서번트 특성 id 배열 (특공 판정용, D-162) |
| `instant_death` | FGO 보구·스킬에 즉사 효과가 있나 (즉사/우연 국면 발생 조건, D-163) |
| `lore?` | `{detail, weakness?}`. `detail`: Atlas KR 캐릭터 상세 (소환 화면·범용 약점 문구). `weakness?`: 약점 문구 오버라이드 (D-158, D-165) |
| `images` | `{face, summon, final}` Atlas URL (D-116) |
| `sprite_id` | 나중에 교체할 스프라이트 ID, 현재 null |
| `notes?` | 출처·검수 메모 |

초기 마력은 ranks.mana에서 계산한다. 초기 호감도·계수는 constants에 있다. `mana_pool`, `rank_str`, `portrait_id`, `affinity_init` 필드는 현재 프로필에 없다.

### masters — `profile.json`
| 필드 | 설명 |
|---|---|
| `master_id`, `name_ko` | ID·이름 |
| `source_work` | 출전 작품 |
| `temperament` | aggressive / proud / cautious / cunning. 전투 수락·위험 퇴각 판단 |
| `stats` | `{aptitude: null, mana: null}`. Q-152 확정 전 null만 허용 |
| `portrait` | `{atlas_url, local}`, 각각 문자열 또는 null |
| `notes?` | 메모 |

진영 ID는 판 시작 때 엔진이 부여한다. 프로필에 `faction_id`, `mana_pool`은 없다.

### phases
| 필드 | 설명 |
|---|---|
| `phase_id` | `ph_` |
| `name_ko` | 이름 |
| `attacker_stat` / `defender_stat` | 사용 스탯 (2개면 합산, D-018) |
| `kind` | `contest`(대항) / `solo`(방어측 단독 판정, `ph_fate`) (D-097) |
| `selection` | 선택 방식: `terrain`(지형 추첨) / `np_both` / `np_one` (`systems/phases.md` §3.2) |
| `notes` | 비고 |

### skills — `data/common/skills.json` (D-142)
현재 형식: `{notes?, skills: [...]}`. 원소는 `skill_id`, `hook`(null이면 전투 효과 없음 + `notes`에 이유), `when`(조건 객체, `skills.md` §5), `effect`(`{type, target, ...}`), `scaling`(`major`/`minor`/`fixed`/`none`), `uses_per_battle?`, `notes?`. 수치는 constants `skill.rank_amount`·`skill.fixed_amount`에만 둔다. 서번트 보유 스킬 43개는 모두 정의가 있어야 한다 (테스트).

아래는 처음 계획한 필드다 [제안]. `text_id_on_trigger`, `cost`·`cooldown`은 아직 없다.
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

### servant_skills — 현재 `servants/{id}/skills.json`
파일은 `{servant_id, skills: [...], notes?}`.
| skills 원소 필드 | 설명 |
|---|---|
| `skill_id`, `name_ko` | ID·이름 |
| `rank` | 문자열 또는 null |
| `kind` | generic / unique / noble_phantasm |
| `origin` | 클래스·개인 스킬 등 출처 구분 |

훅·조건·효과·unlock_condition은 이 파일에 없다.

### effect_types / condition_types / hooks — 예정 정의 [제안], 현재 미구현
| 파일 | 필드 |
|---|---|
| `effect_types` | `effect_type`, `params_schema`, `description`, `status` |
| `condition_types` | `condition_type`, `value_schema`, `description`, `status` |
| `hooks` | `hook_id`, `phase`, `description`, `order_priority`, `code_ref` |

### dialogue — 현재 형식
파일은 `{speaker, scope?, defaults, tags, notes?}`. `tags`는 태그 ID → 대사 배열이다.
- 대사 원소: `id`, `text`, `when?`, `weight?`, `repeat?`, `status?`, `author?`, `source?`, `quote_of?`, `quote_verified?`, `tone?`, `slot?`, `speaker?`, `motif?`, `notes?`.
- `defaults`와 각 줄을 합쳐 사용한다. 줄의 `speaker`는 서번트 파일 안 나레이션을 위한 `narrator`만 허용한다.
- text_id는 `tx_{소유자}_{태그}_{id}`로 생성한다. `target_id`, `priority`, `condition_type` 대신 `when`과 조건 수·계층·가중치를 사용한다.
- 자세한 선택·검수 규칙은 `systems/narrative-engine.md` §5~§7.

### tiles — 현재 `tiles.json`
파일은 `{notes?, image_grid, tiles}`.
| 타일 필드 | 설명 |
|---|---|
| `tile_id`, `name_ko` | 타일 ID·이름 |
| `row`, `col` | 1부터 시작하는 행·열 |
| `adjacent_ids` | 상하좌우 인접 타일 ID |
| `terrain` | open / urban / forest / river |
| `role` | leyline / intel / bond. 밤을 마친 칸의 역할이 다음 날 보너스 (D-145) |
| `tags` | center, landmark 등 |

`image_grid`는 `{size, cols, rows}`. cols·rows는 이미지 격자선 픽셀 좌표 각 6개 (D-125).

### 공통 연출 파일
- `beats.json`: `{notes?, beats}`. 각 이벤트는 `{size, style?, slots}`. 슬롯은 `slot`, `from`, `tag` 또는 `tag_by`, 선택 조건 `if`, `when_has`, `when_lacks`, `protected`를 사용한다.
- `labels.json`: `class_name`, `unknown_servant`, `player_master`, `class_glyph`, `image_tokens`, `notes?`.
- `summon.json`: `author`, `status`, `source`, `quote_of?`, `lines`, `notes?`. 사용자 제공 영창 (D-118).

### items — 예정 정의 [제안], 현재 미구현
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

## 7. 범용 우선 3층 구조 [확정] (D-143)
서번트 풀은 Atlas 수록 서번트 약 400기까지 확장을 전제로 한다. 시작 7기는 프로토타입이다.
서번트에 관한 규칙·콘텐츠는 아래 3층으로 해석한다. 위층 데이터가 있으면 위층을 쓰고, 없으면 아래층으로 떨어진다.

| 층 | 단위 | 작성 방식 | 필요 여부 |
|---|---|---|---|
| 1. 개별 오버라이드 | 특정 서번트 (예: 아킬레우스 발뒤꿈치, 헤라클레스 12시련) | 직접 작성. 유명 서번트만 | 선택 |
| 2. 유형·특성 | 클래스, 성향(`alignment`), 성격(`temperament`), Atlas 특성(traits) | 유형별로 한 번 작성 + 서번트마다 분류 필드 | 분류 필드는 필수, 유형별 콘텐츠는 권장 |
| 3. 범용 기본값 | 모든 서번트 | 스탯·랭크 등 필수 데이터로 계산하는 규칙, 공통 나레이션 | 필수 (항상 존재) |

### 7.1 규칙
1. **3층만으로 동작한다.** 1·2층 데이터가 없는 서번트도 한 판을 끝까지 진행할 수 있어야 하며, 오류나 빈 출력이 생기면 안 된다.
2. **오버라이드는 데이터로만.** 공용 어휘(훅·조건·효과 종류, 대사 `when`의 사실 이름)를 조합해 표현한다. 서번트 ID로 분기하는 코드는 쓰지 않는다 (AGENTS.md 규칙 10). 어휘로 표현할 수 없으면 서번트 전용 코드가 아니라 범용 어휘를 추가한다 (D-008).
3. **7기에 특화하지 않는다.** 새 시스템 문서에는 "7기 밖의 서번트는 어느 층으로 동작하는가"를 적는다.
4. 대사·나레이션은 계층을 먼저 고른다. 서번트 전용 대사가 맞으면 조건이 더 많은 클래스·공통 대사보다 우선한다 (D-144, `systems/narrative-engine.md` §6.1).

### 7.2 시스템별 적용
| 시스템 | 3층 범용 | 2층 유형·특성 | 1층 오버라이드 | 현재 상태 |
|---|---|---|---|---|
| 대사 | 공통 나레이션 `common/narrator.json`, 서번트 공통 대사 `common/speech.json` | 클래스 대사 `classes/{class}/dialogue.json`, Atlas 보이스 자동 수집 (`scripts/fetch-voices.mjs`) | 서번트 `dialogue.json`, 조합 대사, `voice.md` | 3층 모두 구현 (D-144, D-151). 클래스·공통 대사는 draft |
| 스킬 | Atlas 버프 종류 → 규칙표 자동 배정 (D-157, `skills.md` §14) | 범용 스킬 (`kind: generic`, 랭크 연동) | 고유 스킬·보구 개별 정의 | 43개 정의 (D-142). 현재 검증은 보유 스킬 전부의 정의를 요구한다 |
| 호감도 | 공통 증감 `affinity.delta_*` | 성격별 초기값·계수, 성향별 처치/방면, 성격별 선택 반응 `affinity.reaction` (D-150) | `profile.json` `reaction_overrides` (예: 코지로) | 구현 |
| 약점 | 진명을 알면 전투당 1회 가장 유리한 국면으로 (D-148) | Atlas 특성 상성 [제안] | 개별 약점 [제안] | 3층 구현 |
| 프로필·이미지 | Atlas 자동 수집 | — | — | 7기 생성 완료. 수집 스크립트 확장 필요 (`05-legacy.md` §3) |

### 7.3 서번트 추가 기준
| 등급 | 항목 | 방법 |
|---|---|---|
| 필수 | `profile.json` (스탯, 클래스, 보구, 이미지, 성향), `skills.json` (스킬 이름·랭크) | 수집 스크립트 자동 생성 |
| 권장 | FGO 보이스 대사 (전투 외침·인연·좋아하는 것 등) | `node scripts/fetch-voices.mjs {servant_id}` (D-151) |
| 필수 | `temperament` 분류 (현재 8종, `affinity.init_by_temperament`), `alignment` 검증 | AI 초안 → 사용자 검수 |
| 선택 | 전용 대사, `voice.md`, 고유 스킬 효과, 약점, 조합 대사 | 직접 작성 (유명 서번트만) |
- 검증 (D-157 구현): 편입 서번트 전원을 촉매로 골라 한 판씩 헤드리스 실행해 오류·빈 자리표시자·진명 누출이 없는지 확인한다 (`narrative.test.ts`).

### 7.4 확장용 원본 보관 [확정] (D-152)
`data/servants-pool/{servant_id}/`는 Atlas KR 원본을 서번트별로 보관하는 준비 영역이다. `source.json`에 프로필·스킬 이름·특성·Atlas 이미지 URL, `voice-lines.json`에 음성 대사 원문과 원본 상황명·보이스 ID를 둔다. 음성 파일은 보관하지 않는다. 레거시 `servants-ko.json`·`dialogues-ko.json`은 Atlas 누락 항목의 보조 자료로 쓴다.
재수집 명령은 `npm run prepare:servants`다. `manifest.json`에 상세 응답 실패와 원본 대사·이미지 누락을 기록한다.

이 영역은 `data/servants/`와 분리한다. 편입은 D-157로 100기를 했다: 명단 `activation/roster.json`, 분류표 `activation/meta.json`(AI 초안), 순서는 `node scripts/activate-profiles.mjs` → `node scripts/activate-skills.mjs` → `node scripts/fetch-voices.mjs {id…}`. 특성·특공·즉사·캐릭터 상세는 `node scripts/enrich-profiles.mjs --atlas <Atlas 캐시>`로 채운다 (D-162, D-163, D-165). 준비 자료 자체는 판 로더에 포함되지 않는다. 신규 서번트를 활성화할 때는 스키마에 맞춘 파일을 `data/servants/{id}/`로 생성하고 성향·성격·스킬 효과·대사 검수 등 §7.3의 미정 항목을 먼저 해결한다. 클래스 범위 확장도 별도 결정이 필요하다. 준비 원본의 대사는 검수 전 게임 대사로 사용하지 않는다.
