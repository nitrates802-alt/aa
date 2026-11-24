export type AuditSeverity = 'error' | 'warning' | 'improvement';
export type AuditTarget = 'manifest' | 'readme' | 'both';

export interface AuditFinding {
  id: string;
  target: AuditTarget;
  severity: AuditSeverity;
  title: string;
  evidence: string;
  recommendation: string;
  optionKey: keyof RefinementOptions;
}

export interface RefinementOptions {
  fixNetworkClaimInReadme: boolean;
  fixVoiceTypingNotIncluded: boolean;
  alignSpacebarGestureDocs: boolean;
  addUnicodeTableToReadme: boolean;
  addPermissionsMatrixToReadme: boolean;
  addSupportsRtl: boolean;
  addDataExtractionRules: boolean;
  addOptionalMicrophoneFeature: boolean;
  hardenVoicePermissionActivity: boolean;
  addLocaleConfigAndSoftInput: boolean;
}

export const DEFAULT_REFINEMENT_OPTIONS: RefinementOptions = {
  fixNetworkClaimInReadme: true,
  fixVoiceTypingNotIncluded: true,
  alignSpacebarGestureDocs: true,
  addUnicodeTableToReadme: true,
  addPermissionsMatrixToReadme: true,
  addSupportsRtl: true,
  addDataExtractionRules: true,
  addOptionalMicrophoneFeature: true,
  hardenVoicePermissionActivity: true,
  addLocaleConfigAndSoftInput: true,
};

export interface DiffLine {
  type: 'unchanged' | 'removed' | 'added';
  lineNumberOld: number | null;
  lineNumberNew: number | null;
  text: string;
}

