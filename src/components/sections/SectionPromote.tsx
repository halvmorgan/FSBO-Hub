import React, { useState } from 'react';
import {
  PromoteGroup,
  PropertyProfile,
  Settings,
  OpenHouseItem,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import {
  Megaphone,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  AlertTriangle,
  HeartHandshake,
  Target,
  Sparkles,
} from 'lucide-react';
import { getPropertyWebsiteUrl } from '../../lib/appUrl';

interface SectionPromoteProps {
  property: PropertyProfile;
  settings: Settings;
  groups: PromoteGroup[];
  openHouses: OpenHouseItem[];
  onUpdateGroups: (groups: PromoteGroup[]) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionPromote: React.FC<SectionPromoteProps> = ({
  property,
  settings,
  groups,
  openHouses,
  onUpdateGroups,
  onNavigate,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Add Group state
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupUrl, setNewGroupUrl] = useState('');
  const [newGroupPlatform, setNewGroupPlatform] = useState<PromoteGroup['platform']>('Facebook Group');

  const nextOH = openHouses[0];
  const ohText = nextOH
    ? `📅 Next Open House: ${nextOH.date} from ${nextOH.startTime} to ${nextOH.endTime}`
    : '📅 Private tours available by appointment';

  const slug = property.address
    ? property.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'my-home';
  const propertySiteUrl = getPropertyWebsiteUrl(slug);

  // Pre-formatted copy templates
  const localGroupPost = `🏡 FOR SALE BY OWNER in ${property.city}!\n📍 ${property.address}\n💰 $${property.price.toLocaleString()} • ${property.beds} Beds • ${property.bathsFull}.${property.bathsHalf} Baths • ${property.sqft.toLocaleString()} SqFt\n\n✨ Top Features:\n${property.specialNotes.filter(Boolean).map((n) => `• ${n}`).join('\n')}\n\n${ohText}\n👉 Full photo gallery, floor plan & showing requests:\n${propertySiteUrl}\n\nDirect contact with owners: ${settings.sellerPhone}`;

  const nextdoorPost = `Hi neighbors! We are listing our home at ${property.address} for sale by owner. Asking $${property.price.toLocaleString()} (${property.beds} bed / ${property.bathsFull} bath, ${property.sqft} sqft). ${ohText}. If you know someone looking to move into ${property.city} near our great schools, please feel free to share our site: ${propertySiteUrl}. Thanks!`;

  const friendsFamilyKit = `Hey! We just put our house on the market ourselves at ${property.address}. Here is our property website with all the photos: ${propertySiteUrl}. If you know anyone looking to move to the ${property.city} area, we’d love if you shared this with them! ❤️`;

  const fbAdHeadline = `Direct from Owner: ${property.beds} Bed in ${property.city} - $${property.price.toLocaleString()}`;
  const fbAdPrimaryText = `Skip the bidding games and tour directly with the homeowners! Featuring ${property.features.slice(0, 4).join(', ')}. Located in ${property.schoolDistrict}. ${ohText}. Click below to see all photos and schedule a private walkthrough.`;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTogglePosted = (id: string) => {
    onUpdateGroups(
      groups.map((g) =>
        g.id === id
          ? {
              ...g,
              posted: !g.posted,
              lastPostedDate: !g.posted ? new Date().toISOString().split('T')[0] : g.lastPostedDate,
            }
          : g
      )
    );
  };

  const handleDeleteGroup = (id: string) => {
    onUpdateGroups(groups.filter((g) => g.id !== id));
  };

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newG: PromoteGroup = {
      id: 'grp-' + Date.now(),
      name: newGroupName.trim(),
      platform: newGroupPlatform,
      url: newGroupUrl.trim() || 'https://facebook.com/groups',
      posted: false,
    };

    onUpdateGroups([...groups, newG]);
    setNewGroupName('');
    setNewGroupUrl('');
    setShowAddGroup(false);
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Over 60% of buyers find their neighborhood through word-of-mouth or local community groups. Sharing in town groups and having friends repost costs $0 and produces high-quality local buyers."
        nextLabel="Refresh Planner"
        onNext={() => onNavigate('refresh')}
      />

      {/* Friends & Family Share Kit */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-slate-800 text-rose-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                Friends & Family "Share Kit"
              </h3>
              <p className="text-xs text-slate-500">
                A casual, friendly message your coworkers, family, and neighbors can text or post.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleCopy('friends', friendsFamilyKit)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
          >
            {copiedKey === 'friends' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'friends' ? 'Copied Kit!' : 'Copy Share Message'}</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
          "{friendsFamilyKit}"
        </div>
      </div>

      {/* Local Community & Group Post Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local FB Group Post */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Local Town & County Facebook Groups
            </span>
            <button
              type="button"
              onClick={() => handleCopy('fbGroup', localGroupPost)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
            >
              {copiedKey === 'fbGroup' ? 'Copied!' : 'Copy Post'}
            </button>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {localGroupPost}
          </div>
        </div>

        {/* Nextdoor Post */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Nextdoor Neighborhood Post
            </span>
            <button
              type="button"
              onClick={() => handleCopy('nextdoor', nextdoorPost)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
            >
              {copiedKey === 'nextdoor' ? 'Copied!' : 'Copy Post'}
            </button>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
            {nextdoorPost}
          </div>
        </div>
      </div>

      {/* "Where to Post" Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              "Where to Post" Outreach Tracker
            </h3>
            <p className="text-xs text-slate-500">
              Target local Facebook buy/sell groups and community forums. Check them off as you post.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddGroup(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
          >
            <Plus className="w-3.5 h-3.5" />
            + Add Group
          </button>
        </div>

        <div className="space-y-2">
          {groups.map((grp) => (
            <div
              key={grp.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={grp.posted}
                  onChange={() => handleTogglePosted(grp.id)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#0F2A44] dark:text-white">
                      {grp.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {grp.platform}
                    </span>
                  </div>
                  {grp.lastPostedDate && (
                    <span className="text-[11px] text-slate-400">
                      Last posted on {grp.lastPostedDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={grp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                  title="Open Group"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(grp.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Facebook Ad Campaign Helper */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Facebook Ad & Boosted Post Helper
            </h3>
            <p className="text-xs text-slate-500">
              Run a small $5–$10/day campaign to target active home searchers in your radius.
            </p>
          </div>
        </div>

        {/* Special Ad Category Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Mandatory Facebook "Housing" Special Ad Category:</strong> Meta requires all real estate ads to select the "Housing" category. This prevents age and gender targeting to enforce Fair Housing compliance, but allows geographic radius targeting.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Recommended Radius</span>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-xs text-[#0F2A44] dark:text-white">
                15 to 25 Miles around {property.city}, {property.state}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">Recommended Budget</span>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 font-bold text-xs text-[#0F2A44] dark:text-white">
                $5.00 to $10.00 / day for 7 days ($35–$70 total)
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Suggested Ad Headline:</span>
              <button
                type="button"
                onClick={() => handleCopy('adH', fbAdHeadline)}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                {copiedKey === 'adH' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[#0F2A44] dark:text-white">
              {fbAdHeadline}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-slate-500">Suggested Primary Text:</span>
              <button
                type="button"
                onClick={() => handleCopy('adT', fbAdPrimaryText)}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                {copiedKey === 'adT' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              {fbAdPrimaryText}
            </div>
          </div>
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Add Promotional Group / Forum
            </h4>
            <form onSubmit={handleAddGroupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Rochester Hills Buy & Sell"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Platform</label>
                <select
                  value={newGroupPlatform}
                  onChange={(e) => setNewGroupPlatform(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                >
                  <option value="Facebook Group">Facebook Group</option>
                  <option value="Nextdoor">Nextdoor</option>
                  <option value="Craigslist">Craigslist</option>
                  <option value="Community Forum">Community Forum</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Group URL</label>
                <input
                  type="url"
                  value={newGroupUrl}
                  onChange={(e) => setNewGroupUrl(e.target.value)}
                  placeholder="https://facebook.com/groups/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGroup(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#0F2A44] dark:bg-[#FF6B5A]"
                >
                  Save Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
