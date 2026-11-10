import React, { useState } from 'react';
import { PropertyProfile, PhotoItem, ActiveTab } from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import {
  savePhotoToDB,
  deletePhotoFromDB,
} from '../../lib/indexedDb';
import {
  Camera,
  Upload,
  Sparkles,
  Star,
  Trash2,
  MoveUp,
  MoveDown,
  Video,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Lightbulb,
  CheckSquare,
  Square,
  HelpCircle,
} from 'lucide-react';

interface SectionPhotosProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  onUpdatePhotos: (photos: PhotoItem[]) => void;
  onUpdateProperty: (prop: PropertyProfile) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionPhotos: React.FC<SectionPhotosProps> = ({
  property,
  photos,
  onUpdatePhotos,
  onUpdateProperty,
  onNavigate,
}) => {
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [coachErrors, setCoachErrors] = useState<Record<string, string>>({});
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [walkthroughScript, setWalkthroughScript] = useState<any | null>(null);

  // Shot list interactive checklist
  const [shotList, setShotList] = useState<Record<string, boolean>>({
    'Front Exterior (Straight & Angled)': true,
    'Back Exterior & Deck': true,
    'Kitchen (Wide Angle)': true,
    'Kitchen (Island / Finishes close-up)': true,
    'Living Room': true,
    'Primary Bedroom Suite': false,
    'Primary Ensuite Bathroom': false,
    'Secondary Bedrooms': false,
    'Hallway / Powder Bath': false,
    'Finished Basement / Rec Room': false,
    'Garage & Workshop': false,
    'Backyard & Property Line': false,
    'Best Architectural Feature': false,
    'Drone Aerial (if lot is a selling point)': false,
    'Floor Plan Layout Graphic': false,
  });

  // Prep checklist
  const [prepChecklist, setPrepChecklist] = useState<Record<string, boolean>>({
    'Declutter all kitchen counters (leave max 1 appliance)': true,
    'Deep clean and mop hard surface floors': true,
    'Open all window blinds fully for maximum natural light': true,
    'Turn on every single interior light and lamp': true,
    'Shoot in daytime (10 AM to 2 PM is ideal)': true,
    'Hide all family photos, diplomas, and personal paperwork': false,
    'Put all toilet lids down in all bathrooms': true,
    'Remove vehicles from driveway and front curb': false,
    'Mow lawn and edge walkway': true,
  });

  const toggleShotItem = (item: string) => {
    setShotList((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const togglePrepItem = (item: string) => {
    setPrepChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // Upload photos
  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newItems: PhotoItem[] = [];

    for (const file of files) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const dataUrl = evt.target?.result as string;
          const photo: PhotoItem = {
            id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            dataUrl,
            caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            isCover: photos.length === 0 && newItems.length === 0,
            roomCategory: 'Interior',
            order: photos.length + newItems.length,
          };
          await savePhotoToDB(photo.id, dataUrl, {
            caption: photo.caption,
            isCover: photo.isCover,
          });
          newItems.push(photo);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    onUpdatePhotos([...photos, ...newItems]);
  };

  // Set Cover Photo
  const handleSetCover = async (id: string) => {
    const updated = photos.map((p) => ({
      ...p,
      isCover: p.id === id,
    }));
    onUpdatePhotos(updated);
    for (const p of updated) {
      await savePhotoToDB(p.id, p.dataUrl, { caption: p.caption, isCover: p.isCover });
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (id: string) => {
    await deletePhotoFromDB(id);
    const updated = photos.filter((p) => p.id !== id);
    if (updated.length > 0 && !updated.some((p) => p.isCover)) {
      updated[0].isCover = true;
    }
    onUpdatePhotos(updated);
  };

  // Caption change
  const handleCaptionChange = (id: string, caption: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, caption } : p));
    onUpdatePhotos(updated);
  };

  // Reorder photos
  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const copy = [...photos];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onUpdatePhotos(copy);
  };

  // AI Photo Coach
  const handleRunPhotoCoach = async (photo: PhotoItem) => {
    setAnalyzingPhotoId(photo.id);
    setCoachErrors((prev) => {
      const copy = { ...prev };
      delete copy[photo.id];
      return copy;
    });
    try {
      const res = await fetch('/api/gemini/photo-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photo.dataUrl,
          caption: photo.caption,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `AI review unavailable (${res.status})`);
      }
      const data = await res.json();

      const updated = photos.map((p) =>
        p.id === photo.id
          ? {
              ...p,
              coachQuality: data.quality || 'Good',
              coachTip: data.tip || 'Looking good!',
              analyzed: true,
            }
          : p
      );
      onUpdatePhotos(updated);
    } catch (err: any) {
      console.error(err);
      setCoachErrors((prev) => ({
        ...prev,
        [photo.id]: err.message || 'AI coach review failed. Please try again.',
      }));
    } finally {
      setAnalyzingPhotoId(null);
    }
  };

  // Generate Video Walkthrough Script
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    setScriptError(null);
    try {
      const res = await fetch('/api/gemini/walkthrough-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || `AI script generation failed (${res.status})`);
      }
      const data = await res.json();
      setWalkthroughScript(data);
    } catch (err: any) {
      console.error(err);
      setScriptError(err.message || 'Script generation failed. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Photos are the #1 factor in whether buyers request a tour. Over 95% of homebuyers view online photos first. Good lighting, wide level angles, and decluttered counters can add $5,000–$15,000 to perceived value."
        nextLabel="Pricing & Comps"
        onNext={() => onNavigate('pricing')}
      />

      {/* Main Studio Grid: Photo Manager */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#FF6B5A]" />
              Photo Gallery & AI Coach
            </h3>
            <p className="text-xs text-slate-500">
              Drag, reorder, designate your primary cover shot, and run Gemini AI inspection for composition feedback.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#FF6B5A] hover:bg-[#fa5644] cursor-pointer shadow-md shadow-[#FF6B5A]/25 transition-all">
            <Upload className="w-4 h-4" />
            <span>Upload Photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUploadPhotos}
              className="hidden"
            />
          </label>
        </div>

        {/* Gallery Cards */}
        {photos.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#0F2A44] dark:text-white">No photos uploaded yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click the "Upload Photos" button above to add shots of the front, kitchen, living room, and master bedroom.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative rounded-2xl border overflow-hidden transition-all bg-slate-50 dark:bg-slate-800/70 flex flex-col justify-between ${
                  photo.isCover
                    ? 'border-[#FF6B5A] ring-2 ring-[#FF6B5A]/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700/60'
                }`}
              >
                {/* Photo Image View */}
                <div className="relative aspect-video bg-black/5 overflow-hidden group">
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {photo.isCover && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6B5A] text-white shadow">
                        Cover Photo
                      </span>
                    )}
                    {photo.coachQuality && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow ${
                          photo.coachQuality === 'Great'
                            ? 'bg-emerald-500 text-white'
                            : photo.coachQuality === 'Good'
                            ? 'bg-[#F2B544] text-[#0F2A44]'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {photo.coachQuality}
                      </span>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMovePhoto(index, 'up')}
                      className="p-1 text-white hover:text-[#F2B544] disabled:opacity-30"
                      title="Move backward"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1}
                      onClick={() => handleMovePhoto(index, 'down')}
                      className="p-1 text-white hover:text-[#F2B544] disabled:opacity-30"
                      title="Move forward"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-1 text-white hover:text-red-400"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Caption and Coach feedback */}
                <div className="p-3.5 space-y-2.5">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="Add room caption..."
                    className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-[#FF6B5A]"
                  />

                  {photo.coachTip && (
                    <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-slate-900/50 border border-orange-100 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6B5A] shrink-0 mt-0.5" />
                      <span>{photo.coachTip}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    {!photo.isCover ? (
                      <button
                        type="button"
                        onClick={() => handleSetCover(photo.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#FF6B5A]"
                      >
                        <Star className="w-3.5 h-3.5" /> Set as Cover
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-[#FF6B5A]">Primary Cover</span>
                    )}

                    <button
                      type="button"
                      disabled={analyzingPhotoId === photo.id}
                      onClick={() => handleRunPhotoCoach(photo)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F2A44] dark:text-[#F2B544] hover:underline"
                    >
                      {analyzingPhotoId === photo.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Coaching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          AI Coach Review
                        </>
                      )}
                    </button>
                  </div>

                  {coachErrors[photo.id] && (
                    <div className="text-[11px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950/40 p-2 rounded-lg border border-red-200 dark:border-red-900/50">
                      {coachErrors[photo.id]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Shot List & Prep Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended Shot List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                Interactive Shot List
              </h3>
              <p className="text-xs text-slate-500">Every angle required for an MLS-quality portfolio.</p>
            </div>
            <span className="text-xs font-bold text-[#FF6B5A]">
              {Object.values(shotList).filter(Boolean).length} / {Object.keys(shotList).length} Done
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(shotList).map(([item, checked]) => (
              <div
                key={item}
                onClick={() => toggleShotItem(item)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  checked
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{item}</span>
                </div>
                {checked && <span className="text-[10px] font-bold text-emerald-600">Captured</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Photo Prep Checklist */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                Staging & Prep Checklist
              </h3>
              <p className="text-xs text-slate-500">Do these before snapping your first shot.</p>
            </div>
            <span className="text-xs font-bold text-[#1FA67A]">
              {Object.values(prepChecklist).filter(Boolean).length} / {Object.keys(prepChecklist).length}
            </span>
          </div>

          <div className="space-y-2">
            {Object.entries(prepChecklist).map(([item, checked]) => (
              <div
                key={item}
                onClick={() => togglePrepItem(item)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  checked
                    ? 'bg-slate-100 dark:bg-slate-800/80 line-through text-slate-400'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 text-xs font-medium">
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video & Walkthrough Script Generator */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-slate-800 text-red-600 flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                Video Walkthrough & Floor Plan
              </h3>
              <p className="text-xs text-slate-500">
                Buyers love video tours. Paste a YouTube or Facebook video URL to embed it on your site.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isGeneratingScript}
            onClick={handleGenerateScript}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] dark:hover:bg-[#fa5644] transition-all disabled:opacity-50"
          >
            {isGeneratingScript ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Drafting Script...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#F2B544]" />
                Generate Walkthrough Script
              </>
            )}
          </button>
        </div>

        {scriptError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium">
            {scriptError}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            YouTube or Facebook Walkthrough URL
          </label>
          <input
            type="url"
            value={property.walkthroughVideoUrl}
            onChange={(e) => onUpdateProperty({ ...property, walkthroughVideoUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
          />
        </div>

        {/* Script Output */}
        {walkthroughScript && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#0F2A44] dark:text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-[#FF6B5A]" />
                {walkthroughScript.title || 'Room-by-Room Smartphone Walkthrough'}
              </h4>
              <span className="text-xs font-bold text-slate-500">
                Duration: {walkthroughScript.estimatedDuration || '75s'}
              </span>
            </div>

            {walkthroughScript.filmingTips && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
                <strong>Pro Tips:</strong> {walkthroughScript.filmingTips.join(' • ')}
              </div>
            )}

            <div className="space-y-2 pt-2">
              {walkthroughScript.scenes?.map((scene: any) => (
                <div
                  key={scene.sceneNumber}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-[#0F2A44] dark:text-white">
                    <span>
                      Scene {scene.sceneNumber}: {scene.location}
                    </span>
                    <span className="text-slate-400 text-[11px]">{scene.duration}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    <strong>Camera Motion:</strong> {scene.cameraMotion}
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 italic bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                    "{scene.spokenScript}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pro Photographer Hiring Advice Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0F2A44]/5 to-[#F2B544]/15 border border-[#F2B544]/30 dark:border-slate-800 flex items-start gap-3.5">
        <Lightbulb className="w-5 h-5 text-[#D99B26] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#0F2A44] dark:text-white">
            Thinking about hiring a real estate photographer?
          </h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            In Michigan and most states, professional real estate photographers charge roughly $150 to $300 for 25 high-dynamic-range (HDR) photos including drone aerials. Because you are saving $10,000+ on listing agent commissions, spending $200 on crisp photography is the single highest-ROI marketing investment you can make. Ask for "MLS-ready high resolution digital files with copyright release".
          </p>
        </div>
      </div>
    </div>
  );
};
