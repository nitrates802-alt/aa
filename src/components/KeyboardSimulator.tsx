import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clipboard,
  CornerDownLeft,
  Delete,
  Eraser,
  Globe,
  Languages,
  LayoutGrid,
  Mic,
  MicOff,
  Settings,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  ENGLISH_ROWS,
  INITIAL_PREDICTION_MODEL,
  KeyboardLanguage,
  KeyDef,
  PredictionModel,
  SARAIKI_ROWS,
  SYMBOL_ROWS,
  URDU_ROWS,
  forgetWordInModel,
  getBottomRow,
  getPredictions,
  learnWordInModel,
} from '../utils/predictionEngine';

type ToolPanel = 'none' | 'translate' | 'clipboard' | 'editpad' | 'emoji' | 'settings' | 'langpicker';

const EMOJI_LIST = [
  '😊', '🙏', '❤️', '🌙', '✨', '🇵🇰', '🌾', '🎶', '📖', '👍', '🤝', '🌸',
  '☀️', '🌟', '💬', '📝', '🎉', '🌿', '☕', '🏠', '🌍', '🔒', '🎙️', '⚡',
];

const SAMPLE_PROMPTS: Array<{ lang: KeyboardLanguage; label: string; text: string }> = [
  { lang: 'saraiki', label: 'Saraiki greeting', text: 'اسلام علیکم! تساں کیویں ہو؟ ملتان دا موسم سوہݨا ہئی۔ ' },
  { lang: 'urdu', label: 'Urdu message', text: 'السلام علیکم، آپ کیسے ہیں؟ ' },
  { lang: 'english', label: 'English note', text: 'SaraikiKey 0.7.0 keeps learned data safe offline. ' },
];

