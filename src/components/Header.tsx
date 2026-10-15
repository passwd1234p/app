import React from 'react';
import { Volume2, VolumeX, Trophy, Users, User, Gamepad2, Maximize, RotateCcw } from 'lucide-react';
import { GameMode } from '../game/types';
import { sound } from '../game/sound';

interface HeaderProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  activeGameId: string | null;
  onBackToLobby: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenTournament: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  activeGameId,
  onBackToLobby,
  soundEnabled,
  onToggleSound,
  onOpenTournament,
}) => {
  const toggleFullScreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-xl">
      {/* Brand & Lobby Back button */}
      <div className="flex items-center gap-3">
        {activeGameId ? (
          <button
            onClick={() => {
              sound.playClick();
              onBackToLobby();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-sm rounded-xl border border-cyan-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
            aria-label="الرجوع إلى القائمة الرئيسية"
          >
            <RotateCcw className="w-4 h-4" />
            <span>القائمة</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
              <Gamepad2 className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>ملتقى الألعاب</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-xs sm:text-sm font-extrabold uppercase">
                  MEGA ARCADE
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                ألعاب حربية وتنافسية وثقافية و3D باللمس
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mode Selectors */}
      <nav aria-label="أنماط اللعب" className="flex items-center gap-1 sm:gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80">
        <button
          onClick={() => {
            sound.playClick();
            onSelectMode('solo');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            currentMode === 'solo'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          aria-label="نمط اللعب الفردي ضد الكمبيوتر"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">فردي</span>
          <span className="text-[10px] opacity-75">1P</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onSelectMode('two_player');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            currentMode === 'two_player'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          aria-label="نمط اللعب الثنائي لاعبين"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">ثنائي</span>
          <span className="text-[10px] opacity-75">2P</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onSelectMode('four_player');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            currentMode === 'four_player'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          aria-label="نمط اللعب الرباعي 4 لاعبين"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">رباعي</span>
          <span className="text-[10px] opacity-75">4P</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onOpenTournament();
          }}
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          aria-label="كأس البطولة"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">البطولة</span>
        </button>
      </nav>

      {/* Audio, Standalone HTML & Display Actions */}
      <div className="flex items-center gap-1.5">
        <a
          href="/standalone.html"
          download="ملتقى-الألعاب-الخارقة-offline.html"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
          title="تحميل نسخة HTML المستقلة للتشغيل بدون إنترنت"
          aria-label="تحميل نسخة HTML المستقلة"
        >
          <span>نسخة HTML</span>
          <span className="text-[10px] bg-slate-950/20 px-1 rounded">💾 حفظ</span>
        </a>

        <button
          onClick={onToggleSound}
          className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/50 transition-colors cursor-pointer"
          aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
          title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <button
          onClick={toggleFullScreen}
          className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/50 transition-colors cursor-pointer hidden sm:flex"
          aria-label="شاشة كاملة"
          title="شاشة كاملة"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
