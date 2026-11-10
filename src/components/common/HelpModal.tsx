import React, { useState } from 'react';
import { X, HelpCircle, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, saasConfig } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const col = collection(db, 'supportMessages');
      await addDoc(col, {
        uid: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || 'guest@example.com',
        userName: userProfile?.displayName || 'Homeowner',
        subject: subject || 'General Question',
        message,
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        setSubject('');
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Error submitting help request:', err);
      setError('Could not send message. Please try again or email ' + saasConfig.supportEmail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative border border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-heading font-extrabold text-[#0F2A44] dark:text-white">
              FSBO Support & Advice
            </h3>
            <p className="text-xs text-stone-500">
              Need help with a step or having technical trouble?
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#1FA67A] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#0F2A44] dark:text-white">
              Message Received!
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Our team will review your question and respond to {currentUser?.email || 'your email'}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Topic / Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question about Michigan Seller Disclosures"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-[#0F2A44] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                How can we help? *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you need help with..."
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-[#0F2A44] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-stone-400">
                Direct email: <a href={`mailto:${saasConfig.supportEmail}`} className="text-[#FF6B5A] hover:underline">{saasConfig.supportEmail}</a>
              </span>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#FF6B5A] hover:bg-[#e85a4a] text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
