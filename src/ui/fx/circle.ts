// 마법진 그리기. 소환 캔버스와 다이스 테이블이 같이 쓴다.
// progress(0~1): 소환 영창 동안 마법진이 한 획씩 그려지는 정도.
export function drawCircle(ctx: CanvasRenderingContext2D, S: number, rot: number, glow: number, progress = 1) {
  const part = (from: number, to: number) => Math.max(0, Math.min(1, (progress - from) / (to - from)));
  const c = S / 2;
  ctx.clearRect(0, 0, S, S);
  ctx.save();
  ctx.translate(c, c);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, c);
  g.addColorStop(0, `rgba(244,215,122,${0.18 * glow})`);
  g.addColorStop(1, 'rgba(14,18,32,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-c, -c, S, S);
  ctx.strokeStyle = `rgba(201,164,92,${0.35 + 0.5 * glow})`;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = S / 320;
  [0.94, 0.86, 0.62, 0.3].forEach((r, i) => {
    const a = part(i * 0.12, i * 0.12 + 0.35);
    if (!a) return;
    ctx.beginPath();
    ctx.arc(0, 0, c * r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a);
    ctx.stroke();
  });
  ctx.save();
  ctx.rotate(rot);
  const glyphs = '剣弓槍騎術殺狂';
  ctx.font = `900 ${S / 26}px "Noto Serif KR", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const glyphN = Math.floor(21 * part(0.3, 0.75));
  for (let k = 0; k < glyphN; k++) {
    ctx.save();
    ctx.rotate((k / 21) * Math.PI * 2);
    ctx.fillText(glyphs[k % 7]!, 0, -c * 0.9);
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  ctx.rotate(-rot * 1.5);
  const starN = Math.floor(7 * part(0.55, 0.9));
  for (let t = 0; t < 2; t++) {
    if (!starN) break;
    ctx.beginPath();
    for (let k = 0; k <= starN; k++) {
      const a = ((k * 3) / 7) * Math.PI * 2 + (t * Math.PI) / 7;
      const x = Math.cos(a) * c * 0.62, y = Math.sin(a) * c * 0.62;
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  const tickN = Math.floor(60 * part(0.2, 0.6));
  for (let k = 0; k < tickN; k++) {
    const a = (k / 60) * Math.PI * 2 + rot * 0.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * c * 0.86, Math.sin(a) * c * 0.86);
    ctx.lineTo(Math.cos(a) * c * (k % 5 ? 0.83 : 0.8), Math.sin(a) * c * (k % 5 ? 0.83 : 0.8));
    ctx.stroke();
  }
  ctx.restore();
}

export const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
