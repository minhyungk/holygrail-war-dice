# 서술 엔진 (Narrative Engine)
상태: 파이프라인·선택·정보 가림·비트 [확정] (D-104), 도구·일부 기억 사실은 미구현 · 관련: text.md, combat.md, day-loop.md, 03-ui-style.md · constants 접두: `text.`

## 1. 목적 [확정] (D-058)
이 게임의 **대표 기술**. 방대한 사전 작성 대사집을 상황·기억에 맞춰 골라 조립해서, AI와 대화하는 것처럼 느껴지는 상황 묘사를 **결정론으로** 만든다.
- 같은 시드 + 같은 입력 = 같은 서술 (재현, 테스트, 시드 공유)
- 런타임에 AI를 부르지 않는다 (Jev 보조는 2순위, §11)

"AI 같다"는 느낌은 네 요소에서 나온다:
| 요소 | 플레이어 체감 | 구현 위치 |
|---|---|---|
| 기억 | "그 일을 기억하네" | §4.3 기억 사실 |
| 맥락 매칭 | "상황에 딱 맞는 말" | §6 선택 |
| 반복 없음 | "매번 다른 말" | §6 최근 사용 제외 |
| 살아 있는 세계 | "안 본 곳에서도 일이 벌어지네" | §8.2 소문 |

## 2. 파이프라인 [확정] (D-104)
```
GameEvent ─► ① 사실 수집 ─► ② 후보 필터 ─► ③ 점수·선택 ─► ④ 문장 조립 ─► TextBox
              (상태 + 기억)    (조건 전부 충족)  (구체성, 가중치,   (자리표시자,
                                              최근 사용 제외,     정보 가림,
                                              시드 RNG)         조사 처리)
                                   ▲
                         ⑤ 연출 감독: 비트별 줄 수, 강도
선택된 대사는 Narrator.spoken에 LineSpoken 기록으로 남는다 (판정 이벤트 로그와 분리)
```
- 엔진(`src/engine`)이 이벤트를 만들고, 서술 엔진은 이벤트를 **읽기만** 한다. 서술 엔진은 게임 결과에 영향을 주지 않는다 (AGENTS.md 규칙 6과 같은 원칙).
- 서술 엔진의 무작위도 시드 RNG 모듈을 쓰되, 판정용 RNG와 **스트림을 분리**한다 [확정] (D-104). 대사가 바뀌어도 전투 결과가 바뀌지 않게 하려는 것.

## 3. 이벤트 로그 스키마 [확정] (D-096, Q-52 승인)
게임 상태 변화는 모두 이벤트로 기록한다. 서술 엔진, 에필로그, 저장/재현, 커버리지 시뮬레이터가 이 로그를 읽는다.

### 3.1 공통 필드
| 필드 | 설명 |
|---|---|
| `seq` | 판 안에서 증가하는 번호 |
| `day` | 일차 (1~7) |
| `time` | `day` / `night` / `final` |
| `action` | 낮·밤 행동 1~3, 시간대 시작·아침 공급은 0, 밤 종료 처리는 4. 강제 전투에서는 라운드 번호 |
| `type` | 이벤트 종류 (§3.2) |
| `actors` | 관련 진영 ID 목록 (`fc_`) |
| `data` | 종류별 내용 |

