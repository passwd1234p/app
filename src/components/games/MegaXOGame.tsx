import React, { useState } from 'react';
import { PlayerConfig } from '../../game/types';
import { checkXOWinner, findBestXOMove, XOCell } from '../../game/rules';
import { sound } from '../../game/sound';
import { RotateCcw, Trophy, Sparkles, Brain } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MegaXOGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

export const MegaXOGame: React.FC<MegaXOGameProps> = ({
  playerCount,
  players,
}) => {
  const [boardSize, setBoardSize] = useState<3 | 4>(3);
  const [board, setBoard] = useState<XOCell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('hard');
  const [stats, setStats] = useState({ xWins: 0, oWins: 0, draws: 0 });

  const p1Name = players[0]?.name || 'اللاعب X';
  const p2Name = playerCount === 1 ? 'الذكاء الاصطناعي (O)' : players[1]?.name || 'اللاعب O';

  const handleCellClick = (index: number) => {
    if (board[index] !== null || winner !== null) return;

    sound.playClick();
    const newBoard = [...board];
    newBoard[index] = turn;

    const result = checkXOWinner(newBoard, boardSize);

    if (result.winner) {
      setBoard(newBoard);
      setWinner(result.winner);
      setWinningLine(result.winningLine);
      if (result.winner === 'draw') {
        sound.playHit();
        setStats((prev) => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        sound.playWin();
        confetti({ particleCount: 80, spread: 60 });
        if (result.winner === 'X') {
          setStats((prev) => ({ ...prev, xWins: prev.xWins + 1 }));
        } else {
          setStats((prev) => ({ ...prev, oWins: prev.oWins + 1 }));
        }
      }
      return;
    }

    // Switch turn
    const nextTurn = turn === 'X' ? 'O' : 'X';
    setTurn(nextTurn);
    setBoard(newBoard);

    // If 1P mode and next is O (AI)
    if (playerCount === 1 && nextTurn === 'O') {
      setTimeout(() => {
        const aiMove = findBestXOMove(newBoard, 'O', difficulty);
        if (aiMove !== -1) {
          sound.playClick();
          const aiBoard = [...newBoard];
          aiBoard[aiMove] = 'O';
          const aiResult = checkXOWinner(aiBoard, boardSize);

          if (aiResult.winner) {
            setBoard(aiBoard);
            setWinner(aiResult.winner);
            setWinningLine(aiResult.winningLine);
            if (aiResult.winner === 'draw') {
              sound.playHit();
              setStats((prev) => ({ ...prev, draws: prev.draws + 1 }));
            } else {
              sound.playWrong();
              setStats((prev) => ({ ...prev, oWins: prev.oWins + 1 }));
            }
          } else {
            setBoard(aiBoard);
            setTurn('X');
          }
        }
      }, 400);
    }
  };

  const resetGame = () => {
    sound.playClick();
    setBoard(Array(boardSize * boardSize).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
  };

  const switchGridSize = (size: 3 | 4) => {
    sound.playClick();
    setBoardSize(size);
    setBoard(Array(size * size).fill(null));
    setTurn('X');
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center p-3">
      {/* Top Card: Score & Turn */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-xl mb-4">
        {/* Player X */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-black text-xl">
            X
          </div>
          <div>
            <div className="text-xs font-bold text-white">{p1Name}</div>
            <div className="text-lg font-black text-cyan-400">{stats.xWins} فوز</div>
          </div>
        </div>

        {/* Turn Status */}
        <div className="text-center">
          <div className="text-[11px] font-bold text-slate-400">الدور الحالي</div>
          <div
            className={`text-sm font-black flex items-center justify-center gap-1.5 ${
              turn === 'X' ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            <span>{turn === 'X' ? 'اللاعب X' : 'اللاعب O'}</span>
            <span className="w-2.5 h-2.5 rounded-full animate-ping bg-current" />
          </div>
        </div>

        {/* Player O */}
        <div className="flex items-center gap-2 text-left">
          <div>
            <div className="text-xs font-bold text-white">{p2Name}</div>
            <div className="text-lg font-black text-rose-400">{stats.oWins} فوز</div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center font-black text-xl">
            O
          </div>
        </div>
      </div>

      {/* Grid Switcher & Difficulty */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => switchGridSize(3)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              boardSize === 3
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            كلاسيكي 3×3
          </button>
          <button
            onClick={() => switchGridSize(4)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              boardSize === 4
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تحدي 4×4
          </button>
        </div>

        {playerCount === 1 && (
          <button
            onClick={() => {
              sound.playClick();
              setDifficulty((d) => (d === 'easy' ? 'hard' : 'easy'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400 cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{difficulty === 'hard' ? 'مستوى: خبير' : 'مستوى: سهل'}</span>
          </button>
        )}
      </div>

      {/* Main XO Grid */}
      <div
        className={`grid gap-3 w-full max-w-[380px] aspect-square bg-slate-900/60 p-4 rounded-3xl border-2 border-slate-800 shadow-2xl relative ${
          boardSize === 3 ? 'grid-cols-3' : 'grid-cols-4'
        }`}
      >
        {board.map((cell, idx) => {
          const isWinningCell = winningLine?.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer border ${
                boardSize === 3 ? 'text-4xl sm:text-5xl' : 'text-3xl'
              } ${
                cell === null
                  ? 'bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/80 active:scale-95'
                  : isWinningCell
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-400/20 animate-pulse'
                  : cell === 'X'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 arcade-glow-blue'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-400 arcade-glow-red'
              }`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {/* Winner Banner / Actions */}
      {winner && (
        <div className="mt-4 px-6 py-3 rounded-2xl bg-slate-900 border border-amber-400/50 text-center space-y-1 shadow-xl animate-bounce">
          <div className="text-base font-black text-amber-300">
            {winner === 'draw'
              ? '🤝 تعادل رائع بين الطرفين!'
              : `🎉 الفائز هو: ${winner === 'X' ? p1Name : p2Name}!`}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl text-xs shadow-md cursor-pointer hover:brightness-110 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>جولة جديدة</span>
        </button>
      </div>
    </div>
  );
};
