const fs = require('fs');

const salesPath = 'c:\\Users\\vivekvkraj\\OneDrive\\Desktop\\CRM_buussness\\admin_panel\\Admin\\src\\pages\\Sales.jsx';
let content = fs.readFileSync(salesPath, 'utf8');

const replacement = `            {/* Real A4 Paper Sheet (Zero Border Radius - Pure Sharp Rectangle) */}
            <div 
              className="w-[794px] h-[1123px] relative bg-white shadow-2xl overflow-hidden shrink-0 mx-auto transition-transform duration-150 origin-top print:shadow-none print:max-w-full print:m-0 print:p-0 print:static"
              style={{ 
                borderRadius: 0, 
                transform: \`scale(\${pdfZoom / 100})\`,
                backgroundImage: 'url(/Qutotion.png)',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
              id="official-quotation-doc"
            >
              {/* CUSTOMER DETAILS (Top Left Box) */}
              <div className="absolute top-[230px] left-[85px] w-[300px] text-left">
                <h3 className="font-extrabold text-[15px] text-gray-900 leading-tight uppercase">
                  {selectedQuotation.lead?.customerName || 'Client Name'}
                </h3>
                <p className="text-[11px] text-gray-700 font-medium mb-2 leading-tight">
                  {selectedQuotation.lead?.companyName || ''}
                </p>
                <div className="text-[10px] text-gray-600 space-y-1 font-medium">
                   <p className="flex items-center gap-2"><span className="w-3 text-center">📱</span> {selectedQuotation.lead?.contactNumber || 'N/A'}</p>
                   <p className="flex items-center gap-2"><span className="w-3 text-center">✉️</span> {selectedQuotation.lead?.email || 'N/A'}</p>
                   <p className="flex items-center gap-2"><span className="w-3 text-center">📍</span> {selectedQuotation.lead?.location || 'N/A'}</p>
                </div>
              </div>

              {/* QUOTATION DETAILS (Top Right Box) */}
              <div className="absolute top-[230px] left-[455px] w-[250px] text-[10px] text-gray-800 space-y-2 font-medium text-left">
                 <div className="grid grid-cols-3">
                   <span className="col-span-1 text-gray-500">Quotation No</span> 
                   <span className="col-span-2 text-gray-900 font-bold">: {selectedQuotation.quotationNumber}</span>
                 </div>
                 <div className="grid grid-cols-3">
                   <span className="col-span-1 text-gray-500">Issue Date</span> 
                   <span className="col-span-2 text-gray-900">: {new Date(selectedQuotation.createdAt).toLocaleDateString('en-GB')}</span>
                 </div>
                 <div className="grid grid-cols-3">
                   <span className="col-span-1 text-gray-500">Valid Till</span> 
                   <span className="col-span-2 text-gray-900">: {new Date(selectedQuotation.validUntil).toLocaleDateString('en-GB')}</span>
                 </div>
                 <div className="grid grid-cols-3">
                   <span className="col-span-1 text-gray-500">Prepared By</span> 
                   <span className="col-span-2 text-gray-900">: {selectedQuotation.preparedBy?.name || 'Admin'}</span>
                 </div>
              </div>

              {/* LINE ITEMS TABLE (Middle Section) */}
              <div className="absolute top-[395px] left-[65px] w-[665px] text-left">
                 <table className="w-full text-[10px]">
                   <thead className="invisible">
                     <tr>
                       <th className="w-[8%] pb-4">#</th>
                       <th className="w-[42%] pb-4">Description</th>
                       <th className="w-[12%] pb-4 text-center">Type</th>
                       <th className="w-[15%] pb-4 text-center">Unit Price</th>
                       <th className="w-[8%] pb-4 text-center">Qty</th>
                       <th className="w-[15%] pb-4 text-right">Total</th>
                     </tr>
                   </thead>
                   <tbody className="text-gray-900 font-medium">
                     {selectedQuotation.items.map((item, idx) => (
                       <tr key={idx} className="h-12 border-b border-gray-100/50">
                         <td className="text-center text-gray-500">{idx + 1}</td>
                         <td className="pr-4">
                           <div className="font-extrabold text-[11px] text-gray-900">{item.name}</div>
                           {item.description && <div className="text-[9px] text-gray-500 leading-tight mt-0.5">{item.description}</div>}
                         </td>
                         <td className="text-center">
                           <span className={\`px-2 py-0.5 rounded-full text-[8px] font-bold border \${item.itemType === 'Product' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-blue-200 text-blue-600 bg-blue-50'}\`}>
                             {item.itemType}
                           </span>
                         </td>
                         <td className="text-center font-bold text-gray-700">{Number(item.price).toLocaleString('en-IN')}</td>
                         <td className="text-center font-bold">{item.quantity}</td>
                         <td className="text-right font-extrabold text-gray-900">{Number(item.price * item.quantity).toLocaleString('en-IN')}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>

              {/* AMOUNT IN WORDS (Bottom Left near terms) */}
              <div className="absolute top-[570px] left-[70px] w-[350px] text-left">
                 <p className="text-[10px] font-extrabold text-gray-800 italic capitalize">
                   {/* We will add a small helper here if it's missing in Sales.jsx */}
                   Rupees {Math.floor(selectedQuotation.totalAmount)} Only
                 </p>
              </div>

              {/* TOTAL CALCULATION (Bottom Right) */}
              <div className="absolute top-[520px] left-[450px] w-[270px] text-[10px] font-bold text-gray-900 text-left">
                 <div className="flex justify-between items-center py-1.5 px-4">
                   <span className="text-gray-500">Subtotal</span> 
                   <span>₹{Number(selectedQuotation.subTotal).toLocaleString('en-IN')}</span>
                 </div>
                 <div className="flex justify-between items-center py-1.5 px-4">
                   <span className="text-gray-500">Total GST ({selectedQuotation.items[0]?.gstPercentage || 18}%)</span> 
                   <span>₹{Number(selectedQuotation.taxAmount).toLocaleString('en-IN')}</span>
                 </div>
                 <div className="flex justify-between items-center py-2.5 px-4 mt-1">
                   <span className="text-white text-xs uppercase tracking-wider pl-4 invisible">GRAND TOTAL</span> 
                   <span className="text-white text-base text-right ml-auto mr-12 mt-1">₹{Number(selectedQuotation.totalAmount).toLocaleString('en-IN')}</span>
                 </div>
              </div>
            </div>`;

