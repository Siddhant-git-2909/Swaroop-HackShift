import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Area, Skill, WorkerProfile } from '../../types';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface WorkerOnboardingProps {
  onProfileCreated: (profile: WorkerProfile) => void;
}

export const WorkerOnboarding: React.FC<WorkerOnboardingProps> = ({ onProfileCreated }) => {
  const [step, setStep] = useState<'speak' | 'review'>('speak');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeNote, setTranscribeNote] = useState<string>('');
  const [processError, setProcessError] = useState('');

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Reference data
  const [areas, setAreas] = useState<Area[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Draft state
  const [draftName, setDraftName] = useState('');
  const [draftHeadline, setDraftHeadline] = useState('');
  const [draftCoreSkills, setDraftCoreSkills] = useState<string[]>([]);
  const [draftExperience, setDraftExperience] = useState<number>(3);
  const [draftAreaId, setDraftAreaId] = useState<string>('area-1');
  const [consentGranted, setConsentGranted] = useState(true);

  useEffect(() => {
    api.getAreas().then(setAreas).catch(console.error);
    api.getSkills().then(setSkills).catch(console.error);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 30) {
            stopVoiceInput();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startVoiceInput = async () => {
    try {
      setTranscribeNote('');
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        // Send to backend Sarvam STT
        setTranscribing(true);
        try {
          const res = await api.voiceTranscribe(audioBlob);
          if (res.success && res.transcript) {
            setInputText(res.transcript);
            setTranscribeNote(`Sarvam AI: "${res.note}"`);
            if (res.draft) {
              setDraftName(res.draft.sample_name || 'Rajesh Kumar');
              setDraftHeadline(res.draft.headline || 'Experienced Skilled Technician');
              setDraftCoreSkills(res.draft.core_skills || ['electrician']);
              setDraftExperience(res.draft.experience_years || 5);
              setDraftAreaId(res.draft.area_id || 'area-1');
            }
          } else {
            setTranscribeNote(res.note || 'Sarvam STT returned no transcript. Please type below or try the sample.');
          }
        } catch (error) {
          console.warn('Voice transcription failed:', error);
          setTranscribeNote(
            'Voice transcription failed. Please try recording again or enter your details manually.'
          );
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access unavailable or blocked:', err);
      // Fallback: Web Speech API or friendly text prompt
      setIsRecording(false);
      setTranscribeNote('Microphone access not permitted in browser. Please type or use sample audio.');
    }
  };

  const stopVoiceInput = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleUseDemoSample = () => {
    const sample = "Mera naam Rajesh Kumar hai. Main Karol Bagh me rehta hoon aur 7 saal se bijli ka kaam (electrician) aur AC repair kar raha hoon. MCB wiring aur inverter setup meri khaasiyat hai.";
    setInputText(sample);
    setTranscribeNote('Loaded standard Hindi/Hinglish speech sample (Rajesh - Electrician)');
  };

  const handleProcessInput = async () => {
  if (!inputText.trim() || loading) return;

  setProcessError('');
  setLoading(true);

  try {
    const res = await api.textDraft(inputText);
    const draft = res.draft;

    setDraftName(draft.sample_name || 'Rajesh Kumar');
    setDraftHeadline(draft.headline || 'Experienced Skilled Technician');
    setDraftCoreSkills(draft.core_skills || ['electrician']);
    setDraftExperience(draft.experience_years || 5);
    setDraftAreaId(draft.area_id || 'area-1');
    setStep('review');
  } catch (error) {
    console.error('Text profile processing failed:', error);
    setProcessError(
      'We could not process your details. Please try again. Your entered text has been kept.'
    );
  } finally {
    setLoading(false);
  }
};

  const handleConfirmProfile = async () => {
    if (!consentGranted) {
      alert('Please grant consent to save and display your profile.');
      return;
    }
    setLoading(true);
    try {
      const selectedArea = areas.find(a => a.id === draftAreaId);
      const res = await api.confirmProfile({
        user_id: `user-w-${Date.now().toString().slice(-6)}`,
        name: draftName,
        headline: draftHeadline,
        core_skills: draftCoreSkills,
        secondary_skills: [],
        experience_years: draftExperience,
        area_id: draftAreaId,
        area_text: selectedArea ? `${selectedArea.name_en}, ${selectedArea.city}` : 'Delhi NCR',
        source: 'voice'
      });
      onProfileCreated(res.profile);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-md border-2 border-black flex items-center justify-center font-black text-sm shadow-hard-sm ${
            step === 'speak' ? 'bg-[#facc15] text-black' : 'bg-[#4ade80] text-black'
          }`}>
            {step === 'speak' ? '1' : <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-black text-black">
              {step === 'speak' ? 'Step 1: Speak or Type your Skills' : 'Step 2: Review & Confirm Profile'}
            </h2>
            <p className="text-xs font-semibold text-neutral-600">
              {step === 'speak' ? 'Apne hunar ke baare me batayein (Sarvam AI STT Active)' : 'Aapki jaankari ka satyapan'}
            </p>
          </div>
        </div>

        {step === 'review' && (
          <button
            onClick={() => setStep('speak')}
            className="text-xs font-bold text-black flex items-center gap-1 bg-white px-3 py-1.5 rounded-md border-2 border-black shadow-hard-sm hover:bg-yellow-100 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Redo Speech</span>
          </button>
        )}
      </div>

      {step === 'speak' ? (
        <div className="space-y-6">
          {/* Voice Prompt Box */}
          <div className="p-6 sm:p-8 rounded-lg bg-white border-[2.5px] border-black text-center relative shadow-hard-md">
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] bg-[#facc15] text-black border-2 border-black px-2.5 py-0.5 rounded font-mono font-bold shadow-[1px_1px_0px_0px_#000]">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sarvam AI Speech-to-Text • Grounded Extraction</span>
              </span>
            </div>

            <p className="text-xs font-black uppercase tracking-wider text-neutral-600 mb-1">
              Speak in Hindi, Hinglish, or English
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-black text-black mb-2">
              "Aap kya kaam karte hain aur kitne saal se kar rahe hain?"
            </h3>
            <p className="text-xs sm:text-sm font-medium text-neutral-700 max-w-md mx-auto mb-6">
              Example: <i>"Mera naam Rajesh hai. Main Karol Bagh me 7 saal se bijli ka kaam (electrician) aur AC repair karta hoon."</i>
            </p>

            {/* Big Mic Button */}
            <div className="flex flex-col items-center justify-center gap-3">
              <button
                onClick={isRecording ? stopVoiceInput : startVoiceInput}
                disabled={transcribing}
                className={`w-24 h-24 rounded-full border-3 border-black flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-[#fb7185] text-black animate-pulse shadow-hard-lg'
                    : transcribing
                    ? 'bg-neutral-200 text-neutral-500 shadow-hard-sm'
                    : 'bg-[#facc15] hover:bg-[#fde047] text-black shadow-hard-lg hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-sm'
                }`}
              >
                {transcribing ? (
                  <Loader2 className="w-10 h-10 stroke-[2.5] animate-spin text-black" />
                ) : isRecording ? (
                  <MicOff className="w-10 h-10 stroke-[2.5]" />
                ) : (
                  <Mic className="w-10 h-10 stroke-[2.5]" />
                )}
              </button>

              {transcribing ? (
                <div className="flex items-center gap-2 text-black font-black text-xs sm:text-sm bg-[#facc15] border-2 border-black px-3 py-1 rounded shadow-hard-sm">
                  <span>Transcribing with Sarvam AI API...</span>
                </div>
              ) : isRecording ? (
                <div className="flex items-center gap-2 text-rose-600 font-black text-xs sm:text-sm bg-rose-100 border-2 border-black px-2.5 py-1 rounded shadow-hard-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                  <span>Recording audio... ({30 - recordingSeconds}s remaining)</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-neutral-600">Tap to start speaking (30s max)</span>
              )}
            </div>

            {/* Transcription Status Note */}
            {transcribeNote && (
              <div className="mt-4 p-2.5 bg-[#faf7f2] border-2 border-black rounded-md text-xs font-bold text-black max-w-md mx-auto shadow-hard-sm">
                {transcribeNote}
              </div>
            )}

            {/* Quick Demo Pre-filled Button */}
            <div className="mt-8 pt-6 border-t-2 border-black flex flex-wrap justify-center gap-3">
              <button
                onClick={handleUseDemoSample}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#faf7f2] hover:bg-[#facc15] text-black border-2 border-black text-xs font-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Volume2 className="w-4 h-4 stroke-[2.5]" />
                <span>Load Sample Speech (Rajesh - Electrician)</span>
              </button>
            </div>
          </div>

          {/* Textarea Fallback */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black">
              Speech Transcript or Direct Text Entry:
            </label>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Aap yahan likh bhi sakte hain..."
              className="w-full bg-white border-[2.5px] border-black rounded-lg p-3.5 text-sm text-black font-medium placeholder-neutral-500 shadow-hard-sm focus:outline-none focus:shadow-hard"
            />
            </div>

          {processError && (
            <p role="alert" className="text-sm font-bold text-red-700">
              {processError}
            </p>
          )}

          {/* Proceed Button */}
          <button
            onClick={handleProcessInput}
            disabled={!inputText.trim() || loading || transcribing}
            className="w-full btn-brutal-primary flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Extracting Skills...</span>
            ) : (
              <>
                <span>Extract Profile & Review (समीक्षा करें)</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      ) : (
        /* Review Screen (Grounded Form) */
        <div className="space-y-6">
          <div className="p-3.5 rounded-lg bg-[#bbf7d0] border-2 border-black text-black text-xs font-bold flex items-center gap-2 shadow-hard-sm">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
            <span>Profile drafted from your speech. Review and adjust any details before saving.</span>
          </div>

          <div className="p-6 rounded-lg bg-white border-[2.5px] border-black shadow-hard space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-black text-black mb-1">Worker Name (पूरा नाम)</label>
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2.5 text-sm text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
              />
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-black text-black mb-1">Headline (प्रोफाइल विवरण)</label>
              <input
                type="text"
                value={draftHeadline}
                onChange={(e) => setDraftHeadline(e.target.value)}
                className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2.5 text-sm text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
              />
            </div>

            {/* Core Skills selection */}
            <div>
              <label className="block text-xs font-black text-black mb-2">Detected Trades / Skills (हुनर)</label>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => {
                  const isSelected = draftCoreSkills.includes(skill.slug);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setDraftCoreSkills(draftCoreSkills.filter(s => s !== skill.slug));
                        } else {
                          setDraftCoreSkills([...draftCoreSkills, skill.slug]);
                        }
                      }}
                      className={`text-xs px-3 py-1.5 rounded-md border-2 border-black font-extrabold transition-all ${
                        isSelected
                          ? 'bg-[#facc15] text-black shadow-hard-sm'
                          : 'bg-white text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      {skill.name_en} ({skill.name_hi.split('/')[0].trim()})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Experience (अनुभव वर्ष)</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={draftExperience}
                  onChange={(e) => setDraftExperience(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2.5 text-sm text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Service Area (कार्य क्षेत्र - Delhi NCR)</label>
                <select
                  value={draftAreaId}
                  onChange={(e) => setDraftAreaId(e.target.value)}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2.5 text-sm text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                >
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name_en} ({area.name_hi}) - {area.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Consent Gate */}
            <div className="pt-4 border-t-2 border-black">
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#faf7f2] border-2 border-black rounded-md shadow-hard-sm">
                <input
                  type="checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-black border-2 border-black rounded focus:ring-0 accent-yellow-400"
                />
                <span className="text-xs font-semibold text-neutral-800 leading-relaxed">
                  I consent to creating my portable SWAROOP Skill Passport and displaying my declared trade and experience to potential customers. Phone number will remain private and masked until booking confirmation.
                </span>
              </label>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmProfile}
            disabled={loading || !draftName.trim() || draftCoreSkills.length === 0}
            className="w-full btn-brutal-primary flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <span>Saving Passport...</span> : (
              <>
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                <span>Confirm & Generate Skill Passport (पासपोर्ट जारी करें)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
