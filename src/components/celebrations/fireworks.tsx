"use client";

import { useEffect, useRef } from "react";

// Earthy palette — all warm, desaturated, fits the dark forest green background
const PALETTE: Array<[number, number, number]> = [
  [200, 165, 70],  // warm gold
  [196, 110, 72],  // terracotta
  [140, 195, 115], // bright sage
  [195, 132, 155], // dusty rose
  [210, 148, 45],  // deep amber
  [228, 218, 168], // pale cream
  [170, 108, 62],  // warm copper
];

// Staggered burst times in seconds from animation start
const BURST_TIMES = [0.1, 0.9, 1.7, 2.4];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;    // seconds elapsed
  maxLife: number;
  color: [number, number, number];
  size: number;
}

function createBurst(
  x: number,
  y: number,
  color: [number, number, number]
): Particle[] {
  const count = 22;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.25;
    const speed = 1.2 + Math.random() * 2.8;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.8 + Math.random() * 0.6,
      color,
      size: 1 + Math.random() * 1.5,
    };
  });
}

export function FireworksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let startTime: number | null = null;
    let lastTime: number | null = null;
    const firedBursts = new Set<number>();

    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas);
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 800;

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      if (!lastTime) lastTime = timestamp;

      const elapsed = (timestamp - startTime) / 1000;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap dt
      lastTime = timestamp;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Fire scheduled bursts
      BURST_TIMES.forEach((t, i) => {
        if (elapsed >= t && !firedBursts.has(i)) {
          firedBursts.add(i);
          const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
          const x = w * (0.15 + Math.random() * 0.7);
          const y = h * (0.15 + Math.random() * 0.55);
          particles.push(...createBurst(x, y, color));
        }
      });

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const progress = p.life / p.maxLife;
        // Fade in quickly, hold, fade out
        const opacity =
          progress < 0.08
            ? (progress / 0.08) * (1 - progress)
            : 1 - progress;

        // Physics
        p.vy += 60 * dt * 0.04; // gravity (frame-rate independent)
        p.vx *= 1 - dt * 0.6;  // drag
        p.x += p.vx;
        p.y += p.vy;

        const [r, g, b] = p.color;
        const bloomSize = Math.max(p.size * 2.5 * (1 - progress * 0.4), 0.5);

        const bloom = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, bloomSize);
        bloom.addColorStop(0, `rgba(${Math.min(r + 55, 255)},${Math.min(g + 55, 255)},${Math.min(b + 30, 255)},${opacity})`);
        bloom.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, bloomSize, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      particles = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