const startIndex = content.indexOf('{/* Real A4 Paper Sheet (Zero Border Radius - Pure Sharp Rectangle) */}');
const endIndex = content.indexOf('</div>', content.indexOf('{/* Clickable Social Media Links */}')) + 20;

// Need a precise way to find the closing div of official-quotation-doc
// It is right before {/* Rejected / Failed Banner */} which is not there. Wait, it's inside MODAL 2.
// Let's use regex or just simple string matching to replace the whole block.
// The block ends right before `</div>\n          </div>\n        </div>\n      </div>\n      )}\n\n      {/* MODAL 3:`
const modal3Index = content.indexOf('{/* MODAL 3: MANAGER REVIEW (APPROVE / REJECT)                                */}');
const blockEndString = '</div>\n          </div>\n        </div>\n      </div>\n      )}';
const exactEndIndex = content.lastIndexOf(blockEndString, modal3Index);

const part1 = content.substring(0, startIndex);
// wait, the closing tags after `official-quotation-doc` are:
// </div> </div> </div> </div> )}
const closingTags = `
          </div>
        </div>
      </div>
      )}
`;

const part2 = content.substring(exactEndIndex);

fs.writeFileSync(salesPath, part1 + replacement + closingTags + part2.substring(blockEndString.length));
console.log('done');
