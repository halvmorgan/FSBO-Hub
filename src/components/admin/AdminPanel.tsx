import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  DollarSign,
  Globe,
  Settings,
  Search,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Save,
  RefreshCw,
  Mail,
  Zap,
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile, PlanType, PublicSiteDoc, SupportTicket } from '../../types/saas';

export const AdminPanel: React.FC = () => {
  const { userProfile, saasConfig, updateSaasConfig, grantUserPlan } = useAuth();
  const [activeTab, setActiveTab] = useState<'customers' | 'plans' | 'sites' | 'support'>('customers');

  // Customer List
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Published Sites List
  const [sites, setSites] = useState<PublicSiteDoc[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Support Tickets
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  // Editable Plan Config
  const [plansConfig, setPlansConfig] = useState(saasConfig.plans);
  const [savingPlans, setSavingPlans] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch Customers
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoadingCustomers(true);
        const col = collection(db, 'users');
        const snap = await getDocs(col);
        const list: UserProfile[] = [];
        snap.forEach((d) => list.push({ ...d.data(), uid: d.id } as UserProfile));
        setCustomers(list);
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    }

    if (userProfile?.role === 'admin') {
      fetchCustomers();
    }
  }, [userProfile]);

  // Fetch Sites
  useEffect(() => {
    async function fetchSites() {
      try {
        setLoadingSites(true);
        const col = collection(db, 'publicSites');
        const snap = await getDocs(col);
        const list: PublicSiteDoc[] = [];
        snap.forEach((d) => list.push({ ...d.data(), slug: d.id } as PublicSiteDoc));
        setSites(list);
      } catch (err) {
        console.error('Failed to load sites:', err);
      } finally {
        setLoadingSites(false);
      }
    }

    if (activeTab === 'sites' && userProfile?.role === 'admin') {
      fetchSites();
    }
  }, [activeTab, userProfile]);

  // Fetch Support Messages
  useEffect(() => {
    async function fetchSupport() {
      try {
        setLoadingSupport(true);
        const col = collection(db, 'supportMessages');
        const snap = await getDocs(col);
        const list: SupportTicket[] = [];
        snap.forEach((d) => list.push({ ...d.data(), id: d.id } as SupportTicket));
        setSupportTickets(list);
      } catch (err) {
        console.error('Failed to load support:', err);
      } finally {
        setLoadingSupport(false);
      }
    }

    if (activeTab === 'support' && userProfile?.role === 'admin') {
      fetchSupport();
    }
  }, [activeTab, userProfile]);

  // Handle plan updates in saasConfig
  const handleSavePlans = async () => {
    try {
      setSavingPlans(true);
      await updateSaasConfig({ plans: plansConfig });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving plans:', err);
      alert('Failed to save plans.');
    } finally {
      setSavingPlans(false);
    }
  };

  // Quick Action: Grant plan
  const handleGrantPlan = async (uid: string, plan: PlanType) => {
    try {
      await grantUserPlan(uid, plan, 'active');
      setCustomers((prev) =>
        prev.map((c) => (c.uid === uid ? { ...c, plan, planStatus: 'active' } : c))
      );
    } catch (err) {
      console.error('Error granting plan:', err);
    }
  };

  // Quick Action: Reset AI credits
  const handleResetCredits = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { aiCreditsUsed: 0 });
      setCustomers((prev) => prev.map((c) => (c.uid === uid ? { ...c, aiCreditsUsed: 0 } : c)));
    } catch (err) {
      console.error('Error resetting credits:', err);
    }
  };

  // Quick Action: Toggle Site Status
  const handleToggleSiteStatus = async (slug: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const siteRef = doc(db, 'publicSites', slug);
      await updateDoc(siteRef, { status: newStatus });
      setSites((prev) =>
        prev.map((s) => (s.slug === slug ? { ...s, status: newStatus as any } : s))
      );
    } catch (err) {
      console.error('Error updating site status:', err);
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="bg-red-50 p-8 rounded-3xl text-center max-w-lg mx-auto border border-red-200">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-red-900">Admin Access Restricted</h3>
        <p className="text-sm text-red-700 mt-2">
          Your account ({userProfile?.email || 'Guest'}) does not have administrator privileges.
        </p>
      </div>
    );
  }

  // Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.uid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick revenue metrics
  const proCount = customers.filter((c) => c.plan === 'pro').length;
  const perListingCount = customers.filter((c) => c.plan === 'per_listing').length;
  const estimatedMrr = proCount * 19;
  const estimatedOneTime = perListingCount * 49;

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md text-xs font-bold uppercase tracking-wider">
              Super Admin
            </span>
            <span className="text-xs text-stone-500">Root Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F2A44] dark:text-white mt-1">
            Platform Administration
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'customers'
                ? 'bg-white dark:bg-stone-700 text-[#0F2A44] dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-[#0F2A44]'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-stone-700 text-[#0F2A44] dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-[#0F2A44]'
            }`}
          >
            Pricing & Plans
          </button>
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'sites'
                ? 'bg-white dark:bg-stone-700 text-[#0F2A44] dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-[#0F2A44]'
            }`}
          >
            Public Sites
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'support'
                ? 'bg-white dark:bg-stone-700 text-[#0F2A44] dark:text-white shadow-sm'
                : 'text-stone-600 dark:text-stone-300 hover:text-[#0F2A44]'
            }`}
          >
            Support Tickets
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 font-medium">Total Registered Users</div>
          <div className="text-2xl font-heading font-extrabold text-[#0F2A44] dark:text-white mt-1">
            {customers.length}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Live Firestore Accounts</div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 font-medium">Estimated MRR</div>
          <div className="text-2xl font-heading font-extrabold text-emerald-600 mt-1">
            ${estimatedMrr}/mo
          </div>
          <div className="text-[11px] text-stone-400 mt-1">{proCount} Pro Monthly subs</div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 font-medium">Per-Listing & Bundle Revenue</div>
          <div className="text-2xl font-heading font-extrabold text-[#0F2A44] dark:text-white mt-1">
            ${estimatedOneTime}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">{perListingCount} one-time packages</div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="text-xs text-stone-500 font-medium">Trial Users</div>
          <div className="text-2xl font-heading font-extrabold text-amber-500 mt-1">
            {customers.filter((c) => c.plan === 'trial').length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">In 7-day conversion window</div>
        </div>
      </div>

      {/* Tab 1: Customers */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
          {/* Search bar */}
          <div className="p-4 sm:p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search customers by email, name or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-[#0F2A44] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF6B5A]/40"
              />
            </div>
            <span className="text-xs text-stone-400">
              Showing {filteredCustomers.length} user(s)
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Plan / Status</th>
                  <th className="px-6 py-3.5">AI Credits</th>
                  <th className="px-6 py-3.5">Registered</th>
                  <th className="px-6 py-3.5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.uid} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#0F2A44] dark:text-white">
                        {cust.displayName || 'Homeowner'}
                      </div>
                      <div className="text-stone-500 text-[11px] font-mono">{cust.email}</div>
                      <div className="text-stone-400 text-[10px] truncate max-w-[150px]">
                        UID: {cust.uid}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cust.plan === 'pro'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : cust.plan === 'per_listing'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                          }`}
                        >
                          {cust.plan}
                        </span>
                        <span className="text-[11px] text-stone-400 capitalize">
                          {cust.planStatus}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono">
                      {cust.aiCreditsUsed || 0} credits
                    </td>

                    <td className="px-6 py-4 text-stone-500">
                      {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <select
                        value={cust.plan}
                        onChange={(e) => handleGrantPlan(cust.uid, e.target.value as PlanType)}
                        className="text-xs bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-[#0F2A44] dark:text-white"
                      >
                        <option value="trial">Trial</option>
                        <option value="per_listing">Per Listing (${plansConfig.per_listing?.priceAmount || 149})</option>
                        <option value="bundle">Seller Pro Bundle (${plansConfig.bundle?.priceAmount || 197})</option>
                        <option value="pro">Pro Monthly (${plansConfig.pro?.priceAmount || 29}/mo)</option>
                      </select>

                      <button
                        onClick={() => handleResetCredits(cust.uid)}
                        title="Reset AI Credits to 0"
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[11px] font-semibold border border-amber-200"
                      >
                        Reset Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Pricing & Plans Config Editor */}
      {activeTab === 'plans' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200 dark:border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-heading font-extrabold text-[#0F2A44] dark:text-white">
                Dynamic Pricing & Plan Limits
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Edit prices, limits, and plan features here. Changes apply immediately across the public pricing table and app gates.
              </p>
            </div>

            <button
              onClick={handleSavePlans}
              disabled={savingPlans}
              className="px-5 py-2.5 bg-[#FF6B5A] hover:bg-[#e85a4a] text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingPlans ? 'Saving to Firestore...' : saveSuccess ? 'Saved!' : 'Save Plan Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(['trial', 'per_listing', 'bundle', 'pro'] as PlanType[]).map((planKey) => {
              const p = plansConfig[planKey];
              if (!p) return null;
              return (
                <div
                  key={planKey}
                  className="bg-stone-50 dark:bg-stone-800/40 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono">
                      {planKey}
                    </span>
                    {p.isPopular && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                        Popular
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) =>
                        setPlansConfig({
                          ...plansConfig,
                          [planKey]: { ...p, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-[#0F2A44] dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Price Display
                      </label>
                      <input
                        type="text"
                        value={p.priceDisplay}
                        onChange={(e) =>
                          setPlansConfig({
                            ...plansConfig,
                            [planKey]: { ...p, priceDisplay: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-[#0F2A44] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        value={p.priceAmount}
                        onChange={(e) =>
                          setPlansConfig({
                            ...plansConfig,
                            [planKey]: { ...p, priceAmount: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-[#0F2A44] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Property Limit
                      </label>
                      <input
                        type="number"
                        value={p.propertyLimit}
                        onChange={(e) =>
                          setPlansConfig({
                            ...plansConfig,
                            [planKey]: { ...p, propertyLimit: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-[#0F2A44] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        AI Credits Limit
                      </label>
                      <input
                        type="number"
                        value={p.aiCreditsMonthly}
                        onChange={(e) =>
                          setPlansConfig({
                            ...plansConfig,
                            [planKey]: { ...p, aiCreditsMonthly: Number(e.target.value) },
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-[#0F2A44] dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id={`pub-${planKey}`}
                      checked={p.canPublishWebsite}
                      onChange={(e) =>
                        setPlansConfig({
                          ...plansConfig,
                          [planKey]: { ...p, canPublishWebsite: e.target.checked },
                        })
                      }
                      className="rounded border-stone-300 text-[#FF6B5A] focus:ring-[#FF6B5A]"
                    />
                    <label htmlFor={`pub-${planKey}`} className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                      Can Publish Website (/p/slug)
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Public Sites */}
      {activeTab === 'sites' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="text-xl font-heading font-extrabold text-[#0F2A44] dark:text-white mb-2">
            Published Property Websites
          </h3>
          <p className="text-xs text-stone-500 mb-6">
            Review and moderate public property websites hosted at /p/[slug].
          </p>

          {sites.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              No public sites have been published yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {sites.map((site) => (
                <div key={site.slug} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0F2A44] dark:text-white">
                        {site.address}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          site.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {site.status}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      URL: <span className="font-mono text-sky-600">/p/{site.slug}</span> &bull; ${site.price?.toLocaleString()} &bull; Owner UID: {site.ownerUid.slice(0, 8)}...
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/p/${site.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#0F2A44] rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleToggleSiteStatus(site.slug, site.status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        site.status === 'active'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {site.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Support Tickets */}
      {activeTab === 'support' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6">
          <h3 className="text-xl font-heading font-extrabold text-[#0F2A44] dark:text-white mb-2">
            Support Inbox & Inquiries
          </h3>
          <p className="text-xs text-stone-500 mb-6">
            In-app seller questions and feedback tickets.
          </p>

          {supportTickets.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">
              No support tickets found. All questions answered!
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm text-[#0F2A44] dark:text-white">
                      {ticket.subject}
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                    {ticket.message}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-2">
                    From: {ticket.userName} ({ticket.userEmail})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
