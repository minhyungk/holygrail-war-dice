# Atlas 프로필·스킬 보강 보고서

캐시 424기, 프로필 424기.

## damageNp 계열 조사

| funcType | 함수 수 | svals 키 | 처리 |
|---|---:|---|---|
| damageNp | 351 | Rate, Value, HideMiss, HideNoEffect | 제외: 특성 조건 없음 |
| damageNpAndOrCheckIndividuality | 1 | Rate, Value, Target, Correction, AndCheckIndividualityList | 채택: And/OrCheckIndividualityList의 서번트 특성만 |
| damageNpHpratioLow | 6 | Rate, Value, Target | 제외: HP 비율 대상 |
| damageNpIndividual | 118 | Rate, Value, Target, Correction | 채택: Target는 상대 서번트 특성 |
| damageNpIndividualSum | 15 | Rate, Value, Value2, Target, Correction, TargetList, ParamAddMaxCount, IgnoreIndivUnreleaseable, IncludeIgnoreIndividuality | 채택: TargetList의 서번트 특성만 |
| damageNpPierce | 63 | Rate, Value | 제외: 특성 조건 없음 |
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
| sv_0043_charles_henri_sanson | 보구: 죽음은 내일을 향한 희망일지니 |
| sv_0070_scathach | 보구: 꿰뚫는 죽음의 투창 |
| sv_0084_arjuna | 보구: 파괴신의 손짓 |
| sv_0091_ryougi_shiki_saber | 보구: 무구식・공의 경계 |
| sv_0092_ryougi_shiki_assassin | 보구: 유식・직사의 마안 |
| sv_0102_li_shuwen | 보구: 신창 무이타 |
| sv_0120_nitocris | 보구: 명경보전 |
| sv_0124_hassan_of_the_serenity | 보구: 망상독신 |
| sv_0133_scathach_assassin | 보구: 걷어차 뚫는 죽음의 투창 |
| sv_0154_first_hassan | 보구: 죽음을 고하는 천사 |
| sv_0158_hessian_lobo | 보구: 아득히 먼 자에게 내리는 참죄 |
| sv_0177_nitocris_assassin | 보구: 더러움을 씻어내라, 푸르고 아름다운 나일 |
| sv_0214_valkyrie | 보구: 종말환상・소녀강림 |
| sv_0223_diarmuid_ua_duibhne | 보구: 분노의 파도 |
| sv_0235_li_shuwen | 보구: 무이타 |
| sv_0259_charlotte_corday | 보구: 고국에 사랑을, 잠겨드는 듯한 꿈을 |
| sv_0283_utsumi_erice | 보구: 아메노사카호코 |
| sv_0285_sessyoin_kiara_moon_cancer | 보구: 화락천・교합만다라 |
| sv_0297_ashiya_douman | 보구: 광란노도・악령좌부 |
| sv_0356_utsumi_erice_avenger | 보구: 아메노카가미노후네 |
| sv_0359_thrud | 보구: 최종공격・천창광륜 |
| sv_0360_hildr | 보구: 최종공격・천창광륜 |
| sv_0361_ortlinde | 보구: 최종공격・천창광륜 |
| sv_0369_grigori_rasputin | 보구: 넘쳐흐르는 암흑심장 |
| sv_0370_nitocris_alter | 보구: 아름다운 나의 명부, 그 길을 열어라 |
| sv_0380_kashin_koji | 보구: 꼭두각시 외법・사자분신 |
| sv_0407_marie_antoinette_alter | 보구: 비극유전・흑화장렬 |
| sv_0418_mysterious_executor_c_i_e_l | 보구: 제7성전・단죄사 |
| sv_0420_xu_fu_avenger | 보구: 저녁놀에 절명, 황혼에 체인소 |
| sv_0427_servant_427 | 보구: 과분한 신비의 심장 |
| sv_0435_servant_435 | 보구: 코마치 전설・가인박명 |

## 보구 특공 서번트

