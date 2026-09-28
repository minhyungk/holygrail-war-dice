// 화면 뼈대 자리. 화면 목록과 전이는 docs/02-screens-flow.md, 목업은 prototype/mockup/.
export function App() {
  return (
    <main style={{ padding: '40px 16px', maxWidth: 640, margin: '0 auto' }}>
      <h1 style={{ fontWeight: 800 }}>제6차 성배전쟁</h1>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
        개발 뼈대입니다. 엔진은 <code>src/engine</code>, 서술 엔진은 <code>src/narrative</code>, 화면은{' '}
        <code>src/ui</code>에 들어갑니다.
      </p>
    </main>
  );
}
