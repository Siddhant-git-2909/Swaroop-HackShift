import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { api } from '../../services/api';
import { WorkerProfile, Claim, EvidenceItem, Review } from '../../types';
import {
  ShieldCheck,
  Award,
  Camera,
  MapPin,
  Star,
  QrCode,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  X,
  Upload,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface SkillPassportProps {
  workerProfile: WorkerProfile | null;
  onOpenDiscovery?: () => void;
}

export const SkillPassport: React.FC<SkillPassportProps> = ({ workerProfile }) => {
  const [profile, setProfile] = useState<WorkerProfile | null>(workerProfile);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Evidence file upload form
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, [workerProfile]);

  const loadData = async () => {
    const slug = workerProfile?.slug || 'ramesh-electrician';
    setLoading(true);
    try {
      const data = await api.getPublicPassport(slug);
      setProfile(data.worker);
      setClaims(data.claims);
      setEvidence(data.evidence);
      setReviews(data.reviews);

      const resolvedUrl = data.public_url || `${window.location.origin}/w/${slug}`;
      setPublicUrl(resolvedUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate real QR code when modal opens
  useEffect(() => {
    if (showQrModal && profile?.slug) {
      const targetUrl = publicUrl || `${window.location.origin}/w/${profile.slug}`;
      QRCode.toDataURL(targetUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
    }
  }, [showQrModal, profile?.slug, publicUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setUploadError('Invalid format. Please select a JPG, PNG, or WebP photo.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setUploadError('Please provide a short description of the work photo.');
      return;
    }
    if (!selectedFile && !imageUrl.trim()) {
      setUploadError('Please choose an image file or provide a photo URL.');
      return;
    }

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('worker_id', profile?.user_id || 'user-w1');
      formData.append('caption', caption);

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (imageUrl) {
        formData.append('image_url', imageUrl);
      }

      await api.uploadEvidence(formData);
      setCaption('');
      setImageUrl('');
      setSelectedFile(null);
      setFilePreview(null);
      setShowAddEvidence(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = () => {
    const targetUrl = publicUrl || `${window.location.origin}/w/${profile?.slug}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentLevel = profile?.trust_level || 1;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Passport Header Card */}
      <div className="rounded-lg bg-white border-[2.5px] border-black p-6 sm:p-8 shadow-hard-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-2 border-black">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-md bg-[#facc15] border-2 border-black flex items-center justify-center font-display font-black text-2xl text-black shadow-hard-sm">
              {profile?.name ? profile.name[0] : 'W'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-black text-black">{profile?.name || 'Worker'}</h1>
                <span className="text-xs bg-[#faf7f2] text-black border border-black px-2 py-0.5 rounded font-mono font-bold shadow-[1px_1px_0px_0px_#000]">
                  @{profile?.slug}
                </span>
              </div>
              <p className="text-sm font-medium text-neutral-800 mt-1 max-w-xl">{profile?.headline}</p>

              <div className="flex items-center gap-3 mt-2 text-xs font-bold text-neutral-700">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                  <span>{profile?.area_text || 'Delhi NCR'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                  <span>{profile?.experience_years || 5}+ Years Experience</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowQrModal(true)}
              className="btn-brutal-secondary flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs"
            >
              <QrCode className="w-4 h-4 stroke-[2.5]" />
              <span>Share QR Code</span>
            </button>
            <button
              onClick={() => setShowAddEvidence(true)}
              className="btn-brutal-primary flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Evidence</span>
            </button>
          </div>
        </div>

        {/* The Trust Ladder Status Widget */}
        <div className="mt-6 pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
              <span className="font-display text-sm font-black text-black uppercase tracking-tight">Trust Ladder Status</span>
            </div>
            <span className="text-[11px] font-bold text-neutral-700">
              {currentLevel === 3 ? 'Highest Verification Achieved' : 'Upload work photos or visit Sewa Kendra to level up'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* L1 */}
            <div className={`p-3.5 rounded-md border-2 border-black text-center transition-all ${
              currentLevel >= 1
                ? 'bg-white shadow-hard-sm text-black'
                : 'bg-neutral-100 text-neutral-400'
            }`}>
              <div className="text-[10px] font-black uppercase text-neutral-600">Level 1</div>
              <div className="text-xs font-black mt-0.5">Self-Declared</div>
              <div className="text-[10px] font-bold text-neutral-800 mt-1 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3 text-black stroke-[2.5]" />
                <span>Profile Confirmed</span>
              </div>
            </div>

            {/* L2 */}
            <div className={`p-3.5 rounded-md border-2 border-black text-center transition-all ${
              currentLevel >= 2
                ? 'bg-[#fef08a] shadow-hard-sm text-black'
                : 'bg-neutral-100 text-neutral-400'
            }`}>
              <div className="text-[10px] font-black uppercase text-black">Level 2</div>
              <div className="text-xs font-black mt-0.5">Evidence Added</div>
              <div className="text-[10px] font-bold text-black mt-1 flex items-center justify-center gap-1">
                {currentLevel >= 2 ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                    <span>Photos & AI Checked</span>
                  </span>
                ) : (
                  <span>Attach 1+ work photo</span>
                )}
              </div>
            </div>

            {/* L3 */}
            <div className={`p-3.5 rounded-md border-2 border-black text-center transition-all ${
              currentLevel >= 3
                ? 'bg-[#bbf7d0] shadow-hard-sm text-black'
                : 'bg-neutral-100 text-neutral-400'
            }`}>
              <div className="text-[10px] font-black uppercase text-neutral-900">Level 3</div>
              <div className="text-xs font-black mt-0.5">Independently Verified</div>
              <div className="text-[10px] font-bold text-black mt-1 flex items-center justify-center gap-1">
                {currentLevel >= 3 ? (
                  <span className="flex items-center gap-1">
                    <Award className="w-3 h-3 stroke-[2.5]" />
                    <span>Facilitator Assessed</span>
                  </span>
                ) : (
                  <span>Sewa Kendra human check</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills & Claims Section */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-black text-black flex items-center gap-2">
          <span>Declared & Verified Skills</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {claims.map((claim) => (
            <div key={claim.id} className="p-4 rounded-lg bg-white border-2 border-black shadow-hard-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-black capitalize">{claim.subject}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-black uppercase ${
                    claim.status === 'independently_assessed'
                      ? 'bg-[#bbf7d0] text-black shadow-[1px_1px_0px_0px_#000]'
                      : claim.status === 'customer_confirmed'
                      ? 'bg-[#bae6fd] text-black shadow-[1px_1px_0px_0px_#000]'
                      : claim.status === 'evidence_added'
                      ? 'bg-[#fef08a] text-black shadow-[1px_1px_0px_0px_#000]'
                      : 'bg-[#faf7f2] text-black'
                  }`}>
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs font-medium text-neutral-700 mt-2">{claim.scope}</p>
                {claim.note && (
                  <p className="text-xs font-medium text-black italic mt-1.5 bg-[#faf7f2] p-2.5 rounded border border-black">
                    "{claim.note}"
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t-2 border-black text-[11px] font-semibold text-neutral-700">
                Source: <span className="text-black font-bold">{claim.source_label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Evidence Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-black text-black flex items-center gap-2">
              <Camera className="w-5 h-5 text-black stroke-[2.5]" />
              <span>Work Evidence Gallery ({evidence.length})</span>
            </h2>
            <p className="text-xs font-medium text-neutral-600">Real photos of work done, checked by AI-assisted consistency check</p>
          </div>
          <button
            onClick={() => setShowAddEvidence(true)}
            className="text-xs text-black hover:underline font-black bg-[#facc15] border-2 border-black px-2.5 py-1 rounded shadow-hard-sm"
          >
            + Add New Photo
          </button>
        </div>

        {evidence.length === 0 ? (
          <div className="p-8 rounded-lg bg-white border-2 border-dashed border-black text-center space-y-3 shadow-hard-sm">
            <Camera className="w-8 h-8 text-neutral-500 mx-auto stroke-[2]" />
            <p className="text-sm font-bold text-neutral-700">No work evidence uploaded yet.</p>
            <button
              onClick={() => setShowAddEvidence(true)}
              className="btn-brutal-primary px-4 py-2 text-xs"
            >
              Upload First Work Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {evidence.map((ev) => (
              <div key={ev.id} className="rounded-lg bg-white border-2 border-black shadow-hard-sm overflow-hidden flex flex-col">
                <div className="relative h-44 overflow-hidden bg-neutral-900 border-b-2 border-black">
                  <img
                    src={ev.image_url}
                    alt={ev.caption}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-2 right-2 bg-[#facc15] border-2 border-black px-2 py-0.5 rounded text-[10px] font-mono font-black text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                    AI Match: {Math.round(ev.ai_score * 100)}%
                  </div>
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-black line-clamp-2">{ev.caption}</p>
                    <p className="text-[11px] font-semibold text-neutral-700 mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-black stroke-[2.5]" />
                      <span>{ev.ai_note}</span>
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t-2 border-black flex items-center justify-between text-[10px] font-bold text-neutral-700">
                    <span>{ev.source_label}</span>
                    <span className="bg-[#bbf7d0] text-black border border-black px-1.5 py-0.2 rounded uppercase">{ev.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Reviews Section */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-black text-black flex items-center gap-2">
          <Star className="w-5 h-5 text-black fill-[#facc15] stroke-[2.5]" />
          <span>Customer Reviews & Testimonials ({reviews.length})</span>
        </h2>

        {reviews.length === 0 ? (
          <p className="text-xs font-medium text-neutral-600">Reviews appear here once bookings are marked completed by customers.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-lg bg-white border-2 border-black shadow-hard-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-black">{rev.reviewer_name}</span>
                  <div className="flex items-center gap-1 text-black text-xs font-black bg-[#fef08a] border border-black px-2 py-0.5 rounded">
                    <Star className="w-3.5 h-3.5 fill-black stroke-[2.5]" />
                    <span>{rev.rating}.0 / 5.0</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-neutral-800 leading-relaxed">"{rev.text}"</p>
                <div className="mt-2 text-[10px] font-bold text-neutral-500 uppercase">Booking-verified review</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add Evidence with Real File Upload */}
      {showAddEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
            <button
              onClick={() => {
                setShowAddEvidence(false);
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-lg font-black text-black mb-1">Add Work Evidence Photo</h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">
              Upload photos of your completed projects (wiring, plumbing, tile work) to upgrade your passport to Level 2.
            </p>

            {uploadError && (
              <div className="p-2.5 mb-3 bg-rose-100 border-2 border-black text-xs font-bold text-rose-800 rounded">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleAddEvidence} className="space-y-4">
              {/* File Picker with Preview */}
              <div>
                <label className="block text-xs font-black text-black mb-1">Upload Image File (JPG, PNG, WebP)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black rounded-lg p-4 text-center cursor-pointer bg-[#faf7f2] hover:bg-[#fef08a] transition-colors"
                >
                  {filePreview ? (
                    <div className="space-y-2">
                      <img
                        src={filePreview}
                        alt="Upload preview"
                        className="h-36 mx-auto object-cover rounded border-2 border-black shadow-hard-sm"
                      />
                      <span className="text-[11px] font-bold text-black block">Click to choose another photo</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <Upload className="w-6 h-6 stroke-[2.5] text-black" />
                      <span className="text-xs font-black text-black">Click to browse photo from camera or files</span>
                      <span className="text-[10px] text-neutral-600">Max file size 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Caption */}
              <div>
                <label className="block text-xs font-black text-black mb-1">Photo Description / Caption</label>
                <input
                  type="text"
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Havells 63A MCB distribution box rewiring with neutral isolation"
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2.5 text-xs text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              {/* Optional Demo Image URL Alternative */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Or Paste Image URL (Optional Alternative)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (optional if file selected above)"
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3.5 py-2 text-xs text-black font-medium focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div className="p-3 bg-[#fef08a] border-2 border-black rounded-md text-xs font-bold text-black flex items-center gap-2 shadow-hard-sm">
                <Sparkles className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span>AI-assisted check will evaluate this photo for trade consistency and promote your profile to Level 2!</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddEvidence(false);
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="btn-brutal-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn-brutal-primary px-5 py-2 text-xs"
                >
                  {uploading ? 'Uploading & Analyzing...' : 'Upload & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Valid Scannable QR Code */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-sm bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-base font-black text-black mb-1">Share Skill Passport</h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">Scan with phone camera to view verifiable public profile</p>

            {/* Real Scannable QR Canvas/Image */}
            <div className="p-3 bg-white rounded-md border-2 border-black shadow-hard-md w-56 h-56 mx-auto flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${profile?.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs font-bold text-neutral-500">Generating QR...</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-xs font-mono font-bold text-black bg-[#facc15] border border-black py-1 px-2.5 rounded truncate max-w-[200px]">
                /w/{profile?.slug}
              </span>
              <button
                onClick={handleCopyLink}
                title="Copy Public Link"
                className="p-1.5 rounded border border-black bg-white hover:bg-neutral-100"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={publicUrl || `/w/${profile?.slug}`}
                target="_blank"
                rel="noreferrer"
                title="Open Public Page"
                className="p-1.5 rounded border border-black bg-white hover:bg-neutral-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <p className="text-[11px] font-semibold text-neutral-600 mt-3">
              Privacy Guaranteed: Phone numbers and private ID records are never encoded or displayed publicly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
