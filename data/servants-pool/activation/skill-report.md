# 신규 93기 스킬 자동 배정 (D-157)

신규 서번트 93기, 새 계열 265개. 규칙 수는 새 정의 기준.

## 규칙별 개수

| 규칙 | 개수 |
|---|---:|
| R0 | 21 |
| R1 | 16 |
| R2 | 22 |
| R3 | 34 |
| R4 | 18 |
| R5 | 45 |
| R6 | 52 |
| R7 | 12 |
| R8 | 15 |
| R9 | 9 |
| R10 | 2 |
| R11 | 9 |
| R12 | 10 |

## R0 계열

- 심연의 사시 (sk_evil_eye_of_the_abyss): func:addState, buff:selfturnendFunction
- 여신의 신핵 (sk_core_of_the_goddess): func:addStateShort, func:addState, buff:addDamage, buff:upTolerance
- 무한의 마력공급 (sk_infinite_magical_energy): func:addStateShort, buff:regainNp
- 혼혈 (sk_mixed_blood): func:addStateShort, buff:regainNp
- 평온의 무화과 (sk_tranquil_fig): func:addState, buff:deadFunction
- 경계에서 (sk_on_the_boundary): func:addState, func:addStateShort, buff:avoidInstantdeath, buff:upTolerance, buff:commandattackAfterFunction, buff:avoidState
- 광화 EX(C 상당) (sk_madness_enhancement_ex_c_equivalent): func:addStateShort, buff:upCommandall
- 복수자 (sk_avenger): func:addState, buff:downTolerance, buff:upDamagedropnp
- 망각보정 (sk_oblivion_correction): func:addStateShort, buff:upCriticaldamage
- 자기회복(마력) (sk_self_restoration_magical_energy): func:addStateShort, buff:regainNp
- 하이 서번트 (sk_high_servant): func:none
- 짐승의 권능 (sk_authority_of_beasts): func:addStateShort, buff:upCriticaldamage
- 단독현현 (sk_independent_manifestation): func:addStateShort, func:addState, buff:upCriticaldamage, buff:upResistInstantdeath, buff:upTolerance
- 로고스 이터 (sk_logos_eater): func:addState, buff:upDefence
- 네거 세이비어 (sk_nega_saver): func:addState, buff:overwriteClassRelation
- 암흑의 신핵 (sk_core_of_darkness): func:addStateShort, buff:addDamage, buff:upGrantInstantdeath
- 쾌락주의 (sk_hedonism): func:addState, buff:upDamagedropnp
- 영역 밖의 생명 (sk_entity_of_the_outer_realm): func:addStateShort, func:addState, buff:regainStar, buff:upTolerance
- 광기 (sk_insanity): func:addStateShort, buff:upCommandall
- ??? (sk_a900250): func:addStateShort, buff:upGrantstate, buff:downGrantstate
- 한여름 밤의 꿈 (sk_midsummer_night_s_dream): func:addState, buff:avoidState

## 새 skill_id

