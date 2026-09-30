# Atlas 프로필·스킬 보강 보고서

캐시 425기, 프로필 100기.

## damageNp 계열 조사

| funcType | 함수 수 | svals 키 | 처리 |
|---|---:|---|---|
| damageNp | 351 | Rate, Value, HideMiss, HideNoEffect | 제외: 특성 조건 없음 |
| damageNpAndOrCheckIndividuality | 1 | Rate, Value, Target, Correction, AndCheckIndividualityList | 채택: And/OrCheckIndividualityList의 서번트 특성만 |
| damageNpHpratioLow | 6 | Rate, Value, Target | 제외: HP 비율 대상 |
| damageNpIndividual | 118 | Rate, Value, Target, Correction | 채택: Target는 상대 서번트 특성 |
| damageNpIndividualSum | 15 | Rate, Value, Value2, Target, Correction, TargetList, ParamAddMaxCount, IgnoreIndivUnreleaseable, IncludeIgnoreIndividuality | 채택: TargetList의 서번트 특성만 |
| damageNpPierce | 64 | Rate, Value | 제외: 특성 조건 없음 |
| damageNpRare | 1 | Rate, Value, Target, Correction, TargetRarityList | 제외: 희귀도 대상 |
| damageNpStateIndividualFix | 8 | Rate, Value, Target, Correction, IncludeIgnoreIndividuality | 제외: 상태 특성 대상 |

## 즉사 서번트

| servant_id | 근거 |
|---|---|
| sv_0017_cu_chulainn | 보구: 꿰뚫는 죽음의 가시 창 |
| sv_0020_cu_chulainn_prototype | 보구: 꿰뚫는 붉은 창 |
| sv_0040_hassan_of_the_cursed_arm | 보구: 망상심음 |
| sv_0041_stheno | 보구: 여신의 미소 |
| sv_0042_jing_ke | 보구: 불환비수 |
| sv_0070_scathach | 보구: 꿰뚫는 죽음의 투창 |
| sv_0084_arjuna | 보구: 파괴신의 손짓 |
| sv_0092_ryougi_shiki_assassin | 보구: 유식・직사의 마안 |
| sv_0154_first_hassan | 보구: 죽음을 고하는 천사 |
| sv_0297_ashiya_douman | 보구: 광란노도・악령좌부 |

## 보구 특공 서번트

| servant_id | 대상 특성 |
|---|---|
| sv_0006_siegfried | 2002 (dragon) |
| sv_0012_gilgamesh | 2008 (weakToEnumaElish) |
| sv_0069_oda_nobunaga | 2009 (riding) |
| sv_0076_mordred | 2010 (arthur) |
| sv_0077_nikola_tesla | 2011 (skyOrEarthServant) |
| sv_0085_karna | 2000 (divine) |
| sv_0088_brynhild | 2012 (brynhildsBeloved) |
| sv_0140_vlad_iii_extra | 304 (alignmentEvil) |
| sv_0143_enkidu | 1172 (threatToHumanity) |
| sv_0153_miyamoto_musashi | 109 (classAlterEgo), 115 (classMoonCancer) |
| sv_0198_katsushika_hokusai | 202 (attributeHuman) |
| sv_0204_antonio_salieri | 203 (attributeStar) |
| sv_0207_chiron | 201 (attributeEarth) |
| sv_0316_oberon | 300 (alignmentLawful) |

## foe_trait 추가 정의

| skill_id | 대상 특성 | 근거 Atlas 스킬 |
|---|---|---|
| sk_unifying_the_nation_by_force | 2000 (divine) | 천하포무 A |
| sk_beast_slayer | 2005 (wildbeast) | 짐승 살해자 B++ |
| sk_sh_b_sh_y_r_n | 2113 (king) | 십보살일인 B+ |
| sk_understanding_of_the_human_body | 2001 (humanoid) | 인체 이해 A |

## 계열 충돌로 보류

- 없음

## 수기 정의 후보 (미수정)

- 없음

## Atlas 스킬 링크 미해결 (미수정)

- 없음

## R7 변경 정의

- sk_csejte_night
- sk_proof_of_friendship
- sk_knowledge_of_the_deprived
- sk_trap_of_argalia
- sk_siren_song
- sk_shriek_from_the_palais_garnier
- sk_pheromone
- sk_double_cross
- sk_wail_of_the_living_dead
- sk_divine_judgment
- sk_gift_of_insight
- sk_aurea_poculum

문서 대조: `docs/systems/skills.md` §14의 R7 설명은 아직 즉사/우연 국면을 포함한다. 이번 데이터와 스크립트는 사용자 결정대로 선제/회피 국면만 사용한다. 문서는 수정 금지 범위에 있어 유지했다.

## lore 없는 서번트

- 없음

## 지정 사례

- 쿠 훌린 (source_id 17) instant_death: true
- 지크프리트 (sv_0006_siegfried) 용 특성 2002: true
