"use client";

import { useEffect, useRef } from "react";

// Warm earthy gold — complements the sage green / dark forest palette
const R = 200;
const G = 165;
const B = 70;

const ANGLE_DEG = -18;
const ANGLE_RAD = (ANGLE_DEG * Math.PI) / 180;
const COS = Math.cos(ANGLE_RAD);
const SIN = Math.sin(ANGLE_RAD);
const STAR_COUNT = 20;

interface Star {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

function spawnStar(w: number, h: number, stagger = false): Star {
  return {
    x: stagger ? Math.random() * w : -20 - Math.random() * 300,
    y: Math.random() * (h + 200),
    length: 90 + Math.random() * 160,
    speed: 3.5 + Math.random() * 5,
    opacity: 0.25 + Math.random() * 0.65,
    width: 0.7 + Math.random() * 1.6,
  };
}

export function ShootingStarsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let stars: Star[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    // Use ResizeObserver so the canvas sizes correctly whenever its
    // container becomes available (works inside AnimatePresence mounts)
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    resize();

    // Seed stars scattered across the canvas immediately
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(spawnStar(canvas.width || 400, canvas.height || 800, true));
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
        star.x += star.speed * COS;
        star.y += star.speed * SIN;

        if (star.x > w + 50 || star.y < -50) {
          Object.assign(star, spawnStar(w, h));
        }

        const tailX = star.x - star.length * COS;
        const tailY = star.y - star.length * SIN;

        const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        grad.addColorStop(0, `rgba(${R},${G},${B},0)`);
        grad.addColorStop(0.5, `rgba(${R},${G},${B},${star.opacity * 0.3})`);
        grad.addColorStop(1, `rgba(${R},${G},${B},${star.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = star.width;
        ctx.lineCap = "round";
        ctx.stroke();

        // Glowing bloom at the tip
        const bloomR = star.width * 2.5;
        const bloom = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, bloomR);
        bloom.addColorStop(0, `rgba(${R + 55},${G + 55},${B + 30},${star.opacity})`);
        bloom.addColorStop(1, `rgba(${R},${G},${B},0)`);
        ctx.beginPath();
        ctx.arc(star.x, star.y, bloomR, 0, Math.PI * 2);
        ctx.fillStyle = bloom;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      stars = [];
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
