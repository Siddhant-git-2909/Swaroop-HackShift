import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './features/landing/LandingPage';
import { WorkerOnboarding } from './features/worker-onboarding/WorkerOnboarding';
import { SkillPassport } from './features/skill-passport/SkillPassport';
import { CustomerDiscovery } from './features/customer-discovery/CustomerDiscovery';
import { BookingsList } from './features/bookings/BookingsList';
import { FacilitatorPortal } from './features/facilitator/FacilitatorPortal';
import { api } from './services/api';
import { User, WorkerProfile } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');

  // Default demo user: Worker Ramesh Kumar
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-w1',
    phone: '9000000001',
    role: 'worker',
    name: 'Ramesh Kumar (रमेश कुमार)',
    language: 'hi',
    status: 'active'
  });

  const [activeWorkerProfile, setActiveWorkerProfile] = useState<WorkerProfile | null>({
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
  });

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

  const handleQuickSwitch = (role: 'worker' | 'customer' | 'contractor' | 'facilitator') => {
    if (role === 'worker') {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] text-neutral-900 font-sans">
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickSwitch={handleQuickSwitch}
        onResetDemo={handleResetDemo}
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
          />
        )}

        {currentTab === 'onboarding' && (
          <WorkerOnboarding onProfileCreated={handleProfileCreated} />
        )}

        {currentTab === 'passport' && (
          <SkillPassport
            workerProfile={activeWorkerProfile}
            onOpenDiscovery={() => setCurrentTab('discovery')}
          />
        )}

        {currentTab === 'discovery' && (
          <CustomerDiscovery
            currentUser={currentUser}
            onBookingCreated={() => setCurrentTab('bookings')}
            onViewPassport={handleViewWorkerPassport}
          />
        )}

        {currentTab === 'bookings' && (
          <BookingsList
            currentUser={currentUser}
            onRefreshPassport={() => {}}
          />
        )}

        {currentTab === 'facilitator' && (
          <FacilitatorPortal
            onWorkerAssessed={() => {}}
          />
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