### 3.2 이벤트 종류
| 분류 | type | data 주요 필드 |
|---|---|---|
| 판 | `run_started` | seed, 플레이어 진영, 적 진영 조합, 소환 방식 |
| | `run_ended` | result(`victory`/`defeat`), 우승 진영 |
| 시간 | `day_started`, `night_started` | |
| | `condition_recovered` | 진영, 이전/이후 상태, cause(`night`/`supply`) |
| | `mana_regenerated` | 진영, 증가량 |
| 낮 행동·보구 공개 | `action_started` | 플레이어의 판정 행동 시작: 진영, action(`bond`/`intel`/`supply`), 타일, 대상(정보 수집). 판정·재굴림 질문보다 먼저 기록해 도입 나레이션을 먼저 보인다 (D-141) |
| | `intel_gained` | 대상, 이전/이후 단계, cause(`intel`/`np`/`encounter`/`battle`), 결과·굴림·DC. 보구 공개는 개방 직후, 조우 자동 공개는 조우 직후, 결판 없는 전투 보상은 전투 종료 직후 기록 (D-137, D-147) |
| | `mana_supplied` | 결과 구간, 마력 전/후, 굴림. 호감도는 별도 affinity_changed |
| | `bond` | 결과, 굴림, DC. 호감도는 별도 affinity_changed |
| | `waited` | 머문 진영 |
| | `moved` | 진영, from, to, path(타일 ID 배열) |
| 관계 | `affinity_changed` | 이전/이후 수치, 단계 변화, 원인 |
| | `refused` | 거부한 명령 |
| | `betrayal_attempted`, `betrayal_blocked` | 영주 사용 여부 |
| 조우 | `encounter` | 타일, 지형, 진영들, 기습 여부 |
| | `escape_attempted` | 성공 여부, 판정값 |
| 전투 | `battle_started` | 전투 ID, 타일, 지형, 강제 전투 여부, 플레이어 전투의 승률 예측용 스냅샷(D-139) |
| | `phase_started` | 국면 번호, phase_id, 공격측, 공개된 국면 시점의 승률 예측용 스냅샷(D-139) |
| | `np_opened` | 진영, 영주 사용 여부 |
| | `weakness_used` | 약점 공략: 진영, 대상, 국면 번호, 고른 국면 유형 (D-148) |
| | `phase_rolled` | 양측 자연값, 보정, 판정값, 기적 여부, 운명점 재굴림 여부 |
| | `phase_resolved` | 승자·패자, 차이, 피해 단계, 실제 도달 상태, skipped/defended. 위험 진입은 danger, 위험에서 패배는 below (D-137) |
| | `condition_changed` | 진영, 이전/이후 상태 |
| | `seal_used` | 용도(`np`/`escape`/`block_betrayal`), 남은 획수. `buff`는 D-142로 폐지 |
| | `skill_triggered` | 스킬 자동 발동: 진영, skill_id, 랭크, 효과 종류, 효과량, 받은 진영, 마력 변화 뒤 값 (D-142). 판정 보정은 굴림보다 먼저 기록한다. 효과 해설과 양측 외침 비트 (D-153) |
| | `battle_ended` | 결과(`win`/`draw`/`escape`/`escape_failed`), 승자·패자·사망·도주 진영 |
| | `danger_decided` | 위험 진입 시 선택(fight/seal/run) |
| | `post_choice` | `execute`/`release`, 대상 |
| 세계 | `eliminated` | 진영, 탈락 원인, 가해 진영 |
| | `final_started` | 중앙 타일, 소집 진영 |
| | `npc_battle_resolved` | 적끼리 전투 요약 (플레이어가 모름) |
| | `final_battle_bracket` | 대진표 |
| 서술 별도 기록 | `LineSpoken` (`Narrator.spoken`) | text_id, speaker, slot, cause_seq. 판정 이벤트는 아님 |

## 4. 사실 (Facts) [제안]
대사 조건에 쓰는 어휘. 이벤트와 상태에서 순수 함수로 계산한다.

### 4.1 현재 상황
| 네임스페이스 | 예 |
|---|---|
| `event.*` | `event.type`, `event.phase_id`, `event.margin`, `event.miracle`, `event.result`(`success`/`fail`, 낮 행동 결과), `event.intel_level`(정보 수집으로 오른 단계), `event.purpose`(영주 용도), `event.phase_id`, `event.condition_to`(`full`/`hurt`/`danger`), `event.choice`(`execute`/`release`), `event.rumor`, `event.rumor_known`(소문의 당사자를 플레이어가 아는가) |
| `self.*` (화자 진영) | `self.servant`, `self.class`, `self.condition`(`full`/`hurt`/`danger`), `self.affinity_tier`(`hostile`/`wary`/`neutral`/`friendly`/`loyal`), `self.mana`, `self.seals`, `self.alignment`, `self.intel_level`(플레이어가 화자에 대해 아는 정보 단계. 플레이어 서번트면 3), `self.phase_won`(화자 진영이 이번 국면을 이겼나) |
| `enemy.*` (상대 진영) | `enemy.servant`, `enemy.class`, `enemy.condition`, `enemy.intel_level`, `enemy.master` |
| `world.*` | `world.day`, `world.time`, `world.terrain`(`open`/`urban`/`forest`/`river`), `world.tile`, `world.factions_alive` |
| `battle.*` | `battle.phase_index`, `battle.lead`(앞선 쪽), `battle.is_final` |
| `beat.*` (§8.3) | `beat.line.tone`, `beat.line.speaker`, `beat.line.id`, `beat.has_line`, `beat.winner_side`, `beat.actor_side`(`self`/`enemy`, 플레이어 기준) |
| `scene.*` (§8.4) | `scene.setting_told`, `scene.motif`, `scene.beat_index` |