export function auditOriginalSpecs(manifest: string, readme: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  if (/no network permission/i.test(readme) && /android\.permission\.INTERNET/.test(manifest)) {
    findings.push({
      id: 'readme-network-contradiction',
      target: 'both',
      severity: 'error',
      title: 'Contradiction: README claims "no network permission" while Manifest declares INTERNET',
      evidence:
        'README line 3 states "no network permission", but AndroidManifest.xml declares android.permission.INTERNET for live Gemini translation and voice typing.',
      recommendation:
        'Clarify that core typing, prediction, and learning are 100% offline, and INTERNET is used solely when the user explicitly triggers Gemini translation/proofreading or speech recognition.',
      optionKey: 'fixNetworkClaimInReadme',
    });
  }

  if (/Not included[\s\S]*voice typing/i.test(readme) && /Voice typing:/i.test(readme)) {
    findings.push({
      id: 'readme-voice-contradiction',
      target: 'readme',
      severity: 'error',
      title: 'Contradiction: "Voice typing" listed under "Not included" despite 0.5–0.7.0 support',
      evidence:
        'README "Not included" still lists "voice typing", contradicting the 0.7.0 voice typing feature, RECORD_AUDIO permission, and VoicePermissionActivity.',
      recommendation:
        'Remove "voice typing" from "Not included" and clarify that on-device offline speech models (e.g. Whisper/Vosk) are not bundled; Android RecognitionService + Gemini voice workflow are used.',
      optionKey: 'fixVoiceTypingNotIncluded',
    });
  }

  if (!/android:supportsRtl="true"/.test(manifest)) {
    findings.push({
      id: 'manifest-missing-rtl',
      target: 'manifest',
      severity: 'error',
      title: 'Missing android:supportsRtl="true" for Saraiki and Urdu RTL layouts',
      evidence:
        '<application> does not declare android:supportsRtl="true", which prevents Android from mirroring Settings, toolbars, and IME dialogs in Urdu/Saraiki locales.',
      recommendation: 'Add android:supportsRtl="true" on <application>.',
      optionKey: 'addSupportsRtl',
    });
  }

  if (/android:fullBackupContent/.test(manifest) && !/android:dataExtractionRules/.test(manifest)) {
    findings.push({
      id: 'manifest-data-extraction-rules',
      target: 'manifest',
      severity: 'warning',
      title: 'Missing Android 12+ android:dataExtractionRules alongside fullBackupContent',
      evidence:
        'Manifest sets android:fullBackupContent="@xml/backup_rules" (ignored on API 31+ cloud backup/D2D transfer) without android:dataExtractionRules.',
      recommendation:
        'Add android:dataExtractionRules="@xml/data_extraction_rules" so learned dictionaries are backed up while encrypted API keys stay excluded on Android 12+.',
      optionKey: 'addDataExtractionRules',
    });
  }

  if (/RECORD_AUDIO/.test(manifest) && !/android\.hardware\.microphone/.test(manifest)) {
    findings.push({
      id: 'manifest-mic-hardware-optional',
      target: 'manifest',
      severity: 'warning',
      title: 'RECORD_AUDIO implies mandatory microphone hardware on Play/APK filters',
      evidence:
        'Manifest requests RECORD_AUDIO without <uses-feature android:name="android.hardware.microphone" android:required="false" />.',
      recommendation:
        'Declare android.hardware.microphone with android:required="false" so tablets and devices without mics can still install SaraikiKey.',
      optionKey: 'addOptionalMicrophoneFeature',
    });
  }

  if (/VoicePermissionActivity/.test(manifest) && !/noHistory="true"/.test(manifest)) {
    findings.push({
      id: 'manifest-voice-activity-task',
      target: 'manifest',
      severity: 'warning',
      title: 'VoicePermissionActivity should isolate its task stack and prevent back-stack linger',
      evidence:
        'Translucent permission prompt launched from an InputMethodService lacks android:noHistory="true" and android:taskAffinity="".',
      recommendation:
        'Add android:noHistory="true" and android:taskAffinity="" so the permission prompt never lingers in recents or hijacks the host app task.',
      optionKey: 'hardenVoicePermissionActivity',
    });
  }

  if (/space \(hold = language list, slide = cursor\)/i.test(readme) && /Space bar: slide = switch language/i.test(readme)) {
    findings.push({
      id: 'readme-spacebar-gesture-mismatch',
      target: 'readme',
      severity: 'warning',
      title: 'Ambiguous Space-bar gesture description between Layout and 0.6.0 notes',
      evidence:
        'Layout says "space (hold = language list, slide = cursor)" while 0.6.0 notes say "slide = switch language; hold then slide = move the cursor".',
      recommendation:
        'Unify the gesture specification in Layout so quick slide switches language, hold opens the language picker, and hold + slide scrubs the cursor.',
      optionKey: 'alignSpacebarGestureDocs',
    });
  }

  if (!/android:localeConfig/.test(manifest) || !/adjustResize/.test(manifest)) {
    findings.push({
      id: 'manifest-locale-and-softinput',
      target: 'manifest',
      severity: 'improvement',
      title: 'Add Android 13+ localeConfig and SettingsActivity adjustResize',
      evidence:
        'SettingsActivity lacks windowSoftInputMode="adjustResize" and <application> lacks android:localeConfig="@xml/locales_config".',
      recommendation:
        'Add android:windowSoftInputMode="adjustResize" to SettingsActivity and android:localeConfig="@xml/locales_config" to <application>.',
      optionKey: 'addLocaleConfigAndSoftInput',
    });
  }

  if (!/U\+0684/.test(readme)) {
    findings.push({
      id: 'readme-unicode-codepoints',
      target: 'readme',
      severity: 'improvement',
      title: 'Document exact Unicode code points for classical Saraiki letters',
      evidence:
        'README lists Saraiki characters visually (ڄ ڃ ڳ ڱ ݙ ٻ ݨ) without Unicode code points, making font/IME debugging harder.',
      recommendation:
        'Include an explicit Saraiki classical script & long-press Unicode reference table (including ژ on ز and @ on a).',
      optionKey: 'addUnicodeTableToReadme',
    });
  }

  if (!/Permissions/i.test(readme)) {
    findings.push({
      id: 'readme-permissions-matrix',
      target: 'readme',
      severity: 'improvement',
      title: 'Add an explicit Android Permissions & Privacy Matrix to README',
      evidence:
        'Users inspecting the README cannot quickly see why VIBRATE, RECORD_AUDIO, INTERNET, and <queries> exist.',
      recommendation:
        'Add a concise Permissions & Data Handling section matching AndroidManifest.xml.',
      optionKey: 'addPermissionsMatrixToReadme',
    });
  }

  return findings;
}

