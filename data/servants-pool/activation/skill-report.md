# 신규 93기 스킬 자동 배정 (D-157)

신규 서번트 417기, 새 계열 1279개. 규칙 수는 새 정의 기준.

## 규칙별 개수

| 규칙 | 개수 |
|---|---:|
| R0 | 170 |
| R1 | 76 |
| R2 | 153 |
| R3 | 155 |
| R4 | 73 |
| R5 | 233 |
| R6 | 262 |
| R7 | 36 |
| R8 | 37 |
| R9 | 21 |
| R10 | 2 |
| R11 | 38 |
| R12 | 23 |

## R0 계열

- 여신의 신핵 (sk_core_of_the_goddess): func:addStateShort, func:addState, buff:addDamage, buff:upTolerance
- 심연의 사시 (sk_evil_eye_of_the_abyss): func:addState, buff:selfturnendFunction
- 주술 (sk_curse): func:delayNpturn, func:lossNp
- 광대의 큰 웃음 (sk_clown_s_laughter): func:addState, buff:avoidState, buff:reduceHp
- 덧없는 사랑 (sk_ephemeral_love): func:addState, buff:upGainHp, buff:upToleranceSubstate
- 도구작성(가짜) (sk_item_construction_fake): func:addStateShort, buff:upGrantstate
- 코스모 리엑터 (sk_cosmo_reactor): func:addState, func:addStateShort, buff:upCriticalpoint, buff:upCriticalrate
- 단독현현 (sk_independent_manifestation): func:addStateShort, func:addState, buff:upCriticaldamage, buff:upResistInstantdeath, buff:upTolerance
- 근원접속 (sk_connection_to_the_root): func:addStateShort, buff:upCommandall
- 복수자 (sk_avenger): func:addState, buff:downTolerance, buff:upDamagedropnp
- 망각보정 (sk_oblivion_correction): func:addStateShort, buff:upCriticaldamage
- 자기회복(마력) (sk_self_restoration_magical_energy): func:addStateShort, buff:regainNp
- 광화 EX(C 상당) (sk_madness_enhancement_ex_c_equivalent): func:addStateShort, buff:upCommandall
- 진지작성 EX(D 상당) (sk_territory_creation_ex_d_equivalent): func:addStateShort, buff:upCommandall
- 도구작성 EX(D 상당) (sk_item_construction_ex_d_equivalent): func:addStateShort, buff:upGrantstate
- 서핑 (sk_surfing): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticalpoint, buff:upCriticalrate
- 무한의 마력공급 (sk_infinite_magical_energy): func:addStateShort, buff:regainNp
- 더블 클래스 (sk_double_class): func:none
- 마력방출(보석) (sk_mana_burst_gem): func:addState, buff:delayFunction
- 혼혈 (sk_mixed_blood): func:addStateShort, buff:regainNp
- 경계에서 (sk_on_the_boundary): func:addState, func:addStateShort, buff:avoidInstantdeath, buff:upTolerance, buff:commandattackAfterFunction, buff:avoidState
- 얼트리액터 (sk_altereactor): func:addState, buff:upTolerance
- 무뢰한 (sk_gangster): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 하이 서번트 (sk_high_servant): func:none
- 짐승의 권능 (sk_authority_of_beasts): func:addStateShort, buff:upCriticaldamage
- 로고스 이터 (sk_logos_eater): func:addState, buff:upDefence
- 네거 세이비어 (sk_nega_saver): func:addState, buff:overwriteClassRelation
- 기척 차단(음) (sk_presence_concealment_shadow): func:addState, func:addStateShort, buff:upCriticalpoint, buff:upCriticalrate, buff:downTolerance
- 영역 밖의 생명 (sk_entity_of_the_outer_realm): func:addStateShort, func:addState, buff:regainStar, buff:upTolerance
- 광기 (sk_insanity): func:addStateShort, buff:upCommandall
- 문명침식 (sk_civilization_encroachment): func:addStateShort, buff:upCriticaldamage
- 요정계약 (sk_fairy_contract): func:addState, func:addStateShort, buff:upTolerance, buff:upGrantstate
- 수화 (sk_therianthropy): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticalpoint, buff:upCriticalrate
- 평온의 무화과 (sk_tranquil_fig): func:addState, buff:deadFunction
- 호문쿨루스 (sk_homunculus): func:addStateShort, func:addState, buff:upCommandall, buff:upTolerance
- 단독행동(셀럽) (sk_independent_action_celebrity): func:addStateShort, buff:upCriticaldamage, buff:regainNp
- 대지를 삼키는 자 (sk_one_who_swallows_the_land): func:addStateShort, buff:avoidState
- 흉화 (sk_becoming_evil): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 여관 작성 (sk_inn_creation): func:addStateShort, buff:upCommandall
- 복화술 (sk_ventriloquism): func:addState, buff:avoidState
- 노련 (sk_veteran): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticalpoint, buff:upCriticalrate
- 애신의 신핵 (sk_core_of_the_love_god): func:addStateShort, func:addState, buff:addDamage, buff:avoidState
- 왕의 현신체 (sk_king_s_image): func:addStateShort, buff:upDropnp
- 분노의 화신 (sk_fury_incarnate): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticaldamage, buff:avoidState
- 피에 젖은 만용 (sk_blood_soaked_brute): func:addStateShort, buff:attackAfterFunction
- 오버홀 (sk_overhaul): func:addState, func:addStateShort, buff:upTolerance, buff:upCriticalpoint, buff:upCriticalrate
- 요새구축 (sk_fortress_construction): func:addStateShort, func:addState, buff:upCommandall, buff:subSelfdamage
- 기척 차단(J) (sk_presence_concealment_j): func:addState, func:addStateShort, buff:upCriticalpoint, buff:upCriticalrate, buff:upNonresistInstantdeath
- 대 마력(J) (sk_magic_resistance_j): func:addState, buff:upTolerance, buff:upNonresistInstantdeath
- 해신의 축복 (sk_blessing_of_the_sea_god): func:addStateShort, func:addState, buff:addDamage, buff:subSelfdamage
- 천갈의 저주 (sk_curse_of_the_celestial_scorpion): func:addState, buff:upFuncHpReduce
- 단독행동(자기중심) (sk_independent_action_self_centered): func:addStateShort, buff:upStarweight, buff:upCriticalrate
- 향로봉의 눈 (sk_snow_on_xiang_lu_feng): func:addStateShort, buff:upCriticaldamage
- 일승법 (sk_teachings_that_drive_to_enlightenment): func:addState, buff:upTolerance
- 전령신의 가호 (sk_protection_of_the_messenger_deity): func:addState, func:addStateShort, buff:avoidState, buff:upCommandall
- 쌍신의 신핵 (sk_core_of_the_twin_gods): func:addStateShort, func:addState, buff:addDamage, buff:upDropnp, buff:upCriticalpoint, buff:upCriticalrate
- 해신의 신핵 (sk_core_of_the_sea_god): func:addStateShort, buff:addDamage, buff:upCommandall
- 주신의 신핵 (sk_core_of_the_king_of_gods): func:addStateShort, buff:addDamage, buff:upCommandall
- 단독항해 (sk_independent_voyage): func:addStateShort, buff:upCriticaldamage, buff:upCommandall
- 문명접촉 (sk_contact_with_civilization): func:addState, buff:upToleranceSubstate
- 대 마력(영) (sk_magic_resistance_spirit): func:addState, buff:upTolerance
- 독자마술 (sk_unique_magecraft): func:addStateShort, buff:upCriticaldamage
- 이계작성 (sk_otherworldly_creation): func:addStateShort, buff:upNpdamage
- 천연의 육체 (sk_primitive_body): func:addState, buff:avoidState
- 해바라기의 저주 (sk_curse_of_the_sunflower): func:addState, buff:preventDeathByDamage
- 해신의 가호 (sk_protection_of_the_sea_god): func:addStateShort, func:addState, buff:upCriticaldamage, buff:addIndividuality, buff:subSelfdamage
- 암흑의 신핵 (sk_core_of_darkness): func:addStateShort, buff:addDamage, buff:upGrantInstantdeath
- 쾌락주의 (sk_hedonism): func:addState, buff:upDamagedropnp
- 용종 (sk_dragonkin): func:addStateShort, func:addState, buff:upCommandall, buff:subSelfdamage
- 뱀신의 신핵 (sk_core_of_the_serpent_god): func:addStateShort, func:addState, buff:addDamage, buff:upToleranceSubstate
- 하드 펀처 (sk_hard_puncher): func:addStateShort, buff:upCriticaldamage
- 도검심미 (sk_connoisseur_of_blades): func:addStateShort, buff:upCriticaldamage
- 당대불길 (sk_sire_s_ill_omen): func:addStateShort, buff:upDamage
- 피학영매체질 (sk_masochistic_medium_s_nature): func:addState, func:addStateShort, buff:downTolerance, buff:upAtk
- 강철의 신앙 (sk_iron_faith): func:addState, buff:avoidState, buff:upDefencecommandall
- 진지작성(아틀리에) (sk_territory_creation_atelier): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticalpoint, buff:upCriticalrate
- 도구작성(옷) (sk_item_creation_cloth): func:addState, buff:downTolerance
- 요정안 (sk_fae_eyes): func:addState, buff:downCriticalRateDamageTaken, buff:downCriticalStarDamageTaken
- 여신변생(총) (sk_goddess_morph_gun): func:addStateShort, buff:upNpdamage
- ??? (sk_a900250): func:addStateShort, buff:upGrantstate, buff:downGrantstate
- 한여름 밤의 꿈 (sk_midsummer_night_s_dream): func:addState, buff:avoidState
- 단독행동 with 비이 (sk_independent_action_with_viy): func:addStateShort, func:addState, buff:upCriticaldamage, buff:upCriticalpoint, buff:upCriticalrate
- 매직 쇼・필드 (sk_magic_show_field): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 매직 굿즈・크리에이트 (sk_create_magic_goods): func:addStateShort, func:addState, buff:upGrantstate, buff:upCriticalpoint, buff:upCriticalrate
- 마왕의 신핵(?) (sk_core_of_the_demon_king): func:addStateShort, func:addState, buff:addDamage, buff:avoidState
- 진지작성(카구라) (sk_territory_creation_kagura): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 도구작성(기계장치) (sk_item_construction_puppet): func:addStateShort, buff:upGrantstate, buff:upCriticaldamage
- 뉴 오쿠니 가부키 (sk_new_okuni_kabuki): func:addStateShort, buff:regainStar, buff:upCriticaldamage
- 란마니움 (sk_ranmanium): func:addStateShort, buff:upCommandall, buff:regainNp
- 마왕의 총애 (sk_demon_king_s_favor): func:addStateShort, buff:avoidState
- 변화(오로치) (sk_morph_orochi): func:addState, func:addStateShort, buff:downCriticalRateDamageTaken, buff:downCriticalStarDamageTaken, buff:upCriticaldamage
- NFF 서비스 (sk_nff_services): func:addStateShort, buff:upDamage, buff:upCommandall, buff:upGrantstate
- 네거 셀프 (sk_nega_self): func:addStateShort, buff:attackAfterFunction
- 단독행동 B(EX) (sk_independent_action_b_ex): func:addStateShort, buff:upCriticaldamage
- 위장 공작 (sk_diversion_tactic): func:addState, func:addStateShort, buff:downCriticalRateDamageTaken, buff:downCriticalStarDamageTaken, buff:upCriticalpoint, buff:upCriticalrate
- 전승보균자 (sk_god_s_holder): func:addStateShort, buff:upCriticaldamage
- 좋아요! 의 힘 (sk_power_of_like): func:addStateShort, func:addState, buff:attackAfterFunction, buff:damageFunction
- 음모작성 (sk_conspiracy_formation): func:addStateShort, buff:upCommandall, buff:upNpdamage
- 패닉 컷 (sk_panic_cut): func:addState, buff:avoidState
- 동행종자 (sk_accompanying_attendant): func:addState, buff:upResistInstantdeath
- 원초의 하나 (sk_ultimate_one): func:addStateShort, buff:upCommandall
- 촌락작성 (sk_settlement_creation): func:addStateShort, func:addState, buff:upCommandall, buff:upDamagedropnp
- 약화(우미인) (sk_debuff_yu_mei_ren): func:addStateShort, buff:downAtk
- 고속영창(요) (sk_rapid_casting_monster): func:gainNp, func:hastenNpturn
- 천승의 의지 (sk_heavenly_will): func:addState, buff:avoidState
- 광화(아취) (sk_madness_enhancement_sabi): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 진지작성(정취) (sk_territory_creation_wabi): func:addStateShort, func:addState, buff:upCommandall, buff:upTolerance
- 예술심미(차) (sk_aesthetic_appreciation_tea): func:addStateShort, buff:upGrantstate
- 융통무애 (sk_unfettered): func:addStateShort, buff:upDropnp
- 천연의 지체 (sk_primitive_limbs): func:addState, buff:avoidState
- 쿠나의 주법 (sk_kuna_s_spell): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticaldamage, buff:addIndividuality
- 환수빙의 (sk_phantasmal_possession): func:addStateShort, buff:upStarweight, buff:upCriticalrate
- 제로창기 (sk_ti_lu_qiang_ji): func:addStateShort, buff:upCriticaldamage
- 황가의 인연 (sk_huang_family_s_bond): func:addStateShort, func:addState, buff:regainStar, buff:upCriticalrate, buff:upTolerance
- 진지작성(양산박) (sk_territory_creation_mount_liang): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticalpoint, buff:upCriticalrate
- 대행자 (sk_executor): func:addStateShort, func:addState, buff:upCriticaldamage, buff:upCriticalpoint, buff:upCriticalrate
- 세례비적 (sk_baptismal_rite): func:addState, buff:upTolerance
- 내독(기밀) (sk_poison_resistance_secret): func:addState, buff:avoidState
- 전능의 지혜 (sk_omnipotent_wisdom): func:addStateShort, buff:upCommandall
- 전사의 관리자 (sk_chief_of_warriors): func:addState, buff:masterSkillValueUp
- 물가의 삶 (sk_waterside_livelihood): func:addStateShort, buff:upCriticaldamage
- 도시국가 동맹 (sk_city_state_alliance): func:addStateShort, buff:upCommandall
- 문명작성 (sk_civilization_creation): func:addStateShort, buff:upGrantstate
- 유신의 영웅(기) (sk_hero_of_reform_strange): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 정신오염(독) (sk_mental_corruption_poison): func:addStateShort, func:addState, buff:upGrantstate, buff:upTolerance
- 꼭두각시 작성 (sk_karakuri_construction): func:addStateShort, buff:upGrantstate, buff:upCommandall
- 정신개조 (sk_mental_modification): func:addStateShort, func:addState, buff:upCriticaldamage, buff:upTolerance
- 나가의 아독 (sk_n_ga_s_poison_fang): func:addState, buff:avoidState
- 신수의 무구 (sk_god_given_armament): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 요정안 ? (sk_fae_eyes_2): func:addState, buff:downCriticalRateDamageTaken, buff:downCriticalStarDamageTaken
- 멜티 하트 (sk_melty_heart): func:addState, func:addStateShort, buff:upCriticalpoint, buff:upCriticalrate
- 남천의 별 (sk_star_of_the_southern_sky): func:addStateShort, buff:regainStar, buff:regainNp
- 요정기사 (sk_tam_lin): func:addStateShort, buff:upCriticaldamage
- 뇌운포식자 (sk_thundercloud_devourer): func:addStateShort, func:addState, buff:regainNp, buff:avoidState
- 요정기사 E/A (sk_tam_lin_e_a): func:addStateShort, buff:upCriticaldamage
- 제신의 무녀 A/B (sk_maiden_of_the_enshrined_deity_a_b): func:addState, buff:entryFunction, buff:addIndividuality, buff:damageFunction
- 별의 요람 (sk_cradle_of_the_stars): func:addStateShort, buff:upNpdamage
- 영기 정보 보존 (sk_spirit_origin_data_preservation): func:addState, buff:upToleranceSubstate
- 진지작성(타케다) (sk_territory_creation_takeda): func:addStateShort, func:addState, buff:upCommandall, buff:downCriticalRateDamageTaken, buff:downCriticalStarDamageTaken
- 도구작성(총) (sk_item_construction_gun): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 보재심 (sk_houzaishin): func:addState, buff:upToleranceSubstate, buff:upResistInstantdeath
- 귀신의 현 (sk_divine_oni_manifestation): func:addStateShort, buff:addDamage, buff:upCriticaldamage
- 영웅원망 (sk_hero_aspiration): func:addState, buff:gutsFunction
- 수영능숙 (sk_good_swimmer): func:addStateShort, buff:regainNp
- 물품주조(가짜) (sk_material_casting_fake): func:addStateShort, func:addState, buff:upGrantstate, buff:upToleranceSubstate
- 영웅의 대적(가짜) (sk_hero_s_archenemy_fake): func:addStateShort, buff:upCriticaldamage
- 마법사 (sk_magician): func:addState, func:addStateShort, buff:upTolerance, buff:upResistInstantdeath, buff:upToleranceSubstate, buff:buffConvert, buff:commandattackBeforeFunction, buff:commandattackAfterFunction, buff:attackBeforeFunction, buff:attackAfterFunction
- 백골만세천탑수험 (sk_hyakkotsu_bansei_sentou_shugen): func:addState, buff:delayFunction
- 전승방어 (sk_folklore_defense): func:addState, buff:subSelfdamage, buff:subFuncHpReduce
- 유미나 (sk_yumina): func:addState, buff:guts, buff:gutsFunction, buff:addIndividuality, buff:donotSkillSelect, buff:continueFunction
- 아지메 작법 (sk_achime_no_waza): func:addState, buff:upToleranceSubstate, buff:upTolerance
- 신이 노니는 정원 (sk_garden_of_divine_play): func:addStateShort, buff:upCriticaldamage
- 이형의 신 (sk_abnormal_god): func:addStateShort, func:addState, buff:addDamage, buff:subSelfdamage
- 오와니의 가호 (sk_protection_of_the_great_croc): func:addStateShort, buff:regainStar, buff:regainNp
- 자동재생 (sk_auto_regeneration): func:addStateShort, buff:regainHp
- 대행자(궁) (sk_executor_bow): func:addState, buff:overwriteClassRelation
- 복수자(명목) (sk_avenger_face): func:addState, buff:downTolerance, buff:upDamagedropnp
- 미래관리 (sk_future_management): func:addState, func:addStateShort, buff:downCriticalRateDamageTaken, buff:downCriticalStarDamageTaken, buff:upStarweight, buff:upCriticalrate
- 인리사정(공) (sk_humanity_assessment_atk): func:addStateShort, buff:upAtk
- 인리사정(방) (sk_humanity_assessment_def): func:addState, buff:upDefence
- 달의 도시 (sk_lunar_city): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticaldamage, buff:subSelfdamage
- 코드 캐스트 (sk_code_cast): func:addStateShort, buff:upCommandall, buff:upCriticaldamage
- 달의 레갈리아 (sk_moon_regalia): func:addStateShort, buff:upAtk
- 동속혐오 (sk_aversion_to_the_self): func:addStateShort, buff:upDamage
- 단독행동(카노포스) (sk_a2429351): func:addStateShort, buff:upCriticaldamage
- 소년왕의 저주 (sk_a2430650): func:addStateShort, buff:upGrantstate
- 농화 (sk_a2433250): func:addStateShort, func:addState, buff:upCommandall, buff:upCriticalpoint, buff:upCriticalrate
- 해바라기로서의 자화상 (sk_a2434350): func:addState, buff:upTolerance
- 환상의 프리마 (sk_a2443550): func:addState, func:addStateShort, buff:upCriticalpoint, buff:upCriticalrate
- 성야의 화신 (sk_a2448650): func:addStateShort, buff:regainStar, buff:upCommandall

