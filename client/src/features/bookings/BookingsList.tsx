import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Booking, Quotation, User } from '../../types';
import {
  Receipt,
  Calendar,
  CheckCircle2,
  Star,
  Play,
  CheckCheck,
  Trash2,
  X
} from 'lucide-react';

interface BookingsListProps {
  currentUser: User | null;
  onRefreshPassport?: () => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({ currentUser, onRefreshPassport }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Quote modal
  const [selectedBookingForQuote, setSelectedBookingForQuote] = useState<Booking | null>(null);
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteItems, setQuoteItems] = useState<{ label: string; qty: number; unit_rs: number }[]>([
    { label: 'Visiting & Diagnosis Charge', qty: 1, unit_rs: 250 },
    { label: 'Spare Parts / Materials', qty: 1, unit_rs: 300 },
    { label: 'Labor Charges', qty: 1, unit_rs: 200 }
  ]);
  const [sendingQuote, setSendingQuote] = useState(false);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const loadBookings = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await api.getBookings(currentUser.id, currentUser.role);
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      await loadBookings();
      if (onRefreshPassport) onRefreshPassport();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForQuote) return;
    setSendingQuote(true);
    try {
      const itemsPayload = quoteItems.map(item => ({
        label: item.label,
        qty: item.qty,
        unit_paise: item.unit_rs * 100
      }));

      await api.createQuote(
        selectedBookingForQuote.id,
        currentUser?.id || 'user-w1',
        quoteNote || 'Standard repair estimation with genuine materials',
        itemsPayload
      );
      setSelectedBookingForQuote(null);
      await loadBookings();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingQuote(false);
    }
  };

  const handleAcceptQuote = async (booking: Booking) => {
    if (!booking.current_quotation_id) return;
    try {
      await api.acceptQuote(booking.current_quotation_id, currentUser?.id || 'user-c1');
      await loadBookings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking || !reviewText.trim()) return;
    setSubmittingReview(true);
    try {
      await api.submitReview(
        reviewBooking.id,
        currentUser?.id || 'user-c1',
        rating,
        reviewText
      );
      setReviewBooking(null);
      setReviewText('');
      await loadBookings();
      if (onRefreshPassport) onRefreshPassport();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-[#fef08a] text-black shadow-[1px_1px_0px_0px_#000]">REQUESTED</span>;
      case 'quoted':
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-[#bae6fd] text-black shadow-[1px_1px_0px_0px_#000]">QUOTE SENT</span>;
      case 'accepted':
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-[#ddd6fe] text-black shadow-[1px_1px_0px_0px_#000]">QUOTE ACCEPTED</span>;
      case 'in_progress':
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-[#facc15] text-black shadow-[1px_1px_0px_0px_#000] animate-pulse">WORK IN PROGRESS</span>;
      case 'work_done':
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-[#99f6e4] text-black shadow-[1px_1px_0px_0px_#000]">WORK DONE</span>;
      case 'completed':
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-[#bbf7d0] text-black shadow-[1px_1px_0px_0px_#000]">COMPLETED & CONFIRMED</span>;
      default:
        return <span className="text-[10px] font-black px-2.5 py-0.5 rounded border border-black bg-neutral-200 text-black">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-black">Bookings & Quotations Workflow</h1>
          <p className="text-xs font-semibold text-neutral-700 mt-1">
            Viewing as: <strong className="bg-[#facc15] px-1.5 py-0.5 rounded border border-black uppercase text-black">{currentUser?.name} ({currentUser?.role})</strong>
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="btn-brutal-secondary text-xs px-3 py-1.5 w-fit"
        >
          Refresh Bookings
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center font-bold text-neutral-700 bg-white border-2 border-black rounded-lg shadow-hard">
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center font-bold text-neutral-700 bg-white rounded-lg border-2 border-dashed border-black shadow-hard-sm">
          No bookings found. Request a skilled worker from the "Find Workers" tab to see the live workflow.
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-lg bg-white border-[2.5px] border-black shadow-hard space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-black">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-base text-black capitalize">{b.category} Service</span>
                    {getStatusBadge(b.status)}
                  </div>
                  <p className="text-xs font-medium text-neutral-700 mt-1">
                    Worker: <strong className="text-black font-bold">{b.worker_name}</strong> • Customer: <strong className="text-black font-bold">{b.customer_name}</strong> • Area: {b.area_text}
                  </p>
                </div>

                <div className="text-xs font-bold text-black flex items-center gap-1 bg-[#faf7f2] border border-black px-2 py-1 rounded">
                  <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Scheduled: {b.requested_for || 'Today'}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs font-medium text-neutral-900 bg-[#faf7f2] p-3 rounded border border-black">
                "{b.description}"
              </p>

              {/* Quotation card if exists */}
              {b.quotation && (
                <div className="p-4 rounded-md bg-[#faf7f2] border-2 border-black space-y-2.5 shadow-hard-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-black">
                      <Receipt className="w-4 h-4 stroke-[2.5]" />
                      <span>Itemised Estimate (कोटेशन)</span>
                    </div>
                    <div className="text-base font-black text-black bg-[#facc15] px-2 py-0.5 rounded border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                      ₹{(b.quotation.total_paise / 100).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-neutral-700 italic">"{b.quotation.note}"</p>

                  <div className="divide-y divide-black/20 border-t-2 border-black pt-2 text-xs">
                    {b.quotation.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1 text-black font-semibold text-[11px]">
                        <span>{item.label} (x{item.qty})</span>
                        <span className="font-mono font-bold">₹{((item.unit_paise * item.qty) / 100).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Accept quotation button for customer */}
                  {b.status === 'quoted' && currentUser?.role === 'customer' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleAcceptQuote(b)}
                        className="btn-brutal-primary px-4 py-2 text-xs font-black"
                      >
                        Accept Quotation (कोटेशन स्वीकार करें)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Workflow Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-neutral-600 font-mono font-bold">ID: {b.id}</div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Worker sends quote */}
                  {(b.status === 'requested' || b.status === 'worker_accepted') && currentUser?.role === 'worker' && (
                    <button
                      onClick={() => setSelectedBookingForQuote(b)}
                      className="btn-brutal-primary px-3.5 py-1.5 text-xs"
                    >
                      + Send Itemised Quote
                    </button>
                  )}

                  {/* Worker starts job */}
                  {b.status === 'accepted' && currentUser?.role === 'worker' && (
                    <button
                      onClick={() => handleStatusUpdate(b.id, 'in_progress')}
                      className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 bg-[#facc15]"
                    >
                      <Play className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Start Job (काम शुरू करें)</span>
                    </button>
                  )}

                  {/* Worker marks done */}
                  {b.status === 'in_progress' && currentUser?.role === 'worker' && (
                    <button
                      onClick={() => handleStatusUpdate(b.id, 'work_done')}
                      className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 bg-[#99f6e4]"
                    >
                      <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mark Work Done (काम पूरा हुआ)</span>
                    </button>
                  )}

                  {/* Customer confirms completion */}
                  {b.status === 'work_done' && currentUser?.role === 'customer' && (
                    <button
                      onClick={() => handleStatusUpdate(b.id, 'completed')}
                      className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 bg-[#bbf7d0]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Confirm Satisfactory Completion</span>
                    </button>
                  )}

                  {/* Customer leaves review */}
                  {b.status === 'completed' && currentUser?.role === 'customer' && (
                    <button
                      onClick={() => setReviewBooking(b)}
                      className="btn-brutal-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5 bg-[#fef08a]"
                    >
                      <Star className="w-3.5 h-3.5 fill-black stroke-[2.5]" />
                      <span>Rate & Review (समीक्षा दें)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Worker Quotation Builder */}
      {selectedBookingForQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
            <button
              onClick={() => setSelectedBookingForQuote(null)}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-lg font-black text-black mb-1">Create Itemised Quotation</h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">
              Enter transparent estimates for diagnosis, parts, and labor.
            </p>

            <form onSubmit={handleSendQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-1">Quotation Note</label>
                <input
                  type="text"
                  required
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="e.g. Havells MCB replacement with testing and diagnosis"
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md px-3 py-2 text-xs text-black font-bold focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              {/* Line items list */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black">Quotation Line Items</label>
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={item.label}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].label = e.target.value;
                        setQuoteItems(copy);
                      }}
                      className="flex-1 bg-[#faf7f2] border-2 border-black rounded-md px-2.5 py-1.5 text-xs text-black font-bold"
                    />
                    <input
                      type="number"
                      required
                      min={10}
                      value={item.unit_rs}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].unit_rs = parseInt(e.target.value) || 0;
                        setQuoteItems(copy);
                      }}
                      className="w-24 bg-[#faf7f2] border-2 border-black rounded-md px-2.5 py-1.5 text-xs text-black font-mono font-bold text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                      className="p-1.5 rounded-md border border-black bg-rose-100 hover:bg-rose-200 text-black"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setQuoteItems([...quoteItems, { label: 'Additional Material / Service', qty: 1, unit_rs: 150 }])}
                  className="text-xs text-black hover:underline font-black bg-[#faf7f2] border-2 border-black px-2.5 py-1 rounded inline-block"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-[#fef08a] rounded-md flex items-center justify-between text-xs font-black text-black border-2 border-black shadow-hard-sm">
                <span>Total Estimated Price:</span>
                <span className="font-mono text-sm bg-black text-[#facc15] px-2 py-0.5 rounded">
                  ₹{quoteItems.reduce((acc, it) => acc + (it.unit_rs * it.qty), 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForQuote(null)}
                  className="btn-brutal-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingQuote}
                  className="btn-brutal-primary px-5 py-2 text-xs"
                >
                  {sendingQuote ? 'Sending...' : 'Send Quote to Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Review */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-none">
          <div className="w-full max-w-lg bg-white border-[3px] border-black rounded-lg p-6 shadow-hard-xl relative">
            <button
              onClick={() => setReviewBooking(null)}
              className="absolute top-4 right-4 p-1 rounded-md border-2 border-black bg-white hover:bg-neutral-100"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            <h3 className="font-display text-lg font-black text-black mb-1">
              Rate Service by {reviewBooking.worker_name}
            </h3>
            <p className="text-xs font-medium text-neutral-600 mb-4">
              Your honest review helps other local customers find trusted craftsmanship.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-black mb-2">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 stroke-[2] ${rating >= star ? 'text-black fill-[#facc15]' : 'text-neutral-400 fill-neutral-200'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-black text-black ml-2 bg-[#fef08a] border border-black px-2 py-0.5 rounded">{rating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Review Comments</label>
                <textarea
                  rows={3}
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details of the work done, punctuality, and quality..."
                  className="w-full bg-[#faf7f2] border-2 border-black rounded-md p-3 text-xs text-black font-medium placeholder-neutral-500 focus:bg-white focus:outline-none shadow-hard-sm"
                />
              </div>

              <div className="p-3 bg-[#bbf7d0] border-2 border-black rounded-md text-xs font-bold text-black shadow-hard-sm">
                Submitting this completed review automatically marks the worker's skill claim as "Customer-confirmed".
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="btn-brutal-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-brutal-primary px-5 py-2 text-xs"
                >
                  {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