### 4.2 관계
| 사실 | 뜻 |
|---|---|
| `pair.id` | 화자·상대 서번트 쌍 (순서 무관). 인연 대사용 |
| `self.master_pair` | 플레이어 마스터 × 서번트 조합 |

### 4.3 기억 (한 판 안) [확정 범위: D-059]
이벤트 로그에서 계산한다. 판이 끝나면 사라진다.
| 사실 | 뜻 |
|---|---|
| `mem.met_before(enemy)` | 이 상대와 전에 조우했는가 |
| `mem.last_result(enemy)` | 이 상대와의 마지막 전투 결과 |
| `mem.released(enemy)` | 이 상대를 방면한 적이 있는가 |
| `mem.executed_count` | 지금까지 처치한 수 |
| `mem.near_death_count` | 내 서번트가 `위험`까지 간 횟수 |
| `mem.seals_used` | 사용한 영주 수와 용도 |
| `mem.lost_at(tile)` | 이 타일에서 진 적이 있는가 |
| `mem.days_since(event)` | 어떤 일로부터 며칠 지났나 |
| `mem.said(text_id)` | 이 대사를 이미 했는가 |

### 현재 사실 지원 범위
위 표는 설계 어휘를 포함한다. 현재 `mem.met_before`, `mem.last_result`, `mem.released`, `mem.executed_count`, `mem.near_death_count`, `pair.id`를 제공한다. `mem.seals_used`, `mem.lost_at`, `mem.days_since`, 조건용 `mem.said`, `self.master_pair`, `battle.lead`는 미구현이다. `scene.motif`는 현재 null이며 갱신되지 않는다.

## 5. 대사 데이터 형식
### 5.1 폴더 구조 [확정] (D-063, D-064)
```
data/
  servants/{servant_id}/
    profile.json    ← 스탯, 클래스, 성향, 레거시 ID, 이미지
    skills.json     ← 보유 스킬과 랭크
    dialogue.json   ← 이 서번트가 말하는 모든 대사 (전용 + 특수 상호작용)
    voice.md        ← 말투 가이드 (호칭, 어조, 금기)
  classes/{class}/dialogue.json   ← 클래스 공통 대사
  common/speech.json              ← 서번트 공통 대사 (누가 말해도 되는 말, D-151)
  common/narrator.json            ← 서술문, 소문, 범용 나레이션
```
- **대사는 말하는 쪽이 소유한다.** 에미야가 쿠 훌린에게 하는 말은 `sv_0011_emiya` 폴더에 `when: { "enemy.servant": ... }` 조건으로 둔다. 쌍 전용 폴더는 두지 않는다
- 서번트 ID 규칙: **번호 + 이름** `sv_{FGO 번호 4자리}_{영문 이름}` [확정] (D-066). 예: `sv_0002_artoria`
- 시작 7기 폴더: `data/servants/` (알트리아, 쿠 훌린, 에미야, 메두사, 메데이아, 코지로, 헤라클레스)

