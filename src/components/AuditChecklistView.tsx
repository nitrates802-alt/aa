import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SARAIKI_GLYPHS = [
  { base: 'ج', alternates: 'ڄ · ڃ', unicode: 'U+0684, U+0683', position: '1st centred, 2nd right' },
  { base: 'گ', alternates: 'ڳ · ڱ', unicode: 'U+06B3, U+06B1', position: '1st centred, 2nd right' },
  { base: 'د', alternates: 'ݙ', unicode: 'U+0759', position: 'Centred above key' },
  { base: 'ب', alternates: 'ٻ', unicode: 'U+067B', position: 'Centred above key' },
  { base: 'ن', alternates: 'ݨ', unicode: 'U+0768', position: 'Centred above key' },
  { base: 'ا', alternates: 'آ · أ', unicode: 'U+0622, U+0623', position: 'Edge-aware (آ first)' },
  { base: 'ز', alternates: 'ژ', unicode: 'U+0698', position: 'Centred above key' },
  { base: 'a', alternates: '@', unicode: 'U+0040', position: 'Edge-aware (@ first)' },
];

const PERMISSIONS_MATRIX = [
  {
    name: 'android.permission.VIBRATE',
    purpose: 'Optional key-tap haptic feedback',
    scope: 'Local device hardware only',
  },
  {
    name: 'android.permission.RECORD_AUDIO',
    purpose: 'One-tap voice dictation (1–3 s silence timeout)',
    scope: 'Active only while mic is pulsing; optional hardware feature',
  },
  {
    name: 'android.permission.INTERNET',
    purpose: 'Gemini translate/proofread & Android RecognitionService',
    scope: 'User-triggered only; typed keystrokes are never transmitted',
  },
  {
    name: '<queries> RecognitionService & Bard',
    purpose: 'Android 11+ visibility for speech recognition & Gemini voice workflow',
    scope: 'Intent & package query only',
  },
];

export const AuditChecklistView: React.FC = () => {
  return (
    <section aria-labelledby="audit-spec-heading" className="space-y-10">
      <div className="border-b border-slate-200 pb-6">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-medium text-sky-700">
            Release Engineering &amp; Script Specification · 0.7.0
          </p>
          <h1
            id="audit-spec-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Unicode, Permissions &amp; Build Safety Reference
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Consolidated technical tables aligned with the refined AndroidManifest.xml and README.md
            so developers and maintainers share a single, contradiction-free source of truth.
          </p>
        </div>
      </div>

      {/* Classical Saraiki Unicode Table */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          01. Classical Saraiki &amp; Long-Press Mapping
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Base Key</th>
                <th className="px-4 py-3">Long-Press Alternates</th>
                <th className="px-4 py-3">Unicode Code Points</th>
                <th className="px-4 py-3">Popup Placement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SARAIKI_GLYPHS.map((row) => (
                <tr key={row.base} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-arabic text-lg font-semibold text-slate-900">
                    {row.base}
                  </td>
                  <td className="px-4 py-3 font-arabic text-lg font-semibold text-sky-700">
                    {row.alternates}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 tabular-nums">
                    {row.unicode}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{row.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          02. Manifest Permissions &amp; Privacy Scope
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Declaration</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Data Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS_MATRIX.map((perm) => (
                <tr key={perm.name} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                    {perm.name}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{perm.purpose}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{perm.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Build & Data Safety Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-sky-700" aria-hidden="true" />
            <span>03. Learned Data &amp; Backup Architecture</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600">
            Version 0.7.0 protects user n-grams with atomic writes, rolling backup copies, damaged
            file recovery, and versioned checksummed .txt dictionaries. Adding{' '}
            <code className="font-mono text-slate-800">android:dataExtractionRules</code> ensures
            Android 12+ device transfers preserve learned words while keeping encrypted Gemini API
            keys excluded from unencrypted cloud backups.
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            04. Signing Key Preservation (debug.keystore)
          </h3>
          <p className="text-xs leading-relaxed text-slate-600">
            Keep the repository&apos;s <code className="font-mono text-slate-800">debug.keystore</code>{' '}
            across builds. Signing with a new keystore forces Android to reject in-place APK
            updates, requiring an uninstall that deletes local learned prediction data unless
            exported beforehand via Storage Access Framework.
          </p>
        </div>
      </div>
    </section>
  );
};
