import React, { useState } from 'react';
import { PropertyProfile, ActiveTab } from '../../types';
import { FEATURE_CATEGORIES } from '../../lib/defaults';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { Tooltip } from '../common/Tooltip';
import {
  Home,
  DollarSign,
  Flame,
  Zap,
  Droplet,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';
import { US_STATES, detectStateFromAddress } from '../../lib/stateDisclosures';

interface SectionProfileProps {
  property: PropertyProfile;
  onChange: (updated: PropertyProfile) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionProfile: React.FC<SectionProfileProps> = ({
  property,
  onChange,
  onNavigate,
}) => {
  const [newUpgradeItem, setNewUpgradeItem] = useState('');
  const [newUpgradeYear, setNewUpgradeYear] = useState('');
  const [newUpgradeCost, setNewUpgradeCost] = useState('');
  const [customFeature, setCustomFeature] = useState('');

  const handleFieldChange = (field: keyof PropertyProfile, value: any) => {
    onChange({ ...property, [field]: value });
  };

  const handleUtilityChange = (key: 'gas' | 'electric' | 'water', value: number) => {
    onChange({
      ...property,
      utilities: {
        ...property.utilities,
        [key]: value,
      },
    });
  };

  const handleSpecialNoteChange = (index: number, val: string) => {
    const updated = [...property.specialNotes] as [string, string, string];
    updated[index] = val;
    onChange({ ...property, specialNotes: updated });
  };

  const toggleFeature = (feat: string) => {
    const exists = property.features.includes(feat);
    const updated = exists
      ? property.features.filter((f) => f !== feat)
      : [...property.features, feat];
    onChange({ ...property, features: updated });
  };

  const handleAddUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpgradeItem.trim() || !newUpgradeYear.trim()) return;

    const newUpgrade = {
      id: 'upgrade-' + Date.now(),
      item: newUpgradeItem.trim(),
      year: newUpgradeYear.trim(),
      cost: newUpgradeCost ? parseInt(newUpgradeCost) : undefined,
    };

    onChange({
      ...property,
      upgrades: [...property.upgrades, newUpgrade],
    });

    setNewUpgradeItem('');
    setNewUpgradeYear('');
    setNewUpgradeCost('');
  };

  const handleRemoveUpgrade = (id: string) => {
    onChange({
      ...property,
      upgrades: property.upgrades.filter((u) => u.id !== id),
    });
  };

  const handleAddCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeature.trim()) return;
    if (!property.features.includes(customFeature.trim())) {
      onChange({
        ...property,
        features: [...property.features, customFeature.trim()],
      });
    }
    setCustomFeature('');
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Detailed specs answer 90% of buyer questions upfront and justify your asking price. The more specific your upgrades and feature chips are, the stronger your AI listing copy will be."
        nextLabel="AI Feature Finder"
        onNext={() => onNavigate('ai-finder')}
      />

      {/* Basic Specs Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-[#0F2A44]/10 dark:bg-slate-800 text-[#0F2A44] dark:text-[#FF6B5A] flex items-center justify-center font-bold">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Basic Core Facts
            </h3>
            <p className="text-xs text-slate-500">The primary dimensions and characteristics of the property.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Asking Price ($)
            </label>
            <input
              type="number"
              value={property.price || ''}
              onChange={(e) => handleFieldChange('price', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F2A44] dark:text-white focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bedrooms
            </label>
            <input
              type="number"
              value={property.beds || ''}
              onChange={(e) => handleFieldChange('beds', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Baths
            </label>
            <input
              type="number"
              value={property.bathsFull || ''}
              onChange={(e) => handleFieldChange('bathsFull', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Half Baths
            </label>
            <input
              type="number"
              value={property.bathsHalf || ''}
              onChange={(e) => handleFieldChange('bathsHalf', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Finished Sq Ft
            </label>
            <input
              type="number"
              value={property.sqft || ''}
              onChange={(e) => handleFieldChange('sqft', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Year Built
            </label>
            <input
              type="number"
              value={property.yearBuilt || ''}
              onChange={(e) => handleFieldChange('yearBuilt', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div className="col-span-2 sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Lot Size (e.g. 0.34 acres or 75 x 120 ft)
            </label>
            <input
              type="text"
              value={property.lotSize}
              onChange={(e) => handleFieldChange('lotSize', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div className="col-span-2 sm:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={property.address}
              onChange={(e) => {
                const newAddr = e.target.value;
                const detected = detectStateFromAddress(newAddr);
                if (detected && detected !== property.state) {
                  onChange({ ...property, address: newAddr, state: detected });
                } else {
                  handleFieldChange('address', newAddr);
                }
              }}
              placeholder="e.g. 4288 Meadowview Drive"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div className="col-span-1 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={property.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="e.g. Rochester Hills"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div className="col-span-1 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Property State <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={property.state || 'Michigan'}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F2A44] dark:text-white focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            >
              {US_STATES.map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={property.zip}
              onChange={(e) => handleFieldChange('zip', e.target.value)}
              placeholder="e.g. 48306"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Taxes, Schools & Utilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taxes & Schools */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <DollarSign className="w-4 h-4 text-[#FF6B5A]" />
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Taxes & School District
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Annual Property Taxes ($/yr)
            </label>
            <input
              type="number"
              value={property.taxes || ''}
              onChange={(e) => handleFieldChange('taxes', parseInt(e.target.value) || 0)}
              placeholder="e.g. 4620"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Buyers look at winter + summer tax bills to budget monthly <Tooltip term="Escrow" /> payments.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Public School District
            </label>
            <input
              type="text"
              value={property.schoolDistrict}
              onChange={(e) => handleFieldChange('schoolDistrict', e.target.value)}
              placeholder="e.g. Rochester Community Schools"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>
        </div>

        {/* Monthly Utilities */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Zap className="w-4 h-4 text-[#F2B544]" />
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Average Monthly Utility Costs
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transparency here prevents buyer cold feet later when reviewing monthly operating costs.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Gas ($/mo)
              </label>
              <input
                type="number"
                value={property.utilities?.gas || ''}
                onChange={(e) => handleUtilityChange('gas', parseInt(e.target.value) || 0)}
                placeholder="95"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Electric ($/mo)
              </label>
              <input
                type="number"
                value={property.utilities?.electric || ''}
                onChange={(e) => handleUtilityChange('electric', parseInt(e.target.value) || 0)}
                placeholder="120"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <Droplet className="w-3.5 h-3.5 text-blue-500" /> Water ($/mo)
              </label>
              <input
                type="number"
                value={property.utilities?.water || ''}
                onChange={(e) => handleUtilityChange('water', parseInt(e.target.value) || 0)}
                placeholder="50"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Systems, HOA, Structure */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          Structure & Systems
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Heating System
            </label>
            <input
              type="text"
              value={property.heating}
              onChange={(e) => handleFieldChange('heating', e.target.value)}
              placeholder="e.g. Forced Air (Natural Gas)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cooling / Air Conditioning
            </label>
            <input
              type="text"
              value={property.cooling}
              onChange={(e) => handleFieldChange('cooling', e.target.value)}
              placeholder="e.g. Central Air (New 2021)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Garage Capacity & Type
            </label>
            <input
              type="text"
              value={property.garage}
              onChange={(e) => handleFieldChange('garage', e.target.value)}
              placeholder="e.g. 2-Car Attached with storage"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Basement
            </label>
            <input
              type="text"
              value={property.basement}
              onChange={(e) => handleFieldChange('basement', e.target.value)}
              placeholder="e.g. Finished daylight basement"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Roof Type & Age
            </label>
            <input
              type="text"
              value={property.roof}
              onChange={(e) => handleFieldChange('roof', e.target.value)}
              placeholder="e.g. Dimensional Shingles (Installed 2022)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              HOA (Homeowners Association)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={property.hoa.hasHoa ? `$${property.hoa.monthlyFee}/mo (${property.hoa.name})` : 'No HOA'}
                onChange={(e) =>
                  handleFieldChange('hoa', {
                    ...property.hoa,
                    name: e.target.value,
                    hasHoa: true,
                  })
                }
                placeholder="e.g. $35/mo or No HOA"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrades List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Capital Upgrades & Improvements
            </h3>
            <p className="text-xs text-slate-500">
              List new big-ticket items with year (e.g. "Roof – 2022", "Furnace – 2020").
            </p>
          </div>
        </div>

        {/* Existing Upgrades */}
        <div className="space-y-2 mb-4">
          {property.upgrades.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0F2A44] text-white dark:bg-[#FF6B5A]">
                  {u.year}
                </span>
                <span className="text-sm font-semibold text-[#0F2A44] dark:text-white">{u.item}</span>
                {u.cost && (
                  <span className="text-xs text-slate-400">
                    (~${u.cost.toLocaleString()})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveUpgrade(u.id)}
                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Upgrade Form */}
        <form onSubmit={handleAddUpgrade} className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            value={newUpgradeItem}
            onChange={(e) => setNewUpgradeItem(e.target.value)}
            placeholder="Upgrade description (e.g. New Trex Composite Deck)"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
          />
          <input
            type="text"
            value={newUpgradeYear}
            onChange={(e) => setNewUpgradeYear(e.target.value)}
            placeholder="Year (e.g. 2023)"
            className="w-full sm:w-28 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
          />
          <input
            type="number"
            value={newUpgradeCost}
            onChange={(e) => setNewUpgradeCost(e.target.value)}
            placeholder="Cost $ (opt)"
            className="w-full sm:w-28 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#0F2A44] hover:bg-[#1C4164] dark:bg-[#FF6B5A] dark:hover:bg-[#fa5644] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Upgrade
          </button>
        </form>
      </div>

      {/* Top 3 Things That Make This House Special */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#F2B544]" />
          <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
            What Makes This House Special (Top 3 Things)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Think about what made you fall in love with this home when you bought it.
        </p>

        <div className="space-y-3">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#F2B544]/20 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                {idx + 1}
              </span>
              <textarea
                rows={2}
                value={property.specialNotes[idx] || ''}
                onChange={(e) => handleSpecialNoteChange(idx, e.target.value)}
                placeholder={`Special feature #${idx + 1} (e.g. Private wooded lot with no rear neighbors, sunset views, heated garage)`}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Features Checklist by Room & Category */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Features Checklist (Tappable Chips)
            </h3>
            <p className="text-xs text-slate-500">
              Tap to toggle features included in your home. These feed into your property flyer, website, and AI listing generator.
            </p>
          </div>
          <span className="text-xs font-bold text-[#FF6B5A]">
            {property.features.length} selected
          </span>
        </div>

        <div className="space-y-6">
          {Object.entries(FEATURE_CATEGORIES).map(([catName, chips]) => (
            <div key={catName}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
                {catName}
              </h4>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => {
                  const isSelected = property.features.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleFeature(chip)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#0F2A44] text-white shadow-sm ring-1 ring-[#0F2A44] dark:bg-[#FF6B5A] dark:ring-[#FF6B5A]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-[#F2B544] dark:text-white" /> : null}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom feature chip */}
        <form onSubmit={handleAddCustomFeature} className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={customFeature}
            onChange={(e) => setCustomFeature(e.target.value)}
            placeholder="Add another custom feature (e.g. EV Charger Outlet, Radon Mitigation)"
            className="flex-1 max-w-md px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-[#FF6B5A] focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1B3C5E] dark:bg-[#FF6B5A]"
          >
            + Add Chip
          </button>
        </form>
      </div>
    </div>
  );
};
