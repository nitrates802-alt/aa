import React from 'react';
import { Download } from 'lucide-react';

export type StudioTab = 'refinement' | 'simulator' | 'checklist';

interface TopBarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onDownloadBundle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onDownloadBundle,
}) => {
  const navItems: Array<{ id: StudioTab; label: string }> = [
    { id: 'refinement', label: 'Refinement Studio' },
    { id: 'simulator', label: 'Keyboard Simulator' },
    { id: 'checklist', label: 'Audit & Spec' },
  ];

  return (
    <header className="z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm md:sticky md:top-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:gap-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('refinement');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          SaraikiKey Studio
        </a>

        <nav
          aria-label="Primary sections"
          className="hidden items-center gap-6 text-sm font-medium md:flex"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative py-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                  active
                    ? 'font-semibold text-sky-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-sky-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onDownloadBundle}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-800 whitespace-nowrap shrink-0 sm:px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Export Refined Files</span>
        </button>
      </div>

      {/* Mobile navigation strip (visible below md so all 3 sections remain accessible on 390px) */}
      <nav
        aria-label="Mobile sections"
        className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2 text-xs font-medium md:hidden"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`rounded-md px-2.5 py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-sky-50 font-semibold text-sky-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
