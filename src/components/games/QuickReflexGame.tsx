import React, { useState, useEffect, useRef } from 'react';
import { PlayerConfig } from '../../game/types';
import { sound } from '../../game/sound';
import { RotateCcw, Trophy, Zap, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickReflexGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

type GameState = 'idle' | 'waiting' | 'ready' | 'result';

export const QuickReflexGame: React.FC<QuickReflexGameProps> = ({
  playerCount,
  players,
}) => {
  const [gameState, setGameState] = useState<GameState>('idle');
  const [winner, setWinner] = useState<PlayerConfig | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [faultPlayer, setFaultPlayer] = useState<PlayerConfig | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    sound.playClick();
    setGameState('waiting');
    setWinner(null);
    setReactionTime(null);
    setFaultPlayer(null);

    // Random delay between 2 and 5.5 seconds
    const delay = 2000 + Math.random() * 3500;

    timerRef.current = setTimeout(() => {
      sound.playCountdown(true);
      startTimeRef.current = performance.now();
      setGameState('ready');
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePlayerTap = (player: PlayerConfig) => {
    if (gameState === 'waiting') {
      // Early tap penalty!
      sound.playWrong();
      if (timerRef.current) clearTimeout(timerRef.current);
      setFaultPlayer(player);
      setGameState('result');
      return;
    }

    if (gameState === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      sound.playWin();
      setWinner(player);
      setReactionTime(elapsed);
      setGameState('result');
      setScores((prev) => ({
        ...prev,
        [player.id]: (prev[player.id] || 0) + 1,
      }));
      confetti({ particleCount: 90, spread: 70 });
    }
  };

  const activePlayers = players.slice(0, playerCount);

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center p-3 select-none">
      {/* Top Scores */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" />
          <div>
            <div className="text-sm font-black text-white">سرعة رد الفعل الخارقة</div>
            <div className="text-xs text-slate-400">المس فور ظهور اللون الأخضر</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activePlayers.map((p) => (
            <div
              key={p.id}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-1.5"
            >
              <span>{p.avatar}</span>
              <span className="text-xs font-bold text-white">{p.name}:</span>
              <span className="text-xs font-black text-amber-400">{scores[p.id] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Signal Area */}
      <div
        className={`w-full h-64 rounded-3xl border-4 flex flex-col items-center justify-center p-6 shadow-2xl transition-all duration-200 mb-6 ${
          gameState === 'ready'
            ? 'bg-emerald-600 border-emerald-300 text-slate-950 animate-pulse'
            : gameState === 'waiting'
            ? 'bg-rose-950/80 border-rose-600 text-rose-300'
            : gameState === 'result'
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}
      >
        {gameState === 'idle' && (
          <div className="text-center space-y-3">
            <Zap className="w-16 h-16 mx-auto text-amber-400" />
            <h3 className="text-xl font-black text-white">اضغط "ابدأ الجولة" للاستعداد</h3>
            <button
              onClick={startRound}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl text-sm shadow-xl cursor-pointer hover:brightness-110 active:scale-95"
            >
              ابدأ الجولة الآن!
            </button>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="text-center space-y-2">
            <div className="w-6 h-6 rounded-full bg-rose-500 animate-ping mx-auto" />
            <h3 className="text-2xl font-black text-rose-300">استعد وانتظر الإشارة...</h3>
            <p className="text-xs text-rose-400">إياك واللمس المبكر قبل الأخضر!</p>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="text-center space-y-1">
            <h3 className="text-4xl sm:text-5xl font-black text-slate-950">المس فوراً!</h3>
            <p className="text-base font-black text-slate-900">سارع بالنقر الآن!</p>
          </div>
        )}

        {gameState === 'result' && (
          <div className="text-center space-y-3">
            {faultPlayer ? (
              <div className="space-y-1">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
                <h4 className="text-lg font-black text-rose-400">لمس مبكر (خطأ انطلاق)!</h4>
                <p className="text-sm font-bold text-slate-300">
                  {faultPlayer.avatar} {faultPlayer.name} استعجل قبل إشارة الانطلاق!
                </p>
              </div>
            ) : winner ? (
              <div className="space-y-1">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                <h4 className="text-xl font-black text-white">
                  أسرع يد: <span className="text-amber-400">{winner.name}</span>!
                </h4>
                <p className="text-sm font-black text-emerald-400">
                  زمن الاستجابة: {reactionTime} مللي ثانية ⚡
                </p>
              </div>
            ) : null}

            <button
              onClick={startRound}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-xl text-xs shadow-md cursor-pointer hover:brightness-110"
            >
              جولة تالية
            </button>
          </div>
        )}
      </div>

      {/* 4 Corner Touch Buttons for Phone / Tablet Flat Play */}
      <div className="grid grid-cols-2 gap-4 w-full h-48">
        {activePlayers.map((p) => (
          <button
            key={p.id}
            onTouchStart={() => handlePlayerTap(p)}
            onMouseDown={() => handlePlayerTap(p)}
            className="rounded-3xl border-4 font-black text-white text-base sm:text-lg flex flex-col items-center justify-center p-3 shadow-xl active:scale-95 transition-transform cursor-pointer"
            style={{
              backgroundColor: `${p.color}35`,
              borderColor: p.color,
            }}
            aria-label={`زر استجابة ${p.name}`}
          >
            <span className="text-3xl">{p.avatar}</span>
            <span className="mt-1">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
