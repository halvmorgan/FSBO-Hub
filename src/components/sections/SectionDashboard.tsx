import React from 'react';
import {
  PropertyProfile,
  PhotoItem,
  ListingSiteItem,
  ShowingItem,
  OpenHouseItem,
  InquiryItem,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import {
  Calendar,
  Share2,
  Inbox,
  RefreshCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Camera,
  DollarSign,
  FileText,
  Globe,
  Award,
} from 'lucide-react';

interface SectionDashboardProps {
  property: PropertyProfile;
  photos: PhotoItem[];
  sites: ListingSiteItem[];
  showings: ShowingItem[];
  openHouses: OpenHouseItem[];
  inquiries: InquiryItem[];
  readyScore: number;
  lastRefreshDate?: string;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionDashboard: React.FC<SectionDashboardProps> = ({
  property,
  photos,
  sites,
  showings,
  openHouses,
  inquiries,
  readyScore,
  lastRefreshDate,
  onNavigate,
}) => {
  // Stat calculations
  const liveSitesCount = sites.filter((s) => s.status === 'Live').length;
  const totalSitesCount = sites.length;

  const now = new Date();
  const upcomingShowings = showings.filter(
    (s) => new Date(`${s.date}T${s.time || '12:00'}`) >= now && s.status !== 'Cancelled'
  );
  const upcomingOpenHouses = openHouses.filter(
    (oh) => new Date(`${oh.date}T${oh.startTime || '12:00'}`) >= now
  );

  // Unanswered inquiries check (> 24 hours)
  const openInquiries = inquiries.filter((i) => !i.replied);
  const hasStaleInquiries = openInquiries.some((i) => {
    const received = new Date(i.dateReceived).getTime();
    return Date.now() - received > 24 * 3600 * 1000;
  });

  // Last refresh check (> 10 days)
  let daysSinceRefresh = 0;
  let isRefreshStale = false;
  if (lastRefreshDate) {
    daysSinceRefresh = Math.floor(
      (Date.now() - new Date(lastRefreshDate).getTime()) / (1000 * 3600 * 24)
    );
    isRefreshStale = daysSinceRefresh > 10;
  }

  // Days on market
  const daysOnMarket = property.listDate
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(property.listDate).getTime()) / (1000 * 3600 * 24))
      )
    : 0;

  // Dynamic next 3 steps
  const nextSteps: Array<{ title: string; desc: string; tab: ActiveTab; icon: any }> = [];
  if (photos.length < 5) {
    nextSteps.push({
      title: 'Upload more property photos',
      desc: `You currently have ${photos.length} photo(s). Homes with 15+ photos get 4x more buyer views.`,
      tab: 'photos',
      icon: Camera,
    });
  }
  if (!property.price || property.price <= 0) {
    nextSteps.push({
      title: 'Finalize your asking price range',
      desc: 'Use the 3-comp worksheet to calculate your likely price range before listing.',
      tab: 'pricing',
      icon: DollarSign,
    });
  }
  if (liveSitesCount < 3) {
    nextSteps.push({
      title: 'Post to Zillow and Facebook Marketplace',
      desc: `You are live on ${liveSitesCount} of ${totalSitesCount} sites. Buyers are searching today.`,
      tab: 'sites',
      icon: Share2,
    });
  }
  if (nextSteps.length < 3 && openInquiries.length > 0) {
    nextSteps.push({
      title: `Respond to ${openInquiries.length} open buyer inquiry`,
      desc: 'Quick responses build trust and prevent buyers from booking other tours.',
      tab: 'inbox',
      icon: Inbox,
    });
  }
  if (nextSteps.length < 3 && upcomingOpenHouses.length === 0) {
    nextSteps.push({
      title: 'Schedule your first weekend Open House',
      desc: 'Saturday and Sunday open houses drive maximum foot traffic and create buying urgency.',
      tab: 'showings',
      icon: Calendar,
    });
  }
  if (nextSteps.length < 3) {
    nextSteps.push({
      title: 'Review Michigan Seller’s Disclosure',
      desc: 'Have your completed disclosure ready to hand to serious buyers who tour.',
      tab: 'closing',
      icon: CheckCircle2,
    });
  }

  // Milestones must complete strictly in sequential order:
  // (a later step can never show done while an earlier one is incomplete)
  const rawStages: Array<{ name: string; tab: ActiveTab; rawDone: boolean }> = [
    { name: 'Prepare', tab: 'profile', rawDone: (property.features?.length || 0) >= 3 && Boolean(property.address) },
    { name: 'Price', tab: 'pricing', rawDone: (property.price || 0) > 0 },
    { name: 'Photos', tab: 'photos', rawDone: photos.length >= 3 },
    { name: 'Listing', tab: 'listing', rawDone: Boolean(property.address && property.price > 0 && photos.length >= 3) },
    { name: 'Website', tab: 'website', rawDone: Boolean(property.published) },
    { name: 'Promote', tab: 'promote', rawDone: liveSitesCount >= 1 },
    { name: 'Showings', tab: 'showings', rawDone: showings.length > 0 },
    { name: 'Offers', tab: 'closing', rawDone: false },
    { name: 'Closing', tab: 'closing', rawDone: false },
  ];

  let sequentialFlag = true;
  const timelineStages: Array<{ name: string; tab: ActiveTab; completed: boolean }> = rawStages.map((stage) => {
    if (sequentialFlag && stage.rawDone) {
      return { name: stage.name, tab: stage.tab, completed: true };
    }
    sequentialFlag = false;
    return { name: stage.name, tab: stage.tab, completed: false };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Section Tip */}
      <WhyThisMatters
        tip="Selling by owner requires consistent momentum. Following these 9 clear milestones saves you an average of $12,000–$25,000 in agent commissions."
        nextLabel="Explore Property Profile"
        onNext={() => onNavigate('profile')}
      />

      {/* Hero Strip: Ready Score + Property Snapshot */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F2A44] via-[#143E5E] to-[#1E6F80] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-white/90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{property.state || 'Michigan'} FSBO Active Dashboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading">
              {property.address || 'Your Home'}, {property.city || 'City'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Target asking price: <strong className="text-[#F2B544]">${property.price.toLocaleString()}</strong> •{' '}
              {property.beds} Beds • {property.bathsFull} Full / {property.bathsHalf} Half Baths • {property.sqft.toLocaleString()} SqFt
            </p>
          </div>

          {/* Big Circular Score */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF6B5A]"
                  strokeDasharray={`${readyScore}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-white font-heading">{readyScore}%</span>
              </div>
            </div>
            <div className="text-left">
              <span className="text-xs uppercase font-bold text-[#F2B544] tracking-wider block">
                Ready to List
              </span>
              <span className="text-sm font-semibold text-white block">
                {readyScore >= 80 ? 'Listing ready!' : readyScore >= 50 ? 'Great progress' : 'Prep in progress'}
              </span>
              <span className="text-[11px] text-slate-300 block">
                {readyScore}% of setup complete
              </span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-[#FF6B5A]/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Timeline Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Sale Journey Milestones
          </h3>
          <span className="text-xs text-[#0F2A44] dark:text-[#F2B544] font-semibold">
            Stage 3 of 9: Marketing & Showings
          </span>
        </div>

        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2 text-center no-scrollbar">
          {timelineStages.map((stage, idx) => {
            const isCurrent = stage.tab === 'listing' || stage.tab === 'photos';
            return (
              <button
                key={stage.name}
                type="button"
                onClick={() => onNavigate(stage.tab)}
                className="flex-1 min-w-[75px] group flex flex-col items-center cursor-pointer"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                    stage.completed
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-[#FF6B5A] text-white ring-4 ring-[#FF6B5A]/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {stage.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    isCurrent
                      ? 'text-[#FF6B5A]'
                      : stage.completed
                      ? 'text-slate-700 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {stage.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Days on Market */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Days on Market</span>
            <Clock className="w-4 h-4 text-[#0F2A44] dark:text-slate-300" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#0F2A44] dark:text-white">
              {daysOnMarket}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {daysOnMarket <= 7 ? 'Fresh listing period' : `${daysOnMarket} days since live`}
            </div>
          </div>
        </div>

        {/* Sites Listed */}
        <div
          onClick={() => onNavigate('sites')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#FF6B5A] transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Sites Listed</span>
            <Share2 className="w-4 h-4 text-[#1FA67A]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#0F2A44] dark:text-white">
              {liveSitesCount} <span className="text-xs text-slate-400 font-normal">of {totalSitesCount}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {liveSitesCount >= 4 ? 'Solid reach' : 'Post to more sites'}
            </div>
          </div>
        </div>

        {/* Upcoming Showings */}
        <div
          onClick={() => onNavigate('showings')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#FF6B5A] transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Showings</span>
            <Calendar className="w-4 h-4 text-[#0F2A44] dark:text-slate-300" />
          </div>
          <div>
            <div className="text-2xl font-bold font-heading text-[#0F2A44] dark:text-white">
              {upcomingShowings.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {upcomingShowings.length > 0 ? 'Upcoming private tours' : 'No upcoming tours'}
            </div>
          </div>
        </div>

        {/* Open Inquiries */}
        <div
          onClick={() => onNavigate('inbox')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#FF6B5A] transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Open Inquiries</span>
            <Inbox className="w-4 h-4 text-[#FF6B5A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-heading text-[#0F2A44] dark:text-white">
                {openInquiries.length}
              </span>
              {hasStaleInquiries && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                  &gt;24h overdue
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {openInquiries.length === 0 ? 'All caught up' : 'Awaiting response'}
            </div>
          </div>
        </div>

        {/* Last Listing Refresh */}
        <div
          onClick={() => onNavigate('refresh')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#FF6B5A] transition-all col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Listing Refresh</span>
            <RefreshCw className={`w-4 h-4 ${isRefreshStale ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-heading text-[#0F2A44] dark:text-white">
                {daysSinceRefresh}d
              </span>
              {isRefreshStale && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                  Stale
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isRefreshStale ? 'Refresh recommended' : 'Healthy freshness'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Your Next 3 Steps & Calendar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next 3 Steps Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF6B5A]/15 text-[#FF6B5A] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                Your Next 3 Action Steps
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Ranked by impact</span>
          </div>

          <div className="space-y-3">
            {nextSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-[#FF6B5A]/40 transition-all group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-[#0F2A44] dark:text-white shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F2A44] dark:text-white group-hover:text-[#FF6B5A] transition-colors flex items-center gap-1.5">
                        {step.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate(step.tab)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] group-hover:bg-[#FF6B5A] transition-all shadow-sm"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Calendar Preview */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F2B544]/20 text-[#D99B26] dark:text-[#F2B544] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
                  Schedule Preview
                </h3>
              </div>
              <button
                onClick={() => onNavigate('showings')}
                className="text-xs font-semibold text-[#FF6B5A] hover:underline"
              >
                Full Calendar
              </button>
            </div>

            <div className="space-y-3">
              {/* Showings list */}
              {upcomingShowings.length === 0 && upcomingOpenHouses.length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
                  No upcoming showings or open houses scheduled.
                </div>
              ) : (
                <>
                  {upcomingOpenHouses.map((oh) => (
                    <div
                      key={oh.id}
                      className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#F2B544] text-[#0F2A44]">
                          Open House
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#0F2A44] dark:text-white">
                            {oh.date} ({oh.startTime} - {oh.endTime})
                          </div>
                          <div className="text-[11px] text-slate-500">Public weekend tour</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {upcomingShowings.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#0F2A44] dark:text-white">
                          {s.buyerName} ({s.date} at {s.time})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.hasPreApproval ? '✅ Pre-Approved' : '⚠️ No Pre-Approval'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('showings')}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-[#FF6B5A] hover:text-[#FF6B5A] transition-colors"
          >
            + Add Showing or Open House
          </button>
        </div>
      </div>
    </div>
  );
};