| KR 계열명 | skill_id | 규칙 |
|---|---|---|
| 마력방출(역린) | sk_mana_burst_wrath | R5 |
| 초저녁의 별 | sk_star_of_twilight | R3 |
| 부의 잔 | sk_chalice_of_wealth | R5 |
| 황제특권(갈채) | sk_imperial_privilege_applause | R5 |
| 세 번, 낙일을 맞이할지라도 | sk_invictus_spiritus | R1 |
| 탐욕의 황금 | sk_avaricious_gold | R6 |
| 용살자 | sk_dragon_slayer | R5 |
| 신의 채찍 | sk_scourge_of_god | R4 |
| 완전구조체 | sk_perfect_composition | R6 |
| 별의 문장 | sk_crest_of_the_star | R6 |
| 흰 백합에 빛을 | sk_a2447551 | R5 |
| 아름다운 풍모 | sk_beautiful_appearance | R9 |
| 축지 | sk_shukuchi | R5 |
| 절도 | sk_zettou | R6 |
| 붉은 번개의 기사 | sk_knight_of_red_lightning | R5 |
| 시가렛 라이온 | sk_cigarette_lion | R6 |
| 부정을 숨기는 투구 | sk_secret_of_pedigree | R3 |
| 호수의 기사 | sk_knight_of_the_lake | R3 |
| 무궁의 무련 | sk_eternal_arms_mastery | R11 |
| 기사는 맨손으로 죽지 않는다 | sk_knight_of_owner | R6 |
| 성자의 숫자 | sk_numeral_of_the_saint | R5 |
| 불야의 카리스마 | sk_nightless_charisma | R6 |
| 베르틸락의 벨트 | sk_belt_of_bertilak | R1 |
| 제오세 | sk_fifth_force | R6 |
| 천안 | sk_heavenly_eye | R5 |
| 무공 | sk_emptiness | R2 |
| 붉은 용의 증표 | sk_mark_of_the_crimson_dragon | R5 |
| 눈부신 여로 | sk_resplendent_journey | R6 |
| 성검 사용자(별) | sk_sacred_sword_wielder_star | R6 |
| 모든 것을 본 자 | sk_he_who_saw_the_deep | R4 |
| 황금률 | sk_golden_rule | R3 |
| 바빌론의 창고 | sk_treasury_of_babylon | R3 |
| 파괴공작 | sk_sabotage | R8 |
| 5월의 왕 | sk_may_king | R2 |
| 아르카디아 너머 | sk_beyond_arcadia | R5 |
| 몰이사냥의 미학 | sk_hunter_s_aesthetic | R11 |
| 칼리돈 사냥 | sk_calydonian_hunt | R2 |
| 강건 | sk_toughness | R9 |
| 천리안 | sk_clairvoyance | R11 |
| 궁시작성 | sk_arrow_construction | R3 |
| 노부나가 택틱스 | sk_nobunaga_tactics | R4 |
| 천하포무 | sk_unifying_the_nation_by_force | R6 |
| 마왕 | sk_demon_king | R6 |
| 테슬라 코일 | sk_tesla_coil | R3 |
| 천부의 예지 | sk_inherent_wisdom | R1 |
| 별의 개척자 | sk_pioneer_of_the_stars | R6 |
| 천리안(사수) | sk_clairvoyance_shooter | R11 |
| 축복받는 영웅 | sk_hero_of_the_endowed | R3 |
| 마력방출(불꽃) | sk_mana_burst_flame | R4 |
| 드높이 사랑을 찬양하리라 | sk_resounding_proclamation_of_love | R2 |
| 축복받지 못한 탄생 | sk_unblessed_birth | R3 |
| 기사왕에 대한 간언 | sk_critique_to_the_king | R8 |
| 투영마술 | sk_projection | R5 |
| 키스마 | sk_kissing_freak | R3 |
| 방탄 가공 | sk_bulletproof | R9 |
| 회로접속(위법) | sk_circuit_connect_illegal | R5 |
| 비웃는 철심 | sk_icy_sneer | R6 |
| 영생의 봉헌 | sk_eternal_dedication | R6 |
| 신수의 지혜 | sk_wisdom_of_divine_gift | R5 |
| 기학의 카리스마 | sk_sadistic_charisma | R6 |
| 체이테의 밤 | sk_csejte_night | R7 |
| 전투속행 | sk_battle_continuation_2 | R1 |
| 룬 마술 | sk_rune_spell | R6 |
| 짐승 살해자 | sk_beast_slayer | R6 |
| 최후미의 긍지 | sk_rear_guard_s_pride | R3 |
| 삼백의 분투 | sk_endurance_of_the_three_hundred | R1 |
| 전사의 포효 | sk_warrior_s_war_cry | R5 |
| 로망의 바람 | sk_wind_of_romance | R3 |
| 황제특권 | sk_imperial_privilege | R6 |
| 일곱 언덕 | sk_septem_colles | R1 |
| 트로이의 수호자 | sk_guardian_of_troy | R4 |
| 우의의 증명 | sk_proof_of_friendship | R7 |
| 수세의 카리스마 | sk_a2419550 | R6 |
| 마경의 지혜 | sk_wisdom_of_d_n_sc_ith | R2 |
| 원초의 룬 | sk_primordial_rune | R5 |
| 신살자 | sk_god_slayer | R6 |
| 사랑의 점 | sk_love_spot | R8 |
| 비련요란 | sk_profusion_of_tragic_love | R5 |
| 빈자의 식견 | sk_knowledge_of_the_deprived | R7 |
| 희사의 끝 | sk_fruits_of_benefaction | R6 |
| 영웅의 하인 | sk_hero_s_assistant | R6 |
| 신앙의 가호 | sk_protection_of_the_faith | R6 |
| 악마의 군략 | sk_demonic_tactics | R4 |
| 무고의 괴물 | sk_innocent_monster | R9 |
| 변용 | sk_transformation | R5 |
| 기척 감지 | sk_presence_detection | R2 |
| 백성의 예지 | sk_wisdom_of_the_people | R3 |
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
| 왕통의 음색 | sk_royal_melody | R6 |
| 아름다운 공주 | sk_beautiful_princess | R2 |
| 신의 은총 | sk_god_s_grace | R10 |
| 기적 | sk_miracle | R12 |
| 성녀의 맹세 | sk_oath_of_the_holy_maiden | R8 |
| 달려나가는 황금률 | sk_overhaul_golden_rule | R5 |
| 건드리면 넘어진다! | sk_trap_of_argalia | R7 |
| 이성 증발 | sk_evaporation_of_reason | R6 |
| 저편으로 향하는 자들 | sk_they_who_seek_the_horizon | R6 |
| 제압군략 | sk_suppressive_tactics | R4 |
| 번개의 정복자 | sk_lightning_conqueror | R5 |
| 열사의 신왕 | sk_divine_king_of_the_burning_sands | R6 |
| 태양신의 가호 | sk_protection_of_the_sun_god | R3 |
| 혜성주법 | sk_dr_mos_kom_t_s | R5 |
| 용사의 시들지 않는 꽃 | sk_andre_os_am_rantos | R2 |
| 하늘을 달리는 별의 창끝 | sk_diatrekh_n_ast_r_lonkh | R3 |
| 정신오염 | sk_mental_corruption | R10 |
| 모독심미 | sk_sacrilegious_appreciation | R8 |
| 심연의 사시 | sk_evil_eye_of_the_abyss | R0 |
| 인간관찰 | sk_human_observation | R4 |
| 고속영창 | sk_rapid_casting | R3 |
| 인어공주의 사랑 | sk_mermaid_s_love | R3 |
| 인챈트 | sk_enchant | R5 |
| 자기보존 | sk_self_preservation | R2 |
| 국왕일좌 | sk_king_s_men | R3 |
| 감식안 | sk_discerning_eye | R6 |
| 군사의 충언 | sk_tactician_s_advice | R3 |
| 군사의 지휘 | sk_tactician_s_command | R6 |
| 샘에서 | sk_at_the_lake | R6 |
| 주층・광일조 | sk_malediction_boundless_sunshine | R4 |
| 변화 | sk_morph | R9 |
| 여우 시집가기 | sk_fox_s_wedding | R5 |
| 여신의 신핵 | sk_core_of_the_goddess | R0 |
| 하늘의 잔 | sk_goblet_of_heaven | R4 |
| 자연의 영아 | sk_child_of_nature | R2 |
| 마술의료 | sk_magical_healing | R12 |
| 총명예지 | sk_brilliance_of_a_genius | R1 |
| 모나리자 | sk_mona_lisa | R5 |
| 무한의 마력공급 | sk_infinite_magical_energy | R0 |
| 유쾌형 마술예장 | sk_cheerful_model_mystic_code | R5 |
| 미래를 향해 빛나는 | sk_dazzling_towards_the_future | R2 |
| 수상한 약 | sk_suspicious_medicine | R1 |
| 혼혈 | sk_mixed_blood | R0 |
| 몽환의 카리스마 | sk_dreamlike_charisma | R6 |
| 환술 | sk_illusion | R2 |
| 영웅 작성 | sk_hero_creation | R5 |
| 수비술 | sk_numerology | R5 |
| 평온의 무화과 | sk_tranquil_fig | R0 |
| 투척/회수 | sk_throw_retrieve | R11 |
| 자기개조 | sk_self_modification | R6 |
| 바람막이의 가호 | sk_protection_against_the_wind | R2 |
| 흡혈 | sk_vampirism | R3 |
| 매혹의 미성 | sk_siren_song | R7 |
| 여신의 변덕 | sk_whim_of_the_goddess | R6 |
| 억제 | sk_restrain | R11 |
| 십보살일인 | sk_sh_b_sh_y_r_n | R6 |
| 방약무인 | sk_insolent | R5 |
| 가르니에에서 부르는 목소리 | sk_shriek_from_the_palais_garnier | R7 |
| 붉게 빛나는 죽음의 가면 | sk_a2439551 | R4 |
| 뱅센에 해는 지고 | sk_the_sun_goes_down_in_vincennes | R6 |
| 페로몬 | sk_pheromone | R7 |
| 더블 크로스 | sk_double_cross | R7 |
| 안개 낀 밤의 살인 | sk_murder_on_a_misty_night | R2 |
| 정보 말소 | sk_information_erasure | R8 |
| 외과수술 | sk_surgery | R12 |
| 직사의 마안 | sk_mystic_eyes_of_death_perception | R5 |
| 빗속에서 만나다 | sk_encounter_in_the_rain | R2 |
| 음양어 | sk_yin_yang | R3 |
| 마술 | sk_magecraft | R5 |
| 성배의 총애 | sk_affection_of_the_holy_grail | R6 |
| 스케이프고트 | sk_scapegoat | R9 |
| 장지의 사서 | sk_librarian_of_knowledge | R3 |
| 전과백반 | sk_wide_specialization | R2 |
| 전투 철수 | sk_battle_retreat | R12 |
| 경계에서 | sk_on_the_boundary | R0 |
| 죽음의 구렁 | sk_death_s_abyss | R1 |
| 만종, 귀로 | sk_evening_bell_homeward | R5 |
| 사역마(비둘기) | sk_familiar_dove | R3 |
| 이중소환 | sk_double_summon | R3 |
| 교만왕의 미주 | sk_a453550 | R8 |
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
| 갈바니즘 | sk_galvanism | R3 |
| 공허한 생자의 한탄 | sk_wail_of_the_living_dead | R7 |
| 오버로드 | sk_overload | R4 |
| 베르세르크 | sk_berserk | R4 |
| 분기의 용사 | sk_invigorated_hero | R6 |
| 견인의 노경 | sk_perseverance_of_old_age | R1 |
| 강철의 간호 | sk_nurse_of_steel | R12 |
| 인체 이해 | sk_understanding_of_the_human_body | R6 |
| 천사의 외침 | sk_angel_s_cry | R5 |
| 광화 EX(C 상당) | sk_madness_enhancement_ex_c_equivalent | R0 |
| 정령의 광소 | sk_madness_of_the_spirits | R8 |
| 전장의 귀신 | sk_demon_of_the_battlefield | R5 |
| 치열한 여로 | sk_harsh_road_to_travel | R1 |
| 국중법도 | sk_laws_of_the_shinsengumi | R6 |
| 청렬한 기도의 끝에 | sk_after_pure_prayer | R5 |
| 찬연한 성광의 복권 | sk_restoration_of_the_radiant_holy_light | R8 |
| 신명재결 | sk_divine_judgment | R7 |
| 기나긴 여로를 향한 기도 | sk_prayer_for_the_long_journey | R3 |
| 치천의 잔 | sk_goblet_of_seraph | R3 |
| 신명재결(가짜) | sk_divine_judgment_fake | R5 |
| 천부의 견식 | sk_gift_of_insight | R7 |
| 해명하는 자 | sk_revealer | R3 |
| 바리츠 | sk_baritsu | R2 |
| 책은 불태워라 | sk_scripts_should_be_burned | R8 |
| 유학자는 묻어버려라 | sk_confucianism_should_be_suppressed | R6 |
| 영세제위 | sk_eternal_reign | R3 |
| 복수자 | sk_avenger | R0 |
| 망각보정 | sk_oblivion_correction | R0 |
| 자기회복(마력) | sk_self_restoration_magical_energy | R0 |
| 강철의 결의 | sk_iron_determination | R6 |
| 몽테크리스토의 비보 | sk_treasure_of_monte_cristo | R3 |
| 궁지의 지혜 | sk_wisdom_of_crisis | R11 |
| 용의 마녀 | sk_dragon_witch | R6 |
| 덧없는 꿈 | sk_ephemeral_dream | R2 |
| 우치교교 | sk_zarich | R8 |
| 좌치교교 | sk_tawrich | R8 |
| 네 번째 밤의 종말 | sk_the_end_of_the_fourth_night | R5 |
| 통곡외장 | sk_lamenting_exterior | R5 |
| 참혹한 요원지화 | sk_horrific_wildfire | R6 |
| 하이 서번트 | sk_high_servant | R0 |
| 크라임 발레 | sk_crime_ballet | R2 |
| 가학체질 | sk_sadistic_nature | R6 |
| 멜트 바이러스 | sk_melt_virus | R4 |
| 브레스트 밸리 | sk_breast_valley | R5 |
| 피학체질 | sk_masochistic_nature | R6 |
| 트래시&크래시 | sk_trash_crush | R6 |
| 짐승의 권능 | sk_authority_of_beasts | R0 |
| 단독현현 | sk_independent_manifestation | R0 |
| 로고스 이터 | sk_logos_eater | R0 |
| 네거 세이비어 | sk_nega_saver | R0 |
| 천리안(짐승) | sk_clairvoyance_beast | R3 |
| 오정심관 | sk_five_approaches_to_meditation | R8 |
| 마성변생 | sk_demonic_morph | R2 |
| 암흑의 신핵 | sk_core_of_darkness | R0 |
| 쾌락주의 | sk_hedonism | R0 |
| 리디큘 캣 | sk_ridicule_cat | R8 |
| 검은 생명 | sk_onyx_life | R1 |
| 도만의 저주 | sk_douman_s_curse | R6 |
| 열 개의 왕관 | sk_domina_cornam | R12 |
| 황금의 잔 | sk_aurea_poculum | R7 |
| 자기개조(연) | sk_self_modification_infatuation | R5 |
| 영역 밖의 생명 | sk_entity_of_the_outer_realm | R0 |
| 광기 | sk_insanity | R0 |
| 심연에 빛이 되어 | sk_light_in_the_abyss | R4 |
| 이성 상실 | sk_mass_hysteria | R8 |
| 세일럼의 마녀 | sk_witch_of_salem | R3 |
| 삼라만상 | sk_all_things_in_nature | R2 |
| 부녀의 인연 | sk_father_daughter_bond | R5 |
| 아호・이성소 | sk_pseudonym_iseidako | R11 |
| ??? | sk_a900250 | R0 |
| 한여름 밤의 꿈 | sk_midsummer_night_s_dream | R0 |
| 밤의 장막 | sk_evening_shroud | R4 |
| 아침의 종다리 | sk_morning_lark | R3 |
| 꿈의 끝 | sk_ending_of_dreams | R5 |

