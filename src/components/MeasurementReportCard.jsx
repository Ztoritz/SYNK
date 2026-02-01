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

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Main Report Container - A4 Ratio-ish - WHITE PAPER THEME */}
            <div className="bg-white w-full max-w-4xl h-[90vh] max-h-[1000px] flex flex-col rounded-xl shadow-2xl overflow-hidden relative font-sans text-slate-900">

                {/* 1. Technical Header */}
                <div className="bg-slate-50 border-b-2 border-slate-200 p-8 flex justify-between items-start">
                    <div className="flex items-start gap-5">
                        <div className="w-16 h-16 bg-blue-700 rounded-lg flex items-center justify-center shadow-md text-white font-bold text-2xl">
                            SA
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Mätprotokoll</h1>
                            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">Kvalitetskontroll • Produktion</p>
                            <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                DOKUMENT-ID: {data.id} <br />
                                SYSTEM: Control Measurement Module
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded mb-2 shadow-sm">
                            <span className={`w-2.5 h-2.5 rounded-full ${data.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-bold ${data.status === 'OK' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {data.status === 'OK' ? 'GODKÄND' : 'AVVIKELSE'}
                            </span>
                        </div>
                        <div className="text-3xl font-mono font-bold text-slate-900 tracking-wider">
                            {data.serialNumber || data.articleNumber}
                        </div>
                    </div>
                </div>

                {/* 2. Metadata Grid */}
                <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-white">
                    <div className="p-4">
                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Artikelnummer</span>
                        <span className="text-base font-mono text-blue-700 font-bold">{data.articleNumber}</span>
                    </div>
                    <div className="p-4">
                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Ritningsnummer</span>
                        <span className="text-base font-mono text-slate-900">{data.drawingNumber}</span>
                    </div>
                    <div className="p-4">
                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Kontrollant</span>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                {getInitials(data.controller)}
                            </div>
                            <span className="text-sm font-medium text-slate-900 truncate max-w-[120px]" title={data.controller}>
                                {data.controller}
                            </span>
                        </div>
                    </div>
                    <div className="p-4">
                        <span className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Datum & Tid</span>
                        <span className="text-sm font-mono text-slate-700">
                            {new Date(data.timestamp || data.archivedAt).toLocaleString('sv-SE')}
                        </span>
                    </div>
                </div>

                {/* 3. Detailed Results Table */}
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {(!data.parameters || data.parameters.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FileText size={48} className="mb-2 opacity-20" />
                            <p className="text-sm">Inga mätvärden tillgängliga i detta protokoll.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-3 border-b border-slate-200 w-16 text-center">Status</th>
                                    <th className="p-3 border-b border-slate-200 w-16">Pos</th>
                                    <th className="p-3 border-b border-slate-200 w-24">Symbol</th>
                                    <th className="p-3 border-b border-slate-200 text-right">Nominellt</th>
                                    <th className="p-3 border-b border-slate-200 text-center w-32">Tolerans</th>
                                    <th className="p-3 border-b border-slate-200 text-center w-32 bg-slate-100/50">Gränser</th>
                                    <th className="p-3 border-b border-slate-200 text-right font-bold w-32">Uppmätt</th>
                                    <th className="p-3 border-b border-slate-200 text-right w-24">Avvikelse</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-mono">
                                {data.parameters.map((p, idx) => {
                                    const nom = parseSwedishFloat(p.nominal);
                                    const meas = parseSwedishFloat(p.measured);
                                    const lower = parseSwedishFloat(p.lower || p.lowerTol);
                                    const upper = parseSwedishFloat(p.upper || p.upperTol);
                                    const dev = meas - nom;

                                    const minLim = nom - Math.abs(lower || 0);
                                    const maxLim = nom + Math.abs(upper || 0);

                                    return (
                                        <tr key={idx} className={`hover:bg-blue-50/50 transition-colors ${p.status !== 'OK' ? 'bg-red-50' : ''}`}>
                                            <td className="p-3 text-center border-r border-slate-100">
                                                {p.status === 'OK' ? <CheckCircle size={16} className="text-emerald-600 mx-auto" /> : <AlertCircle size={16} className="text-red-600 mx-auto" />}
                                            </td>
                                            <td className="p-3 text-slate-500 border-r border-slate-100 font-bold">{p.id}</td>
                                            <td className="p-3 text-slate-600 border-r border-slate-100">
                                                {p.type && p.type !== 'none' ? (
                                                    <span className="inline-block w-6 h-6 rounded bg-slate-200 text-center leading-6 text-sm font-bold text-slate-700" title={p.type}>
                                                        {/* Map types to symbols if needed, or rely on stored symbol */}
                                                        {p.type === 'position' ? '⌖' : p.type === 'flatness' ? '⏥' : p.type === 'perpendicularity' ? '⟂' : p.type === 'parallelism' ? '∥' : p.type === 'DIA' ? '⌀' : p.type === 'L' ? '⏤' : '⏤'}
                                                    </span>
                                                ) : '-'}
                                                {p.method && <span className="ml-2 text-[10px] text-slate-400">{p.method}</span>}
                                            </td>
                                            <td className="p-3 text-right text-slate-700 font-medium border-r border-slate-100">{p.nominal}</td>
                                            <td className="p-3 text-center text-slate-500 border-r border-slate-100">
                                                <span className="text-xs">+{p.upper || p.upperTol}</span> / <span className="text-xs">-{p.lower || p.lowerTol}</span>
                                            </td>
                                            <td className="p-3 text-center text-slate-500 border-r border-slate-100 bg-slate-50/50">
                                                <span className="opacity-80">[{minLim.toFixed(2)} - {maxLim.toFixed(2)}]</span>
                                            </td>
                                            <td className={`p-3 text-right font-bold text-sm border-r border-slate-100 bg-slate-50 ${p.status === 'OK' ? 'text-emerald-700' : 'text-red-600 underline decoration-red-300'}`}>
                                                {p.measured}
                                            </td>
                                            <td className={`p-3 text-right font-bold ${Math.abs(dev) > 0 ? (p.status === 'OK' ? 'text-blue-600' : 'text-red-600') : 'text-slate-400'}`}>
                                                {!isNaN(dev) ? (dev > 0 ? `+${dev.toFixed(2)}` : dev.toFixed(2)) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 4. Signature & Footer - PAPER THEME */}
                <div className="bg-slate-50 p-6 border-t border-slate-200">
                    <div className="flex justify-between items-end">
                        <div className="flex gap-12">
                            <div className="border-t-2 border-slate-300 pt-2 w-56">
                                <div className="font-serif text-2xl text-slate-800 mb-1 italic">
                                    {/* Simulated handwritten sig */}
                                    <span className="opacity-80 font-handwriting">{data.controller}</span>
                                </div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Signatur Kontrollant</div>
                                <div className="text-xs text-emerald-700 font-mono mt-0.5 flex items-center gap-1 font-bold">
                                    <FileCheck size={14} /> Digitalsignerad
                                </div>
                            </div>

                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded hover:bg-slate-200 text-slate-600 transition-all border border-slate-300 text-xs font-bold uppercase tracking-wide print:hidden">
                                <Printer size={16} /> Skriv ut
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-8 py-2.5 rounded bg-blue-700 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 transition-all text-xs font-bold uppercase tracking-wide print:hidden"
                            >
                                Stäng
                            </button>
                        </div>
                    </div>
                    <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Sim Åkers • Quality Assurance System • Revision 2026.1</p>
                    </div>
                </div>

                {/* Close Button Absolute */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 p-2 rounded-full transition-all border border-slate-200 shadow-sm">
                    <X size={20} />
                </button>

            </div>
        </div>
    );
};

export default MeasurementReportCard;
