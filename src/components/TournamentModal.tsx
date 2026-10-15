import React, { useState } from 'react';
import { Trophy, X, Play, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerConfig } from '../game/types';
import { sound } from '../game/sound';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerConfig[];
  onStartMatch: (p1: PlayerConfig, p2: PlayerConfig, matchTitle: string) => void;
}

interface MatchState {
  id: string;
  roundName: string;
  p1: PlayerConfig;
  p2: PlayerConfig;
  winner?: PlayerConfig;
  completed: boolean;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  players,
  onStartMatch,
}) => {
  if (!isOpen) return null;

  // Initialize tournament matches (4 players = 2 semis + 1 final)
  const [semi1Winner, setSemi1Winner] = useState<PlayerConfig | null>(null);
  const [semi2Winner, setSemi2Winner] = useState<PlayerConfig | null>(null);
  const [champion, setChampion] = useState<PlayerConfig | null>(null);

  const p1 = players[0];
  const p2 = players[1];
  const p3 = players[2] || { ...players[0], id: 3, name: 'لاعب 3', color: '#22c55e', avatar: '🐺' };
  const p4 = players[3] || { ...players[1], id: 4, name: 'لاعب 4', color: '#eab308', avatar: '⚡' };

  const handleSimulateOrSelectWinner = (semi: 1 | 2, winner: PlayerConfig) => {
    sound.playCorrect();
    if (semi === 1) {
      setSemi1Winner(winner);
    } else {
      setSemi2Winner(winner);
    }
  };

  const handleCrownChampion = (champ: PlayerConfig) => {
    sound.playWin();
    setChampion(champ);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const resetTournament = () => {
    sound.playClick();
    setSemi1Winner(null);
    setSemi2Winner(null);
    setChampion(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="إغلاق البطولة"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-2">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            كأس بطولة الحفلة الكبرى
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            مواجهات إقصائية حاسمة لتحديد بطل المنصة الأسطوري!
          </p>
        </div>

        {/* Tournament Bracket Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Semi-Final 1 */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-b border-slate-800/80 pb-2">
              <span>نصف النهائي 1</span>
              {semi1Winner && <span className="text-emerald-400">تم الحسم ✓</span>}
            </div>

            <div className="space-y-2">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  semi1Winner?.id === p1.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p1.avatar}</span>
                  <span className="font-bold text-sm text-white">{p1.name}</span>
                </div>
                {!semi1Winner && (
                  <button
                    onClick={() => handleSimulateOrSelectWinner(1, p1)}
                    className="text-[11px] px-2 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg font-bold"
                  >
                    تأهيل
                  </button>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 font-extrabold uppercase">
                ضد
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  semi1Winner?.id === p2.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p2.avatar}</span>
                  <span className="font-bold text-sm text-white">{p2.name}</span>
                </div>
                {!semi1Winner && (
                  <button
                    onClick={() => handleSimulateOrSelectWinner(1, p2)}
                    className="text-[11px] px-2 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg font-bold"
                  >
                    تأهيل
                  </button>
                )}
              </div>
            </div>

            {!semi1Winner && (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onStartMatch(p1, p2, 'نصف النهائي 1');
                }}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>العب المواجهة الآن</span>
              </button>
            )}
          </div>

          {/* Finals / Champion */}
          <div className="space-y-4 bg-gradient-to-b from-amber-500/10 to-slate-950/80 p-5 rounded-3xl border border-amber-500/30 text-center">
            <div className="inline-flex p-2 bg-amber-500/20 rounded-full text-amber-400 mb-1">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="font-black text-white text-base">المباراة النهائية الكبرى</h3>

            {champion ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/50 space-y-2 animate-bounce">
                <span className="text-4xl block">{champion.avatar}</span>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  بطل البطولة
                </div>
                <div className="text-lg font-black text-white">{champion.name}</div>
              </div>
            ) : semi1Winner && semi2Winner ? (
              <div className="space-y-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {semi1Winner.avatar} {semi1Winner.name}
                  </span>
                  <button
                    onClick={() => handleCrownChampion(semi1Winner)}
                    className="text-[11px] px-2 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold"
                  >
                    فائز
                  </button>
                </div>
                <div className="text-xs text-amber-400 font-bold">ضد</div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {semi2Winner.avatar} {semi2Winner.name}
                  </span>
                  <button
                    onClick={() => handleCrownChampion(semi2Winner)}
                    className="text-[11px] px-2 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold"
                  >
                    فائز
                  </button>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    onStartMatch(semi1Winner, semi2Winner, 'المباراة النهائية الكبرى');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>العب النهائي الآن!</span>
                </button>
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-500 font-medium">
                بانتظار حسم مباراتي نصف النهائي...
              </div>
            )}
          </div>

          {/* Semi-Final 2 */}
          <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 border-b border-slate-800/80 pb-2">
              <span>نصف النهائي 2</span>
              {semi2Winner && <span className="text-emerald-400">تم الحسم ✓</span>}
            </div>

            <div className="space-y-2">
              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  semi2Winner?.id === p3.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p3.avatar}</span>
                  <span className="font-bold text-sm text-white">{p3.name}</span>
                </div>
                {!semi2Winner && (
                  <button
                    onClick={() => handleSimulateOrSelectWinner(2, p3)}
                    className="text-[11px] px-2 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg font-bold"
                  >
                    تأهيل
                  </button>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 font-extrabold uppercase">
                ضد
              </div>

              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  semi2Winner?.id === p4.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p4.avatar}</span>
                  <span className="font-bold text-sm text-white">{p4.name}</span>
                </div>
                {!semi2Winner && (
                  <button
                    onClick={() => handleSimulateOrSelectWinner(2, p4)}
                    className="text-[11px] px-2 py-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded-lg font-bold"
                  >
                    تأهيل
                  </button>
                )}
              </div>
            </div>

            {!semi2Winner && (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onStartMatch(p3, p4, 'نصف النهائي 2');
                }}
                className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>العب المواجهة الآن</span>
              </button>
            )}
          </div>
        </div>

        {/* Reset / Actions */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            onClick={resetTournament}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة تعيين البطولة</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
