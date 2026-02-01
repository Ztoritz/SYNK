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
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { size: A4; margin: 20mm; }
                    body { -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .page-break { page-break-before: always; }
                    /* Force black text for savings */
                    * { color: black !important; border-color: #ddd !important; }
                    /* But keep badge definition via borders/grayscale if needed, or simple text */
                }
            `}</style>

            {/* Main Report Container - A4 Aspect Ratio */}
            {/* Screen: Fixed size, centered. Print: Full width, no shadow, no border */}
            <div className="bg-white w-full max-w-[210mm] min-h-[297mm] flex flex-col shadow-2xl overflow-hidden relative font-sans text-slate-900 mx-auto print:shadow-none print:w-full print:h-auto print:overflow-visible">

                {/* 1. Header - Classic "Old Masters" Serif Title + Modern Metadata */}
                <div className="p-12 pb-8 border-b border-slate-900 print:border-black flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            {/* Logo / Monogram */}
                            <div className="w-12 h-12 border-2 border-slate-900 flex items-center justify-center font-serif font-bold text-xl print:border-black">
                                SA
                            </div>
                            <div className="uppercase tracking-[0.2em] text-[10px] font-bold text-slate-500 print:text-black">
                                Sim Åkers • Quality Control
                            </div>
                        </div>

                        <h1 className="font-serif text-5xl text-slate-900 tracking-tight leading-none mb-2 print:text-black">
                            Mätprotokoll
                        </h1>
                        <p className="font-serif italic text-slate-500 text-lg print:text-black">
                            Produktionskontroll Serie A
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="font-mono text-xs text-slate-400 mb-2 print:text-black">
                            ID: {data.id}
                        </div>
                        <div className="text-4xl font-mono font-bold text-slate-900 tracking-wider print:text-black">
                            {data.serialNumber || data.articleNumber}
                        </div>
                        {/* Status Badge - Minimalist */}
                        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 border ${data.status === 'OK' ? 'border-slate-900' : 'border-slate-900'} rounded-full print:border-black`}>
                            <div className={`w-2 h-2 rounded-full ${data.status === 'OK' ? 'bg-slate-900' : 'bg-slate-900'} print:bg-black`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider print:text-black">
                                {data.status === 'OK' ? 'GODKÄND' : 'AVVIKELSE'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Info Grid - Apple Style: Clean, Generous Padding, Light Borders */}
                <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 print:border-slate-300 print:divide-slate-300">
                    <div className="p-8 grid grid-cols-2 gap-8">
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 print:text-black">Artikel</span>
                            <span className="font-mono text-lg font-bold">{data.articleNumber}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 print:text-black">Ritning</span>
                            <span className="font-mono text-lg">{data.drawingNumber}</span>
                        </div>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-8">
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 print:text-black">Kontrollant</span>
                            <span className="font-serif italic text-lg">{cleanName(data.controller)}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1 print:text-black">Datum</span>
                            <span className="font-mono text-sm">{new Date(data.timestamp || data.archivedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Data Table - Minimalist, High Contrast */}
                <div className="flex-1 p-8 print:p-4">
                    {/* Recovery Logic Inlined */}
                    {(() => {
                        let displayParams = data.parameters;
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

                        if (!displayParams?.length) return <div className="p-10 text-center text-slate-300 italic font-serif">Inga värden registrerade.</div>;

                        return (
                            <table className="w-full text-left border-collapse">
                                <thead className="border-b-2 border-slate-900 text-[10px] uppercase tracking-widest text-slate-500 font-bold print:border-black print:text-black">
                                    <tr>
                                        <th className="py-4 w-12 text-center">#</th>
                                        <th className="py-4 w-16">Pos</th>
                                        <th className="py-4 w-24">Karaktär</th>
                                        <th className="py-4 text-right">Nominellt</th>
                                        <th className="py-4 text-center">Tolerans</th>
                                        <th className="py-4 text-right font-bold text-slate-900 print:text-black">Uppmätt</th>
                                        <th className="py-4 text-right">Avvikelse</th>
                                    </tr>
                                </thead>
                                <tbody className="font-mono text-sm">
                                    {displayParams.map((p, idx) => {
                                        const nom = parseSwedishFloat(p.nominal);
                                        const meas = parseSwedishFloat(p.measured);
                                        const dev = meas - nom;
                                        return (
                                            <tr key={idx} className="border-b border-slate-100 print:border-slate-300">
                                                <td className="py-4 text-center">
                                                    {p.status === 'OK' ?
                                                        <span className="font-bold text-slate-900 print:text-black">✓</span> :
                                                        <span className="font-bold text-slate-900 print:text-black">!</span>
                                                    }
                                                </td>
                                                <td className="py-4 font-bold">{p.id}</td>
                                                <td className="py-4 text-slate-500 print:text-black">
                                                    {/* Symbol Map */}
                                                    {p.type === 'position' ? '⌖' : p.type === 'flatness' ? '⏥' : p.type === 'perpendicularity' ? '⟂' : p.type === 'parallelism' ? '∥' : p.type === 'DIA' ? '⌀' : p.type === 'L' ? '⏤' : '-'}
                                                </td>
                                                <td className="py-4 text-right">{p.nominal}</td>
                                                <td className="py-4 text-center text-xs opacity-60">
                                                    +{p.upper || p.upperTol} / -{p.lower || p.lowerTol}
                                                </td>
                                                <td className="py-4 text-right font-black text-lg">
                                                    {p.measured}
                                                </td>
                                                <td className="py-4 text-right opacity-70">
                                                    {(!isNaN(dev) && Math.abs(dev) > 0) ? (dev > 0 ? `+${dev.toFixed(2)}` : dev.toFixed(2)) : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        );
                    })()}
                </div>

                {/* 4. Footer - Classic Signature & Sign-off */}
                <div className="p-12 border-t border-slate-900 mt-auto print:border-black">
                    <div className="flex justify-between items-end">
                        <div className="w-64 border-t border-slate-900 pt-4 print:border-black">
                            <div className="font-serif text-3xl italic mb-1">{cleanName(data.controller)}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 print:text-black">Godkänd Av</div>
                        </div>

                        <div className="text-right no-print">
                            <button onClick={handlePrint} className="mr-4 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold uppercase text-xs tracking-wider rounded transition-colors">
                                <Printer size={16} className="inline mr-2" /> Skriv Ut
                            </button>
                            <button onClick={onClose} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs tracking-wider rounded transition-colors">
                                Stäng
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top Close for Screen Only */}
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 no-print">
                    <X size={32} />
                </button>
            </div>
        </div>
    );
};

export default MeasurementReportCard;
