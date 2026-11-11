import React, { useState } from 'react';
import {
  PropertyProfile,
  CompSale,
  PriceHistoryRecord,
  Settings,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { Tooltip } from '../common/Tooltip';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

interface SectionPricingProps {
  property: PropertyProfile;
  comps: CompSale[];
  priceHistory: PriceHistoryRecord[];
  settings: Settings;
  onUpdateComps: (comps: CompSale[]) => void;
  onUpdatePriceHistory: (history: PriceHistoryRecord[]) => void;
  onUpdateProperty: (prop: PropertyProfile) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionPricing: React.FC<SectionPricingProps> = ({
  property,
  comps,
  priceHistory,
  settings,
  onUpdateComps,
  onUpdatePriceHistory,
  onUpdateProperty,
  onNavigate,
}) => {
  // New comp form
  const [newAddress, setNewAddress] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newSqft, setNewSqft] = useState('');
  const [newBeds, setNewBeds] = useState('');
  const [newBaths, setNewBaths] = useState('');
  const [newDistance, setNewDistance] = useState('');
  const [newCondition, setNewCondition] = useState<'Superior' | 'Similar' | 'Inferior'>('Similar');
  const [newAdjustments, setNewAdjustments] = useState('0');
  const [newNotes, setNewNotes] = useState('');
  const [compError, setCompError] = useState<string | null>(null);

  // Price change modal / form
  const [changePriceVal, setChangePriceVal] = useState(property.price.toString());
  const [priceChangeReason, setPriceChangeReason] = useState('Listing adjustment for market positioning');

  // Calculate Comps Averages and Range
  const adjustedComps = comps.map((c) => {
    const adjusted = c.salePrice + (c.adjustments || 0);
    const ppsqft = c.sqft > 0 ? Math.round(adjusted / c.sqft) : 0;
    return { ...c, adjustedPrice: adjusted, pricePerSqFt: ppsqft };
  });

  const validAdjustedPrices = adjustedComps.map((c) => c.adjustedPrice).filter((p) => p > 0);
  const avgAdjusted =
    validAdjustedPrices.length > 0
      ? Math.round(validAdjustedPrices.reduce((a, b) => a + b, 0) / validAdjustedPrices.length)
      : property.price || 435000;

  const lowPrice = Math.round(avgAdjusted * 0.96);
  const likelyPrice = avgAdjusted;
  const highPrice = Math.round(avgAdjusted * 1.04);

  // Overpriced check (> 5% above high range)
  const isOverpriced = property.price > highPrice * 1.02;
  const pctOver = Math.round(((property.price - likelyPrice) / likelyPrice) * 100);

  // Add Comp
  const handleAddComp = (e: React.FormEvent) => {
    e.preventDefault();
    setCompError(null);

    const missing: string[] = [];
    if (!newAddress.trim()) missing.push('Address');
    if (!newPrice.trim() || parseInt(newPrice) <= 0) missing.push('Sale Price');
    if (!newSqft.trim() || parseInt(newSqft) <= 0) missing.push('Sq Ft');

    if (missing.length > 0) {
      setCompError(`Please fill in required fields: ${missing.join(', ')}.`);
      return;
    }

    const salePrice = parseInt(newPrice) || 0;
    const adjustments = parseInt(newAdjustments) || 0;
    const sqft = parseInt(newSqft) || 2000;
    const adjustedPrice = salePrice + adjustments;

    const newComp: CompSale = {
      id: 'comp-' + Date.now(),
      address: newAddress,
      salePrice,
      saleDate: newDate || new Date().toISOString().split('T')[0],
      sqft,
      beds: parseFloat(newBeds) || 3,
      baths: parseFloat(newBaths) || 2,
      distance: newDistance || '0.3 mi',
      condition: newCondition,
      adjustments,
      adjustedPrice,
      pricePerSqFt: sqft > 0 ? Math.round(adjustedPrice / sqft) : 0,
      notes: newNotes,
    };

    onUpdateComps([...comps, newComp]);

    // reset
    setNewAddress('');
    setNewPrice('');
    setNewSqft('');
    setNewBeds('');
    setNewBaths('');
    setNewDistance('');
    setNewAdjustments('0');
    setNewNotes('');
  };

  // Delete Comp
  const handleDeleteComp = (id: string) => {
    onUpdateComps(comps.filter((c) => c.id !== id));
  };

  // Adjustments change
  const handleCompAdjustmentChange = (id: string, adjValue: number) => {
    onUpdateComps(
      comps.map((c) => {
        if (c.id === id) {
          const adjustedPrice = c.salePrice + adjValue;
          return {
            ...c,
            adjustments: adjValue,
            adjustedPrice,
            pricePerSqFt: c.sqft > 0 ? Math.round(adjustedPrice / c.sqft) : 0,
          };
        }
        return c;
      })
    );
  };

  // Price Change execution
  const handleExecutePriceChange = (e: React.FormEvent) => {
    e.preventDefault();
    const newP = parseInt(changePriceVal);
    if (!newP || newP === property.price) return;

    const newRecord: PriceHistoryRecord = {
      id: 'ph-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      oldPrice: property.price,
      newPrice: newP,
      reason: priceChangeReason,
    };

    onUpdatePriceHistory([newRecord, ...priceHistory]);
    onUpdateProperty({
      ...property,
      price: newP,
      originalPrice: property.originalPrice || property.price,
    });
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Pricing correctly from Day 1 is the single greatest competitive advantage for FSBO sellers. Homes priced in the sweet spot generate bidding activity within 14 days, while overpriced homes sit and stigmatize."
        nextLabel="Listing Writer"
        onNext={() => onNavigate('listing')}
      />

      {/* Suggested Price Range Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B5A]">
              Market Value Analysis
            </span>
            <h3 className="font-heading font-bold text-xl text-[#0F2A44] dark:text-white">
              Suggested Valuation Range: ${lowPrice.toLocaleString()} – ${highPrice.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500">
              Calculated from {comps.length} nearby comparable recent sales, adjusted for square footage and condition.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500">Current Asking Price:</span>
            <strong className="text-base text-[#0F2A44] dark:text-white font-heading">
              ${property.price.toLocaleString()}
            </strong>
          </div>
        </div>

        {/* 3 Range Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Conservative / Fast Sale */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Competitive / Fast Sale
            </span>
            <div className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-200">
              ${lowPrice.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Drives intense first-weekend traffic and multiple buyer offers.
            </p>
          </div>

          {/* Likely Fair Market */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1 ring-2 ring-emerald-500/20">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Likely Fair Market Target
            </div>
            <div className="text-2xl font-bold font-heading text-emerald-900 dark:text-emerald-200">
              ${likelyPrice.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
              Solid sweet spot based on the comparable sales you entered.
            </p>
          </div>

          {/* Premium / Upper Bound */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-center space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Premium / Upper Ceiling
            </span>
            <div className="text-2xl font-bold font-heading text-slate-800 dark:text-slate-200">
              ${highPrice.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              Requires flawless staging and may face buyer appraisal contingency friction.
            </p>
          </div>
        </div>

        {/* Overpriced Warning if applicable */}
        {isOverpriced && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="font-bold text-sm">
                Warning: Asking price is {pctOver}% above likely market range
              </strong>
              <p>
                Overpriced homes sit online and go stale. When a house stays on market past 21 days without offers, buyers assume something is wrong and submit lowball bids. Consider aligning closer to <strong>${likelyPrice.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Comparable Sales Worksheet Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#FF6B5A]" />
              Comparable Sales (<Tooltip term="Comps" />) Worksheet
            </h3>
            <p className="text-xs text-slate-500">
              Adjust (+/−) for differences like extra garage stall, finished basement, or pool.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {comps.length} Comps Recorded
          </span>
        </div>

        {/* Comps Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Sold Address</th>
                <th className="p-3">Sold Price</th>
                <th className="p-3">Beds / Baths / SqFt</th>
                <th className="p-3">Distance / Condition</th>
                <th className="p-3">
                  <Tooltip term="Seller Concessions" definition="Adjustment: Positive (+) if your home is superior, negative (-) if comp is better.">
                    Adjustments ($)
                  </Tooltip>
                </th>
                <th className="p-3">Adjusted Value</th>
                <th className="p-3">$/SqFt</th>
                <th className="p-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {adjustedComps.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-3">
                    <div className="font-bold text-[#0F2A44] dark:text-white">{c.address}</div>
                    <div className="text-[10px] text-slate-400">Sold {c.saleDate}</div>
                    {c.notes && <div className="text-[10px] text-slate-500 italic mt-0.5">{c.notes}</div>}
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">
                    ${c.salePrice.toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {c.beds} bd • {c.baths} ba • {c.sqft} sqft
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c.distance} • {c.condition}
                    </span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step={500}
                      value={c.adjustments}
                      onChange={(e) =>
                        handleCompAdjustmentChange(c.id, parseInt(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none"
                    />
                  </td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                    ${c.adjustedPrice.toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-500">
                    ${c.pricePerSqFt}/sqft
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteComp(c.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Comp Form */}
        <form
          onSubmit={handleAddComp}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3"
        >
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
            + Add Another Nearby Comparable Sale
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Address (e.g. 1920 Oak St)"
              className="col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Sale Price ($)"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <input
              type="number"
              value={newSqft}
              onChange={(e) => setNewSqft(e.target.value)}
              placeholder="Sq Ft"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <input
              type="number"
              step={0.5}
              value={newBeds}
              onChange={(e) => setNewBeds(e.target.value)}
              placeholder="Beds"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <input
              type="number"
              step={0.5}
              value={newBaths}
              onChange={(e) => setNewBaths(e.target.value)}
              placeholder="Baths"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <input
              type="text"
              value={newDistance}
              onChange={(e) => setNewDistance(e.target.value)}
              placeholder="Dist (0.2 mi)"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <select
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            >
              <option value="Similar">Similar Condition</option>
              <option value="Superior">Superior</option>
              <option value="Inferior">Inferior</option>
            </select>
            <input
              type="number"
              step={500}
              value={newAdjustments}
              onChange={(e) => setNewAdjustments(e.target.value)}
              placeholder="Adjustments ($)"
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="col-span-2 sm:col-span-1 px-4 py-1.5 rounded-lg font-bold text-xs text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
            >
              Add Comp
            </button>
          </div>
          {compError && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{compError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Two Call-to-Action Appraisal Cards (Editable URLs via Settings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-[#0F2A44] text-white space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F2B544]">
              Homeowner Appraisal Tool
            </span>
            <Award className="w-4 h-4 text-[#F2B544]" />
          </div>
          <h4 className="text-base font-bold font-heading">
            Get the Home Value Worksheet
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download our comprehensive professional valuation worksheet to calculate pin-point price per square foot metrics and neighborhood adjustments.
          </p>
          <div className="pt-2">
            <a
              href={settings.homeValueWorksheetUrl || 'https://ecenturyappraisal.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#0F2A44] bg-[#F2B544] hover:bg-[#e6a938] transition-all shadow-sm"
            >
              <span>Get Worksheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1E6F80] to-[#0F2A44] text-white space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Licensed Independent Appraisal
            </span>
            <DollarSign className="w-4 h-4 text-emerald-300" />
          </div>
          <h4 className="text-base font-bold font-heading">
            Order an Independent Appraisal
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            A solid, unbiased licensed appraisal report gives you ironclad proof to shut down lowball offers and prevent buyer financing surprises.
          </p>
          <div className="pt-2">
            <a
              href={settings.appraisalOrderUrl || 'https://ecenturyappraisal.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] transition-all shadow-sm"
            >
              <span>Order Appraisal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Price History Log & Workflow */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
              Price Change Log & Workflow
            </h3>
            <p className="text-xs text-slate-500">
              Any price reduction triggers a "Price Reduced" ribbon across your property website and syndication feeds.
            </p>
          </div>
          {property.originalPrice && property.price < property.originalPrice && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              Price Reduced by ${(property.originalPrice - property.price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Change Price Form */}
        <form
          onSubmit={handleExecutePriceChange}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="w-full sm:w-44">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">New Asking Price ($)</label>
            <input
              type="number"
              value={changePriceVal}
              onChange={(e) => setChangePriceVal(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-[#0F2A44] dark:text-white focus:outline-none"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Adjustment Reason / Notes</label>
            <input
              type="text"
              value={priceChangeReason}
              onChange={(e) => setPriceChangeReason(e.target.value)}
              placeholder="e.g. Strategic price improvement for weekend open house"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 mt-4 sm:mt-0 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] shrink-0"
          >
            Update Price & Log
          </button>
        </form>

        {/* Price History List */}
        {priceHistory.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Recorded Changes:
            </span>
            {priceHistory.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">{rec.date}:</span>
                  <span className="line-through text-slate-400">
                    ${rec.oldPrice.toLocaleString()}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    → ${rec.newPrice.toLocaleString()}
                  </span>
                  <span className="text-slate-500 italic">({rec.reason})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
