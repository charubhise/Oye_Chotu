import React from 'react';
import { X, Volume2, Settings2, Sliders, Play } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  onSelectVoice: (voiceURI: string) => void;
  speechRate: number;
  onChangeRate: (rate: number) => void;
  speechPitch: number;
  onChangePitch: (pitch: number) => void;
  onTestVoice: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  availableVoices,
  selectedVoiceURI,
  onSelectVoice,
  speechRate,
  onChangeRate,
  speechPitch,
  onChangePitch,
  onTestVoice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-orange-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <Settings2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Chotu's Voice Personality Settings</h2>
              <p className="text-xs text-slate-400">Configure cute, friendly Indian voice tone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select TTS Voice
            </label>
            <select
              value={selectedVoiceURI}
              onChange={(e) => onSelectVoice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {availableVoices.length === 0 ? (
                <option value="">System Default Voice (Indian/Auto)</option>
              ) : (
                availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Indian English (en-IN) or Hindi (hi-IN) recommended for authentic personality.
            </p>
          </div>

          {/* Speech Pitch (Cute Tone) */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">Voice Pitch (Cute Robot Tone)</span>
              <span className="text-xs font-semibold text-orange-400">{speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={speechPitch}
              onChange={(e) => onChangePitch(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Deep (0.8x)</span>
              <span>Cute & Friendly (1.15x)</span>
              <span>High (1.5x)</span>
            </div>
          </div>

          {/* Speech Rate (Speaking Speed) */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">Speaking Rate</span>
              <span className="text-xs font-semibold text-orange-400">{speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={speechRate}
              onChange={(e) => onChangeRate(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Slow (0.8x)</span>
              <span>Natural (1.0x)</span>
              <span>Fast (1.3x)</span>
            </div>
          </div>

          {/* Test Voice Button */}
          <div className="pt-2">
            <button
              onClick={onTestVoice}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Test Voice Sample: "Haan ji! Main Chotu hoon!"
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
