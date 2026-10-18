import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import {
  RotateCcw,
  Sparkles,
  UserCheck,
  Mic,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onQuickSwitch: (role: 'worker' | 'customer' | 'contractor' | 'facilitator') => void;
  onResetDemo: () => void;
  onLogout?: () => void;
  onOpenVoiceStudio?: () => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  onSelectTab,
  onQuickSwitch,
  onResetDemo,
  onLogout,
  onOpenVoiceStudio,
  onOpenAuthModal,
}) => {
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const devDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (devDropdownRef.current && !devDropdownRef.current.contains(event.target as Node)) {
        setIsDevDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine role-specific navigation links
  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { id: 'landing', label: 'Home' },
        { id: 'discovery', label: 'Find Workers' },
      ];
    }

    switch (currentUser.role) {
      case 'worker':
        return [
          { id: 'landing', label: 'Home' },
          { id: 'passport', label: 'My Skill Passport' },
          { id: 'onboarding', label: 'Voice Onboard' },
        ];
      case 'customer':
        return [
          { id: 'landing', label: 'Home' },
          { id: 'discovery', label: 'Find Workers' },
          { id: 'bookings', label: 'My Bookings' },
        ];
      case 'contractor':
        return [
          { id: 'landing', label: 'Home' },
          { id: 'discovery', label: 'Find Workers & Squads' },
          { id: 'bookings', label: 'Project Bookings' },
        ];
      case 'facilitator':
        return [
          { id: 'landing', label: 'Home' },
          { id: 'facilitator', label: 'Sewa Kendra Queue' },
          { id: 'discovery', label: 'Find Workers' },
        ];
      default:
        return [
          { id: 'landing', label: 'Home' },
          { id: 'discovery', label: 'Find Workers' },
        ];
    }
  };

  const navLinks = getNavLinks();

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

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {navLinks.map((tab) => {
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

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Sarvam AI Voice STT Action */}
            {onOpenVoiceStudio && (
              <button
                onClick={onOpenVoiceStudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-black bg-[#facc15] hover:bg-[#fde047] text-black border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                title="Open Sarvam AI Voice to Text Studio"
              >
                <Mic className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span className="hidden sm:inline">बोलकर लिखें (Voice STT)</span>
                <span className="sm:hidden">Voice STT</span>
              </button>
            )}

            {/* Authenticated User Display (Single User Identity) */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white border-2 border-black rounded-md shadow-hard-sm">
                  <div className="w-7 h-7 rounded bg-[#facc15] border border-black flex items-center justify-center font-black text-xs text-black uppercase">
                    {currentUser.name ? currentUser.name[0] : 'U'}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-black truncate max-w-[130px]">{currentUser.name}</span>
                      <span className="text-[9px] bg-[#facc15] text-black font-extrabold uppercase px-1 py-0.2 rounded border border-black">
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-neutral-600">📱 +91 {currentUser.phone}</div>
                  </div>
                </div>

                {/* Logout Button */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold bg-white hover:bg-red-50 text-red-600 border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                    title="Log out from current session"
                  >
                    <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden md:inline">Log Out</span>
                  </button>
                )}
              </div>
            ) : (
              /* Public / Logged-Out: Sign In / Up Button */
              onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-black bg-white hover:bg-[#facc15] text-black border-2 border-black shadow-hard-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                  title="Sign Up or Log In with Phone OTP"
                >
                  <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Sign In / Up</span>
                </button>
              )
            )}

            {/* Development-Only Demo Persona Switcher (Clean Dropdown, Not inline production tabs) */}
            <div className="relative" ref={devDropdownRef}>
              <button
                onClick={() => setIsDevDropdownOpen(!isDevDropdownOpen)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-extrabold border-2 border-dashed border-neutral-700 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all"
                title="Development Persona Switcher (For local testing only)"
              >
                <span className="hidden sm:inline">⚡ Dev Personas</span>
                <span className="sm:hidden">⚡ Dev</span>
                <ChevronDown className="w-3 h-3 stroke-[2.5]" />
              </button>

              {isDevDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border-2 border-black rounded-md shadow-hard-md p-1.5 z-50">
                  <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 px-2 py-1 border-b border-neutral-200 mb-1">
                    Development Demo Personas
                  </div>
                  <button
                    onClick={() => {
                      onQuickSwitch('worker');
                      setIsDevDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded flex items-center justify-between transition-colors ${
                      currentUser?.role === 'worker' ? 'bg-[#facc15] text-black' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <span>👷 Worker: Ramesh Kumar</span>
                    <span className="text-[10px] font-mono bg-white px-1 py-0.2 border border-black rounded">L2</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickSwitch('customer');
                      setIsDevDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded flex items-center justify-between transition-colors ${
                      currentUser?.role === 'customer' ? 'bg-[#facc15] text-black' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <span>🛒 Customer: Priya Sharma</span>
                    <span className="text-[10px] font-mono bg-white px-1 py-0.2 border border-black rounded">Direct</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickSwitch('contractor');
                      setIsDevDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded flex items-center justify-between transition-colors ${
                      currentUser?.role === 'contractor' ? 'bg-[#facc15] text-black' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <span>🏗️ Contractor: Hardeep Singh</span>
                    <span className="text-[10px] font-mono bg-white px-1 py-0.2 border border-black rounded">Commercial</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickSwitch('facilitator');
                      setIsDevDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 text-xs font-bold rounded flex items-center justify-between transition-colors ${
                      currentUser?.role === 'facilitator' ? 'bg-[#facc15] text-black' : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <span>🏛️ Facilitator: Sunita Devi</span>
                    <span className="text-[10px] font-mono bg-white px-1 py-0.2 border border-black rounded">L3 Sewa</span>
                  </button>
                </div>
              )}
            </div>

            {/* Reset Demo State Button */}
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

      {/* Mobile nav bar - Matches Desktop Role-Specific Navigation */}
      <div className="flex md:hidden border-t-2 border-black overflow-x-auto py-2 px-3 gap-1.5 bg-[#f5eee3]">
        {navLinks.map((tab) => (
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