export const KeyboardSimulator: React.FC = () => {
  const [language, setLanguage] = useState<KeyboardLanguage>('saraiki');
  const [text, setText] = useState<string>('اسلام علیکم! تساں کیویں ہو؟ ');
  const [cursorPos, setCursorPos] = useState<number>('اسلام علیکم! تساں کیویں ہو؟ '.length);
  const [isSymbols, setIsSymbols] = useState<boolean>(false);
  const [isShift, setIsShift] = useState<boolean>(false);
  const [predictionEnabled, setPredictionEnabled] = useState<boolean>(true);
  const [showToolStrip, setShowToolStrip] = useState<boolean>(true);
  const [activePanel, setActivePanel] = useState<ToolPanel>('none');
  const [model, setModel] = useState<PredictionModel>(INITIAL_PREDICTION_MODEL);
  const [clipboardHistory, setClipboardHistory] = useState<string[]>([
    'میݙا سوہݨا ملتان',
    'SaraikiKey 0.7.0 backup restored',
  ]);

  // Long-press / alternate popup state
  const [popupKey, setPopupKey] = useState<KeyDef | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  // Spacebar slide / hold-slide gesture state
  const spacePointerStartX = useRef<number | null>(null);
  const spaceHoldTimer = useRef<number | null>(null);
  const spaceIsCursorMode = useRef<boolean>(false);
  const [spaceGestureHint, setSpaceGestureHint] = useState<string | null>(null);

  // Voice typing state (1-3s configurable silence, default 2s)
  const [silenceTimeoutSec, setSilenceTimeoutSec] = useState<number>(2);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  // Gemini translate / proofread state
  const [geminiTargetLang, setGeminiTargetLang] = useState<'English' | 'Urdu' | 'Saraiki'>('English');
  const [geminiLoading, setGeminiLoading] = useState<boolean>(false);
  const [geminiOutput, setGeminiOutput] = useState<string>('');
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Settings
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const textBeforeCursor = text.slice(0, cursorPos);
  const isActivelyTypingWord = useMemo(() => {
    if (textBeforeCursor.length === 0) return false;
    return !/\s$/.test(textBeforeCursor);
  }, [textBeforeCursor]);

  const predictions = useMemo(
    () => (predictionEnabled ? getPredictions(textBeforeCursor, language, model) : []),
    [predictionEnabled, textBeforeCursor, language, model],
  );

  const rows: KeyDef[][] = useMemo(() => {
    if (isSymbols) return SYMBOL_ROWS;
    if (language === 'saraiki') return SARAIKI_ROWS;
    if (language === 'urdu') return URDU_ROWS;
    return ENGLISH_ROWS;
  }, [language, isSymbols]);

  const bottomRow = useMemo(() => getBottomRow(language, isSymbols), [language, isSymbols]);

  const isRtl = language !== 'english';

  const cycleLanguage = (direction: 1 | -1 = 1) => {
    const order: KeyboardLanguage[] = ['saraiki', 'urdu', 'english'];
    const idx = order.indexOf(language);
    const next = order[(idx + direction + order.length) % order.length];
    setLanguage(next);
    setIsSymbols(false);
    setPopupKey(null);
  };

  const insertAtCursor = (value: string) => {
    const before = text.slice(0, cursorPos);
    const after = text.slice(cursorPos);

    if (value === ' ' || value === '\n') {
      const lastWordMatch = before.match(/(\S+)$/);
      if (lastWordMatch) {
        setModel((prev) => learnWordInModel(prev, language, lastWordMatch[1]));
      }
      setShowToolStrip(true);
    } else {
      setShowToolStrip(false);
    }

    const inserted = language === 'english' && isShift && value.length === 1 ? value.toUpperCase() : value;
    const nextText = before + inserted + after;
    setText(nextText);
    setCursorPos(cursorPos + inserted.length);
    if (isShift && language === 'english') setIsShift(false);
  };

  const handleBackspace = () => {
    if (cursorPos <= 0) return;
    const before = text.slice(0, cursorPos - 1);
    const after = text.slice(cursorPos);
    setText(before + after);
    setCursorPos(cursorPos - 1);
  };

  const handlePredictionTap = (word: string) => {
    const before = text.slice(0, cursorPos);
    const after = text.slice(cursorPos);
    const endsWithSpace = before.length === 0 || /\s$/.test(before);
    const nextBefore = endsWithSpace
      ? `${before}${word} `
      : before.replace(/\S+$/, `${word} `);

    setText(nextBefore + after);
    setCursorPos(nextBefore.length);
    setModel((prev) => learnWordInModel(prev, language, word));
    setShowToolStrip(true);
  };

  const handleForgetSuggestion = (word: string) => {
    setModel((prev) => forgetWordInModel(prev, language, word));
  };

  const handleKeyPress = (key: KeyDef) => {
    setPopupKey(null);
    if (key.kind === 'backspace') {
      handleBackspace();
      return;
    }
    if (key.kind === 'shift') {
      setIsShift((s) => !s);
      return;
    }
    if (key.kind === 'symbols') {
      setIsSymbols((s) => !s);
      return;
    }
    if (key.kind === 'globe') {
      cycleLanguage(1);
      return;
    }
    if (key.kind === 'emoji') {
      setActivePanel((p) => (p === 'emoji' ? 'none' : 'emoji'));
      return;
    }
    if (key.kind === 'enter') {
      insertAtCursor('\n');
      return;
    }
    if (key.kind === 'space') {
      insertAtCursor(' ');
      return;
    }
    insertAtCursor(key.primary);
  };

  const startKeyLongPress = (key: KeyDef) => {
    if (!key.alternates || key.alternates.length === 0) return;
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setPopupKey(key);
    }, 350);
  };

  const cancelKeyLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Spacebar gestures per 0.6.0 / 0.7.0 spec:
  // quick slide = switch language; hold = language list; hold then slide = move cursor
  const handleSpacePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    spacePointerStartX.current = e.clientX;
    spaceIsCursorMode.current = false;
    spaceHoldTimer.current = window.setTimeout(() => {
      spaceIsCursorMode.current = true;
      setSpaceGestureHint('Cursor slide mode active');
    }, 360);
  };

  const handleSpacePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (spacePointerStartX.current === null) return;
    const dx = e.clientX - spacePointerStartX.current;
    if (spaceIsCursorMode.current && Math.abs(dx) >= 14) {
      const step = dx > 0 ? 1 : -1;
      setCursorPos((pos) => Math.max(0, Math.min(text.length, pos + step)));
      spacePointerStartX.current = e.clientX;
    }
  };

  const handleSpacePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (spaceHoldTimer.current !== null) {
      window.clearTimeout(spaceHoldTimer.current);
      spaceHoldTimer.current = null;
    }
    const startX = spacePointerStartX.current;
    spacePointerStartX.current = null;

    if (spaceIsCursorMode.current) {
      spaceIsCursorMode.current = false;
      setSpaceGestureHint(null);
      if (startX !== null && Math.abs(e.clientX - startX) < 10) {
        setActivePanel((p) => (p === 'langpicker' ? 'none' : 'langpicker'));
      }
      return;
    }

    if (startX !== null && Math.abs(e.clientX - startX) >= 36) {
      cycleLanguage(e.clientX - startX > 0 ? 1 : -1);
      return;
    }

    insertAtCursor(' ');
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
      setVoiceNote(null);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };

    const SpeechCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setIsListening(true);
      setVoiceNote(
        `Browser SpeechRecognition is unavailable in this environment; configured silence auto-stop (${silenceTimeoutSec}s) shown.`,
      );
      window.setTimeout(() => {
        setIsListening(false);
      }, silenceTimeoutSec * 1000);
      return;
    }

    const recognition = new SpeechCtor();
    recognition.lang = language === 'english' ? 'en-US' : 'ur-PK';
    recognition.interimResults = false;
    setIsListening(true);
    setVoiceNote(`Listening (${silenceTimeoutSec}s silence timeout)...`);

    const stopTimer = window.setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        setIsListening(false);
      }
    }, silenceTimeoutSec * 1000 + 2000);

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        insertAtCursor(`${transcript} `);
      }
    };
    recognition.onerror = () => {
      setVoiceNote('Microphone access was blocked or unavailable.');
      setIsListening(false);
      window.clearTimeout(stopTimer);
    };
    recognition.onend = () => {
      setIsListening(false);
      window.clearTimeout(stopTimer);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      window.clearTimeout(stopTimer);
    }
  };

  const handleGeminiAssist = async (mode: 'translate' | 'proofread') => {
    setGeminiError(null);
    setGeminiOutput('');
    if (!text.trim()) {
      setGeminiError('Type or load a sample message in the composer first.');
      return;
    }

    setGeminiLoading(true);
    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          mode,
          targetLanguage: geminiTargetLang,
        }),
      });
      const data = (await res.json()) as { output?: string; error?: string };
      if (!res.ok) {
        setGeminiError(data.error ?? 'Gemini request failed.');
      } else {
        setGeminiOutput(data.output ?? '');
      }
    } catch {
      setGeminiError('Unable to reach the /api/gemini/assist server route.');
    } finally {
      setGeminiLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      cancelKeyLongPress();
      if (spaceHoldTimer.current !== null) window.clearTimeout(spaceHoldTimer.current);
    };
  }, []);

  const showSuggestionsInBar = predictionEnabled && !showToolStrip;

  return (
    <section aria-labelledby="simulator-heading" className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-sky-700">
            Interactive 0.7.0 IME Preview · Noto Naskh Arabic
          </p>
          <h1
            id="simulator-heading"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Saraiki, Urdu &amp; English Keyboard Simulator
          </h1>
          <p className="text-sm text-slate-600">
            Test the 4-row Saraiki/Urdu layout with light-blue classical Saraiki glyphs, top-right
            digits, long-press popups, single-use word learning, and Gemini translation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 lg:flex-nowrap">
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setLanguage(sample.lang);
                setText(sample.text);
                setCursorPos(sample.text.length);
                setIsSymbols(false);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Left Column: Composer & Learned Dictionary Inspector */}
        <div className="flex flex-col justify-between gap-6 lg:col-span-5">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="ime-composer" className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                Active Input Field
              </label>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                <span className="whitespace-nowrap">{isRtl ? 'RTL' : 'LTR'}</span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">Cursor {cursorPos}</span>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => {
                    if (text.trim()) {
                      setClipboardHistory((prev) => [text.trim(), ...prev.slice(0, 5)]);
                    }
                  }}
                  className="font-medium text-sky-700 hover:text-sky-800 whitespace-nowrap"
                >
                  Copy to IME Clipboard
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              id="ime-composer"
              dir={isRtl ? 'rtl' : 'ltr'}
              rows={5}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setCursorPos(e.target.selectionStart ?? e.target.value.length);
              }}
              onClick={(e) => {
                setCursorPos(e.currentTarget.selectionStart ?? text.length);
              }}
              onKeyUp={(e) => {
                setCursorPos(e.currentTarget.selectionStart ?? text.length);
              }}
              placeholder={
                isRtl
                  ? 'یہاں سرائیکی یا اردو لکھیں...'
                  : 'Type in English or tap keys on the simulator...'
              }
              className={`w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:bg-white focus:outline-none ${
                isRtl ? 'font-arabic text-xl' : 'text-base'
              }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Tip: Long-press or right-click keys with light-blue glyphs to open Saraiki
                alternates.
              </span>
              <button
                type="button"
                onClick={() => {
                  setText('');
                  setCursorPos(0);
                }}
                className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-rose-700"
              >
                <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Learned Words & Prediction Model Card */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Learned Words ({language.toUpperCase()})
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {model.learned[language].length} learned · Learns after 1 space
              </span>
            </div>

            {model.learned[language].length === 0 ? (
              <p className="text-xs leading-relaxed text-slate-500">
                No custom words learned in {language} yet. Type a new word followed by Space or
                Enter and it will appear here and rank first in suggestions.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {model.learned[language].map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => handleForgetSuggestion(word)}
                    title={`Forget "${word}"`}
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 ${
                      isRtl ? 'font-arabic text-sm' : ''
                    }`}
                  >
                    <span>{word}</span>
                    <Trash2 className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SaraikiKey 0.7.0 Device Keyboard Shell */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm">
            {/* Gemini Live Translation / Proofread Window (above keyboard per 0.6.0/0.7.0) */}
            {activePanel === 'translate' && (
              <div className="border-b border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                    <Sparkles className="h-4 w-4 text-sky-700" aria-hidden="true" />
                    <span>Gemini Translate &amp; Proofread (Sent only on tap)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="gemini-target" className="text-xs text-slate-500">
                      Target:
                    </label>
                    <select
                      id="gemini-target"
                      value={geminiTargetLang}
                      onChange={(e) =>
                        setGeminiTargetLang(e.target.value as 'English' | 'Urdu' | 'Saraiki')
                      }
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800"
                    >
                      <option value="English">English</option>
                      <option value="Urdu">Urdu</option>
                      <option value="Saraiki">Saraiki</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={geminiLoading}
                    onClick={() => handleGeminiAssist('translate')}
                    className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
                  >
                    {geminiLoading ? 'Running Gemini...' : `Translate to ${geminiTargetLang}`}
                  </button>
                  <button
                    type="button"
                    disabled={geminiLoading}
                    onClick={() => handleGeminiAssist('proofread')}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Proofread Text
                  </button>
                </div>

                {geminiError && (
                  <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                    {geminiError}
                  </p>
                )}

                {geminiOutput && (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p
                      dir={geminiTargetLang === 'English' ? 'ltr' : 'rtl'}
                      className={`text-sm text-slate-900 ${
                        geminiTargetLang === 'English' ? '' : 'font-arabic text-base'
                      }`}
                    >
                      {geminiOutput}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setText(geminiOutput);
                        setCursorPos(geminiOutput.length);
                      }}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                    >
                      Replace Composer Text
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Voice Status Banner */}
            {(isListening || voiceNote) && (
              <div className="flex items-center justify-between gap-3 border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-900">
                <div className="flex items-center gap-2">
                  <Mic
                    className={`h-3.5 w-3.5 text-sky-700 ${isListening ? 'animate-pulse' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{voiceNote ?? `Dictating (${silenceTimeoutSec}s silence timeout)`}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsListening(false);
                    setVoiceNote(null);
                  }}
                  className="font-semibold text-sky-800 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Unified Tool Strip OR 3-Suggestion Bar */}
            <div className="border-b border-slate-200 bg-slate-50 px-2 py-2">
              {showSuggestionsInBar ? (
                <div className="grid grid-cols-12 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Show tool strip"
                    onClick={() => setShowToolStrip(true)}
                    className="col-span-1 flex min-h-[40px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200"
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="col-span-10 grid grid-cols-3 divide-x divide-slate-200">
                    {predictions.map((item) => (
                      <div key={item.word} className="flex items-center justify-center px-1">
                        <button
                          type="button"
                          onClick={() => handlePredictionTap(item.word)}
                          onContextMenu={(e) => {
                            if (item.isLearned) {
                              e.preventDefault();
                              handleForgetSuggestion(item.word);
                            }
                          }}
                          className={`w-full truncate rounded-md py-2 text-center text-sm font-medium transition-colors hover:bg-slate-200 ${
                            isRtl ? 'font-arabic text-base' : ''
                          } ${item.isLearned ? 'text-sky-700' : 'text-slate-900'}`}
                        >
                          {item.word}
                        </button>
                        {item.isLearned && (
                          <button
                            type="button"
                            aria-label={`Forget learned word ${item.word}`}
                            onClick={() => handleForgetSuggestion(item.word)}
                            className="ml-0.5 rounded p-1 text-slate-400 hover:text-rose-700"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Voice typing"
                    onClick={handleVoiceToggle}
                    className={`col-span-1 flex min-h-[40px] items-center justify-center rounded-lg transition-colors ${
                      isListening
                        ? 'bg-sky-700 text-white'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Mic className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              ) : (
                <div
                  role="toolbar"
                  aria-label="SaraikiKey tool strip"
                  className="flex items-center justify-between gap-1 overflow-x-auto"
                >
                  <button
                    type="button"
                    aria-label="Toggle tool tray"
                    onClick={() => setShowToolStrip((s) => !s)}
                    className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-700 hover:bg-slate-200"
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={predictionEnabled ? 'Disable prediction' : 'Enable prediction'}
                    onClick={() => setPredictionEnabled((p) => !p)}
                    className={`flex min-h-[40px] items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      predictionEnabled
                        ? 'bg-sky-100 text-sky-800'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Predict</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Clipboard"
                    onClick={() =>
                      setActivePanel((p) => (p === 'clipboard' ? 'none' : 'clipboard'))
                    }
                    className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg ${
                      activePanel === 'clipboard'
                        ? 'bg-sky-100 text-sky-800'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Clipboard className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Gemini translate and proofread"
                    onClick={() =>
                      setActivePanel((p) => (p === 'translate' ? 'none' : 'translate'))
                    }
                    className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg ${
                      activePanel === 'translate'
                        ? 'bg-sky-100 text-sky-800'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Languages className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Text edit pad"
                    onClick={() => setActivePanel((p) => (p === 'editpad' ? 'none' : 'editpad'))}
                    className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg ${
                      activePanel === 'editpad'
                        ? 'bg-sky-100 text-sky-800'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Keyboard settings"
                    onClick={() => setActivePanel((p) => (p === 'settings' ? 'none' : 'settings'))}
                    className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg ${
                      activePanel === 'settings'
                        ? 'bg-sky-100 text-sky-800'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Voice typing"
                    onClick={handleVoiceToggle}
                    className={`flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg ${
                      isListening
                        ? 'bg-sky-700 text-white'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Switch keyboard language"
                    onClick={() => cycleLanguage(1)}
                    className="min-h-[36px] rounded-lg bg-slate-200 px-2.5 text-xs font-bold text-slate-800 hover:bg-slate-300 whitespace-nowrap shrink-0"
                  >
                    {language === 'saraiki' ? 'SKR' : language === 'urdu' ? 'UR' : 'EN'}
                  </button>
                </div>
              )}
            </div>

            {/* Sub-panels (Clipboard, Text-Edit Pad, Emoji, Settings, Language List) OR Main Key Rows */}
            {activePanel === 'clipboard' ? (
              <div className="h-[296px] overflow-y-auto p-4 space-y-3 bg-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">Clipboard History</h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Back to Keys
                  </button>
                </div>
                {clipboardHistory.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-500">
                    Clipboard is empty. Use &ldquo;Copy to IME Clipboard&rdquo; above to capture an item.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clipboardHistory.map((clip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          insertAtCursor(clip);
                          setActivePanel('none');
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-800 hover:border-sky-400"
                      >
                        {clip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : activePanel === 'editpad' ? (
              <div className="h-[296px] p-4 flex flex-col justify-between bg-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">Text-Edit Pad</h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Back to Keys
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto w-full">
                  <button
                    type="button"
                    onClick={() => setCursorPos((p) => Math.max(0, p - 1))}
                    className="flex h-12 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCursorPos(0)}
                    className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={() => setCursorPos((p) => Math.min(text.length, p + 1))}
                    className="flex h-12 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <span>Right</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCursorPos(text.length)}
                    className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    End
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (text.trim()) setClipboardHistory((prev) => [text.trim(), ...prev]);
                    }}
                    className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Copy All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setText('');
                      setCursorPos(0);
                    }}
                    className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    Clear All
                  </button>
                </div>
                <p className="text-center text-xs text-slate-500 tabular-nums">
                  Cursor position: {cursorPos} / {text.length} characters
                </p>
              </div>
            ) : activePanel === 'emoji' ? (
              <div className="h-[296px] p-4 flex flex-col justify-between bg-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">Emoji Window</h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Back to Keys
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {EMOJI_LIST.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => insertAtCursor(em)}
                      className="flex h-11 items-center justify-center rounded-xl bg-white text-xl shadow-2xs hover:bg-sky-50"
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800"
                  >
                    <Delete className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Backspace</span>
                  </button>
                </div>
              </div>
            ) : activePanel === 'settings' ? (
              <div className="h-[296px] overflow-y-auto p-4 space-y-4 bg-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">
                    SaraikiKey 0.7.0 Quick Settings
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Done
                  </button>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor="silence-slider" className="font-medium text-slate-800">
                      Voice typing silence timeout: {silenceTimeoutSec} s
                    </label>
                    <input
                      id="silence-slider"
                      type="range"
                      min={1}
                      max={3}
                      step={1}
                      value={silenceTimeoutSec}
                      onChange={(e) => setSilenceTimeoutSec(Number(e.target.value))}
                      className="w-28 accent-sky-700"
                    />
                  </div>
                  <label className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-800">
                      Haptic feedback (VIBRATE permission)
                    </span>
                    <input
                      type="checkbox"
                      checked={hapticEnabled}
                      onChange={(e) => setHapticEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                  </label>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-slate-600">
                      Learned entries across languages:{' '}
                      {model.learned.saraiki.length +
                        model.learned.urdu.length +
                        model.learned.english.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModel(INITIAL_PREDICTION_MODEL)}
                      className="font-semibold text-rose-700 hover:underline"
                    >
                      Reset Learned Data
                    </button>
                  </div>
                </div>
              </div>
            ) : activePanel === 'langpicker' ? (
              <div className="h-[296px] p-4 space-y-3 bg-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700">Select Keyboard Language</h3>
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2">
                  {(
                    [
                      { id: 'saraiki', title: 'Saraiki (سرائیکی)', sub: '4 letter rows · Classical glyphs ڄ ڃ ڳ ڱ ݙ ٻ ݨ' },
                      { id: 'urdu', title: 'Urdu (اردو)', sub: '4 letter rows · Standard Urdu alternates' },
                      { id: 'english', title: 'English', sub: 'Number row + 3 QWERTY rows' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setLanguage(opt.id);
                        setIsSymbols(false);
                        setActivePanel('none');
                      }}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        language === opt.id
                          ? 'border-sky-600 bg-sky-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{opt.title}</div>
                      <div className="text-xs text-slate-500">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Main 4-row + bottom row keyboard grid */
              <div className="relative select-none space-y-1.5 p-2 sm:p-3">
                {spaceGestureHint && (
                  <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center">
                    <span className="rounded-lg bg-slate-900/90 px-3 py-1 text-xs font-medium text-white">
                      {spaceGestureHint}
                    </span>
                  </div>
                )}

                {rows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex items-stretch justify-center gap-1 sm:gap-1.5">
                    {row.map((key) => {
                      const hasAlternates = Boolean(key.alternates && key.alternates.length > 0);
                      const isPopupOpen = popupKey?.id === key.id;
                      const displayPrimary =
                        language === 'english' && isShift && key.kind !== 'shift' && key.kind !== 'backspace'
                          ? key.primary.toUpperCase()
                          : key.primary;

                      const isActionKey = key.kind === 'backspace' || key.kind === 'shift';

                      return (
                        <div
                          key={key.id}
                          style={{ flex: key.widthWeight ?? 1 }}
                          className="relative"
                        >
                          {/* Edge-aware Long-Press Popup: 1st alternate centred, 2nd+ to its right */}
                          {isPopupOpen && key.alternates && (
                            <div
                              role="menu"
                              aria-label={`Alternates for ${key.primary}`}
                              className="absolute bottom-full left-1/2 z-30 mb-1.5 flex -translate-x-1/3 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                            >
                              {key.alternates.map((alt, idx) => (
                                <button
                                  key={alt}
                                  type="button"
                                  onClick={() => insertAtCursor(alt)}
                                  className={`flex h-10 min-w-[38px] items-center justify-center rounded-lg px-2 text-lg font-semibold transition-colors ${
                                    idx === 0
                                      ? 'bg-sky-700 text-white hover:bg-sky-800'
                                      : 'bg-slate-100 text-slate-900 hover:bg-sky-100'
                                  } ${isRtl ? 'font-arabic' : ''}`}
                                >
                                  {alt}
                                </button>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            aria-label={key.label ?? `Key ${key.primary}`}
                            onPointerDown={() => startKeyLongPress(key)}
                            onPointerUp={cancelKeyLongPress}
                            onPointerLeave={cancelKeyLongPress}
                            onContextMenu={(e) => {
                              if (hasAlternates) {
                                e.preventDefault();
                                setPopupKey((curr) => (curr?.id === key.id ? null : key));
                              }
                            }}
                            onClick={() => {
                              if (longPressTriggeredRef.current) {
                                longPressTriggeredRef.current = false;
                                return;
                              }
                              handleKeyPress(key);
                            }}
                            className={`relative flex h-12 w-full flex-col items-center justify-center rounded-xl border transition-transform active:scale-[0.96] sm:h-13 ${
                              isActionKey
                                ? key.kind === 'shift' && isShift
                                  ? 'border-sky-600 bg-sky-700 text-white'
                                  : 'border-slate-300 bg-slate-200 text-slate-800 hover:bg-slate-300'
                                : 'border-slate-200 bg-white text-slate-900 shadow-2xs hover:bg-slate-50'
                            }`}
                          >
                            {/* Top-right sign or digit */}
                            {key.topRight && (
                              <span className="pointer-events-none absolute right-1.5 top-1 text-[10px] leading-none text-slate-400">
                                {key.topRight}
                              </span>
                            )}

                            {/* Classical Saraiki sub-label in light blue */}
                            {key.saraikiSub && (
                              <span className="font-arabic pointer-events-none absolute right-1.5 bottom-0.5 text-[10px] font-semibold leading-none text-sky-500">
                                {key.saraikiSub}
                              </span>
                            )}

                            {/* Primary Glyph */}
                            {key.kind === 'backspace' ? (
                              <Delete className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <span
                                className={
                                  isRtl
                                    ? 'font-arabic text-xl font-semibold leading-none'
                                    : 'text-base font-medium leading-none'
                                }
                              >
                                {displayPrimary}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Bottom Row */}
                <div className="flex items-stretch justify-center gap-1 pt-0.5 sm:gap-1.5">
                  {bottomRow.map((key) => {
                    if (key.kind === 'space') {
                      return (
                        <button
                          key={key.id}
                          type="button"
                          aria-label="Space bar (slide to switch language, hold to move cursor)"
                          style={{ flex: key.widthWeight }}
                          onPointerDown={handleSpacePointerDown}
                          onPointerMove={handleSpacePointerMove}
                          onPointerUp={handleSpacePointerUp}
                          className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 active:bg-slate-100 sm:h-13"
                        >
                          <span className={isRtl ? 'font-arabic text-sm' : ''}>{key.primary}</span>
                        </button>
                      );
                    }

                    const isEnter = key.kind === 'enter';
                    const isUtility = key.kind === 'symbols' || key.kind === 'globe' || key.kind === 'emoji';

                    return (
                      <button
                        key={key.id}
                        type="button"
                        aria-label={key.label ?? key.primary}
                        style={{ flex: key.widthWeight }}
                        onClick={() => handleKeyPress(key)}
                        className={`flex h-12 items-center justify-center rounded-xl border transition-transform active:scale-[0.96] sm:h-13 ${
                          isEnter
                            ? 'border-sky-700 bg-sky-700 text-white hover:bg-sky-800'
                            : isUtility
                              ? 'border-slate-300 bg-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-300'
                              : 'border-slate-200 bg-white text-base font-semibold text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {key.kind === 'globe' ? (
                          <Globe className="h-4 w-4" aria-hidden="true" />
                        ) : key.kind === 'emoji' ? (
                          <Smile className="h-4 w-4" aria-hidden="true" />
                        ) : key.kind === 'enter' ? (
                          <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <span>{key.primary}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
