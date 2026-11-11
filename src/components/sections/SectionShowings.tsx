import React, { useState } from 'react';
import {
  ShowingItem,
  OpenHouseItem,
  VisitorLogItem,
  Settings,
  PropertyProfile,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { Tooltip } from '../common/Tooltip';
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Share2,
  Lock,
  Copy,
  Check,
  Flame,
  FileCheck,
} from 'lucide-react';
import { getPropertyWebsiteUrl } from '../../lib/appUrl';

interface SectionShowingsProps {
  property: PropertyProfile;
  showings: ShowingItem[];
  openHouses: OpenHouseItem[];
  visitorLog: VisitorLogItem[];
  settings: Settings;
  onUpdateShowings: (showings: ShowingItem[]) => void;
  onUpdateOpenHouses: (openHouses: OpenHouseItem[]) => void;
  onUpdateVisitorLog: (visitors: VisitorLogItem[]) => void;
  onUpdateSettings: (settings: Settings) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionShowings: React.FC<SectionShowingsProps> = ({
  property,
  showings,
  openHouses,
  visitorLog,
  settings,
  onUpdateShowings,
  onUpdateOpenHouses,
  onUpdateVisitorLog,
  onUpdateSettings,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Add Showing Modal / Inputs
  const [showAddShowing, setShowAddShowing] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [showingDate, setShowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [showingTime, setShowingTime] = useState('14:00');
  const [hasPreApproval, setHasPreApproval] = useState(false);
  const [showingNotes, setShowingNotes] = useState('');

  // Open House Planner State
  const [showAddOH, setShowAddOH] = useState(false);
  const [ohDate, setOhDate] = useState('');
  const [ohStart, setOhStart] = useState('13:00');
  const [ohEnd, setOhEnd] = useState('16:00');
  const [ohNotes, setOhNotes] = useState('');

  // Visitor Log Add State
  const [showAddVisitor, setShowAddVisitor] = useState(false);
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [visEmail, setVisEmail] = useState('');
  const [visPreApproved, setVisPreApproved] = useState(true);
  const [visAgent, setVisAgent] = useState(false);
  const [visInterest, setVisInterest] = useState<'Hot' | 'Warm' | 'Cold'>('Hot');
  const [visFollowUp, setVisFollowUp] = useState('');
  const [visNotes, setVisNotes] = useState('');

  // Copy open house announcement post
  const [copiedOHPost, setCopiedOHPost] = useState(false);

  // Standard open house checklist items
  const standardOHChecklist = [
    'Place directional A-frame signs at neighborhood street corners',
    'Print 20 copies of the full-color yard flyer',
    'Set up sign-in sheet on kitchen island with pens',
    'Turn on every interior light and open all window blinds',
    'Play soft instrumental background music (lo-fi/jazz)',
    'Set out bottled water and light pre-packaged refreshments',
    'Lock away jewelry, prescription medications, and financial files',
    'Turn on exterior porch lights',
  ];

  // Add Showing Handler
  const handleAddShowing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) return;

    const initialStatus = settings.requirePreApproval && !hasPreApproval ? 'Awaiting Pre-Approval' : 'Confirmed';

    const newShowing: ShowingItem = {
      id: 'show-' + Date.now(),
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail.trim(),
      date: showingDate,
      time: showingTime,
      status: initialStatus,
      hasPreApproval,
      notes: showingNotes,
      createdAt: new Date().toISOString(),
    };

    onUpdateShowings([...showings, newShowing]);
    setBuyerName('');
    setBuyerPhone('');
    setBuyerEmail('');
    setShowingNotes('');
    setShowAddShowing(false);
  };

  // Toggle Pre-Approval for a showing
  const handleToggleShowingPreApproval = (id: string) => {
    onUpdateShowings(
      showings.map((s) => {
        if (s.id !== id) return s;
        const nextHasPreApproval = !s.hasPreApproval;
        let nextStatus = s.status;
        if (settings.requirePreApproval && !nextHasPreApproval) {
          nextStatus = 'Awaiting Pre-Approval';
        } else if (s.status === 'Awaiting Pre-Approval' && nextHasPreApproval) {
          nextStatus = 'Confirmed';
        }
        return {
          ...s,
          hasPreApproval: nextHasPreApproval,
          status: nextStatus,
        };
      })
    );
  };

  // Delete showing
  const handleDeleteShowing = (id: string) => {
    onUpdateShowings(showings.filter((s) => s.id !== id));
  };

  // Add Open House
  const handleAddOpenHouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ohDate) return;

    const initialChecklist: Record<string, boolean> = {};
    standardOHChecklist.forEach((item) => (initialChecklist[item] = false));

