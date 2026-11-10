import React, { useState } from 'react';
import {
  DocumentItem,
  OfferItem,
  ClosingTeamInfo,
  PropertyProfile,
  Settings,
  ActiveTab,
} from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import { Tooltip } from '../common/Tooltip';
import { saveDocToDB } from '../../lib/indexedDb';
import {
  CheckCircle2,
  FileText,
  Upload,
  DollarSign,
  ShieldAlert,
  Building,
  Calendar,
  Plus,
  Trash2,
  Award,
  AlertTriangle,
  FileCheck,
  Phone,
  Mail,
  Info,
} from 'lucide-react';

interface SectionClosingProps {
  property: PropertyProfile;
  settings: Settings;
  documents: DocumentItem[];
  offers: OfferItem[];
  closingTeam: ClosingTeamInfo;
  onUpdateDocuments: (docs: DocumentItem[]) => void;
  onUpdateOffers: (offers: OfferItem[]) => void;
  onUpdateClosingTeam: (team: ClosingTeamInfo) => void;
  onNavigate: (tab: ActiveTab) => void;
}

export const SectionClosing: React.FC<SectionClosingProps> = ({
  property,
  settings,
  documents,
  offers,
  closingTeam,
  onUpdateDocuments,
  onUpdateOffers,
  onUpdateClosingTeam,
  onNavigate,
}) => {
  // Offer modal state
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [offerPrice, setOfferPrice] = useState(property.price.toString());
  const [financingType, setFinancingType] = useState<OfferItem['financingType']>('Conventional');
  const [downPaymentPct, setDownPaymentPct] = useState('20');
  const [earnestMoney, setEarnestMoney] = useState('5000');
  const [closingDate, setClosingDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [sellerConcessions, setSellerConcessions] = useState('0');
  const [offerNotes, setOfferNotes] = useState('');

  // Closing timeline checklist state
  const [closingChecklist, setClosingChecklist] = useState<Record<string, boolean>>({
    '1. Sign & execute formal Purchase Agreement with buyer': false,
    '2. Buyer deposits earnest money into neutral title company escrow': false,
    '3. Home inspection completed (typically within 7–10 days)': false,
    '4. Resolve any repair requests or inspection credits': false,
    '5. Lender appraisal completed & property value verified': false,
    '6. Title search completed & title commitment issued': false,
    '7. Buyer receives "Clear to Close" from lender': false,
    '8. Final walkthrough within 24 hours of closing': false,
    '9. Sign closing documents at title company & receive proceeds wired': false,
  });

  const toggleClosingMilestone = (item: string) => {
    setClosingChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // Upload document handler
  const handleUploadDocument = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      await saveDocToDB(docId, dataUrl, file.name);

      const updated = documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              fileName: file.name,
              uploadDate: new Date().toISOString().split('T')[0],
              status: 'Uploaded' as const,
            }
          : d
      );
      onUpdateDocuments(updated);
    };
    reader.readAsDataURL(file);
  };

  // Calculate Net to Seller for an offer
  // Net = Price - Concessions - Estimated Title/Transfer Tax (~1.5% in Michigan: transfer tax is $8.60 per $1,000 + title fees)
  const calculateNet = (price: number, concessions: number) => {
    const miTransferTaxAndTitle = Math.round(price * 0.015);
    return Math.max(0, price - concessions - miTransferTaxAndTitle);
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) return;

    const price = parseInt(offerPrice) || property.price;
    const concessions = parseInt(sellerConcessions) || 0;
    const estClosingCosts = Math.round(price * 0.015);
    const net = calculateNet(price, concessions);

    const newOffer: OfferItem = {
      id: 'offer-' + Date.now(),
      buyerName: buyerName.trim(),
      offerPrice: price,
      financingType,
      downPaymentPct: parseInt(downPaymentPct) || 20,
      earnestMoney: parseInt(earnestMoney) || 5000,
      contingencies: ['Inspection (7 days)', 'Financing (21 days)', 'Appraisal'],
      closingDate,
      sellerConcessions: concessions,
      estimatedClosingCosts: estClosingCosts,
      netToSeller: net,
      notes: offerNotes,
      status: 'Reviewing',
    };

    onUpdateOffers([...offers, newOffer]);
    setBuyerName('');
    setOfferNotes('');
    setShowAddOfferModal(false);
  };

  const handleDeleteOffer = (id: string) => {
    onUpdateOffers(offers.filter((o) => o.id !== id));
  };

  const handleOfferStatusChange = (id: string, status: OfferItem['status']) => {
    onUpdateOffers(
      offers.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  // Filter documents: Lead-paint disclosure shown ONLY if built before 1978!
  const isBuiltBefore1978 = property.yearBuilt && property.yearBuilt < 1978;
  const filteredDocuments = documents.filter((d) => {
    if (d.onlyBefore1978 && !isBuiltBefore1978) return false;
    return true;
  });

  // Identify highest net offer
  const highestNetOffer =
    offers.length > 0
      ? [...offers].sort((a, b) => b.netToSeller - a.netToSeller)[0]
      : null;

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Having your disclosures and closing team lined up builds buyer confidence. Once you accept an offer, a Michigan title company or real estate attorney will draft contracts and close escrow safely."
        nextLabel="Settings & Backup"
        onNext={() => onNavigate('settings')}
      />

      {/* Prominent Legal Disclaimer as specified */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-700/80 shadow-md flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-[#F2B544] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="text-[#F2B544] font-bold text-sm block">
            Important Legal & Closing Notice
          </strong>
          <p className="text-slate-300 leading-relaxed">
            This app gives general information, not legal or tax advice. Use a {settings.state || 'Michigan'} real estate attorney or title company for contracts and closing.
          </p>
        </div>
      </div>

      {/* Document Checklist & Upload Slots */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#FF6B5A]" />
              Required & Recommended Document Repository
            </h3>
            <p className="text-xs text-slate-500">
              Upload completed disclosure PDFs to hand to serious buyers and title officers.
            </p>
          </div>
          <span className="text-xs font-bold text-[#FF6B5A]">
            {filteredDocuments.filter((d) => d.status === 'Uploaded').length} of {filteredDocuments.length} Uploaded
          </span>
        </div>

        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                doc.status === 'Uploaded'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                  : doc.required
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#0F2A44] dark:text-white">
                    {doc.name}
                  </span>
                  {doc.required && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                      Required by Law
                    </span>
                  )}
                  {doc.status === 'Uploaded' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Uploaded ({doc.fileName})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{doc.note}</p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{doc.status === 'Uploaded' ? 'Replace PDF' : 'Upload PDF'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleUploadDocument(doc.id, e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offer Comparison & Net-to-Seller Tool */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Side-by-Side Offer Comparison & <Tooltip term="Net to Seller" /> Calculator
            </h3>
            <p className="text-xs text-slate-500">
              Compare purchase price minus buyer concessions and transfer taxes to evaluate true take-home proceeds.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddOfferModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            + Enter New Offer
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            No offers entered yet. When a buyer or their agent submits a written purchase offer, click "Enter New Offer" to compare.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const isHighestNet = highestNetOffer?.id === offer.id && offers.length > 1;

              return (
                <div
                  key={offer.id}
                  className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 transition-all relative ${
                    isHighestNet
                      ? 'border-emerald-400 ring-2 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isHighestNet && (
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow flex items-center gap-1">
                      <Award className="w-3 h-3" /> Highest Net Proceeds
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-[#0F2A44] dark:text-white">
                        {offer.buyerName}
                      </h4>
                      <select
                        value={offer.status}
                        onChange={(e) => handleOfferStatusChange(offer.id, e.target.value as any)}
                        className="text-xs font-bold px-2 py-0.5 rounded-lg border bg-slate-100 dark:bg-slate-800 focus:outline-none"
                      >
                        <option value="Reviewing">Reviewing</option>
                        <option value="Accepted">Accepted ✅</option>
                        <option value="Countered">Countered 🔄</option>
                        <option value="Declined">Declined ❌</option>
                      </select>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Estimated Net to Seller
                      </span>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
                        ${offer.netToSeller.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Gross Offer: ${offer.offerPrice.toLocaleString()} • Concessions: -${offer.sellerConcessions.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Financing:</span>
                        <strong className="text-slate-800 dark:text-white">{offer.financingType} ({offer.downPaymentPct}% Down)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500"><Tooltip term="Earnest Money" />:</span>
                        <strong>${offer.earnestMoney.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Closing Date:</span>
                        <strong>{offer.closingDate}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500"><Tooltip term="Contingency" /> Clauses:</span>
                        <span className="text-[11px] font-medium">{offer.contingencies.join(', ')}</span>
                      </div>
                    </div>

                    {offer.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                        "{offer.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Offer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Closing Team Tracker (Attorney / Title Company) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-slate-800 text-blue-600 flex items-center justify-center font-bold">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Closing Team Tracker (Real Estate Attorney & Title Company)
            </h3>
            <p className="text-xs text-slate-500">
              A Michigan real estate attorney or title company prepares the standard purchase agreement, coordinates escrow, runs title work, and oversees closing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Company / Attorney Name</label>
            <input
              type="text"
              value={closingTeam.attorneyOrTitle}
              onChange={(e) => onUpdateClosingTeam({ ...closingTeam, attorneyOrTitle: e.target.value })}
              placeholder="e.g. First American Title or Local Attorney"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Closing Officer / Contact</label>
            <input
              type="text"
              value={closingTeam.contactPerson}
              onChange={(e) => onUpdateClosingTeam({ ...closingTeam, contactPerson: e.target.value })}
              placeholder="e.g. Jessica Parker (Escrow Officer)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Phone & Email</label>
            <input
              type="text"
              value={`${closingTeam.phone} • ${closingTeam.email}`}
              onChange={(e) => onUpdateClosingTeam({ ...closingTeam, phone: e.target.value })}
              placeholder="(248) 555-0199 • title@firstam.com"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Flat Fee Quoted ($)</label>
            <input
              type="number"
              value={closingTeam.flatFeeQuoted || ''}
              onChange={(e) => onUpdateClosingTeam({ ...closingTeam, flatFeeQuoted: parseInt(e.target.value) || 0 })}
              placeholder="e.g. 850"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Closing Timeline Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Under-Contract to Closing Timeline Checklist
            </h3>
            <p className="text-xs text-slate-500">
              Step-by-step roadmap from accepted purchase agreement to receiving your wired funds.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(closingChecklist).map(([milestone, done]) => (
            <div
              key={milestone}
              onClick={() => toggleClosingMilestone(milestone)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                done
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 line-through text-slate-400'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => {}}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{milestone}</span>
              </div>
              {done && <span className="text-[10px] font-bold text-emerald-600">Complete</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Enter Offer Modal */}
      {showAddOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Enter Received Buyer Offer
            </h4>
            <form onSubmit={handleAddOffer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Buyer Name / Agent</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Jason & Ashley Clark"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gross Offer Price ($)</label>
                  <input
                    type="number"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Seller Concessions ($)</label>
                  <input
                    type="number"
                    value={sellerConcessions}
                    onChange={(e) => setSellerConcessions(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Financing Type</label>
                  <select
                    value={financingType}
                    onChange={(e) => setFinancingType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Cash">Cash (No Financing)</option>
                    <option value="Conventional">Conventional</option>
                    <option value="FHA">FHA</option>
                    <option value="VA">VA</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Down Payment %</label>
                  <input
                    type="number"
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Earnest Money ($)</label>
                  <input
                    type="number"
                    value={earnestMoney}
                    onChange={(e) => setEarnestMoney(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Closing Date</label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddOfferModal(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#0F2A44] dark:bg-[#FF6B5A]"
                >
                  Save & Calculate Net
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
