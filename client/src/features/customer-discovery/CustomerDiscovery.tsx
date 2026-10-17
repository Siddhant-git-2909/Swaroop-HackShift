import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Area, Skill, MatchedWorkerResult, User, ContractorProject } from '../../types';
import {
  Search,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  Camera,
  ArrowRight,
  X,
  Sparkles,
  CheckCircle,
  Briefcase,
  Users,
  Plus
} from 'lucide-react';

interface CustomerDiscoveryProps {
  currentUser: User | null;
  onBookingCreated: () => void;
  onViewPassport: (slug: string) => void;
}

export const CustomerDiscovery: React.FC<CustomerDiscoveryProps> = ({
  currentUser,
  onBookingCreated,
  onViewPassport,
}) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('area-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState<MatchedWorkerResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Contractor state
  const isContractor = currentUser?.role === 'contractor';
  const [activeTab, setActiveTab] = useState<'workers' | 'projects'>('workers');
  const [contractorProjects, setContractorProjects] = useState<ContractorProject[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState<string>('');

  // Project form state
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('electrician');
  const [newProjectWorkersNeeded, setNewProjectWorkersNeeded] = useState(2);
  const [newProjectAreaId, setNewProjectAreaId] = useState('area-1');
  const [newProjectBudget, setNewProjectBudget] = useState(35000);
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Direct booking modal
  const [selectedWorker, setSelectedWorker] = useState<MatchedWorkerResult | null>(null);
  const [bookingDesc, setBookingDesc] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    api.getAreas().then(setAreas).catch(console.error);
    api.getSkills().then(setSkills).catch(console.error);
    if (isContractor) {
      loadContractorProjects();
    }
  }, [currentUser]);

  useEffect(() => {
    fetchResults();
  }, [selectedCategory, selectedAreaId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await api.searchMatching(
        selectedCategory || undefined,
        selectedAreaId || undefined,
        searchQuery || undefined
      );
      setWorkers(data.results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadContractorProjects = async () => {
    try {
      const projects = await api.contractorListProjects(currentUser?.id);
      setContractorProjects(projects);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    setCreatingProject(true);
    try {
      await api.contractorCreateProject({
        contractor_id: currentUser?.id || 'user-ct1',
        title: newProjectTitle,
        category: newProjectCategory,
        workers_needed: newProjectWorkersNeeded,
        area_id: newProjectAreaId,
        budget_rs: newProjectBudget,
        description: newProjectDesc
      });
      setShowNewProjectModal(false);
      setNewProjectTitle('');
      setNewProjectDesc('');
      await loadContractorProjects();
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleAssignWorker = async (workerId: string, projectId: string) => {
    if (!projectId) return;
    try {
      await api.contractorAssignWorker(projectId, workerId);
      alert('Worker successfully assigned to project squad!');
      await loadContractorProjects();
      setSelectedWorker(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker || !bookingDesc.trim()) return;
    setSubmittingBooking(true);
    try {
      await api.createBooking({
        customer_id: currentUser?.id || 'user-c1',
        worker_id: selectedWorker.worker.user_id,
        contractor_id: isContractor ? currentUser?.id : undefined,
        booking_type: isContractor ? 'contractor_dispatch' : 'direct',
        category: selectedCategory || selectedWorker.worker.core_skills[0] || 'electrician',
        description: bookingDesc,
        area_id: selectedAreaId,
        requested_for: bookingDate
      });
      setSelectedWorker(null);
      setBookingDesc('');
      onBookingCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Contractor Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-black text-black">
              {isContractor ? 'Contractor Squad & Worker Coordination' : 'Find Skilled Workers (कारीगर खोजें)'}
            </h1>
            {isContractor && (
              <span className="text-xs bg-[#facc15] text-black border border-black font-black px-2 py-0.5 rounded shadow-hard-sm">
                CONTRACTOR MODE
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-neutral-700 mt-1">
            {isContractor
              ? 'Discover verified workers, assemble trade squads, and coordinate multi-worker site projects.'
              : 'Explainable, local match with verified skills and truthful trust levels from MongoDB Atlas.'
            }
          </p>
        </div>

        {isContractor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('workers')}
              className={`text-xs px-3 py-1.5 rounded-md font-bold border-2 border-black transition-all ${
                activeTab === 'workers' ? 'bg-[#facc15] shadow-hard-sm' : 'bg-white hover:bg-neutral-100'
              }`}
            >
              Discover Workers
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`text-xs px-3 py-1.5 rounded-md font-bold border-2 border-black transition-all ${
                activeTab === 'projects' ? 'bg-[#facc15] shadow-hard-sm' : 'bg-white hover:bg-neutral-100'
              }`}
            >
              My Projects ({contractorProjects.length})
            </button>
          </div>
        )}
      </div>

      {/* Contractor Projects Tab View */}
      {isContractor && activeTab === 'projects' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-black text-black">Active Contractor Projects</h2>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create New Project Squad</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contractorProjects.map((proj) => (
              <div key={proj.id} className="p-5 rounded-lg bg-white border-[2.5px] border-black shadow-hard space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase bg-[#faf7f2] border border-black px-2 py-0.5 rounded">
                      {proj.category}
                    </span>
                    <h3 className="font-display font-black text-base text-black mt-1">{proj.title}</h3>
                    <p className="text-xs font-semibold text-neutral-600">{proj.area_text}</p>
                  </div>
                  <span className="text-xs font-black bg-[#bbf7d0] border border-black px-2 py-0.5 rounded uppercase">
                    {proj.status}
                  </span>
                </div>

                <p className="text-xs font-medium text-neutral-800 bg-[#faf7f2] p-2.5 rounded border border-black">
                  "{proj.description}"
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-neutral-800 border-t border-neutral-200 pt-2">
                  <div>Squad Size: <span className="font-black text-black">{proj.assigned_worker_ids?.length || 0} / {proj.workers_needed} Workers</span></div>
                  <div>Budget: <span className="font-black text-black">₹{proj.budget_rs?.toLocaleString('en-IN')}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Workers Discovery View */
        <>
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 rounded-lg bg-white border-[2.5px] border-black shadow-hard space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-black absolute left-3.5 top-3.5 stroke-[2.5]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
                  placeholder="Search trade, skill, or keyword..."
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md pl-10 pr-3.5 py-2.5 text-xs text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              {/* Area filter */}
              <div className="relative">
                <MapPin className="w-4 h-4 text-black absolute left-3.5 top-3.5 stroke-[2.5]" />
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md pl-10 pr-3.5 py-2.5 text-xs text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                >
                  <option value="">All Delhi NCR Areas</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name_en} ({area.name_hi}) - {area.city}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchResults}
                className="btn-brutal-primary px-4 py-2.5 text-xs"
              >
                Update Search Results
              </button>
            </div>

            {/* Skill category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1.5 rounded-md text-xs font-black whitespace-nowrap transition-all border-2 border-black ${
                  selectedCategory === ''
                    ? 'bg-[#facc15] text-black shadow-hard-sm'
                    : 'bg-white text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                All Trades
              </button>
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedCategory(skill.slug)}
                  className={`px-3 py-1.5 rounded-md text-xs font-black whitespace-nowrap transition-all border-2 border-black ${
                    selectedCategory === skill.slug
                      ? 'bg-[#facc15] text-black shadow-hard-sm'
                      : 'bg-white text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  {skill.name_en}
                </button>
              ))}
            </div>
          </div>

          {/* Workers Grid */}
          {loading ? (
            <div className="p-12 text-center font-bold text-neutral-700 bg-white border-2 border-black rounded-lg shadow-hard">
              Querying MongoDB Atlas for matched workers...
            </div>
          ) : workers.length === 0 ? (
            <div className="p-12 text-center font-bold text-neutral-700 bg-white rounded-lg border-2 border-dashed border-black shadow-hard-sm">
              No workers found for this criteria. Try changing trade or area.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {workers.map((item) => {
                const w = item.worker;
                return (
                  <div
                    key={w.user_id}
                    className="p-5 rounded-lg bg-white border-[2.5px] border-black shadow-hard-md hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-hard-lg transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar: Name & Score */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display font-black text-base text-black">{w.name}</h3>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase ${
                              w.trust_level === 3
                                ? 'bg-[#bbf7d0] text-black shadow-[1px_1px_0px_0px_#000]'
                                : w.trust_level === 2
                                ? 'bg-[#fef08a] text-black shadow-[1px_1px_0px_0px_#000]'
                                : 'bg-[#faf7f2] text-neutral-800'
                            }`}>
                              Level {w.trust_level}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-neutral-800 line-clamp-1 mt-1">{w.headline}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1 bg-[#facc15] border-2 border-black px-2.5 py-1 rounded-md text-black font-black text-xs shadow-hard-sm">
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{item.score}% Match</span>
                          </div>
                        </div>
                      </div>

                      {/* Explainable Match Reason Pill */}
                      <div className="mt-3 p-2 rounded-md bg-[#faf7f2] border-2 border-black text-xs font-bold text-black flex items-center gap-2 shadow-[1.5px_1.5px_0px_0px_#000]">
                        <CheckCircle className="w-4 h-4 text-black stroke-[2.5] shrink-0" />
                        <span>{item.reason_hi}</span>
                      </div>

                      {/* Score breakdown metrics */}
                      <div className="grid grid-cols-4 gap-1.5 mt-3 text-center text-[10px] bg-white p-2 rounded border border-black font-bold">
                        <div className="border-r border-neutral-300">
                          <div className="font-black text-black text-xs">{item.breakdown.skill}/40</div>
                          <div className="text-neutral-600">Skill</div>
                        </div>
                        <div className="border-r border-neutral-300">
                          <div className="font-black text-black text-xs">{item.breakdown.location}/25</div>
                          <div className="text-neutral-600">Distance</div>
                        </div>
                        <div className="border-r border-neutral-300">
                          <div className="font-black text-black text-xs">{item.breakdown.availability}/15</div>
                          <div className="text-neutral-600">Availability</div>
                        </div>
                        <div>
                          <div className="font-black text-black text-xs">{item.breakdown.trust}/20</div>
                          <div className="text-neutral-600">Trust Level</div>
                        </div>
                      </div>

                      {/* Skills tags */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {w.core_skills.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-[#f5eee3] text-black border border-black text-[11px] font-bold capitalize">
                            {s.replace('-', ' ')}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded bg-white text-neutral-800 border border-black text-[11px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 stroke-[2.5]" />
                          <span>{w.experience_years}+ yrs</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white text-neutral-800 border border-black text-[11px] font-bold flex items-center gap-1">
                          <Camera className="w-3 h-3 stroke-[2.5]" />
                          <span>{item.evidence_count} photos</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom CTA actions */}
                    <div className="mt-5 pt-3 border-t-2 border-black flex items-center justify-between gap-3">
                      <button
                        onClick={() => onViewPassport(w.slug)}
                        className="text-xs font-black text-black hover:underline"
                      >
                        View Passport & Evidence →
                      </button>

                      {isContractor ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedWorker(item)}
                            className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 bg-[#fde047]"
                          >
                            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Assign to Squad / Book</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedWorker(item)}
                          className="btn-brutal-primary px-4 py-2 text-xs flex items-center gap-1.5"
                        >
                          <span>Request Booking</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Booking Form Modal (Direct / Contractor Dispatch) */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
            <button
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-lg font-black text-black mb-1">
              {isContractor ? `Coordinate with ${selectedWorker.worker.name}` : `Book Service with ${selectedWorker.worker.name}`}
            </h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">
              {isContractor
                ? 'Assign this worker directly to a commercial contractor project or request dispatch.'
                : 'Describe your job requirement. The worker will review and send an itemised quotation before starting.'
              }
            </p>

            {isContractor && contractorProjects.length > 0 && (
              <div className="mb-4 p-3 bg-[#fef08a] border-2 border-black rounded-md space-y-2">
                <label className="block text-xs font-black text-black">Assign to Existing Project Squad:</label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProjectForAssign}
                    onChange={(e) => setSelectedProjectForAssign(e.target.value)}
                    className="flex-1 bg-white border-2 border-black rounded px-2.5 py-1.5 text-xs text-black font-bold"
                  >
                    <option value="">Select a project...</option>
                    {contractorProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.category})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAssignWorker(selectedWorker.worker.user_id, selectedProjectForAssign)}
                    disabled={!selectedProjectForAssign}
                    className="btn-brutal-primary px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Trade Category</label>
                <input
                  type="text"
                  disabled
                  value={selectedCategory || selectedWorker.worker.core_skills[0]}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2 text-xs text-black uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Service / Start Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2 text-xs text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Job / Site Description</label>
                <textarea
                  rows={3}
                  required
                  value={bookingDesc}
                  onChange={(e) => setBookingDesc(e.target.value)}
                  placeholder={isContractor ? "e.g. Commercial site electrical wiring and sub-panel coordination" : "e.g. Inverter tripping when AC turns on, need checking of MCB and wiring."}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md p-3 text-xs text-black font-medium placeholder-neutral-500 focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div className="p-3 rounded-md bg-[#faf7f2] border-2 border-black text-xs font-bold text-black shadow-hard-sm">
                Transparent Estimation: The worker will send an itemised quote with materials and service fees.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWorker(null)}
                  className="btn-brutal-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="btn-brutal-primary px-5 py-2 text-xs"
                >
                  {submittingBooking ? 'Submitting...' : isContractor ? 'Send Contractor Booking' : 'Send Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Contractor Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-lg font-black text-black mb-1">Create Contractor Project Squad</h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">Post site requirements to organize multiple skilled workers.</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Commercial Complex 3-Phase DB Overhaul"
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Trade Category</label>
                  <select
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                    className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white"
                  >
                    {skills.map(s => (
                      <option key={s.id} value={s.slug}>{s.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Workers Needed</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newProjectWorkersNeeded}
                    onChange={(e) => setNewProjectWorkersNeeded(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Location (Delhi NCR)</label>
                  <select
                    value={newProjectAreaId}
                    onChange={(e) => setNewProjectAreaId(e.target.value)}
                    className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name_en} ({a.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={newProjectBudget}
                    onChange={(e) => setNewProjectBudget(parseInt(e.target.value) || 1000)}
                    className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Project Description</label>
                <textarea
                  rows={3}
                  required
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Detail work scope, site requirements, safety equipment needed..."
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md p-3 text-xs text-black font-medium focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="btn-brutal-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="btn-brutal-primary px-5 py-2 text-xs"
                >
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
