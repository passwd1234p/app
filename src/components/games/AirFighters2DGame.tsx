import React, { useEffect, useRef, useState } from 'react';
import { PlayerConfig } from '../../game/types';
import { sound } from '../../game/sound';
import { RotateCcw, Crosshair, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AirFighters2DGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

interface Jet {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  health: number;
  color: string;
  name: string;
  avatar: string;
  isAi: boolean;
  score: number;
  cooldown: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  shooterId: number;
  life: number;
  color: string;
}

export const AirFighters2DGame: React.FC<AirFighters2DGameProps> = ({
  playerCount,
  players,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<number, number>>({});

  const jetsRef = useRef<Jet[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const inputRef = useRef<Record<number, { steer: number; fire: boolean }>>({
    1: { steer: 0, fire: false },
    2: { steer: 0, fire: false },
    3: { steer: 0, fire: false },
    4: { steer: 0, fire: false },
  });

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // P1: A/D or Left/Right + Space
      if (e.code === 'KeyA') inputRef.current[1].steer = -1;
      if (e.code === 'KeyD') inputRef.current[1].steer = 1;
      if (e.code === 'Space') inputRef.current[1].fire = true;

      // P2: Left/Right arrows + Enter
      if (e.code === 'ArrowLeft') inputRef.current[2].steer = -1;
      if (e.code === 'ArrowRight') inputRef.current[2].steer = 1;
      if (e.code === 'Enter') inputRef.current[2].fire = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' && inputRef.current[1].steer === -1) inputRef.current[1].steer = 0;
      if (e.code === 'KeyD' && inputRef.current[1].steer === 1) inputRef.current[1].steer = 0;
      if (e.code === 'Space') inputRef.current[1].fire = false;

      if (e.code === 'ArrowLeft' && inputRef.current[2].steer === -1) inputRef.current[2].steer = 0;
      if (e.code === 'ArrowRight' && inputRef.current[2].steer === 1) inputRef.current[2].steer = 0;
      if (e.code === 'Enter') inputRef.current[2].fire = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const initGame = () => {
    const totalJets = playerCount === 1 ? 4 : playerCount;
    const initialJets: Jet[] = [];
    const spawns = [
      { x: 100, y: 100, angle: Math.PI / 4 },
      { x: 500, y: 400, angle: (5 * Math.PI) / 4 },
      { x: 500, y: 100, angle: (3 * Math.PI) / 4 },
      { x: 100, y: 400, angle: (7 * Math.PI) / 4 },
    ];

    for (let i = 0; i < totalJets; i++) {
      const p = players[i] || {
        id: i + 1,
        color: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i],
        name: `طائرة ${i + 1}`,
        avatar: '✈️',
      };
      initialJets.push({
        id: i + 1,
        x: spawns[i].x,
        y: spawns[i].y,
        angle: spawns[i].angle,
        speed: 3.2,
        health: 100,
        color: p.color,
        name: playerCount === 1 && i > 0 ? `طائرة روبوت ${i + 1}` : p.name,
        avatar: p.avatar,
        isAi: playerCount === 1 ? i > 0 : false,
        score: 0,
        cooldown: 0,
      });
    }

    jetsRef.current = initialJets;
    bulletsRef.current = [];
    setWinnerName(null);
    setHealthMap({ 1: 100, 2: 100, 3: 100, 4: 100 });
  };

  useEffect(() => {
    initGame();
  }, [playerCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const w = canvas.width;
      const h = canvas.height;
      const jets = jetsRef.current;
      const bullets = bulletsRef.current;

      // Update Jets
      jets.forEach((jet) => {
        if (jet.health <= 0) return;
        if (jet.cooldown > 0) jet.cooldown--;

        // AI behavior
        if (jet.isAi) {
          const target = jets.find((j) => j.id !== jet.id && j.health > 0);
          if (target) {
            const desired = Math.atan2(target.y - jet.y, target.x - jet.x);
            let diff = desired - jet.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            jet.angle += Math.sign(diff) * 0.045;

            // Shoot when lined up
            if (Math.abs(diff) < 0.4 && jet.cooldown === 0 && Math.random() < 0.05) {
              sound.playShoot();
              jet.cooldown = 20;
              bullets.push({
                x: jet.x + Math.cos(jet.angle) * 20,
                y: jet.y + Math.sin(jet.angle) * 20,
                vx: Math.cos(jet.angle) * 8,
                vy: Math.sin(jet.angle) * 8,
                shooterId: jet.id,
                life: 60,
                color: jet.color,
              });
            }
          }
        } else {
          // Player input
          const inp = inputRef.current[jet.id] || { steer: 0, fire: false };
          jet.angle += inp.steer * 0.06;

          if (inp.fire && jet.cooldown === 0) {
            sound.playShoot();
            jet.cooldown = 16;
            bullets.push({
              x: jet.x + Math.cos(jet.angle) * 20,
              y: jet.y + Math.sin(jet.angle) * 20,
              vx: Math.cos(jet.angle) * 8,
              vy: Math.sin(jet.angle) * 8,
              shooterId: jet.id,
              life: 60,
              color: jet.color,
            });
          }
        }

        // Move jet forward
        jet.x += Math.cos(jet.angle) * jet.speed;
        jet.y += Math.sin(jet.angle) * jet.speed;

        // Screen wrapping
        if (jet.x < 0) jet.x = w;
        if (jet.x > w) jet.x = 0;
        if (jet.y < 0) jet.y = h;
        if (jet.y > h) jet.y = 0;
      });

      // Update bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        let hit = false;
        for (const jet of jets) {
          if (jet.health > 0 && jet.id !== b.shooterId) {
            const dist = Math.hypot(b.x - jet.x, b.y - jet.y);
            if (dist < 18) {
              hit = true;
              jet.health = Math.max(0, jet.health - 25);
              sound.playHit();
              setHealthMap((prev) => ({ ...prev, [jet.id]: jet.health }));

              if (jet.health <= 0) {
                sound.playExplosion();
                const alive = jets.filter((j) => j.health > 0);
                if (alive.length === 1) {
                  setWinnerName(alive[0].name);
                  sound.playWin();
                  confetti({ particleCount: 100, spread: 70 });
                }
              }
              break;
            }
          }
        }

        if (hit || b.life <= 0 || b.x < 0 || b.x > w || b.y < 0 || b.y > h) {
          bullets.splice(i, 1);
        }
      }

      // Render sky backdrop
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Stars / radar grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render bullets
      bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Render Jets
      jets.forEach((jet) => {
        if (jet.health <= 0) return;

        ctx.save();
        ctx.translate(jet.x, jet.y);
        ctx.rotate(jet.angle);

        // Jet triangular hull
        ctx.beginPath();
        ctx.moveTo(22, 0); // nose
        ctx.lineTo(-14, -12); // left wing
        ctx.lineTo(-8, 0); // tail center
        ctx.lineTo(-14, 12); // right wing
        ctx.closePath();

        ctx.fillStyle = jet.color;
        ctx.shadowColor = jet.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cockpit window
        ctx.beginPath();
        ctx.ellipse(3, 0, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        ctx.restore();

        // Health bar above jet
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(jet.x - 18, jet.y - 25, 36, 4);
        ctx.fillStyle = jet.color;
        ctx.fillRect(jet.x - 18, jet.y - 25, (jet.health / 100) * 36, 4);
      });
    };

    loop();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTouch = (playerId: number, action: 'left' | 'right' | 'stop' | 'fire' | 'stopFire') => {
    if (!inputRef.current[playerId]) return;
    if (action === 'left') inputRef.current[playerId].steer = -1;
    if (action === 'right') inputRef.current[playerId].steer = 1;
    if (action === 'stop') inputRef.current[playerId].steer = 0;
    if (action === 'fire') inputRef.current[playerId].fire = true;
    if (action === 'stopFire') inputRef.current[playerId].fire = false;
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center p-3">
      {/* Top Health status */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 mb-3 shadow-xl">
        {jetsRef.current.map((jet) => (
          <div key={jet.id} className="flex items-center gap-2">
            <span className="text-base">{jet.avatar}</span>
            <div>
              <div className="text-[11px] font-bold text-white">{jet.name}</div>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${healthMap[jet.id] ?? 100}%`,
                    backgroundColor: jet.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dogfight Canvas */}
      <div className="relative w-full rounded-3xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-auto aspect-[4/3] block"
        />

        {/* Winner Screen */}
        {winnerName && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Trophy className="w-16 h-16 text-amber-400 animate-bounce" />
            <h3 className="text-2xl font-black text-white">سيد السماء المطلق!</h3>
            <p className="text-lg font-bold text-amber-300">{winnerName}</p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl shadow-lg cursor-pointer"
            >
              جولة جديدة
            </button>
          </div>
        )}

        {/* On-Screen Touch Controls for Player 1 */}
        <div className="absolute inset-x-0 bottom-3 px-4 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onTouchStart={() => handleTouch(1, 'left')}
              onTouchEnd={() => handleTouch(1, 'stop')}
              onMouseDown={() => handleTouch(1, 'left')}
              onMouseUp={() => handleTouch(1, 'stop')}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow-xl cursor-pointer"
              aria-label="مناورة يساراً"
            >
              ◀
            </button>
            <button
              onTouchStart={() => handleTouch(1, 'right')}
              onTouchEnd={() => handleTouch(1, 'stop')}
              onMouseDown={() => handleTouch(1, 'right')}
              onMouseUp={() => handleTouch(1, 'stop')}
              className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow-xl cursor-pointer"
              aria-label="مناورة يميناً"
            >
              ▶
            </button>
          </div>

          <div className="pointer-events-auto">
            <button
              onTouchStart={() => handleTouch(1, 'fire')}
              onTouchEnd={() => handleTouch(1, 'stopFire')}
              onMouseDown={() => handleTouch(1, 'fire')}
              onMouseUp={() => handleTouch(1, 'stopFire')}
              className="w-16 h-16 rounded-full bg-rose-600 active:bg-rose-700 border-2 border-rose-400 shadow-xl active:scale-90 flex items-center justify-center text-white cursor-pointer"
              aria-label="إطلاق الرصاص"
            >
              <Crosshair className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={initGame}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة الجولة</span>
        </button>
        <span className="text-xs text-slate-400">
          ⌨️ A / D للمناورة | Space لإطلاق النيران
        </span>
      </div>
    </div>
  );
};