## 새 skill_id

| KR 계열명 | skill_id | 규칙 |
|---|---|---|
| 블랙 배럴 | sk_black_barrel | R5 |
| 아말감 고트 | sk_amalgam_goad | R3 |
| 패러독스 실린더 | sk_paradox_cylinder | R2 |
| 마력방출(역린) | sk_mana_burst_wrath | R5 |
| 초저녁의 별 | sk_star_of_twilight | R3 |
| 꽃이 내리는 길 | sk_road_of_falling_flowers | R3 |
| 마력방출 | sk_mana_burst | R5 |
| 꽃의 여로 | sk_journey_of_the_flowers | R3 |
| 부의 잔 | sk_chalice_of_wealth | R5 |
| 황제특권(갈채) | sk_imperial_privilege_applause | R5 |
| 세 번, 낙일을 맞이할지라도 | sk_invictus_spiritus | R1 |
| 탐욕의 황금 | sk_avaricious_gold | R6 |
| 용살자 | sk_dragon_slayer | R5 |
| 군략 | sk_tactics | R4 |
| 선동 | sk_incite | R6 |
| 신의 채찍 | sk_scourge_of_god | R4 |
| 완전구조체 | sk_perfect_composition | R6 |
| 별의 문장 | sk_crest_of_the_star | R6 |
| 성처녀의 개선 | sk_triumph_of_the_holy_maiden | R4 |
| 황금률 | sk_golden_rule | R3 |
| 프렐라티의 격려 | sk_prelati_s_encouragement | R5 |
| 흰 백합에 빛을 | sk_a2447551 | R5 |
| 아름다운 풍모 | sk_beautiful_appearance | R9 |
| 모든 것을 본 자 | sk_he_who_saw_the_deep | R4 |
| 바빌론의 창고 | sk_treasury_of_babylon | R3 |
| 파괴공작 | sk_sabotage | R8 |
| 5월의 왕 | sk_may_king | R2 |
| 아르카디아 너머 | sk_beyond_arcadia | R5 |
| 몰이사냥의 미학 | sk_hunter_s_aesthetic | R11 |
| 칼리돈 사냥 | sk_calydonian_hunt | R2 |
| 여신의 신핵 | sk_core_of_the_goddess | R0 |
| 흡혈 | sk_vampirism | R3 |
| 매혹의 미성 | sk_siren_song | R7 |
| 여신의 변덕 | sk_whim_of_the_goddess | R5 |
| 강건 | sk_toughness | R9 |
| 천리안 | sk_clairvoyance | R11 |
| 궁시작성 | sk_arrow_construction | R3 |
| 기학의 카리스마 | sk_sadistic_charisma | R6 |
| 체이테의 밤 | sk_csejte_night | R7 |
| 전투속행 | sk_battle_continuation_2 | R1 |
| 원령조복 | sk_vengeful_spirit_exorcism | R7 |
| 우뚝 서기 | sk_imposing_stance | R9 |
| 백지 권화장 | sk_blank_subscription_list | R7 |
| 룬 마술 | sk_rune_spell | R6 |
| 짐승 살해자 | sk_beast_slayer | R6 |
| 최후미의 긍지 | sk_rear_guard_s_pride | R3 |
| 삼백의 분투 | sk_endurance_of_the_three_hundred | R1 |
| 전사의 포효 | sk_warrior_s_war_cry | R5 |
| 로망의 바람 | sk_wind_of_romance | R3 |
| 황제특권 | sk_imperial_privilege | R6 |
| 일곱 언덕 | sk_septem_colles | R1 |
| 수호기사 | sk_guardian_knight | R9 |
| 순교자의 혼 | sk_martyr_s_soul | R12 |
| 폭풍의 항해자 | sk_voyager_of_the_storm | R4 |
| 해적의 명예 | sk_pirate_s_glory | R1 |
| 신사적인 사랑 | sk_gentlemanly_love | R12 |
| 승리의 여왕 | sk_queen_of_victory | R6 |
| 전장의 군량 | sk_nourishment_for_the_battlefield | R1 |
| 안드라스타의 가호 | sk_andraste_s_protection | R5 |
| 텐구의 병법 | sk_tengu_s_strategy | R5 |
| 육도비술・신뢰풍열 | sk_rikutou_secret_technique_rapid_change | R6 |
| 제비의 날쌘 재주 | sk_art_of_the_swallow | R2 |
| 홍안의 미소년(번개) | sk_fair_youth_thunder | R7 |
| 패왕의 징조 | sk_omen_of_the_conqueror | R5 |
| 왕통의 음색 | sk_royal_melody | R6 |
| 아름다운 공주 | sk_beautiful_princess | R2 |
| 신의 은총 | sk_god_s_grace | R10 |
| 신앙의 가호 | sk_protection_of_the_faith | R12 |
| 기적 | sk_miracle | R12 |
| 성녀의 맹세 | sk_oath_of_the_holy_maiden | R8 |
| 정신오염 | sk_mental_corruption | R10 |
| 모독심미 | sk_sacrilegious_appreciation | R8 |
| 심연의 사시 | sk_evil_eye_of_the_abyss | R0 |
| 인간관찰 | sk_human_observation | R4 |
| 고속영창 | sk_rapid_casting | R3 |
| 인어공주의 사랑 | sk_mermaid_s_love | R3 |
| 인챈트 | sk_enchant | R5 |
| 자기보존 | sk_self_preservation | R2 |
| 국왕일좌 | sk_king_s_men | R3 |
| 주술 | sk_curse | R0 |
| 불모한 분노 | sk_fruitless_wrath | R6 |
| 광대의 큰 웃음 | sk_clown_s_laughter | R0 |
| 음악신의 가호(가짜) | sk_protection_of_muse_fake | R5 |
| 천사의 선율 | sk_angel_s_tune | R8 |
| 소야곡 | sk_eine_kleine_nachtmusik | R11 |
| 감식안 | sk_discerning_eye | R6 |
| 군사의 충언 | sk_tactician_s_advice | R3 |
| 군사의 지휘 | sk_tactician_s_command | R6 |
| 원초의 룬 | sk_primordial_rune | R6 |
| 샘에서 | sk_at_the_lake | R6 |
| 투척/회수 | sk_throw_retrieve | R11 |
| 자기개조 | sk_self_modification | R6 |
| 바람막이의 가호 | sk_protection_against_the_wind | R2 |
| 억제 | sk_restrain | R11 |
| 십보살일인 | sk_sh_b_sh_y_r_n | R6 |
| 방약무인 | sk_insolent | R5 |
| 처형인 | sk_executioner | R6 |
| 의술 | sk_medicine | R12 |
| 인체연구 | sk_human_study | R6 |
| 무고의 괴물 | sk_innocent_monster | R11 |
| 가르니에에서 부르는 목소리 | sk_shriek_from_the_palais_garnier | R7 |
| 붉게 빛나는 죽음의 가면 | sk_a2439551 | R4 |
| 뱅센에 해는 지고 | sk_the_sun_goes_down_in_vincennes | R6 |
| 페로몬 | sk_pheromone | R7 |
| 더블 크로스 | sk_double_cross | R7 |
| 고문기술 | sk_torture_technique | R8 |
| 선혈의 목욕 | sk_bath_of_fresh_blood | R8 |
| 무궁의 무련 | sk_eternal_arms_mastery | R11 |
| 정령의 가호 | sk_protection_of_the_spirits | R11 |
| 마력 역류 | sk_mana_reversal | R6 |
| 반골의 상 | sk_defiant | R9 |
| 난세의 효웅 | sk_chaotic_villain | R4 |
| 피학의 명예 | sk_honor_of_suffering | R12 |
| 불굴의 의지 | sk_unyielding_will | R1 |
| 검의 개선 | sk_triumphant_return_of_the_sword | R5 |
| 동물 회화 | sk_animal_communication | R3 |
| 천성의 육체 | sk_natural_body | R12 |
| 선혈의 전승 | sk_legend_of_dracula | R6 |
| 전율의 불사자 | sk_terrifying_undead | R1 |
| 천성의 마 | sk_natural_demon | R9 |
| 심연의 라브리스 | sk_labrys_of_the_abyss | R5 |
| 가학체질 | sk_sadistic_nature | R6 |
| 지난날의 영광 | sk_glory_of_past_days | R5 |
| 아케메네스의 긍지 | sk_pride_of_an_achaemenid | R1 |
| 변화(화룡) | sk_morph_fire_dragon | R9 |
| 슈퍼 포지티브 스토커 | sk_super_positive_stalker | R6 |
| 불꽃색 입맞춤 | sk_flame_colored_kiss | R5 |
| 지원주술 | sk_supporting_curse | R8 |
| 피를 마시는 짐승 도끼 | sk_half_dead_bloodaxe | R12 |
| 주층・묘일조 | sk_malediction_cat_sunshine | R2 |
| 변화(런치) | sk_morph_lunch | R9 |
| 청렬한 기도의 끝에 | sk_after_pure_prayer | R5 |
| 찬연한 성광의 복권 | sk_restoration_of_the_radiant_holy_light | R8 |
| 신명재결 | sk_divine_judgment | R7 |
| 여신의 총애 | sk_grace_of_the_goddess | R6 |
| 바람기를 향한 쐐기 | sk_punish_the_unfaithful | R6 |
| 할로윈 스타 | sk_halloween_star | R3 |
| 마력방출(호박) | sk_mana_burst_pumpkin | R5 |
| 할로윈 앙코르! | sk_halloween_encore | R1 |
| 주층・광일조 | sk_malediction_boundless_sunshine | R4 |
| 변화 | sk_morph | R9 |
| 여우 시집가기 | sk_fox_s_wedding | R5 |
| 신의 가호 | sk_divine_protection | R9 |
| 치유의 하프 | sk_harp_of_healing | R2 |
| 트로이의 수호자 | sk_guardian_of_troy | R4 |
| 우의의 증명 | sk_proof_of_friendship | R7 |
| 수세의 카리스마 | sk_a2419550 | R6 |
| 달려나가는 황금률 | sk_overhaul_golden_rule | R5 |
| 별의 개척자 | sk_pioneer_of_the_stars | R6 |
| 접현돌격 | sk_abordage_rush | R1 |
| 현란의 해적 공주 | sk_pirate_princesses_of_splendor | R6 |
| 콤비네이션 | sk_combination | R6 |
| 독 내성 | sk_poison_resistance | R12 |
| 덧없는 사랑 | sk_ephemeral_love | R0 |
| 축지 | sk_shukuchi | R5 |
| 절도 | sk_zettou | R6 |
| 노부나가 택틱스 | sk_nobunaga_tactics | R4 |
| 천하포무 | sk_unifying_the_nation_by_force | R6 |
| 마왕 | sk_demon_king | R6 |
| 마경의 지혜 | sk_wisdom_of_d_n_sc_ith | R2 |
| 신살자 | sk_god_slayer | R6 |
| 사랑의 점 | sk_love_spot | R8 |
| 비련요란 | sk_profusion_of_tragic_love | R5 |
| 용사의 긍지 | sk_warrior_s_pride | R5 |
| 성자의 선물 | sk_saint_s_gift | R11 |
| 순록 드라이브 | sk_reindeer_drive | R6 |
| 토미 썸의 비밀 그림책 | sk_tom_thumb_s_secret_picture_book | R4 |
| 한편 그 무렵 | sk_meanwhile | R3 |
| 안개 낀 밤의 살인 | sk_murder_on_a_misty_night | R2 |
| 정보 말소 | sk_information_erasure | R8 |
| 외과수술 | sk_surgery | R12 |
| 붉은 번개의 기사 | sk_knight_of_red_lightning | R5 |
| 시가렛 라이온 | sk_cigarette_lion | R6 |
| 부정을 숨기는 투구 | sk_secret_of_pedigree | R3 |
| 테슬라 코일 | sk_tesla_coil | R3 |
| 천부의 예지 | sk_inherent_wisdom | R1 |
| 적룡의 숨결 | sk_breath_of_the_red_dragon | R5 |
| 땅끝의 가호 | sk_protection_of_world_s_end | R6 |
| 와일드 헌트 | sk_wild_hunt | R6 |
| 엘리멘탈 | sk_elemental | R5 |
| 현자의 돌 | sk_philosopher_s_stone | R1 |
| 도구작성(가짜) | sk_item_construction_fake | R0 |
| 일의전심 | sk_concentration | R3 |
| 기관의 갑옷 | sk_mechanized_armor | R2 |
| 증기기관 출력 상승 | sk_increase_steam_engine_output | R4 |
| 공황의 목소리 | sk_panicky_voice | R7 |
| 자기변용 | sk_self_transformation | R6 |
| 갈바니즘 | sk_galvanism | R3 |
| 공허한 생자의 한탄 | sk_wail_of_the_living_dead | R7 |
| 오버로드 | sk_overload | R4 |
| 천리안(사수) | sk_clairvoyance_shooter | R11 |
| 축복받는 영웅 | sk_hero_of_the_endowed | R3 |
| 마력방출(불꽃) | sk_mana_burst_flame | R4 |
| 빈자의 식견 | sk_knowledge_of_the_deprived | R7 |
| 희사의 끝 | sk_fruits_of_benefaction | R6 |
| 코스모 리엑터 | sk_cosmo_reactor | R0 |
| 지원포격XEX | sk_fire_support_xex | R8 |
| 세이버의 별 | sk_star_of_saber | R2 |
| 은하유성검XEX | sk_galactic_meteor_sword_xex | R6 |
| 천리안(려) | sk_clairvoyance_beauty | R3 |
| 화려분방 | sk_uninhibited_resplendence | R2 |
| 마술 | sk_magecraft | R5 |
| 영웅의 하인 | sk_hero_s_assistant | R6 |
| 베르세르크 | sk_berserk | R4 |
| 분기의 용사 | sk_invigorated_hero | R6 |
| 견인의 노경 | sk_perseverance_of_old_age | R1 |
| 하늘에 별을 | sk_stars_for_the_sky | R3 |
| 땅에 꽃을 | sk_flowers_for_the_earth | R6 |
| 사람에게 사랑을 | sk_love_for_the_people | R6 |
| 단독현현 | sk_independent_manifestation | R0 |
| 근원접속 | sk_connection_to_the_root | R0 |
| 샛별 | sk_morning_star | R5 |
| 운요 | sk_unyou | R6 |
| 음양어 | sk_yin_yang | R3 |
| 직사의 마안 | sk_mystic_eyes_of_death_perception | R5 |
| 빗속에서 만나다 | sk_encounter_in_the_rain | R2 |
| 기나긴 여로를 향한 기도 | sk_prayer_for_the_long_journey | R3 |
| 치천의 잔 | sk_goblet_of_seraph | R3 |
| 신명재결(가짜) | sk_divine_judgment_fake | R5 |
| 건드리면 넘어진다! | sk_trap_of_argalia | R7 |
| 이성 증발 | sk_evaporation_of_reason | R6 |
| 현왕의 맹아 | sk_budding_wise_king | R7 |
| 복수자 | sk_avenger | R0 |
| 망각보정 | sk_oblivion_correction | R0 |
| 자기회복(마력) | sk_self_restoration_magical_energy | R0 |
| 강철의 결의 | sk_iron_determination | R6 |
| 몽테크리스토의 비보 | sk_treasure_of_monte_cristo | R3 |
| 궁지의 지혜 | sk_wisdom_of_crisis | R11 |
| 강철의 간호 | sk_nurse_of_steel | R12 |
| 인체 이해 | sk_understanding_of_the_human_body | R6 |
| 천사의 외침 | sk_angel_s_cry | R5 |
| 광화 EX(C 상당) | sk_madness_enhancement_ex_c_equivalent | R0 |
| 정령의 광소 | sk_madness_of_the_spirits | R8 |
| 여왕의 몸 | sk_queen_s_figure | R3 |
| 여왕의 훈육 | sk_queen_s_discipline | R6 |
| 사랑스러운 나의 벌꿀술 | sk_intoxicating_mead | R7 |
| 마력동조 | sk_mana_tuning | R3 |
| 마하트마 | sk_mahatma | R4 |
| 미지에 대한 탐구 | sk_search_for_the_unknown | R5 |
| 무의 축복 | sk_blessing_of_martial_arts | R6 |
| 재연의 꿈 | sk_dreams_of_reunion | R1 |
| 중국 무술(육합대창) | sk_chinese_martial_arts_liu_he_da_qiang | R6 |
| 권경 | sk_sphere_boundary | R2 |
| 절초 | sk_juezhao | R5 |
| 진지작성 EX(D 상당) | sk_territory_creation_ex_d_equivalent | R0 |
| 도구작성 EX(D 상당) | sk_item_construction_ex_d_equivalent | R0 |
| 멘로파크의 마술사 | sk_wizard_of_menlo_park | R9 |
| 대량생산 | sk_mass_production | R4 |
| 개념 개량 | sk_concept_improvement | R3 |
| 피에 젖은 악마 | sk_bloody_devil | R5 |
| 샤머니즘 | sk_shamanism | R5 |
| 수호의 짐승 | sk_guardian_beast | R5 |
| 사격 | sk_marksmanship | R6 |
| 퀵 드로우 | sk_quick_draw | R3 |
| 소년 악당왕 | sk_young_outlaw_king | R2 |
| 용의 마녀 | sk_dragon_witch | R6 |
| 덧없는 꿈 | sk_ephemeral_dream | R2 |
| 우치교교 | sk_zarich | R8 |
| 좌치교교 | sk_tawrich | R8 |
| 네 번째 밤의 종말 | sk_the_end_of_the_fourth_night | R5 |
| 저편으로 향하는 자들 | sk_they_who_seek_the_horizon | R6 |
| 제압군략 | sk_suppressive_tactics | R4 |
| 번개의 정복자 | sk_lightning_conqueror | R5 |
| 성배의 총애 | sk_affection_of_the_holy_grail | R6 |
| 스케이프고트 | sk_scapegoat | R9 |
| 장지의 사서 | sk_librarian_of_knowledge | R3 |
| 전과백반 | sk_wide_specialization | R2 |
| 전투 철수 | sk_battle_retreat | R12 |
| 하늘의 잔 | sk_goblet_of_heaven | R4 |
| 자연의 영아 | sk_child_of_nature | R2 |
| 마술의료 | sk_magical_healing | R12 |
| 과일의 취기 | sk_intoxicating_aroma_of_fruits | R7 |
| 귀종의 마 | sk_demonic_nature_of_oni | R4 |
| 오니의 목 | sk_oni_s_head | R1 |
| 고속독경 | sk_rapid_sutra_chanting | R4 |
| 요염한 홍안 | sk_captivating_rosy_cheeks | R6 |
| 삼장의 가르침 | sk_sanzang_s_teaching | R3 |
| 겐지의 무련 | sk_genji_s_arms_mastery | R6 |
| 뇌신의 현 | sk_thunder_god_s_manifestation | R2 |
| 신비 살해자 | sk_mystic_slayer | R6 |
| 천리 질주 | sk_long_distance_dash | R5 |
| 오에의 오니 난동 | sk_violent_oni_of_ooe | R6 |
| 인술 | sk_ninjutsu | R2 |
| 풍성학려 | sk_suspicious_shadow | R8 |
| 열사의 신왕 | sk_divine_king_of_the_burning_sands | R6 |
| 태양신의 가호 | sk_protection_of_the_sun_god | R3 |
| 빛의 분류 | sk_torrent_of_light | R5 |
| 명부신의 위업 | sk_works_of_the_underworld_god | R5 |
| 천공신의 총애 | sk_affection_of_the_sky_god | R1 |
| 호수의 기사 | sk_knight_of_the_lake | R3 |
| 기사는 맨손으로 죽지 않는다 | sk_knight_of_owner | R6 |
| 드높이 사랑을 찬양하리라 | sk_resounding_proclamation_of_love | R2 |
| 축복받지 못한 탄생 | sk_unblessed_birth | R3 |
| 기사왕에 대한 간언 | sk_critique_to_the_king | R8 |
| 성자의 숫자 | sk_numeral_of_the_saint | R5 |
| 불야의 카리스마 | sk_nightless_charisma | R6 |
| 베르틸락의 벨트 | sk_belt_of_bertilak | R1 |
| 변화(잠입 특화) | sk_morph_infiltration | R8 |
| 독 칼날 | sk_poison_blade | R11 |
| 창백한 죽음의 무도 | sk_dance_of_the_pale_death | R5 |
| 용신의 가호 | sk_protection_of_the_dragon_king | R5 |
| 무진표 | sk_inexhaustible_straw_bag | R5 |
| 기사의 군략 | sk_knight_s_tactics | R4 |
| 냉정침착 | sk_calm_and_collected | R3 |
| 수호의 계약 | sk_oath_of_protection | R9 |
| 총명예지 | sk_brilliance_of_a_genius | R1 |
| 모나리자 | sk_mona_lisa | R5 |
| 비치 플라워 | sk_beach_flower | R6 |
| 한여름의 주술 | sk_midsummer_curse | R7 |
| 여신변생(하늘) | sk_goddess_morph_heaven | R2 |
| 서머 스플래시! | sk_summer_splash | R5 |
| 바닷가 매점의 가호 | sk_beach_house_protection | R12 |
| 해바라기의 광채 | sk_sparkling_sunflower | R11 |
| 아름다운 공주(바다) | sk_beautiful_princess_sea | R2 |
| 트레저 헌트(바다) | sk_treasure_hunt_sea | R3 |
| 서핑 | sk_surfing | R0 |
| 세룰리안 라이드 | sk_cerulean_ride | R5 |
| 로데오 플립 | sk_rodeo_flip | R2 |
| 끝나지 않는 여름 | sk_endless_summer | R1 |
| 비치 클라이맥스 | sk_beach_climax | R6 |
| 원초의 룬(바다) | sk_primordial_rune_sea | R9 |
| 한여름의 실수 | sk_midsummer_mistake | R5 |
| 정열의 한여름 | sk_passionate_summer | R3 |
| 수욕전신 | sk_bath_transformation | R5 |
| 사랑의 추적자 | sk_pursuer_of_love | R8 |
| 물가의 성녀 | sk_saint_of_the_shore | R6 |
| 천성의 육체(바다) | sk_natural_body_sea | R12 |
| 야곱의 수족 | sk_jacob_s_limbs | R6 |
| 무한의 마력공급 | sk_infinite_magical_energy | R0 |
| 유쾌형 마술예장 | sk_cheerful_model_mystic_code | R5 |
| 미래를 향해 빛나는 | sk_dazzling_towards_the_future | R2 |
| 수상한 약 | sk_suspicious_medicine | R1 |
| 투영마술 | sk_projection | R5 |
| 키스마 | sk_kissing_freak | R3 |
| 더블 클래스 | sk_double_class | R0 |
| 용사대원칙 | sk_hero_s_principles | R2 |
| 마력방출(용기) | sk_mana_burst_courage | R5 |
| 진홍의 용사전설・극장판 | sk_legend_of_the_crimson_hero_theatrical_release | R2 |
| 이시스와 같이 | sk_like_isis_herself | R3 |
| 여신의 가호 | sk_protection_of_the_goddess | R2 |
| 악마의 군략 | sk_demonic_tactics | R4 |
| 자기변혁 | sk_self_transformation_2 | R3 |
| 미의 현현 | sk_manifestation_of_beauty | R6 |
| 빛나는 큰 왕관 | sk_shining_majestic_crown | R2 |
| 마력방출(보석) | sk_mana_burst_gem | R0 |
| 변용 | sk_transformation | R5 |
| 기척 감지 | sk_presence_detection | R2 |
| 백성의 예지 | sk_wisdom_of_the_people | R3 |
| 태양의 카리스마 | sk_charisma_of_the_sun | R6 |
| 선신의 지혜 | sk_wisdom_of_the_benevolent_god | R1 |
| 자유로운 투쟁 | sk_lucha_libre | R6 |
| 왕의 귀환 | sk_king_s_return | R3 |
| 마장의 지배자 | sk_sovereign_of_magical_staffs | R5 |
| 덧없는 자매 | sk_ephemeral_sisters | R7 |
| 하얀 화관 | sk_white_flower_crown | R1 |
| 거괴유린 | sk_great_monstrous_overrun | R6 |
| 변전의 마 | sk_a316452 | R1 |
| 재규어 펀치 | sk_jaguar_punch | R2 |
| 재규어 킥 | sk_jaguar_kick | R6 |
| 재규어 아이 | sk_jaguar_eye | R6 |
| 혼혈 | sk_mixed_blood | R0 |
| 몽환의 카리스마 | sk_dreamlike_charisma | R6 |
| 환술 | sk_illusion | R2 |
| 영웅 작성 | sk_hero_creation | R5 |
| 제오세 | sk_fifth_force | R6 |
| 천안 | sk_heavenly_eye | R5 |
| 무공 | sk_emptiness | R2 |
| 경계에서 | sk_on_the_boundary | R0 |
| 죽음의 구렁 | sk_death_s_abyss | R1 |
| 만종, 귀로 | sk_evening_bell_homeward | R5 |
| 얼트리액터 | sk_altereactor | R0 |
| ∞밤팥소 | sk_chestnut_paste | R6 |
| 찰나무영검 | sk_ephemeral_shadowless_blade | R5 |
| 왕의 보이지 않는 손 | sk_king_s_invisible_hand | R6 |
| 마탄의 사수 | sk_the_freeshooter | R6 |
| 거미줄의 끝 | sk_end_of_the_spider_s_web | R4 |
| 사악한 지혜의 카리스마 | sk_evil_charisma | R6 |
| 방탄 가공 | sk_bulletproof | R9 |
| 회로접속(위법) | sk_circuit_connect_illegal | R5 |
| 비웃는 철심 | sk_icy_sneer | R6 |
| 타천의 마 | sk_fallen_demon | R9 |
| 향수의 백랑 | sk_homesick_white_wolf | R6 |
| 죽음을 두른 자 | sk_one_cloaked_in_death | R8 |
| 무뢰한 | sk_gangster | R0 |
| 연청권 | sk_fist_of_yan_qing | R6 |
| 도플갱어 | sk_doppelg_nger | R5 |
| 천교성 | sk_skillful_star | R11 |
| 붉은 용의 증표 | sk_mark_of_the_crimson_dragon | R5 |
| 눈부신 여로 | sk_resplendent_journey | R6 |
| 성검 사용자(별) | sk_sacred_sword_wielder_star | R6 |
| 전장의 귀신 | sk_demon_of_the_battlefield | R5 |
| 치열한 여로 | sk_harsh_road_to_travel | R1 |
| 국중법도 | sk_laws_of_the_shinsengumi | R6 |
| 황금률(흉) | sk_golden_rule_evil | R5 |
| 무고의 괴물(염) | sk_innocent_monster_flame | R11 |
| 일륜의 총희 | sk_consort_of_the_sun | R8 |
| 하이 서번트 | sk_high_servant | R0 |
| 크라임 발레 | sk_crime_ballet | R2 |
| 멜트 바이러스 | sk_melt_virus | R4 |
| 브레스트 밸리 | sk_breast_valley | R5 |
| 피학체질 | sk_masochistic_nature | R6 |
| 트래시&크래시 | sk_trash_crush | R6 |
| 신통력(여고생) | sk_divine_power_high_schooler | R5 |
| 재지의 축복 | sk_blessings_of_talent | R4 |
| 열 개의 왕관 | sk_domina_cornam | R12 |
| 황금의 잔 | sk_aurea_poculum | R7 |
| 자기개조(연) | sk_self_modification_infatuation | R5 |
| 짐승의 권능 | sk_authority_of_beasts | R0 |
| 로고스 이터 | sk_logos_eater | R0 |
| 네거 세이비어 | sk_nega_saver | R0 |
| 천리안(짐승) | sk_clairvoyance_beast | R3 |
| 오정심관 | sk_five_approaches_to_meditation | R8 |
| 마성변생 | sk_demonic_morph | R2 |
| 야화의 이야기꾼 | sk_bedchamber_storyteller | R5 |
| 생존의 침실 | sk_bedchamber_of_survival | R7 |
| 대 영웅(담) | sk_anti_hero_story | R1 |
| 초골모란 | sk_scorched_peony | R8 |
| 여중영주 | sk_great_empress | R6 |
| 여황제의 카리스마 | sk_empress_s_charisma | R5 |
| 황금률(미) | sk_golden_rule_beauty | R3 |
| 군신포효 | sk_roar_of_the_god_of_war | R5 |
| 콘키스타도르 | sk_conquistador | R5 |
| 천부의 견식 | sk_gift_of_insight | R7 |
| 해명하는 자 | sk_revealer | R3 |
| 바리츠 | sk_baritsu | R2 |
| 유쾌한 동료들 | sk_delightful_comrades | R5 |
| 콩 수프 호수 | sk_bean_soup_lake | R12 |
| 팝콘 눈보라 | sk_popcorn_blizzard | R8 |
| 폭주특권 | sk_rampaging_privilege | R3 |
| 일곱 개의 면류관 | sk_seven_crowns | R6 |
| 죽지 않는 마구스 | sk_undying_magus | R1 |
| 서머 갈바니즘 | sk_summer_galvanism | R3 |
| 공허한 혹서를 향한 한탄 | sk_lamenting_the_summer_heat | R8 |
| 적당히 로드 | sk_barely_loads | R4 |
| 흰색 어의 | sk_white_imperial_garments | R9 |
| 비치 패닉 | sk_beach_panic | R9 |
| 열사의 왕도 | sk_high_road_of_the_hot_sands | R4 |
| 얼간이 살법 | sk_fool_s_tactic | R2 |
| 아츠모리 비트 | sk_atsumori_beat | R3 |
| 물가의 제육천마왕 | sk_demon_king_on_the_beach | R6 |
| 서머 스위퍼! | sk_summer_sweeper | R5 |
| 코칭 | sk_coaching | R11 |
| 리로디드 | sk_reloaded | R5 |
| 서머 베케이션! | sk_summer_vacation | R3 |
| 냐프! | sk_nyarf | R6 |
| 대령의 여름 방학 | sk_colonel_s_summer_break | R5 |
| 그림자 풍기위원장 | sk_the_shadow_prefect | R6 |
| 연철 요요 | sk_cast_iron_yo_yo | R5 |
| 서머 카타스트로프 | sk_summer_catastrophe | R6 |
| 빛나는 물의 옷 | sk_shining_water_robe | R5 |
| 액셀 턴 | sk_accel_turn | R2 |
| 서머 브레이커! | sk_summer_breaker | R2 |
| 이매지너리 어라운드 | sk_imaginary_around | R5 |
| 카마의 재 | sk_ash_of_kama | R6 |
| 여신의 은혜 | sk_blessing_of_the_goddess | R3 |
| 난전의 소양 | sk_knowledge_of_combat | R11 |
| 혈맥여기 | sk_lineage_excitation | R1 |
| 주술(무) | sk_curse_shrine_maiden | R6 |
| 오로치의 저주 | sk_curse_of_the_orochi | R5 |
| 코가류 | sk_kougaryu | R2 |
| 무예의 구도 | sk_seeking_the_truth_of_martial_arts | R5 |
| 선의 선 | sk_planning_ahead | R7 |
| 신음류 | sk_shinkageryu | R5 |
| 수월 | sk_suigetsu | R2 |
| 무토도리 | sk_swordless_form | R3 |
| 인조사지(꼭두각시) | sk_synthetic_limbs_mechanical | R5 |
| 꼭두각시 환법 | sk_karakuri_genpou | R2 |
| 기척 차단(음) | sk_presence_concealment_shadow | R0 |
| 사신지상(백로) | sk_shishin_chisou_egret | R6 |
| 치요가미 조법 | sk_a423900 | R3 |
| 성요괴 | sk_castle_apparition | R8 |
| 무고의 괴수 | sk_innocent_kaiju | R9 |
| 오버로드 개 | sk_overload_type_ii | R3 |
| 파이널 에리짱 | sk_final_eli_chan | R4 |
| 독의 식찬 | sk_poisoned_meal | R8 |
| 출항의 조언 | sk_navigation_advice | R11 |
| 도술 | sk_taoist_technique | R5 |
| 영주자 | sk_spirit_jewel | R1 |
| 신장・중단원수 | sk_divine_general_marshal_of_the_central_altar | R6 |
| 여왕의 영향 | sk_queen_s_incense | R6 |
| 정령의 눈 | sk_eye_of_the_spirits | R6 |
| 마신의 예지 | sk_wisdom_of_the_demon_god | R5 |
| 영역 밖의 생명 | sk_entity_of_the_outer_realm | R0 |
| 광기 | sk_insanity | R0 |
| 심연에 빛이 되어 | sk_light_in_the_abyss | R4 |
| 이성 상실 | sk_mass_hysteria | R8 |
| 세일럼의 마녀 | sk_witch_of_salem | R6 |
| 숨겨진 대왕관 | sk_the_secret_great_crown | R2 |
| 마력방출(함) | sk_mana_burst_cage | R5 |
| 명계의 가호 | sk_blessing_of_kur | R3 |
| 문명침식 | sk_civilization_encroachment | R0 |
| 무지갯빛 설탕공예 | sk_rainbow_candy | R4 |
| 빛나는 별의 문장 | sk_crest_of_the_shiny_star | R6 |
| 삼라만상 | sk_all_things_in_nature | R2 |
| 부녀의 인연 | sk_father_daughter_bond | R5 |
| 아호・이성소 | sk_pseudonym_iseidako | R11 |
| 사역마(비둘기) | sk_familiar_dove | R3 |
| 이중소환 | sk_double_summon | R3 |
| 교만왕의 미주 | sk_a453550 | R6 |
| 왜곡의 마안 | sk_mystic_eyes_of_distortion | R5 |
| 천리안(어둠) | sk_clairvoyance_darkness | R6 |
| 통각잔류 | sk_remaining_sense_of_pain | R1 |
| 요정계약 | sk_fairy_contract | R0 |
| 투시의 마안 | sk_mystic_eyes_of_penetration | R5 |
| 절동의 카리스마 | sk_frigid_charisma | R6 |
| 슈비브지크 | sk_schwipsig | R3 |
| 수화 | sk_therianthropy | R0 |
| 마성순화 | sk_demonic_acclimatization | R6 |
| 야수의 논리 | sk_feral_logic | R2 |
| 수비술 | sk_numerology | R5 |
| 평온의 무화과 | sk_tranquil_fig | R0 |
| 통곡외장 | sk_lamenting_exterior | R5 |
| 참혹한 요원지화 | sk_horrific_wildfire | R6 |
| 모순정신 | sk_mental_schism | R6 |
| 무고의 괴물(이) | sk_innocent_monster_foreign | R5 |
| 비상대권 | sk_emergency_prerogative | R2 |
| 혜성주법 | sk_dr_mos_kom_t_s | R5 |
| 용사의 시들지 않는 꽃 | sk_andre_os_am_rantos | R2 |
| 하늘을 달리는 별의 창끝 | sk_diatrekh_n_ast_r_lonkh | R3 |
| 영생의 봉헌 | sk_eternal_dedication | R6 |
| 신수의 지혜 | sk_wisdom_of_divine_gift | R5 |
| 호문쿨루스 | sk_homunculus | R0 |
| 인공영웅(가짜) | sk_artificial_hero_fake | R3 |
| 용고영주 | sk_dead_count_shapeshifter | R6 |
| 극지 | sk_kyokuchi | R5 |
| 부단 | sk_persistence | R6 |
| 무변 | sk_boundless | R2 |
| 칼잡이 | sk_man_slayer | R6 |
| 검술 날래기로는 매와 같으니 | sk_swift_and_powerful_as_a_falcon | R11 |
| 선중팔책 | sk_senchu_hassaku | R3 |
| 유신의 영웅 | sk_hero_of_reform | R5 |
| 개선의 카리스마 | sk_charisma_of_triumphant_return | R6 |
| 화력지원(포) | sk_firepower_support_cannon | R4 |
| 가능성의 빛 | sk_light_of_possibility | R6 |
| 원초의 룬(전사) | sk_primordial_rune_warrior | R6 |
| 용종개조 | sk_dragon_modification | R1 |
| 예지의 결정 | sk_crystallized_wisdom | R11 |
| 백조예장 | sk_swan_mystic_code | R2 |
| 운명의 직조 | sk_fate_weaver | R3 |
| 얼어붙는 눈보라 | sk_shivering_blizzard | R8 |
| 주신의 예지 | sk_allfather_s_wisdom | R3 |
| 단독행동(셀럽) | sk_independent_action_celebrity | R0 |
| 엔드리스・인조이・서머! | sk_enjoying_endless_summer | R2 |
| 물가의 성녀(돌핀) | sk_saint_of_the_shore_dolphin | R4 |
| 서번트・치어! | sk_servant_cheer | R6 |
| 귀종의 마(물) | sk_demonic_nature_of_oni_water | R4 |
| 나는 아직 안 돌아갈 거다! | sk_i_m_not_going_home_yet | R12 |
| 서머 타임 트러블 걸 | sk_summer_time_trouble_girl | R6 |
| 텐구의 놀이법(여름) | sk_tengu_s_play_summer | R2 |
| 쿠라마의 아이 | sk_heaven_sent_child_of_kurama | R11 |
| 슈바르츠발트・팔케 | sk_schwarzwald_falke | R3 |
| 실추의 마녀 | sk_fallen_witch | R6 |
| 뫼르・오・튜・드와 | sk_meurs_o_tu_dois | R5 |
| 대지를 삼키는 자 | sk_one_who_swallows_the_land | R0 |
| 자기개조(애) | sk_self_modification_love | R6 |
| 황금 돼지의 잔 | sk_aurea_pork_poculum | R2 |
| 얼굴 없는 달 | sk_faceless_moon | R11 |
| 내가 수영복으로 갈아입으면 | sk_wardrobe_change_swimsuit | R3 |
| 오드 투왈렛・화이트 허니 | sk_eau_de_toilette_white_honey | R7 |
| 여왕의 훈육(바다) | sk_queen_s_discipline_sea | R6 |
| 승착 | sk_suit_up | R2 |
| 형사의 직감 | sk_police_instincts | R11 |
| 땅끝의 정의 | sk_justice_of_world_s_end | R6 |
| 마력방출(도약) | sk_mana_burst_jump | R2 |
| 피오나 기사단의 명예 | sk_the_knights_of_fianna_s_honor | R11 |
| 격정의 물결 | sk_beagalltach | R3 |
| 스노우 페어리 | sk_snow_fairy | R2 |
| 감정동결 | sk_frozen_emotion | R5 |
| 카무이유카라 | sk_a532551 | R6 |
| 호법의 오니・심악살 | sk_heartbreak | R7 |
| 호법의 오니・구살봉 | sk_break_rod | R5 |
| 귀종의 마(호) | sk_demonic_nature_of_oni_protect | R6 |
| 흉화 | sk_becoming_evil | R0 |
| 미래예지 | sk_foresight | R2 |
| 전술구체 | sk_tactical_body | R5 |
| 패왕의 무예 | sk_arts_of_a_conqueror | R6 |
| 은미의 가면 | sk_mask_of_concealing_beauty | R2 |
| 파죽지세 | sk_a543450 | R3 |
| 마성의 용모 | sk_demonic_visage | R5 |
| 백간창 | sk_white_cavalry_spear | R5 |
| 충사의 상 | sk_countenance_of_loyalty | R11 |
| 악한타파 | sk_vanquishing_ruffians | R1 |
| 책은 불태워라 | sk_scripts_should_be_burned | R8 |
| 유학자는 묻어버려라 | sk_confucianism_should_be_suppressed | R6 |
| 영세제위 | sk_eternal_reign | R3 |
| 수육정령 | sk_incarnated_elemental | R3 |
| 선계우인 | sk_taoist_winged_sage | R6 |
| 천리질주(말) | sk_running_a_thousand_li_horse | R5 |
| 무예백반(말) | sk_various_martial_arts_horse | R2 |
| 전투기동(말) | sk_battle_maneuver_horse | R6 |
| 클레르몽의 공훈 | sk_clermont_s_merit | R5 |
| 하얀 깃털의 기사 | sk_white_feathered_knight | R1 |
| 아름다운 미희의 반지 | sk_angelica_cathay | R6 |
| 삼비스타 | sk_sambista | R6 |
| 여신의 선물 | sk_gift_of_the_goddess | R11 |
| 크리스마스 살법 | sk_christmas_tactics | R5 |
| 여관 작성 | sk_inn_creation | R0 |
| 복화술 | sk_ventriloquism | R0 |
| 마요이가의 상차림 | sk_meal_at_the_mayoiga | R2 |
| 별의 상자(대) | sk_star_basket_large | R7 |
| 별의 상자(소) | sk_star_basket_small | R6 |
| 노련 | sk_veteran | R0 |
| 중국무술(팔극권) | sk_chinese_martial_arts_bajiquan | R6 |
| 권경(극) | sk_sphere_boundary_extreme | R2 |
| 음양교차 | sk_intersection_of_yin_yang | R6 |
| 유쾌형 마술예장(여동생) | sk_cheerful_model_mystic_code_younger_sister | R5 |
| 소녀의 고집 | sk_girl_s_willpower | R1 |
| 신의 아이의 소원 | sk_god_child_s_wish | R3 |
| 가선의 시가 | sk_great_poet_s_poem | R6 |
| 주술(사) | sk_curse_poem | R4 |
| 무라사키 시키부 일기 | sk_the_diary_of_lady_murasaki | R6 |
| 휴즈 스케일 | sk_huge_scale | R3 |
| 유아퇴행 | sk_infantile_regression | R3 |
| 대하의 거수 | sk_great_river_beast | R4 |
| 애신의 신핵 | sk_core_of_the_love_god | R0 |
| 신체 없는 자 | sk_ananga | R1 |
| 마라・파피야스 | sk_mara_p_p_yas | R6 |
| 선제의 지휘 | sk_emperor_xuan_s_command | R6 |
| 지상예장・월령수액 | sk_supreme_mystic_code_volumen_hydrargyrum | R2 |
| 천칭의 가호 | sk_blessing_of_the_scale | R6 |
| 마력방출(별) | sk_mana_burst_star | R5 |
| 별의 심판 | sk_star_s_judgment | R6 |
| 왕의 현신체 | sk_king_s_image | R0 |
| 대 령 전투 | sk_anti_spirit_combat | R6 |
| 봉인예장 해제 | sk_mystic_code_seal_release | R2 |
| 사업번창 | sk_thriving_business | R6 |
| 부러진 엄니 | sk_broken_tusk | R6 |
| 비나야카 | sk_vinayaka | R2 |
| 라니의 카리스마 | sk_charisma_of_rani | R6 |
| 진격하는 시파히 | sk_sipahi_s_assault | R2 |
| 괄리오르의 저항 | sk_gwalior_s_resistance | R1 |
| 우리의 사냥꾼 | sk_uri_s_hunter | R7 |
| 기회에 이르는 인내 | sk_perseverance_leads_to_opportunity | R5 |
| 에이밍 | sk_aiming | R6 |
| 대 사악(특수) | sk_anti_evil_unique | R6 |
| 천리안(초월) | sk_clairvoyance_transcendent | R3 |
| 혼의 등불 | sk_soul_s_light | R1 |
| 분노의 화신 | sk_fury_incarnate | R0 |
| 마니의 보주 | sk_mystic_gem_of_mani | R2 |
| 사도의 유린 | sk_violation_of_chivalry | R5 |
| 지존의 전사 | sk_revered_soldier | R5 |
| 의술의 신 | sk_god_of_medicine | R12 |
| 아폴론의 아이 | sk_child_of_apollo | R3 |
| 뱀주인 | sk_serpent_charmer | R1 |
| 어쩔 수 없군 | sk_can_t_be_helped | R6 |
| 몽환과도 같이 | sk_it_is_but_a_dream | R2 |
| 제육천마왕 | sk_demon_king_of_the_sixth_heaven | R5 |
| 정신오염(흉) | sk_mental_corruption_wicked | R6 |
| 피에 젖은 만용 | sk_blood_soaked_brute | R0 |
| 오니 무사시의 유언장 | sk_oni_musashi_s_will_and_testament | R11 |
| 운은 하늘에 달렸고 | sk_fate_decreed_by_heavens | R5 |
| 갑옷은 가슴에 달렸으며 | sk_armor_strengthened_by_heart | R2 |
| 공적은 발에 달렸노라 | sk_glory_gained_on_foot | R6 |
| 오버홀 | sk_overhaul | R0 |
| 만물의 궤적 | sk_a2426650 | R3 |
| 별에 꿈을 | sk_dream_upon_the_star | R4 |
| 추구했던 황금양모 | sk_the_desired_argon_coin | R12 |
| 위기 앞의 번뜩임 | sk_inspiration_at_death_s_door | R2 |
| 친구와 함께 하는 머나먼 바닷길 | sk_conquering_the_sea_with_friends | R6 |
| 태양신의 눈(가짜) | sk_sun_god_s_eye_fake | R2 |
| 남신의 총애 | sk_grace_of_the_god | R6 |
| 불화를 일으키는 황금 사과 | sk_dystych_a_milo | R3 |
| 늑대는 잠들지 않는다 | sk_the_wolf_never_sleeps | R1 |
| 아름다운 손의 가레스 | sk_gareth_of_the_beautiful_hands | R3 |
| 변신의 반지 | sk_ring_of_transformation | R3 |
| 해적신사 | sk_pirate_gentleman | R6 |
| 질풍의 약탈 | sk_swift_pillager | R5 |
| 군사의 숙원 | sk_tactician_s_cherished_desire | R5 |
| 암살의 천사 | sk_angel_of_assassination | R2 |
| 하늘의 뜻(암살) | sk_dispensation_from_heaven_assassination | R4 |
| 피로 얼룩진 은쟁반 | sk_blood_soaked_silver_platter | R6 |
| 천성의 육체(몸) | sk_natural_body_figure | R2 |
| 일곱 베일의 춤 | sk_dance_of_the_seven_veils | R12 |
| 제오성 | sk_fifth_zenith | R6 |
| 천마굉안 | sk_heavenly_demon_s_gaze | R1 |
| 요새구축 | sk_fortress_construction | R0 |
| 사격(FPS) | sk_shooting_fps | R2 |
| 프린세스 서머 베케이션(가짜) | sk_princess_summer_vacation_fake | R6 |
| 치요가미 대대장 | sk_chiyogami_battalion_commander | R5 |
| 팜 파탈(가짜) | sk_femme_fatale_fake | R7 |
| 괴도의 예고장 | sk_thief_s_calling_card | R8 |
| 미스트리스・C | sk_mistress_c | R8 |
| 신통력(묵) | sk_divine_power_ink | R3 |
| 아호・용문소 | sk_pseudonym_dragon_crested_octopus | R5 |
| 로열 버니 | sk_royal_bunny | R2 |
| 로열 카드 | sk_royal_card | R6 |
| 사자의 기사 | sk_knight_of_the_lion | R5 |
| 스완 레이크 | sk_swan_lake | R5 |
| 완전유체 | sk_complete_fluidity | R2 |
| 멜트 엔비 | sk_melt_envy | R6 |
| 기척 차단(J) | sk_presence_concealment_j | R0 |
| 대 마력(J) | sk_magic_resistance_j | R0 |
| 제트 천연이심류 | sk_jet_tennen_rishinryu | R6 |
| 심안(J) | sk_mind_s_eye_j | R2 |
| 진심・DRIVE | sk_makoto_drive | R5 |
| 데빌즈 슈가 | sk_devil_s_sugar | R6 |
| 비너스 드라이버 | sk_venus_driver | R2 |
| 멀티플 스타링 | sk_multiple_starling | R5 |
| 여신의 감시 역 | sk_goddess_s_chaperone | R8 |
| 은하전령 | sk_messenger_of_the_galaxy | R6 |
| 극성이여, 길을 가리켜라 | sk_o_polar_star_shine_my_way | R2 |
| 파각선언(강) | sk_declaration_of_destruction_strong | R3 |
| 공황을 불러일으키는 마적 | sk_la_black_luna | R2 |
| 위풍당당한 개선 | sk_majestic_triumphal_return | R6 |
| 어설트 메디슨 | sk_assault_medicine | R12 |
| 강철의 간호(성야) | sk_nurse_of_steel_holy_night | R1 |
| 천사가 성야에 울리는 종 | sk_bell_rung_by_an_angel_on_the_holy_night | R6 |
| 해신의 축복 | sk_blessing_of_the_sea_god | R0 |
| 천갈의 저주 | sk_curse_of_the_celestial_scorpion | R0 |
| 짐승성의 호완 | sk_stout_arm_of_brutality | R5 |
| 달의 여신의 압박 | sk_moon_goddess_s_pressure | R1 |
| 삼형제별의 궁수 | sk_tri_star_archer | R11 |
| 아홉 위인의 갑옷 | sk_armor_of_nine_worthies | R6 |
| 찰나의 일격 | sk_brink_shot | R6 |
| 브릴리아도로의 울음 | sk_brigliadoro_s_neigh | R5 |
| 무구의 공주 | sk_innocent_princess | R2 |
| 주신의 총애 | sk_grace_of_the_king_of_gods | R5 |
| 주신의 흰 황소 | sk_a704351 | R6 |
| 삼천총애재일신 | sk_favors_of_three_thousand_concentrated_to_one | R2 |
| 경국의 총희 | sk_ruinous_beauty | R3 |
| 요성의 화륜 | sk_a712551 | R5 |
| 단독행동(자기중심) | sk_independent_action_self_centered | R0 |
| 향로봉의 눈 | sk_snow_on_xiang_lu_feng | R0 |
| 일승법 | sk_teachings_that_drive_to_enlightenment | R0 |
| 오사카의 관문 | sk_meeting_checkpoint_of_osaka | R2 |
| 별은 묘성 | sk_the_stars_clusters | R5 |
| 전령신의 가호 | sk_protection_of_the_messenger_deity | R0 |
| 지장의 번뜩임 | sk_resourceful_general_s_inspiration | R5 |
| 일의전심(사랑) | sk_devote_thyself_to_one_purpose_love | R3 |
| 신체결계 | sk_aegis | R2 |
| 쌍신의 신핵 | sk_core_of_the_twin_gods | R0 |
| 주신의 별 | sk_star_of_the_king_of_the_gods | R3 |
| 항해의 수호자 | sk_guardian_of_sea_voyagers | R4 |
| 마력방출(빛/고대) | sk_a737551 | R2 |
| 해신의 신핵 | sk_core_of_the_sea_god | R0 |
| 찬탈의 미늘창 | sk_the_usurping_spear | R3 |
| 해신의 편애 | sk_poseidon_s_blessing | R1 |
| 주신의 신핵 | sk_core_of_the_king_of_gods | R0 |
| 퀴리누스의 옥좌 | sk_throne_of_quirinus | R6 |
| 신격전성 | sk_divinity_transformation | R2 |
| 사살하는 백 개의 머리・로마식 | sk_nine_lives_rome | R5 |
| 단독항해 | sk_independent_voyage | R0 |
| 문명접촉 | sk_contact_with_civilization | R0 |
| 별의 항해자 | sk_voyager_of_the_stars | R3 |
| 스윙바이 | sk_swing_by | R2 |
| 땅끝의 가호(우주) | sk_protection_of_world_s_end_space | R5 |
| 변화(공룡) | sk_morph_dinosaur | R9 |
| 구두룡의 뇌화 | sk_kuzuryu_lightning | R5 |
| 생명의 밧줄 | sk_rope_of_life | R12 |
| 대 마력(영) | sk_magic_resistance_spirit | R0 |
| 무사영매 | sk_evil_spirit_medium | R2 |
| 마탄의 사수(모조) | sk_der_freisch_tz_imitation | R6 |
| 사신 | sk_reaper | R6 |
| 독자마술 | sk_unique_magecraft | R0 |
| 희망의 카리스마 | sk_charisma_of_hope | R6 |
| 호수의 가호 | sk_protection_of_the_lake | R3 |
| 선정의 검 | sk_sword_of_selection | R2 |
| 이계작성 | sk_otherworldly_creation | R0 |
| 인어의 고기 | sk_mermaid_s_flesh | R1 |
| 합어전 | sk_clam_palace | R2 |
| 하이 프레셔! | sk_high_pressure | R5 |
| 서머 베케이션!(어린아이) | sk_summer_vacation_child | R2 |
| 리걸 샤워! | sk_legal_shower | R6 |
| 백조예장(여름) | sk_swan_dress_summer | R2 |
| 한여름의 예지 | sk_wisdom_of_summer | R3 |
| 서머타임 러버즈 | sk_summertime_lovers | R5 |
| 여름의 수육정령 | sk_summer_incarnated_elemental | R1 |
| 패왕의 여인 | sk_conqueror_s_princess | R3 |
| 지난날의 춤 | sk_dance_of_bygone_days | R5 |
| 장미의 잠 | sk_the_rose_s_slumber | R7 |
| 미드 서머 나이츠 | sk_midsummer_nights | R5 |
| 인도하는 자 | sk_those_who_guide | R3 |
| 미드나이트 오브 서머 사이드 | sk_midnight_of_summer_side | R1 |
| VR 신음류 | sk_vr_shinkageryu | R5 |
| 생존(산야) | sk_survival_hill_and_valley | R11 |
| 서머 나이트 블랙 위도우 | sk_summer_night_black_widow | R7 |
| 엽기취미(여름) | sk_bizarre_hobby_summer | R7 |
| 문학소녀(여름) | sk_literary_maiden_summer | R3 |
| 천연의 육체 | sk_primitive_body | R0 |
| 무녀의 카리스마 | sk_shrine_maiden_s_charisma | R6 |
| 귀도 | sk_kidou | R2 |
| 빛의 신탁 | sk_oracle_of_light | R6 |
| 발도자재 | sk_freely_drawn_sword | R5 |
| 무적의 검 | sk_invincible_sword | R6 |
| 치졸한 모략 | sk_immature_scheme | R8 |
| 나, 마천을 위해 죽으리 | sk_i_shall_die_for_the_heavens | R6 |
| 전란의 도화 | sk_adabana_of_war | R3 |
| 해바라기의 저주 | sk_curse_of_the_sunflower | R0 |
| 허수미술 | sk_void_space_art | R1 |
| 노란 집 | sk_het_gele_huis | R2 |
| 신령 깃들 물에 그림자 드리우다 | sk_a2437650 | R6 |
| 해신의 가호 | sk_protection_of_the_sea_god | R0 |
| 여행의 인도 | sk_guide_for_travel | R5 |
| 암흑의 신핵 | sk_core_of_darkness | R0 |
| 쾌락주의 | sk_hedonism | R0 |
| 리디큘 캣 | sk_ridicule_cat | R8 |
| 검은 생명 | sk_onyx_life | R1 |
| 도만의 저주 | sk_douman_s_curse | R6 |
| 무궁의 무련(대 마) | sk_eternal_arms_mastery_anti_demonic | R6 |
| 수천의 사도 | sk_suiten_s_disciple | R2 |
| 일조여교의 팔 자르기 | sk_severed_arm_at_ichijou_modori_bashi | R5 |
| 용종 | sk_dragonkin | R0 |
| 뱀신의 신핵 | sk_core_of_the_serpent_god | R0 |
| 산하의 여력 | sk_strength_of_mountains_and_rivers | R6 |
| 팔맥노도 | sk_octo_pulsing_billow | R5 |
| 부정한 손 끝 | sk_fingertips_of_defilement | R6 |
| 꿰뚫는 바즈라 | sk_piercing_vajra | R5 |
| 숙명의 신적 | sk_sworn_enemy_of_gods | R6 |
| 영원불멸의 마 | sk_indestructible_demon | R1 |
| 하드 펀처 | sk_hard_puncher | R0 |
| 풋 산타 | sk_footwork_santa | R5 |
| 섬광의 주먹 | sk_flash_fist | R2 |
| 베풂의 영웅(성야) | sk_hero_of_benefaction_holy_night | R3 |
| 도검심미 | sk_connoisseur_of_blades | R0 |
| 당대불길 | sk_sire_s_ill_omen | R0 |
| 타메시모노 | sk_tameshi_mono | R5 |
| 업의 눈 | sk_karmic_eye | R6 |
| 불꽃 | sk_flame | R3 |
| 겐지, 죽도록 하라 | sk_genji_must_die | R6 |
| 카게키요는 죽지 않는다 | sk_kagekiyo_never_dies | R1 |
| 아자마루의 안개 | sk_a838452 | R2 |
| 천하만세의 검 | sk_famed_blade | R2 |
| 음양도(법) | sk_a840551 | R6 |
| 육도병법 | sk_strategies_of_the_six_secret_teachings | R6 |
| 피학영매체질 | sk_masochistic_medium_s_nature | R0 |
| 강철의 신앙 | sk_iron_faith | R0 |
| 발렌티누스의 성해포 | sk_shroud_of_valentinus | R2 |
| 황금의 화살 | sk_golden_arrow | R3 |
| 마력방출(사랑) | sk_mana_burst_love | R5 |
| 피그말리온의 사랑 | sk_pygmalion_s_love | R5 |
| 조각상 소녀 | sk_sculpture_maiden | R1 |
| 아프로디테의 은혜 | sk_aphrodite_s_blessing | R3 |
| 진지작성(아틀리에) | sk_territory_creation_atelier | R0 |
| 도구작성(옷) | sk_item_creation_cloth | R0 |
| 레이디의 의상한 애정 | sk_lady_s_affection_for_garments | R2 |
| 일야우직 | sk_overnight_haori | R3 |
| 천년의 보은 | sk_thousand_year_gratitude | R6 |
| 원무절주 | sk_unparalleled_waltz | R2 |
| 무한역행 리릭 | sk_infinite_upstream_lyrics | R6 |
| 왕의 가성 | sk_king_s_singing_voice | R6 |
| 요정안 | sk_fae_eyes | R0 |
| 갈망의 카리스마 | sk_charisma_of_yearning | R6 |
| 땅끝으로부터 | sk_from_the_world_s_end | R1 |
| 와일드 룰 | sk_wild_rule | R5 |
| 파울 웨더 | sk_foul_weather | R3 |
| 그레이말킨 | sk_grimalkin | R2 |
| 축복받은 후계 | sk_blessed_scion | R3 |
| 요정흡혈 | sk_fae_vampirism | R3 |
| 드래곤 하트 | sk_dragon_heart | R6 |
| 페리 댄서 | sk_perry_dancer | R11 |
| 레이 호라이즌 | sk_ray_horizon | R2 |
| 성배의 가호 | sk_protection_of_the_holy_grail | R4 |
| 수호기사(성창) | sk_guardian_knight_sacred_lance | R3 |
| 구제의 빛 | sk_light_of_salvation | R2 |
| 여신변생(총) | sk_goddess_morph_gun | R0 |
| 이노베이터・버니 | sk_innovator_bunny | R3 |
| 살육기교(인) | sk_massacring_technique_human | R6 |
| NFF 스페셜 | sk_nff_special | R5 |
| 행운의 실잣기 | sk_weaving_thread_of_fortune | R11 |
| 조봉의 실잣기 | sk_quick_spinning | R5 |
| 신부의 수호자 | sk_protector_of_brides | R1 |
| ??? | sk_a900250 | R0 |
| 한여름 밤의 꿈 | sk_midsummer_night_s_dream | R0 |
| 밤의 장막 | sk_evening_shroud | R4 |
| 아침의 종다리 | sk_morning_lark | R3 |
| 꿈의 끝 | sk_ending_of_dreams | R5 |
| 마신검 | sk_majinken | R5 |
| 연옥 | sk_rengoku | R6 |
| 일월 | sk_sun_and_moon | R2 |
| 단독행동 with 비이 | sk_independent_action_with_viy | R0 |
| 슈비브지크(여름) | sk_schwipsig_summer | R5 |
| 프리징・서머 타임 | sk_freezing_summer_time | R2 |
| 가속・정령안구 | sk_accelerated_viy_viy_viy | R4 |
| 매직 쇼・필드 | sk_magic_show_field | R0 |
| 매직 굿즈・크리에이트 | sk_create_magic_goods | R0 |
| 일루셔니스트(가짜) | sk_illusionist_imposter | R2 |
| 엉터리 쇼・플래닝 | sk_haphazard_show_planning | R4 |
| 기술의 천사 | sk_stage_magician_angel | R3 |
| 꿈꾸는 기계 | sk_dreaming_machine | R5 |
| 트레저 체커 | sk_treasure_checker | R3 |
| 황혼에 빛나는 | sk_shining_at_twilight | R4 |
| 마왕의 신핵(?) | sk_core_of_the_demon_king | R0 |
| 마카라 플로팅 | sk_makara_floating | R2 |
| 공허한 마 | sk_hollow_evil | R4 |
| 한여름 바다의 마라 | sk_midsummer_sea_mara | R6 |
| 비치 크라이시스(포세이돈) | sk_beach_crisis_poseidon | R6 |
| 해왕류 | sk_sea_king_style | R5 |
| 서머 타임・컴뱃 | sk_summertime_combat | R1 |
| 서머 스트리트! | sk_summer_street | R6 |
| 나이트 풀・슬라이더 | sk_night_pool_slider | R2 |
| 우아한 서머 스위츠 | sk_dependable_summer_sweet | R11 |
| 타락의 서임 | sk_investiture_in_depravity | R6 |
| 성해포(가짜) | sk_holy_shroud_false | R2 |
| 참칭의 아우구스타 | sk_augusta_assumption | R5 |
| 동방의 여왕 | sk_a2438650 | R1 |
| 번영하는 팔미라 | sk_glory_to_palmyra | R6 |
| 스노우 화이트 프린세스 | sk_snow_white_princess | R2 |
| 레드 후드 슬라이서 | sk_red_hood_slicer | R5 |
| 글래스 신데렐라 | sk_glass_cinderella | R3 |
| 진지작성(카구라) | sk_territory_creation_kagura | R0 |
| 도구작성(기계장치) | sk_item_construction_puppet | R0 |
| 뉴 오쿠니 가부키 | sk_new_okuni_kabuki | R0 |
| 용맹한 춤 | sk_combat_dance | R2 |
| 인형 카구라 | sk_puppet_kagura | R6 |
| 봉인의 무녀 | sk_sealing_shrine_maiden | R3 |
| 란마니움 | sk_ranmanium | R0 |
| 마왕의 총애 | sk_demon_king_s_favor | R0 |
| 너는 섬세하구나 | sk_ranmaru_hand | R6 |
| 사랑스러운 그 눈동자 | sk_ranmaru_eye | R7 |
| 란마루 슈트랄 | sk_ranmaru_strahl | R5 |
| 변화(오로치) | sk_morph_orochi | R0 |
| 유신의 용 | sk_dragon_of_reform | R5 |
| 타카치호의 하얀 오로치 | sk_white_orochi_of_takachiho | R3 |
| 아마사카호코(쌍) | sk_ama_no_sakahoko_pair | R5 |
| 마르타의 수제 요리 | sk_martha_s_home_cooking | R6 |
| 언니의 참견 | sk_busybody_big_sister | R7 |
| 산타클로스의 초대장 | sk_invitation_from_santa_claus | R3 |
| 원시병법 | sk_primitive_tactics | R4 |
| 봉신집행 | sk_fengshen_zhixing | R6 |
| 사상건문 | sk_thought_keys | R3 |
| 영원한 젊은 무사 | sk_eternal_young_warrior | R1 |
| 벨자・다마스크 | sk_berza_damask | R5 |
| 벨자・부르코 | sk_berza_burko | R6 |
| NFF 서비스 | sk_nff_services | R0 |
| 네거 셀프 | sk_nega_self | R0 |
| 도미네이터・폭스 | sk_dominator_fox | R5 |
| 살육수단 | sk_massacring_beasts | R6 |
| 여신변생(짐승) | sk_goddess_morph_beast | R6 |
| 단독행동 B(EX) | sk_independent_action_b_ex | R0 |
| 위장 공작 | sk_diversion_tactic | R0 |
| 그 또한 이스칸다르니까(가짜) | sk_he_too_is_iskandar_false | R5 |
| 무명의 은혜 | sk_nameless_s_blessing | R3 |
| 전승보균자 | sk_god_s_holder | R0 |
| 봉인지정 집행자 | sk_seal_designation_enforcer | R5 |
| 해신의 룬 | sk_sea_god_s_runes | R6 |
| 붉은 가지의 후계 | sk_red_branch_successor | R2 |
| 반란의 카리스마 | sk_rebel_charisma | R5 |
| 자매의 인연 | sk_sisterly_bond | R5 |
| 쯩 성왕 | sk_a2034900 | R3 |
| 목성의 거울상 | sk_jupiter_s_reflection | R5 |
| 시육 | sk_sh_r_u | R1 |
| 흉신 | sk_ominous_god | R4 |
| 좋아요! 의 힘 | sk_power_of_like | R0 |
| 대통령령 | sk_executive_order | R5 |
| 비전 퀘스트 | sk_vision_quest | R3 |
| 메이플 시럽을 뿌리자 | sk_add_maple_syrup | R7 |
| 공덕의 봉사 | sk_virtuous_service | R5 |
| 이익중생 | sk_for_all_living_things | R3 |
| 쥐의 나라 | sk_country_of_mice | R2 |
| 바다나리의 카리스마 | sk_sea_lily_charisma | R5 |
| 화석부인의 대발견 | sk_madam_fossil_s_great_discovery | R11 |
| 상재 | sk_business_acumen | R6 |
| 하기아 소피아의 기도 | sk_hagia_sophia_s_prayer | R3 |
| 낙일의 제국 | sk_empire_s_decline | R5 |
| 종언특권 | sk_demise_privilege | R6 |
| 왕도답파 | sk_kingship_traversal | R2 |
| 성기사제 | sk_holy_knight_emperor | R6 |
| 마력방출(빛) | sk_mana_burst_light | R5 |
| 금강체 | sk_diamond_body | R2 |
| 사랑에 취해서 하염없이 눈물 | sk_bitter_tears_shed_for_love_of_love | R5 |
| 너무 늦은 뿔피리 | sk_roncesvalles_olifant | R3 |
| 복수계획(광분) | sk_revenge_plot_amok | R8 |
| 살육응수 | sk_murderous_retribution | R5 |
| 지체 높은 소녀의 사랑 | sk_noblewoman_s_love | R3 |
| 음모작성 | sk_conspiracy_formation | R0 |
| 패닉 컷 | sk_panic_cut | R0 |
| 수학적 사고 | sk_mathematical_thinking | R2 |
| 슬라이드룰・웨폰 | sk_slide_rule_weapon | R5 |
| 주사위의 선택 | sk_roll_of_the_dice | R3 |
| 동행종자 | sk_accompanying_attendant | R0 |
| 편력기사의 대모험 | sk_seasoned_knight_s_grand_adventure | R1 |
| 열리는 것은 몽상의 문 | sk_open_door_of_dreams | R6 |
| 닫히는 것은 현실의 장막 | sk_closed_veil_of_reality | R6 |
| 천공장군 | sk_general_of_heaven | R5 |
| 대현량사 | sk_great_teacher | R6 |
| 태평요술 | sk_taipingjing | R3 |
| 명전자성 | sk_svabh_va | R3 |
| 인의팔행 | sk_eight_benevolences_and_righteousnesses | R2 |
| 게사쿠삼매 | sk_lost_in_writing | R5 |
| 친제이 하치로 | sk_chinzei_hachirou | R5 |
| 불굴의 궁사 | sk_indomitable_bowmanship | R1 |
| 메카니컬 궁술 | sk_mechanical_archery | R6 |
| 원초의 하나 | sk_ultimate_one | R0 |
| 무지개의 마안 | sk_rainbow_mystic_eyes | R6 |
| 별의 숨결 | sk_breath_of_the_planet | R4 |
| 퍼니・뱀프 | sk_funny_vamp | R2 |
| 촌락작성 | sk_settlement_creation | R0 |
| 약화(우미인) | sk_debuff_yu_mei_ren | R0 |
| 오곡예찬 | sk_five_grain_praise | R3 |
| 도술(외) | sk_taoist_arts_out | R5 |
| 서복전설 | sk_legend_of_xu_fu | R4 |
| 고속영창(요) | sk_rapid_casting_monster | R0 |
| 그 손에 빛을 | sk_light_be_in_your_hands | R5 |
| 여름밤에 피는 꽃 | sk_flower_blooming_on_a_summer_s_night | R6 |
| 몽마의 곁 | sk_succubus_ridge | R2 |
| 빠른 환복 | sk_quick_change | R5 |
| 태양과 같은 가레스 | sk_gareth_like_the_sun | R1 |
| 붉은 검 | sk_robigus_ironside | R5 |
| 한여름의 여신 | sk_midsummer_goddess | R6 |
| 서머 치어리더 | sk_summer_cheerleader | R5 |
| 비치 아포칼립스 | sk_beach_apocalypse | R3 |
| 황천길의 경계 | sk_boundary_on_the_underworld_path | R3 |
| 원초의 룬(한여름) | sk_primordial_rune_midsummer | R5 |
| 한여름의 아이스크림 | sk_midsummer_frozen_treat | R5 |
| 여름의 깊은 밤에 나는 생각한다 | sk_fanciful_summer_nights | R3 |
| 천승의 의지 | sk_heavenly_will | R0 |
| 후궁의 카리스마(여름) | sk_consort_s_charisma_summer | R5 |
| 무씨 성의 기희 | sk_cursed_princess_wu | R6 |
| 황제도술 | sk_emperor_taoism | R7 |
| SMG/SAM66 | sk_smg_sam66 | R5 |
| 발키리식 집단 전투 | sk_valkyrie_group_combat | R2 |
| 발키리들의 환담 | sk_valkyrie_talk | R3 |
| 광화(아취) | sk_madness_enhancement_sabi | R0 |
| 진지작성(정취) | sk_territory_creation_wabi | R0 |
| 예술심미(차) | sk_aesthetic_appreciation_tea | R0 |
| 융통무애 | sk_unfettered | R0 |
| 수수한 멋의 극 | sk_finest_wabi | R5 |
| 한 송이 꽃 | sk_a_lone_flower | R2 |
| 유현한 흑색 | sk_profound_black | R6 |
| 무인이자 문인 | sk_learnt_warrior | R6 |
| 유록화홍 | sk_beautiful_spring_view | R5 |
| 친절한 사람 | sk_kind_one | R2 |
| 천연의 지체 | sk_primitive_limbs | R0 |
| 쿠나의 주법 | sk_kuna_s_spell | R0 |
| 귀도(멸) | sk_kidou_destruction | R5 |
| 어둠의 신탁 | sk_oracle_of_darkness | R6 |
| 종말의 무녀 | sk_shrine_maiden_of_the_end | R6 |
| 환수빙의 | sk_phantasmal_possession | R0 |
| 쌍편 | sk_double_bian | R5 |
| 천위성 | sk_prestige_star_of_heaven | R6 |
| 센시티브 멘탈 | sk_sensitive_mentality | R2 |
| 제로창기 | sk_ti_lu_qiang_ji | R0 |
| 황가의 인연 | sk_huang_family_s_bond | R0 |
| 무성왕 | sk_prince_wucheng | R5 |
| 금안신앵 | sk_divine_golden_eyed_warbler | R1 |
| 오색신우 | sk_five_colored_divine_ox | R6 |
| 진지작성(양산박) | sk_territory_creation_mount_liang | R0 |
| 승리의 함성・양산박 | sk_war_cry_mount_liang | R4 |
| 극대연회・양산박 | sk_grand_banquet_mount_liang | R3 |
| 천미성의 겉옷 | sk_minute_star_of_heaven_s_raiment | R5 |
| 여왕성새・파도개각 | sk_fortress_angela | R2 |
| 정숙의 미덕 | sk_virtue_of_chastity | R6 |
| 요정기사(요정향) | sk_tam_lin_fairy_country | R5 |
| 대행자 | sk_executor | R0 |
| 세례비적 | sk_baptismal_rite | R0 |
| 내독(기밀) | sk_poison_resistance_secret | R0 |
| 신앙의 가호(독) | sk_protection_of_faith_unique | R6 |
| 악심축제 | sk_malicious_feast | R5 |
| 죽지 않는 발루 | sk_a2173900 | R1 |
| 장례문서 | sk_elegiac_text | R5 |
| 명부신의 재정 | sk_god_of_the_underworld_s_judgment | R3 |
| 사막의 밤바람 | sk_desert_night_breeze | R2 |
| 전능의 지혜 | sk_omnipotent_wisdom | R0 |
| 전사의 관리자 | sk_chief_of_warriors | R0 |
| 투쟁의 카리스마 | sk_charisma_of_conflict | R6 |
| 검은 태양 | sk_black_sun | R2 |
| 산의 심장 | sk_heart_of_the_mountain | R1 |
| 물가의 삶 | sk_waterside_livelihood | R0 |
| 도시국가 동맹 | sk_city_state_alliance | R0 |
| 제3의 태양 | sk_third_sun | R3 |
| 꽃의 전쟁 | sk_x_chiy_y_tl | R6 |
| 달의 호수 | sk_lake_of_the_moon | R5 |
| 문명작성 | sk_civilization_creation | R0 |
| 비취의 카리스마 | sk_charisma_of_jade | R6 |
| 우리, 날개 달린 뱀 | sk_we_are_the_winged_serpent | R2 |
| 황금수해기행 | sk_golden_sea_of_trees | R2 |
| 환상의 성인 | sk_illusionary_saint | R6 |
| 기피되는 제례행렬 | sk_shunned_procession | R5 |
| 교황논의 | sk_papal_debate | R6 |
| 유신의 영웅(기) | sk_hero_of_reform_strange | R0 |
| 파천의 기린아 | sk_extraordinary_prodigy | R5 |
| 무장유신 | sk_innovation | R6 |
| 세상에 남으리, 우리의 정신 | sk_the_yamato_spirit_lives_on | R1 |
| 파란 별의 눈동자 | sk_eye_of_the_blue_star | R3 |
| 붉은 별의 눈동자 | sk_eye_of_the_red_star | R5 |
| 푸른 별의 바다 | sk_sea_of_the_azure_star | R4 |
| 정신오염(독) | sk_mental_corruption_poison | R0 |
| 독약조합 | sk_poison_mixing | R5 |
| 강건(독) | sk_toughness_poison | R1 |
| 조리(버섯) | sk_cooking_mushroom | R3 |
| 붉은 가지의 기사 | sk_red_branch_knight | R6 |
| 맹견 살해자 | sk_savage_dog_slayer | R5 |
| 영향의 무련 | sk_land_of_shadows_arms_mastery | R2 |
| 꼭두각시 작성 | sk_karakuri_construction | R0 |
| 정신개조 | sk_mental_modification | R0 |
| 환술(외술) | sk_illusionary_techniques_gejutsu | R2 |
| 살육기교 | sk_massacre_engine | R5 |
| 나가의 아독 | sk_n_ga_s_poison_fang | R0 |
| 바스키의 영약 | sk_v_suki_s_elixir | R1 |
| 곤봉술 | sk_club_technique | R5 |
| 하누만・하울링 | sk_hanum_n_howling | R6 |
| 인악의 카리스마 | sk_wicked_charisma | R6 |
| 흉조의 아이 | sk_child_of_ill_omens | R3 |
| 신수의 무구 | sk_god_given_armament | R0 |
| 마하마야 | sk_mah_m_y | R3 |
| 다가가기 어려운 자 | sk_unassailable_one | R2 |
| 제3의 눈 | sk_third_eye | R4 |
| 자기봉인・암흑신전 | sk_breaker_gorgon | R6 |
| 마의 혈맥 | sk_evil_lineage | R6 |
| 인자포식(전쟁의 여신) | sk_factor_predation_goddess_of_war | R2 |
| 비의 나라의 요정 | sk_faerie_from_the_land_of_rain | R4 |
| 역경의 카리스마 | sk_charisma_of_adversity | R6 |
| 라스트 리조트 | sk_last_resort | R1 |
| 요정안 ? | sk_fae_eyes_2 | R0 |
| 봄의 고동 | sk_spring_s_pulse | R6 |
| 여름의 요정 | sk_summer_faerie | R3 |
| 성검조종 | sk_sacred_sword_manipulation | R2 |
| BF・슈퍼 서머 | sk_bf_super_summer | R4 |
| 신통력(여름) | sk_divine_power_summer | R5 |
| 서머 플래그 | sk_summer_flag | R3 |
| 진척은 어떠신가요 | sk_how_s_the_progress | R6 |
| 아직 조정 가능해요 | sk_we_can_get_it_replaced_in_time | R1 |
| 원고 받았습니다! | sk_manuscript_received | R4 |
| 멜티 하트 | sk_melty_heart | R0 |
| 남천의 별 | sk_star_of_the_southern_sky | R0 |
| 여왕의 무덤 | sk_queen_s_grave | R3 |
| 여왕의 계약 | sk_queen_s_contract | R4 |
| VVV | sk_vvv | R5 |
| 요정기사 | sk_tam_lin | R0 |
| 페어리팩 | sk_faerie_pack | R5 |
| 창궁의 무련 | sk_azure_arms_mastery | R11 |
| 블루 호라이즌 | sk_blue_horizon | R2 |
| 뇌운포식자 | sk_thundercloud_devourer | R0 |
| 수호기사연맹 | sk_union_defence_knights | R6 |
| 퀸 키퍼 | sk_queen_keeper | R2 |
| 스트라이크 웨더 | sk_strike_weather | R4 |
| 요정기사 E/A | sk_tam_lin_e_a | R0 |
| 제신의 무녀 A/B | sk_maiden_of_the_enshrined_deity_a_b | R0 |
| 미코노스☆미코케르 | sk_mikonos_mikocer | R6 |
| 비의 나라의 후계 | sk_successor_of_the_land_of_rain | R3 |
| 미코노스 해머 | sk_mikonos_hammer | R4 |
| 별의 요람 | sk_cradle_of_the_stars | R0 |
| 자연의 물방울 | sk_nature_s_droplet | R2 |
| 생명축복 | sk_blessings_of_life | R4 |
| 물의 별을 바라보는 자 | sk_watcher_of_the_water_stars | R3 |
| 영기 정보 보존 | sk_spirit_origin_data_preservation | R0 |
| 구제의 카리스마 | sk_charisma_of_salvation | R6 |
| 분할사고(왕) | sk_memory_partition_king | R5 |
| 예지에 대한 접촉 | sk_connection_to_wisdom | R6 |
| 저격환경 | sk_sniping_conditions | R5 |
| 재정비(재장전) | sk_disengage_reload | R11 |
| 미채저격 | sk_camouflaged_sniping | R2 |
| 아리아드네의 기도 | sk_ariadne_s_prayer | R5 |
| 직감(미궁) | sk_intuition_labyrinth | R6 |
| 무예응보 | sk_martial_arts_retribution | R6 |
| 진지작성(타케다) | sk_territory_creation_takeda | R0 |
| 카이의 호랑이 | sk_tiger_of_kai | R6 |
| 붉은 불꽃 | sk_crimson_flame | R5 |
| 타테나시 | sk_shieldless | R2 |
| 마구신 | sk_gamushin | R1 |
| 검벌노정 | sk_furious_sword | R6 |
| 도구작성(총) | sk_item_construction_gun | R0 |
| 야타가라스의 눈 | sk_yatagarasu_eye | R6 |
| 사이카류 거합총술 | sk_saika_firearm_drawing_arts | R5 |
| 반딧불 | sk_firefly_light | R2 |
| 보재심 | sk_houzaishin | R0 |
| 운은 하늘에, 갑옷은 가슴에, 공적은 다리에 | sk_fortune_armor_victory | R2 |
| 하얀 불꽃 | sk_white_flame | R5 |
| 비천보탑 | sk_biten_s_pagoda | R6 |
| 성야의 운전자 | sk_driver_of_the_holy_night | R4 |
| 불굴의 배달자 | sk_undaunted_deliverer | R1 |
| 네임리스 세인트 | sk_nameless_saint | R2 |
| 피투성이 황자 | sk_blood_soaked_prince | R1 |
| 신마몰살 | sk_divine_and_evil_annihilator | R6 |
| 마력방출(물) | sk_mana_burst_water | R4 |
| 귀신의 현 | sk_divine_oni_manifestation | R0 |
| 도지기리 야스츠나 | sk_doujigiri_yasutsuna | R6 |
| 마력방출(신뢰) | sk_mana_burst_thunderclap | R5 |
| 마성귀신 | sk_unholy_transgressor | R4 |
| 위조생명(아종) | sk_counterfeit_life_form_subspecies | R1 |
| 열사의 군학 | sk_warrior_s_military_studies | R4 |
| 마술(원소) | sk_magecraft_elemental | R5 |
| 얼음과 같이 | sk_like_ice | R6 |
| 홍옥의 서 | sk_crimson_codex | R6 |
| 오륜의 칼날 | sk_blade_of_five_rings | R2 |
| 영웅원망 | sk_hero_aspiration | R0 |
| 수영능숙 | sk_good_swimmer | R0 |
| 카시오페이아의 딸 | sk_daughter_of_cassiopeia | R3 |
| 제물이 된 소녀 | sk_sacrificial_maiden | R1 |
| 신탁쇄 네레이데스 | sk_oracle_s_chains_nereids | R4 |
| 피투성이 목걸이 | sk_bloodstained_necklace | R3 |
| 조소의 단두대 | sk_guillotine_ricanante | R5 |
| 나의 사랑은 영원히 | sk_my_love_is_eternal | R1 |
| 암야의 무련 | sk_dark_night_martial_mastery | R5 |
| 전투가속(그림자) | sk_combat_acceleration_shadow | R2 |
| 검은 칼날 | sk_black_blade | R6 |
| 강철의 결의(불꽃) | sk_iron_determination_flame | R2 |
| 암굴왕 | sk_monte_cristo_mythology | R6 |
| 14의 돌 | sk_fourteen_stones | R6 |
| 물품주조(가짜) | sk_material_casting_fake | R0 |
| 영웅의 대적(가짜) | sk_hero_s_archenemy_fake | R0 |
| 나는 아샤라일지니 | sk_i_am_acharat | R4 |
| 알토타스 연속체 | sk_althotas_continuum | R1 |
| 동방무기 | sk_eastern_martial_arts | R5 |
| 마법사 | sk_magician | R0 |
| 마탄 장전 | sk_load_magic_bullet | R11 |
| 마술회로(자전) | sk_magic_circuit_rotation | R3 |
| 그 시대에, 다시 한번 | sk_to_your_era_once_more | R5 |
| 무사불살편로 | sk_mushi_fusatsu_henro | R5 |
| 차전륜자재부좌 | sk_shakutenrin_jizai_fuza | R6 |
| 백골만세천탑수험 | sk_hyakkotsu_bansei_sentou_shugen | R0 |
| 전승방어 | sk_folklore_defense | R0 |
| 유미나 | sk_yumina | R0 |
| 밤의 향연 | sk_diddle_diddle | R5 |
| 다리의 거인 | sk_thames_troll | R6 |
| 울새의 살인 | sk_lost_robin_rondo | R3 |
| 아지메 작법 | sk_achime_no_waza | R0 |
| 신이 노니는 정원 | sk_garden_of_divine_play | R0 |
| 이형의 신 | sk_abnormal_god | R0 |
| 오와니의 가호 | sk_protection_of_the_great_croc | R0 |
| 이소라의 춤 | sk_isora_s_dance | R2 |
| 와다츠미의 문 | sk_gate_of_wadatsumi | R3 |
| 조만주・조간주 | sk_tide_flowing_pearl_tide_ebbing_pearl | R4 |
| 자동재생 | sk_auto_regeneration | R0 |
| 대행자(궁) | sk_executor_bow | R0 |
| 인간마력공장 | sk_human_magical_energy_plant | R3 |
| 위상활검 | sk_phase_gliding_blade | R5 |
| 원리혈계 | sk_idea_blood | R3 |
| 여름의 나의 애마 | sk_my_summer_steed | R5 |
| 대 용 전투술(물가) | sk_anti_dragon_combat_near_water | R6 |
| 서머 타임 니키티치! | sk_summertime_nikitich | R3 |
| 복수자(명목) | sk_avenger_face | R0 |
| 도술(인형조작) | sk_taoist_arts_doll_control | R5 |
| 진지진화(촌락) | sk_territory_evolution_village | R3 |
| 만사수집 | sk_collection_worth_a_thousand_deaths | R4 |
| 미래관리 | sk_future_management | R0 |
| 인리사정(공) | sk_humanity_assessment_atk | R0 |
| 인리사정(방) | sk_humanity_assessment_def | R0 |
| 도시개조 | sk_urban_remodeling | R4 |
| 라그랑주 럭셔리 | sk_lagrange_luxury | R6 |
| 황금의 달의 도시 | sk_golden_lunar_metropolis | R3 |
| 달의 도시 | sk_lunar_city | R0 |
| 스콜 패닉! | sk_squall_panic | R6 |
| 서머 워즈 | sk_summer_wars | R9 |
| 달의 토끼 | sk_moon_rabbit | R2 |
| 양자갑주 | sk_quantum_armor | R2 |
| 중력조작 | sk_gravity_manipulation | R5 |
| 무악의 극한 | sk_villains_terminate | R3 |
| 코드 캐스트 | sk_code_cast | R0 |
| 달의 레갈리아 | sk_moon_regalia | R0 |
| 스파크스・루트∞ | sk_sparks_route | R11 |
| 체크메이트・인터셉터 | sk_checkmate_interceptor | R5 |
| C³퍼니시먼트 | sk_c_punishment | R6 |
| 동속혐오 | sk_aversion_to_the_self | R0 |
| 픽시 핑거 | sk_pixie_finger | R8 |
| 사쿠라 이터 | sk_sakura_eater | R3 |
| 달의 번데기 | sk_moon_pupa | R8 |
| 단독행동(카노포스) | sk_a2429351 | R0 |
| 소년왕의 저주 | sk_a2430650 | R0 |
| 왕가의 계곡 | sk_a2431450 | R4 |
| 소멸의 아마르나 | sk_a2432650 | R5 |
| 농화 | sk_a2433250 | R0 |
| 해바라기로서의 자화상 | sk_a2434350 | R0 |
| 허수미술(입체) | sk_a2435450 | R5 |
| 포테이토 이터 | sk_a2436350 | R3 |
| 태양과의 결별 | sk_a2428650 | R2 |
| 천체 궤도 조정 | sk_a2440450 | R2 |
| 북방의 재앙 | sk_a2441550 | R7 |
| 파멸의 난제 | sk_a2442450 | R3 |
| 환상의 프리마 | sk_a2443550 | R0 |
| 별사탕 요정의 춤 | sk_a2444650 | R5 |
| 파드되 | sk_a2445550 | R2 |
| 성야의 선물 | sk_a2446550 | R3 |
| 성야의 화신 | sk_a2448650 | R0 |
| 어스・하트 리듬 | sk_a2449550 | R4 |
| 레드・스타 뱀프 | sk_a2450650 | R5 |
| 블루・글라스 문 | sk_a2451650 | R6 |
| 사자심(신속) | sk_lionheart_swift | R6 |
| 기족백반 | sk_talented_in_all | R4 |
| 영원히 머나먼 승리의 검 D~A+ | sk_excalibur_d_a | R6 |
| 유독의 환상 | sk_a2456550 | R6 |
| 마력방출(용) | sk_a2457450 | R5 |
| 문장의 뱀 | sk_a2458650 | R2 |
| 산신의 가호 | sk_a2460450 | R2 |
| 영묘한 머리카락 | sk_a2459550 | R5 |
| 황금률(뱀&몸) | sk_a2461450 | R3 |
| 코마치 전설・용채 | sk_a2463550 | R5 |
| 사랑의 노래 | sk_a2464650 | R3 |
| 타카무라의 딸 | sk_a2465451 | R4 |

