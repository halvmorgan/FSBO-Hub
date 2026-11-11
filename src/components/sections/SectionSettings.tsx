import React, { useState } from 'react';
import { Settings, PropertyProfile, PhotoItem, ActiveTab } from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { getAllPhotosFromDB, clearAllDB, savePhotoToDB } from '../../lib/indexedDb';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Sparkles,
  ShieldCheck,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

interface SectionSettingsProps {
  settings: Settings;
  property: PropertyProfile;
  photos: PhotoItem[];
  allAppData: Record<string, any>;
  onUpdateSettings: (settings: Settings) => void;
  onUpdateProperty: (property: PropertyProfile) => void;
  onRestoreAllData: (data: any) => void;
  onRelaunchWizard: () => void;
  onResetDefaults: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

import { US_STATES } from '../../lib/stateDisclosures';

export const SectionSettings: React.FC<SectionSettingsProps> = ({
  settings,
  property,
  photos,
  allAppData,
  onUpdateSettings,
  onUpdateProperty,
  onRestoreAllData,
  onRelaunchWizard,
  onResetDefaults,
  onNavigate,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFieldChange = (field: keyof Settings, value: any) => {
    onUpdateSettings({ ...settings, [field]: value });
  };

  const handlePropertyFieldChange = (field: keyof PropertyProfile, value: any) => {
    onUpdateProperty({ ...property, [field]: value });
  };

  // Export Full JSON Backup including IndexedDB photos
  const handleExportBackup = async () => {
    const dbPhotos = await getAllPhotosFromDB();
    const backupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ...allAppData,
      photos: dbPhotos.length > 0 ? dbPhotos : photos,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FSBO-Command-Center-Backup-${property.address.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Full JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.photos && Array.isArray(parsed.photos)) {
          for (const p of parsed.photos) {
            if (p.id && p.dataUrl) {
              await savePhotoToDB(p.id, p.dataUrl, { caption: p.caption, isCover: p.isCover });
            }
          }
        }
        onRestoreAllData(parsed);
        setImportStatus('Backup successfully restored!');
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        setImportStatus('Error restoring backup file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip={`Your settings power automated showing notifications, disclosure laws (${settings.state || property.state || 'your state'}), and backup exports so your hard work is never lost.`}
        nextLabel="Return to Dashboard"
        onNext={() => onNavigate('dashboard')}
      />

      {importStatus && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs font-bold text-emerald-800 dark:text-emerald-200">
          {importStatus}
        </div>
      )}

      {/* Seller Contact & State Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <SettingsIcon className="w-5 h-5 text-[#FF6B5A]" />
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Seller Contact & Jurisdiction
            </h3>
            <p className="text-xs text-slate-500">
              Information displayed to buyers on your property website and yard flyers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Seller Name(s)
            </label>
            <input
              type="text"
              value={settings.sellerName}
              onChange={(e) => handleFieldChange('sellerName', e.target.value)}
              placeholder="e.g. Jordan & Taylor Smith"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Direct Phone Number
            </label>
            <input
              type="tel"
              value={settings.sellerPhone}
              onChange={(e) => handleFieldChange('sellerPhone', e.target.value)}
              placeholder="(248) 555-0192"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Direct Contact Email
            </label>
            <input
              type="email"
              value={settings.sellerEmail}
              onChange={(e) => handleFieldChange('sellerEmail', e.target.value)}
              placeholder="taylor@email.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Governing State
            </label>
            <select
              value={settings.state || property.state || 'Michigan'}
              onChange={(e) => {
                handleFieldChange('state', e.target.value);
                handlePropertyFieldChange('state', e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            >
              {US_STATES.map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Property Address */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Property Street Address
            </label>
            <input
              type="text"
              value={property.address}
              onChange={(e) => handlePropertyFieldChange('address', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={property.city}
              onChange={(e) => handlePropertyFieldChange('city', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={property.zip}
              onChange={(e) => handlePropertyFieldChange('zip', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Integration & Form Webhook URL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Website Form Webhook Integration
            </h3>
            <p className="text-xs text-slate-500">
              Optional endpoint receiving tour requests from your single-page property website.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Form Webhook URL
          </label>
          <input
            type="url"
            value={settings.webhookUrl}
            onChange={(e) => handleFieldChange('webhookUrl', e.target.value)}
            placeholder="https://formspree.io/f/... or Zapier webhook (optional, falls back to mailto:)"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            If left blank, showing requests automatically launch the buyer's email app addressed to {settings.sellerEmail}.
          </p>
        </div>
      </div>

      {/* Pricing External Tools (Editable URLs) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ExternalLink className="w-5 h-5 text-[#F2B544]" />
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Pricing Action Card URLs
            </h3>
            <p className="text-xs text-slate-500">
              Customize the destination links for the two pricing call-to-action cards in the Pricing section.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              "Get the Home Value Worksheet" URL
            </label>
            <input
              type="url"
              value={settings.homeValueWorksheetUrl}
              onChange={(e) => handleFieldChange('homeValueWorksheetUrl', e.target.value)}
              placeholder="https://ecenturyappraisal.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              "Order an Independent Appraisal" URL
            </label>
            <input
              type="url"
              value={settings.appraisalOrderUrl}
              onChange={(e) => handleFieldChange('appraisalOrderUrl', e.target.value)}
              placeholder="https://ecenturyappraisal.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Backup & Data Persistence Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Download className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Complete Data Backup & Recovery
            </h3>
            <p className="text-xs text-slate-500">
              All data is saved in your browser (IndexedDB for photos, localStorage for facts). Export a single JSON backup to keep your files secure or transfer to another device.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] dark:hover:bg-[#fa5644] transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Export Backup (One JSON File)</span>
          </button>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-all border border-slate-300 dark:border-slate-700">
            <Upload className="w-4 h-4" />
            <span>Import Backup JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Relaunch Wizard & Reset */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-[#0F2A44] dark:text-white flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-[#FF6B5A]" />
            Onboarding Wizard & Sample Reset
          </h4>
          <p className="text-xs text-slate-500">
            You can re-run the 4-step setup wizard anytime or reset to default sample data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRelaunchWizard}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F2A44] bg-[#F2B544] hover:bg-[#e6a835]"
          >
            Relaunch Wizard
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset app to default sample data?')) {
                onResetDefaults();
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
