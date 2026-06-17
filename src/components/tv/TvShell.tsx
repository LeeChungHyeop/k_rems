import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Maximize2, Minimize2, ArrowLeft, ExternalLink } from 'lucide-react';

const tabs = [
  { path: '/tv/main', label: 'TV-통합 대시보드' },
  { path: '/tv/general', label: 'TV-1 종합 발전정보' },
  { path: '/tv/own', label: 'TV-2 자체/SPC 정보' },
  { path: '/tv/output', label: 'TV-3 출력 현황 정보' },
];

function formatNow(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dow = ['일','월','화','수','목','금','토'][d.getDay()];
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} (${dow}) ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function TvShell({ title, children }: { title: string; children: React.ReactNode }) {
  const [now, setNow] = useState(new Date());
  const [compact, setCompact] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const toggleCompact = () => {
    setCompact(c => !c);
    const el = document.documentElement as any;
    const doc = document as any;
    try {
      if (!compact) {
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (typeof req === 'function') req.call(el);
      } else if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
      }
    } catch (e) { /* noop */ }
  };

  const openInNewWindow = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-screen w-screen flex flex-col text-white" style={{ background: 'var(--gradient-tv)' }}>
      <header className="h-14 flex items-center px-5 border-b border-white/10 shrink-0 bg-[hsl(212_80%_6%)]">
        {compact ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-wide text-white">
                K-REMS <span className="text-white/70 font-medium">신재생통합관리시스템</span>
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm tabular-nums text-white/90">{formatNow(now)}</span>
              <button onClick={openInNewWindow} title="새창보기" className="text-white/70 hover:text-white">
                <ExternalLink className="h-4 w-4" />
              </button>
              <button onClick={toggleCompact} title="축소" className="text-white/70 hover:text-white">
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/')} className="text-white/70 hover:text-white mr-4 inline-flex items-center gap-1 text-xs">
              <ArrowLeft className="h-4 w-4" /> 운영자 화면
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/60">KHNP · 신재생통합관리시스템</span>
            </div>
            <div className="flex-1 flex justify-center gap-2">
              {tabs.map(t => (
                <button key={t.path} onClick={() => navigate(t.path)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${pathname === t.path ? 'bg-[hsl(197_100%_44%)] text-white font-semibold' : 'text-white/60 hover:bg-white/5'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-white/90">{formatNow(now)}</span>
              <button onClick={openInNewWindow} title="새창보기" className="text-white/70 hover:text-white">
                <ExternalLink className="h-4 w-4" />
              </button>
              <button onClick={toggleCompact} title="확대" className="text-white/70 hover:text-white">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </header>
      <div className="flex-1 min-h-0 overflow-hidden p-4">
        {!compact && (
          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold tracking-wide" style={{ textShadow: '0 0 20px hsl(197 100% 44% / 0.4)' }}>{title}</h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function TvPanel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm flex flex-col ${className}`}>
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(197_100%_50%)] animate-pulse-soft" />
        <h3 className="text-sm font-semibold text-white/95">{title}</h3>
      </div>
      <div className="flex-1 min-h-0 p-3">{children}</div>
    </div>
  );
}
