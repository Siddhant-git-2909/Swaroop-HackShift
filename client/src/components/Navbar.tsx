import React from 'react';
import { User } from '../types';
import {
  RotateCcw,
  Sparkles,
  UserCheck,
  Briefcase,
  Search,
  Calendar,
  Award
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onQuickSwitch: (role: 'worker' | 'customer' | 'contractor' | 'facilitator') => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  onQuickSwitch,
  onResetDemo,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#faf7f2] border-b-[2.5px] border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => onSelectTab('landing')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-md bg-[#facc15] border-2 border-black flex items-center justify-center shadow-hard-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
              <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xl tracking-tight text-black">SWAROOP</span>
                <span className="text-[10px] bg-[#fb7185] text-black border-[1.5px] border-black px-1.5 py-0.2 rounded font-mono font-bold tracking-wider shadow-[1px_1px_0px_0px_#000]">
                  SIMULATED
                </span>
              </div>
              <p className="text-[11px] font-semibold text-neutral-700 tracking-tight">Resume nahi, hunar hai.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {[
              { id: 'landing', label: 'Home' },
              { id: 'onboarding', label: 'Voice Onboard' },
              { id: 'passport', label: 'Skill Passport' },
              { id: 'discovery', label: 'Find Workers' },
              { id: 'bookings', label: 'Bookings & Quotes' },
              { id: 'facilitator', label: 'Sewa Kendra (L3)' },
            ].map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border-2 ${
                    isActive
                      ? 'bg-[#facc15] text-black border-black shadow-hard-sm'
                      : 'bg-transparent text-neutral-800 border-transparent hover:border-black hover:bg-white hover:shadow-hard-sm'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Role switcher & Reset */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1 bg-[#ede1d1] p-1 rounded-md border-2 border-black shadow-hard-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-black px-1.5">Role:</span>
              <button
                onClick={() => onQuickSwitch('worker')}
                className={`text-[11px] px-2 py-0.5 rounded font-bold border-2 transition-all ${
                  currentUser?.role === 'worker'
                    ? 'bg-[#facc15] text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-transparent text-neutral-700 border-transparent hover:text-black'
                }`}
              >
                Worker (Ramesh)
              </button>
              <button
                onClick={() => onQuickSwitch('customer')}
                className={`text-[11px] px-2 py-0.5 rounded font-bold border-2 transition-all ${
                  currentUser?.role === 'customer'
                    ? 'bg-[#facc15] text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-transparent text-neutral-700 border-transparent hover:text-black'
                }`}
              >
                Customer (Priya)
              </button>
              <button
                onClick={() => onQuickSwitch('contractor')}
                className={`text-[11px] px-2 py-0.5 rounded font-bold border-2 transition-all ${
                  currentUser?.role === 'contractor'
                    ? 'bg-[#facc15] text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-transparent text-neutral-700 border-transparent hover:text-black'
                }`}
              >
                Contractor (Hardeep)
              </button>
              <button
                onClick={() => onQuickSwitch('facilitator')}
                className={`text-[11px] px-2 py-0.5 rounded font-bold border-2 transition-all ${
                  currentUser?.role === 'facilitator'
                    ? 'bg-[#facc15] text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-transparent text-neutral-700 border-transparent hover:text-black'
                }`}
              >
                Facilitator (Sunita)
              </button>
            </div>

            <button
              onClick={onResetDemo}
              title="Reset Demo State"
              className="p-1.5 bg-white text-black hover:bg-[#facc15] rounded-md border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t-2 border-black overflow-x-auto py-2 px-3 gap-1.5 bg-[#f5eee3]">
        {[
          { id: 'landing', label: 'Home' },
          { id: 'onboarding', label: 'Voice Onboard' },
          { id: 'passport', label: 'Skill Passport' },
          { id: 'discovery', label: 'Find Workers' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'facilitator', label: 'Sewa Kendra' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`text-xs px-2.5 py-1 rounded-md font-bold whitespace-nowrap border-2 border-black transition-all ${
              currentTab === tab.id
                ? 'bg-[#facc15] text-black shadow-hard-sm'
                : 'bg-white text-black hover:bg-yellow-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