### 5.2 파일 형식 (현재 스키마)
파일 안은 상황 태그별로 묶는다. `defaults`로 반복 필드를 생략하고, 필요한 줄만 덮어쓴다.
```json
{
  "speaker": "sv_0002_artoria",
  "defaults": { "status": "draft", "author": "ai", "weight": 1, "repeat": "always", "source": "new" },
  "tags": {
    "battle_start": [
      { "id": "fgo_01", "text": "…", "source": "fgo", "status": "reviewed" },
      { "id": "vs_cu_reunion",
        "when": { "enemy.servant": "sv_0017_cu_chulainn", "mem.met_before": true },
        "text": "[[PLACEHOLDER: battle_start vs 쿠 훌린, 재회]]",
        "repeat": "once_per_run" }
    ]
  }
}
```
- 엔진은 불러올 때 전부 펼쳐서 `태그 → 대사 목록` 색인을 만든다
- `text_id`는 자동 생성: `tx_{화자}_{태그}_{id}`. **`id`는 한 번 정하면 바꾸지 않는다** (로그·기억이 이 ID를 가리킴). 번호보다 의미 있는 이름을 권장
- 현재 스키마는 `speaker`가 필수이며 `scope`는 선택 필드다. 공통 나레이션은 `speaker: narrator`, `scope: common`. 클래스 대사 파일은 `speaker`·`scope`가 `class:{class}`이며 7클래스 초안이 있다 (D-143)
- JSON은 주석이 없으므로 메모는 `notes` 필드에 쓴다
- **서번트 파일 안의 서술문** [제안]: 줄 단위로 `"speaker": "narrator"`를 쓰면 그 서번트에 대한 서술문이 된다 (예: 말하지 않는 헤라클레스의 반응 묘사). 선택 규칙은 그 서번트의 대사와 같다

### 5.3 대사 필드
| 필드 | 설명 |
|---|---|
| `id` | 파일 안에서 유일한 이름 |
| `when` | 조건. 값이 같거나(`=`), 연산자 객체(`{"gte": 50}`, `{"in": [...]}`, `{"not": ...}`) |
| `weight` | 같은 점수끼리 추첨 가중치 |
| `repeat` | `always` / `once_per_run` / `cooldown:N` |
| `status` | `draft`(AI 초안) / `reviewed`(사용자 검수 완료) (D-060) |
| `author` | `ai` / `user` |
| `source` | `fgo` / `legacy` / `quote`(원작 인용) / `new` |
| `quote_of` | 인용한 작품명 (인용일 때) |
| `quote_verified` | 인용 원문을 확인했는가. AI 기억에 의존한 인용은 `false` (D-062) |
| `slot` | 나레이션의 슬롯 (`lead`/`react`/`tail`, §8.1). 대사는 생략 (`line`) |
| `tone` | 대사의 감정 톤 (§8.4) |
| `motif` | 소재 태그 목록 (§8.4) |
| `notes` | 메모 |

### 5.4 불러오기 [확정] (D-065)
- 판이 시작되면 **그 판에 나오는 서번트(플레이어 1 + 적 6)의 폴더만** 불러온다. 해당 클래스 파일과 공통 파일도 함께
- 빌드 시 서번트 폴더별로 묶어 두고 지연 로딩한다 (Vite 동적 import) [제안]. JSON 내용을 변환하지 않으므로 D-022와 충돌하지 않는다

## 6. 선택 규칙 [확정] (D-104)
1. 해당 `tag`의 후보 중 조건을 전부 만족하고 반복 규칙을 통과한 대사를 남긴다. 플레이스홀더는 제외한다.
2. **계층을 먼저 본다** (D-144): 남은 후보 중 가장 구체적인 계층(서번트 > 클래스 > 공통)의 후보만 남긴다. 그 안에서 조건 수가 가장 많은 후보만 남긴다. 서번트 전용 대사가 하나라도 맞으면 조건이 더 많은 클래스·공통 대사보다 우선한다.
3. 같은 풀에 대안이 있으면 직전 대사를 제외한 뒤 `weight`로 시드 RNG 추첨한다.
4. 후보가 없으면 해당 슬롯을 생략한다. 생략 커버리지 로그는 아직 미구현이다.
- 서번트 대사 후보는 개인 → 클래스 → 공통(`common/speech.json`, D-151) 파일, 나레이션 후보는 관련 서번트의 서술문·공통 나레이션에서 모은다.
- 반복 기억은 선택 시 갱신되고 cooldown은 소비한 이벤트 수를 기준으로 센다 (현재 구현).

