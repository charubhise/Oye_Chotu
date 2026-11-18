import React from 'react';
import { VoiceState } from '../types';
import { Volume2, Sparkles } from 'lucide-react';

interface ChotuMascotProps {
  state: VoiceState;
  message: string;
  onSpeakAgain?: () => void;
  isAudioMuted?: boolean;
}

export const ChotuMascot: React.FC<ChotuMascotProps> = ({
  state,
  message,
  onSpeakAgain,
  isAudioMuted = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-slate-900/95 via-indigo-950/60 to-slate-900/95 p-4 sm:p-5 rounded-2xl border border-orange-500/30 shadow-lg shadow-orange-500/5 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* SVG Mascot Graphic */}
      <div className="relative shrink-0 flex items-center justify-center">
        {/* State glow circle */}
        <div
          className={`absolute w-20 h-20 rounded-full transition-all duration-500 ${
            state === 'listening'
              ? 'bg-orange-500/30 scale-125 animate-ping'
              : state === 'processing'
              ? 'bg-purple-500/30 scale-110 animate-pulse'
              : state === 'speaking'
              ? 'bg-emerald-500/20 scale-110'
              : 'bg-transparent'
          }`}
        />

        {/* Chotu Robot SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md z-10 transition-transform hover:scale-105 duration-300"
        >
          {/* Antenna */}
          <line x1="50" y1="20" x2="50" y2="8" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="7" r="4.5" fill="#F97316">
            <animate
              attributeName="fill"
              values="#F97316;#C084FC;#F97316"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {state === 'listening' && (
            <circle
              cx="50"
              cy="7"
              r="8"
              fill="none"
              stroke="#F97316"
              strokeWidth="1.5"
              className="animate-ping"
            />
          )}

          {/* Ears / Headset */}
          <rect x="18" y="32" width="6" height="14" rx="3" fill="#A855F7" />
          <rect x="76" y="32" width="6" height="14" rx="3" fill="#A855F7" />

          {/* Head Base */}
          <rect
            x="22"
            y="20"
            width="56"
            height="38"
            rx="12"
            fill="#0F172A"
            stroke="#F97316"
            strokeWidth="2.5"
          />

          {/* Visor Screen */}
          <rect x="28" y="27" width="44" height="24" rx="7" fill="#020617" />

          {/* Eyes based on state */}
          {state === 'listening' ? (
            // Wide listening eyes
            <g fill="#F97316">
              <circle cx="39" cy="38" r="4.5" />
              <circle cx="61" cy="38" r="4.5" />
              {/* Soundwave bars in center */}
              <line x1="47" y1="36" x2="47" y2="40" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="37;34;37" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="y2" values="39;42;39" dur="0.5s" repeatCount="indefinite" />
              </line>
              <line x1="53" y1="35" x2="53" y2="41" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round">
                <animate attributeName="y1" values="35;32;35" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="y2" values="41;44;41" dur="0.4s" repeatCount="indefinite" />
              </line>
            </g>
          ) : state === 'processing' ? (
            // Thinking spinner eyes
            <g stroke="#C084FC" strokeWidth="2.5" fill="none">
              <circle cx="39" cy="38" r="4" strokeDasharray="6 3">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 39 38"
                  to="360 39 38"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="61" cy="38" r="4" strokeDasharray="6 3">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360 61 38"
                  to="0 61 38"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ) : (
            // Friendly normal curved happy eyes
            <g stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 35 39 Q 39 34 43 39" />
              <path d="M 57 39 Q 61 34 65 39" />
            </g>
          )}

          {/* Body */}
          <path
            d="M 32 60 L 68 60 L 72 84 L 28 84 Z"
            fill="#1E293B"
            stroke="#A855F7"
            strokeWidth="2"
          />

          {/* Chest Light Indicator */}
          <rect x="42" y="66" width="16" height="8" rx="2" fill="#020617" />
          <line x1="45" y1="70" x2="55" y2="70" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />

          {/* Little arms */}
          <rect x="22" y="64" width="7" height="12" rx="3.5" fill="#334155" />
          <rect x="71" y="64" width="7" height="12" rx="3.5" fill="#334155" />
        </svg>
      </div>

      {/* Speech Content */}
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded-full border border-orange-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-400" />
            Chotu Robot
          </span>

          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              state === 'listening'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                : state === 'processing'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse'
                : state === 'speaking'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {state === 'listening'
              ? '🎙️ Listening... (Sun raha hoon)'
              : state === 'processing'
              ? '⚡ Thinking... (Samajh raha hoon)'
              : state === 'speaking'
              ? '🗣️ Speaking...'
              : '🟢 Ready for voice'}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
          "{message}"
        </p>
      </div>

      {/* Voice Replay Button */}
      {onSpeakAgain && (
        <button
          onClick={onSpeakAgain}
          title="Repeat spoken reply"
          className="shrink-0 p-2 text-slate-400 hover:text-orange-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition border border-slate-700/60"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