| servant_id | 대상 특성 |
|---|---|
| sv_0006_siegfried | 2002 (dragon) |
| sv_0012_gilgamesh | 2008 (weakToEnumaElish) |
| sv_0015_euryale | 1 (genderMale) |
| sv_0046_carmilla | 2 (genderFemale) |
| sv_0063_david | 2666 (giant) |
| sv_0069_oda_nobunaga | 2009 (riding) |
| sv_0076_mordred | 2010 (arthur) |
| sv_0077_nikola_tesla | 2011 (skyOrEarthServant) |
| sv_0085_karna | 2000 (divine) |
| sv_0086_mysterious_heroine_x | 2007 (saberface) |
| sv_0088_brynhild | 2012 (brynhildsBeloved) |
| sv_0099_queen_medb | 1 (genderMale) |
| sv_0101_rama | 2019 (demonic) |
| sv_0128_tamamo_no_mae_lancer | 1 (genderMale) |
| sv_0140_vlad_iii_extra | 304 (alignmentEvil) |
| sv_0143_enkidu | 1172 (threatToHumanity) |
| sv_0153_miyamoto_musashi | 109 (classAlterEgo), 115 (classMoonCancer) |
| sv_0155_mysterious_heroine_x_alter | 2075 (saberClassServant) |
| sv_0169_scheherazade | 2113 (king) |
| sv_0178_oda_nobunaga_berserker | 2000 (divine) |
| sv_0188_katou_black_kite_danzo | 2019 (demonic) |
| sv_0196_ereshkigal | 201 (attributeEarth) |
| sv_0198_katsushika_hokusai | 202 (attributeHuman) |
| sv_0200_asagami_fujino | 2076 (superGiant) |
| sv_0204_antonio_salieri | 203 (attributeStar) |
| sv_0207_chiron | 201 (attributeEarth) |
| sv_0210_okada_izo | 202 (attributeHuman) |
| sv_0212_napoleon | 2000 (divine) |
| sv_0213_sigurd | 2002 (dragon) |
| sv_0218_ushiwakamaru_assassin | 300 (alignmentLawful) |
| sv_0222_mysterious_heroine_xx | 2075 (saberClassServant) |
| sv_0237_murasaki_shikibu | 2019 (demonic) |
| sv_0242_astraea | 304 (alignmentEvil) |
| sv_0250_oda_nobunaga | 2000 (divine) |
| sv_0261_miyamoto_musashi_berserker | 2075 (saberClassServant) |
| sv_0280_romulus_quirinus | 2004 (roman) |
| sv_0281_voyager | 200 (attributeSky) |
| sv_0288_yu_mei_ren_lancer | 1 (genderMale) |
| sv_0291_murasaki_shikibu_rider | 201 (attributeEarth) |
| sv_0296_nemo | 2076 (superGiant) |
| sv_0298_watanabe_no_tsuna | 1132 (oni) |
| sv_0305_amor_caren | 301 (alignmentChaotic) |
| sv_0308_mysterious_idol_x_alter | 304 (alignmentEvil) |
| sv_0309_morgan | 202 (attributeHuman) |
| sv_0316_oberon | 300 (alignmentLawful) |
| sv_0325_zenobia | 2113 (king) |
| sv_0327_izumo_no_okuni | 2019 (demonic) |
| sv_0331_taigong_wang | 2000 (divine) |
| sv_0334_koyanskaya_of_dark | 201 (attributeEarth) |
| sv_0338_taisui_xingjun | 202 (attributeHuman) |
| sv_0340_daikokuten | 201 (attributeEarth) |
| sv_0345_kriemhild | 2002 (dragon) |
| sv_0346_james_moriarty | 303 (alignmentGood) |
| sv_0347_don_quixote | 2666 (giant) |
| sv_0349_kyokutei_bakin | 304 (alignmentEvil) |
| sv_0350_minamoto_no_tametomo | 300 (alignmentLawful) |
| sv_0351_archetype_earth | 301 (alignmentChaotic) |
| sv_0355_ibuki_douji_berserker | 201 (attributeEarth) |
| sv_0357_scathach_skadi_ruler | 300 (alignmentLawful) |
| sv_0358_wu_zetian_caster | 202 (attributeHuman) |
| sv_0359_thrud | 201 (attributeEarth) |
| sv_0360_hildr | 201 (attributeEarth) |
| sv_0361_ortlinde | 201 (attributeEarth) |
| sv_0362_sen_no_rikyu | 202 (attributeHuman) |
| sv_0365_huyan_zhuo | 304 (alignmentEvil) |
| sv_0368_britomart | 103 (classRider) |
| sv_0369_grigori_rasputin | 304 (alignmentEvil) |
| sv_0370_nitocris_alter | 202 (attributeHuman) |
| sv_0373_kukulcan | 201 (attributeEarth) |
| sv_0374_pope_johanna | 202 (attributeHuman) |
| sv_0383_durga | 2019 (demonic) |
| sv_0384_medusa | 202 (attributeHuman) |
| sv_0385_aesc_the_rain_witch | 304 (alignmentEvil) |
| sv_0386_altria_caster | 1172 (threatToHumanity) |
| sv_0387_suzuka_gozen_vacay | 201 (attributeEarth) |
| sv_0390_melusine | 201 (attributeEarth) |
| sv_0392_cait_cu_mikocer | 202 (attributeHuman) |
| sv_0395_sugitani_zenjubou | 2113 (king) |
| sv_0396_theseus | 2666 (giant) |
| sv_0400_uesugi_kenshin | 202 (attributeHuman) |
| sv_0401_nemo_santa | 304 (alignmentEvil) |
| sv_0403_minamoto_no_raikou_ushi_gozen | 201 (attributeEarth) |
| sv_0408_hassan_of_the_shining_star | 202 (attributeHuman) |
| sv_0410_alessandro_di_cagliostro | 300 (alignmentLawful) |
| sv_0415_kuonji_alice | 202 (attributeHuman) |
| sv_0416_hibiki_and_chikagi | 301 (alignmentChaotic) |
| sv_0418_mysterious_executor_c_i_e_l | 2019 (demonic) |
| sv_0420_xu_fu_avenger | 202 (attributeHuman) |
| sv_0422_tenochtitlan_moon_cancer | 2076 (superGiant) |
| sv_0423_mysterious_heroine_xx_alter | 108 (classRuler), 1000 (servant) |
| sv_0427_servant_427 | 2019 (demonic) |
| sv_0428_servant_428 | 300 (alignmentLawful) |
| sv_0431_servant_431 | 304 (alignmentEvil) |
| sv_0434_servant_434 | 1110 (lamia), 2002 (dragon) |

