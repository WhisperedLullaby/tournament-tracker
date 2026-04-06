"use client";

import { useEffect, useRef } from "react";

const R = 200, G = 165, B = 70;

interface Ember {
  x: number;
  y: number;
  size: number;
  speedY: number;
  driftSpeed: number;
  driftAngle: number;
  life: number;      // 0 → 1
  lifeSpeed: number;
  maxOpacity: number;
}

function spawnEmber(w: number, h: number): Ember {
  return {
    x: Math.random() * w,
    y: h + 10 + Math.random() * 20,
    size: 1 + Math.random() * 2.5,
    speedY: 0.7 + Math.random() * 1.4,
    driftSpeed: 0.25 + Math.random() * 0.5,
    driftAngle: Math.random() * Math.PI * 2,
    life: 0,
    lifeSpeed: 0.004 + Math.random() * 0.005,
    maxOpacity: 0.4 + Math.random() * 0.55,
  };
}

export function RisingEmbersCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let embers: Ember[] = [];

    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas);
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 800;

    // Seed embers scattered at varying heights so the effect is immediate
    for (let i = 0; i < 18; i++) {
      const e = spawnEmber(canvas.width, canvas.height);
      e.y = canvas.height * (0.2 + Math.random() * 0.8);
      e.life = Math.random() * 0.6;
      embers.push(e);
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Continuously spawn up to the cap
      if (embers.length < 40 && Math.random() < 0.3) {
        embers.push(spawnEmber(w, h));
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];

        e.life += e.lifeSpeed;
        e.y -= e.speedY;
        e.driftAngle += 0.03;
        e.x += Math.sin(e.driftAngle) * e.driftSpeed;

        if (e.life >= 1 || e.y < -10) {
          embers.splice(i, 1);
          continue;
        }

        // Fade in, hold, fade out
        let opacity: number;
        if (e.life < 0.15) {
          opacity = (e.life / 0.15) * e.maxOpacity;
        } else if (e.life > 0.72) {
          opacity = ((1 - e.life) / 0.28) * e.maxOpacity;
        } else {
          opacity = e.maxOpacity;
        }

        const bloomR = Math.max(e.size * 2.5, 0.5);
        const bloom = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, bloomR);
        bloom.addColorStop(0, `rgba(${Math.min(R + 55, 255)},${Math.min(G + 55, 255)},${Math.min(B + 30, 255)},${opacity})`);
        bloom.addColorStop(1, `rgba(${R},${G},${B},0)`);

        ctx.beginPath();
        ctx.arc(e.x, e.y, bloomR, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      embers = [];
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
