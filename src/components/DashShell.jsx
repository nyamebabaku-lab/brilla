import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Logo } from './brand';
import { OfflineBadge } from './common';
import { Tabs } from './ui';
import { useDB } from '../data/store';
import { useTheme } from '../lib/hooks';

/** Grown-up dashboard frame: header, tabs and content. */
export default function DashShell({ title, subtitle, tabs, tab, setTab, actions, children }) {
  useTheme();
  const nav = useNavigate();
  const logout = useDB((s) => s.logout);
  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" aria-label="Home">
            <Logo size="text-2xl" />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <button onClick={() => (logout(), nav('/'))} className="btn-ghost px-3" aria-label="Log out">
              <LogOut size={18} /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">
        <div className="mb-4">
          <h1 className="on-bg text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="on-bg-muted">{subtitle}</p>}
        </div>
        {tabs && (
          <div className="mb-5">
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
          </div>
        )}
        <div className="animate-fade-in" key={tab}>
          {children}
        </div>
      </main>
      <OfflineBadge />
    </div>
  );
}
