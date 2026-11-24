export type KeyboardLanguage = 'saraiki' | 'urdu' | 'english';

export interface KeyDef {
  id: string;
  primary: string;
  topRight?: string;
  saraikiSub?: string;
  alternates?: string[];
  widthWeight?: number;
  kind?: 'char' | 'shift' | 'backspace' | 'symbols' | 'comma' | 'globe' | 'emoji' | 'space' | 'period' | 'enter';
  label?: string;
}

export const SARAIKI_ROWS: KeyDef[][] = [
  // Row 1 (digits 1-0 as top-right signs for long-press)
  [
    { id: 's-q', primary: 'ق', topRight: '1', alternates: ['1'] },
    { id: 's-w', primary: 'و', topRight: '2', alternates: ['2', 'ؤ'] },
    { id: 's-e', primary: 'ع', topRight: '3', alternates: ['3'] },
    { id: 's-r', primary: 'ر', topRight: '4', alternates: ['4', 'ڑ'] },
    { id: 's-t', primary: 'ت', topRight: '5', alternates: ['5', 'ٹ', 'ث'] },
    { id: 's-y', primary: 'ے', topRight: '6', alternates: ['6', 'ی'] },
    { id: 's-u', primary: 'ء', topRight: '7', alternates: ['7', 'ئ'] },
    { id: 's-i', primary: 'ی', topRight: '8', alternates: ['8', 'ے'] },
    { id: 's-o', primary: 'ہ', topRight: '9', alternates: ['9', 'ھ', 'ۃ'] },
    { id: 's-p', primary: 'پ', topRight: '0', alternates: ['0'] },
  ],
  // Row 2
  [
    { id: 's-a', primary: 'ا', topRight: '!', alternates: ['آ', 'أ'] },
    { id: 's-s', primary: 'س', topRight: '@', alternates: ['ص', 'ث'] },
    { id: 's-d', primary: 'د', topRight: '#', saraikiSub: 'ݙ', alternates: ['ݙ', 'ڈ', 'ذ'] },
    { id: 's-f', primary: 'ف', topRight: '؟' },
    { id: 's-g', primary: 'گ', topRight: '&', saraikiSub: 'ڳ ڱ', alternates: ['ڳ', 'ڱ', 'غ'] },
    { id: 's-h', primary: 'ح', topRight: '-', alternates: ['خ'] },
    { id: 's-j', primary: 'ج', topRight: '+', saraikiSub: 'ڄ ڃ', alternates: ['ڄ', 'ڃ'] },
    { id: 's-k', primary: 'ک', topRight: '(', alternates: ['خ'] },
    { id: 's-l', primary: 'ل', topRight: ')' },
  ],
  // Row 3
  [
    { id: 's-z', primary: 'ز', topRight: 'ژ', saraikiSub: 'ژ', alternates: ['ژ', 'ذ', 'ض', 'ظ'] },
    { id: 's-x', primary: 'ش', topRight: '"' },
    { id: 's-c', primary: 'چ', topRight: "'" },
    { id: 's-v', primary: 'ط', topRight: ':', alternates: ['ظ'] },
    { id: 's-b', primary: 'ب', topRight: '؛', saraikiSub: 'ٻ', alternates: ['ٻ'] },
    { id: 's-n', primary: 'ن', topRight: '/', saraikiSub: 'ݨ', alternates: ['ݨ', 'ں'] },
    { id: 's-m', primary: 'م', topRight: '،' },
    { id: 's-noon', primary: 'ں', topRight: '۔', alternates: ['ن', 'ݨ'] },
    { id: 's-back', primary: '⌫', kind: 'backspace', widthWeight: 1.35, label: 'Backspace' },
  ],
  // Row 4 (4th letter row per README for Saraiki/Urdu)
  [
    { id: 's-tt', primary: 'ٹ', topRight: '؛', alternates: ['ت'] },
    { id: 's-dd', primary: 'ڈ', topRight: '«', alternates: ['د', 'ݙ'] },
    { id: 's-rr', primary: 'ڑ', topRight: '»', alternates: ['ر'] },
    { id: 's-gh', primary: 'غ', topRight: '٪' },
    { id: 's-kh', primary: 'خ', topRight: '*' },
    { id: 's-sw', primary: 'ص', topRight: '=', alternates: ['ض'] },
    { id: 's-zw', primary: 'ض', topRight: '\\' },
    { id: 's-he', primary: 'ھ', topRight: '؍', alternates: ['ہ'] },
    { id: 's-th', primary: 'ث', topRight: '~' },
  ],
];

