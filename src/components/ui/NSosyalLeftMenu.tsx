'use client';
import React from 'react';

interface NSosyalLeftMenuProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  mediaEnabled: boolean;
  onToggleMedia: () => void;
}

export const NSosyalLeftMenu: React.FC<NSosyalLeftMenuProps> = ({
  isDarkMode,
  onToggleDarkMode,
  mediaEnabled,
  onToggleMedia,
}) => {
  const menuItems = [
    { id: 'home', icon: '🏠', label: 'Ana Sayfa', active: true },
    { id: 'notif', icon: '🔔', label: 'Bildirimler', badge: '55' },
    { id: 'messages', icon: '💬', label: 'Mesajlar' },
    { id: 'explore', icon: '🔍', label: 'Keşfet' },
    { id: 'nod', icon: '🏠', label: 'Nod Oyna' },
    { id: 'communities', icon: '⭐️', label: 'Topluluklar' },
    { id: 'bookmarks', icon: '🔖', label: 'Kaydedilenler' },
    { id: 'likes', icon: '🚀', label: 'Beğeniler' },
    { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
  ];

  return (
    <aside className={`w-56 shrink-0 sticky top-0 h-screen overflow-y-auto p-4 flex flex-col justify-between border-r ${
      isDarkMode ? 'bg-[#0f1117] border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="space-y-4">
        {/* NSosyal Gradient Logo + Sentez Badge */}
        <div className="flex items-center gap-2 px-2 pt-1 pb-2">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                N
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                + Sentez
              </span>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase -mt-1 pl-0.5">
              BETA
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                item.active
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold shadow-md shadow-cyan-500/20'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Action Button */}
        <div className="pt-2">
          <button className="w-full py-3 px-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2">
            <span>🚀</span>
            <span>Yeni Gönderi</span>
          </button>
        </div>
      </div>

      {/* Toggles (Media & Dark Mode) */}
      <div className={`pt-4 border-t space-y-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        {/* Media Toggle */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">▷</span>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Medya</span>
          </div>
          <button
            onClick={onToggleMedia}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              mediaEnabled ? 'bg-cyan-500 justify-end' : isDarkMode ? 'bg-slate-700 justify-start' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">🌙</span>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Karanlık mod</span>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              isDarkMode ? 'bg-cyan-500 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
};