### 6.1 대체 계층 [확정] (D-064, D-144)
후보는 **서번트 → 클래스 → 공통** 세 곳에서 모은다. 조건·반복 규칙을 통과한 후보가 있는 가장 구체적인 계층만 쓰고, 조건 수는 그 계층 안에서만 비교한다.
- 서번트 전용 대사가 없는(또는 모두 조건·반복 규칙에 걸린) 태그는 클래스 공통 대사로, 그것도 없으면 공통 대사로 떨어진다
- 나레이션도 같다: 관련 서번트 파일의 서술문(서번트 계층)이 맞으면 공통 나레이션보다 우선한다
- 클래스·공통 대사는 서번트 대사를 가로챌 수 없으므로 조건(예: `self.alignment`)을 자유롭게 걸어도 된다
- 레거시 `classVocabulary.ts`(클래스별 무기·동사)는 클래스 공통 대사의 재료로 쓴다
- 클래스 대사 파일: `data/classes/{class}/dialogue.json`, `speaker`·`scope`는 `class:{class}` (현재 7종 초안, D-143). 클래스 대사를 고르면 화자는 그 서번트다

## 7. 문장 조립 [확정] (D-104)
### 7.1 자리표시자 [확정] (Q-51, D-104)
| 자리표시자 | 값 |
|---|---|
| `{master}` | 플레이어 마스터 이름 |
| `{servant}` | 화자 쪽 서번트 이름 |
| `{enemy}` | 상대 서번트 이름 (§7.2 정보 가림 적용) |
| `{enemy_master}` | 상대 마스터 이름 |
| `{place}` | 현재 타일 장소 이름 |
| `{day}` | 일차 |
| `{np}` | 화자 보구 이름 |
| `{servant_class}` | 화자 진영 서번트의 클래스명. 적 마스터가 자기 서번트를 부를 때 (`content/masters.md` §4.1) [제안] |
| `{skill}` | 발동한 스킬 이름 (`skill_triggered`). 진명 전의 적 스킬은 `labels.unknown_skill` (D-153) |
| `{actor}` `{target}` | 이벤트의 주체 / 대상 서번트 (나레이션용) [제안] |
| `{winner}` `{loser}` | 국면·전투의 승자 / 패자 서번트 (나레이션용) [제안] |
- 레거시 `{A}`, `{B}`, `{보구명}` 등은 들여올 때 위 이름으로 바꾼다

### 7.2 정보 가림
플레이어가 모르는 정보는 서술에 나오면 안 된다.
- `{enemy}`는 정보 단계에 따라 바뀐다: 0단계 "정체불명의 서번트" [확정] (D-104) → 1단계 클래스명("랜서") → 3단계 진명("쿠 훌린")
- 진명을 부르는 대사는 `when`에 `enemy.intel_level: 3` 조건이 필요하다 (검증 도구가 확인)
- **보구 개방 = 정체 공개** [확정] (D-067): 보구를 여는 순간 그 서번트의 정보가 3단계가 된다. 그래서 보구 영창(보구명 포함)은 가림 조건 없이 쓴다
- **화자 쪽 가림** [확정] (D-104): 적 서번트가 말하거나 적 서번트에 대한 서술문일 때, 플레이어는 화자의 정체도 모를 수 있다
  - `{servant}`도 플레이어의 정보 단계에 따라 호칭이 바뀐다 (플레이어 자기 서번트는 항상 진명)
  - 화자가 자기 정체를 드러내는 대사(자기 보구명, 전설 언급 등)는 `self.intel_level: 3` 조건을 붙인다

### 7.3 조사 자동 처리
받침에 맞춰 조사를 고른다. 표기: `{enemy}{이/가}`
| 쌍 | 받침 있음 | 받침 없음 |
|---|---|---|
| `{이/가}` | 이 | 가 |
| `{은/는}` | 은 | 는 |
| `{을/를}` | 을 | 를 |
| `{와/과}` | 과 | 와 |
| `{으로/로}` | 으로 | 로 (ㄹ 받침도 "로") |
- 이름이 영문·숫자로 끝나면 발음 기준 표를 따로 둔다 [TBD]

## 8. 장면 구성: 나레이션과 대사 엮기 [확정] (D-104)
비주얼 노벨처럼 **나레이션 → 대사 → 나레이션**이 한 호흡으로 이어져야 한다. 대사와 나레이션을 따로 고르면 서로 어긋난다 (도발하는 대사 뒤에 "조용히 고개를 숙였다" 같은 나레이션). 그래서 이벤트 하나를 **비트(beat)** 로 묶어 한꺼번에 구성한다.

