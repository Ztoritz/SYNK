import React from 'react';
import { X, CheckCircle, AlertCircle, FileText, Printer, FileCheck } from 'lucide-react';

const MeasurementReportCard = ({ data, onClose }) => {
    if (!data) return null;

    // Helper for Swedish Float Parsing
    const parseSwedishFloat = (val) => {
        if (!val) return NaN;
        const clean = String(val).replace(/\s/g, '').replace(/,/g, '.');
        return parseFloat(clean);
    };

    // Helper to get initials
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    // Helper to clean name
    const cleanName = (name) => {
        if (!name) return 'Unknown';
        return name.split('(')[0].trim();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">

            {/* Print Styles: Enforce White Paper / Technical Report Look */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; background-color: white !important; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    /* Reset Colors for Paper */
                    * { color: black !important; border-color: #000 !important; background: transparent !important; box-shadow: none !important; text-shadow: none !important; }
                    /* Specific overrides for readability */
                    .print-border-b { border-bottom: 1px solid #000 !important; }
                    .print-border { border: 1px solid #000 !important; }
                    .print-text-sm { font-size: 10pt !important; }
                    .print-text-xs { font-size: 8pt !important; }
                    .print-header { font-size: 18pt !important; font-weight: bold; }
                    /* Make checkmarks/icons pseudo-elements or text if SVG fails, but current SVGs should print black ok */
                }
            `}</style>

            {/* Main Card Container */}
            {/* SCREEN: Dark Theme (Slate-900), White Text, Glassy Accents */}
            {/* PRINT: White Background, Black Text, No rounded corners/shadows */}
            <div className="bg-slate-900 w-full max-w-6xl h-[95vh] max-h-[1200px] flex flex-col rounded-2xl shadow-2xl overflow-hidden relative font-sans text-slate-100 ring-1 ring-white/10 mx-auto print:bg-white print:text-black print:h-auto print:max-w-none print:w-full print:rounded-none print:ring-0 print:shadow-none">

                {/* 1. Header Section */}
                {/* Screen: Dark Header with Gradient. Print: Simple Black text layout */}
                <div className="relative bg-slate-800/50 p-8 border-b border-white/5 flex justify-between items-start print:bg-white print:p-0 print:mb-8 print:border-b-2 print:border-black print:pb-4">

                    {/* "Official" Header Content */}
                    <div className="flex items-start gap-6">
                        {/* Logo Box */}
                        <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-3xl print:border-2 print:border-black print:text-black print:bg-white print:rounded-none print:shadow-none">
                            SA
                        </div>

                        <div className="pt-1">
                            <h1 className="text-4xl font-black text-white tracking-tight uppercase print:text-black print:text-5xl">Mätprotokoll</h1>
                            <p className="text-blue-400 text-sm font-bold mt-1 uppercase tracking-wider print:text-black print:italic">Kvalitetskontroll • Produktion • Serie A</p>

                            <div className="mt-3 flex gap-4 text-xs font-mono text-slate-400 print:text-black print:mt-1">
                                <span>ID: <span className="text-slate-200 print:text-black">{data.id}</span></span>
                                <span className="print:hidden">•</span>
                                <span className="print:hidden">SYSTEM: CMM V1.1</span>
                            </div>
                        </div>
                    </div>

                    {/* Status & ID */}
                    <div className="text-right">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${data.status === 'OK' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'} mb-3 print:border-black print:text-black print:bg-white print:px-0 print:py-0 print:border-0`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${data.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'} print:bg-black`}></span>
                            <span className="text-sm font-bold uppercase tracking-wider">
                                {data.status === 'OK' ? 'GODKÄND' : 'AVVIKELSE'}
                            </span>
                        </div>

                        {/* Serial Number */}
                        <div className="text-5xl font-mono font-bold text-white tracking-wider print:text-black print:text-4xl">
                            {data.serialNumber || data.articleNumber}
                        </div>
                    </div>
                </div>

                {/* 2. Metadata Grid - Dark Mode Cards vs Print Lines */}
                <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5 bg-slate-900/50 print:bg-white print:divide-transparent print:border-b-2 print:border-black print:mb-8">
                    {/* Item 1 */}
                    <div className="p-6 print:p-2 print:pl-0">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2 print:text-black print:mb-0 print:text-[10px]">Artikelnummer</span>
                        <span className="text-xl font-mono text-blue-400 font-bold print:text-black print:text-lg">{data.articleNumber}</span>
                    </div>
                    {/* Item 2 */}
                    <div className="p-6 print:p-2">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2 print:text-black print:mb-0 print:text-[10px]">Ritningsnummer</span>
                        <span className="text-xl font-mono text-white print:text-black print:text-lg">{data.drawingNumber}</span>
                    </div>
                    {/* Item 3 */}
                    <div className="p-6 print:p-2">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2 print:text-black print:mb-0 print:text-[10px]">Kontrollant</span>
                        <div className="flex items-center gap-3 print:block">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-white/10 print:hidden">
                                {getInitials(cleanName(data.controller))}
                            </div>
                            <span className="text-lg font-bold text-white truncate max-w-[180px] print:text-black print:text-lg" title={data.controller}>
                                {cleanName(data.controller)}
                            </span>
                        </div>
                    </div>
                    {/* Item 4 */}
                    <div className="p-6 print:p-2 print:text-right print:pr-0">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2 print:text-black print:mb-0 print:text-[10px]">Datum</span>
                        <span className="text-lg font-mono text-slate-300 print:text-black print:text-lg">
                            {new Date(data.timestamp || data.archivedAt).toLocaleDateString('sv-SE')}
                        </span>
                    </div>
                </div>

                {/* 3. Detailed Results Table */}
                <div className="flex-1 overflow-y-auto bg-slate-900/30 print:bg-white print:overflow-visible">
                    {(() => {
                        let displayParams = data.parameters;
                        // Fallback parsing
                        if ((!displayParams || displayParams.length === 0) && data.xml) {
                            try {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(data.xml, "text/xml");
                                displayParams = Array.from(doc.querySelectorAll('Parameter')).map(p => ({
                                    id: p.getAttribute('id'),
                                    nominal: p.querySelector('Nominal')?.textContent,
                                    measured: p.querySelector('Measured')?.textContent,
                                    status: p.querySelector('Status')?.textContent,
                                    upper: p.querySelector('Tolerance')?.getAttribute('upper'),
                                    lower: p.querySelector('Tolerance')?.getAttribute('lower'),
                                    type: p.getAttribute('type'),
                                    method: p.getAttribute('method')
                                }));
                            } catch (e) { }
                        }

                        if (!displayParams?.length) return (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 print:text-black">
                                <FileText size={48} className="mb-4 opacity-50" />
                                <p className="text-lg">Inga mätvärden tillgängliga.</p>
                            </div>
                        );

                        return (
                            <table className="w-full text-left border-collapse print:text-sm">
                                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-bold tracking-wider sticky top-0 backdrop-blur-md z-10 border-b border-white/5 print:bg-white print:text-black print:static print:border-b-2 print:border-black">
                                    <tr>
                                        <th className="p-4 w-16 text-center print:border-b print:border-black">Status</th>
                                        <th className="p-4 w-20 print:border-b print:border-black">Pos</th>
                                        <th className="p-4 w-24 print:border-b print:border-black">Mått</th>
                                        <th className="p-4 text-right w-32 print:border-b print:border-black">Nom</th>
                                        <th className="p-4 text-center w-32 print:border-b print:border-black">Tol</th>
                                        <th className="p-4 text-center w-40 bg-slate-800/80 print:bg-white print:border-b print:border-black">Gränser</th>
                                        <th className="p-4 text-right font-bold w-40 text-white bg-slate-800/30 print:text-black print:bg-white print:border-b print:border-black">Uppmätt</th>
                                        <th className="p-4 text-right w-28 print:border-b print:border-black">Avvikelse</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono text-sm print:divide-slate-300">
                                    {displayParams.map((p, idx) => {
                                        const nom = parseSwedishFloat(p.nominal);
                                        const meas = parseSwedishFloat(p.measured);
                                        const lower = parseSwedishFloat(p.lower || p.lowerTol);
                                        const upper = parseSwedishFloat(p.upper || p.upperTol);
                                        const dev = meas - nom;
                                        const minLim = nom - Math.abs(lower || 0);
                                        const maxLim = nom + Math.abs(upper || 0);

                                        return (
                                            <tr key={idx} className={`group hover:bg-white/5 transition-colors ${p.status !== 'OK' ? 'bg-red-500/5 hover:bg-red-500/10' : ''} print:hover:bg-white print:bg-white`}>
                                                <td className="p-4 text-center border-r border-white/5 print:border-none">
                                                    {p.status === 'OK' ?
                                                        <CheckCircle size={18} className="text-emerald-500 mx-auto print:text-black" /> :
                                                        <AlertCircle size={18} className="text-red-500 mx-auto print:text-black" />
                                                    }
                                                </td>
                                                <td className="p-4 text-slate-300 font-bold border-r border-white/5 print:text-black print:border-none">{p.id}</td>
                                                <td className="p-4 text-slate-500 border-r border-white/5 print:text-black print:border-none">
                                                    {/* Symbol Rendering */}
                                                    {p.type && p.type !== 'none' ? (
                                                        <span className="inline-block w-8 h-8 rounded bg-slate-800 text-center leading-8 text-neutral-300 font-bold print:bg-transparent print:text-black print:border print:border-black print:w-auto print:h-auto print:px-1 print:leading-normal">
                                                            {p.type === 'position' ? '⌖' : p.type === 'flatness' ? '⏥' : p.type === 'perpendicularity' ? '⟂' : p.type === 'parallelism' ? '∥' : p.type === 'DIA' ? '⌀' : p.type === 'L' ? '⏤' : '-'}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4 text-right text-slate-300 font-medium border-r border-white/5 print:text-black print:border-none">{p.nominal}</td>
                                                <td className="p-4 text-center text-slate-500 border-r border-white/5 print:text-black print:border-none">
                                                    <span className="text-xs">+{p.upper || p.upperTol}</span> / <span className="text-xs">-{p.lower || p.lowerTol}</span>
                                                </td>
                                                <td className="p-4 text-center text-slate-400 border-r border-white/5 bg-slate-800/30 print:bg-white print:text-black print:border-none">
                                                    <span className="opacity-80">[{minLim.toFixed(2)} - {maxLim.toFixed(2)}]</span>
                                                </td>
                                                <td className={`p-4 text-right font-black text-lg border-r border-white/5 bg-slate-800/10 ${p.status === 'OK' ? 'text-emerald-400' : 'text-red-400 underline decoration-red-500/50'} print:text-black print:bg-white print:border-none print:no-underline`}>
                                                    {p.measured}
                                                </td>
                                                <td className={`p-4 text-right font-bold ${Math.abs(dev) > 0 ? (p.status === 'OK' ? 'text-blue-400' : 'text-red-400') : 'text-slate-600'} print:text-black`}>
                                                    {!isNaN(dev) ? (dev > 0 ? `+${dev.toFixed(2)}` : dev.toFixed(2)) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>

                {/* 4. Footer - Clean Signature */}
                <div className="bg-slate-800/50 p-8 border-t border-white/5 mt-auto flex justify-between items-center print:bg-white print:border-t-2 print:border-black print:mt-8 print:p-0 print:pt-4">
                    {/* Signature Block */}
                    <div className="flex gap-4">
                        <div className="print:border-t print:border-black print:pt-2 print:w-64">
                            <div className="text-sm uppercase text-slate-500 font-bold tracking-widest mb-1 print:text-black print:text-[10px]">Kontrollant</div>
                            <div className="font-serif text-3xl italic text-white print:text-black mb-1">
                                {cleanName(data.controller)}
                            </div>
                            <div className="flex items-center gap-2 text-emerald-500 text-xs font-mono font-bold print:hidden">
                                <FileCheck size={14} /> Digitalsignerad
                            </div>
                            <div className="hidden print:block text-[10px] uppercase font-bold text-black mt-1">Signatur</div>
                        </div>
                    </div>

                    {/* Action Buttons (Hide on Print) */}
                    <div className="flex items-center gap-4 no-print">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-white/10 text-sm font-bold uppercase tracking-wide"
                        >
                            <Printer size={18} /> Rapportera (PDF)
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-10 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all text-sm font-bold uppercase tracking-wide"
                        >
                            Stäng
                        </button>
                    </div>
                </div>

                {/* Close X (Hide on Print) */}
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 p-3 rounded-full transition-all border border-white/5 shadow-lg backdrop-blur-sm no-print">
                    <X size={24} />
                </button>

            </div>
        </div>
    );
};

export default MeasurementReportCard;
