import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Award, CheckCircle2, X } from 'lucide-react';

interface FacilitatorPortalProps {
  onWorkerAssessed?: () => void;
}

export const FacilitatorPortal: React.FC<FacilitatorPortalProps> = ({ onWorkerAssessed }) => {
  const [workersQueue, setWorkersQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Assessment modal
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [assessmentScope, setAssessmentScope] = useState('In-person circuit diagnostic and live DB wiring test');
  const [assessmentNote, setAssessmentNote] = useState('Observed safe wiring standards, correct grounding test with multimeter, and neat cable trunking.');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getFacilitatorWorkers();
      setWorkersQueue(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      const res = await api.assessClaim(
        selectedClaim.id,
        'user-f1', // Sunita Devi Facilitator ID
        assessmentScope,
        assessmentNote
      );
      setSuccessMessage(res.message);
      setSelectedClaim(null);
      await loadQueue();
      if (onWorkerAssessed) onWorkerAssessed();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Facilitator Header */}
      <div className="p-6 rounded-lg bg-white border-[2.5px] border-black shadow-hard space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-[#facc15] border border-black px-2.5 py-1 rounded w-fit shadow-hard-sm">
          <Award className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Sewa Kendra • In-Person Verification Center</span>
        </div>
        <h1 className="font-display text-2xl font-black text-black">Facilitator Skill Assessment Portal</h1>
        <p className="text-xs font-semibold text-neutral-800 max-w-2xl leading-relaxed">
          Logged in as: <strong className="text-black bg-[#bbf7d0] px-1.5 py-0.5 rounded border border-black">Sunita Devi (Facilitator, Karol Bagh Center)</strong>.
          As per SWAROOP credibility rules, <strong>Level 3 (Independently Verified)</strong> is strictly granted only after an authorized human facilitator records an in-person physical skills assessment.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-md bg-[#bbf7d0] border-2 border-black text-black text-xs font-bold flex items-center justify-between shadow-hard-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-black/10 rounded">
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Workers Queue */}
      <div className="space-y-4">
        <h2 className="font-display text-base font-black text-black uppercase tracking-tight">
          Workers Ready for Physical Assessment
        </h2>

        {loading ? (
          <div className="p-8 text-center font-bold text-neutral-700 bg-white border-2 border-black rounded-lg shadow-hard">
            Loading verification queue...
          </div>
        ) : (
          <div className="space-y-4">
            {workersQueue.map(({ worker, claims, evidence }) => {
              const isLevel3 = worker.trust_level === 3;
              return (
                <div
                  key={worker.user_id}
                  className="p-5 rounded-lg bg-white border-[2.5px] border-black shadow-hard space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-black">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-black text-base text-black">{worker.name}</h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase ${
                          isLevel3
                            ? 'bg-[#bbf7d0] text-black shadow-[1px_1px_0px_0px_#000]'
                            : 'bg-[#fef08a] text-black shadow-[1px_1px_0px_0px_#000]'
                        }`}>
                          Level {worker.trust_level}: {isLevel3 ? 'Verified' : 'Evidence Added'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-neutral-800 mt-1">{worker.headline}</p>
                    </div>

                    <div className="text-xs font-bold text-neutral-700 bg-[#faf7f2] border border-black px-2 py-1 rounded">
                      Area: {worker.area_text} • Evidence photos: {evidence.length}
                    </div>
                  </div>

                  {/* Claims to verify */}
                  <div className="space-y-2">
                    <div className="text-xs font-black text-black uppercase tracking-wider">Skill Claims:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {claims.map((claim: any) => (
                        <div
                          key={claim.id}
                          className="p-3 rounded-md bg-[#faf7f2] border-2 border-black flex items-center justify-between shadow-hard-sm"
                        >
                          <div>
                            <span className="font-black text-xs text-black capitalize">{claim.subject}</span>
                            <p className="text-[11px] font-medium text-neutral-700">{claim.status.replace('_', ' ')}</p>
                          </div>

                          {claim.status !== 'independently_assessed' ? (
                            <button
                              onClick={() => setSelectedClaim(claim)}
                              className="btn-brutal-primary px-3 py-1 text-xs"
                            >
                              Conduct Assessment
                            </button>
                          ) : (
                            <span className="text-xs text-black font-black flex items-center gap-1 bg-[#bbf7d0] border border-black px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>L3 Verified</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
            <button
              onClick={() => setSelectedClaim(null)}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-lg font-black text-black mb-1">
              In-Person Skill Certification
            </h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">
              Evaluating claim for <strong className="text-black bg-[#facc15] px-1 py-0.5 rounded border border-black capitalize">{selectedClaim.subject}</strong>.
            </p>

            <form onSubmit={handleAssessClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Assessment Scope</label>
                <input
                  type="text"
                  required
                  value={assessmentScope}
                  onChange={(e) => setAssessmentScope(e.target.value)}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Facilitator Field Note</label>
                <textarea
                  rows={3}
                  required
                  value={assessmentNote}
                  onChange={(e) => setAssessmentNote(e.target.value)}
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md p-3 text-xs text-black font-medium placeholder-neutral-500 focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div className="p-3 bg-[#bbf7d0] border-2 border-black rounded-md text-xs font-bold text-black shadow-hard-sm">
                Staff Certification: Submitting this form officially signs off on the worker's physical assessment and promotes them to <strong>Level 3 (Independently Verified)</strong>.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="btn-brutal-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-brutal-primary px-5 py-2 text-xs bg-[#4ade80]"
                >
                  {submitting ? 'Certifying...' : 'Certify as Level 3 (Human-Reviewed)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