### 8.1 비트와 슬롯
이벤트 하나 = 비트 하나. 비트는 순서가 정해진 **슬롯**으로 이루어진다.
| 슬롯 | 내용 | 화자 |
|---|---|---|
| `lead` | 장면을 여는 나레이션 (장소, 분위기, 등장) | narrator |
| `line` | 중심 대사 | 서번트 |
| `answer` | 상대의 응답 대사 (있으면) | 서번트 |
| `react` | 대사·결과에 반응하는 나레이션 | narrator |
| `tail` | 비트를 닫는 나레이션 (결과, 전환) | narrator |

### 8.2 이벤트별 비트 템플릿
실제 슬롯 정의는 `data/common/beats.json`. 아래는 주요 흐름 요약이다.
| 이벤트 | 슬롯 순서 (괄호는 선택) |
|---|---|
| `day_started` / `night_started` | lead |
| `action_started` | lead (action별 태그: 교류 `day_bond`, 정보 `intel`, 공급 `mana_supply`. 제작은 없음). 판정 행동의 장면을 연다 (D-141) |
| `bond` | line → (react) |
| `intel_gained` | line |
| `mana_supplied` | line → react |
| `battle_started` | lead(장소) → lead(상대 등장) → line → (answer) → (react) → tail |
| `phase_started` | lead(국면 유형) |
| `phase_resolved` | react(공방 묘사) → (line: 국면 승리 `phase_win` / 피격 `phase_hit`, 확률) → (tail: 상태 변화) → (line: 위기) |
| `np_opened` | lead(마력 집중) → line(영창) → react(정체 공개) |
| `weakness_used` | lead(약점 서술, 국면 유형별) → line(`weakness`) (D-148) |
| `skill_triggered` | 전투마다 스킬별 첫 발동만: react(`skill_effect`: 스킬 전용 → 효과별 범용, 미공개 적은 `event.skill_known: false` 해설) → line(`skill`, 확률, 발동한 서번트) (D-153) |
| `affinity_changed` (선택 반응) | `affinity_reaction` 템플릿: line(`react_choice`) → tail(호감도 변화) (D-150) |
| 기적 발생 | react |
| `battle_ended` | tail → line(승리/패배/무승부). 역전승이면 react(`comeback`) → tail → line(`comeback`) (D-151) |
| `post_choice` | line → tail |
| `npc_battle_resolved` | 실제 전투가 있으면 그 밤 간접 묘사. 탈락 소문은 다음 날 `day_started` lead에도 사용 (D-130) |

- **확률 슬롯** (D-151): 슬롯의 `chance`는 `text.slot_chance`의 이름이다. 그 확률로만 슬롯을 쓴다 (서술 RNG). 짧은 외침이 매 국면 나오지 않게 한다

### 8.3 고르는 순서: 대사가 먼저, 나레이션이 따라간다
1. 템플릿의 대사 슬롯(`line`, `answer` 등)을 먼저 고른다.
2. 나레이션 슬롯을 고를 때 대사의 tone·speaker·id를 사실로 전달한다.
3. `react`·`tail`은 출력 순서상 **바로 앞 대사**에 반응한다. `lead`는 중심 `line`을 참고한다 (D-104).
4. 표시 순서는 선택 순서와 관계없이 `beats.json` 슬롯 순서다. 선택은 서술 RNG로 결정한다.

### 8.4 연결 장치
| 장치 | 설명 |
|---|---|
| `tone` (대사 필드) | 대사의 감정 톤. 나레이션이 반응한다. 값: `calm` `defiant` `playful` `grim` `tender` `cold` `roar` [제안] |
| `motif` (필드) | 대사·나레이션이 남기는 소재 태그(예: `moon`, `food`). 같은 장면에서 뒤 나레이션이 `scene.motif`로 다시 받는다 |
| 장면 기억 `scene.*` | 한 장면(전투 1회, 낮 행동 1회) 안에서만 유효. `scene.setting_told`(장소 묘사 했나), `scene.motif`, `scene.beat_index` |
| 행위자 자리표시자 | 나레이션용 `{actor}`, `{target}`, `{winner}`, `{loser}` (§7.1). 정보 가림 적용 |

