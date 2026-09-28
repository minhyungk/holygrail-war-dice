// AGENTS.md 절대 규칙을 코드로 검사한다.
//  규칙 4: 엔진·서술·데이터 계층은 React/DOM/UI를 import하지 않는다
//  규칙 5: 무작위는 src/engine/rng.ts만 거친다 (Math.random 금지)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = __dirname;
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts') ? [p] : [];
  });
const PURE = ['engine', 'narrative', 'data'].flatMap((d) => walk(join(SRC, d)));

describe('AGENTS.md 규칙', () => {
  it.each(PURE.map((p) => relative(SRC, p)))('규칙 4: %s 는 React/DOM/UI를 import하지 않는다', (rel) => {
    const code = readFileSync(join(SRC, rel), 'utf-8');
    expect(code).not.toMatch(/from ['"](react|react-dom)(\/[^'"]*)?['"]/);
    expect(code).not.toMatch(/from ['"][./]*\/?ui\//);
    expect(code).not.toMatch(/\b(document|window)\./);
  });
  it('규칙 5: src 어디에서도 Math.random을 쓰지 않는다', () => {
    const offenders = walk(SRC).filter((p) => /Math\.random\s*\(/.test(readFileSync(p, 'utf-8')));
    expect(offenders.map((p) => relative(SRC, p))).toEqual([]);
  });
});
