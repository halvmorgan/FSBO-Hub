import React, { useState } from 'react';
import { PropertyProfile, PhotoItem } from '../../types';
import { MapPin, Camera, Home, Compass, Calendar, ArrowRight, ArrowLeft, Check, Sparkles, Upload, X, Loader2 } from 'lucide-react';
import { savePhotoToDB } from '../../lib/indexedDb';
import { US_STATES, detectStateFromAddress } from '../../lib/stateDisclosures';

interface OnboardingWizardProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  isEditing?: boolean;
  onComplete: (updatedProperty: PropertyProfile, updatedPhotos: PhotoItem[]) => Promise<void> | void;
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  property,
  photos,
  isEditing = false,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PropertyProfile>({ ...property });
  const [wizardPhotos, setWizardPhotos] = useState<PhotoItem[]>([...photos]);
  const [saving, setSaving] = useState(false);

  const addWizardPhotoFiles = (fileList: FileList | File[] | null) => {
    const files = Array.from(fileList || []).filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name)
    );
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: PhotoItem = {
          id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          dataUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          isCover: false,
          roomCategory: 'Exterior',
          order: 0,
        };
        // Show the photo right away; the local backup copy must never block it
        setWizardPhotos((prev) => [
          ...prev,
          { ...newPhoto, isCover: prev.length === 0, order: prev.length },
        ]);
        try {
          await savePhotoToDB(newPhoto.id, dataUrl, { caption: newPhoto.caption });
        } catch (dbErr) {
          console.warn('Local photo backup failed (continuing):', dbErr);
        }
      };
      reader.onerror = () => console.error('Could not read photo file:', file.name, reader.error);
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    addWizardPhotoFiles(files);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onComplete(formData, wizardPhotos);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A44]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0F2A44] to-[#1E6F80] p-6 text-white text-center relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5 text-[#F2B544]" />
            <span>{isEditing ? 'Edit Property Listing' : 'Welcome to FSBO Compass'}</span>
          </div>
          <h2 className="text-2xl font-bold font-heading">
            {isEditing ? 'Update your property details' : "Let's set up your home sale"}
          </h2>
          <p className="text-xs text-slate-200 mt-1 max-w-md mx-auto">
            {isEditing
              ? 'Save your changes anytime to update your My Listing page.'
              : 'Takes less than 2 minutes. You can change everything later whenever you want.'}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[1, 2, 3, 4].map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStep(s)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  step === s
                    ? 'bg-[#FF6B5A] text-white shadow'
                    : step > s
                    ? 'bg-[#1FA67A] text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {step > s ? <Check className="w-3 h-3" /> : <span>{s}</span>}
                <span className="hidden sm:inline">
                  {s === 1 ? 'Address' : s === 2 ? 'Photos' : s === 3 ? 'Basic Facts' : 'Description & Date'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F2A44] dark:text-white font-bold text-lg mb-1">
                <MapPin className="w-5 h-5 text-[#FF6B5A]" />
                <span>Step 1: Where is your home located?</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This is used to populate your property website, listing sites, and search public records.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => {
                      const newAddr = e.target.value;
                      const detected = detectStateFromAddress(newAddr);
                      if (detected && detected !== formData.state) {
                        setFormData({ ...formData, address: newAddr, state: detected });
                      } else {
                        setFormData({ ...formData, address: newAddr });
                      }
                    }}
                    placeholder="e.g. 4288 Meadowview Drive"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Rochester Hills"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Property State <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.state || 'Michigan'}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F2A44] dark:text-white focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                    >
                      {US_STATES.map((st) => (
                        <option key={st.code} value={st.name}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="48306"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F2A44] dark:text-white font-bold text-lg mb-1">
                <Camera className="w-5 h-5 text-[#FF6B5A]" />
                <span>Step 2: Upload your first photos</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can upload a few photos now (like the front exterior or kitchen). You can always add, reorder, or edit captions later in the Studio.
              </p>

              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addWizardPhotoFiles(e.dataTransfer?.files || null);
                }}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#FF6B5A]/50 hover:border-[#FF6B5A] bg-orange-50/30 dark:bg-slate-800/50 rounded-2xl cursor-pointer transition-all">
                <Upload className="w-8 h-8 text-[#FF6B5A] mb-2 animate-bounce" />
                <span className="text-sm font-bold text-[#0F2A44] dark:text-white">
                  Click to select photos or drag and drop
                </span>
                <span className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {wizardPhotos.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {wizardPhotos.length} photo(s) selected:
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {wizardPhotos.map((p, idx) => (
                      <div key={p.id} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200">
                        <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#FF6B5A] text-white text-[9px] font-bold px-1 rounded">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F2A44] dark:text-white font-bold text-lg mb-1">
                <Home className="w-5 h-5 text-[#FF6B5A]" />
                <span>Step 3: What are the key facts?</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your best estimates. Gemini can also scan public assessor records in the AI Feature Finder.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Asking Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="435000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.beds || ''}
                    onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) || 0 })}
                    placeholder="4"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Baths
                  </label>
                  <input
                    type="number"
                    value={formData.bathsFull || ''}
                    onChange={(e) => setFormData({ ...formData, bathsFull: parseInt(e.target.value) || 0 })}
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Half Baths
                  </label>
                  <input
                    type="number"
                    value={formData.bathsHalf || ''}
                    onChange={(e) => setFormData({ ...formData, bathsHalf: parseInt(e.target.value) || 0 })}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Finished Sq Ft
                  </label>
                  <input
                    type="number"
                    value={formData.sqft || ''}
                    onChange={(e) => setFormData({ ...formData, sqft: parseInt(e.target.value) || 0 })}
                    placeholder="2450"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    value={formData.yearBuilt || ''}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) || 0 })}
                    placeholder="1998"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lot Size (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.lotSize || ''}
                    onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                    placeholder="e.g. 0.34 acres or 7,500 sq ft"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F2A44] dark:text-white font-bold text-lg mb-1">
                <Calendar className="w-5 h-5 text-[#FF6B5A]" />
                <span>Step 4: Description & Target Date</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add a short overview of what buyers will love about your home and your target list date.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Property Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell buyers about recent updates, favorite rooms, neighborhood highlights, and yard space..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Live Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetListDate}
                    onChange={(e) => setFormData({ ...formData, targetListDate: e.target.value })}
                    className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 mt-4 text-xs">
                <strong>You're ready!</strong> Next, you'll see your live buyer-facing property landing page, where you can preview, share your link, or explore all FSBO tools.
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-500 hover:underline"
              >
                {isEditing ? 'Cancel' : 'Skip for now'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing && step < 4 && (
              <button
                type="button"
                disabled={saving}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] dark:hover:bg-[#fa5644] transition-all shadow-md"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-lg shadow-[#FF6B5A]/25 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Listing...</span>
                  </>
                ) : (
                  <>
                    <span>{isEditing ? 'Save & View My Listing' : 'Save & View My Listing'}</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
