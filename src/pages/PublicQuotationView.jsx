import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '../utils/fileUrl';

const PublicQuotationView = () => {
  const { quotationNumber } = useParams();

  useEffect(() => {
    if (quotationNumber) {
      const backendUrl = `${getApiBaseUrl()}/sales/quotations/view-html/${encodeURIComponent(quotationNumber)}`;
      // Immediately redirect to pure Backend Dynamic HTML & CSS view
      window.location.replace(backendUrl);
    }
  }, [quotationNumber]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
      <h2 className="text-base font-bold text-gray-900">
        Opening Official Quotation from Backend...
      </h2>
      <p className="text-xs text-gray-500 mt-1 font-mono">
        {quotationNumber}
      </p>
      <div className="mt-4">
        <a 
          href={`${getApiBaseUrl()}/sales/quotations/view-html/${encodeURIComponent(quotationNumber || '')}`}
          className="text-xs text-emerald-600 hover:underline font-semibold"
        >
          Click here if not redirected automatically
        </a>
      </div>
    </div>
  );
};

export default PublicQuotationView;
