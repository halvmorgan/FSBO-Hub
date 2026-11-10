import React, { useState } from 'react';
import {
  User,
  CreditCard,
  Download,
  Trash2,
  Shield,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Mail,
  Zap,
} from 'lucide-react';
import JSZip from 'jszip';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPhotosFromDB } from '../../lib/indexedDb';
import { PlanType } from '../../types/saas';

interface SectionAccountProps {
  onOpenPricing?: () => void;
}

export const SectionAccount: React.FC<SectionAccountProps> = ({ onOpenPricing }) => {
  const {
    currentUser,
    userProfile,
    saasConfig,
    userProperties,
    activeProperty,
    sendVerification,
    deleteUserAccount,
  } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showPortalNotice, setShowPortalNotice] = useState(() => {
    return new URLSearchParams(window.location.search).get('portal_notice') === 'true';
  });

  const planType: PlanType = userProfile?.plan || 'trial';
  const planConfig = saasConfig.plans[planType] || saasConfig.plans.trial;
  const creditsUsed = userProfile?.aiCreditsUsed || 0;
  const creditsMax = planConfig.aiCreditsMonthly;
  const creditsPercent = Math.min(100, Math.round((creditsUsed / creditsMax) * 100));

  // Handle Stripe Customer Portal
  const handleManageBilling = async () => {
    if (!currentUser) {
      setDemoNotice('Billing is available after you create an account.');
      return;
    }

    try {
      setPortalLoading(true);
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: userProfile?.stripeCustomerId,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        if (onOpenPricing) onOpenPricing();
      }
    } catch (err) {
      console.error('Portal error:', err);
      if (onOpenPricing) onOpenPricing();
    } finally {
      setPortalLoading(false);
    }
  };

  // Full Data Export (JSON + ZIP of all photos)
  const handleExportData = async () => {
    try {
      setExporting(true);
      const zip = new JSZip();

      // Gather complete account JSON
      const exportObject = {
        exportedAt: new Date().toISOString(),
        userProfile,
        properties: userProperties,
        activeProperty,
      };

      zip.file('fsbo_command_center_account.json', JSON.stringify(exportObject, null, 2));

      // Fetch all photos from IndexedDB and bundle
      try {
        const photos = await getAllPhotosFromDB();
        const photosFolder = zip.folder('photos');
        if (photosFolder && photos.length > 0) {
          photos.forEach((photo, idx) => {
            if (photo.dataUrl && photo.dataUrl.includes('base64,')) {
              const base64Data = photo.dataUrl.split('base64,')[1];
              photosFolder.file(`photo_${idx + 1}_${photo.name || 'image'}.jpg`, base64Data, {
                base64: true,
              });
            }
          });
        }
      } catch (photoErr) {
        console.warn('Could not export indexedDb photos to zip:', photoErr);
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `fsbo_data_export_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Could not export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);
      await deleteUserAccount();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendVerification();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (err) {
      console.error('Error sending verification:', err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F2A44] dark:text-white">
          Account & Subscription
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Manage your seller profile, billing tier, AI credits, and data exports.
        </p>
      </div>

      {showPortalNotice && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Customer billing portal session complete. Manage your plan and payment details below.</span>
          </div>
          <button
            onClick={() => {
              setShowPortalNotice(false);
              const url = new URL(window.location.href);
              url.searchParams.delete('portal_notice');
              window.history.replaceState({}, '', url.pathname + (url.search || ''));
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs shrink-0 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {demoNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <span>{demoNotice}</span>
          <button
            onClick={() => setDemoNotice(null)}
            className="font-bold underline ml-2 text-amber-800 hover:text-amber-950"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card (1 span) */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F2A44] to-[#1E6F80] text-white flex items-center justify-center font-bold text-xl shadow-md">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                {userProfile?.displayName || 'Homeowner'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[180px]">
                {userProfile?.email}
              </p>
              {userProfile?.role === 'admin' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>Email Status</span>
              {currentUser?.emailVerified ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <button
                  onClick={handleSendVerification}
                  className="text-[#FF6B5A] hover:underline font-semibold"
                >
                  {verificationSent ? 'Link Sent!' : 'Verify Email'}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>Member Since</span>
              <span className="font-mono text-stone-700 dark:text-stone-300">
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString()
                  : 'Recent'}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>Properties Managed</span>
              <span className="font-bold text-[#0F2A44] dark:text-white">
                {userProperties.length} of {planConfig.propertyLimit}
              </span>
            </div>
          </div>
        </div>

        {/* Plan & Usage Card (2 spans) */}
        <div className="md:col-span-2 bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Current Plan
                </span>
                <h2 className="text-2xl font-heading font-extrabold text-[#0F2A44] dark:text-white flex items-center gap-2 mt-0.5">
                  {planConfig.name}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {userProfile?.planStatus === 'trialing' ? 'Free Trial' : 'Active'}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="px-4 py-2 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-[#0F2A44] dark:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{portalLoading ? 'Loading...' : 'Manage Billing'}</span>
                </button>

                {onOpenPricing && (
                  <button
                    onClick={onOpenPricing}
                    className="px-4 py-2 bg-[#FF6B5A] hover:bg-[#e85a4a] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Change Plan
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              {userProfile?.trialEndsAt && userProfile.planStatus === 'trialing' && (
                <>Trial period ends on: {new Date(userProfile.trialEndsAt).toLocaleDateString()}</>
              )}
              {userProfile?.planExpiresAt && (
                <>Access active through: {new Date(userProfile.planExpiresAt).toLocaleDateString()}</>
              )}
            </p>

            {/* AI Credits Meter */}
            <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  AI Intelligence Credits
                </span>
                <span>
                  {creditsUsed} / {creditsMax} used
                </span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    creditsPercent > 85 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-[#FF6B5A]'
                  }`}
                  style={{ width: `${creditsPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                Credits power the AI Photo Coach, Listing Writer, Fair Housing Scanner, and Municipal Rule Finder.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-2 text-xs text-stone-500">
            {planConfig.features.slice(0, 3).map((feat, i) => (
              <span key={i} className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1FA67A]" />
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Data Export & Account Safety Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-[#0F2A44] dark:text-white">
            Export My Data & Photos
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-6 leading-relaxed">
            Download an offline ZIP backup containing all your property profiles, listing copies, showing records, offer worksheets, and high-resolution photos.
          </p>

          <button
            onClick={handleExportData}
            disabled={exporting}
            className="w-full py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[#0F2A44] dark:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <span>Preparing ZIP Archive...</span>
            ) : exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download All Data (.ZIP)</span>
              </>
            )}
          </button>
        </div>

        {/* Delete Account Card */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-red-200 dark:border-red-950/40">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-bold text-lg text-red-600 dark:text-red-400">
            Delete Account & Property Data
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-6 leading-relaxed">
            Permanently delete your user profile, active properties, uploaded photos, and any published website links. This action cannot be reversed.
          </p>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 px-4 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Delete Account...</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-bold text-[#0F2A44] dark:text-white text-center">
              Are you absolutely sure?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 text-center mt-2 leading-relaxed">
              This will permanently delete your seller profile, all {userProperties.length} property record(s), and unpublish your public website.
            </p>

            {deleteError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs">
                {deleteError}
              </div>
            )}

            <div className="mt-6">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Type <strong className="text-red-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-[#0F2A44] dark:text-white"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