export const URDU_ROWS: KeyDef[][] = SARAIKI_ROWS.map((row) =>
  row.map((key) => ({
    ...key,
    // Urdu omits Saraiki-specific light-blue sub-labels while preserving standard Urdu alternates
    saraikiSub: key.id === 's-z' ? 'ژ' : undefined,
    alternates:
      key.id === 's-j'
        ? ['چ']
        : key.id === 's-g'
          ? ['غ']
          : key.id === 's-d'
            ? ['ڈ', 'ذ']
            : key.id === 's-b'
              ? ['پ']
              : key.id === 's-n'
                ? ['ں']
                : key.alternates,
  })),
);

export const ENGLISH_ROWS: KeyDef[][] = [
  // Number row
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => ({
    id: `en-${n}`,
    primary: n,
  })),
  // QWERTY row 1
  [
    { id: 'en-q', primary: 'q', topRight: '%' },
    { id: 'en-w', primary: 'w', topRight: '\\' },
    { id: 'en-e', primary: 'e', topRight: '|' },
    { id: 'en-r', primary: 'r', topRight: '=' },
    { id: 'en-t', primary: 't', topRight: '[' },
    { id: 'en-y', primary: 'y', topRight: ']' },
    { id: 'en-u', primary: 'u', topRight: '<' },
    { id: 'en-i', primary: 'i', topRight: '>' },
    { id: 'en-o', primary: 'o', topRight: '{' },
    { id: 'en-p', primary: 'p', topRight: '}' },
  ],
  // QWERTY row 2
  [
    { id: 'en-a', primary: 'a', topRight: '@', alternates: ['@', 'à', 'á'] },
    { id: 'en-s', primary: 's', topRight: '#' },
    { id: 'en-d', primary: 'd', topRight: '$' },
    { id: 'en-f', primary: 'f', topRight: '_' },
    { id: 'en-g', primary: 'g', topRight: '&' },
    { id: 'en-h', primary: 'h', topRight: '-' },
    { id: 'en-j', primary: 'j', topRight: '+' },
    { id: 'en-k', primary: 'k', topRight: '(' },
    { id: 'en-l', primary: 'l', topRight: ')' },
  ],
  // QWERTY row 3
  [
    { id: 'en-shift', primary: '⇧', kind: 'shift', widthWeight: 1.35, label: 'Shift' },
    { id: 'en-z', primary: 'z', topRight: '*' },
    { id: 'en-x', primary: 'x', topRight: '"' },
    { id: 'en-c', primary: 'c', topRight: "'" },
    { id: 'en-v', primary: 'v', topRight: ':' },
    { id: 'en-b', primary: 'b', topRight: ';' },
    { id: 'en-n', primary: 'n', topRight: '!' },
    { id: 'en-m', primary: 'm', topRight: '?' },
    { id: 'en-back', primary: '⌫', kind: 'backspace', widthWeight: 1.35, label: 'Backspace' },
  ],
];

