import React, { useState, useEffect, useRef } from 'react';
import { VoiceState } from '../types';
import { Mic, MicOff, Square, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface VoiceDockProps {
  voiceState: VoiceState;
  onVoiceCommand: (transcript: string, audioBase64?: string, mimeType?: string) => Promise<void>;
  lastTranscript?: string;
  errorMessage?: string;
}

export const VoiceDock: React.FC<VoiceDockProps> = ({
  voiceState,
  onVoiceCommand,
  lastTranscript,
  errorMessage,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [fallbackInput, setFallbackInput] = useState('');
  const [audioLevel, setAudioLevel] = useState<number[]>([15, 25, 40, 20, 30, 50, 20]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Default to Indian multilingual acoustic model

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setLiveTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);
      };

      recognition.onend = () => {
        // Recognition completed
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animate sound waves during listening
  useEffect(() => {
    if (isRecording || voiceState === 'listening') {
      const interval = setInterval(() => {
        setAudioLevel([
          Math.floor(10 + Math.random() * 50),
          Math.floor(20 + Math.random() * 70),
          Math.floor(30 + Math.random() * 90),
          Math.floor(40 + Math.random() * 100),
          Math.floor(25 + Math.random() * 80),
          Math.floor(15 + Math.random() * 60),
          Math.floor(10 + Math.random() * 40),
        ]);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRecording, voiceState]);

  // Start Voice Recording
  const startRecording = async () => {
    setLiveTranscript('');
    audioChunksRef.current = [];

    // Try starting Web Speech API for immediate transcript preview
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already active or error
      }
    }

    // Capture microphone media stream
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Release microphone tracks
          stream.getTracks().forEach((track) => track.stop());

          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });

          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            // Send captured audio and any interim transcript
            await onVoiceCommand(liveTranscript, base64Audio, mediaRecorder.mimeType);
          };
        };

        mediaRecorder.start(250);
        setIsRecording(true);
      } else {
        // Fallback if mediaDevices not available
        setIsRecording(true);
      }
    } catch (err: any) {
      console.warn('Microphone permission / access info:', err);
      // Still allow speech recognition or simulate
      setIsRecording(true);
    }
  };

  // Stop Recording & Send Command
  const stopRecording = async () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // If media recorder wasn't capturing stream, submit the live transcript
      if (liveTranscript.trim()) {
        await onVoiceCommand(liveTranscript.trim());
      }
    }
  };

  const handleToggleMic = () => {
    if (isRecording || voiceState === 'listening') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePresetClick = (phrase: string) => {
    setLiveTranscript(phrase);
    onVoiceCommand(phrase);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackInput.trim()) {
      onVoiceCommand(fallbackInput.trim());
      setFallbackInput('');
    }
  };

  // Spoken voice test chips covering all required validation cases
  const presets = [
    { label: '👞 Black Shoes', query: 'Show me black shoes' },
    { label: '👟 White Sneakers', query: 'Show me white sneakers' },
    { label: '👗 Blue Kurti', query: 'Mujhe blue kurti dikhao' },
    { label: '👞 Red Shoes < 1500', query: 'Red shoes under 1500' },
    { label: '👗 Black Kurti < 1000 (मराठी)', query: 'Mala 1000 rupayanchya aat black kurti dakhav' },
    { label: '➕ Show More', query: 'Show more' },
    { label: '📉 Sort Lowest Price', query: 'Sort by lowest price' },
    { label: '🔍 Under ₹1000', query: 'Only show items under 1000' },
    { label: '🛒 2nd to Cart', query: 'Add the second product to cart' },
    { label: '🗑️ Remove That Item', query: 'Remove that item' },
    { label: '⚖️ Compare First 2', query: 'Compare the first two products' },
    { label: '🏷️ Cheaper Options', query: 'Show cheaper alternatives' },
    { label: '🧾 Cart Total?', query: 'What is my cart total?' },
    { label: '🧹 Clear Cart', query: 'Clear my cart' },
    { label: '↩️ Undo Action', query: 'Undo last cart action' },
    { label: '❌ No Match Test', query: 'Show me pink shoes under 500' },
  ];

  return (
    <div className="bg-slate-900/95 border-2 border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-orange-500/10 mb-8 relative">
      {/* Top Banner & State Indicator */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/60 text-xs font-semibold">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRecording || voiceState === 'listening'
                ? 'bg-rose-500 animate-ping'
                : voiceState === 'processing'
                ? 'bg-purple-500 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-slate-200">
            {isRecording || voiceState === 'listening'
              ? 'Listening... Speak in Hindi, Marathi, Hinglish or English'
              : voiceState === 'processing'
              ? 'Chotu is understanding your spoken command...'
              : 'Voice Shopping Active • Tap Mic to Speak'}
          </span>
        </div>
      </div>

      {/* Main Microphone Button & Waveform Visualization */}
      <div className="flex flex-col items-center justify-center my-3">
        {/* Pulsing rings around microphone */}
        <div className="relative flex items-center justify-center">
          {(isRecording || voiceState === 'listening') && (
            <>
              <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-orange-500/20 animate-ping" />
              <div className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-purple-500/30 animate-pulse" />
            </>
          )}

          {/* Big Circular Mic Button */}
          <button
            onClick={handleToggleMic}
            disabled={voiceState === 'processing'}
            aria-label={isRecording ? 'Stop recording voice command' : 'Start speaking voice command'}
            className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl transform active:scale-95 cursor-pointer ${
              isRecording || voiceState === 'listening'
                ? 'bg-gradient-to-tr from-rose-600 via-orange-600 to-amber-500 text-white ring-4 ring-orange-400 ring-offset-4 ring-offset-slate-950 scale-105'
                : voiceState === 'processing'
                ? 'bg-purple-700 text-purple-200 cursor-not-allowed opacity-90'
                : 'bg-gradient-to-tr from-orange-500 via-amber-500 to-purple-600 text-white hover:scale-105 hover:shadow-orange-500/40'
            }`}
          >
            {voiceState === 'processing' ? (
              <Loader2 className="w-9 h-9 animate-spin text-white" />
            ) : isRecording || voiceState === 'listening' ? (
              <Square className="w-8 h-8 fill-white" />
            ) : (
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow" />
            )}

            <span className="text-[10px] font-bold tracking-wider uppercase mt-1">
              {voiceState === 'processing'
                ? 'Thinking'
                : isRecording || voiceState === 'listening'
                ? 'Tap to Send'
                : 'Tap to Speak'}
            </span>
          </button>
        </div>

        {/* Live Audio Visualizer Equalizer Bars */}
        {(isRecording || voiceState === 'listening') && (
          <div className="flex items-center gap-1.5 h-10 mt-4 px-4 py-1 bg-slate-950/80 rounded-full border border-orange-500/40">
            {audioLevel.map((lvl, idx) => (
              <div
                key={idx}
                style={{ height: `${Math.max(8, lvl)}%` }}
                className="w-1.5 bg-gradient-to-t from-orange-500 to-purple-400 rounded-full transition-all duration-100"
              />
            ))}
          </div>
        )}

        {/* Live Spoken Transcript or Status Banner */}
        <div className="mt-3 min-h-[32px] text-center max-w-xl px-4">
          {liveTranscript ? (
            <p className="text-sm sm:text-base font-medium text-orange-300 bg-orange-950/40 border border-orange-500/30 px-4 py-1.5 rounded-full inline-block animate-fade-in">
              🗣️ "{liveTranscript}"
            </p>
          ) : lastTranscript ? (
            <p className="text-xs sm:text-sm text-slate-300">
              Last heard: <span className="font-semibold text-orange-400">"{lastTranscript}"</span>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400">
              Speak naturally: <span className="text-orange-300">“Oye Chotu, show black shoes under 1000”</span>
            </p>
          )}

          {errorMessage && (
            <div className="mt-2 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/40 px-3 py-1 rounded-lg inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Spoken Voice Test Command Chips (1-Click Presets) */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            Quick Voice Commands (Speak or Click to Test)
          </span>

          <button
            onClick={() => setShowTextFallback(!showTextFallback)}
            className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium cursor-pointer"
          >
            {showTextFallback ? 'Hide Text Fallback' : 'Keyboard Fallback'}
          </button>
        </div>

        {/* Preset Chips Grid */}
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetClick(preset.query)}
              className="text-xs font-medium bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/60 hover:border-orange-500/50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Mic className="w-3 h-3 text-orange-400 shrink-0" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Optional Collapsible Text Fallback */}
      {showTextFallback && (
        <form onSubmit={handleTextSubmit} className="mt-4 pt-3 border-t border-slate-800/60 flex gap-2">
          <input
            type="text"
            value={fallbackInput}
            onChange={(e) => setFallbackInput(e.target.value)}
            placeholder="Type command fallback (e.g. Mala 1000 rupayanchya aat kale shoes dakhav)..."
            className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            aria-label="Submit command"
            className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      )}
    </div>
  );
};
