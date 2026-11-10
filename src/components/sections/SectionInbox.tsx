import React, { useState } from 'react';
import { InquiryItem, PropertyProfile, Settings, ActiveTab } from '../../types';
import { WhyThisMatters } from '../common/WhyThisMatters';
import {
  Inbox,
  Clock,
  Sparkles,
  Copy,
  Check,
  Plus,
  Trash2,
  Send,
  MessageSquare,
  Mail,
  AlertCircle,
  FileCode,
  Loader2,
  Calendar,
  RefreshCw,
} from 'lucide-react';

interface SectionInboxProps {
  inquiries: InquiryItem[];
  property: PropertyProfile;
  settings: Settings;
  onUpdateInquiries: (inquiries: InquiryItem[]) => void;
  onNavigate: (tab: ActiveTab) => void;
}

type TemplateType =
  | 'first_reply'
  | 'showing_confirmation'
  | 'open_house_invite'
  | 'preapproval_request'
  | 'price_change_notice'
  | 'offer_received';

export const SectionInbox: React.FC<SectionInboxProps> = ({
  inquiries,
  property,
  settings,
  onUpdateInquiries,
  onNavigate,
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(
    inquiries[0] || null
  );

  // Manual Add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqSource, setInqSource] = useState('Zillow');
  const [inqMessage, setInqMessage] = useState('');

  // Webhook JSON paste modal
  const [showWebhookPasteModal, setShowWebhookPasteModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // AI Personalized Reply state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('first_reply');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [generatedSms, setGeneratedSms] = useState('');
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState('');
  const [generatedEmailBody, setGeneratedEmailBody] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'sms' | 'email' | null>(null);

  // Helper for 24h overdue check
  const isOverdue = (dateStr: string) => {
    return Date.now() - new Date(dateStr).getTime() > 24 * 3600 * 1000;
  };

  const handleAddInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inqName.trim()) return;

    const newInq: InquiryItem = {
      id: 'inq-' + Date.now(),
      name: inqName.trim(),
      phone: inqPhone.trim(),
      email: inqEmail.trim(),
      source: inqSource,
      dateReceived: new Date().toISOString(),
      message: inqMessage.trim() || 'Interested in viewing this property.',
      replied: false,
      notes: '',
    };

    onUpdateInquiries([newInq, ...inquiries]);
    setSelectedInquiry(newInq);
    setInqName('');
    setInqPhone('');
    setInqEmail('');
    setInqMessage('');
    setShowAddModal(false);
  };

  const handleImportJson = (e: React.FormEvent) => {
    e.preventDefault();
    setPasteError(null);
    try {
      const parsed = JSON.parse(pastedJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const importedItems: InquiryItem[] = items.map((item: any, idx: number) => ({
        id: 'inq-imported-' + Date.now() + '-' + idx,
        name: item.name || item.buyerName || 'Prospective Buyer',
        phone: item.phone || item.buyerPhone || '',
        email: item.email || item.buyerEmail || '',
        source: item.source || 'Website Webhook',
        dateReceived: item.date || item.submittedAt || new Date().toISOString(),
        message: item.message || item.preferredDate || 'Showing tour requested via website.',
        replied: false,
        notes: item.hasPreApproval ? 'Pre-approval stated: YES' : '',
      }));

      onUpdateInquiries([...importedItems, ...inquiries]);
      if (importedItems.length > 0) setSelectedInquiry(importedItems[0]);
      setPastedJson('');
      setShowWebhookPasteModal(false);
    } catch (err: any) {
      setPasteError('Invalid JSON format. Please verify and paste again.');
    }
  };

  const handleDeleteInquiry = (id: string) => {
    const updated = inquiries.filter((i) => i.id !== id);
    onUpdateInquiries(updated);
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(updated[0] || null);
    }
  };

  const handleToggleReplied = (id: string) => {
    onUpdateInquiries(
      inquiries.map((i) =>
        i.id === id
          ? {
              ...i,
              replied: !i.replied,
              replyDate: !i.replied ? new Date().toISOString() : undefined,
            }
          : i
      )
    );
  };

  // Generate AI Personalized Reply
  const handleGenerateReply = async (template: TemplateType) => {
    if (!selectedInquiry) return;
    setSelectedTemplate(template);
    setIsGeneratingReply(true);
    setReplyError(null);

    try {
      const res = await fetch('/api/gemini/inquiry-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: template,
          buyerName: selectedInquiry.name,
          buyerMessage: selectedInquiry.message,
          property,
          sellerName: settings.sellerName,
          sellerPhone: settings.sellerPhone,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error('[Gemini Server Diagnostic for Inquiry Reply]:', {
          status: res.status,
          rawGeminiError: errJson.rawGeminiError || errJson.message,
          geminiStatus: errJson.geminiStatus,
          modelTried: errJson.modelTried,
          isAiBusy: errJson.isAiBusy,
        });
        const isBusy = errJson.isAiBusy || res.status === 503;
        throw new Error(isBusy ? 'AI is busy, please try again in a few minutes' : (errJson.error || errJson.message || `AI reply unavailable (${res.status})`));
      }
      const data = await res.json();
      console.log(`[Gemini Server Diagnostic] Inquiry Reply answered by model: ${data.modelUsed || 'gemini-3.8-flash'}`);
      setGeneratedSms(data.sms || '');
      setGeneratedEmailSubject(data.emailSubject || '');
      setGeneratedEmailBody(data.emailBody || '');
    } catch (err: any) {
      console.error(err);
      setReplyError(err.message || 'AI is busy, please try again in a few minutes');
      // Fallback
      setGeneratedSms(
        `Hi ${selectedInquiry.name}, thank you for your interest in ${property.address}! When is a good time for a quick 10-minute tour? - ${settings.sellerName}`
      );
    } finally {
      setIsGeneratingReply(false);
    }
  };

  const handleCopyText = (type: 'sms' | 'email') => {
    const text =
      type === 'sms'
        ? generatedSms
        : `Subject: ${generatedEmailSubject}\n\n${generatedEmailBody}`;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      <WhyThisMatters
        tip="Responding to buyer inquiries within 2 hours increases tour booking rates by over 300%. A 'Reply By' clock turns red if unanswered past 24 hours."
        nextLabel="Promote & Social"
        onNext={() => onNavigate('promote')}
      />

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-[#FF6B5A]" />
              Buyer Inquiries Inbox
            </h3>
            <p className="text-xs text-slate-500">
              Manage messages from Zillow, Facebook Marketplace, signs, and your property website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWebhookPasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
            >
              <FileCode className="w-3.5 h-3.5" />
              Import Webhook JSON
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FF6B5A] hover:bg-[#fa5644] shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              + Add Inquiry
            </button>
          </div>
        </div>

        {/* Master Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Inquiry List (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {inquiries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No buyer inquiries yet.
              </div>
            ) : (
              inquiries.map((inq) => {
                const overdue = !inq.replied && isOverdue(inq.dateReceived);
                const isSelected = selectedInquiry?.id === inq.id;

                return (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#FF6B5A] bg-orange-50/40 dark:bg-slate-800 ring-2 ring-[#FF6B5A]/20'
                        : overdue
                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#0F2A44] dark:text-white">
                        {inq.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {inq.source}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 my-1">
                      "{inq.message}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          overdue ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {overdue ? 'Overdue (>24h)' : new Date(inq.dateReceived).toLocaleDateString()}
                      </span>

                      {inq.replied ? (
                        <span className="text-emerald-600 font-bold text-[10px]">✓ Replied</span>
                      ) : (
                        <span className="text-[#FF6B5A] font-bold text-[10px]">Awaiting Reply</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inquiry Detail & AI Reply Studio (Right 7 Cols) */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/60 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-4">
            {selectedInquiry ? (
              <div className="space-y-4">
                {/* Inquiry Profile */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h4 className="text-base font-bold text-[#0F2A44] dark:text-white">
                      {selectedInquiry.name}
                    </h4>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Phone: <a href={`tel:${selectedInquiry.phone}`} className="text-blue-600 hover:underline">{selectedInquiry.phone || 'None'}</a> • Email: <a href={`mailto:${selectedInquiry.email}`} className="text-blue-600 hover:underline">{selectedInquiry.email || 'None'}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleReplied(selectedInquiry.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedInquiry.replied
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                      }`}
                    >
                      {selectedInquiry.replied ? '✓ Marked Replied' : 'Mark as Replied'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message text */}
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  <strong className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Buyer's Inquiry:
                  </strong>
                  "{selectedInquiry.message}"
                </div>

                {/* AI Reply Generator */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F2A44] dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#F2B544]" />
                      Personalized AI Reply Generator:
                    </span>
                    {isGeneratingReply && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Drafting...
                      </span>
                    )}
                  </div>

                  {/* Template quick buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'first_reply', label: '👋 First Reply' },
                      { key: 'showing_confirmation', label: '📅 Tour Confirmation' },
                      { key: 'open_house_invite', label: '🏡 Open House Invite' },
                      { key: 'preapproval_request', label: '📑 Request Pre-Approval' },
                      { key: 'price_change_notice', label: '🏷️ Price Update' },
                      { key: 'offer_received', label: '🤝 Offer Status' },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        disabled={isGeneratingReply}
                        onClick={() => handleGenerateReply(t.key as TemplateType)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          selectedTemplate === t.key
                            ? 'bg-[#0F2A44] text-white dark:bg-[#FF6B5A]'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {replyError && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-2">
                      <span>{replyError}</span>
                      <button
                        type="button"
                        onClick={() => handleGenerateReply(selectedTemplate)}
                        className="inline-flex items-center gap-1 font-bold text-xs text-[#FF6B5A] hover:underline shrink-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Generated SMS & Email Outputs */}
                  {generatedSms ? (
                    <div className="space-y-3 pt-1">
                      {/* SMS Box */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                            Text Message (SMS) Version
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText('sms')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
                          >
                            {copiedType === 'sms' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedType === 'sms' ? 'Copied' : 'Copy Text'}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl font-mono text-[11px]">
                          {generatedSms}
                        </p>
                      </div>

                      {/* Email Box */}
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-emerald-500" />
                            Email Version
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText('email')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-[#0F2A44] hover:bg-[#1A3D60] dark:bg-[#FF6B5A]"
                          >
                            {copiedType === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedType === 'email' ? 'Copied' : 'Copy Email'}</span>
                          </button>
                        </div>
                        <div className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl space-y-1">
                          <div className="font-bold text-[11px] text-[#0F2A44] dark:text-white">
                            Subj: {generatedEmailSubject}
                          </div>
                          <div className="whitespace-pre-line text-[11px] leading-relaxed">
                            {generatedEmailBody}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 text-xs text-slate-400">
                      Click any scenario above (e.g. "👋 First Reply") to generate tailored SMS and email responses.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                Select an inquiry from the list on the left to review details and draft a response.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Manual Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Log Buyer Inquiry
            </h4>
            <form onSubmit={handleAddInquiry} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Buyer Name</label>
                <input
                  type="text"
                  required
                  value={inqName}
                  onChange={(e) => setInqName(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={inqPhone}
                    onChange={(e) => setInqPhone(e.target.value)}
                    placeholder="(248) 555-0182"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Source</label>
                  <select
                    value={inqSource}
                    onChange={(e) => setInqSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                  >
                    <option value="Zillow">Zillow</option>
                    <option value="Facebook Marketplace">Facebook Marketplace</option>
                    <option value="Yard Sign QR">Yard Sign QR</option>
                    <option value="Website Webhook">Website Form</option>
                    <option value="Craigslist">Craigslist</option>
                    <option value="Other">Other Referral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={inqEmail}
                  onChange={(e) => setInqEmail(e.target.value)}
                  placeholder="david@email.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Message / Question</label>
                <textarea
                  rows={2}
                  value={inqMessage}
                  onChange={(e) => setInqMessage(e.target.value)}
                  placeholder="What is the buyer asking about?"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#FF6B5A]"
                >
                  Save Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paste Webhook JSON Modal */}
      {showWebhookPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="font-heading font-bold text-base text-[#0F2A44] dark:text-white">
              Import Webhook Inquiries (Paste JSON)
            </h4>
            <p className="text-xs text-slate-500">
              Paste JSON payload received from Zapier, Make, Formspree, or your website showing request form:
            </p>
            <form onSubmit={handleImportJson} className="space-y-3">
              <textarea
                rows={6}
                required
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                placeholder='[{"buyerName": "Sarah Jenkins", "buyerPhone": "248-555-0122", "buyerEmail": "sarah@email.com", "preferredDate": "Saturday 2pm"}]'
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
              />
              {pasteError && (
                <div className="text-xs text-red-500 font-semibold">{pasteError}</div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookPasteModal(false)}
                  className="px-4 py-2 text-xs text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-[#0F2A44] dark:bg-[#FF6B5A]"
                >
                  Parse & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
