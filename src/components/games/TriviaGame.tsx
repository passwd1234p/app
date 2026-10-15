import React, { useState, useEffect } from 'react';
import { PlayerConfig, TriviaQuestion } from '../../game/types';
import { TRIVIA_QUESTIONS } from '../../game/triviaData';
import { sound } from '../../game/sound';
import { Brain, Timer, Trophy, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TriviaGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

export const TriviaGame: React.FC<TriviaGameProps> = ({
  playerCount,
  players,
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [buzzedPlayerId, setBuzzedPlayerId] = useState<number | null>(
    playerCount === 1 ? 1 : null
  );
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ: TriviaQuestion =
    TRIVIA_QUESTIONS[questionIndex % TRIVIA_QUESTIONS.length];

  // Timer countdown
  useEffect(() => {
    if (isAnswerRevealed || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up!
          sound.playWrong();
          setIsAnswerRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswerRevealed, isFinished, questionIndex]);

  // Handle Corner Buzzer Press (for 2-4 players)
  const handleBuzz = (playerId: number) => {
    if (buzzedPlayerId !== null || isAnswerRevealed) return;
    sound.playClick();
    setBuzzedPlayerId(playerId);
  };

  // Handle Option Selection
  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed || buzzedPlayerId === null) return;
    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      sound.playCorrect();
      setScores((prev) => ({
        ...prev,
        [buzzedPlayerId]: (prev[buzzedPlayerId] || 0) + 100 + timeLeft * 10,
      }));
    } else {
      sound.playWrong();
      setScores((prev) => ({
        ...prev,
        [buzzedPlayerId]: Math.max(0, (prev[buzzedPlayerId] || 0) - 50),
      }));
    }
  };

  // Advance Question
  const nextQuestion = () => {
    sound.playClick();
    if (questionIndex >= 9) {
      // 10 Questions Finished
      setIsFinished(true);
      sound.playWin();
      confetti({ particleCount: 120, spread: 80 });
      return;
    }

    setQuestionIndex((prev) => prev + 1);
    setBuzzedPlayerId(playerCount === 1 ? 1 : null);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setTimeLeft(15);
  };

  const restartQuiz = () => {
    sound.playClick();
    setQuestionIndex(0);
    setScores({ 1: 0, 2: 0, 3: 0, 4: 0 });
    setBuzzedPlayerId(playerCount === 1 ? 1 : null);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setTimeLeft(15);
    setIsFinished(false);
  };

  const activePlayers = players.slice(0, playerCount);

  // Highest scorer
  const winningPlayer = [...activePlayers].sort(
    (a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)
  )[0];

  return (
    <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center p-3">
      {/* Top Header & Scores */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-black text-white">تحدي العباقرة الثقافي</div>
            <div className="text-xs text-slate-400">
              السؤال {questionIndex + 1} من 10 • تصنيف: {currentQ.category}
            </div>
          </div>
        </div>

        {/* Players Score Chips */}
        <div className="flex items-center gap-2">
          {activePlayers.map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                buzzedPlayerId === p.id
                  ? 'border-amber-400 bg-amber-400/20 shadow-md scale-105'
                  : 'border-slate-800 bg-slate-950'
              }`}
            >
              <span>{p.avatar}</span>
              <span className="text-xs font-bold text-white">{p.name}:</span>
              <span className="text-xs font-black text-amber-400">
                {scores[p.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Question Card with Timer */}
      {!isFinished ? (
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Timer bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft < 5 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${(timeLeft / 15) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Timer className="w-4 h-4 text-emerald-400" />
              <span>المتبقي: {timeLeft} ثانية</span>
            </span>
            {playerCount > 1 && (
              <span className="text-amber-400">
                {buzzedPlayerId
                  ? `دور: ${players.find((p) => p.id === buzzedPlayerId)?.name} للإجابة`
                  : 'اضغط على زر الجرس أولاً للإجابة!'}
              </span>
            )}
          </div>

          {/* Question Text */}
          <h3 className="text-xl sm:text-2xl font-black text-white text-center leading-relaxed py-2">
            {currentQ.question}
          </h3>

          {/* 4 Corner Buzzers for Multi-Player Party on Phone/Tablet */}
          {playerCount > 1 && buzzedPlayerId === null && (
            <div className="grid grid-cols-2 gap-3 py-2">
              {activePlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleBuzz(p.id)}
                  className="py-4 px-3 rounded-2xl border-2 font-black text-white text-sm shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    backgroundColor: `${p.color}25`,
                    borderColor: p.color,
                  }}
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <span>اضغط يا {p.name}!</span>
                </button>
              ))}
            </div>
          )}

          {/* 4 Multiple-Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQ.correctIndex;

              let btnStyle =
                'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-800/60';

              if (isAnswerRevealed) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
                }
              } else if (isSelected) {
                btnStyle = 'bg-cyan-500/20 border-cyan-500 text-cyan-300';
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswerRevealed || buzzedPlayerId === null}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl border text-sm sm:text-base font-bold text-right transition-all flex items-center justify-between cursor-pointer disabled:cursor-not-allowed ${btnStyle}`}
                >
                  <span>{opt}</span>
                  <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs shrink-0 mr-2">
                    {['أ', 'ب', 'ج', 'د'][idx]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          {isAnswerRevealed && (
            <div className="flex justify-center pt-2">
              <button
                onClick={nextQuestion}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-2xl text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 cursor-pointer animate-pulse"
              >
                السؤال التالي ➔
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Final Leaderboard / Trophy Screen */
        <div className="w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <Trophy className="w-20 h-20 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-3xl font-black text-white">انتهى التحدي الثقافي!</h3>

          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-sm mx-auto space-y-2">
            <span className="text-5xl block">{winningPlayer.avatar}</span>
            <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
              عبقري الجلسة
            </div>
            <div className="text-2xl font-black text-white">{winningPlayer.name}</div>
            <div className="text-lg font-bold text-amber-300">
              {scores[winningPlayer.id] || 0} نقطة
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={restartQuiz}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl text-sm shadow-lg cursor-pointer"
            >
              لعب مرة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