export function generateRefinedManifest(options: RefinementOptions): string {
  const micFeature = options.addOptionalMicrophoneFeature
    ? `\n    <!-- Voice typing is optional; do not exclude devices without a built-in microphone -->\n    <uses-feature\n        android:name="android.hardware.microphone"\n        android:required="false" />`
    : '';

  const appAttrs = [
    'android:allowBackup="true"',
    'android:fullBackupContent="@xml/backup_rules"',
    ...(options.addDataExtractionRules
      ? ['android:dataExtractionRules="@xml/data_extraction_rules"']
      : []),
    'android:icon="@mipmap/ic_launcher"',
    'android:label="@string/app_name"',
    ...(options.addLocaleConfigAndSoftInput
      ? ['android:localeConfig="@xml/locales_config"']
      : []),
    ...(options.addSupportsRtl ? ['android:supportsRtl="true"'] : []),
    'android:theme="@style/AppTheme"',
  ]
    .map((attr) => `        ${attr}`)
    .join('\n');

  const settingsSoftInput = options.addLocaleConfigAndSoftInput
    ? `\n            android:windowSoftInputMode="adjustResize"`
    : '';

  const voiceActivityExtra = options.hardenVoicePermissionActivity
    ? `\n            android:launchMode="singleTop"\n            android:noHistory="true"\n            android:taskAffinity=""`
    : '';

  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="pk.saraikipro.keyboard">

    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <!-- Strictly scoped to user-triggered Gemini translation/proofread and voice typing; never used for keystrokes -->
    <uses-permission android:name="android.permission.INTERNET" />${micFeature}

    <!-- Android 11+ package visibility for speech recognition and optional Gemini voice workflow -->
    <queries>
        <package android:name="com.google.android.apps.bard" />
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
    </queries>

    <application
${appAttrs}>

        <activity
            android:name=".SettingsActivity"
            android:exported="true"
            android:label="@string/app_name"${settingsSoftInput}>
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name=".VoicePermissionActivity"
            android:exported="false"
            android:excludeFromRecents="true"${voiceActivityExtra}
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
}