## 서번트별 발동 가능 스킬

| 서번트 ID | 발동 가능 / 전체 |
|---|---:|
| sv_0003_altria_pendragon_alter | 4 / 4 |
| sv_0005_nero_claudius | 4 / 5 |
| sv_0006_siegfried | 3 / 4 |
| sv_0008_altera | 5 / 6 |
| sv_0010_chevalier_d_eon | 4 / 5 |
| sv_0068_okita_souji | 4 / 5 |
| sv_0076_mordred | 4 / 5 |
| sv_0121_lancelot | 4 / 5 |
| sv_0123_gawain | 4 / 5 |
| sv_0153_miyamoto_musashi | 4 / 4 |
| sv_0160_arthur_pendragon_prototype | 4 / 5 |
| sv_0012_gilgamesh | 6 / 6 |
| sv_0013_robin_hood | 5 / 5 |
| sv_0014_atalante | 5 / 5 |
| sv_0016_arash | 5 / 5 |
| sv_0069_oda_nobunaga | 5 / 5 |
| sv_0077_nikola_tesla | 5 / 5 |
| sv_0084_arjuna | 6 / 6 |
| sv_0122_tristan | 5 / 5 |
| sv_0137_chloe_von_einzbern | 5 / 5 |
| sv_0157_emiya_alter | 5 / 5 |
| sv_0207_chiron | 6 / 6 |
| sv_0018_elisabeth_bathory | 5 / 5 |
| sv_0020_cu_chulainn_prototype | 5 / 5 |
| sv_0021_leonidas_i | 4 / 4 |
| sv_0022_romulus | 4 / 4 |
| sv_0064_hektor | 4 / 5 |
| sv_0070_scathach | 4 / 4 |
| sv_0071_diarmuid_ua_duibhne | 4 / 4 |
| sv_0085_karna | 5 / 6 |
| sv_0088_brynhild | 5 / 6 |
| sv_0140_vlad_iii_extra | 4 / 4 |
| sv_0143_enkidu | 4 / 4 |
| sv_0024_georgios | 4 / 5 |
| sv_0025_edward_teach | 4 / 4 |
| sv_0026_boudica | 4 / 5 |
| sv_0027_ushiwakamaru | 4 / 5 |
| sv_0029_marie_antoinette | 4 / 5 |
| sv_0030_martha | 5 / 6 |
| sv_0065_francis_drake | 4 / 5 |
| sv_0094_astolfo | 5 / 6 |
| sv_0108_iskandar | 5 / 6 |
| sv_0118_ozymandias | 5 / 6 |
| sv_0206_achilles | 5 / 6 |
| sv_0032_gilles_de_rais | 3 / 4 |
| sv_0033_hans_christian_andersen | 4 / 5 |
| sv_0034_william_shakespeare | 4 / 4 |
| sv_0037_zhuge_liang_lord_el_melloi_ii | 4 / 5 |
| sv_0038_cu_chulainn | 5 / 5 |
| sv_0062_tamamo_no_mae | 5 / 5 |
| sv_0111_irisviel_holy_grail | 4 / 5 |
| sv_0127_leonardo_da_vinci | 4 / 5 |
| sv_0136_illyasviel_von_einzbern | 4 / 5 |
| sv_0150_merlin | 4 / 6 |
| sv_0203_avicebron | 3 / 5 |
| sv_0040_hassan_of_the_cursed_arm | 4 / 4 |
| sv_0041_stheno | 5 / 6 |
| sv_0042_jing_ke | 4 / 4 |
| sv_0044_phantom_of_the_opera | 4 / 4 |
| sv_0045_mata_hari | 3 / 3 |
| sv_0075_jack_the_ripper | 4 / 4 |
| sv_0092_ryougi_shiki_assassin | 5 / 5 |
| sv_0109_emiya_assassin | 5 / 5 |
| sv_0110_hassan_of_the_hundred_personas | 4 / 4 |
| sv_0154_first_hassan | 6 / 7 |
| sv_0199_semiramis | 6 / 7 |
| sv_0048_lancelot | 4 / 5 |
| sv_0049_lu_bu_fengxian | 3 / 4 |
| sv_0050_spartacus | 3 / 4 |
| sv_0051_sakata_kintoki | 4 / 5 |
| sv_0052_vlad_iii | 3 / 4 |
| sv_0053_asterios | 3 / 4 |
| sv_0082_frankenstein | 3 / 4 |
| sv_0089_beowulf | 3 / 4 |
| sv_0097_florence_nightingale | 3 / 4 |
| sv_0098_cu_chulainn_alter | 4 / 5 |
| sv_0161_hijikata_toshizo | 3 / 4 |
| sv_0059_jeanne_d_arc | 4 / 4 |
| sv_0093_amakusa_shirou | 4 / 4 |
| sv_0173_sherlock_holmes | 4 / 4 |
| sv_0229_qin_shi_huang | 4 / 4 |
| sv_0096_edmond_dantes | 3 / 6 |
| sv_0106_jeanne_d_arc_alter | 3 / 6 |
| sv_0107_a_ra_mainiiu | 3 / 6 |
| sv_0204_antonio_salieri | 3 / 6 |
| sv_0163_meltryllis | 5 / 8 |
| sv_0164_passionlip | 6 / 8 |
| sv_0167_sessyoin_kiara | 3 / 7 |
| sv_0297_ashiya_douman | 5 / 9 |
| sv_0166_bb | 5 / 6 |
| sv_0195_abigail_williams | 4 / 6 |
| sv_0198_katsushika_hokusai | 5 / 7 |
| sv_0316_oberon | 4 / 8 |
