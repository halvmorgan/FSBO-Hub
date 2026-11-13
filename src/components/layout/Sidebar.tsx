import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Home,
  Compass,
  Sparkles,
  Camera,
  DollarSign,
  FileText,
  Share2,
  Globe,
  Calendar,
  Inbox,
  Megaphone,
  RefreshCw,
  CheckCircle2,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  User,
  ShieldAlert,
  Zap,
  Plus,
  HelpCircle,
  LogOut,
  Building2,
} from 'lucide-react';
import { ActiveTab, Settings } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  readyScore: number;
  openInquiriesCount: number;
  settings: Settings;
  onToggleDarkMode: () => void;
  onOpenHelp?: () => void;
  onOpenPricing?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  readyScore,
  openInquiriesCount,
  settings,
  onToggleDarkMode,
  onOpenHelp,
  onOpenPricing,
  onLogout,
}) => {
  const {
    currentUser,
    userProfile,
    saasConfig,
    userProperties,
    activeProperty,
    activePropertyId,
    setActivePropertyId,
    createProperty,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [propertyDropdownOpen, setPropertyDropdownOpen] = useState(false);
  const [isAddingProp, setIsAddingProp] = useState(false);
  const [newPropAddress, setNewPropAddress] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close property dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPropertyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const planType = userProfile?.plan || 'trial';
  const planConfig = saasConfig.plans[planType] || saasConfig.plans.trial;
  const creditsUsed = userProfile?.aiCreditsUsed || 0;
  const creditsMax = planConfig.aiCreditsMonthly;
  const creditsPercent = Math.min(100, Math.round((creditsUsed / creditsMax) * 100));

  type SectionId = 'my-listing-section' | 'price-market-section' | 'buyers-showings-section' | 'closing-account-section';

  interface SidebarSection {
    id: SectionId;
    title: string;
    icon: React.ElementType;
    items: NavItem[];
  }

  const baseSections: SidebarSection[] = [
    {
      id: 'my-listing-section',
      title: 'My Listing',
      icon: Home,
      items: [
        { id: 'my-listing', label: 'Listing Page', icon: Home, badge: 'Live', badgeColor: 'bg-emerald-500 text-white' },
        { id: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'Property Profile', icon: Building2 },
        { id: 'website', label: 'Property Website', icon: Globe },
        { id: 'photos', label: 'Photos & Studio', icon: Camera },
        { id: 'ai-finder', label: 'Feature Finder', icon: Sparkles },
      ],
    },
    {
      id: 'price-market-section',
      title: 'Price & Market',
      icon: DollarSign,
      items: [
        { id: 'pricing', label: 'Pricing & Comps', icon: DollarSign },
        { id: 'listing', label: 'Listing Writer', icon: FileText, badge: 'Fair Housing', badgeColor: 'bg-emerald-500 text-white' },
        { id: 'sites', label: 'Listing Sites', icon: Share2 },
        { id: 'promote', label: 'Promote & Social', icon: Megaphone },
        { id: 'refresh', label: 'Refresh Planner', icon: RefreshCw },
      ],
    },
    {
      id: 'buyers-showings-section',
      title: 'Buyers & Showings',
      icon: Calendar,
      items: [
        { id: 'showings', label: 'Showings & Open House', icon: Calendar },
        {
          id: 'inbox',
          label: 'Inquiries Inbox',
          icon: Inbox,
          badge: openInquiriesCount > 0 ? openInquiriesCount : undefined,
          badgeColor: 'bg-[#FF6B5A] text-white',
        },
      ],
    },
    {
      id: 'closing-account-section',
      title: 'Closing & Account',
      icon: CheckCircle2,
      items: [
        { id: 'closing', label: 'Documents & Closing', icon: CheckCircle2 },
        { id: 'account', label: 'Account & Billing', icon: User },
        { id: 'settings', label: 'Settings & Backup', icon: SettingsIcon },
        ...(userProfile?.role === 'admin'
          ? [
              {
                id: 'admin' as ActiveTab,
                label: 'Admin Panel',
                icon: ShieldAlert,
                badge: 'Admin',
                badgeColor: 'bg-amber-400 text-stone-900',
              },
            ]
          : []),
      ],
    },
  ];

  const findSectionForTab = (tab: ActiveTab): SectionId | null => {
    const found = baseSections.find((sec) => sec.items.some((item) => item.id === tab));
    return found ? found.id : null;
  };

  const OPEN_SECTION_STORAGE_KEY = 'fsbo_sidebar_open_section';

  const [openSection, setOpenSection] = useState<SectionId | null>(() => {
    try {
      const saved = localStorage.getItem(OPEN_SECTION_STORAGE_KEY);
      if (saved === '__closed__') return null;
      if (saved && baseSections.some((s) => s.id === saved)) {
        return saved as SectionId;
      }
    } catch {}
    return findSectionForTab(activeTab) || 'my-listing-section';
  });

  const prevActiveTabRef = useRef<ActiveTab>(activeTab);

  // Automatically open the section containing the current page when navigating to a tab
  useEffect(() => {
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      const targetSection = findSectionForTab(activeTab);
      if (targetSection) {
        setOpenSection(targetSection);
        try {
          localStorage.setItem(OPEN_SECTION_STORAGE_KEY, targetSection);
        } catch {}
      }
    }
  }, [activeTab]);

  const handleToggleSection = (sectionId: SectionId) => {
    setOpenSection((prev) => {
      const next = prev === sectionId ? null : sectionId;
      try {
        localStorage.setItem(OPEN_SECTION_STORAGE_KEY, next ?? '__closed__');
      } catch {}
      return next;
    });
  };

  const handleSelectTab = (tab: ActiveTab) => {
    const targetSection = findSectionForTab(tab);
    if (targetSection) {
      setOpenSection(targetSection);
      try {
        localStorage.setItem(OPEN_SECTION_STORAGE_KEY, targetSection);
      } catch {}
    }
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderCollapsibleSections = (isMobile = false) => (
    <div className="space-y-1.5">
      {baseSections.map((section) => {
        const SectionIcon = section.icon;
        const isOpen = openSection === section.id;
        const containsActive = section.items.some((item) => item.id === activeTab);
        const hasPendingBadge = section.items.some((item) => typeof item.badge === 'number' && item.badge > 0);

        return (
          <div key={section.id} className="select-none">
            <button
              type="button"
              onClick={() => handleToggleSection(section.id)}
              aria-expanded={isOpen}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isOpen
                  ? 'bg-[#14385A] text-white'
                  : containsActive
                  ? 'bg-[#14385A]/70 text-white hover:bg-[#14385A]'
                  : 'text-slate-200 hover:text-white hover:bg-[#14385A]/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <SectionIcon
                  className={`w-4 h-4 shrink-0 ${
                    isOpen || containsActive ? 'text-[#FF6B5A]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{section.title}</span>
                {!isOpen && hasPendingBadge && (
                  <span
                    className="w-2 h-2 rounded-full bg-[#FF6B5A] shrink-0"
                    title="Unread items waiting"
                    aria-label="Unread items waiting"
                  />
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200" />
              )}
            </button>

            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="ml-4 pl-2.5 border-l border-[#1E4268]/70 space-y-0.5 py-0.5">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 ${
                          isMobile ? 'py-2' : 'py-1.5'
                        } rounded-xl text-[11px] font-semibold transition-all group cursor-pointer ${
                          isActive
                            ? 'bg-[#FF6B5A] text-white font-bold shadow-md shadow-[#FF6B5A]/25'
                            : 'text-slate-300 hover:text-white hover:bg-[#14385A]/70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemIcon
                            className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              item.badgeColor || 'bg-white/20 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropAddress.trim()) return;

    try {
      await createProperty({
        address: newPropAddress.trim(),
        city: 'Ann Arbor',
        state: 'Michigan',
        zip: '48103',
        price: 350000,
        beds: 3,
        bathsFull: 2,
        bathsHalf: 0,
        sqft: 1800,
      });
      setNewPropAddress('');
      setIsAddingProp(false);
      setPropertyDropdownOpen(false);
    } catch (err: any) {
      alert(err.message || 'Could not add property');
    }
  };

  const canAddMoreProperties = userProperties.length < planConfig.propertyLimit;

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#0F2A44] text-white min-h-screen shrink-0 border-r border-[#1E4268]/40 shadow-xl z-20 sticky top-0 h-screen font-sans">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1E4268]/40">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSelectTab('my-listing')}
              className="flex items-center gap-2.5 text-left hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
              title="FSBO Compass - Go to My Listing"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center text-white font-bold shadow-md shadow-[#FF6B5A]/20 shrink-0">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                  FSBO <span className="text-[#FF6B5A]">Compass</span>
                </h1>
                <p className="text-[10px] text-slate-300 font-medium leading-tight">Your step-by-step guide to selling your home without an agent.</p>
              </div>
            </button>

            {/* Plan Badge */}
            <button
              onClick={onOpenPricing}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#14385A] text-[#F2B544] hover:bg-[#1E4E7A] transition-colors border border-[#1E4E7A]"
            >
              {planConfig.name}
            </button>
          </div>

          {/* Property Switcher Dropdown */}
          <div className="relative mt-3.5" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setPropertyDropdownOpen(!propertyDropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#14385A] hover:bg-[#19446d] border border-[#1E4E7A] text-left transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-[#FF6B5A] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">
                    {activeProperty?.address || 'Select Property'}
                  </div>
                  <div className="text-[9px] text-slate-300 truncate">
                    {activeProperty?.city ? `${activeProperty.city}, ${activeProperty.state}` : 'Listing in progress'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${propertyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Switcher Dropdown Menu */}
            {propertyDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0C2238] border border-[#1E4E7A] rounded-2xl shadow-2xl z-30 overflow-hidden text-xs divide-y divide-[#1E4268]/50">
                <div className="p-2 max-h-48 overflow-y-auto space-y-1">
                  {userProperties.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => {
                        setActivePropertyId(prop.id!);
                        setPropertyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        prop.id === activePropertyId
                          ? 'bg-[#FF6B5A] text-white font-bold'
                          : 'text-slate-300 hover:bg-[#14385A] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{prop.address}</span>
                      {prop.id === activePropertyId && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Add Property Button or Upgrade Notice */}
                <div className="p-2 bg-[#091A2B]">
                  {canAddMoreProperties ? (
                    isAddingProp ? (
                      <form onSubmit={handleCreateProperty} className="space-y-2 p-1">
                        <input
                          type="text"
                          required
                          placeholder="Street address..."
                          value={newPropAddress}
                          onChange={(e) => setNewPropAddress(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#14385A] border border-[#1E4E7A] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="submit"
                            className="flex-1 py-1 bg-[#FF6B5A] text-white font-bold text-[10px] rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingProp(false)}
                            className="px-2 py-1 bg-slate-700 text-slate-200 text-[10px] rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsAddingProp(true)}
                        className="w-full py-1.5 px-2 bg-[#14385A] hover:bg-[#1E4E7A] text-slate-200 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#FF6B5A]" />
                        <span>Add Another Property ({userProperties.length}/{planConfig.propertyLimit})</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => {
                        setPropertyDropdownOpen(false);
                        if (onOpenPricing) onOpenPricing();
                      }}
                      className="w-full py-1.5 px-2 bg-[#14385A] hover:bg-[#1E4E7A] text-[#F2B544] rounded-lg text-[10px] font-bold text-center block"
                    >
                      Plan limit reached ({planConfig.propertyLimit}/{planConfig.propertyLimit}) &bull; Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Credits Meter */}
          <div className="mt-3.5 p-2.5 rounded-xl bg-[#14385A]/70 border border-[#1E4E7A]/60">
            <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#F2B544]" /> AI Credits
              </span>
              <span className="font-mono text-white">
                {creditsUsed}/{creditsMax}
              </span>
            </div>
            <div className="w-full bg-[#0C2238] rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  creditsPercent > 80 ? 'bg-red-400' : 'bg-gradient-to-r from-[#F2B544] to-[#FF6B5A]'
                }`}
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin" aria-label="Main Navigation">
          {renderCollapsibleSections(false)}
        </nav>

        {/* Footer info, dark mode, support & logout */}
        <div className="p-3 border-t border-[#1E4268]/40 bg-[#0C2238] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="flex items-center gap-1 hover:text-white transition-colors text-[11px]"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#F2B544]" />
                <span>Help & Support</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14385A] transition-colors"
              title="Toggle theme"
            >
              {settings.darkMode ? <Sun className="w-3.5 h-3.5 text-[#F2B544]" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => (onLogout ? onLogout() : logout())}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-[#14385A]/50 hover:bg-[#FF6B5A]/15 hover:text-[#FF6B5A] border border-[#1E4268]/50 hover:border-[#FF6B5A]/40 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>

          <div className="text-[10px] text-slate-400 truncate flex items-center justify-between pt-1 border-t border-[#1E4268]/30">
            <span className="truncate">{userProfile?.email || currentUser?.email}</span>
            <span className="text-emerald-400 shrink-0 font-medium">{settings.state || 'MI'} FSBO</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#0F2A44] text-white shadow-md font-sans">
        <button
          type="button"
          onClick={() => handleSelectTab('my-listing')}
          className="flex items-center gap-2 text-left focus:outline-none hover:opacity-90 transition-opacity"
          title="FSBO Compass - Go to My Listing"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF6B5A] to-[#F2B544] flex items-center justify-center text-white font-bold">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-extrabold text-sm text-white">
            FSBO <span className="text-[#FF6B5A]">Compass</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white"
          >
            {settings.darkMode ? <Sun className="w-4 h-4 text-[#F2B544]" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-[#14385A] text-white hover:bg-[#1e4870]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Full Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex font-sans">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-[#0F2A44] text-white h-full flex flex-col p-4 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E4268]/60">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#FF6B5A]" />
                <span className="font-heading font-bold text-sm text-white">FSBO Compass</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#14385A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile property switcher */}
            <div className="py-2.5 border-b border-[#1E4268]/40">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                Active Property
              </div>
              <div className="text-xs font-bold text-white truncate">
                {activeProperty?.address}
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-3" aria-label="Mobile Navigation">
              {renderCollapsibleSections(true)}

              {onOpenHelp && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenHelp();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#14385A] hover:text-white transition-all mt-1"
                >
                  <HelpCircle className="w-4 h-4 text-[#F2B544]" />
                  <span>Help & Support</span>
                </button>
              )}
            </nav>

            <div className="pt-3 border-t border-[#1E4268]/60 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLogout) onLogout();
                  else logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-[#14385A]/60 hover:bg-[#FF6B5A]/20 hover:text-[#FF6B5A] border border-[#1E4268]/60 hover:border-[#FF6B5A]/40 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span className="truncate">{userProfile?.email || currentUser?.email}</span>
                <span className="shrink-0 font-medium text-[#F2B544]">{planConfig.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0F2A44] border-t border-[#1E4268]/50 px-2 py-1.5 flex items-center justify-around text-slate-300 font-sans">
        <button
          type="button"
          onClick={() => setActiveTab('my-listing')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            activeTab === 'my-listing' ? 'text-[#FF6B5A] font-bold' : 'hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>My Listing</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            activeTab === 'photos' ? 'text-[#FF6B5A] font-bold' : 'hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Photos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('listing')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            activeTab === 'listing' ? 'text-[#FF6B5A] font-bold' : 'hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Listing</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('website')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium ${
            activeTab === 'website' ? 'text-[#FF6B5A] font-bold' : 'hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Website</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-medium text-slate-300 hover:text-white"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>
    </>
  );
};