export function generateRefinedReadme(options: RefinementOptions): string {
  const introLine = options.fixNetworkClaimInReadme
    ? `Offline-first Android keyboard (\`InputMethodService\`) for **Saraiki**, **Urdu**, and **English**. Plain Java with zero third-party SDK dependencies: all typing, prediction, and n-gram learning run 100% locally on-device. Network access (\`INTERNET\`) is used solely when you explicitly tap Gemini translate/proofread or invoke speech recognition.`
    : `Offline Android keyboard for Saraiki, Urdu and English. Plain Java (\`InputMethodService\`), no third-party libraries, no network permission.`;

  const spaceDescription = options.alignSpacebarGestureDocs
    ? `Space bar (quick slide = switch language; hold = language list; hold then slide = move cursor)`
    : `space (hold = language list, slide = cursor)`;

  const unicodeSection = options.addUnicodeTableToReadme
    ? `\n### Classical Saraiki & Long-Press Reference\n| Base Key | Long-Press Alternates | Unicode Code Points |\n| :--- | :--- | :--- |\n| \`ج\` | \`ڄ\` (centred), \`ڃ\` (right) | \`U+0684\`, \`U+0683\` |\n| \`گ\` | \`ڳ\` (centred), \`ڱ\` (right) | \`U+06B3\`, \`U+06B1\` |\n| \`د\` | \`ݙ\` | \`U+0759\` |\n| \`ب\` | \`ٻ\` | \`U+067B\` |\n| \`ن\` | \`ݨ\` | \`U+0768\` |\n| \`ا\` | \`آ\`, \`أ\` | \`U+0622\`, \`U+0623\` |\n| \`ز\` | \`ژ\` | \`U+0698\` |\n| \`a\` | \`@\` | \`U+0040\` |\n`
    : '';

  const permissionsSection = options.addPermissionsMatrixToReadme
    ? `\n## Permissions & Privacy\n| Permission / Query | Purpose | Scope |\n| :--- | :--- | :--- |\n| \`VIBRATE\` | Key-tap haptic feedback | Local hardware only |\n| \`RECORD_AUDIO\` | Tap-to-dictate voice typing (optional; \`microphone\` feature not required) | Active only while mic is pulsing |\n| \`INTERNET\` | Gemini translate / proofread & speech recognition | User-triggered only; typed keystrokes are never transmitted |\n| \`<queries>\` | Discovers \`RecognitionService\` and Gemini app (\`com.google.android.apps.bard\`) | Android 11+ package visibility |\n`
    : '';

  const notIncluded = options.fixVoiceTypingNotIncluded
    ? `Autocorrect, glide (swipe) typing, bundled offline speech models (uses Android \`RecognitionService\` / Gemini voice workflow), floating mode, GIFs, and release-signed AAB.`
    : `Autocorrect, glide typing, voice typing, floating mode, GIFs, release-signed AAB.`;

  return `# SaraikiKey 0.7.0

${introLine}

## Layout & Input Behavior
- **English**: dedicated number row (\`1–0\`) + 3 QWERTY rows + bottom row.
- **Saraiki / Urdu**: 4 letter rows + bottom row (no dedicated number row; digits \`1–0\` sit at the top-right of row 1 via long-press).
- **Visual hierarchy**: signs and symbols sit top-right on each key; classical Saraiki letters appear below them in light blue.
- **Edge-aware long-press popups**: first alternate is centred above the key and the second sits to its right (\`ج → ڄ ڃ\`, \`گ → ڳ ڱ\`, \`د → ݙ\`, \`ب → ٻ\`, \`ن → ݨ\`, \`ا → آ أ\`, \`ز → ژ\`, \`a → @\`).
- **Unified tool strip**: tray toggle · prediction on/off · clipboard · Gemini translate/proofread · text-edit pad · settings · language chip. Typing swaps the strip for 3 predictions; long-press a suggestion to forget a learned word.
- **Bottom row**: \`?123\`, comma, globe, emoji, ${spaceDescription}, full stop, Enter.
${unicodeSection}
## What Is New in 0.7.0
- **Resilient learned data**: atomic writes, a rolling backup copy, damaged-file recovery, and versioned checksummed dictionary files (\`.txt\`). Back up / Restore supports **Merge** or **Replace** via the Android Storage Access Framework (including Google Drive) and offers automatic restore on an empty device.
- **Voice typing**: one-tap dictation with configurable silence timeout (1–3 s, default 2 s), system notification beeps muted during capture and restored afterward, and a pulsing mic indicator.
- **Gemini integration**: replaces Google Translate for on-demand English / Urdu / Saraiki translation and proofreading (sent only on tap, using your encrypted key or a proxy), plus a Gemini-app voice workflow.
- **Architecture docs**: \`docs/DICTIONARY_FORMAT.md\`, \`docs/BACKUP_AND_DATA.md\`, \`docs/GEMINI.md\`, \`docs/VOICE_RESEARCH.md\`.

### Previous Releases
- **0.6.0**: 3D blue icon (no text), unified key sizing across all three scripts, live translation window, first-run strip tour, hold-for-label tooltips, spacebar slide/hold gestures, pause-tolerant dictation, dictionary export/import.
- **0.5.0**: SwiftKey-style prediction engine (unigram, bigram, trigram, and sentence-starter model; single-use learning; whole-phrase suggestions; ~0.1 ms local cursor context tracking), multi-app clipboard capture, Urdu + English voice typing, edge-aware popups, fixed-height emoji window, redesigned settings.

## Dictionaries
- **Saraiki**: 12,427 words, 3,843 word pairs, 1,250 word triples, and 300 sentence starters built from \`dictionary.txt\`, the 11k candidates file, and Mozilla Common Voice Saraiki sentences (CC0) via \`tools/make_saraiki.py\`.
- **English**: wordfreq list (CC BY-SA 4.0) + 45,000 SymSpell word pairs (CC BY-SA 3.0).
- **Urdu**: wordfreq list (CC BY-SA 4.0).
- All personal learning and n-gram adaptation remains strictly on-device.
${permissionsSection}
## Not Included
${notIncluded}

## Build & Signing
> **Important:** Preserve \`debug.keystore\` from the repository/archive. Rebuilding with a different signing key causes Android to reject updates and requires an uninstall, which wipes learned user data.

\`\`\`bash
apt install openjdk-21-jdk-headless aapt apksigner zipalign dalvik-exchange libandroid-23-java
./build.sh        # -> out/saraiki-pro-debug.apk (debug-signed)
\`\`\`

## Licences
- **Noto Naskh Arabic**: SIL OFL 1.1
- **wordfreq**: CC BY-SA 4.0
- **SymSpell**: CC BY-SA 3.0
- **Mozilla Common Voice (Saraiki)**: CC0`;
}

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const m = oldLines.length;
  const n = newLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let oldNum = 1;
  let newNum = 1;

  while (i < m && j < n) {
    if (oldLines[i] === newLines[j]) {
      diff.push({
        type: 'unchanged',
        lineNumberOld: oldNum++,
        lineNumberNew: newNum++,
        text: oldLines[i],
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      diff.push({
        type: 'removed',
        lineNumberOld: oldNum++,
        lineNumberNew: null,
        text: oldLines[i],
      });
      i++;
    } else {
      diff.push({
        type: 'added',
        lineNumberOld: null,
        lineNumberNew: newNum++,
        text: newLines[j],
      });
      j++;
    }
  }

  while (i < m) {
    diff.push({
      type: 'removed',
      lineNumberOld: oldNum++,
      lineNumberNew: null,
      text: oldLines[i++],
    });
  }

  while (j < n) {
    diff.push({
      type: 'added',
      lineNumberOld: null,
      lineNumberNew: newNum++,
      text: newLines[j++],
    });
  }

  return diff;
}
