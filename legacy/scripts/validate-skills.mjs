#!/usr/bin/env node
// T9 DATA — DATA-08 Validator CLI 진입점.
//
// 왜 vitest를 스폰하는가:
//   validateSkill()/validateSkillTable()(src/core/effects/validate.ts)와 클래스 스킬
//   테이블(src/data/skills/classSkills.ts)은 전부 TypeScript다. 이 프로젝트는 .mjs를
//   직접 실행할 때 ts-node/esbuild-register 류의 별도 TS 로더를 두지 않는다(신규 의존성
//   추가 금지 규약 — 태스크 룰 "no new deps"). vitest(devDependency로 이미 존재)는 Vite의
//   esbuild 변환을 통해 .ts를 즉시 실행할 수 있는 유일하게 이미 설치된 경로이므로,
//   "validator를 돌린다" = "validator를 검증하는 vitest 스위트를 돌린다"로 위임한다.
//
//   src/core/effects.test.ts        — validateSkill/validateSkillTable 자체의 동작 +
//                                      CLASS_SKILL_EFFECTS 60개(10스킬×6점수) 일괄 통과
//   src/core/classSkillFx.test.ts   — 탐지·특공·맵 보너스 집계가 실제 서번트 데이터와 맞물리는지
//
// 두 스위트가 모두 통과해야 "현재 클래스 스킬 테이블이 validator를 통과한다"가 참이 된다.
// 향후 서번트별 스킬(R2, AI 일괄 변환분)이 추가되면 그 결과 JSON을 읽어 validateSkillTable()
// 로 돌리는 별도 스위트를 추가하고, 이 스크립트의 ARGS 배열에 그 파일을 얹으면 된다.
//
// 종료 코드는 vitest 프로세스의 것을 그대로 반환한다 (CI 게이트로 바로 사용 가능).

import { spawnSync } from "node:child_process";

const TARGET_TESTS = ["src/core/effects.test.ts", "src/core/classSkillFx.test.ts"];

const result = spawnSync("npx", ["vitest", "run", ...TARGET_TESTS], {
  stdio: "inherit",
  // Windows: npx는 .cmd 배치파일이라 셸을 통해야 인자가 올바르게 전달된다(EINVAL 회피).
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("[validate-skills] vitest 실행 실패:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
