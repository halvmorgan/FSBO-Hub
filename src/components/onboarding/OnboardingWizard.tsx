import React, { useState } from 'react';
import { PropertyProfile, PhotoItem } from '../../types';
import { MapPin, Camera, Home, Compass, Calendar, ArrowRight, ArrowLeft, Check, Sparkles, Upload } from 'lucide-react';
import { savePhotoToDB } from '../../lib/indexedDb';

interface OnboardingWizardProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  onComplete: (updatedProperty: PropertyProfile, updatedPhotos: PhotoItem[]) => void;
  onClose: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  property,
  photos,
  onComplete,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PropertyProfile>({ ...property });
  const [wizardPhotos, setWizardPhotos] = useState<PhotoItem[]>([...photos]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: PhotoItem = {
          id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          dataUrl,
          caption: file.name.replace(/\.[^/.]+$/, ''),
          isCover: wizardPhotos.length === 0,
          roomCategory: 'Exterior',
          order: wizardPhotos.length,
        };
        await savePhotoToDB(newPhoto.id, dataUrl, {
          caption: newPhoto.caption,
          isCover: newPhoto.isCover,
        });
        setWizardPhotos((prev) => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = () => {
    onComplete(formData, wizardPhotos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A44]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0F2A44] to-[#1E6F80] p-6 text-white text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5 text-[#F2B544]" />
            <span>Welcome to FSBO Compass</span>
          </div>
          <h2 className="text-2xl font-bold font-heading">Let's set up your home sale</h2>
          <p className="text-xs text-slate-200 mt-1 max-w-md mx-auto">
            Takes less than 2 minutes. You can change everything later whenever you want.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  step === s
                    ? 'bg-[#FF6B5A] text-white shadow'
                    : step > s
                    ? 'bg-[#1FA67A] text-white'
                    : 'bg-white/10 text-slate-300'
                }`}
              >
                {step > s ? <Check className="w-3 h-3" /> : <span>{s}</span>}
                <span className="hidden sm:inline">
                  {s === 1 ? 'Address' : s === 2 ? 'Photos' : s === 3 ? 'Basic Facts' : 'Target Date'}
                </span>
              </div>
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
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Michigan"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
                    />
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

              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#FF6B5A]/50 hover:border-[#FF6B5A] bg-orange-50/30 dark:bg-slate-800/50 rounded-2xl cursor-pointer transition-all">
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
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#0F2A44] dark:text-white font-bold text-lg mb-1">
                <Calendar className="w-5 h-5 text-[#FF6B5A]" />
                <span>Step 4: Target List Date</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When are you aiming to go live with your listing and yard sign? Having a target date keeps your prep on track.
              </p>

              <div className="pt-2">
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

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 mt-4 text-xs">
                <strong>You're ready!</strong> Next, we'll calculate your circular Ready-to-List score, show your 3 highest-priority tasks, and generate your custom property website.
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
                Skip for now
              </button>
            )}
          </div>

          <div>
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
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-lg shadow-[#FF6B5A]/25"
              >
                Enter FSBO Compass
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