### 8.5 템포 조절 (연출 감독)
수치는 [임시값] (D-071). 만들어 보고 조정한다.
| 항목 | 값 | constants 키 |
|---|---|---|
| 큰 비트 출력 줄 수 상한 | 6 | `text.lines_per_beat_big` |
| 보통 비트 출력 줄 수 상한 | 4 | `text.lines_per_beat` |
| 작은 비트 출력 줄 수 상한 | 2 | `text.lines_per_beat_small` |
| 나레이션 연속 상한 (대사 없이 이어지는 나레이션 줄 수) | 2 | `text.max_narration_run` |
| 한 장면의 장소 묘사 | 1회 | `scene.setting_told` 사실로 제어 (상수 키 없음) |
- **큰 비트:** 2단계 하락(D-092), 기적, `위험` 진입, 보구 개방, 전투 개시·종료. 선택 슬롯을 모두 채운다
- **작은 비트:** 차이 2 이하, 국면 스킵. `react` 하나만
- **보통 비트:** 나머지
- 상한을 넘으면 선택 슬롯을 뒤에서부터 생략한다: `tail` → `react` → 두 번째 `lead`. `line`·`answer`·protected 슬롯은 생략하지 않는다 (D-104)
- 나레이션 연속 상한을 넘으면 가장 덜 구체적인(조건 수가 적은) 나레이션부터 생략한다
- 장소 묘사는 장면당 한 번 (`scene.setting_told`)

### 8.6 출력
비트는 `{speaker, text}` 목록이 되어 TextBox로 간다. 선택·조립된 줄마다 `Narrator.spoken`에 `LineSpoken`(슬롯·원인 이벤트 seq 포함)을 남긴다.

### 8.7 소문 (현재 구현, D-130)
적끼리 실제 전투가 있으면 그 밤 간접 묘사를 보여 주고, 인접 여부에 따라 문장이 달라진다. 싸우지 않고 헤어진 조우(`result: none`)는 생략한다. 적 전투의 승리·탈락 소문은 모아 다음 날 아침 첫 건을 lead에 사용한다. 정보 단계가 낮으면 당사자를 가린다 (§7.2).

### 8.8 나레이션 데이터
- 공통 나레이션: `data/common/narrator.json` (형식은 §5.2와 같고, 줄마다 `slot` 필드)
- 서번트 전용 나레이션: 서번트 파일 안에 `"speaker": "narrator"` (§5.2)
- 시점: **3인칭 관찰자** [확정] (D-069). 서술자는 누구의 머릿속에도 들어가지 않고, 보이고 들리는 것과 분위기만 쓴다. 인물의 속마음은 대사로 드러낸다

## 9. 도구 [제안]
| 도구 | 하는 일 |
|---|---|
| 커버리지 시뮬레이터 | 화면 없이 N판 실행 → 한 번도 안 나온 대사, 대사가 없어 생략된 상황, 과다 사용 대사 리포트. **서번트별로 어느 태그가 클래스·공통 대사로 떨어졌는지** 표시 (작성 우선순위용) |
| 서번트 폴더 생성기 | 레거시 수집 스크립트(`fetch-servants.mjs`, `fetch-dialogues.mjs`)를 고쳐 Atlas 데이터로 `profile.json`, `skills.json`, FGO 대사가 든 `dialogue.json`, 빈 `voice.md`를 자동 생성 |
| 대사 검증기 | 없는 사실 이름, 깨진 자리표시자, 정보 가림 위반, 중복 ID 검출 |
| 미리보기 | 사실 묶음을 넣으면 어떤 대사가 왜 이겼는지 점수와 함께 표시 |

## 10. 작성 방식 [확정] (D-060)
1. AI가 초안을 쓴다 (`status: draft`, `author: ai`)
2. 사용자가 검수하면 `status: reviewed`
3. 정식 빌드는 `reviewed`만 사용하도록 할 예정이나 **필터는 현재 미구현**이다. 현재 빌드는 draft도 출력하며 대사 옆에 draft 표시를 붙인다. 검수 완료로 간주하지 않는다
4. FGO·레거시 대사는 `source`로 구분해 들여온다
5. 문체·말투·인용 규칙: `.claude/skills/typemoon-dialogue/SKILL.md` (D-062)
- AI 초안 작성은 사용자가 범위(서번트, 태그)를 지정해 요청할 때 한다 (AGENTS.md 규칙 7)