export const SYMBOL_ROWS: KeyDef[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => ({
    id: `sym-${n}`,
    primary: n,
  })),
  ['@', '#', '$', '_', '&', '-', '+', '(', ')', '/'].map((s, idx) => ({
    id: `sym-r2-${idx}`,
    primary: s,
  })),
  ['*', '"', "'", ':', ';', '!', '?', '،', '۔', '٪'].map((s, idx) => ({
    id: `sym-r3-${idx}`,
    primary: s,
  })),
  [
    { id: 'sym-eq', primary: '=' },
    { id: 'sym-lt', primary: '<' },
    { id: 'sym-gt', primary: '>' },
    { id: 'sym-lbr', primary: '[' },
    { id: 'sym-rbr', primary: ']' },
    { id: 'sym-lc', primary: '{' },
    { id: 'sym-rc', primary: '}' },
    { id: 'sym-tilde', primary: '~' },
    { id: 'sym-back', primary: '⌫', kind: 'backspace', widthWeight: 1.4, label: 'Backspace' },
  ],
];

export function getBottomRow(lang: KeyboardLanguage, isSymbols: boolean): KeyDef[] {
  const commaChar = lang === 'english' ? ',' : '،';
  const periodChar = lang === 'english' ? '.' : '۔';
  const spaceLabel = lang === 'saraiki' ? 'سرائیکی' : lang === 'urdu' ? 'اردو' : 'English';

  return [
    { id: 'bot-sym', primary: isSymbols ? 'ABC' : '?123', kind: 'symbols', widthWeight: 1.35, label: isSymbols ? 'Letters' : 'Symbols' },
    { id: 'bot-comma', primary: commaChar, kind: 'comma', widthWeight: 0.9, label: 'Comma' },
    { id: 'bot-globe', primary: '🌐', kind: 'globe', widthWeight: 0.95, label: 'Switch language' },
    { id: 'bot-emoji', primary: '☺', kind: 'emoji', widthWeight: 0.95, label: 'Emoji panel' },
    { id: 'bot-space', primary: spaceLabel, kind: 'space', widthWeight: 3.6, label: 'Space bar' },
    { id: 'bot-period', primary: periodChar, kind: 'period', widthWeight: 0.9, label: 'Full stop' },
    { id: 'bot-enter', primary: '↵', kind: 'enter', widthWeight: 1.35, label: 'Enter' },
  ];
}

export interface PredictionModel {
  unigrams: Record<KeyboardLanguage, string[]>;
  bigrams: Record<KeyboardLanguage, Record<string, string[]>>;
  starters: Record<KeyboardLanguage, string[]>;
  learned: Record<KeyboardLanguage, string[]>;
}

export const INITIAL_PREDICTION_MODEL: PredictionModel = {
  starters: {
    saraiki: ['اسلام', 'تساں', 'کیوں'],
    urdu: ['السلام', 'آپ', 'کیا'],
    english: ['Hello', 'The', 'Please'],
  },
  unigrams: {
    saraiki: [
      'اسلام', 'علیکم', 'کیوں', 'کیتے', 'تساں', 'اساں', 'ڳالھ', 'ڄاݨ', 'ٻال', 'ݙینھ',
      'ݨ', 'پاݨی', 'سوہݨا', 'ملتان', 'بہاولپور', 'سرائیکی', 'کیبورڈ', 'شکریہ', 'چنگا',
      'ول', 'آئے', 'تھیا', 'ہئی', 'ڳیا', 'ٻیٹھا', 'ݙیکھ', 'ڳن', 'آکھیا', 'میݙا', 'تیݙا',
    ],
    urdu: [
      'السلام', 'علیکم', 'آپ', 'کیسے', 'ہیں', 'شکریہ', 'اردو', 'سرائیکی', 'پاکستان',
      'بہت', 'اچھا', 'یہاں', 'وہاں', 'ہمارا', 'تمہارا', 'کتاب', 'لکھنا', 'زبان', 'وقت',
    ],
    english: [
      'SaraikiKey', 'keyboard', 'offline', 'prediction', 'voice', 'typing', 'translate',
      'dictionary', 'backup', 'restore', 'privacy', 'Gemini', 'Android', 'language', 'message',
    ],
  },
  bigrams: {
    saraiki: {
      'اسلام': ['علیکم', 'آباد'],
      'تساں': ['کیویں', 'کتھاں', 'سوہݨے'],
      'اساں': ['تساں', 'ڳالھ', 'ملتان'],
      'میݙا': ['ناں', 'شہر', 'دل'],
      'سوہݨا': ['ملتان', 'شہر', 'ݙینھ'],
      'چنگا': ['تھیا', 'کم', 'لڳے'],
    },
    urdu: {
      'السلام': ['علیکم'],
      'آپ': ['کیسے', 'کا', 'کی'],
      'کیسے': ['ہیں', 'ہو'],
      'بہت': ['شکریہ', 'اچھا', 'خوب'],
    },
    english: {
      'Hello': ['world', 'there', 'friend'],
      'Please': ['check', 'confirm', 'restore'],
      'offline': ['keyboard', 'prediction', 'dictionary'],
      'voice': ['typing', 'input', 'workflow'],
      'SaraikiKey': ['0.7.0', 'keyboard', 'backup'],
    },
  },
  learned: {
    saraiki: [],
    urdu: [],
    english: [],
  },
};

