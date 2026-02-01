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

    // Helper to clean name (remove parentheses like "(Creator)" or extra whitespace)
    const cleanName = (name) => {
        if (!name) return 'Unknown';
        // Split by '(' to remove "(Creator)", split by '-' just in case, trim whitespace
        return name.split('(')[0].trim();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Main Report Container - A4 Ratio-ish - WHITE PAPER THEME */}
            <div className="bg-white w-full max-w-5xl h-[95vh] max-h-[1100px] flex flex-col rounded-xl shadow-2xl overflow-hidden relative font-sans text-slate-900">

                {/* 1. Technical Header */}
                <div className="bg-slate-50 border-b-2 border-slate-200 p-8 flex justify-between items-start">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-blue-700 rounded-lg flex items-center justify-center shadow-md text-white font-bold text-3xl">
                            SA
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Mätprotokoll</h1>
                            <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-wider">Kvalitetskontroll • Produktion</p>
                            <div className="mt-2 text-xs text-slate-400 font-mono">
                                DOKUMENT-ID: {data.id} <br />
                                SYSTEM: Control Measurement Module
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded mb-2 shadow-sm">
                            <span className={`w-4 h-4 rounded-full ${data.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            <span className={`text-base font-bold ${data.status === 'OK' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {data.status === 'OK' ? 'GODKÄND' : 'AVVIKELSE'}
                            </span>
                        </div>
                        <div className="text-5xl font-mono font-bold text-slate-900 tracking-wider mt-2">
                            {data.serialNumber || data.articleNumber}
                        </div>
                    </div>
                </div>

                {/* 2. Metadata Grid */}
                <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-white">
                    <div className="p-6">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2">Artikelnummer</span>
                        <span className="text-xl font-mono text-blue-700 font-bold">{data.articleNumber}</span>
                    </div>
                    <div className="p-6">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2">Ritningsnummer</span>
                        <span className="text-xl font-mono text-slate-900">{data.drawingNumber}</span>
                    </div>
                    <div className="p-6">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2">Kontrollant</span>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200">
                                {getInitials(cleanName(data.controller))}
                            </div>
                            <span className="text-lg font-bold text-slate-900 truncate max-w-[180px]" title={data.controller}>
                                {cleanName(data.controller)}
                            </span>
                        </div>
                    </div>
                    <div className="p-6">
                        <span className="block text-xs uppercase text-slate-500 font-bold mb-2">Datum & Tid</span>
                        <span className="text-lg font-mono text-slate-700">
                            {new Date(data.timestamp || data.archivedAt).toLocaleString('sv-SE')}
                        </span>
                    </div>
                </div>

                {/* 3. Detailed Results Table (With XML Fallback for Old Data) */}
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {(() => {
                        // RECOVERY LOGIC: If parameters are missing but XML exists, parse it on-the-fly!
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
                            } catch (e) {
                                console.error("Failed to parse fallback XML", e);
                            }
                        }

                        if (!displayParams || displayParams.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <FileText size={64} className="mb-4 opacity-20" />
                                    <p className="text-xl font-medium">Inga mätvärden tillgängliga i detta protokoll.</p>
                                </div>
                            );
                        }

                        return (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-600 text-sm uppercase font-bold tracking-wider sticky top-0 shadow-sm z-10 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 border-b border-slate-200 w-24 text-center">Status</th>
                                        <th className="p-4 border-b border-slate-200 w-24">Pos</th>
                                        <th className="p-4 border-b border-slate-200 w-32">Symbol</th>
                                        <th className="p-4 border-b border-slate-200 text-right w-40">Nominellt</th>
                                        <th className="p-4 border-b border-slate-200 text-center w-40">Tolerans</th>
                                        <th className="p-4 border-b border-slate-200 text-center w-48 bg-slate-100/50">Gränser</th>
                                        <th className="p-4 border-b border-slate-200 text-right font-black w-48 text-slate-900">Uppmätt</th>
                                        <th className="p-4 border-b border-slate-200 text-right w-32">Avvikelse</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-base font-mono">
                                    {displayParams.map((p, idx) => {
                                        const nom = parseSwedishFloat(p.nominal);
                                        const meas = parseSwedishFloat(p.measured);
                                        const lower = parseSwedishFloat(p.lower || p.lowerTol);
                                        const upper = parseSwedishFloat(p.upper || p.upperTol);
                                        const dev = meas - nom;

                                        const minLim = nom - Math.abs(lower || 0);
                                        const maxLim = nom + Math.abs(upper || 0);

                                        return (
                                            <tr key={idx} className={`hover:bg-blue-50/50 transition-colors ${p.status !== 'OK' ? 'bg-red-50' : ''}`}>
                                                <td className="p-4 text-center border-r border-slate-100">
                                                    {p.status === 'OK' ? <CheckCircle size={24} className="text-emerald-600 mx-auto" /> : <AlertCircle size={24} className="text-red-600 mx-auto" />}
                                                </td>
                                                <td className="p-4 text-slate-700 border-r border-slate-100 font-bold text-lg">{p.id}</td>
                                                <td className="p-4 text-slate-600 border-r border-slate-100">
                                                    {p.type && p.type !== 'none' ? (
                                                        <span className="inline-block w-10 h-10 rounded bg-slate-200 text-center leading-10 text-xl font-bold text-slate-700" title={p.type}>
                                                            {/* Map types to symbols if needed, or rely on stored symbol */}
                                                            {p.type === 'position' ? '⌖' : p.type === 'flatness' ? '⏥' : p.type === 'perpendicularity' ? '⟂' : p.type === 'parallelism' ? '∥' : p.type === 'DIA' ? '⌀' : p.type === 'L' ? '⏤' : '⏤'}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="p-4 text-right text-slate-800 font-bold border-r border-slate-100 text-lg">{p.nominal}</td>
                                                <td className="p-4 text-center text-slate-500 border-r border-slate-100">
                                                    <span className="text-base font-semibold">+{p.upper || p.upperTol}</span> / <span className="text-base font-semibold">-{p.lower || p.lowerTol}</span>
                                                </td>
                                                <td className="p-4 text-center text-slate-500 border-r border-slate-100 bg-slate-50/50">
                                                    <span className="opacity-90 font-medium text-base">[{minLim.toFixed(2)} - {maxLim.toFixed(2)}]</span>
                                                </td>
                                                <td className={`p-4 text-right font-black text-xl border-r border-slate-100 bg-slate-50 ${p.status === 'OK' ? 'text-emerald-700' : 'text-red-600 underline decoration-red-300'}`}>
                                                    {p.measured}
                                                </td>
                                                <td className={`p-4 text-right font-bold text-lg ${Math.abs(dev) > 0 ? (p.status === 'OK' ? 'text-blue-600' : 'text-red-600') : 'text-slate-400'}`}>
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

                {/* 4. Signature & Footer - PAPER THEME */}
                <div className="bg-slate-50 p-8 border-t border-slate-200">
                    <div className="flex justify-between items-end">
                        <div className="flex gap-16">
                            <div className="border-t-2 border-slate-400 pt-4 w-72">
                                <div className="font-serif text-3xl text-slate-900 mb-2 italic">
                                    {/* Simulated handwritten sig - CLEANED NAME */}
                                    <span className="opacity-90 font-handwriting">{cleanName(data.controller)}</span>
                                </div>
                                <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Signatur Kontrollant</div>
                                <div className="text-sm text-emerald-700 font-mono mt-1 flex items-center gap-2 font-bold">
                                    <FileCheck size={18} /> Digitalsignerad
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-6 py-3 rounded hover:bg-slate-200 text-slate-700 transition-all border border-slate-300 text-sm font-bold uppercase tracking-wide print:hidden">
                                <Printer size={18} /> Skriv ut
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-10 py-3 rounded bg-blue-700 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 transition-all text-sm font-bold uppercase tracking-wide print:hidden"
                            >
                                Stäng
                            </button>
                        </div>
                    </div>
                    <div className="mt-10 pt-6 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Sim Åkers • Quality Assurance System • Revision 2026.1</p>
                    </div>
                </div>

                {/* Close Button Absolute */}
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-3 rounded-full transition-all border border-slate-200 shadow-sm">
                    <X size={24} />
                </button>

            </div>
        </div>
    );
};

export default MeasurementReportCard;