## 서번트별 발동 가능 스킬

| 서번트 ID | 발동 가능 / 전체 |
|---|---:|
| sv_0001_mash_kyrielight | 4 / 5 |
| sv_0003_altria_pendragon_alter | 4 / 4 |
| sv_0004_altria_pendragon_lily | 4 / 5 |
| sv_0005_nero_claudius | 4 / 5 |
| sv_0006_siegfried | 3 / 4 |
| sv_0007_gaius_julius_caesar | 5 / 6 |
| sv_0008_altera | 5 / 6 |
| sv_0009_gilles_de_rais | 4 / 6 |
| sv_0010_chevalier_d_eon | 4 / 5 |
| sv_0012_gilgamesh | 6 / 6 |
| sv_0013_robin_hood | 5 / 5 |
| sv_0014_atalante | 5 / 5 |
| sv_0015_euryale | 5 / 6 |
| sv_0016_arash | 5 / 5 |
| sv_0018_elisabeth_bathory | 5 / 5 |
| sv_0019_musashibou_benkei | 4 / 4 |
| sv_0020_cu_chulainn_prototype | 5 / 5 |
| sv_0021_leonidas_i | 4 / 4 |
| sv_0022_romulus | 4 / 4 |
| sv_0024_georgios | 4 / 5 |
| sv_0025_edward_teach | 4 / 4 |
| sv_0026_boudica | 4 / 5 |
| sv_0027_ushiwakamaru | 4 / 5 |
| sv_0028_alexander | 5 / 6 |
| sv_0029_marie_antoinette | 4 / 5 |
| sv_0030_martha | 5 / 6 |
| sv_0032_gilles_de_rais | 3 / 4 |
| sv_0033_hans_christian_andersen | 4 / 5 |
| sv_0034_william_shakespeare | 4 / 4 |
| sv_0035_mephistopheles | 2 / 5 |
| sv_0036_wolfgang_amadeus_mozart | 4 / 4 |
| sv_0037_zhuge_liang_lord_el_melloi_ii | 4 / 5 |
| sv_0038_cu_chulainn | 5 / 5 |
| sv_0040_hassan_of_the_cursed_arm | 4 / 4 |
| sv_0041_stheno | 5 / 6 |
| sv_0042_jing_ke | 4 / 4 |
| sv_0043_charles_henri_sanson | 4 / 4 |
| sv_0044_phantom_of_the_opera | 4 / 4 |
| sv_0045_mata_hari | 3 / 3 |
| sv_0046_carmilla | 4 / 4 |
| sv_0048_lancelot | 4 / 5 |
| sv_0049_lu_bu_fengxian | 3 / 4 |
| sv_0050_spartacus | 3 / 4 |
| sv_0051_sakata_kintoki | 4 / 5 |
| sv_0052_vlad_iii | 3 / 4 |
| sv_0053_asterios | 3 / 4 |
| sv_0054_caligula | 3 / 4 |
| sv_0055_darius_iii | 3 / 4 |
| sv_0056_kiyohime | 3 / 4 |
| sv_0057_eric_bloodaxe | 3 / 4 |
| sv_0058_tamamo_cat | 3 / 4 |
| sv_0059_jeanne_d_arc | 4 / 4 |
| sv_0060_orion | 5 / 5 |
| sv_0061_elisabeth_bathory_halloween | 4 / 5 |
| sv_0062_tamamo_no_mae | 5 / 5 |
| sv_0063_david | 5 / 5 |
| sv_0064_hektor | 4 / 5 |
| sv_0065_francis_drake | 4 / 5 |
| sv_0066_anne_bonny_and_mary_read | 4 / 4 |
| sv_0067_medea_lily | 3 / 5 |
| sv_0068_okita_souji | 4 / 5 |
| sv_0069_oda_nobunaga | 5 / 5 |
| sv_0070_scathach | 4 / 4 |
| sv_0071_diarmuid_ua_duibhne | 4 / 4 |
| sv_0072_fergus_mac_roich | 4 / 5 |
| sv_0073_altria_pendragon_santa_alter | 4 / 5 |
| sv_0074_nursery_rhyme | 4 / 4 |
| sv_0075_jack_the_ripper | 4 / 4 |
| sv_0076_mordred | 4 / 5 |
| sv_0077_nikola_tesla | 5 / 5 |
| sv_0078_altria_pendragon_alter | 4 / 5 |
| sv_0079_paracelsus_von_hohenheim | 4 / 5 |
| sv_0080_charles_babbage | 3 / 4 |
| sv_0081_henry_jekyll_and_hyde | 4 / 4 |
| sv_0082_frankenstein | 3 / 4 |
| sv_0084_arjuna | 6 / 6 |
| sv_0085_karna | 5 / 6 |
| sv_0086_mysterious_heroine_x | 3 / 5 |
| sv_0087_fionn_mac_cumhaill | 5 / 5 |
| sv_0088_brynhild | 5 / 6 |
| sv_0089_beowulf | 3 / 4 |
| sv_0090_nero_claudius_bride | 4 / 5 |
| sv_0091_ryougi_shiki_saber | 4 / 6 |
| sv_0092_ryougi_shiki_assassin | 5 / 5 |
| sv_0093_amakusa_shirou | 4 / 4 |
| sv_0094_astolfo | 5 / 6 |
| sv_0095_gilgamesh_child | 6 / 6 |
| sv_0096_edmond_dantes | 3 / 6 |
| sv_0097_florence_nightingale | 3 / 4 |
| sv_0098_cu_chulainn_alter | 4 / 5 |
| sv_0099_queen_medb | 4 / 5 |
| sv_0100_helena_blavatsky | 4 / 5 |
| sv_0101_rama | 5 / 6 |
| sv_0102_li_shuwen | 4 / 4 |
| sv_0103_thomas_edison | 3 / 5 |
| sv_0104_geronimo | 4 / 5 |
| sv_0105_billy_the_kid | 4 / 5 |
| sv_0106_jeanne_d_arc_alter | 3 / 6 |
| sv_0107_a_ra_mainiiu | 3 / 6 |
| sv_0108_iskandar | 5 / 6 |
| sv_0109_emiya_assassin | 5 / 5 |
| sv_0110_hassan_of_the_hundred_personas | 4 / 4 |
| sv_0111_irisviel_holy_grail | 4 / 5 |
| sv_0112_shuten_douji | 5 / 5 |
| sv_0113_xuanzang_sanzang | 5 / 5 |
| sv_0114_minamoto_no_raikou | 5 / 7 |
| sv_0115_sakata_kintoki_rider | 4 / 4 |
| sv_0116_ibaraki_douji | 3 / 4 |
| sv_0117_fuuma_evil_wind_kotarou | 4 / 4 |
| sv_0118_ozymandias | 5 / 6 |
| sv_0119_altria_pendragon_lancer | 4 / 5 |
| sv_0120_nitocris | 5 / 6 |
| sv_0121_lancelot | 4 / 5 |
| sv_0122_tristan | 5 / 5 |
| sv_0123_gawain | 4 / 5 |
| sv_0124_hassan_of_the_serenity | 5 / 5 |
| sv_0125_tawara_touta | 5 / 5 |
| sv_0126_bedivere | 4 / 5 |
| sv_0127_leonardo_da_vinci | 4 / 5 |
| sv_0128_tamamo_no_mae_lancer | 5 / 6 |
| sv_0129_altria_pendragon_archer | 6 / 6 |
| sv_0130_marie_antoinette_caster | 4 / 5 |
| sv_0131_anne_bonny_and_mary_read_archer | 5 / 5 |
| sv_0132_mordred_rider | 4 / 5 |
| sv_0133_scathach_assassin | 4 / 4 |
| sv_0134_kiyohime_lancer | 4 / 5 |
| sv_0135_martha_ruler | 4 / 4 |
| sv_0136_illyasviel_von_einzbern | 4 / 5 |
| sv_0137_chloe_von_einzbern | 5 / 5 |
| sv_0138_elisabeth_bathory_brave | 5 / 6 |
| sv_0139_cleopatra | 5 / 5 |
| sv_0140_vlad_iii_extra | 4 / 4 |
| sv_0141_jeanne_d_arc_alter_santa_lily | 4 / 4 |
| sv_0142_ishtar | 4 / 6 |
| sv_0143_enkidu | 4 / 4 |
| sv_0144_quetzalcoatl | 4 / 6 |
| sv_0145_gilgamesh | 5 / 6 |
| sv_0146_medusa | 4 / 5 |
| sv_0147_gorgon | 3 / 6 |
| sv_0148_jaguar_warrior | 5 / 6 |
| sv_0150_merlin | 4 / 6 |
| sv_0153_miyamoto_musashi | 4 / 4 |
| sv_0154_first_hassan | 6 / 7 |
| sv_0155_mysterious_heroine_x_alter | 3 / 5 |
| sv_0156_james_moriarty | 5 / 5 |
| sv_0157_emiya_alter | 5 / 5 |
| sv_0158_hessian_lobo | 3 / 6 |
| sv_0159_yan_qing | 4 / 5 |
| sv_0160_arthur_pendragon_prototype | 4 / 5 |
| sv_0161_hijikata_toshizo | 3 / 4 |
| sv_0162_chacha | 3 / 4 |
| sv_0163_meltryllis | 5 / 8 |
| sv_0164_passionlip | 6 / 8 |
| sv_0165_suzuka_gozen | 5 / 6 |
| sv_0166_bb | 5 / 6 |
| sv_0167_sessyoin_kiara | 3 / 7 |
| sv_0169_scheherazade | 4 / 4 |
| sv_0170_wu_zetian | 4 / 4 |
| sv_0171_penthesilea | 4 / 5 |
| sv_0172_christopher_columbus | 4 / 5 |
| sv_0173_sherlock_holmes | 4 / 4 |
| sv_0174_paul_bunyan | 3 / 4 |
| sv_0175_nero_claudius_caster | 4 / 6 |
| sv_0176_frankenstein_saber | 4 / 6 |
| sv_0177_nitocris_assassin | 5 / 5 |
| sv_0178_oda_nobunaga_berserker | 3 / 4 |
| sv_0179_altria_pendragon_alter_rider | 5 / 6 |
| sv_0180_helena_blavatsky_archer | 5 / 5 |
| sv_0181_minamoto_no_raikou_lancer | 5 / 7 |
| sv_0182_ishtar_rider | 4 / 6 |
| sv_0183_parvati | 4 / 5 |
| sv_0184_tomoe_gozen | 5 / 6 |
| sv_0185_mochizuki_chiyome | 4 / 4 |
| sv_0186_houzouin_inshun | 4 / 4 |
| sv_0187_yagyu_tajima_no_kami_munenori | 4 / 5 |
| sv_0188_katou_black_kite_danzo | 4 / 4 |
| sv_0189_osakabehime | 5 / 6 |
| sv_0190_mecha_eli_chan | 4 / 5 |
| sv_0191_mecha_eli_chan_mk_ii | 4 / 5 |
| sv_0192_circe | 4 / 5 |
| sv_0193_nezha | 4 / 4 |
| sv_0194_queen_of_sheba | 5 / 5 |
| sv_0195_abigail_williams | 4 / 6 |
| sv_0196_ereshkigal | 5 / 6 |
| sv_0197_attila_the_san_ta | 5 / 7 |
| sv_0198_katsushika_hokusai | 5 / 7 |
| sv_0199_semiramis | 6 / 7 |
| sv_0200_asagami_fujino | 6 / 6 |
| sv_0201_anastasia | 4 / 5 |
| sv_0202_atalante_alter | 4 / 5 |
| sv_0203_avicebron | 3 / 5 |
| sv_0204_antonio_salieri | 3 / 6 |
| sv_0205_ivan_the_terrible | 4 / 5 |
| sv_0206_achilles | 5 / 6 |
| sv_0207_chiron | 6 / 6 |
| sv_0208_sieg | 4 / 5 |
| sv_0209_okita_souji_alter | 5 / 5 |
| sv_0210_okada_izo | 4 / 4 |
| sv_0211_sakamoto_ryouma | 5 / 6 |
| sv_0212_napoleon | 5 / 5 |
| sv_0213_sigurd | 5 / 6 |
| sv_0214_valkyrie | 5 / 5 |
| sv_0215_scathach_skadi | 4 / 6 |
| sv_0216_jeanne_d_arc_archer | 4 / 5 |
| sv_0217_ibaraki_douji_lancer | 4 / 5 |
| sv_0218_ushiwakamaru_assassin | 5 / 6 |
| sv_0219_jeanne_d_arc_alter_berserker | 3 / 4 |
| sv_0220_bb | 4 / 7 |
| sv_0221_medb_saber | 4 / 5 |
| sv_0222_mysterious_heroine_xx | 4 / 7 |
| sv_0223_diarmuid_ua_duibhne | 4 / 5 |
| sv_0224_sitonai | 5 / 8 |
| sv_0225_shuten_douji_caster | 5 / 6 |
| sv_0226_xiang_yu | 3 / 4 |
| sv_0227_prince_of_lan_ling | 4 / 5 |
| sv_0228_qin_liangyu | 4 / 4 |
| sv_0229_qin_shi_huang | 4 / 4 |
| sv_0230_yu_mei_ren | 4 / 4 |
| sv_0231_red_hare | 3 / 4 |
| sv_0232_bradamante | 4 / 4 |
| sv_0233_quetzalcoatl_samba_santa | 4 / 5 |
| sv_0234_beni_enma | 6 / 8 |
| sv_0235_li_shuwen | 3 / 4 |
| sv_0236_miyu_edelfelt | 4 / 5 |
| sv_0237_murasaki_shikibu | 4 / 5 |
| sv_0238_kingprotea | 5 / 8 |
| sv_0239_kama | 4 / 7 |
| sv_0241_sima_yi_reines | 5 / 6 |
| sv_0242_astraea | 5 / 6 |
| sv_0243_gray | 5 / 6 |
| sv_0244_great_stone_statue_god | 5 / 6 |
| sv_0245_lakshmi_bai | 4 / 6 |
| sv_0246_william_tell | 5 / 5 |
| sv_0247_arjuna_alter | 4 / 5 |
| sv_0248_asvatthaman | 6 / 7 |
| sv_0249_asclepius | 5 / 6 |
| sv_0250_oda_nobunaga | 3 / 6 |
| sv_0251_mori_nagayoshi | 2 / 4 |
| sv_0252_nagao_kagetora | 5 / 6 |
| sv_0253_leonardo_da_vinci | 4 / 6 |
| sv_0254_jason | 4 / 5 |
| sv_0255_paris | 5 / 5 |
| sv_0256_gareth | 4 / 5 |
| sv_0257_bartholomew_roberts | 4 / 5 |
| sv_0258_chen_gong | 4 / 5 |
| sv_0259_charlotte_corday | 4 / 4 |
| sv_0260_salome | 3 / 4 |
| sv_0261_miyamoto_musashi_berserker | 5 / 7 |
| sv_0262_osakabehime_archer | 6 / 7 |
| sv_0263_carmilla_rider | 5 / 5 |
| sv_0264_katsushika_hokusai_saber | 5 / 5 |
| sv_0265_altria_pendragon_ruler | 5 / 5 |
| sv_0266_mysterious_alter_ego | 5 / 8 |
| sv_0267_okita_j_souji | 3 / 6 |
| sv_0268_space_ishtar | 5 / 9 |
| sv_0269_calamity_jane | 6 / 7 |
| sv_0270_astolfo_saber | 4 / 5 |
| sv_0271_florence_nightingale_santa | 5 / 6 |
| sv_0272_super_orion | 4 / 6 |
| sv_0273_mandricardo | 4 / 5 |
| sv_0274_europa | 5 / 6 |
| sv_0275_yang_guifei | 4 / 5 |
| sv_0276_sei_shounagon | 4 / 7 |
| sv_0277_odysseus | 4 / 6 |
| sv_0278_dioscuri | 4 / 10 |
| sv_0279_caenis | 4 / 6 |
| sv_0280_romulus_quirinus | 5 / 6 |
| sv_0281_voyager | 3 / 6 |
| sv_0282_kijyo_koyo | 4 / 5 |
| sv_0283_utsumi_erice | 5 / 7 |
| sv_0284_altria_caster | 5 / 6 |
| sv_0285_sessyoin_kiara_moon_cancer | 4 / 7 |
| sv_0286_illyasviel_von_einzbern_archer | 5 / 6 |
| sv_0287_brynhild_berserker | 4 / 5 |
| sv_0288_yu_mei_ren_lancer | 4 / 4 |
| sv_0289_abigail_williams_summer | 4 / 6 |
| sv_0290_tomoe_gozen_saber | 4 / 5 |
| sv_0291_murasaki_shikibu_rider | 3 / 4 |
| sv_0292_himiko | 5 / 6 |
| sv_0293_saito_hajime | 5 / 5 |
| sv_0294_oda_nobukatsu | 5 / 5 |
| sv_0295_van_gogh | 4 / 8 |
| sv_0296_nemo | 4 / 6 |
| sv_0297_ashiya_douman | 5 / 9 |
| sv_0298_watanabe_no_tsuna | 4 / 5 |
| sv_0299_ibuki_douji | 4 / 7 |
| sv_0300_vritra | 4 / 5 |
| sv_0301_karna_santa | 5 / 6 |
| sv_0302_senji_muramasa | 5 / 7 |
| sv_0303_taira_no_kagekiyo | 3 / 6 |
| sv_0304_kiichi_hogen | 6 / 6 |
| sv_0305_amor_caren | 4 / 8 |
| sv_0306_galatea | 4 / 5 |
| sv_0307_miss_crane | 3 / 5 |
| sv_0308_mysterious_idol_x_alter | 3 / 6 |
| sv_0309_morgan | 5 / 8 |
| sv_0310_tam_lin_gawain | 4 / 5 |
| sv_0311_tam_lin_tristan | 5 / 6 |
| sv_0312_tam_lin_lancelot | 5 / 5 |
| sv_0313_percival | 4 / 5 |
| sv_0314_koyanskaya_of_light | 5 / 8 |
| sv_0315_habetrot | 3 / 6 |
| sv_0316_oberon | 4 / 8 |
| sv_0317_okita_souji_alter_saber | 5 / 5 |
| sv_0318_anastasia_and_viy | 3 / 5 |
| sv_0319_charlotte_corday_caster | 3 / 5 |
| sv_0320_leonardo_da_vinci_ruler | 4 / 6 |
| sv_0321_kama_avenger | 4 / 10 |
| sv_0322_caenis_rider | 3 / 5 |
| sv_0323_sei_shounagon_berserker | 3 / 6 |
| sv_0324_jacques_de_molay | 5 / 6 |
| sv_0325_zenobia | 5 / 6 |
| sv_0326_elisabeth_bathory_cinderella | 3 / 4 |
| sv_0327_izumo_no_okuni | 3 / 6 |
| sv_0328_mysterious_ranmaru_x | 4 / 9 |
| sv_0329_sakamoto_ryouma_lancer | 4 / 6 |
| sv_0330_martha_santa | 4 / 6 |
| sv_0331_taigong_wang | 3 / 4 |
| sv_0332_dobrynya_nikitich | 4 / 5 |
| sv_0334_koyanskaya_of_dark | 3 / 6 |
| sv_0335_hephaistion | 4 / 7 |
| sv_0336_manannan_mac_lir_bazett | 5 / 7 |
| sv_0337_hai_ba_trung | 5 / 6 |
| sv_0338_taisui_xingjun | 5 / 6 |
| sv_0339_super_bunyan | 4 / 6 |
| sv_0340_daikokuten | 5 / 6 |
| sv_0341_mary_anning | 4 / 4 |
| sv_0342_konstantinos_xi | 5 / 6 |
| sv_0343_charlemagne | 4 / 5 |
| sv_0344_roland | 4 / 5 |
| sv_0345_kriemhild | 3 / 4 |
| sv_0346_james_moriarty | 4 / 6 |
| sv_0347_don_quixote | 4 / 6 |
| sv_0348_zhang_jue | 4 / 5 |
| sv_0349_kyokutei_bakin | 5 / 6 |
| sv_0350_minamoto_no_tametomo | 5 / 5 |
| sv_0351_archetype_earth | 6 / 8 |
| sv_0352_xu_fu | 3 / 7 |
| sv_0353_lady_avalon | 4 / 8 |
| sv_0354_gareth_saber | 4 / 5 |
| sv_0355_ibuki_douji_berserker | 3 / 6 |
| sv_0356_utsumi_erice_avenger | 5 / 9 |
| sv_0357_scathach_skadi_ruler | 5 / 6 |
| sv_0358_wu_zetian_caster | 4 / 6 |
| sv_0359_thrud | 5 / 5 |
| sv_0360_hildr | 5 / 5 |
| sv_0361_ortlinde | 5 / 5 |
| sv_0362_sen_no_rikyu | 3 / 7 |
| sv_0363_yamanami_keisuke | 4 / 5 |
| sv_0364_iyo | 5 / 7 |
| sv_0365_huyan_zhuo | 4 / 6 |
| sv_0366_huang_feihu | 5 / 8 |
| sv_0367_elisa_the_nine_tattooed_dragon | 4 / 5 |
| sv_0368_britomart | 4 / 4 |
| sv_0369_grigori_rasputin | 4 / 7 |
| sv_0370_nitocris_alter | 4 / 8 |
| sv_0371_tezcatlipoca | 6 / 8 |
| sv_0372_tlaloc | 5 / 7 |
| sv_0373_kukulcan | 3 / 5 |
| sv_0374_pope_johanna | 5 / 5 |
| sv_0375_takasugi_shinsaku | 5 / 6 |
| sv_0376_larva_tiamat | 5 / 8 |
| sv_0378_locusta | 4 / 5 |
| sv_0379_setanta | 5 / 5 |
| sv_0380_kashin_koji | 4 / 6 |
| sv_0381_bhima | 5 / 6 |
| sv_0382_duryodhana | 3 / 4 |
| sv_0383_durga | 5 / 8 |
| sv_0384_medusa | 5 / 6 |
| sv_0385_aesc_the_rain_witch | 5 / 7 |
| sv_0386_altria_caster | 4 / 7 |
| sv_0387_suzuka_gozen_vacay | 6 / 7 |
| sv_0388_chloe_von_einzbern | 4 / 7 |
| sv_0389_cnoc_na_riabh_yaraandoo | 4 / 6 |
| sv_0390_melusine | 4 / 6 |
| sv_0391_udk_barghest | 4 / 7 |
| sv_0392_cait_cu_mikocer | 5 / 8 |
| sv_0393_wandjina | 4 / 6 |
| sv_0394_ptolemaios | 6 / 7 |
| sv_0395_sugitani_zenjubou | 5 / 5 |
| sv_0396_theseus | 4 / 5 |
| sv_0397_takeda_harunobu | 4 / 6 |
| sv_0398_nagakura_shinpachi | 3 / 4 |
| sv_0399_saika_magoichi | 5 / 6 |
| sv_0400_uesugi_kenshin | 5 / 7 |
| sv_0401_nemo_santa | 4 / 6 |
| sv_0402_yamato_takeru | 5 / 6 |
| sv_0403_minamoto_no_raikou_ushi_gozen | 3 / 8 |
| sv_0404_yui_shousetsu | 4 / 5 |
| sv_0405_miyamoto_iori | 4 / 5 |
| sv_0406_andromeda | 4 / 7 |
| sv_0407_marie_antoinette_alter | 3 / 6 |
| sv_0408_hassan_of_the_shining_star | 4 / 5 |
| sv_0409_monte_cristo | 3 / 6 |
| sv_0410_alessandro_di_cagliostro | 3 / 6 |
| sv_0413_aozaki_aoko | 4 / 7 |
| sv_0414_sizuki_soujyuro | 4 / 6 |
| sv_0415_kuonji_alice | 4 / 7 |
| sv_0416_hibiki_and_chikagi | 4 / 8 |
| sv_0418_mysterious_executor_c_i_e_l | 5 / 7 |
| sv_0419_dobrynya_nikitich_lancer | 4 / 5 |
| sv_0420_xu_fu_avenger | 3 / 7 |
| sv_0421_bb_dubai | 4 / 9 |
| sv_0422_tenochtitlan_moon_cancer | 5 / 8 |
| sv_0423_mysterious_heroine_xx_alter | 4 / 7 |
| sv_0424_kishinami_hakuno | 4 / 6 |
| sv_0425_kishinami_hakuno | 4 / 6 |
| sv_0426_kazuradrop | 5 / 7 |
| sv_0427_servant_427 | 4 / 7 |
| sv_0428_servant_428 | 3 / 6 |
| sv_0429_servant_429 | 5 / 6 |
| sv_0430_servant_430 | 5 / 7 |
| sv_0431_servant_431 | 6 / 8 |
| sv_0432_richard_i | 4 / 5 |
| sv_0433_servant_433 | 6 / 7 |
| sv_0434_servant_434 | 4 / 5 |
| sv_0435_servant_435 | 4 / 6 |