export function getPredictions(
  textBeforeCursor: string,
  lang: KeyboardLanguage,
  model: PredictionModel,
): Array<{ word: string; isLearned: boolean }> {
  const trimmedEnd = textBeforeCursor.replace(/\u200B/g, '');
  const endsWithSpace = /\s$/.test(trimmedEnd) || trimmedEnd.length === 0;
  const tokens = trimmedEnd.trim().split(/\s+/).filter(Boolean);

  const learnedSet = new Set(model.learned[lang]);
  const results: Array<{ word: string; isLearned: boolean }> = [];
  const pushUnique = (word: string) => {
    if (!word || results.some((r) => r.word === word)) return;
    results.push({ word, isLearned: learnedSet.has(word) });
  };

  if (endsWithSpace) {
    if (tokens.length === 0) {
      model.learned[lang].slice(0, 1).forEach(pushUnique);
      model.starters[lang].forEach(pushUnique);
    } else {
      const prev = tokens[tokens.length - 1];
      const nexts = model.bigrams[lang][prev] ?? [];
      nexts.forEach(pushUnique);
      model.learned[lang].forEach(pushUnique);
      model.unigrams[lang].forEach(pushUnique);
    }
    return results.slice(0, 3);
  }

  const currentPrefix = tokens[tokens.length - 1] ?? '';
  const lowerPrefix = currentPrefix.toLowerCase();

  // Learned words match first (learns after one use)
  for (const w of model.learned[lang]) {
    if (w.toLowerCase().startsWith(lowerPrefix) && w !== currentPrefix) {
      pushUnique(w);
    }
  }
  for (const w of model.unigrams[lang]) {
    if (w.toLowerCase().startsWith(lowerPrefix)) {
      pushUnique(w);
    }
  }
  // Fallback completions if fewer than 3 matches
  for (const w of model.unigrams[lang]) {
    if (results.length >= 3) break;
    pushUnique(w);
  }

  return results.slice(0, 3);
}

export function learnWordInModel(
  model: PredictionModel,
  lang: KeyboardLanguage,
  word: string,
): PredictionModel {
  const clean = word.trim().replace(/[.,،۔!?؟]/g, '');
  if (!clean || clean.length < 2) return model;
  if (model.unigrams[lang].includes(clean) || model.learned[lang].includes(clean)) {
    return model;
  }
  return {
    ...model,
    learned: {
      ...model.learned,
      [lang]: [clean, ...model.learned[lang]],
    },
  };
}

export function forgetWordInModel(
  model: PredictionModel,
  lang: KeyboardLanguage,
  word: string,
): PredictionModel {
  return {
    ...model,
    learned: {
      ...model.learned,
      [lang]: model.learned[lang].filter((w) => w !== word),
    },
  };
}
