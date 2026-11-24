import { useMemo, useState } from 'react';
import { ORIGINAL_ANDROID_MANIFEST, ORIGINAL_README } from './data/originalSpecs';
import {
  DEFAULT_REFINEMENT_OPTIONS,
  RefinementOptions,
  generateRefinedManifest,
  generateRefinedReadme,
} from './utils/refinementEngine';
import { StudioTab, TopBar } from './components/TopBar';
import { RefinementWorkbench } from './components/RefinementWorkbench';
import { KeyboardSimulator } from './components/KeyboardSimulator';
import { AuditChecklistView } from './components/AuditChecklistView';

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('refinement');
  const [options, setOptions] = useState<RefinementOptions>(DEFAULT_REFINEMENT_OPTIONS);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const refinedManifest = useMemo(() => generateRefinedManifest(options), [options]);
  const refinedReadme = useMemo(() => generateRefinedReadme(options), [options]);

  const handleToggleOption = (key: keyof RefinementOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnableAll = () => {
    setOptions(DEFAULT_REFINEMENT_OPTIONS);
  };

  const handleResetDefaults = () => {
    setOptions({
      fixNetworkClaimInReadme: true,
      fixVoiceTypingNotIncluded: true,
      alignSpacebarGestureDocs: true,
      addUnicodeTableToReadme: false,
      addPermissionsMatrixToReadme: false,
      addSupportsRtl: true,
      addDataExtractionRules: true,
      addOptionalMicrophoneFeature: true,
      hardenVoicePermissionActivity: false,
      addLocaleConfigAndSoftInput: false,
    });
  };

  const handleDownloadBundle = () => {
    triggerDownload('AndroidManifest.xml', refinedManifest);
    window.setTimeout(() => {
      triggerDownload('README.md', refinedReadme);
    }, 150);
    setExportNotice('Exported refined AndroidManifest.xml and README.md.');
    window.setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onDownloadBundle={handleDownloadBundle}
      />

      {exportNotice && (
        <div
          role="status"
          className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-medium text-emerald-900"
        >
          {exportNotice}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {activeTab === 'refinement' && (
          <RefinementWorkbench
            originalManifest={ORIGINAL_ANDROID_MANIFEST}
            originalReadme={ORIGINAL_README}
            refinedManifest={refinedManifest}
            refinedReadme={refinedReadme}
            options={options}
            onToggleOption={handleToggleOption}
            onResetOptions={handleResetDefaults}
            onEnableAllOptions={handleEnableAll}
            onDownloadFile={triggerDownload}
          />
        )}

        {activeTab === 'simulator' && <KeyboardSimulator />}

        {activeTab === 'checklist' && <AuditChecklistView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6">
          <span>SaraikiKey 0.7.0 · pk.saraikipro.keyboard</span>
          <span>Noto Naskh Arabic (SIL OFL 1.1) · wordfreq (CC BY-SA 4.0) · Common Voice (CC0)</span>
        </div>
      </footer>
    </div>
  );
}
