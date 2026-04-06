"use client";

import { useEffect, useRef } from "react";

const R = 200, G = 165, B = 70;
const PEAK_FRAMES = 20;

type Phase = "growing" | "peak" | "fading";

interface Sparkle {
  x: number;
  y: number;
  size: number;
  maxOpacity: number;
  phase: Phase;
  progress: number; // 0→1 within current phase
  speed: number;
  peakFrames: number;
}

function spawnSparkle(w: number, h: number): Sparkle {
  return {
    x: w * 0.05 + Math.random() * w * 0.9,
    y: h * 0.05 + Math.random() * h * 0.9,
    size: 3 + Math.random() * 9,
    maxOpacity: 0.4 + Math.random() * 0.55,
    phase: "growing",
    progress: 0,
    speed: 0.022 + Math.random() * 0.028,
    peakFrames: 0,
  };
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opacity: number
) {
  if (size <= 0 || opacity <= 0) return;

  // Outer glow bloom
  const bloomR = Math.max(size * 2.8, 0.5);
  const bloom = ctx.createRadialGradient(x, y, 0, x, y, bloomR);
  bloom.addColorStop(0, `rgba(${Math.min(R + 55, 255)},${Math.min(G + 55, 255)},${Math.min(B + 30, 255)},${opacity * 0.6})`);
  bloom.addColorStop(1, `rgba(${R},${G},${B},0)`);
  ctx.beginPath();
  ctx.arc(x, y, bloomR, 0, Math.PI * 2);
  ctx.fillStyle = bloom;
  ctx.fill();

  // 4-armed star cross
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(${Math.min(R + 55, 255)},${Math.min(G + 55, 255)},${Math.min(B + 30, 255)},${opacity})`;
  ctx.lineCap = "round";

  // Main cardinal arms
  ctx.lineWidth = Math.max(size * 0.15, 0.8);
  ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -size); ctx.lineTo(0, size); ctx.stroke();

  // Shorter diagonal arms
  const ds = size * 0.48;
  ctx.lineWidth = Math.max(size * 0.08, 0.5);
  ctx.beginPath(); ctx.moveTo(-ds, -ds); ctx.lineTo(ds, ds); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ds, -ds); ctx.lineTo(-ds, ds); ctx.stroke();

  ctx.restore();
}

export function SparkleFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let sparkles: Sparkle[] = [];

    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas);
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 800;

    // Pre-seed at mixed phases so the field is immediately alive
    const phases: Phase[] = ["growing", "peak", "fading"];
    for (let i = 0; i < 22; i++) {
      const s = spawnSparkle(canvas.width, canvas.height);
      s.phase = phases[Math.floor(Math.random() * phases.length)];
      s.progress = Math.random();
      s.peakFrames = s.phase === "peak" ? Math.floor(Math.random() * PEAK_FRAMES) : 0;
      sparkles.push(s);
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Trickle in new sparkles to replace finished ones
      if (sparkles.length < 28 && Math.random() < 0.12) {
        sparkles.push(spawnSparkle(w, h));
      }

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        let opacity = 0;
        let effectiveSize = s.size;

        if (s.phase === "growing") {
          s.progress += s.speed;
          opacity = s.progress * s.maxOpacity;
          effectiveSize = s.size * s.progress;
          if (s.progress >= 1) {
            s.phase = "peak";
            s.progress = 1;
            s.peakFrames = 0;
          }
        } else if (s.phase === "peak") {
          opacity = s.maxOpacity;
          effectiveSize = s.size;
          s.peakFrames++;
          if (s.peakFrames >= PEAK_FRAMES) {
            s.phase = "fading";
            s.progress = 0;
          }
        } else {
          s.progress += s.speed * 0.75; // fade out slightly slower than grow
          opacity = (1 - s.progress) * s.maxOpacity;
          effectiveSize = s.size * (1 - s.progress * 0.3);
          if (s.progress >= 1) {
            sparkles.splice(i, 1);
            continue;
          }
        }

        drawSparkle(ctx, s.x, s.y, effectiveSize, opacity);
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      sparkles = [];
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
