export type GameMode = 'solo' | 'two_player' | 'four_player' | 'tournament';

export type GameCategory = 'all' | 'war' | 'competitive' | 'trivia' | '3d';

export interface PlayerConfig {
  id: number;
  name: string;
  color: string;
  accentColor: string;
  glowClass: string;
  avatar: string;
  score: number;
  isAi: boolean;
  corner: 'bottom-right' | 'top-left' | 'top-right' | 'bottom-left';
  keys: {
    up?: string;
    down?: string;
    left?: string;
    right?: string;
    action: string;
  };
}

export interface GameInfo {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  category: 'war' | 'competitive' | 'trivia' | '3d';
  is3D: boolean;
  supportedPlayers: (1 | 2 | 3 | 4)[];
  icon: string;
  tag: string;
  badgeColor: string;
}

export interface TriviaQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  category: string;
  explanation?: string;
}

export type XOPlayer = 'X' | 'O' | null;

export interface TournamentMatch {
  id: string;
  player1: PlayerConfig;
  player2: PlayerConfig;
  winner?: PlayerConfig;
  score1: number;
  score2: number;
}
