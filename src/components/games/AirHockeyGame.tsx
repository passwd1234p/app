import React, { useEffect, useRef, useState } from 'react';
import { PlayerConfig } from '../../game/types';
import { sound } from '../../game/sound';
import { RotateCcw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AirHockeyGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

export const AirHockeyGame: React.FC<AirHockeyGameProps> = ({
  playerCount,
  players,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);

  const stateRef = useRef({
    p1: { x: 200, y: 500, radius: 28, color: players[0]?.color || '#ef4444' },
    p2: { x: 200, y: 100, radius: 28, color: players[1]?.color || '#3b82f6' },
    puck: { x: 200, y: 300, vx: 0, vy: 0, radius: 18 },
    score1: 0,
    score2: 0,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>,
  });

  const p1Name = players[0]?.name || 'اللاعب 1';
  const p2Name = playerCount === 1 ? 'الذكاء الاصطناعي' : players[1]?.name || 'اللاعب 2';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resetPuck = (towardP1: boolean) => {
      sound.playGoal();
      stateRef.current.puck.x = canvas.width / 2;
      stateRef.current.puck.y = canvas.height / 2;
      stateRef.current.puck.vx = (Math.random() - 0.5) * 6;
      stateRef.current.puck.vy = towardP1 ? 4 : -4;
    };

    resetPuck(true);

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const w = canvas.width;
      const h = canvas.height;
      const { p1, p2, puck, particles } = stateRef.current;

      // 1. AI Logic for Player 2 (if 1P mode)
      if (playerCount === 1) {
        const targetX = puck.x;
        p2.x += (targetX - p2.x) * 0.08;
        // Keep in top half
        const targetY = puck.y < h / 2 ? Math.min(h / 2 - 40, puck.y - 20) : 100;
        p2.y += (targetY - p2.y) * 0.08;
        p2.y = Math.max(p2.radius + 10, Math.min(h / 2 - p2.radius - 10, p2.y));
        p2.x = Math.max(p2.radius + 10, Math.min(w - p2.radius - 10, p2.x));
      }

      // 2. Physics & Friction
      puck.x += puck.vx;
      puck.y += puck.vy;
      puck.vx *= 0.988;
      puck.vy *= 0.988;

      // Cap speed
      const speed = Math.hypot(puck.vx, puck.vy);
      if (speed > 18) {
        puck.vx = (puck.vx / speed) * 18;
        puck.vy = (puck.vy / speed) * 18;
      }

      // Wall Bounces (Left & Right)
      if (puck.x - puck.radius < 15) {
        puck.x = 15 + puck.radius;
        puck.vx *= -1;
        sound.playHit();
      } else if (puck.x + puck.radius > w - 15) {
        puck.x = w - 15 - puck.radius;
        puck.vx *= -1;
        sound.playHit();
      }

      // Goal Top / Bottom Check
      const goalWidth = 140;
      const isGoalX = puck.x > (w - goalWidth) / 2 && puck.x < (w + goalWidth) / 2;

      // Top Edge (Player 2 Goal)
      if (puck.y - puck.radius < 15) {
        if (isGoalX) {
          // Goal for P1!
          stateRef.current.score1++;
          setScore1(stateRef.current.score1);
          if (stateRef.current.score1 >= 5) {
            setMatchWinner(p1Name);
            sound.playWin();
            confetti({ particleCount: 100, spread: 70 });
          } else {
            resetPuck(false);
          }
        } else {
          puck.y = 15 + puck.radius;
          puck.vy *= -1;
          sound.playHit();
        }
      }

      // Bottom Edge (Player 1 Goal)
      if (puck.y + puck.radius > h - 15) {
        if (isGoalX) {
          // Goal for P2!
          stateRef.current.score2++;
          setScore2(stateRef.current.score2);
          if (stateRef.current.score2 >= 5) {
            setMatchWinner(p2Name);
            sound.playWin();
            confetti({ particleCount: 100, spread: 70 });
          } else {
            resetPuck(true);
          }
        } else {
          puck.y = h - 15 - puck.radius;
          puck.vy *= -1;
          sound.playHit();
        }
      }

      // Collision with Paddles
      [p1, p2].forEach((pad) => {
        const dx = puck.x - pad.x;
        const dy = puck.y - pad.y;
        const dist = Math.hypot(dx, dy);
        const minDist = puck.radius + pad.radius;

        if (dist < minDist && dist > 0) {
          sound.playHit();
          const nx = dx / dist;
          const ny = dy / dist;

          // Push puck outside paddle
          puck.x = pad.x + nx * minDist;
          puck.y = pad.y + ny * minDist;

          // Elastic bounce impulse
          const impactSpeed = Math.max(6, Math.hypot(puck.vx, puck.vy) + 3);
          puck.vx = nx * impactSpeed;
          puck.vy = ny * impactSpeed;

          // Hit particles
          for (let i = 0; i < 8; i++) {
            particles.push({
              x: puck.x,
              y: puck.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 1.0,
              color: pad.color,
            });
          }
        }
      });

      // 3. Render Table
      ctx.fillStyle = '#060a14';
      ctx.fillRect(0, 0, w, h);

      // Arena Outer Boundary
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, w - 14, h - 14);

      // Center Line & Circle
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(15, h / 2);
      ctx.lineTo(w - 15, h / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Goal Areas
      ctx.fillStyle = '#ef444433';
      ctx.fillRect((w - goalWidth) / 2, h - 18, goalWidth, 18);
      ctx.fillStyle = '#3b82f633';
      ctx.fillRect((w - goalWidth) / 2, 0, goalWidth, 18);

      // Render Paddles
      [p1, p2].forEach((pad) => {
        ctx.beginPath();
        ctx.arc(pad.x, pad.y, pad.radius, 0, Math.PI * 2);
        ctx.fillStyle = pad.color;
        ctx.shadowColor = pad.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Render Puck
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.05;
        if (pt.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3 * pt.life, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
        }
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [playerCount, p1Name, p2Name]);

  // Touch & Mouse Event Handling for Paddles
  const handlePointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // If y > half, control P1
    if (y > canvas.height / 2 + 10) {
      stateRef.current.p1.x = Math.max(35, Math.min(canvas.width - 35, x));
      stateRef.current.p1.y = Math.max(canvas.height / 2 + 35, Math.min(canvas.height - 35, y));
    } else if (playerCount > 1 && y < canvas.height / 2 - 10) {
      // 2-Player mode: Player 2 touches top half
      stateRef.current.p2.x = Math.max(35, Math.min(canvas.width - 35, x));
      stateRef.current.p2.y = Math.max(35, Math.min(canvas.height / 2 - 35, y));
    }
  };

  const restartGame = () => {
    sound.playClick();
    setScore1(0);
    setScore2(0);
    stateRef.current.score1 = 0;
    stateRef.current.score2 = 0;
    setMatchWinner(null);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center justify-center p-3">
      {/* Top Score Bar */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between mb-3 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">{players[0]?.avatar || '🦁'}</span>
          <div>
            <div className="text-xs font-bold text-white">{p1Name}</div>
            <div className="text-xl font-black text-rose-500">{score1}</div>
          </div>
        </div>

        <div className="text-xs font-black text-slate-500 tracking-widest uppercase">
          أول من يحرز 5 أهداف
        </div>

        <div className="flex items-center gap-2 text-left">
          <div>
            <div className="text-xs font-bold text-white">{p2Name}</div>
            <div className="text-xl font-black text-blue-500">{score2}</div>
          </div>
          <span className="text-xl">{players[1]?.avatar || '🦅'}</span>
        </div>
      </div>

      {/* Main Air Hockey Table Canvas */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl bg-slate-950 w-full flex items-center justify-center touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          onPointerDown={handlePointer}
          onPointerMove={handlePointer}
          className="w-full max-w-[420px] h-auto aspect-[2/3] cursor-crosshair"
        />

        {/* Winner Dialog */}
        {matchWinner && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
            <h3 className="text-2xl font-black text-white">مبروك للفائز!</h3>
            <p className="text-lg font-bold text-amber-300">{matchWinner}</p>
            <button
              onClick={restartGame}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl shadow-lg cursor-pointer"
            >
              مباراة جديدة
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={restartGame}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة المباراة</span>
        </button>
        <span className="text-xs text-slate-400">
          {playerCount === 1 ? '👉 اسحب إصبعك في النصف السفلي لتحريك المضارب' : '👉 كل لاعب يتحكم في نصف شاشته باللمس'}
        </span>
      </div>
    </div>
  );
};
