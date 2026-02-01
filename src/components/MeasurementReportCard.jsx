import React from 'react';
import { X, CheckCircle, AlertCircle, FileText, Printer, FileCheck } from 'lucide-react';

const MeasurementReportCard = ({ data, onClose }) => {
    if (!data) return null;

    // Helper for Swedish Float Parsing (for deviation calc)
    const parseSwedishFloat = (val) => {
        if (!val) return NaN;
        const clean = String(val).replace(/\s/g, '').replace(/,/g, '.');
        return parseFloat(clean);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Main Report Container - A4 Ratio-ish */}
            <div className="bg-slate-900 w-full max-w-4xl h-[90vh] max-h-[1000px] flex flex-col rounded-xl shadow-2xl border border-slate-700 overflow-hidden relative">

                {/* 1. Technical Header */}
                <div className="bg-slate-800 border-b-2 border-slate-700 p-6 flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg text-white font-bold text-2xl">
                            SA
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100 tracking-tight uppercase">Mätprotokoll</h1>
                            <p className="text-slate-400 text-xs font-mono mt-1 uppercase tracking-wider">Kvalitetskontroll • Produktion</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-mono">
                                DOKUMENT-ID: {data.id} <br />
                                SYSTEM: Control Measurement Module
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-700 rounded mb-2">
                            <span className={`w-2 h-2 rounded-full ${data.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
                            <span className={`text-xs font-bold ${data.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {data.status === 'OK' ? 'GODKÄND' : 'AVVIKELSE'}
                            </span>
                        </div>
                        <div className="text-3xl font-mono font-bold text-slate-200 tracking-wider">
                            {data.serialNumber || data.articleNumber}
                        </div>
                    </div>
                </div>

                {/* 2. Metadata Grid */}
                <div className="grid grid-cols-4 gap-px bg-slate-700 border-b border-slate-700">
                    <div className="bg-slate-800/80 p-3">
                        <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Artikelnummer</span>
                        <span className="text-sm font-mono text-blue-300 font-bold">{data.articleNumber}</span>
                    </div>
                    <div className="bg-slate-800/80 p-3">
                        <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Ritningsnummer</span>
                        <span className="text-sm font-mono text-slate-200">{data.drawingNumber}</span>
                    </div>
                    <div className="bg-slate-800/80 p-3">
                        <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Kontrollant</span>
                        <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center text-[10px] border border-emerald-500/30">{data.controller}</span>
                            {data.controller}
                        </span>
                    </div>
                    <div className="bg-slate-800/80 p-3">
                        <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Datum & Tid</span>
                        <span className="text-sm font-mono text-slate-300">
                            {new Date(data.timestamp || data.archivedAt).toLocaleString('sv-SE')}
                        </span>
                    </div>
                </div>

                {/* 3. Detailed Results Table */}
                <div className="flex-1 overflow-y-auto p-0 bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-3 border-b border-slate-800 w-16 text-center">Status</th>
                                <th className="p-3 border-b border-slate-800 w-16">Pos</th>
                                <th className="p-3 border-b border-slate-800 w-24">Typ</th>
                                <th className="p-3 border-b border-slate-800 text-right">Nominellt</th>
                                <th className="p-3 border-b border-slate-800 text-center w-32">Tolerans</th>
                                <th className="p-3 border-b border-slate-800 text-center w-32 bg-slate-900/50">Gränser</th>
                                <th className="p-3 border-b border-slate-800 text-right font-bold text-white bg-slate-800/20">Uppmätt</th>
                                <th className="p-3 border-b border-slate-800 text-right">Avvikelse</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs font-mono">
                            {data.parameters?.map((p, idx) => {
                                const nom = parseSwedishFloat(p.nominal);
                                const meas = parseSwedishFloat(p.measured);
                                const lower = parseSwedishFloat(p.lower);
                                const upper = parseSwedishFloat(p.upper);
                                const dev = meas - nom;

                                // Calc limits for display only (assuming logic is correct in data)
                                const minLim = nom - Math.abs(lower || 0);
                                const maxLim = nom + Math.abs(upper || 0);

                                return (
                                    <tr key={idx} className={`hover:bg-slate-800/30 transition-colors ${p.status !== 'OK' ? 'bg-red-950/10' : ''}`}>
                                        <td className="p-3 text-center border-r border-slate-800/50">
                                            {p.status === 'OK' ? <CheckCircle size={16} className="text-emerald-500 mx-auto" /> : <AlertCircle size={16} className="text-red-500 mx-auto" />}
                                        </td>
                                        <td className="p-3 text-slate-500 border-r border-slate-800/50">{p.id}</td>
                                        <td className="p-3 text-slate-400 border-r border-slate-800/50">
                                            {p.type && p.type !== 'none' ? (
                                                <span className="inline-block w-6 h-6 rounded bg-slate-800 text-center leading-6 text-sm" title={p.type}>
                                                    {/* Simple mapping fallback if needed, or just display type code */}
                                                    {/* Assuming Unicode symbols were passed? If not, rely on text */}
                                                    {p.type === 'position' ? '⌖' : p.type === 'flatness' ? '⏥' : p.type === 'perpendicularity' ? '⟂' : p.type === 'parallelism' ? '∥' : '⌀'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px]">Längd</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-slate-300 font-medium border-r border-slate-800/50">{p.nominal}</td>
                                        <td className="p-3 text-center text-slate-500 border-r border-slate-800/50">
                                            <span className="text-xs">+{p.upper}</span> / <span className="text-xs">-{p.lower}</span>
                                        </td>
                                        <td className="p-3 text-center text-slate-500 border-r border-slate-800/50 bg-slate-900/30">
                                            <span className="opacity-70">[{minLim.toFixed(2)} - {maxLim.toFixed(2)}]</span>
                                        </td>
                                        <td className={`p-3 text-right font-bold text-sm border-r border-slate-800/50 bg-slate-800/10 ${p.status === 'OK' ? 'text-emerald-400' : 'text-red-400 underline decoration-red-500/30'}`}>
                                            {p.measured}
                                        </td>
                                        <td className={`p-3 text-right font-bold ${Math.abs(dev) > 0 ? (p.status === 'OK' ? 'text-blue-400' : 'text-red-400') : 'text-slate-600'}`}>
                                            {!isNaN(dev) ? (dev > 0 ? `+${dev.toFixed(2)}` : dev.toFixed(2)) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* 4. Signature & Footer */}
                <div className="bg-slate-900 p-6 border-t border-slate-700">
                    <div className="flex justify-between items-end">
                        <div className="flex gap-8">
                            <div className="border-t border-slate-600 pt-2 w-48">
                                <div className="font-script text-2xl text-slate-400 mb-1 italic opacity-70">Digitalt Signerad</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Signatur Kontrollant</div>
                                <div className="text-xs text-emerald-500 font-mono mt-0.5 flex items-center gap-1">
                                    <FileCheck size={12} /> {data.controller} verified
                                </div>
                            </div>

                            {data.status === 'OK' && (
                                <div className="border-t border-slate-600 pt-2 w-48">
                                    <div className="font-script text-2xl text-slate-400 mb-1 italic opacity-70">Auto Godkänd</div>
                                    <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Godkännande</div>
                                    <div className="text-xs text-blue-500 font-mono mt-0.5 flex items-center gap-1">
                                        System Approved
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 text-sm font-medium print:hidden">
                                <Printer size={16} /> Skriv ut
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all text-sm font-medium print:hidden"
                            >
                                Stäng
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Sim Åkers • Quality Assurance System • Revision 2026.1</p>
                    </div>
                </div>

                {/* Close Button Absolute */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-2 rounded-full transition-all border border-slate-700/50">
                    <X size={20} />
                </button>

            </div>
        </div>
    );
};

export default MeasurementReportCard;
