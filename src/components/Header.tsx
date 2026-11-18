import React from 'react';
import { ShoppingBag, Volume2, VolumeX, Settings, Wallet, Bug, RefreshCw } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  budget: number;
  onOpenCart: () => void;
  isAudioMuted: boolean;
  onToggleMute: () => void;
  onResetCatalog: () => void;
  onOpenVoiceSettings: () => void;
  isDebugOpen: boolean;
  onToggleDebug: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  cartTotal,
  budget,
  onOpenCart,
  isAudioMuted,
  onToggleMute,
  onResetCatalog,
  onOpenVoiceSettings,
  isDebugOpen,
  onToggleDebug,
}) => {
  const remaining = budget - cartTotal;
  const isBudgetExceeded = remaining < 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div
          onClick={onResetCatalog}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <span className="text-2xl" role="img" aria-label="robot">🤖</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 bg-clip-text text-transparent">
                  Oye Chotu!
                </span>
              </h1>
              <span className="hidden md:inline-flex text-[10px] font-bold tracking-wide text-orange-400 bg-orange-950/80 border border-orange-500/40 px-2 py-0.5 rounded-full uppercase">
                Voice Shopping
              </span>
            </div>
            <p className="text-xs text-orange-200/90 font-semibold tracking-wide">
              “Bas Bolo, Chotu Sambhaal Lega!”
            </p>
          </div>
        </div>

        {/* Center: Language Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
          <span className="text-orange-400">🇮🇳</span>
          <span className="font-semibold text-slate-200">Multilingual:</span>
          <span>हिंदी</span>
          <span className="text-slate-600">•</span>
          <span>मराठी</span>
          <span className="text-slate-600">•</span>
          <span>Hinglish</span>
          <span className="text-slate-600">•</span>
          <span>English</span>
        </div>

        {/* Right Actions: Budget, Settings, Audio Mute, and Cart */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Debug Inspector Toggle */}
          <button
            onClick={onToggleDebug}
            title={isDebugOpen ? 'Hide Debug Inspector' : 'Show NLP Debug Inspector'}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              isDebugOpen
                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Bug className="w-4 h-4 text-purple-400" />
            <span className="hidden xl:inline">Debug</span>
          </button>

          {/* Voice Personality Settings */}
          <button
            onClick={onOpenVoiceSettings}
            title="Configure Chotu's Voice Personality"
            className="p-2 rounded-xl border bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-orange-400" />
          </button>

          {/* Voice Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            aria-label={isAudioMuted ? 'Unmute Chotu Voice' : 'Mute Chotu Voice'}
            title={isAudioMuted ? 'Voice output muted (click to unmute)' : 'Voice output active (click to mute)'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isAudioMuted
                ? 'bg-slate-900 text-slate-500 border-slate-800'
                : 'bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/50'
            }`}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>

          {/* Budget Widget */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-3 py-1.5 rounded-xl">
            <Wallet className="w-4 h-4 text-orange-400" />
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                Budget
              </div>
              <div className="text-xs font-bold text-slate-200 leading-tight">
                ₹{cartTotal.toLocaleString('en-IN')} / <span className="text-slate-400">₹{budget.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isBudgetExceeded
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isBudgetExceeded ? 'Exceeded' : `₹${remaining} left`}
            </span>
          </div>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            aria-label="Open Shopping Cart"
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-3 py-2 rounded-xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-xs font-bold">
              ₹{cartTotal.toLocaleString('en-IN')}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
