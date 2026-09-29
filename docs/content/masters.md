# 적 마스터
상태: 명단·대사 범위·초상 방침 [확정], 성향 배정·수락 확률 [임시값] (D-109), 스탯 [TBD] · 데이터: `data/masters/{master_id}/` · 관련: systems/combat.md, systems/day-loop.md, systems/narrative-engine.md

## 1. 명단 [확정] (D-087)
풀 12명. 한 판에 6명을 뽑고, 서번트와의 조합은 랜덤이다 (D-045). 뽑는 방식은 시드 RNG로 중복 없이 추첨 (현재 구현)
| ID | 이름 | 출전 | 성향 [임시값] |
|---|---|---|---|
| `ms_kotomine_kirei` | 코토미네 키레이 | Fate/stay night, Fate/Zero | 교활 |
| `ms_bazett` | 바제트 프라가 맥레미츠 | Fate/hollow ataraxia | 호전 |
| `ms_illyasviel` | 이리야스필 폰 아인츠베른 | Fate/stay night | 오만 |
| `ms_tohsaka_rin` | 토오사카 린 | Fate/stay night | 오만 |
| `ms_luviagelita` | 루비아젤리타 에델펠트 | Fate/hollow ataraxia, 로드 엘멜로이 2세의 사건부 | 오만 |
| `ms_el_melloi_ii` | 로드 엘멜로이 2세 | Fate/Zero, 로드 엘멜로이 2세의 사건부 | 신중 |
| `ms_olga_marie` | 올가마리 아니무스피어 | Fate/Grand Order | 신중 |
| `ms_matou_zouken` | 마토 조켄 | Fate/stay night, Fate/Zero | 교활 |
| `ms_ayaka_sajyou` | 사조 아야카 | Fate/strange Fake | 신중 |
| `ms_flat_escardos` | 플랫 에스카르도스 | 로드 엘멜로이 2세의 사건부, Fate/strange Fake | 호전 |
| `ms_kadoc_zemlupus` | 카독 젬루푸스 | Fate/Grand Order | 교활 |
| `ms_kirschtaria_wodime` | 키르슈타리아 보다임 | Fate/Grand Order | 오만 |
- 마스터 ID는 이름 기반 `ms_{영문 이름}` [제안]. 마스터는 FGO 번호가 없어서 서번트 규칙(D-066)을 쓰지 않는다

## 2. 성향과 전투 수락 [확정 원칙] (D-088)
마스터 성향은 **적 AI가 조우 시 전투를 받아들일지** 정한다. Q-113의 "항상 전투 수락"을 대체한다.
| 성향 | ID | 전투 수락 [임시값] → `ai.accept` |
|---|---|---|
| 호전 | `aggressive` | 항상 |
| 오만 | `proud` | 80% |
| 신중 | `cautious` | 40% |
| 교활 | `cunning` | 예상 승률 50% 이상이면 수락, 아니면 20% (승률은 레거시 Elo식, `day-loop.md` §13) |
- 수락하지 않으면: 적이 도주를 시도한다 → 플레이어가 전투를 원하면 민첩 대항 (D-085와 대칭) [제안]
- 적끼리 조우할 때도 같은 규칙 [제안]

## 3. 마스터 스탯 [TBD] (D-084, Q-152)
마스터 적성(서번트 스탯 배율)과 마력(서번트 마력 가감). 랭크 체계와 수치가 정해지면 `profile.json`의 `stats`를 채운다.

## 4. 대사 [확정 범위] (D-089)
| 태그 | 상황 | 변형 |
|---|---|---|
| `master_encounter` | 조우 | 기본 2 + 재회(`mem.met_before`) 1 |
| `master_battle` | 전투 중 | 국면 승리(`self.phase_won: true`) / 국면 패배 / 자기 서번트 `위험` |
| `master_seal_use` | 영주 사용 | 보구 즉시 발동 / 도주 (`event.purpose`). 영주 버프는 폐지 (D-142) |
| `master_executed` | 처치당할 때 | 마지막 말 |
| `master_eliminated` | 탈락 (방면되어 전쟁에서 빠질 때) | 퇴장하는 말 |
- 12명 × 10줄 = 120줄, 전부 `draft` (D-060). 말투 가이드는 각 폴더의 `voice.md`
- 원작 명대사 오마주 3줄: 키레이 "기뻐하게", 이리야 "죽여, {servant_class}", 린 "언제나 우아하게" (`notes`에 표시, 원문 인용 아님)

### 4.1 적 마스터 대사 규칙
- 자기 서번트는 `{servant_class}`(클래스명)로 부른다. 서번트가 판마다 랜덤이라 이름을 쓸 수 없다. 클래스를 부르는 것은 원작 방식이며, 들은 순간 클래스가 드러난다 (정보 1단계로 올릴지 [TBD])
- **플레이어 서번트의 이름·진명을 부르지 않는다.** 이야기 속 마스터는 상대의 정체를 모른다 (시뮬레이션에서 발견한 문제 4)
- 마스터 이름 자체는 조우 시 공개된다 [제안]

## 5. 초상 이미지 [확정] (D-090)
Atlas에 있는 캐릭터는 Atlas 이미지 URL, 없으면 사용자가 저장소에 이미지를 넣는다 (`profile.json`의 `portrait.atlas_url` / `portrait.local`). 로딩 실패 시 대체 표시 [TBD]

## 6. 미정 사항
- 성향·수락/퇴각 확률은 임시값으로 플레이 후 조정 (§1, §2)
- 마스터 스탯 (Q-152)
- 클래스 호칭을 들으면 정보 1단계로 올리는지
- 초상 이미지 데이터 보강 (현재 portrait 슬롯은 null)
