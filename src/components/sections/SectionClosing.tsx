import React, { useState, useEffect } from 'react';
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
import { getStateDisclosureInfo } from '../../lib/stateDisclosures';
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
  ExternalLink,
  Edit2,
  Check,
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
  // Resolve current governing state and state disclosures config
  const selectedState = property.state || settings.state || 'Michigan';
  const stateInfo = getStateDisclosureInfo(selectedState);

  // Transfer tax rate state (defaults to state config rate, but editable by user)
  const defaultTaxRate = stateInfo.transferTaxRatePerThousand ?? 0;
  const [customTaxRate, setCustomTaxRate] = useState<string>(defaultTaxRate.toString());
  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false);

  useEffect(() => {
    setCustomTaxRate((stateInfo.transferTaxRatePerThousand ?? 0).toString());
  }, [stateInfo.stateCode, stateInfo.transferTaxRatePerThousand]);

  const effectiveTaxRate =
    !isNaN(parseFloat(customTaxRate)) && parseFloat(customTaxRate) >= 0
      ? parseFloat(customTaxRate)
      : defaultTaxRate;

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

      const existingIndex = documents.findIndex((d) => d.id === docId);
      if (existingIndex >= 0) {
        const updated = documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                fileName: file.name,
                uploadDate: new Date().toISOString().split('T')[0],
                status: 'Uploaded' as const,
                completed: true,
              }
            : d
        );
        onUpdateDocuments(updated);
      } else {
        // Document item was not in local array yet, add it
        const newDoc: DocumentItem = {
          id: docId,
          name: docId === 'lead-paint-disclosure'
            ? 'Lead-Based Paint Disclosure (required for homes built before 1978)'
            : stateInfo.formName,
          category: 'Required',
          required: true,
          fileName: file.name,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Uploaded',
          completed: true,
          note: stateInfo.summary,
        };
        onUpdateDocuments([...documents, newDoc]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle document completed checkbox
  const handleToggleDocCompleted = (docId: string) => {
    const existingIndex = documents.findIndex((d) => d.id === docId);
    if (existingIndex >= 0) {
      const updated = documents.map((d) =>
        d.id === docId
          ? {
              ...d,
              completed: !d.completed,
              status: !d.completed ? ('Uploaded' as const) : d.fileName ? ('Uploaded' as const) : ('Missing' as const),
            }
          : d
      );
      onUpdateDocuments(updated);
    } else {
      const newDoc: DocumentItem = {
        id: docId,
        name: docId === 'lead-paint-disclosure'
          ? 'Lead-Based Paint Disclosure (required for homes built before 1978)'
          : stateInfo.formName,
        category: 'Required',
        required: true,
        completed: true,
        status: 'Uploaded',
        note: stateInfo.summary,
      };
      onUpdateDocuments([...documents, newDoc]);
    }
  };

  // Calculate Net to Seller for an offer
  // Net = Price - Concessions - Transfer Tax ($ per $1,000) - Estimated Title/Escrow fees
  const calculateNet = (price: number, concessions: number) => {
    const transferTax = Math.round((price / 1000) * effectiveTaxRate);
    const estTitleFees = closingTeam.flatFeeQuoted > 0 ? closingTeam.flatFeeQuoted : Math.round(price * 0.005);
    const totalClosingCosts = transferTax + estTitleFees;
    return Math.max(0, price - concessions - totalClosingCosts);
  };

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) return;

    const price = parseInt(offerPrice) || property.price;
    const concessions = parseInt(sellerConcessions) || 0;
    const transferTax = Math.round((price / 1000) * effectiveTaxRate);
    const estTitleFees = closingTeam.flatFeeQuoted > 0 ? closingTeam.flatFeeQuoted : Math.round(price * 0.005);
    const estClosingCosts = transferTax + estTitleFees;
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

  // 1. Federal Lead-Based Paint: shown ONLY if property.yearBuilt < 1978!
  const isBuiltBefore1978 = Boolean(property.yearBuilt && property.yearBuilt < 1978);
  const leadPaintDoc = documents.find((d) => d.id === 'lead-paint-disclosure');

  // 2. State-specific seller disclosure item
  const stateSellerDoc =
    documents.find((d) => d.id === 'state-seller-disclosure' || d.id === 'mi-seller-disclosure') ||
    documents.find((d) => d.id.includes('seller-disclosure'));

  // 3. Other supporting documents (survey, tax bills, utilities, warranties)
  const supportingDocs = documents.filter(
    (d) =>
      d.id !== 'lead-paint-disclosure' &&
      d.id !== 'state-seller-disclosure' &&
      d.id !== 'mi-seller-disclosure' &&
      !d.id.includes('seller-disclosure')
  );

  // Identify highest net offer
  const highestNetOffer =
    offers.length > 0
      ? [...offers].sort((a, b) => b.netToSeller - a.netToSeller)[0]
      : null;

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip={`Having your disclosures and closing team lined up builds buyer confidence. Once you accept an offer, a ${stateInfo.stateName} title company or real estate attorney will draft contracts and close escrow safely.`}
        nextLabel="Settings & Backup"
        onNext={() => onNavigate('settings')}
      />

      {/* Prominent Legal Disclaimer */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-700/80 shadow-md flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-[#F2B544] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <strong className="text-[#F2B544] font-bold text-sm block">
            Important Legal & Closing Notice
          </strong>
          <p className="text-slate-300 leading-relaxed">
            This app gives general information, not legal or tax advice. Use a {stateInfo.stateName} real estate attorney or title company for contracts and closing.
          </p>
        </div>
      </div>

      {/* State & Federal Disclosures Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#FF6B5A]" />
              State & Federal Disclosure Checklist ({stateInfo.stateName})
            </h3>
            <p className="text-xs text-slate-500">
              Complete required statutory disclosures and upload executed copies for buyers and escrow officers.
            </p>
          </div>
          <span className="text-xs font-bold text-[#FF6B5A]">
            Governing State: {stateInfo.stateName} ({stateInfo.stateCode})
          </span>
        </div>

        {/* Required Mandatory Disclaimer Note at Top of Checklist */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Disclosure Notice:</strong> Disclosure rules vary by state and can change. This checklist is general information, not legal advice. Confirm requirements with a local real estate attorney or title company before you sign.
          </p>
        </div>

        {/* Disclosures Checklist Items */}
        <div className="space-y-3.5 pt-1">
          {/* 1. Federal Lead-Based Paint Disclosure (ONLY shown if property built before 1978) */}
          {isBuiltBefore1978 ? (
            <div className="p-4 rounded-2xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(leadPaintDoc?.completed || leadPaintDoc?.status === 'Uploaded')}
                      onChange={() => handleToggleDocCompleted('lead-paint-disclosure')}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#0F2A44] dark:text-white">
                      Lead-Based Paint Disclosure (required for homes built before 1978)
                    </span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    Federal Requirement (Built {property.yearBuilt})
                  </span>
                  {(leadPaintDoc?.completed || leadPaintDoc?.status === 'Uploaded') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      ✓ Completed {leadPaintDoc.fileName ? `(${leadPaintDoc.fileName})` : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Federal law (42 U.S. Code § 4852d) strictly requires sellers of pre-1978 housing to provide buyers with an EPA-approved lead hazard information pamphlet and disclose known lead-based paint.
                </p>
                <div className="pt-1">
                  <a
                    href="https://www.epa.gov/lead/real-estate-disclosures-about-potential-lead-hazards"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    <span>Official EPA Lead Disclosure Guide & Pamphlet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{leadPaintDoc?.status === 'Uploaded' ? 'Replace PDF' : 'Upload PDF'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => handleUploadDocument('lead-paint-disclosure', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Federal Lead-Based Paint Disclosure: <strong>Exempt</strong> (Home built in {property.yearBuilt || 'post-1978'}, lead disclosure only required for pre-1978 construction).
              </span>
            </div>
          )}

          {/* 2. State-Specific Seller Disclosure */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              stateSellerDoc?.completed || stateSellerDoc?.status === 'Uploaded'
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : stateInfo.ruleType === 'mandatory'
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
            }`}
          >
            <div className="space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(stateSellerDoc?.completed || stateSellerDoc?.status === 'Uploaded')}
                    onChange={() => handleToggleDocCompleted(stateSellerDoc?.id || 'state-seller-disclosure')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="font-bold text-xs text-[#0F2A44] dark:text-white">
                    {stateInfo.formName}
                  </span>
                </label>

                {stateInfo.ruleType === 'mandatory' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    Required by State Law
                  </span>
                )}
                {stateInfo.ruleType === 'caveat_emptor' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    Buyer Beware State (Caveat Emptor)
                  </span>
                )}
                {stateInfo.ruleType === 'conditional' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Conditional State Requirement
                  </span>
                )}
                {(stateSellerDoc?.completed || stateSellerDoc?.status === 'Uploaded') && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    ✓ Completed {stateSellerDoc.fileName ? `(${stateSellerDoc.fileName})` : ''}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {stateInfo.summary}
              </p>

              {/* Official Source Link or Review Flag */}
              <div className="pt-1">
                {stateInfo.needsReview ? (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Note: Check with a local real estate attorney or title company for {stateInfo.stateName}'s disclosure form.
                  </div>
                ) : stateInfo.officialSourceUrl ? (
                  <a
                    href={stateInfo.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    <span>Official {stateInfo.officialAgencyName} Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A] cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>{stateSellerDoc?.status === 'Uploaded' ? 'Replace PDF' : 'Upload PDF'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => handleUploadDocument(stateSellerDoc?.id || 'state-seller-disclosure', e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Supporting Records (Survey, Tax Bills, Utilities, Warranties) */}
          {supportingDocs.map((doc) => (
            <div
              key={doc.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                doc.completed || doc.status === 'Uploaded'
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(doc.completed || doc.status === 'Uploaded')}
                      onChange={() => handleToggleDocCompleted(doc.id)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-[#0F2A44] dark:text-white">
                      {doc.name}
                    </span>
                  </label>
                  {(doc.completed || doc.status === 'Uploaded') && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Completed {doc.fileName ? `(${doc.fileName})` : ''}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{doc.note}</p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{doc.status === 'Uploaded' ? 'Replace' : 'Upload'}</span>
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
              Compare purchase price minus buyer concessions, title fees, and state transfer taxes to evaluate take-home proceeds.
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

        {/* Transfer Tax Rate Configuration Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-[#0F2A44] dark:text-white flex items-center gap-1.5">
              <span>Transfer Tax Rate:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                ${effectiveTaxRate.toFixed(2)} per $1,000
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({((effectiveTaxRate / 1000) * 100).toFixed(3)}%)
              </span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Transfer taxes vary by county and state. Default for {stateInfo.stateName}: {stateInfo.transferTaxNote}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isEditingTaxRate ? (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={customTaxRate}
                  onChange={(e) => setCustomTaxRate(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none"
                />
                <span className="text-slate-400 text-[10px]">/ $1k</span>
                <button
                  type="button"
                  onClick={() => setIsEditingTaxRate(false)}
                  className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  title="Save Rate"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTaxRate(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                <Edit2 className="w-3 h-3 text-slate-400" />
                <span>Adjust Tax Rate</span>
              </button>
            )}
          </div>
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
              A {stateInfo.stateName} real estate attorney or title company prepares the standard purchase agreement, coordinates escrow, runs title work, and oversees closing.
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
              placeholder={`e.g. First American Title or ${stateInfo.stateName} Attorney`}
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
              placeholder="(555) 555-0199 • title@escrow.com"
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

              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
                Estimated Closing Costs: Transfer Tax ({stateInfo.stateName}: ${effectiveTaxRate.toFixed(2)}/k) + Title/Escrow = ~${(Math.round(((parseInt(offerPrice) || property.price) / 1000) * effectiveTaxRate) + (closingTeam.flatFeeQuoted || Math.round((parseInt(offerPrice) || property.price) * 0.005))).toLocaleString()}
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
