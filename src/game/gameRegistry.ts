import { GameInfo } from './types';

export const GAMES_LIST: GameInfo[] = [
  {
    id: 'tanks_3d',
    title: 'معركة الدبابات ثلاثية الأبعاد',
    titleEn: '3D Tanks Arena',
    description: 'معركة حربية مشوقة بالدبابات ثلاثية الأبعاد مع حواجز ومدافع وقذائف، تدعم اللعب الفردي ضد الروبوتات أو الجماعي حتى 4 لاعبين!',
    category: 'war',
    is3D: true,
    supportedPlayers: [1, 2, 3, 4],
    icon: 'ShieldAlert',
    tag: 'حربية 3D',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  {
    id: 'cyber_racer_3d',
    title: 'سباق الطرق السريعة ثلاثي الأبعاد',
    titleEn: '3D Cyber Racer',
    description: 'سباق سيارات نيون ثلاثي الأبعاد فائق السرعة، تجاوز العقبات واستفد من منصات التعزيز النيترو لتصل أولاً!',
    category: 'competitive',
    is3D: true,
    supportedPlayers: [1, 2],
    icon: 'Zap',
    tag: 'سباق 3D',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'air_fighters_2d',
    title: 'صقور السماء الحربية',
    titleEn: 'Sky Dogfight 2D',
    description: 'اشتباك جوي عاصف بالطائرات الحربية، أطلق الصواريخ واستخدم المناورات الجوية لتفادي قذائف الأعداء!',
    category: 'war',
    is3D: false,
    supportedPlayers: [1, 2, 3, 4],
    icon: 'Flame',
    tag: 'حربية طائرات',
    badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  },
  {
    id: 'air_hockey',
    title: 'هوكي الطاولة النيونية',
    titleEn: 'Neon Air Hockey',
    description: 'هوكي طاولة فيزيائي سريع باللمس أو الماوس، ارتدادات واقعية وسرعة ممتعة للتحدي الثنائي!',
    category: 'competitive',
    is3D: false,
    supportedPlayers: [1, 2],
    icon: 'Disc',
    tag: 'رياضية وتنافس',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  {
    id: 'cultural_trivia',
    title: 'تحدي العباقرة والأسئلة الثقافية',
    titleEn: 'Cultural Trivia Challenge',
    description: 'مسابقة أسئلة ثقافية وعلمية وتاريخية شيقة باللغة العربية مع مؤقت وسرعة استجابة وتنافس متعدد!',
    category: 'trivia',
    is3D: false,
    supportedPlayers: [1, 2, 3, 4],
    icon: 'Brain',
    tag: 'ثقافية وذكاء',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'mega_xo',
    title: 'لعبة إكس أو الفائقة (XO)',
    titleEn: 'Mega Tic-Tac-Toe',
    description: 'لعبة XO الكلاسيكية والمطورة بنظام نيون جذاب، مع ذكاء اصطناعي ذكي للعب الفردي أو ثنائي!',
    category: 'trivia',
    is3D: false,
    supportedPlayers: [1, 2],
    icon: 'Grid3X3',
    tag: 'ذكاء وتفكير',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  {
    id: 'tug_of_war',
    title: 'شد الحبل والضربات السريعة',
    titleEn: 'Finger Tap Tug of War',
    description: 'تحدي النقر الخارق للأصابع! انقر بأقصى سرعة ممكنة لسحب الحبل نحو منطقتك وهزيمة خصمك!',
    category: 'competitive',
    is3D: false,
    supportedPlayers: [1, 2, 3, 4],
    icon: 'Activity',
    tag: 'سرعة وتنافس',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  {
    id: 'quick_reflex',
    title: 'سرعة رد الفعل والقنبلة الموقوتة',
    titleEn: 'Quick Reflex Duel',
    description: 'اختبار دقة وسرعة البديهة! انتظر إشارة الانطلاق الخضراء والمس فوراً قبل خصومك.. إياك واللمس المبكر!',
    category: 'competitive',
    is3D: false,
    supportedPlayers: [1, 2, 3, 4],
    icon: 'Timer',
    tag: 'رد فعل سريع',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  }
];

export const DEFAULT_PLAYERS = [
  {
    id: 1,
    name: 'اللاعب 1 (الأحمر)',
    color: '#ef4444',
    accentColor: 'red',
    glowClass: 'arcade-glow-red',
    avatar: '🦁',
    score: 0,
    isAi: false,
    corner: 'bottom-right' as const,
    keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', action: 'Space' }
  },
  {
    id: 2,
    name: 'اللاعب 2 (الأزرق)',
    color: '#3b82f6',
    accentColor: 'blue',
    glowClass: 'arcade-glow-blue',
    avatar: '🦅',
    score: 0,
    isAi: false,
    corner: 'top-left' as const,
    keys: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', action: 'Enter' }
  },
  {
    id: 3,
    name: 'اللاعب 3 (الأخضر)',
    color: '#22c55e',
    accentColor: 'green',
    glowClass: 'arcade-glow-green',
    avatar: '🐺',
    score: 0,
    isAi: false,
    corner: 'top-right' as const,
    keys: { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', action: 'KeyU' }
  },
  {
    id: 4,
    name: 'اللاعب 4 (الأصفر)',
    color: '#eab308',
    accentColor: 'yellow',
    glowClass: 'arcade-glow-yellow',
    avatar: '⚡',
    score: 0,
    isAi: false,
    corner: 'bottom-left' as const,
    keys: { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', action: 'Numpad0' }
  }
];