## foe_trait 추가 정의

| skill_id | 대상 특성 | 근거 Atlas 스킬 |
|---|---|---|
| sk_beast_slayer | 2005 (wildbeast) | 짐승 살해자 B++ |
| sk_sh_b_sh_y_r_n | 2113 (king) | 십보살일인 B+ |
| sk_executioner | 304 (alignmentEvil) | 처형인 A++ |
| sk_punish_the_unfaithful | 1 (genderMale) | 바람기를 향한 쐐기 A+ |
| sk_unifying_the_nation_by_force | 2000 (divine) | 천하포무 A |
| sk_love_for_the_people | 200 (attributeSky) | 사람에게 사랑을 EX |
| sk_understanding_of_the_human_body | 2001 (humanoid) | 인체 이해 A |
| sk_mystic_slayer | 2019 (demonic), 2037 (skyOrEarthExceptPseudoAndDemiServant) | 신비 살해자 A |
| sk_fist_of_yan_qing | 300 (alignmentLawful), 304 (alignmentEvil) | 연청권 EX |
| sk_divine_general_marshal_of_the_central_altar | 2019 (demonic) | 신장・중단원수 A |
| sk_mental_schism | 300 (alignmentLawful), 301 (alignmentChaotic) | 모순정신 A+ |
| sk_dead_count_shapeshifter | 2002 (dragon) | 용고영주 EX |
| sk_angelica_cathay | 201 (attributeEarth) | 아름다운 미희의 반지 C |
| sk_the_diary_of_lady_murasaki | 301 (alignmentChaotic), 303 (alignmentGood) | 무라사키 시키부 일기 B++ |
| sk_it_is_but_a_dream | 200 (attributeSky) | 몽환과도 같이 B++ |
| sk_sworn_enemy_of_gods | 2000 (divine) | 숙명의 신적 A |
| sk_fengshen_zhixing | 2000 (divine), 2019 (demonic) | 봉신집행 B |
| sk_closed_veil_of_reality | 2076 (superGiant) | 닫히는 것은 현실의 장막 EX |
| sk_c_punishment | 200 (attributeSky), 201 (attributeEarth), 202 (attributeHuman) | C³퍼니시먼트 B+ |

## 계열 충돌로 보류

- sk_great_poet_s_poem: sv_0237_murasaki_shikibu / 가선의 시가 A → 2019 (demonic); sv_0276_sei_shounagon / 가선의 시가 B → 조건 없음

## 수기 정의 후보 (미수정)

- 없음

## Atlas 스킬 링크 미해결 (미수정)

- 없음

## R7 변경 정의

- sk_siren_song
- sk_csejte_night
- sk_vengeful_spirit_exorcism
- sk_blank_subscription_list
- sk_fair_youth_thunder
- sk_shriek_from_the_palais_garnier
- sk_pheromone
- sk_double_cross
- sk_divine_judgment
- sk_proof_of_friendship
- sk_panicky_voice
- sk_wail_of_the_living_dead
- sk_knowledge_of_the_deprived
- sk_trap_of_argalia
- sk_budding_wise_king
- sk_intoxicating_mead
- sk_intoxicating_aroma_of_fruits
- sk_midsummer_curse
- sk_ephemeral_sisters
- sk_aurea_poculum
- sk_bedchamber_of_survival
- sk_gift_of_insight
- sk_planning_ahead
- sk_eau_de_toilette_white_honey
- sk_heartbreak
- sk_star_basket_large
- sk_uri_s_hunter
- sk_femme_fatale_fake
- sk_the_rose_s_slumber
- sk_summer_night_black_widow
- sk_bizarre_hobby_summer
- sk_ranmaru_eye
- sk_busybody_big_sister
- sk_add_maple_syrup
- sk_emperor_taoism
- sk_a2441550

문서 대조: `docs/systems/skills.md` §14의 R7 설명은 아직 즉사/우연 국면을 포함한다. 이번 데이터와 스크립트는 사용자 결정대로 선제/회피 국면만 사용한다. 문서는 수정 금지 범위에 있어 유지했다.

## lore 없는 서번트

- 없음

## 지정 사례

- 쿠 훌린 (source_id 17) instant_death: true
- 지크프리트 (sv_0006_siegfried) 용 특성 2002: true
