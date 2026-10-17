'use client';

import { useEffect, useRef } from 'react';
import './ElectricBorder.css';

export default function ElectricBorder({
  children = null,
  color = '#a855f7',
  glowColor = '',
  speed = 1,
  chaos = 0.5,
  spread = 0.6,
  strands = 3,
  thickness = 1.5,
  borderRadius = 16,
  className = '',
  style = {}
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const glow = glowColor || color;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      t += 0.02 * speed;

      const r = Math.min(borderRadius, Math.min(w, h) / 2);
      const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
      const steps = Math.max(60, Math.round(perimeter / 6));

      for (let s = 0; s < strands; s++) {
        const strandOffset = (s / strands) * Math.PI * 2;
        ctx.beginPath();

        for (let i = 0; i <= steps; i++) {
          const progress = i / steps;
          const dist = progress * perimeter;

          // Compute base position on rounded rect
          let bx = 0;
          let by = 0;
          let nx = 0;
          let ny = 0;

          const topLen = w - 2 * r;
          const rightLen = h - 2 * r;
          const cornerArc = (Math.PI / 2) * r;

          let cur = dist;
          if (cur <= topLen) {
            bx = r + cur;
            by = 0;
            nx = 0;
            ny = -1;
          } else if ((cur -= topLen) <= cornerArc) {
            const angle = -Math.PI / 2 + (cur / cornerArc) * (Math.PI / 2);
            bx = w - r + Math.cos(angle) * r;
            by = r + Math.sin(angle) * r;
            nx = Math.cos(angle);
            ny = Math.sin(angle);
          } else if ((cur -= cornerArc) <= rightLen) {
            bx = w;
            by = r + cur;
            nx = 1;
            ny = 0;
          } else if ((cur -= rightLen) <= cornerArc) {
            const angle = 0 + (cur / cornerArc) * (Math.PI / 2);
            bx = w - r + Math.cos(angle) * r;
            by = h - r + Math.sin(angle) * r;
            nx = Math.cos(angle);
            ny = Math.sin(angle);
          } else if ((cur -= cornerArc) <= topLen) {
            bx = w - r - cur;
            by = h;
            nx = 0;
            ny = 1;
          } else if ((cur -= topLen) <= cornerArc) {
            const angle = Math.PI / 2 + (cur / cornerArc) * (Math.PI / 2);
            bx = r + Math.cos(angle) * r;
            by = h - r + Math.sin(angle) * r;
            nx = Math.cos(angle);
            ny = Math.sin(angle);
          } else if ((cur -= cornerArc) <= rightLen) {
            bx = 0;
            by = h - r - cur;
            nx = -1;
            ny = 0;
          } else {
            cur -= rightLen;
            const angle = Math.PI + (cur / cornerArc) * (Math.PI / 2);
            bx = r + Math.cos(angle) * r;
            by = r + Math.sin(angle) * r;
            nx = Math.cos(angle);
            ny = Math.sin(angle);
          }

          // Electric noise displacement
          const noise =
            Math.sin(progress * 40 + t * 4 + strandOffset) * 0.6 +
            Math.sin(progress * 90 - t * 6 + s * 3) * 0.4 +
            (Math.random() - 0.5) * chaos * 1.8;

          const jitter = noise * spread * 4;
          const px = bx + nx * jitter;
          const py = by + ny * jitter;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }

        ctx.closePath();
        ctx.strokeStyle = s === 0 ? '#ffffff' : color;
        ctx.lineWidth = s === 0 ? thickness * 0.75 : thickness;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 8 + s * 4;
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [color, glowColor, speed, chaos, spread, strands, thickness, borderRadius]);

  return (
    <div
      ref={containerRef}
      className={`electric-border-container ${className}`}
      style={{ borderRadius: `${borderRadius}px`, ...style }}
    >
      <canvas ref={canvasRef} className="electric-border-canvas" />
      <div className="electric-border-content">{children}</div>
    </div>
  );
}