    const newOH: OpenHouseItem = {
      id: 'oh-' + Date.now(),
      date: ohDate,
      startTime: ohStart,
      endTime: ohEnd,
      notes: ohNotes,
      checklist: initialChecklist,
    };

    onUpdateOpenHouses([...openHouses, newOH]);
    setOhDate('');
    setShowAddOH(false);
  };

  // Toggle OH Checklist
  const handleToggleOHChecklist = (ohId: string, item: string) => {
    onUpdateOpenHouses(
      openHouses.map((oh) => {
        if (oh.id === ohId) {
          return {
            ...oh,
            checklist: {
              ...oh.checklist,
              [item]: !oh.checklist[item],
            },
          };
        }
        return oh;
      })
    );
  };

  // Delete Open House
  const handleDeleteOpenHouse = (id: string) => {
    onUpdateOpenHouses(openHouses.filter((oh) => oh.id !== id));
  };

  // Add Visitor
  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visName.trim()) return;

    const newVis: VisitorLogItem = {
      id: 'vis-' + Date.now(),
      name: visName.trim(),
      phone: visPhone.trim(),
      email: visEmail.trim(),
      preApproved: visPreApproved,
      agentRepresented: visAgent,
      interestLevel: visInterest,
      followUpDate: visFollowUp || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      notes: visNotes,
    };

    onUpdateVisitorLog([newVis, ...visitorLog]);
    setVisName('');
    setVisPhone('');
    setVisEmail('');
    setVisNotes('');
    setShowAddVisitor(false);
  };

  // Delete visitor
  const handleDeleteVisitor = (id: string) => {
    onUpdateVisitorLog(visitorLog.filter((v) => v.id !== id));
  };

  // Copy Open house social announcement
  const handleCopyOHAnnouncement = (oh: OpenHouseItem) => {
    const slug = property.address
      ? property.address.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : 'my-home';
    const siteUrl = getPropertyWebsiteUrl(slug);
    const text = `🏡 OPEN HOUSE THIS WEEKEND!\n📍 ${property.address}, ${property.city}\n🗓️ ${oh.date} from ${oh.startTime} to ${oh.endTime}\n\nCome tour this gorgeous ${property.beds} Bed, ${property.bathsFull} Bath home (${property.sqft.toLocaleString()} sqft) offered directly by owner for $${property.price.toLocaleString()}.\n\n✅ Remodeled kitchen, pristine finishes & beautiful yard.\n📞 Questions? Contact owner: ${settings.sellerPhone}\n👉 Full photo gallery & directions: ${siteUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedOHPost(true);
    setTimeout(() => setCopiedOHPost(false), 2000);
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Requiring pre-approval letters before private showings eliminates 'looky-loos' and safeguards your home. Open houses create natural buyer competition and urgency."
        nextLabel="Inquiries Inbox"
        onNext={() => onNavigate('inbox')}
      />

      {/* Safety Tips Card */}
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-[#0F2A44] dark:text-amber-200">
            FSBO Showing Safety Checklist
          </h4>
          <p className="text-amber-900 dark:text-amber-300 leading-relaxed">
            1. Never host private tours alone—always have a spouse, family member, or friend present.
            2. Ask for a photo ID before unlocking the door.
            3. Lock away all prescription medications, small electronics, jewelry, and financial files before opening your doors.
          </p>
        </div>
      </div>

      {/* Calendar & Tour Tracker */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#FF6B5A]" />
              Showings & Open House Calendar
            </h3>
            <p className="text-xs text-slate-500">
              Manage private buyer walkthroughs and weekend open house events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddOH(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F2A44] bg-[#F2B544] hover:bg-[#e6a835] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Plan Open House
            </button>
            <button
              type="button"
              onClick={() => setShowAddShowing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Showing
            </button>
          </div>
        </div>

        {/* Global Pre-approval toggle setting */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <div className="text-xs">
              <strong className="text-slate-800 dark:text-white">
                Require <Tooltip term="Pre-Approval Letter" /> Before Private Showings
              </strong>
              <span className="text-slate-400 block text-[11px]">
                Flag showing requests without verified financing.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.requirePreApproval}
            onChange={(e) => onUpdateSettings({ ...settings, requirePreApproval: e.target.checked })}
            className="w-4 h-4 text-[#FF6B5A] rounded focus:ring-[#FF6B5A]"
          />
        </div>

        {/* Active Showings List */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Scheduled Private Tours ({showings.length})
          </span>

          {showings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No private showings currently scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {showings.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    !s.hasPreApproval && settings.requirePreApproval
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0F2A44] dark:text-white">
                        {s.buyerName}
                      </span>
                      {(() => {
                        const effectiveStatus = settings.requirePreApproval && !s.hasPreApproval ? 'Awaiting Pre-Approval' : s.status;
                        const isPendingApproval = effectiveStatus === 'Awaiting Pre-Approval';
                        return (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isPendingApproval
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {effectiveStatus}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#FF6B5A]" />
                      <span>{s.date} at {s.time}</span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      Phone: {s.buyerPhone} • {s.buyerEmail}
                    </div>

                    {s.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-lg">
                        "{s.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleShowingPreApproval(s.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        s.hasPreApproval
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {s.hasPreApproval ? '✅ Pre-Approved' : '⚠️ Pending Letter'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteShowing(s.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Open House Planner Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#F2B544]" />
              Open House Event Planner & Checklist
            </h3>
            <p className="text-xs text-slate-500">
              Interactive preparation list and automated social media announcement copy.
            </p>
          </div>
        </div>

        {openHouses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No open house scheduled. Click "Plan Open House" above to set a date.
          </div>
        ) : (
          <div className="space-y-6">
            {openHouses.map((oh) => (
              <div
                key={oh.id}
                className="p-5 rounded-3xl bg-amber-50/30 dark:bg-slate-800/40 border border-amber-200 dark:border-slate-700 space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F2B544] text-[#0F2A44]">
                      Open House
                    </span>
                    <h4 className="text-base font-bold text-[#0F2A44] dark:text-white mt-1">
                      {oh.date} ({oh.startTime} – {oh.endTime})
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyOHAnnouncement(oh)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
                    >
                      {copiedOHPost ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedOHPost ? 'Copied Post!' : 'Copy Announcement'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteOpenHouse(oh.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Interactive Checklist */}
                <div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">
                    Day-of Open House Checklist:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {standardOHChecklist.map((item) => {
                      const checked = !!oh.checklist?.[item];
                      return (
                        <div
                          key={item}
                          onClick={() => handleToggleOHChecklist(oh.id, item)}
                          className={`p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                            checked
                              ? 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 line-through'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visitor Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Open House Visitor Log & Follow-Up Tracker
            </h3>
            <p className="text-xs text-slate-500">
              Record walk-in guests, financing status, and follow-up reminders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddVisitor(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
          >
            <Plus className="w-3.5 h-3.5" />
            + Record Visitor
          </button>
        </div>

        {visitorLog.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No open house visitors recorded yet. Add names from your sign-in sheet after your event.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Visitor Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Pre-Approved</th>
                  <th className="p-3">Agent?</th>
                  <th className="p-3">Interest Level</th>
                  <th className="p-3">Follow-Up Date</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {visitorLog.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-[#0F2A44] dark:text-white">{v.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      {v.phone} • {v.email}
                    </td>
                    <td className="p-3">
                      {v.preApproved ? (
                        <span className="text-emerald-600 font-semibold">✓ Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {v.agentRepresented ? 'Has Agent' : 'Unrepresented'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.interestLevel === 'Hot'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            : v.interestLevel === 'Warm'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {v.interestLevel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-semibold">{v.followUpDate}</td>
                    <td className="p-3 text-slate-500 italic max-w-xs truncate">{v.notes}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteVisitor(v.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Showing Modal */}
      {showAddShowing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Schedule Private Showing
            </h4>
            <form onSubmit={handleAddShowing} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Buyer Name</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Rachel Miller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="(248) 555-0144"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="rachel@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={showingDate}
                    onChange={(e) => setShowingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={showingTime}
                    onChange={(e) => setShowingTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
                <input
                  type="checkbox"
                  id="modal-preapp"
                  checked={hasPreApproval}
                  onChange={(e) => setHasPreApproval(e.target.checked)}
                />
                <label htmlFor="modal-preapp">Pre-Approval Letter Verified</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddShowing(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#0F2A44] dark:bg-[#FF6B5A]"
                >
                  Save Showing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Open House Modal */}
      {showAddOH && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Schedule Weekend Open House
            </h4>
            <form onSubmit={handleAddOpenHouse} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={ohDate}
                  onChange={(e) => setOhDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={ohStart}
                    onChange={(e) => setOhStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={ohEnd}
                    onChange={(e) => setOhEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOH(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#F2B544] text-[#0F2A44]"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Visitor Modal */}
      {showAddVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Record Open House Guest
            </h4>
            <form onSubmit={handleAddVisitor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={visName}
                  onChange={(e) => setVisName(e.target.value)}
                  placeholder="Visitor Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={visPhone}
                    onChange={(e) => setVisPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Interest</label>
                  <select
                    value={visInterest}
                    onChange={(e) => setVisInterest(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Hot">🔥 Hot (Very Interested)</option>
                    <option value="Warm">Warm (Considering)</option>
                    <option value="Cold">Cold (Just Looking)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVisitor(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
