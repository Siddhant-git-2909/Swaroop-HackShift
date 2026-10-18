import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Loader2, 
  RotateCcw, 
  ArrowRight,
  Languages,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseForWorker?: (text: string) => void;
  onUseForSearch?: (text: string) => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  onUseForWorker,
  onUseForSearch
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedLang, setDetectedLang] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('unknown');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  if (!isOpen) return null;

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
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const type = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });

        if (audioBlob.size < 300) {
          setErrorMsg('Audio was too short. Speak for at least 1-2 seconds.');
          setIsProcessing(false);
          return;
        }

        setIsProcessing(true);
        try {
          const res = await api.generalVoiceTranscribe(audioBlob, selectedLanguage);
          if (res.success && res.transcript && res.transcript.trim()) {
            setTranscript(res.transcript.trim());
            setDetectedLang(res.language_code || 'hi-IN');
            setErrorMsg(null);
          } else {
            setErrorMsg(res.note || 'No speech detected in audio. Please speak louder and closer to the mic.');
          }
        } catch (err: any) {
          setErrorMsg('Speech recognition error. Please check your network and try again.');
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.warn('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access denied. Please click the camera/mic icon in the browser address bar to allow microphone access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No microphone found on your device. You can type directly or use the sample audio button.');
      } else {
        setErrorMsg('Microphone access unavailable. Please check browser permissions.');
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSample = () => {
    setTranscript("नमस्ते, मेरा नाम रमेश कुमार है। मैं करोल बाग में 8 साल से बिजली और इनवर्टर वायरिंग का काम करता हूँ। मुझे बड़े पैनल और एमसीबी ट्रिपिंग ठीक करने का अच्छा अनुभव है।");
    setDetectedLang("hi-IN");
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
      <div className="w-full max-w-xl bg-white border-[3px] border-black rounded-lg p-6 sm:p-8 shadow-hard-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md border-2 border-black bg-white hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#facc15] text-black border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_0px_#000] flex items-center gap-1">
            <Sparkles className="w-3 h-3 stroke-[2.5]" />
            <span>Sarvam AI Saaras:v4 Engine</span>
          </span>
          <span className="text-xs font-mono font-bold text-neutral-600">Speech-to-Text</span>
        </div>
        <h2 className="font-display text-2xl font-black text-black">
          Voice to Text Studio (बोलकर लिखें)
        </h2>
        <p className="text-xs font-semibold text-neutral-600 mb-5">
          Speak in Hindi, Hinglish, English, or any Indian regional language. Sarvam AI converts your voice directly into accurate text.
        </p>

        {/* Language Selector */}
        <div className="flex items-center gap-2 mb-6 text-xs font-bold">
          <Languages className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Expected Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording || isProcessing}
            className="bg-[#faf7f2] border-2 border-black rounded px-2.5 py-1 text-xs text-black font-bold focus:bg-white"
          >
            <option value="unknown">Auto-Detect Language</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
            <option value="en-IN">Indian English</option>
            <option value="bn-IN">Bengali (বাংলা)</option>
            <option value="mr-IN">Marathi (मराठी)</option>
            <option value="gu-IN">Gujarati (ગુજરાતી)</option>
            <option value="ta-IN">Tamil (தமிழ்)</option>
            <option value="te-IN">Telugu (తెలుగు)</option>
            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
            <option value="pa-IN">Punjabi (ਪੰਜਾਬੀ)</option>
          </select>
        </div>

        {/* Center Mic Interaction Area */}
        <div className="p-6 rounded-lg bg-[#faf7f2] border-2 border-black text-center mb-6 shadow-hard-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-24 h-24 rounded-full border-[3px] border-black flex flex-col items-center justify-center transition-all ${
                isRecording
                  ? 'bg-[#fb7185] text-black shadow-hard-lg animate-pulse scale-105'
                  : isProcessing
                  ? 'bg-neutral-200 text-neutral-500 shadow-hard-sm'
                  : 'bg-[#facc15] hover:bg-[#fde047] text-black shadow-hard-lg hover:scale-105 active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-8 h-8 stroke-[2.5] animate-spin text-black" />
                  <span className="text-[10px] font-black mt-1">Processing...</span>
                </>
              ) : isRecording ? (
                <>
                  <MicOff className="w-8 h-8 stroke-[2.5] text-black" />
                  <span className="text-[11px] font-black mt-1">{seconds}s (Tap to Stop)</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 stroke-[2.5] text-black" />
                  <span className="text-[11px] font-black mt-1">Tap to Speak</span>
                </>
              )}
            </button>

            {isRecording && (
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-600 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>Listening to your voice... Speak clearly</span>
              </div>
            )}

            {!isRecording && !isProcessing && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-600">No microphone?</span>
                <button
                  type="button"
                  onClick={handleSample}
                  className="text-xs font-bold text-black underline hover:text-neutral-800"
                >
                  Load Hindi audio transcript sample
                </button>
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-md bg-[#fee2e2] border-2 border-black text-xs font-bold text-black shadow-hard-sm">
            {errorMsg}
          </div>
        )}

        {/* Live Converted Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <span>Converted Text Output (रूपांतरित टेक्स्ट):</span>
              {detectedLang && (
                <span className="text-[10px] bg-[#bbf7d0] text-black border border-black px-1.5 py-0.2 rounded font-mono font-bold">
                  Detected: {detectedLang}
                </span>
              )}
            </label>
            {transcript && (
              <span className="text-[11px] font-mono text-neutral-600">
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>

          <textarea
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Aapki aawaz yahan text me convert hogi... (Your speech will appear here converted to text)"
            className="w-full bg-[#faf7f2] border-2 border-black rounded-md p-3.5 text-sm text-black font-medium placeholder-neutral-500 focus:bg-white focus:outline-none shadow-hard-sm"
          />
        </div>

        {/* Action Buttons */}
        {transcript && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-4 border-t-2 border-black">
            <button
              onClick={handleCopy}
              className="btn-brutal-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>

            <div className="flex items-center gap-2">
              {onUseForWorker && (
                <button
                  onClick={() => {
                    onUseForWorker(transcript);
                    onClose();
                  }}
                  className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1"
                >
                  <span>Use in Worker Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {onUseForSearch && (
                <button
                  onClick={() => {
                    onUseForSearch(transcript);
                    onClose();
                  }}
                  className="btn-brutal-secondary px-3.5 py-1.5 text-xs flex items-center gap-1 bg-[#bae6fd]"
                >
                  <span>Search with this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
