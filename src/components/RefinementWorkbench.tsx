import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, RotateCcw, Search } from 'lucide-react';
import {
  AuditFinding,
  DiffLine,
  RefinementOptions,
  auditOriginalSpecs,
  computeLineDiff,
} from '../utils/refinementEngine';

type TargetFile = 'manifest' | 'readme';
type ViewMode = 'diff' | 'refined' | 'original';
type FilterScope = 'all' | 'manifest' | 'readme';

interface RefinementWorkbenchProps {
  originalManifest: string;
  originalReadme: string;
  refinedManifest: string;
  refinedReadme: string;
  options: RefinementOptions;
  onToggleOption: (key: keyof RefinementOptions) => void;
  onResetOptions: () => void;
  onEnableAllOptions: () => void;
  onDownloadFile: (filename: string, content: string) => void;
}

export const RefinementWorkbench: React.FC<RefinementWorkbenchProps> = ({
  originalManifest,
  originalReadme,
  refinedManifest,
  refinedReadme,
  options,
  onToggleOption,
  onResetOptions,
  onEnableAllOptions,
  onDownloadFile,
}) => {
  const [targetFile, setTargetFile] = useState<TargetFile>('manifest');
  const [viewMode, setViewMode] = useState<ViewMode>('diff');
  const [filterScope, setFilterScope] = useState<FilterScope>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedFile, setCopiedFile] = useState<TargetFile | null>(null);

  const initialFindings = useMemo(
    () => auditOriginalSpecs(originalManifest, originalReadme),
    [originalManifest, originalReadme],
  );

  const remainingFindings = useMemo(
    () => auditOriginalSpecs(refinedManifest, refinedReadme),
    [refinedManifest, refinedReadme],
  );

  const remainingIds = useMemo(
    () => new Set(remainingFindings.map((f) => f.id)),
    [remainingFindings],
  );

  const filteredFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialFindings.filter((item) => {
      if (filterScope === 'manifest' && item.target === 'readme') return false;
      if (filterScope === 'readme' && item.target === 'manifest') return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.evidence.toLowerCase().includes(q) ||
        item.recommendation.toLowerCase().includes(q)
      );
    });
  }, [initialFindings, filterScope, searchQuery]);

  const activeOriginal = targetFile === 'manifest' ? originalManifest : originalReadme;
  const activeRefined = targetFile === 'manifest' ? refinedManifest : refinedReadme;
  const activeFilename = targetFile === 'manifest' ? 'AndroidManifest.xml' : 'README.md';

  const diffLines: DiffLine[] = useMemo(
    () => computeLineDiff(activeOriginal, activeRefined),
    [activeOriginal, activeRefined],
  );

  const diffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const line of diffLines) {
      if (line.type === 'added') added++;
      if (line.type === 'removed') removed++;
    }
    return { added, removed };
  }, [diffLines]);

  const resolvedCount = initialFindings.length - remainingFindings.length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeRefined);
      setCopiedFile(targetFile);
      window.setTimeout(() => setCopiedFile(null), 1800);
    } catch {
      // Fallback copy via textarea if clipboard permission is unavailable
      const el = document.createElement('textarea');
      el.value = activeRefined;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedFile(targetFile);
      window.setTimeout(() => setCopiedFile(null), 1800);
    }
  };

  const severityLabel = (severity: AuditFinding['severity']) => {
    if (severity === 'error') return 'Contradiction / Missing Required';
    if (severity === 'warning') return 'Compatibility Warning';
    return 'Clarity & Documentation';
  };

  const severityTextColor = (severity: AuditFinding['severity']) => {
    if (severity === 'error') return 'text-rose-700';
    if (severity === 'warning') return 'text-amber-700';
    return 'text-sky-700';
  };

  return (
    <section aria-labelledby="workbench-heading" className="space-y-8">
      {/* Intro & Quantitative Summary */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-sky-700">
            pk.saraikipro.keyboard · SaraikiKey 0.7.0
          </p>
          <h1
            id="workbench-heading"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            style={{ textWrap: 'balance' }}
          >
            Manifest &amp; README Refinement Workbench
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Audits the attached AndroidManifest.xml and README.md for 0.7.0 contradictions, RTL and
            Android 12+ backup rules, hardware feature flags, and missing Saraiki Unicode references.
            Toggle individual rules below to inspect and export the refined files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm tabular-nums">
          <div>
            <div className="text-xs text-slate-500">Audit checks</div>
            <div className="text-lg font-semibold text-slate-900">{initialFindings.length}</div>
          </div>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">Resolved</div>
            <div className="text-lg font-semibold text-emerald-700">
              {resolvedCount} / {initialFindings.length}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
          <div>
            <div className="text-xs text-slate-500">Active file delta</div>
            <div className="font-mono text-sm font-semibold text-slate-900">
              <span className="text-emerald-700">+{diffStats.added}</span>
              <span className="mx-1.5 text-slate-400">/</span>
              <span className="text-rose-700">-{diffStats.removed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Rail: Refinement Rules */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Refinement Rules ({filteredFindings.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEnableAllOptions}
                className="rounded-md px-2.5 py-1.5 text-xs font-medium text-sky-700 transition-colors hover:bg-sky-50 whitespace-nowrap shrink-0"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={onResetOptions}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Defaults</span>
              </button>
            </div>
          </div>

          {/* Search & Scope Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="audit-search" className="sr-only">
                Filter refinement rules
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="audit-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search checks (e.g. RTL, voice, backup)..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
              />
            </div>

            <div
              role="group"
              aria-label="Filter by target file"
              className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 shrink-0"
            >
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'manifest', label: 'Manifest' },
                  { id: 'readme', label: 'README' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterScope(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filterScope === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {filteredFindings.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-slate-900">No matching refinement rules</p>
                <p className="mt-1 text-xs text-slate-500">
                  Clear the search box or switch the file filter to see all checks.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterScope('all');
                  }}
                  className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredFindings.map((finding) => {
                const enabled = options[finding.optionKey];
                const isStillUnresolved = remainingIds.has(finding.id);

                return (
                  <div key={finding.id} className="p-4 transition-colors hover:bg-slate-50/70">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => onToggleOption(finding.optionKey)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`font-semibold ${severityTextColor(finding.severity)}`}>
                            {severityLabel(finding.severity)}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-slate-500">
                            {finding.target === 'both'
                              ? 'Manifest & README'
                              : finding.target === 'manifest'
                                ? 'AndroidManifest.xml'
                                : 'README.md'}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span
                            className={
                              isStillUnresolved
                                ? 'font-medium text-rose-700'
                                : 'font-medium text-emerald-700'
                            }
                          >
                            {isStillUnresolved ? 'Active in output' : 'Applied'}
                          </span>
                        </div>
                        <p className="text-sm font-semibold leading-snug text-slate-900">
                          {finding.title}
                        </p>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {finding.recommendation}
                        </p>
                      </div>
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Workspace: Code / Diff Inspector */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* File Switcher */}
            <div
              role="group"
              aria-label="Target specification file"
              className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            >
              <button
                type="button"
                onClick={() => setTargetFile('manifest')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  targetFile === 'manifest'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AndroidManifest.xml
              </button>
              <button
                type="button"
                onClick={() => setTargetFile('readme')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  targetFile === 'readme'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                README.md
              </button>
            </div>

            {/* View Mode & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Code view mode"
                className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
              >
                {(
                  [
                    { id: 'diff', label: 'Unified Diff' },
                    { id: 'refined', label: 'Refined' },
                    { id: 'original', label: 'Original' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      viewMode === mode.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                {copiedFile === targetFile ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy Refined</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onDownloadFile(activeFilename, activeRefined)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save {activeFilename}</span>
              </button>
            </div>
          </div>

          {/* Code Viewport */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
              <span className="font-mono font-medium text-slate-800">{activeFilename}</span>
              <span className="tabular-nums">
                {viewMode === 'diff'
                  ? `${diffStats.added} additions · ${diffStats.removed} removals`
                  : viewMode === 'refined'
                    ? `${activeRefined.split('\n').length} lines · Refined 0.7.0`
                    : `${activeOriginal.split('\n').length} lines · Uploaded original`}
              </span>
            </div>

            <div className="max-h-[640px] overflow-auto font-mono text-xs leading-6">
              {viewMode === 'diff' ? (
                <table className="w-full border-collapse">
                  <tbody>
                    {diffLines.map((line, index) => {
                      const rowBg =
                        line.type === 'added'
                          ? 'bg-emerald-50/90 text-emerald-950'
                          : line.type === 'removed'
                            ? 'bg-rose-50/90 text-rose-950'
                            : 'bg-white text-slate-800';
                      const marker =
                        line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ';

                      return (
                        <tr key={index} className={rowBg}>
                          <td className="w-10 select-none border-r border-slate-100 px-2 text-right text-slate-400 tabular-nums">
                            {line.lineNumberOld ?? ''}
                          </td>
                          <td className="w-10 select-none border-r border-slate-100 px-2 text-right text-slate-400 tabular-nums">
                            {line.lineNumberNew ?? ''}
                          </td>
                          <td className="w-6 select-none text-center font-semibold">
                            {marker}
                          </td>
                          <td className="whitespace-pre-wrap break-words pr-4">{line.text || ' '}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <pre className="p-4 text-slate-800 whitespace-pre-wrap break-words">
                  {viewMode === 'refined' ? activeRefined : activeOriginal}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
