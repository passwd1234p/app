import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  Flame,
  Disc,
  Brain,
  Grid3X3,
  Activity,
  Timer,
  Play,
  Users,
  Box,
  Layers,
  Sparkles,
  Trophy,
  Gamepad2,
} from 'lucide-react';
import { GameCategory, GameInfo, GameMode, PlayerConfig } from '../game/types';
import { GAMES_LIST } from '../game/gameRegistry';
import { sound } from '../game/sound';

const ICON_MAP: Record<string, React.ElementType> = {
  ShieldAlert,
  Zap,
  Flame,
  Disc,
  Brain,
  Grid3X3,
  Activity,
  Timer,
};

interface GameSelectorProps {
  currentMode: GameMode;
  onSelectGame: (gameId: string) => void;
  players: PlayerConfig[];
  onUpdatePlayerName: (id: number, name: string) => void;
  onOpenTournament: () => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  currentMode,
  onSelectGame,
  players,
  onUpdatePlayerName,
  onOpenTournament,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('all');
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);

  // Filter games based on category and compatibility with mode
  const activePlayerCount = currentMode === 'solo' ? 1 : currentMode === 'two_player' ? 2 : 4;

  const filteredGames = GAMES_LIST.filter((game) => {
    // Mode compatibility check
    if (currentMode !== 'tournament' && !game.supportedPlayers.includes(activePlayerCount as 1 | 2 | 3 | 4)) {
      return false;
    }

    if (selectedCategory === 'all') return true;
    if (selectedCategory === '3d') return game.is3D;
    return game.category === selectedCategory;
  });

  const categories: { id: GameCategory; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'جميع الألعاب', icon: Sparkles },
    { id: '3d', label: 'ألعاب ثلاثية الأبعاد 3D', icon: Box },
    { id: 'war', label: 'حربية وقتال', icon: ShieldAlert },
    { id: 'competitive', label: 'تنافسية ورياضة', icon: Zap },
    { id: 'trivia', label: 'ثقافية وذكاء وXO', icon: Brain },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner with Quick Stats & Instructions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ألعاب هاتف وشاشة مشتركة بدقة فائقة</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              أقوى صالة ألعاب جماعية وفردية في مكان واحد
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              اختر لعبتك المفضلة، العب بمفردك ضد الروبوتات أو مع أصدقائك 2 أو 4 لاعبين على نفس الشاشة بتحكم لمسي صُمم خصيصاً للهواتف والأجهزة اللوحية!
            </p>
          </div>

          {/* Quick Tournament CTA button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenTournament();
            }}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Trophy className="w-5 h-5" />
            <div className="text-right">
              <div className="text-sm">ابدأ بطولة الحفلة</div>
              <div className="text-[10px] font-semibold opacity-80">كأس التحدي بين 4 لاعبين</div>
            </div>
          </button>
        </div>

        {/* Players Card Strip & Standalone HTML Bar */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 ml-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>اللاعبون ({activePlayerCount}):</span>
            </span>

            {players.slice(0, activePlayerCount).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-sm"
              >
                <span className="text-lg">{p.avatar}</span>
                {editingPlayerId === p.id ? (
                  <input
                    type="text"
                    defaultValue={p.name}
                    autoFocus
                    onBlur={(e) => {
                      onUpdatePlayerName(p.id, e.target.value.trim() || p.name);
                      setEditingPlayerId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onUpdatePlayerName(p.id, (e.target as HTMLInputElement).value.trim() || p.name);
                        setEditingPlayerId(null);
                      }
                    }}
                    className="w-24 px-1.5 py-0.5 bg-slate-800 border border-cyan-500 rounded text-xs text-white outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setEditingPlayerId(p.id)}
                    className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
                    style={{ color: p.color }}
                    title="انقر لتعديل الاسم"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">✎</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Standalone HTML version quick access */}
          <div className="flex items-center gap-2">
            <a
              href="/standalone.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>🌐 فتح نسخة HTML المستقلة</span>
            </a>
            <a
              href="/standalone.html"
              download="ملتقى-الألعاب-الخارقة.html"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <span>💾 تحميل ملف HTML للعمل بدون نت</span>
            </a>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick();
                setSelectedCategory(cat.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredGames.map((game) => {
          const Icon = ICON_MAP[game.icon] || Gamepad2;
          return (
            <div
              key={game.id}
              className="group relative flex flex-col justify-between bg-slate-900/70 hover:bg-slate-800/80 rounded-3xl p-5 border border-slate-800 hover:border-cyan-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10"
            >
              {/* Top Badges */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${game.badgeColor}`}
                    >
                      {game.tag}
                    </span>
                    {game.is3D ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 flex items-center gap-1">
                        <Box className="w-3 h-3" />
                        <span>3D ثلاثي الأبعاد</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        <span>2D ثنائي الأبعاد</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-700/50">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>{game.supportedPlayers.join(' • ')} لاعب</span>
                  </div>
                </div>

                {/* Title & Icon */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center border border-slate-700/80 group-hover:border-cyan-400/50 shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <Icon className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {game.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 font-semibold tracking-wide">
                      {game.titleEn}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mt-2 mb-4 line-clamp-3">
                  {game.description}
                </p>
              </div>

              {/* Play Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectGame(game.id);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all cursor-pointer transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>العب الآن</span>
              </button>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800">
          <p className="text-slate-400 font-bold text-sm">
            لا توجد ألعاب متوافقة مع هذا التصنيف لنمط اللاعبين المحدد.
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold cursor-pointer"
          >
            عرض جميع الألعاب
          </button>
        </div>
      )}
    </div>
  );
};
