import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './features/landing/LandingPage';
import { WorkerOnboarding } from './features/worker-onboarding/WorkerOnboarding';
import { SkillPassport } from './features/skill-passport/SkillPassport';
import { CustomerDiscovery } from './features/customer-discovery/CustomerDiscovery';
import { BookingsList } from './features/bookings/BookingsList';
import { FacilitatorPortal } from './features/facilitator/FacilitatorPortal';
import { VoiceStudioModal } from './components/VoiceStudioModal';
import { AuthModal } from './components/AuthModal';
import { api } from './services/api';
import { User, WorkerProfile } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passedTranscript, setPassedTranscript] = useState('');
  const [passedSearchQuery, setPassedSearchQuery] = useState('');

  // Normal app startup starts logged-out (currentUser: null)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeWorkerProfile, setActiveWorkerProfile] = useState<WorkerProfile | null>(null);

  // Check URL pathname for direct public passport link /w/:slug
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/w/')) {
      const slug = path.replace('/w/', '').trim();
      if (slug) {
        api.getPublicPassport(slug)
          .then(data => {
            if (data && data.worker) {
              setActiveWorkerProfile(data.worker);
              setCurrentTab('passport');
            }
          })
          .catch(console.error);
      }
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveWorkerProfile(null);
    setCurrentTab('landing');
  };

  const handleQuickSwitch = (role: 'worker' | 'customer' | 'contractor' | 'facilitator') => {
    if (role === 'worker') {
      const rameshProfile: WorkerProfile = {
        user_id: 'user-w1',
        slug: 'ramesh-electrician',
        name: 'Ramesh Kumar',
        headline: 'House Wiring, MCB Tripping & Inverter Specialist with 8 Years Experience',
        core_skills: ['electrician'],
        secondary_skills: ['appliance-repair'],
        experience_years: 8,
        area_id: 'area-1',
        area_text: 'Karol Bagh & Central Delhi',
        trust_level: 2,
        identity_check_status: 'simulated_check'
      };
      setActiveWorkerProfile(rameshProfile);
      setCurrentUser({
        id: 'user-w1',
        phone: '9000000001',
        role: 'worker',
        name: 'Ramesh Kumar (Worker)',
        language: 'hi',
        status: 'active'
      });
      setCurrentTab('passport');
    } else if (role === 'customer') {
      setActiveWorkerProfile(null);
      setCurrentUser({
        id: 'user-c1',
        phone: '9100000001',
        role: 'customer',
        name: 'Priya Sharma (Customer)',
        language: 'en',
        status: 'active'
      });
      setCurrentTab('discovery');
    } else if (role === 'contractor') {
      setActiveWorkerProfile(null);
      setCurrentUser({
        id: 'user-ct1',
        phone: '9400000001',
        role: 'contractor',
        name: 'Hardeep Singh (Contractor)',
        language: 'hi',
        status: 'active'
      });
      setCurrentTab('discovery');
    } else if (role === 'facilitator') {
      setActiveWorkerProfile(null);
      setCurrentUser({
        id: 'user-f1',
        phone: '9200000001',
        role: 'facilitator',
        name: 'Sunita Devi (Facilitator)',
        language: 'hi',
        status: 'active'
      });
      setCurrentTab('facilitator');
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.demoReset();
      alert('Demo data has been reset to baseline clean state. User-created records remain safely preserved in MongoDB Atlas.');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProfileCreated = (profile: WorkerProfile) => {
    setActiveWorkerProfile(profile);
    setCurrentUser({
      id: profile.user_id,
      phone: '9000000099',
      role: 'worker',
      name: profile.name,
      language: 'hi',
      status: 'active'
    });
    setCurrentTab('passport');
  };

  const handleViewWorkerPassport = (slug: string) => {
    api.getPublicPassport(slug)
      .then(data => {
        if (data && data.worker) {
          setActiveWorkerProfile(data.worker);
          setCurrentTab('passport');
        }
      })
      .catch(console.error);
  };

  const handleAuthSuccess = (user: User, profile?: WorkerProfile | null) => {
    setCurrentUser(user);
    if (profile) {
      setActiveWorkerProfile(profile);
    } else if (user.role !== 'worker') {
      setActiveWorkerProfile(null);
    }
    // Role-specific dashboard routing
    if (user.role === 'worker') {
      if (profile && profile.core_skills && profile.core_skills.length > 0) {
        setCurrentTab('passport');
      } else {
        setCurrentTab('onboarding');
      }
    } else if (user.role === 'contractor') {
      setCurrentTab('discovery');
    } else if (user.role === 'customer') {
      setCurrentTab('discovery');
    } else if (user.role === 'facilitator') {
      setCurrentTab('facilitator');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-neutral-900 font-sans">
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickSwitch={handleQuickSwitch}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Common Signup & Phone OTP Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleAuthSuccess}
      />

      {/* Sarvam AI Voice Studio Modal */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        onUseForWorker={(text) => {
          setPassedTranscript(text);
          setCurrentTab('onboarding');
        }}
        onUseForSearch={(text) => {
          setPassedSearchQuery(text);
          setCurrentTab('discovery');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {currentTab === 'landing' && (
          <LandingPage
            onStartOnboarding={() => setCurrentTab('onboarding')}
            onExplorePassport={() => setCurrentTab('passport')}
            onFindWorkers={() => setCurrentTab('discovery')}
            onGoToBookings={() => setCurrentTab('bookings')}
            onGoToFacilitator={() => setCurrentTab('facilitator')}
            onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
          />
        )}

        {currentTab === 'onboarding' && (
          <WorkerOnboarding 
            onProfileCreated={handleProfileCreated}
            initialTranscript={passedTranscript}
          />
        )}

        {currentTab === 'passport' && (
          activeWorkerProfile ? (
            <SkillPassport
              workerProfile={activeWorkerProfile}
              currentUser={currentUser}
              onOpenDiscovery={() => setCurrentTab('discovery')}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white border-[2.5px] border-black rounded-lg shadow-hard-lg text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-[#facc15] border-2 border-black rounded-md flex items-center justify-center font-black text-xl shadow-hard-sm">
                🪪
              </div>
              <h2 className="text-2xl font-black text-black">No Skill Passport Selected</h2>
              <p className="text-sm text-neutral-700 font-medium">
                Log in as a worker to view and manage your own digital Skill Passport, or browse verified workers in Find Workers.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-[#facc15] text-black font-black text-sm border-2 border-black rounded-md shadow-hard-sm hover:bg-yellow-400 transition-all"
                >
                  Sign In / Up
                </button>
                <button
                  onClick={() => setCurrentTab('discovery')}
                  className="px-4 py-2 bg-white text-black font-black text-sm border-2 border-black rounded-md shadow-hard-sm hover:bg-neutral-50 transition-all"
                >
                  Find Workers
                </button>
              </div>
            </div>
          )
        )}

        {currentTab === 'discovery' && (
          <CustomerDiscovery
            currentUser={currentUser}
            onBookingCreated={() => setCurrentTab('bookings')}
            onViewPassport={handleViewWorkerPassport}
            initialSearchQuery={passedSearchQuery}
          />
        )}

        {currentTab === 'bookings' && (
          currentUser ? (
            <BookingsList
              currentUser={currentUser}
              onRefreshPassport={() => {}}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white border-[2.5px] border-black rounded-lg shadow-hard-lg text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-[#facc15] border-2 border-black rounded-md flex items-center justify-center font-black text-xl shadow-hard-sm">
                📋
              </div>
              <h2 className="text-2xl font-black text-black">Sign In to View Bookings</h2>
              <p className="text-sm text-neutral-700 font-medium">
                Log in with your mobile number to view and track your customer service requests, job quotations, or contractor projects.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-[#facc15] text-black font-black text-sm border-2 border-black rounded-md shadow-hard-sm hover:bg-yellow-400 transition-all"
                >
                  Sign In / Up
                </button>
              </div>
            </div>
          )
        )}

        {currentTab === 'facilitator' && (
          currentUser?.role === 'facilitator' || currentUser?.role === 'admin' ? (
            <FacilitatorPortal
              onWorkerAssessed={() => {}}
            />
          ) : (
            <div className="max-w-xl mx-auto my-12 p-8 bg-white border-[2.5px] border-black rounded-lg shadow-hard-lg text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-red-100 border-2 border-black rounded-md flex items-center justify-center font-black text-xl shadow-hard-sm text-red-600">
                🔒
              </div>
              <h2 className="text-2xl font-black text-black">Facilitator Access Restricted</h2>
              <p className="text-sm text-neutral-700 font-medium">
                The Sewa Kendra queue is strictly restricted to certified in-person facilitators and platform administrators for Level 3 trust assessments.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => handleQuickSwitch('facilitator')}
                  className="px-4 py-2 bg-[#facc15] text-black font-black text-sm border-2 border-black rounded-md shadow-hard-sm hover:bg-yellow-400 transition-all"
                >
                  Switch to Demo Facilitator (Sunita)
                </button>
                <button
                  onClick={() => setCurrentTab('landing')}
                  className="px-4 py-2 bg-white text-black font-black text-sm border-2 border-black rounded-md shadow-hard-sm hover:bg-neutral-50 transition-all"
                >
                  Return to Home
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Neo-Brutalist Trust & Simulation Disclaimer Footer */}
      <footer className="border-t-[2.5px] border-black bg-white py-8 px-4 text-center text-xs text-neutral-700 space-y-2">
        <div className="flex items-center justify-center gap-2 font-black text-black">
          <span className="font-display">SWAROOP — “Resume nahi, hunar hai.”</span>
          <span>•</span>
          <span className="bg-[#facc15] border border-black px-2 py-0.5 rounded font-mono shadow-[1px_1px_0px_0px_#000]">Team PRAHAAR</span>
        </div>
        <p className="max-w-3xl mx-auto text-[11px] font-medium text-neutral-600 leading-relaxed">
          Powered by MongoDB Atlas & Sarvam AI. Truthful Trust Ladder: Level 1 (Self-declared), Level 2 (Evidence added), Level 3 (Independently verified by human facilitator). SMS OTP and phone identity checks are labelled SIMULATED. AI assistance is advisory and never fabricates credentials.
        </p>
      </footer>
    </div>
  );
};
export default App;