## 11. Jev 보조 [보류] (D-061)
2순위, 나중에 검토. 넣는다면 §6의 4단계(동점 추첨)를 Jev가 대신하고, 결과는 `line_spoken`에 기록해 재현 시 Jev를 다시 부르지 않는다.

## 12. 엣지 케이스
| 상황 | 기대 동작 |
|---|---|
| 모든 후보가 반복 규칙에 걸림 | 덜 구체적인 사용 가능 후보로 대체, 없으면 생략. once_per_run 제한은 풀지 않음 (현재 구현) |
| 한 이벤트에 여러 화자가 말할 수 있음 | beats.json 슬롯 순서로 출력 (D-104) |
| 진명 미공개 상태에서 진명 대사만 남음 | 해당 대사 제외, 덜 구체적인 대사로 |

## 13. 예시 (테스트 케이스)
1. **구체성:** 사실 `{tag: battle_start, self.servant: sv_0011_emiya, enemy.servant: sv_0017_cu_chulainn, mem.met_before: true}`
   - 후보 A (공통, 조건 0개) / 후보 B (에미야 전용, 1개) / 후보 C (에미야 vs 쿠 훌린 재회, 3개) → C 선택
2. **반복 제외:** C가 `once_per_run`이고 이미 말함 → 다음 최고 점수 B
3. **정보 가림:** `enemy.intel_level: 1` → `{enemy}{이/가}` = "랜서가". 3단계면 "쿠 훌린이"
4. **조사:** "메두사" + `{을/를}` → "메두사를", "헤라클레스" + `{와/과}` → "헤라클레스와", "에미야" + `{으로/로}` → "에미야로"
5. **비트 구성 (§8, 현재 구현에 맞춘 예시):** 플레이어 알트리아 vs 쿠 훌린(정보 1단계), 수변, 밤. 엔진이 고르는 순서와 결과
   | 순서 | 슬롯 | 고른 줄 | 근거 |
   |---|---|---|---|
   | 1 | line | 알트리아 `battle_start/fgo_02` "사력을 다해 덤벼라." (`tone: defiant`) | 중심 대사를 먼저 고름 |
   | 2 | answer | 쿠 훌린 `battle_start/fgo_01` "여어, 덤비라고." | 상대 응답 |
   | 3 | lead | 나레이션 `battle_start/place_river` "강물 소리가 모든 기척을 덮는다. ──그러나 살기만은, 덮이지 않았다." | 지형 수변 + 장소 묘사 전 |
   | 4 | lead | 나레이션 `battle_start/enemy_class` "랜서. 드러난 것은 클래스뿐. 그 이상은, 칼끝이 밝혀낼 것이다." | 정보 1단계 → `{enemy}` = "랜서" |
   | 5 (현재 생략) | react | 과거 후보: 나레이션 `battle_start/react_defiant` "허세가 아니다. 그 목소리에는, 이미 승부를 정한 자의 무게가 실려 있었다." | `beat.line.tone: defiant`에 반응 |
   | 6 | tail | 나레이션 `battle_start/tail` "대화는 거기까지였다. ──공기가, 팽팽하게 당겨진다." | 비트 닫기 |
   - 화면 출력 순서: lead → lead → line → answer → react → tail
   - 위 표의 react_defiant는 과거 후보 예시다. 현재 선택 여부는 바로 앞 answer의 tone으로 정한다.
   - D-104에 따라 react는 **바로 앞 대사(answer)** 에 반응한다. 쿠 훌린 `fgo_01`에는 tone이 없어서 이 조합의 react_defiant는 선택되지 않는다. 과거 예시와의 충돌(Q-160)은 규칙 변경 없이 현재 구현을 기준으로 정리했다 (D-137).
   - 전투 개시는 큰 비트(상한 6줄)이며, 위 조합에서는 react가 빠진 5줄을 출력한다. 나레이션 연속은 lead 2줄 → 상한 2 이내

## 14. 미정 사항
- 상황 태그 목록 확정 (`text.md` §3.4)
- 영문 이름 조사 처리
- 연출 감독 수치, 여러 화자 순서
- reviewed 전용 빌드 필터·커버리지 도구 (현재 미구현)
