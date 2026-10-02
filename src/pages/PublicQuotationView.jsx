import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer, Loader2, AlertCircle } from 'lucide-react';

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

const PublicQuotationView = () => {
  const { quotationNumber } = useParams();
  const [quotation, setQuotation] = useState(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Loading Quotation...</h2>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
        <p className="text-gray-600 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-10 flex flex-col items-center">
      
      {/* Top Action Bar (Hidden during Print) */}
      <div className="w-full max-w-[794px] mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-lg print:hidden px-6">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Quotation: {quotation.quotationNumber}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Click Print to save as PDF. Background graphics must be enabled in print settings.</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="px-5 py-2.5 bg-[#0B3A2C] text-white rounded-lg flex items-center gap-2 font-bold text-sm hover:bg-emerald-800 transition-colors shadow-md"
        >
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      {/* A4 Template Container */}
      <div 
        id="quotation-print-area"
        className="w-[794px] h-[1123px] relative bg-white shadow-2xl overflow-hidden print:shadow-none mx-auto"
        style={{
          backgroundImage: 'url(/Qutotion.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact'
        }}
      >
        {/* =========================================
            DATA OVERLAYS (Absolute Positioning)
            Adjust top/left/width/fontSize as needed 
            to perfectly align with your Canva image
        =========================================== */}

        {/* CUSTOMER DETAILS (Top Left Box) */}
        <div 
          className="absolute top-[231px] left-[110px] w-[300px] text-[18px] text-gray-900 font-bold text-left uppercase"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
           {quotation.leadId?.name || 'Client Name'}
        </div>

        {/* QUOTATION DETAILS (Top Right Box) */}
        {/* Estimate No */}
        <div 
          className="absolute top-[188px] left-[660px] text-[12px] text-gray-900 font-bold text-left tracking-wide"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
           {quotation.quotationNumber}
        </div>
        
        {/* Date */}
        <div 
          className="absolute top-[208px] left-[660px] text-[12px] text-gray-900 font-bold text-left tracking-wide"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
           {new Date(quotation.createdAt).toLocaleDateString('en-GB')}
        </div>

        {/* Custom Header for S. No. since it's missing in the Canva background */}
        <div 
          className="absolute top-[272px] left-[33px] w-[57px] text-center text-gray-900 font-bold text-[16px]"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          S. No.
        </div>

        {/* LINE ITEMS TABLE (Middle Section) */}
        <div className="absolute top-[310px] left-[33px] w-[741px] text-left">
           <table 
             className="w-[741px] text-[12px] border-collapse table-fixed"
             style={{ fontFamily: "'Roboto', sans-serif" }}
           >
             <colgroup>
               <col className="w-[57px]" />
               <col className="w-[364px]" />
               <col className="w-[100px]" />
               <col className="w-[80px]" />
               <col className="w-[140px]" />
             </colgroup>
             <tbody className="text-gray-900 font-medium align-top border-l-[1.5px] border-r-[1.5px] border-gray-400">
               {quotation.items.map((item, idx) => (
                 <tr key={idx} className="border-b-[1.5px] border-gray-400 last:border-b-0">
                   <td className="text-center text-gray-800 py-3">{idx + 1}</td>
                   <td className="pr-4 py-3">
                     <div className="font-extrabold text-[12px] text-gray-900">{item.name}</div>
                     {item.description && <div className="text-[10px] text-gray-600 leading-tight mt-1 whitespace-pre-wrap">{item.description}</div>}
                   </td>
                   <td className="text-center font-bold text-gray-800 py-3">{item.quantity}</td>
                   <td className="text-center text-gray-700 py-3">{item.gstPercentage || 18}%</td>
                   {idx === 0 && (
                     <td 
                       rowSpan={quotation.items.length} 
                       className="text-center align-middle font-black text-2xl text-gray-900 border-l-[1.5px] border-gray-400"
                       style={{ fontFamily: "'Roboto', sans-serif" }}
                     >
                       {Number(quotation.totalAmount).toLocaleString('en-IN')}
                     </td>
                   )}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>

        {/* AMOUNT IN WORDS (Bottom Left near terms) */}
        <div className="absolute top-[570px] left-[70px] w-[350px] text-left hidden">
           <p className="text-[10px] font-extrabold text-gray-800 italic capitalize">
             {convertNumberToWords(quotation.totalAmount)}
           </p>
        </div>

        {/* TOTAL CALCULATION (Bottom Right) */}
        <div className="absolute top-[520px] left-[450px] w-[270px] text-[10px] font-bold text-gray-900 text-left hidden">
           <div className="flex justify-between items-center py-1.5 px-4">
             <span className="text-gray-500">Subtotal</span> 
             <span>₹{Number(quotation.subTotal).toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between items-center py-1.5 px-4">
             <span className="text-gray-500">Total GST ({quotation.items[0]?.gstPercentage || 18}%)</span> 
             <span>₹{Number(quotation.taxAmount).toLocaleString('en-IN')}</span>
           </div>
           <div className="flex justify-between items-center py-2.5 px-4 mt-1">
             <span className="text-white text-xs uppercase tracking-wider pl-4 invisible">GRAND TOTAL</span> 
             <span className="text-white text-base text-right ml-auto mr-12 mt-1">₹{Number(quotation.totalAmount).toLocaleString('en-IN')}</span>
           </div>
        </div>

      </div>
      
      {/* Print CSS Rules */}
      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          #quotation-print-area {
            box-shadow: none !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          ::-webkit-scrollbar {
              display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicQuotationView;
