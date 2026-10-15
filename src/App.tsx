import React, { useState, useEffect } from 'react';
import { GameMode, PlayerConfig } from './game/types';
import { DEFAULT_PLAYERS, GAMES_LIST } from './game/gameRegistry';
import { Header } from './components/Header';
import { GameSelector } from './components/GameSelector';
import { TournamentModal } from './components/TournamentModal';
import { Tanks3DGame } from './components/games/Tanks3DGame';
import { CyberRacer3DGame } from './components/games/CyberRacer3DGame';
import { AirHockeyGame } from './components/games/AirHockeyGame';
import { AirFighters2DGame } from './components/games/AirFighters2DGame';
import { TriviaGame } from './components/games/TriviaGame';
import { MegaXOGame } from './components/games/MegaXOGame';
import { TugOfWarGame } from './components/games/TugOfWarGame';
import { QuickReflexGame } from './components/games/QuickReflexGame';
import { sound } from './game/sound';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('two_player');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerConfig[]>(DEFAULT_PLAYERS);
  const [tournamentOpen, setTournamentOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);
  const [tournamentMatchContext, setTournamentMatchContext] = useState<{
    p1: PlayerConfig;
    p2: PlayerConfig;
    matchTitle: string;
  } | null>(null);

  // Check URL params for autostart or direct game
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    const autostart = params.get('autostart');
    if (gameParam && GAMES_LIST.some((g) => g.id === gameParam)) {
      setActiveGameId(gameParam);
    } else if (autostart === '1') {
      setActiveGameId('tanks_3d');
    }
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  const handleUpdatePlayerName = (id: number, newName: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  };

  const handleStartTournamentMatch = (
    p1: PlayerConfig,
    p2: PlayerConfig,
    matchTitle: string
  ) => {
    setTournamentMatchContext({ p1, p2, matchTitle });
    // Randomly pick a 2-player game for this tournament match!
    const twoPlayerGames = ['tanks_3d', 'air_hockey', 'mega_xo', 'tug_of_war', 'quick_reflex'];
    const chosen = twoPlayerGames[Math.floor(Math.random() * twoPlayerGames.length)];
    setActiveGameId(chosen);
  };

  const activeGame = GAMES_LIST.find((g) => g.id === activeGameId);
  const playerCountNum = currentMode === 'solo' ? 1 : currentMode === 'two_player' ? 2 : 4;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setActiveGameId(null);
        }}
        activeGameId={activeGameId}
        onBackToLobby={() => {
          setActiveGameId(null);
          setTournamentMatchContext(null);
        }}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenTournament={() => setTournamentOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
        {activeGameId ? (
          <div className="space-y-4">
            {/* Active Game Top Bar */}
            <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <h2 className="text-sm sm:text-base font-black text-white">
                  {activeGame?.title}
                </h2>
                {tournamentMatchContext && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    🏆 {tournamentMatchContext.matchTitle}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-bold">
                نمط:{' '}
                <span className="text-cyan-400">
                  {currentMode === 'solo'
                    ? 'فردي ضد الكمبيوتر'
                    : currentMode === 'two_player'
                    ? 'ثنائي (2 لاعبين)'
                    : 'رباعي (4 لاعبين)'}
                </span>
              </div>
            </div>

            {/* Active Game Renderer */}
            {activeGameId === 'tanks_3d' && (
              <Tanks3DGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'cyber_racer_3d' && (
              <CyberRacer3DGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'air_hockey' && (
              <AirHockeyGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'air_fighters_2d' && (
              <AirFighters2DGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'cultural_trivia' && (
              <TriviaGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'mega_xo' && (
              <MegaXOGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'tug_of_war' && (
              <TugOfWarGame playerCount={playerCountNum} players={players} />
            )}

            {activeGameId === 'quick_reflex' && (
              <QuickReflexGame playerCount={playerCountNum} players={players} />
            )}
          </div>
        ) : (
          /* Game Selection Lobby */
          <GameSelector
            currentMode={currentMode}
            onSelectGame={(gameId) => setActiveGameId(gameId)}
            players={players}
            onUpdatePlayerName={handleUpdatePlayerName}
            onOpenTournament={() => setTournamentOpen(true)}
          />
        )}
      </main>

      {/* Tournament Modal */}
      <TournamentModal
        isOpen={tournamentOpen}
        onClose={() => setTournamentOpen(false)}
        players={players}
        onStartMatch={handleStartTournamentMatch}
      />
    </div>
  );
}
