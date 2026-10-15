import React, { useState, useEffect, useRef } from 'react';
import { PlayerConfig } from '../../game/types';
import { calculateTugProgress } from '../../game/rules';
import { sound } from '../../game/sound';
import { RotateCcw, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TugOfWarGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

export const TugOfWarGame: React.FC<TugOfWarGameProps> = ({
  playerCount,
  players,
}) => {
  const [pulls1, setPulls1] = useState(0);
  const [pulls2, setPulls2] = useState(0);
  const [winner, setWinner] = useState<number | null>(null);
  const [combo1, setCombo1] = useState(0);
  const [combo2, setCombo2] = useState(0);

  const targetDiff = 35;
  const progress = calculateTugProgress(pulls1, pulls2, targetDiff);

  // AI Pulling for 1 Player mode
  useEffect(() => {
    if (playerCount !== 1 || winner !== null) return;

    const interval = setInterval(() => {
      // AI taps randomly between 4 to 7 times a second
      setPulls2((prev) => {
        const next = prev + 1;
        const res = calculateTugProgress(pulls1, next, targetDiff);
        if (res.winner === 2 && winner === null) {
          setWinner(2);
          sound.playWrong();
        }
        return next;
      });
    }, 180 + Math.random() * 80);

    return () => clearInterval(interval);
  }, [playerCount, pulls1, winner]);

  const handleTap = (team: 1 | 2) => {
    if (winner !== null) return;
    sound.playClick();

    if (team === 1) {
      const next = pulls1 + 1;
      setPulls1(next);
      setCombo1((c) => c + 1);
      const res = calculateTugProgress(next, pulls2, targetDiff);
      if (res.winner === 1) {
        setWinner(1);
        sound.playWin();
        confetti({ particleCount: 100, spread: 70 });
      }
    } else {
      const next = pulls2 + 1;
      setPulls2(next);
      setCombo2((c) => c + 1);
      const res = calculateTugProgress(pulls1, next, targetDiff);
      if (res.winner === 2) {
        setWinner(2);
        sound.playWin();
        confetti({ particleCount: 100, spread: 70 });
      }
    }
  };

  const resetGame = () => {
    sound.playClick();
    setPulls1(0);
    setPulls2(0);
    setCombo1(0);
    setCombo2(0);
    setWinner(null);
  };

  const p1Label = playerCount === 4 ? `${players[0]?.name} & ${players[3]?.name}` : players[0]?.name || 'فريق 1';
  const p2Label =
    playerCount === 1
      ? 'الروبوت الآلي'
      : playerCount === 4
      ? `${players[1]?.name} & ${players[2]?.name}`
      : players[1]?.name || 'فريق 2';

  // Rope flag position offset (percentage -50% to +50%)
  const ropeOffset = progress.position * 45; // in %

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center p-3 select-none">
      {/* Top Title & Info */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex items-center justify-between mb-4 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦁</span>
          <div>
            <div className="text-xs font-bold text-white">{p1Label}</div>
            <div className="text-lg font-black text-rose-500">{pulls1} سحبة</div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-[11px] font-bold text-slate-400">صراع شد الحبل</div>
          <div className="text-xs font-black text-amber-400">انقر بأقصى سرعة!</div>
        </div>

        <div className="flex items-center gap-2 text-left">
          <div>
            <div className="text-xs font-bold text-white">{p2Label}</div>
            <div className="text-lg font-black text-blue-500">{pulls2} سحبة</div>
          </div>
          <span className="text-2xl">🦅</span>
        </div>
      </div>

      {/* Main Rope Display Arena */}
      <div className="w-full bg-slate-900/70 border-2 border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-6">
        {/* Center line marker */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 border-r-2 border-dashed border-cyan-400/50" />

        {/* Rope graphic */}
        <div className="relative h-16 flex items-center justify-center">
          {/* Thick woven rope */}
          <div className="w-full h-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-full shadow-inner border border-amber-900/40 relative">
            {/* Center Red Ribbon / Flag */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-xs font-black text-white transition-all duration-75"
              style={{
                left: `calc(50% + ${ropeOffset}%)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              🚩
            </div>
          </div>
        </div>

        {/* Pull markers (-100% to +100%) */}
        <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-2">
          <span className="text-rose-400">منطقة فوز الأحمر ◀</span>
          <span className="text-blue-400">▶ منطقة فوز الأزرق</span>
        </div>
      </div>

      {/* Huge Mobile Tap Pads (Left vs Right) */}
      <div className="grid grid-cols-2 gap-4 w-full h-56">
        {/* Team 1 Tap Button */}
        <button
          onTouchStart={() => handleTap(1)}
          onMouseDown={() => handleTap(1)}
          className="rounded-3xl bg-gradient-to-b from-rose-600 to-rose-700 active:from-rose-700 active:to-rose-800 border-4 border-rose-400/60 shadow-2xl active:scale-95 flex flex-col items-center justify-center text-white cursor-pointer transition-transform"
          aria-label="سحب الحبل للفريق الأحمر"
        >
          <Flame className="w-10 h-10 animate-bounce" />
          <span className="text-xl sm:text-2xl font-black mt-1">انقر هنا!</span>
          <span className="text-xs font-bold opacity-80">{p1Label}</span>
        </button>

        {/* Team 2 Tap Button */}
        <button
          onTouchStart={() => handleTap(2)}
          onMouseDown={() => handleTap(2)}
          disabled={playerCount === 1}
          className={`rounded-3xl border-4 shadow-2xl flex flex-col items-center justify-center text-white transition-transform ${
            playerCount === 1
              ? 'bg-slate-800/60 border-slate-700/60 opacity-60 cursor-not-allowed'
              : 'bg-gradient-to-b from-blue-600 to-blue-700 active:from-blue-700 active:to-blue-800 border-blue-400/60 active:scale-95 cursor-pointer'
          }`}
          aria-label="سحب الحبل للفريق الأزرق"
        >
          <Flame className="w-10 h-10 animate-bounce" />
          <span className="text-xl sm:text-2xl font-black mt-1">
            {playerCount === 1 ? 'الكمبيوتر ينقر...' : 'انقر هنا!'}
          </span>
          <span className="text-xs font-bold opacity-80">{p2Label}</span>
        </button>
      </div>

      {/* Winner Screen */}
      {winner !== null && (
        <div className="mt-4 px-6 py-4 rounded-2xl bg-amber-500/20 border border-amber-400 text-center space-y-2 shadow-xl animate-bounce">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-black text-white">
            فاز بالصراع الخارق:{' '}
            <span className="text-amber-400">
              {winner === 1 ? p1Label : p2Label}
            </span>
            !
          </h3>
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-md cursor-pointer"
          >
            جولة جديدة
          </button>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط الصراع</span>
        </button>
      </div>
    </div>
  );
};
