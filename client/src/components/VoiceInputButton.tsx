import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles, AlertCircle, Check } from 'lucide-react';
import { api } from '../services/api';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  languageCode?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  title?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  languageCode = 'unknown',
  size = 'md',
  label,
  className = '',
  title = 'Speak to convert voice to text using Sarvam AI'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (s >= 30) {
            stopRecording();
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Prefer standard webm or mp4/wav
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType 
        ? new MediaRecorder(stream, { mimeType }) 
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Release audio track
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const type = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });

        if (audioBlob.size < 300) {
          setErrorMsg('Recording was too short. Speak for at least 1-2 seconds.');
          setIsProcessing(false);
          return;
        }

        setIsProcessing(true);
        try {
          const res = await api.generalVoiceTranscribe(audioBlob, languageCode);
          if (res.success && res.transcript && res.transcript.trim()) {
            onTranscript(res.transcript.trim());
            setJustFinished(true);
            setTimeout(() => setJustFinished(false), 2500);
          } else {
            setErrorMsg(res.note || 'No speech detected. Please speak louder and closer to mic.');
            setTimeout(() => setErrorMsg(null), 4000);
          }
        } catch (err: any) {
          setErrorMsg('Transcription failed. Please try speaking again.');
          setTimeout(() => setErrorMsg(null), 4000);
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission denied. Please allow microphone access in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No microphone found on your device.');
      } else {
        setErrorMsg('Microphone unavailable or blocked. Please type directly.');
      }
      setTimeout(() => setErrorMsg(null), 5000);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isProcessing}
        title={title}
        className={`inline-flex items-center justify-center gap-1.5 font-black rounded-md border-2 border-black transition-all ${
          isRecording
            ? 'bg-[#fb7185] text-black shadow-hard-sm animate-pulse'
            : isProcessing
            ? 'bg-neutral-200 text-neutral-600 border-neutral-400 cursor-wait'
            : justFinished
            ? 'bg-[#86efac] text-black shadow-hard-sm'
            : 'bg-[#facc15] hover:bg-[#fde047] text-black shadow-hard-sm hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px]'
        } ${sizeClasses[size]} ${className}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 stroke-[2.5] animate-spin" />
            <span>Transcribing...</span>
          </>
        ) : isRecording ? (
          <>
            <MicOff className="w-3.5 h-3.5 stroke-[2.5] text-black" />
            <span>Stop ({seconds}s)</span>
          </>
        ) : justFinished ? (
          <>
            <Check className="w-3.5 h-3.5 stroke-[3] text-black" />
            <span>Done!</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 stroke-[2.5] text-black" />
            {label && <span>{label}</span>}
          </>
        )}
      </button>

      {/* Floating Status / Error Tooltip */}
      {errorMsg && (
        <div className="absolute left-0 bottom-full mb-1 z-30 whitespace-nowrap bg-black text-white text-[11px] font-bold px-2 py-1 rounded shadow-hard-sm flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-[#facc15]" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
