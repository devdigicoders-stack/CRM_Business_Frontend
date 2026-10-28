import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { Loader2, Printer, ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'react-toastify';

// Helper function to convert number to words (Indian Rupee System)
function numberToWords(num) {
    if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const intNum = Math.floor(Math.abs(num));
    if (intNum.toString().length > 9) return 'Amount Too Large';
    const n = ('000000000' + intNum).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees Only';
}

const ProjectReceipt = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReceiptData = async () => {
            try {
                // Try targeted receipt endpoint first
                try {
                    const res = await apiClient.get(`/operations/projects/${id}/receipt-data`);
                    if (res.data?.project) {
                        setProject(res.data.project);
                        setSettings(res.data.settings || null);
                        setIsLoading(false);
                        return;
                    }
                } catch (e) {
                    // Fallback to fetching projects list
                }

                const res = await apiClient.get('/operations/projects');
                const found = res.data.find(p => p._id === id);
                if (found) {
                    setProject(found);
                } else {
                    toast.error("Project not found");
                }
            } catch (error) {
                console.error("Error fetching project for receipt:", error);
                toast.error("Failed to load invoice/receipt details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchReceiptData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B3A2C]" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50 text-center p-6">
                <h2 className="text-xl font-bold mb-3 text-gray-900">Receipt / Invoice Not Found</h2>
                <button onClick={() => navigate(-1)} className="text-[#0B3A2C] underline font-semibold text-sm">
                    Go Back
                </button>
            </div>
        );
    }

    // Client & Project Information
    const lead = project.lead || {};
    const clientName = lead.customerName || project.customerName || 'Valued Customer';
    const clientCompany = lead.companyName || '';
    const clientPhone = lead.contactNumber || '';
    const clientEmail = lead.email || '';
    const clientAddress = lead.address || '';

    const invDate = new Date(project.endDate || project.updatedAt || Date.now()).toLocaleDateString('en-GB');
    const invNumber = project.quotationData?.quotationNumber 
        ? project.quotationData.quotationNumber.replace('QTN-', 'INV-')
        : `INV-${project._id.slice(-6).toUpperCase()}`;

    // Combine Quotation items with Installed Hardware Serial Numbers
    const quotationItems = project.quotationData?.items || [];
    const installedEquipments = project.installedEquipments || [];

    let combinedItems = [];

    if (quotationItems.length > 0) {
        combinedItems = quotationItems.map((item, idx) => {
            // Find matching hardware serial number by product name
            const match = installedEquipments.find(eq =>
                eq.itemName && item.name && (
                    eq.itemName.trim().toLowerCase() === item.name.trim().toLowerCase() ||
                    item.name.toLowerCase().includes(eq.itemName.toLowerCase()) ||
                    eq.itemName.toLowerCase().includes(item.name.toLowerCase())
                )
            ) || installedEquipments[idx];

            return {
                idx: idx + 1,
                name: item.name || 'Component / Service',
                description: item.description || '',
                serialNumber: match?.serialNumber || '',
                qty: Number(item.quantity || 1),
                rate: Number(item.price || 0),
                gstPerc: Number(item.gstPercentage !== undefined ? item.gstPercentage : 18),
                itemType: item.itemType || 'Product'
            };
        });
    } else if (installedEquipments.length > 0) {
        combinedItems = installedEquipments.map((eq, idx) => ({
            idx: idx + 1,
            name: eq.itemName,
            description: '',
            serialNumber: eq.serialNumber,
            qty: Number(eq.quantity || 1),
            rate: 0,
            gstPerc: 12,
            itemType: 'Product'
        }));
    } else {
        combinedItems = [{
            idx: 1,
            name: 'Complete Solar Installation Package',
            description: 'Supply, installation, testing and commissioning of solar rooftop system',
            serialNumber: '',
            qty: 1,
            rate: project.paymentData?.totalAmount || 0,
            gstPerc: 12,
            itemType: 'Product'
        }];
    }

    // Totals calculations matching exact Quotation logic
    const grandTotal = Number(project.paymentData?.totalAmount || project.quotationData?.totalAmount || 191300);
    const grandTotalWords = numberToWords(grandTotal);

    // Automatic 70% Product (Row A) & 30% Service (Row B) Split
    const displayProductTotal = Math.round(grandTotal * 0.70 * 100) / 100;
    const displayServiceTotal = Math.round((grandTotal - displayProductTotal) * 100) / 100;

    // Tax Breakup 2-Row Split (5% on A, 18% on B)
    const row1Taxable = Math.round((displayProductTotal / 1.05) * 100) / 100;
    const row1Gst = Math.round((displayProductTotal - row1Taxable) * 100) / 100;

    const row2Taxable = Math.round((displayServiceTotal / 1.18) * 100) / 100;
    const row2Gst = Math.round((displayServiceTotal - row2Taxable) * 100) / 100;

    const taxBreakupTotalTaxable = Math.round((row1Taxable + row2Taxable) * 100) / 100;
    const taxBreakupTotalGst = Math.round((row1Gst + row2Gst) * 100) / 100;

    const minRows = Math.max(4, combinedItems.length);
    const emptyRowsCount = Math.max(0, minRows - combinedItems.length);

    const shareOnWhatsApp = () => {
        const text = encodeURIComponent(
            `Hello ${clientName},\n\nPlease find your official Installation Receipt & Warranty Certificate (${invNumber}) from RAM MILAN SINGH CHARITABLE TRUST here:\n${window.location.href}\n\nTotal Project Value: ₹${grandTotal.toLocaleString('en-IN')}\n\nThank you!`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="receipt-page min-h-screen bg-[#f1f5f9] py-6 px-3">
            <div className="page-wrapper">
                {/* Top Action Toolbar */}
                <div className="action-toolbar print:hidden">
                    <div className="flex items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => navigate(-1)} 
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <div>
                            <h2>Ram Milan Singh Charitable Trust — Official Invoice & Certificate</h2>
                            <p>Reference: <strong>{invNumber}</strong> | Date: {invDate}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button type="button" className="whatsapp-btn" onClick={shareOnWhatsApp}>
                            <Share2 className="w-3.5 h-3.5 inline mr-1" /> Share on WhatsApp
                        </button>
                        <button type="button" className="print-btn" onClick={() => window.print()}>
                            <Printer className="w-3.5 h-3.5 inline mr-1" /> Print / Save as PDF
                        </button>
                    </div>
                </div>

                {/* Main A4 Sheet */}
                <div className="a4-sheet">
                    <div>
                        {/* 1. OFFICIAL TRUST HEADER BANNER WITH DYNAMIC INVOICE & DATE */}
                        <div className="header-banner-box">
                            <img 
                                src="/image%20copy%203.png" 
                                onError={(e) => { 
                                    e.currentTarget.onerror = null; 
                                    e.currentTarget.src = "/quotation_banner.png"; 
                                }} 
                                alt="Ram Milan Singh Charitable Trust" 
                                className="header-banner-img" 
                            />
                            <div className="banner-overlay-no">{invNumber}</div>
                            <div className="banner-overlay-date">{invDate}</div>
                        </div>

                        {/* 2. BILL TO */}
                        <div className="bill-to-row">
                            <span className="bill-to-title">Bill To : </span>
                            <span className="bill-to-name">{clientName}</span>
                            {clientCompany && <span style={{ fontWeight: 700, color: '#475569', marginLeft: '6px' }}>({clientCompany})</span>}
                            {clientPhone && <span style={{ color: '#64748b', fontFamily: 'monospace', marginLeft: '10px' }}>Ph: {clientPhone}</span>}
                            {clientEmail && <span style={{ color: '#64748b', marginLeft: '10px' }}>Email: {clientEmail}</span>}
                            {clientAddress && <span style={{ color: '#64748b', marginLeft: '10px' }}>Address: {clientAddress}</span>}
                        </div>

                        {/* 3. MAIN LINE ITEMS TABLE */}
                        <div className="table-section">
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th className="th-center" style={{ width: '60px' }}>S. No.</th>
                                        <th className="th-center">Description</th>
                                        <th className="th-center" style={{ width: '100px' }}>Quantity</th>
                                        <th className="th-center" style={{ width: '90px' }}>GST</th>
                                        <th className="th-center" style={{ width: '170px' }}>
                                            Total Amount<br />
                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#1e293b' }}>(Including GST) (₹)</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {combinedItems.map((item, index) => (
                                        <tr key={index}>
                                            <td className="td-center" style={{ fontWeight: 700, color: '#475569' }}>{item.idx}</td>
                                            <td>
                                                <div className="item-title">{item.name}</div>
                                                {/* Serial Number Displayed Right Under Product Name */}
                                                {item.serialNumber && (
                                                    <div className="item-serial-tag">
                                                        <span className="serial-label">S/N:</span> {item.serialNumber}
                                                    </div>
                                                )}
                                                {item.description && <div className="item-desc">{item.description}</div>}
                                            </td>
                                            <td className="td-center" style={{ fontWeight: 800 }}>{item.qty}</td>
                                            <td className="td-center" style={{ fontWeight: 700 }}>{item.gstPerc}%</td>
                                            {index === 0 && (
                                                <td 
                                                    rowSpan={combinedItems.length + emptyRowsCount} 
                                                    className="td-center td-total-col" 
                                                    style={{ 
                                                        fontWeight: 900, 
                                                        fontFamily: 'monospace', 
                                                        verticalAlign: 'middle', 
                                                        textAlign: 'center', 
                                                        fontSize: '22px', 
                                                        color: '#000000', 
                                                        letterSpacing: '0.5px' 
                                                    }}
                                                >
                                                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {Array.from({ length: emptyRowsCount }).map((_, emptyIdx) => (
                                        <tr key={`empty-${emptyIdx}`} className="empty-row">
                                            <td className="td-center">&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td className="td-center">&nbsp;</td>
                                            <td className="td-center">&nbsp;</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 4. COST SUMMARY TABLE (A + B) */}
                        <div className="summary-table-section">
                            <table className="summary-table">
                                <tbody>
                                    <tr className="summary-row-a">
                                        <td className="td-center col-code">A</td>
                                        <td className="col-desc">Panel + Inverter + Battery (Total Amount)</td>
                                        <td className="td-right col-amt">₹{displayProductTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="summary-row-b">
                                        <td className="td-center col-code">B</td>
                                        <td className="col-desc">EPC & Installation (Total Amount)</td>
                                        <td className="td-right col-amt">₹{displayServiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="summary-row-total">
                                        <td className="td-center col-code">&nbsp;</td>
                                        <td className="col-desc">Total Project Cost (A + B)</td>
                                        <td className="td-right col-amt">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 5. TAX BREAKUP TABLE */}
                        <div className="tax-breakup-section">
                            <div className="tax-header">
                                TAX BREAKUP (GST ALREADY INCLUDED IN ABOVE AMOUNT)
                            </div>
                            <div className="tax-table-container">
                                <table className="tax-table">
                                    <thead>
                                        <tr>
                                            <th className="th-center" style={{ width: '55px' }}>S. No.</th>
                                            <th className="th-center">Particulars</th>
                                            <th className="th-center" style={{ width: '120px' }}>
                                                Value Before GST<br />
                                                <span style={{ fontSize: '9.5px', fontWeight: 800 }}>(₹)</span>
                                            </th>
                                            <th className="th-center" style={{ width: '75px' }}>GST Rate</th>
                                            <th className="th-center" style={{ width: '110px' }}>
                                                GST Amount<br />
                                                <span style={{ fontSize: '9.5px', fontWeight: 800 }}>(₹)</span>
                                            </th>
                                            <th className="th-center" style={{ width: '135px' }}>
                                                Total Amount<br />
                                                <span style={{ fontSize: '9.5px', fontWeight: 800 }}>(Including GST) (₹)</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="td-center" style={{ fontWeight: 700, color: '#475569' }}>1</td>
                                            <td style={{ fontWeight: 700, color: '#0f172a' }}>Panel + Inverter + Battery (Total Amount)</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{row1Taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="td-center" style={{ fontWeight: 700 }}>5%</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{row1Gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 800 }}>₹{displayProductTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td className="td-center" style={{ fontWeight: 700, color: '#475569' }}>2</td>
                                            <td style={{ fontWeight: 700, color: '#0f172a' }}>EPC & Installation (Total Amount)</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{row2Taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="td-center" style={{ fontWeight: 700 }}>18%</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{row2Gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 800 }}>₹{displayServiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="td-center">&nbsp;</td>
                                            <td style={{ fontWeight: 900, fontSize: '11.5px', textTransform: 'uppercase' }}>Total Project Cost</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 900 }}>₹{taxBreakupTotalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="td-center" style={{ fontWeight: 900 }}>-</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontWeight: 900, color: '#166534' }}>+₹{taxBreakupTotalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="td-right" style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900 }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* 6. AMOUNT IN WORDS */}
                        <div className="amount-words-box">
                            <span className="amount-words-label">Amount in Words:</span>
                            <span className="amount-words-val">{grandTotalWords} (Including GST).</span>
                        </div>
                    </div>

                    {/* 7. FOOTER SECTION */}
                    <div className="footer-section">
                        <div className="footer-grid-3col">
                            {/* Left Column: Terms + Account Details */}
                            <div className="footer-left-col">
                                <div className="info-card-box">
                                    <div className="info-card-header">
                                        Terms and Conditions & Warranty Handover
                                    </div>
                                    <div className="info-card-body">
                                        <ol className="terms-list-ol">
                                            <li>Serial numbers above are registered for official OEM manufacturer warranty.</li>
                                            <li>GST is included in the total invoice amount as per government regulations.</li>
                                            <li>Scope of supply and installation completed as per technical specifications.</li>
                                            <li>All components have been verified, installed, and commissioned successfully.</li>
                                            <li>Produce this invoice certificate for all future warranty & service claims.</li>
                                        </ol>
                                    </div>
                                </div>

                                <div className="info-card-box">
                                    <div className="info-card-header">
                                        Account Details
                                    </div>
                                    <div className="info-card-body">
                                        <table className="account-table-grid">
                                            <tbody>
                                                <tr>
                                                    <td className="acc-lbl">Company Name</td>
                                                    <td className="acc-sep">:</td>
                                                    <td className="acc-val">Ram Milan Singh Charitable Trust</td>
                                                </tr>
                                                <tr>
                                                    <td className="acc-lbl">A/c No.</td>
                                                    <td className="acc-sep">:</td>
                                                    <td className="acc-val" style={{ fontFamily: 'monospace', fontWeight: 800 }}>242502100025006</td>
                                                </tr>
                                                <tr>
                                                    <td className="acc-lbl">IFSC</td>
                                                    <td className="acc-sep">:</td>
                                                    <td className="acc-val" style={{ fontFamily: 'monospace', fontWeight: 800 }}>UCBA0002425</td>
                                                </tr>
                                                <tr>
                                                    <td className="acc-lbl">Branch</td>
                                                    <td className="acc-sep">:</td>
                                                    <td className="acc-val">Kadipur, Sultanpur</td>
                                                </tr>
                                                <tr>
                                                    <td className="acc-lbl">A/c Type</td>
                                                    <td className="acc-sep">:</td>
                                                    <td className="acc-val">Current Account</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Middle Column: Warranty Details */}
                            <div className="info-card-box">
                                <div className="info-card-header">
                                    Warranty Details
                                </div>
                                <div className="info-card-body" style={{ padding: 0 }}>
                                    <table className="warranty-table-grid">
                                        <tbody>
                                            <tr>
                                                <td className="w-item">Panel</td>
                                                <td className="w-dur">
                                                    <strong style={{ color: '#0f172a' }}>25 Years</strong><br />
                                                    <span className="w-sub">(as per manufacturer)</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="w-item">Inverter</td>
                                                <td className="w-dur">
                                                    <strong style={{ color: '#0f172a' }}>05 Years</strong><br />
                                                    <span className="w-sub">(as per manufacturer)</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="w-item" style={{ borderBottom: 'none' }}>Battery</td>
                                                <td className="w-dur" style={{ borderBottom: 'none' }}>
                                                    <strong style={{ color: '#0f172a' }}>05 Years</strong><br />
                                                    <span className="w-sub">(as per manufacturer)</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Right Column: Authorized Signatory */}
                            <div className="signatory-column">
                                <div className="sign-for-label">For : Ram Milan Singh Charitable Trust</div>
                                <div className="sign-img-wrap">
                                    <img 
                                        src="/quotation_signature.png" 
                                        onError={(e) => { 
                                            e.currentTarget.onerror = null; 
                                            e.currentTarget.src = "/image%20copy.png"; 
                                        }} 
                                        alt="Managing Trustee Signature" 
                                        className="sign-official-img" 
                                    />
                                </div>
                                <div className="sign-hr-line"></div>
                                <div className="sign-auth-label">Authorized Signatory</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exact Styles Matching Official Quotation / Estimate */}
            <style dangerouslySetInnerHTML={{ __html: `
                .page-wrapper {
                    width: 860px;
                    margin: 20px auto;
                    padding: 0 15px;
                }
                .action-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 12px 24px;
                    margin-bottom: 20px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                    border: 1px solid #e2e8f0;
                }
                .action-toolbar h2 {
                    font-size: 14px;
                    font-weight: 800;
                    color: #005082;
                }
                .action-toolbar p {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .print-btn {
                    background-color: #0B3A2C;
                    color: #ffffff;
                    border: none;
                    padding: 9px 20px;
                    font-size: 12px;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 6px rgba(11,58,44,0.25);
                }
                .print-btn:hover {
                    background-color: #124b39;
                    transform: translateY(-1px);
                }
                .whatsapp-btn {
                    background-color: #25D366;
                    color: #ffffff;
                    border: none;
                    padding: 9px 18px;
                    font-size: 12px;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 6px rgba(37,211,102,0.3);
                }
                .whatsapp-btn:hover {
                    background-color: #1eb956;
                    transform: translateY(-1px);
                }
                .a4-sheet {
                    background: #ffffff;
                    width: 830px;
                    min-height: 1123px;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                    border: 1px solid #cbd5e1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    margin: 0 auto;
                }
                .header-banner-box {
                    position: relative;
                    width: 100%;
                    margin-bottom: 8px;
                    overflow: hidden;
                    border-radius: 4px;
                }
                .header-banner-img {
                    width: 100%;
                    height: auto;
                    display: block;
                }
                .banner-overlay-no {
                    position: absolute;
                    left: 81.2%;
                    top: 79.4%;
                    font-size: 12.5px;
                    font-weight: 800;
                    color: #00487C;
                    font-family: monospace;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    line-height: 1;
                    pointer-events: none;
                }
                .banner-overlay-date {
                    position: absolute;
                    left: 81.2%;
                    top: 86.8%;
                    font-size: 12.5px;
                    font-weight: 800;
                    color: #0f172a;
                    font-family: monospace;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    line-height: 1;
                    pointer-events: none;
                }
                .bill-to-row {
                    margin-top: 10px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1.5px solid #1e293b;
                    font-size: 13px;
                    color: #0f172a;
                }
                .bill-to-title {
                    font-weight: 900;
                    color: #000000;
                    font-size: 13.5px;
                    letter-spacing: 0.2px;
                }
                .bill-to-name {
                    font-weight: 800;
                    color: #00487C;
                    font-size: 13px;
                    text-transform: uppercase;
                    margin-left: 4px;
                }
                .table-section {
                    margin-top: 8px;
                    border: 1.5px solid #334155;
                    background: #ffffff;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11px;
                    background: #ffffff;
                }
                .items-table thead th {
                    background-color: #C8EBD0;
                    color: #000000;
                    font-weight: 900;
                    text-align: center;
                    border-bottom: 2px solid #1e293b;
                    border-right: 1.5px solid #334155;
                    padding: 5px 6px;
                    font-size: 11.5px;
                    line-height: 1.2;
                    vertical-align: middle;
                    letter-spacing: 0.2px;
                }
                .items-table thead th:last-child {
                    border-right: none;
                }
                .items-table tbody td {
                    border-bottom: 1px solid #64748b;
                    border-right: 1.5px solid #334155;
                    padding: 8px 10px;
                    vertical-align: middle;
                }
                .items-table tbody td.td-total-col {
                    border-right: none;
                    border-bottom: none;
                    text-align: center;
                    vertical-align: middle;
                }
                .items-table tbody tr.empty-row td {
                    height: 36px;
                    background: #ffffff;
                }
                .items-table tbody tr:last-child td {
                    border-bottom: none;
                }
                .th-center, .td-center {
                    text-align: center;
                }
                .th-right, .td-right {
                    text-align: right;
                }
                .item-title {
                    font-weight: 800;
                    color: #0f172a;
                    font-size: 12px;
                }
                .item-serial-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #e0f2fe;
                    color: #0369a1;
                    font-family: monospace;
                    font-size: 11px;
                    font-weight: 800;
                    padding: 2px 8px;
                    border-radius: 4px;
                    border: 1px solid #bae6fd;
                    margin-top: 4px;
                    letter-spacing: 0.5px;
                }
                .serial-label {
                    color: #0284c7;
                    font-weight: 900;
                }
                .item-desc {
                    font-size: 10px;
                    color: #475569;
                    margin-top: 3px;
                    line-height: 1.35;
                }
                .summary-table-section {
                    margin-top: 10px;
                    border: 1.5px solid #334155;
                    background: #ffffff;
                }
                .summary-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11.5px;
                    background: #ffffff;
                }
                .summary-table td.col-code {
                    width: 60px;
                    border-right: 1.5px solid #334155;
                    text-align: center;
                    font-weight: 800;
                    font-size: 13px;
                }
                .summary-table td.col-desc {
                    border-right: 1.5px solid #334155;
                    padding: 8px 12px;
                    font-weight: 800;
                    font-size: 12px;
                }
                .summary-table td.col-amt {
                    width: 170px;
                    padding: 8px 10px;
                    text-align: right;
                    font-family: monospace;
                    font-weight: 900;
                    font-size: 12.5px;
                    border-right: none;
                }
                .summary-row-a {
                    background-color: #CCE5FF;
                    color: #000000;
                }
                .summary-row-a td {
                    border-bottom: 1px solid #64748b;
                    background-color: #CCE5FF;
                }
                .summary-row-b {
                    background-color: #FBE5C8;
                    color: #000000;
                }
                .summary-row-b td {
                    border-bottom: 1px solid #64748b;
                    background-color: #FBE5C8;
                }
                .summary-row-total {
                    background-color: #C8EBD0;
                    color: #000000;
                }
                .summary-row-total td {
                    border-bottom: none;
                    background-color: #C8EBD0;
                    font-size: 12.5px;
                    font-weight: 900;
                    padding-top: 9px;
                    padding-bottom: 9px;
                }
                .tax-breakup-section {
                    margin-top: 9px;
                }
                .tax-header {
                    background: linear-gradient(90deg, #00487C 0%, #06606A 50%, #0E8558 100%);
                    color: #ffffff;
                    font-size: 10.5px;
                    font-weight: 900;
                    text-transform: uppercase;
                    padding: 4.5px 12px;
                    border-top-left-radius: 4px;
                    border-top-right-radius: 4px;
                    letter-spacing: 0.5px;
                }
                .tax-table-container {
                    border: 1.5px solid #334155;
                    border-top: none;
                    background: #ffffff;
                    border-radius: 0 0 4px 4px;
                    overflow: hidden;
                }
                .tax-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                    background: #ffffff;
                }
                .tax-table thead th {
                    background-color: #C8EBD0;
                    color: #000000;
                    font-weight: 900;
                    text-align: center;
                    border-bottom: 1.5px solid #1e293b;
                    border-right: 1.5px solid #334155;
                    padding: 6px 6px;
                    font-size: 10.5px;
                    line-height: 1.2;
                    vertical-align: middle;
                }
                .tax-table thead th:last-child {
                    border-right: none;
                }
                .tax-table tbody td {
                    border-bottom: 1px solid #64748b;
                    border-right: 1.5px solid #334155;
                    padding: 4.5px 8px;
                    font-size: 10px;
                    line-height: 1.25;
                    vertical-align: middle;
                }
                .tax-table tbody td:last-child {
                    border-right: none;
                }
                .tax-table tfoot tr {
                    background-color: #C8EBD0;
                    color: #000000;
                    font-weight: 900;
                    border-top: 1.5px solid #334155;
                }
                .tax-table tfoot td {
                    border-right: 1.5px solid #334155;
                    padding: 5px 8px;
                    font-size: 10.5px;
                    line-height: 1.25;
                    vertical-align: middle;
                }
                .tax-table tfoot td:last-child {
                    border-right: none;
                }
                .amount-words-box {
                    margin-top: 6px;
                    font-size: 11px;
                    color: #0f172a;
                    padding: 2px 0;
                }
                .amount-words-label {
                    font-weight: 800;
                    color: #000000;
                }
                .amount-words-val {
                    font-weight: 700;
                    color: #1e293b;
                    margin-left: 4px;
                }
                .footer-section {
                    margin-top: 10px;
                    padding-top: 6px;
                }
                .footer-grid-3col {
                    display: grid;
                    grid-template-columns: 2.1fr 1.3fr 1.3fr;
                    gap: 10px;
                    align-items: stretch;
                }
                .footer-left-col {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .info-card-box {
                    border: 1.5px solid #334155;
                    border-radius: 4px;
                    overflow: hidden;
                    background: #ffffff;
                }
                .info-card-header {
                    background: linear-gradient(90deg, #00487C 0%, #06606A 100%);
                    color: #ffffff;
                    font-size: 10.5px;
                    font-weight: 900;
                    padding: 4px 10px;
                    letter-spacing: 0.3px;
                }
                .info-card-body {
                    padding: 6px 10px;
                    font-size: 9.5px;
                    color: #1e293b;
                }
                .terms-list-ol {
                    margin: 0;
                    padding-left: 14px;
                    line-height: 1.35;
                }
                .terms-list-ol li {
                    margin-bottom: 2px;
                }
                .account-table-grid {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9.5px;
                    line-height: 1.35;
                }
                .account-table-grid td {
                    padding: 1.5px 2px;
                    vertical-align: top;
                }
                .acc-lbl {
                    color: #475569;
                    font-weight: 700;
                    width: 85px;
                }
                .acc-sep {
                    width: 10px;
                    font-weight: 800;
                }
                .acc-val {
                    color: #0f172a;
                    font-weight: 800;
                }
                .warranty-table-grid {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                }
                .warranty-table-grid td {
                    border-bottom: 1px solid #cbd5e1;
                    padding: 10px 8px;
                    vertical-align: middle;
                }
                .w-item {
                    font-weight: 800;
                    color: #00487C;
                    width: 45%;
                }
                .w-dur {
                    font-weight: 700;
                    color: #0f172a;
                    text-align: right;
                }
                .w-sub {
                    font-size: 8.5px;
                    color: #64748b;
                }
                .signatory-column {
                    border: 1.5px solid #334155;
                    border-radius: 4px;
                    padding: 8px 10px;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    text-align: center;
                }
                .sign-for-label {
                    font-size: 10.5px;
                    font-weight: 900;
                    color: #00487C;
                    text-transform: uppercase;
                    line-height: 1.25;
                }
                .sign-img-wrap {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6px 0;
                }
                .sign-official-img {
                    max-height: 52px;
                    max-width: 130px;
                    object-contain: fit;
                }
                .sign-hr-line {
                    height: 1px;
                    background: #94a3b8;
                    margin: 4px 10px;
                }
                .sign-auth-label {
                    font-size: 10px;
                    font-weight: 900;
                    color: #000000;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                @media print {
                    body {
                        background: #ffffff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .receipt-page {
                        background: #ffffff !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .page-wrapper {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .action-toolbar {
                        display: none !important;
                    }
                    .a4-sheet {
                        width: 100% !important;
                        min-height: auto !important;
                        border: none !important;
                        box-shadow: none !important;
                        padding: 10mm 12mm !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                }
            ` }} />
        </div>
    );
};

export default ProjectReceipt;
