import React from 'react';
import {
  Mic,
  ShieldCheck,
  Search,
  Receipt,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Camera,
  MapPin,
  Clock
} from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onExplorePassport: () => void;
  onFindWorkers: () => void;
  onGoToBookings: () => void;
  onGoToFacilitator: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onExplorePassport,
  onFindWorkers,
  onGoToBookings,
  onGoToFacilitator,
}) => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-10 rounded-lg border-[2.5px] border-black bg-white p-6 sm:p-12 text-center shadow-hard-lg">
        {/* Pitch badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#fef08a] border-2 border-black text-black text-xs sm:text-sm font-black mb-6 shadow-hard-sm">
          <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Apni kahaani se, apni pehchaan tak.</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-black max-w-4xl mx-auto leading-tight">
          <span className="bg-[#facc15] px-2 py-0.5 border-2 border-black shadow-hard-sm inline-block mr-2 -rotate-1">
            Resume nahi,
          </span>
          <span>hunar hai.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-neutral-800 max-w-2xl mx-auto font-medium leading-relaxed">
          For electricians, plumbers, painters, carpenters and repair technicians. Speak once in your own language, get a verifiable digital Skill Passport, and connect with trusted local customers.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={onStartOnboarding}
            className="btn-brutal-primary flex items-center gap-2.5 px-6 py-3.5 text-base sm:text-lg"
          >
            <Mic className="w-5 h-5 stroke-[2.5]" />
            <span>Voice Onboard (बोलकर प्रोफाइल बनाएं)</span>
          </button>

          <button
            onClick={onFindWorkers}
            className="btn-brutal-secondary flex items-center gap-2.5 px-6 py-3.5 text-base sm:text-lg"
          >
            <Search className="w-5 h-5 text-black stroke-[2.5]" />
            <span>Find Workers (कारीगर ढूंढें)</span>
          </button>
        </div>

        {/* Quick Demo Shortcuts Banner */}
        <div className="mt-10 pt-8 border-t-2 border-black max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded">
              Quick 5-Minute Hackathon Demo Path
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <button
              onClick={onStartOnboarding}
              className="p-3 rounded-md bg-[#faf7f2] hover:bg-[#fef08a] border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex flex-col gap-1 text-left"
            >
              <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.2 rounded w-fit">STEP 1</span>
              <span className="font-extrabold text-xs text-black mt-1">Speak & Draft</span>
              <span className="text-neutral-600 text-[11px] font-medium">Instant voice-to-profile</span>
            </button>
            <button
              onClick={onExplorePassport}
              className="p-3 rounded-md bg-[#faf7f2] hover:bg-[#fef08a] border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex flex-col gap-1 text-left"
            >
              <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.2 rounded w-fit">STEP 2</span>
              <span className="font-extrabold text-xs text-black mt-1">Skill Passport</span>
              <span className="text-neutral-600 text-[11px] font-medium">Evidence & Trust Ladder</span>
            </button>
            <button
              onClick={onFindWorkers}
              className="p-3 rounded-md bg-[#faf7f2] hover:bg-[#fef08a] border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex flex-col gap-1 text-left"
            >
              <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.2 rounded w-fit">STEP 3</span>
              <span className="font-extrabold text-xs text-black mt-1">Match & Book</span>
              <span className="text-neutral-600 text-[11px] font-medium">Explainable match score</span>
            </button>
            <button
              onClick={onGoToBookings}
              className="p-3 rounded-md bg-[#faf7f2] hover:bg-[#fef08a] border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex flex-col gap-1 text-left"
            >
              <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.2 rounded w-fit">STEP 4</span>
              <span className="font-extrabold text-xs text-black mt-1">Quote & Review</span>
              <span className="text-neutral-600 text-[11px] font-medium">Itemised estimate workflow</span>
            </button>
          </div>
        </div>
      </section>

      {/* The 3-Tier Truthful Trust Ladder */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-[#facc15] border-2 border-black px-2.5 py-1 rounded shadow-hard-sm mb-3">
            <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
            <span>Truthful Credibility System</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-black">
            The SWAROOP Trust Ladder
          </h2>
          <p className="text-sm font-medium text-neutral-700 mt-2">
            Never falsely claiming "verified by AI". Each tier represents concrete work evidence and human accountability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* L1 */}
          <div className="p-6 rounded-lg bg-white border-[2.5px] border-black shadow-hard flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded text-xs font-black bg-[#f5eee3] text-black border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                  LEVEL 1
                </span>
                <span className="text-xs font-bold text-neutral-600 uppercase">Entry Step</span>
              </div>
              <h3 className="font-display text-lg font-black text-black mb-2">Self-Declared (खुद का बयान)</h3>
              <p className="text-sm font-medium text-neutral-700 leading-relaxed">
                Worker states their trade, years of experience, and service area with recorded consent. No fake certificates; transparent declaration.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-black text-xs font-bold text-neutral-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Grounded profile creation</span>
            </div>
          </div>

          {/* L2 */}
          <div className="p-6 rounded-lg bg-[#fef08a] border-[2.5px] border-black shadow-hard-md flex flex-col justify-between relative">
            <div className="absolute -top-3 right-4 bg-black text-white text-[10px] font-black px-2.5 py-0.5 rounded border border-black uppercase tracking-wider">
              Popular for Freelancers
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded text-xs font-black bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  LEVEL 2
                </span>
                <span className="text-xs font-black text-black uppercase">Evidence Backed</span>
              </div>
              <h3 className="font-display text-lg font-black text-black mb-2">Evidence Added (काम का सबूत)</h3>
              <p className="text-sm font-medium text-neutral-900 leading-relaxed">
                Worker attaches real job photos (MCB wiring, pipe joints, tiles). Validated with an AI-assisted consistency check and customer confirmations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-black text-xs font-bold text-black flex items-center gap-2">
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>Job site photos + AI-assisted review</span>
            </div>
          </div>

          {/* L3 */}
          <div className="p-6 rounded-lg bg-[#bbf7d0] border-[2.5px] border-black shadow-hard flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded text-xs font-black bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  LEVEL 3
                </span>
                <span className="text-xs font-black text-neutral-900 uppercase">Gold Standard</span>
              </div>
              <h3 className="font-display text-lg font-black text-black mb-2">Independently Verified (जांच प्रमाणित)</h3>
              <p className="text-sm font-medium text-neutral-800 leading-relaxed">
                Only granted through in-person assessment by a licensed human facilitator at local Sewa Kendras. Never awarded purely by automated software.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t-2 border-black text-xs font-bold text-black flex items-center gap-2">
              <Award className="w-4 h-4 stroke-[2.5]" />
              <span>In-person physical skill check</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-lg bg-white border-[2.5px] border-black shadow-hard">
          <div className="w-12 h-12 rounded-md bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-hard-sm mb-4">
            <Mic className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-lg font-black text-black mb-1">Voice-First Experience</h3>
          <p className="text-sm font-medium text-neutral-700 leading-relaxed">
            Workers who struggle with typing or complex English forms can speak naturally in Hindi or Hinglish. Grounded models strictly prevent hallucinated credentials.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-white border-[2.5px] border-black shadow-hard">
          <div className="w-12 h-12 rounded-md bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-hard-sm mb-4">
            <Receipt className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-lg font-black text-black mb-1">Itemised Quotations</h3>
          <p className="text-sm font-medium text-neutral-700 leading-relaxed">
            No haggling or surprise charges. Workers generate itemised quotes with visiting fees and materials. Customers approve before work begins.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-white border-[2.5px] border-black shadow-hard">
          <div className="w-12 h-12 rounded-md bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-hard-sm mb-4">
            <MapPin className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-lg font-black text-black mb-1">Explainable Local Match</h3>
          <p className="text-sm font-medium text-neutral-700 leading-relaxed">
            Customers find nearby verified workers with transparent score breakdowns: skill proficiency, haversine distance, today's availability, and trust level.
          </p>
        </div>
      </section>
    </div>
  );
};
