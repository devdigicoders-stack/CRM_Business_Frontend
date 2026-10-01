import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, CheckCircle2, Clock, XCircle, Printer, Download, 
  Phone, Mail, MapPin, Globe, Sparkles, Check, User, 
  ExternalLink, MessageCircle, AlertCircle, Loader2, ArrowLeft,
  Building2, ShieldCheck
} from 'lucide-react';

// Helper to convert number to Indian Rupees in words
const convertNumberToWords = (amount) => {
  const num = Math.floor(amount || 0);
  if (num === 0) return "Rupees Zero Only";

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'Amount too large';
    const nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArray) return '';
    let str = '';
    str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
    str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lakh ' : '';
    str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
    str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
    str += (nArray[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
    return str.trim();
  };

  const words = inWords(num);
  return `Rupees ${words} Only`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    case 'Pending Approval':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" /> Pending Approval
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-semibold">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-xs font-semibold">
          {status}
        </span>
      );
  }
};

const PublicQuotationView = () => {
  const { quotationNumber } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${baseUrl}/sales/quotations/public/${encodeURIComponent(quotationNumber)}`);
        setQuotation(res.data.quotation);
        setSettings(res.data.settings || {});
      } catch (err) {
        console.error('Error fetching public quotation:', err);
        setError(err.response?.data?.message || 'Quotation not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (quotationNumber) {
      fetchPublicQuote();
    }
  }, [quotationNumber]);

  // Direct print trigger (works on desktop and mobile browsers)
  const handleDownloadPDF = () => {
    window.print();
  };

  // WhatsApp Support Link
  const companyPhone = settings?.companyPhone || '+919876543210';
  const cleanPhone = companyPhone.replace(/[^0-9]/g, '');
  const supportPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappSupportUrl = `https://wa.me/${supportPhone}?text=Hi%2C%20I%20have%20a%20question%20regarding%20Quotation%20${quotation?.quotationNumber || quotationNumber}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Loading Official Quotation...</h2>
        <p className="text-sm text-slate-400">Fetching verified document details</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Document Unavailable</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {error || "The requested quotation could not be found or the link may have been updated."}
          </p>
          <div className="flex flex-col gap-3">
            <a 
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/40"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Us on WhatsApp
            </a>
            <Link 
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      
      {/* STICKY TOP FLOATING ACTION BAR (PRINT HIDDEN) */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden">
        
        {/* Left: Brand & Document Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3A2C] border border-emerald-500/40 flex items-center justify-center shadow-md shrink-0">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-7 h-7 object-contain rounded-md" />
            ) : (
              <FileText className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                {settings?.companyName || 'DigiCoders Technologies'}
              </span>
              <span className="hidden sm:inline-block">
                {getStatusBadge(quotation.status)}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Quotation: <strong className="text-slate-200 font-mono">{quotation.quotationNumber}</strong></span>
              <span className="text-slate-600">•</span>
              <span className="hidden md:inline">For: {quotation.lead?.customerName || 'Client'}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions (Download/Print PDF & WhatsApp Support) */}
        <div className="flex items-center gap-2.5 sm:gap-3 ml-auto">
          {/* WhatsApp Support Button */}
          <a
            href={whatsappSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition-all shadow-sm"
            title="Chat with DigiCoders Team"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp Help</span>
          </a>

          {/* Primary Download / Print PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-emerald-900/50 hover:shadow-emerald-900/80 active:scale-95"
            title="Download or Print Official PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>
        </div>
      </header>

      {/* DOCUMENT PREVIEW CONTAINER */}
      <main className="flex-1 p-3 sm:p-8 flex justify-center items-start print:p-0 print:m-0 print:block">
        
        {/* Real A4 Paper Sheet (Zero Border Radius - Pure Sharp Official Format) */}
        <div 
          className="bg-white w-full max-w-[850px] shadow-[0_12px_45px_rgba(0,0,0,0.6)] rounded-none h-fit border border-gray-300 relative print:shadow-none print:border-none print:max-w-full print:m-0 print:p-0 print:static"
          id="official-quotation-doc"
          style={{ borderRadius: 0 }}
        >
          {/* PRINTABLE DOCUMENT BODY */}
          <div className="p-6 sm:p-10 space-y-6 text-gray-900 bg-white print:p-3 print:space-y-4">
            
            {/* HEADER WITH LOGO & GEOMETRIC GREEN BANNER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative print-avoid-break">
              
              {/* Left Brand Logo & Monogram */}
              <div className="flex items-center gap-3.5">
                {settings?.companyLogo ? (
                  <div className="flex flex-col">
                    <img 
                      src={settings.companyLogo} 
                      alt={settings?.companyName || "Logo"} 
                      className="h-16 w-auto max-w-[220px] object-contain"
                    />
                    <p className="text-[9px] font-black text-gray-400 tracking-[0.25em] uppercase mt-1">
                      {settings?.companySlogan || 'BUILD | INNOVATE | GROW'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-[#0B3A2C] to-[#041a13] p-0.5 shadow-md flex items-center justify-center shrink-0">
                      <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-10 h-10">
                          <path d="M 25 20 L 55 20 C 75 20 85 32 85 50 C 85 68 75 80 55 80 L 25 80 Z" fill="#0B3A2C" />
                          <path d="M 40 35 L 52 35 C 64 35 70 42 70 50 C 70 58 64 65 52 65 L 40 65 Z" fill="#ffffff" />
                          <circle cx="30" cy="50" r="7" fill="#10b981" />
                          <rect x="25" y="47" width="10" height="6" fill="#10b981" />
                        </svg>
                      </div>
                    </div>

                    <div>
                      <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none font-sans">
                        {settings?.companyName?.split(' ')[0] || 'DigiCoders'}
                      </h1>
                      <span className="text-xl font-bold text-emerald-600 block tracking-tight leading-tight">
                        {settings?.companyName?.split(' ').slice(1).join(' ') || 'Technologies'}
                      </span>
                      <p className="text-[9px] font-black text-gray-400 tracking-[0.25em] uppercase mt-0.5">
                        {settings?.companySlogan || 'BUILD | INNOVATE | GROW'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Right Geometric Green Header Banner */}
              <div className="bg-[#0B3A2C] text-white pl-8 pr-8 py-3.5 rounded-l-3xl rounded-r-xl sm:rounded-r-2xl shadow-lg relative self-stretch sm:self-auto text-right border-l-[6px] border-emerald-400">
                <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase font-sans">
                  QUOTATION
                </h2>
                <p className="text-[11px] text-emerald-200/90 font-medium tracking-wide">
                  {settings?.quotationSubtitle || 'Software Solutions for a Better Tomorrow'}
                </p>
              </div>
            </div>

            {/* Sub-header Contact Strip */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-gray-600 font-medium border-b border-gray-100 pb-3">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {settings?.companyAddress || 'Lucknow, Uttar Pradesh, India'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {settings?.companyEmail || 'info@digicoders.com'}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {settings?.companyPhone || '+91 98765 43210'}
              </span>
              <a 
                href={settings?.websiteUrl || 'https://www.digicoders.com'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                {settings?.websiteUrl?.replace(/^https?:\/\//, '') || 'www.digicoders.com'}
              </a>
            </div>

            {/* TWO CARDS: QUOTATION FOR & QUOTATION DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">
              
              {/* Quotation For (Real Client Info) */}
              <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  Quotation For
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                    {quotation.lead?.customerName || 'Valued Client'}
                  </h3>
                  {quotation.lead?.companyName && (
                    <p className="text-xs font-semibold text-emerald-700">
                      {quotation.lead.companyName}
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{quotation.lead?.contactNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{quotation.lead?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{quotation.lead?.location || quotation.lead?.address || 'Lucknow, Uttar Pradesh, India'}</span>
                  </div>
                </div>
              </div>

              {/* Quotation Details (System Metadata) */}
              <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  Quotation Details
                </div>

                <div className="grid grid-cols-12 gap-y-1.5 text-xs text-gray-600 font-medium">
                  <span className="col-span-5 text-gray-500">Quotation No</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-mono font-bold text-gray-900">{quotation.quotationNumber}</span>

                  <span className="col-span-5 text-gray-500">Issue Date</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-semibold text-gray-800">
                    {new Date(quotation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>

                  <span className="col-span-5 text-gray-500">Valid Till</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-semibold text-gray-800">
                    {new Date(new Date(quotation.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (30 Days)
                  </span>

                  <span className="col-span-5 text-gray-500">Prepared By</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 font-bold text-gray-900">
                    {quotation.createdBy?.name || 'Super Admin'}
                  </span>

                  <span className="col-span-5 text-gray-500">Designation</span>
                  <span className="col-span-1">:</span>
                  <span className="col-span-6 text-gray-600">
                    {quotation.createdBy?.role?.name || settings?.defaultDesignation || 'Sales Executive'}
                  </span>
                </div>
              </div>

            </div>

            {/* ITEM TABLE (DARK GREEN HEADER AS IN TEMPLATE) */}
            <div className="rounded-xl overflow-hidden border border-gray-200 print:overflow-visible print:border print:rounded-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B3A2C] text-white uppercase font-bold tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12">#</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(quotation.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 print-avoid-break">
                      <td className="py-3.5 px-3.5 text-center text-gray-400 font-bold font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900 text-[13px]">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.itemType === 'Service' ? (
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                            Service
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                            Product
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                        {Number(item.price).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-gray-900 text-sm">
                        {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AMOUNT IN WORDS & GRAND TOTAL SUMMARY (TWO COLUMNS) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch print-avoid-break">
              
              {/* Left: Amount in Words */}
              <div className="md:col-span-7 bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                    <FileText className="w-3 h-3" />
                  </div>
                  Amount in Words
                </div>
                <p className="text-xs font-bold text-gray-800 italic mt-1">
                  {convertNumberToWords(quotation.totalAmount)}
                </p>
              </div>

              {/* Right: Subtotal, GST & Grand Total Banner */}
              <div className="md:col-span-5 bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between space-y-2">
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{Number(quotation.subTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Total GST</span>
                  <span className="font-bold text-gray-900">₹{Number(quotation.taxAmount).toLocaleString()}</span>
                </div>
                
                {/* Grand Total Green Banner */}
                <div className="bg-[#0B3A2C] text-white p-3 rounded-xl flex justify-between items-center shadow-md">
                  <span className="text-xs font-black uppercase tracking-wider">Grand Total</span>
                  <span className="text-lg font-black tracking-tight">
                    ₹{Number(quotation.totalAmount).toLocaleString()}
                  </span>
                </div>
              </div>

            </div>

            {/* TERMS & CONDITIONS & WHY CHOOSE US (TWO CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">
              
              {/* Terms & Conditions */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 text-xs">
                <div className="flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Terms & Conditions
                </div>
                <ol className="space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
                  {(settings?.termsAndConditions && settings.termsAndConditions.length > 0 ? settings.termsAndConditions : [
                    "This quotation is valid for 30 days from the date of issue.",
                    "50% advance payment required to initiate the work.",
                    "Balance payment after project completion.",
                    "Any additional features will be charged separately.",
                    "Project timeline: 2 – 4 weeks (depending on requirements).",
                    "Includes 3 months free support after delivery.",
                    "GST is applicable on items as per government rules."
                  ]).map((term, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{term}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Why Choose Company */}
              <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 text-xs">
                <div className="flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Why Choose {settings?.companyName?.split(' ')[0] || 'DigiCoders'}?
                </div>
                <div className="space-y-2 text-gray-700 text-[11px] font-medium pt-1">
                  {(settings?.whyChooseUs && settings.whyChooseUs.length > 0 ? settings.whyChooseUs : [
                    "Experienced Development Team",
                    "Modern & Secure Technology Stack",
                    "On-Time Delivery",
                    "Dedicated Support & Maintenance"
                  ]).map((point, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* SIGNATURES, OFFICIAL STAMP & THANK YOU NOTE */}
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 pt-2 print-avoid-break">
              
              {/* Official Stamp & Sign */}
              <div className="flex items-center gap-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    For {settings?.signatoryCompany || settings?.companyName || 'DigiCoders Technologies'}
                  </div>
                  
                  {/* Official Digital Signature Image or Handwritten Signature */}
                  <div className="h-12 flex items-center">
                    {settings?.digitalSignature ? (
                      <img 
                        src={settings.digitalSignature} 
                        alt="Digital Signature" 
                        className="h-12 max-w-[170px] object-contain transform -rotate-1 select-none filter contrast-125" 
                      />
                    ) : (
                      <div className="font-serif text-2xl italic font-bold text-gray-800 tracking-wider">
                        {settings?.signatoryName || 'Amit Kumar'}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-1 text-xs">
                    <div className="font-extrabold text-gray-900">
                      {settings?.signatoryName || 'Amit Kumar'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {settings?.signatoryDesignation || 'Director'}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {settings?.signatoryCompany || settings?.companyName || 'DigiCoders Technologies'}
                    </div>
                  </div>
                </div>

                {/* Circular Official Company Stamp Seal */}
                {settings?.companyStamp ? (
                  <div className="w-20 h-20 flex items-center justify-center rotate-[-5deg] opacity-90 select-none shrink-0">
                    <img 
                      src={settings.companyStamp} 
                      alt="Official Stamp Seal" 
                      className="w-20 h-20 object-contain drop-shadow-sm" 
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-900/60 p-1 flex items-center justify-center rotate-[-6deg] opacity-90 select-none shrink-0">
                    <div className="w-full h-full rounded-full border border-blue-900/80 flex flex-col items-center justify-center text-blue-900 text-[7px] font-black uppercase text-center leading-none p-1">
                      <span>★ {settings?.companyName?.toUpperCase() || 'DIGICODERS'} ★</span>
                      <div className="my-0.5">
                        <span className="text-xs font-extrabold">
                          {settings?.companyName ? settings.companyName.charAt(0).toUpperCase() : 'D'}
                        </span>
                      </div>
                      <span className="tracking-tighter">
                        {settings?.companyName?.split(' ').slice(1).join(' ')?.toUpperCase() || 'TECHNOLOGIES'}
                      </span>
                      <span className="text-[6px] tracking-widest mt-0.5">
                        {settings?.stampCity?.toUpperCase() || 'LUCKNOW'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Thank You Note */}
              <div className="text-center sm:text-right max-w-xs">
                <div className="font-serif italic text-3xl font-extrabold text-emerald-600 tracking-wide">
                  Thank you!
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  {settings?.thankYouNote || 'We appreciate the opportunity to work with you. Looking forward to a long-term business relationship.'}
                </p>
              </div>

            </div>

            {/* BOTTOM FOOTER RIBBON (FULL-BLEED WITH NOTCH & SOCIAL LINKS) */}
            <div className="-mx-6 -mb-6 sm:-mx-10 sm:-mb-10 mt-6 bg-[#0B3A2C] text-white px-6 sm:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-medium shadow-lg rounded-none relative print-avoid-break">
              
              {/* Contact Items */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
                <span className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {settings?.companyPhone || '+91 98765 43210'}
                </span>
                <span className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {settings?.companyEmail || 'info@digicoders.com'}
                </span>
                <a 
                  href={settings?.websiteUrl || 'https://www.digicoders.com'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors underline"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {settings?.websiteUrl?.replace(/^https?:\/\//, '') || 'www.digicoders.com'}
                </a>
              </div>

              {/* Right: Downward Triangle Notch & Social Icons */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block absolute -top-0 right-36 z-10">
                  <svg className="w-5 h-3 text-white fill-current block" viewBox="0 0 20 12">
                    <polygon points="0,0 20,0 10,12" />
                  </svg>
                </div>

                <span className="text-emerald-500/60 font-light text-sm select-none pr-1">|</span>

                <div className="flex items-center gap-3 text-emerald-300">
                  {/* LinkedIn */}
                  <a 
                    href={settings?.linkedinUrl || 'https://www.linkedin.com/company/digicoders-technologies'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="LinkedIn"
                    className="hover:text-white hover:scale-110 transition-all p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74V9.93H5.06v8.57z"/>
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a 
                    href={settings?.instagramUrl || 'https://www.instagram.com/digicoders'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="Instagram"
                    className="hover:text-white hover:scale-110 transition-all p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>

                  {/* Facebook */}
                  <a 
                    href={settings?.facebookUrl || 'https://www.facebook.com/digicoders'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="Facebook"
                    className="hover:text-white hover:scale-110 transition-all p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* YouTube */}
                  <a 
                    href={settings?.youtubeUrl || 'https://www.youtube.com/@digicoders'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="YouTube"
                    className="hover:text-white hover:scale-110 transition-all p-0.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* FOOTER NOTICE FOR CLIENT (PRINT HIDDEN) */}
      <footer className="bg-slate-950 border-t border-slate-800 text-center py-4 text-xs text-slate-400 print:hidden">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Officially Generated & Digitally Authenticated Quotation Document
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          © {new Date().getFullYear()} {settings?.companyName || 'DigiCoders Technologies'}. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default PublicQuotationView;
