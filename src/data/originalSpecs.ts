export const ORIGINAL_ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="pk.saraikipro.keyboard">

    <uses-permission android:name="android.permission.VIBRATE" />

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <!-- Only used by the live-translation window and voice typing; never for typed text otherwise -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Android 11+: lets the keyboard see the speech-recognition service used for voice typing -->
    <queries>
        <package android:name="com.google.android.apps.bard" />
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
    </queries>

    <application
        android:allowBackup="true"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <activity
            android:name=".SettingsActivity"
            android:exported="true"
            android:label="@string/app_name">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name=".VoicePermissionActivity"
            android:exported="false"
            android:excludeFromRecents="true"
            android:theme="@android:style/Theme.Translucent.NoTitleBar" />

        <service
            android:name=".SaraikiImeService"
            android:exported="true"
            android:label="@string/app_name"
            android:permission="android.permission.BIND_INPUT_METHOD">
            <intent-filter>
                <action android:name="android.view.InputMethod" />
            </intent-filter>
            <meta-data
                android:name="android.view.im"
                android:resource="@xml/method" />
        </service>
    </application>
</manifest>`;

export const ORIGINAL_README = `# SaraikiKey 0.7.0

Offline Android keyboard for Saraiki, Urdu and English. Plain Java (\`InputMethodService\`), no third-party libraries, no network permission.

## Layout (sized from the reference Gboard screenshots)
- English: number row + three QWERTY rows + bottom row. Saraiki / Urdu: four letter rows + bottom row, no number row; digits 1–0 are the top-right signs of the first row (long-press).
- Signs and symbols sit top-right on each key; the classical Saraiki letters sit below them in light blue.
- Long-press: ج → ڄ ڃ, گ → ڳ ڱ, د → ݙ, ب → ٻ, ن → ݨ, ا → آ أ. First alternate centred above the key, second to its right.
- Tool strip, same in all three keyboards: tray toggle · prediction on/off · clipboard · translate · text-edit pad · settings · language chip. Typing swaps the strip for three suggestions; hold a suggestion to forget a learned word.
- Bottom row: ?123, comma, globe, emoji, space (hold = language list, slide = cursor), full stop, Enter.

## What is new in 0.7.0
- Your learned data is safer: atomic writes, a rolling backup copy, damaged-file recovery, versioned checksummed dictionary files (.txt), Back up / Restore with Merge or Replace through the Android file picker (choose Google Drive there), restore offer on an empty phone.
- Voice typing: one tap, finishes after a configurable silence (1-3 s, default 2), beeps muted while dictating and restored after, pulsing mic.
- Gemini replaces Google Translate: translate to English / Urdu / Saraiki and proofread, sent only when you tap; your own key (encrypted) or a proxy. Gemini-app voice workflow.
- Docs: docs/DICTIONARY_FORMAT.md, docs/BACKUP_AND_DATA.md, docs/GEMINI.md, docs/VOICE_RESEARCH.md.

## What was new in 0.6.0
- New 3D blue icon (no text). Larger keys and letters, same size in English, Urdu and Saraiki.
- Live translation window above the keyboard (English <-> Urdu, Google Translate). Strip tour on first run, hold any icon for its name.
- Space bar: slide = switch language; hold then slide = move the cursor.
- Voice typing keeps listening through pauses. Dictionary export / import (and Android backup of the learned data).

## What was new in 0.5.0
- Prediction engine rewritten (SwiftKey-style): word, word-pair, word-triple and sentence-start model; learns after one use; whole-phrase suggestions; text around the cursor is tracked locally so typing never waits on the app (about 0.1 ms per suggestion).
- Mic key (voice typing through Google speech recognition; Urdu and English together), clipboard capture from every app, fast space-bar language switch, edge-aware long-press popups (آ first on ا, @ first on a), ژ on ز, emoji window fixed to keyboard height, redesigned settings.

## Dictionaries
Saraiki: 12,427 words, 3,843 word pairs, 1,250 word triples and 300 sentence starters = your own lists (dictionary.txt and the 11k candidates file) + the Mozilla Common Voice Saraiki sentences (CC0), rebuilt with \`tools/make_saraiki.py\`. English also has 45,000 word pairs (SymSpell, CC BY-SA 3.0). English / Urdu: wordfreq lists (CC BY-SA 4.0). All learning stays on the phone.

## Not included
Autocorrect, glide typing, voice typing, floating mode, GIFs, release-signed AAB.

## Build
    apt install openjdk-21-jdk-headless aapt apksigner zipalign dalvik-exchange libandroid-23-java
    ./build.sh        # -> out/saraiki-pro-debug.apk (debug-signed)

## Licences
Noto Naskh Arabic: SIL OFL 1.1. IMPORTANT: keep \`debug.keystore\` (in the zip); a different signing key makes Android refuse updates and forces an uninstall, which deletes learned data. wordfreq data: CC BY-SA 4.0. Common Voice sentences: CC0.`;
