import React, { useState } from 'react';
import { Package, Plus, Save, Trash2, Database, Ruler, X, Settings, CheckCircle, AlertCircle, FileText, FolderOpen } from 'lucide-react';
import MeasurementReportCard from './MeasurementReportCard';

const VaultSystem = ({ items, onUpdateItems, onSync, onRequestMeasurement, matkortFolder = [] }) => {
    const [newItem, setNewItem] = useState({
        artikelnummer: '',
        beskrivning: '',
        ritningsnummer: '',
        leverantör: '',
        inköpspris: ''
    });

    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [configItem, setConfigItem] = useState(null);
    const [measurementDefs, setMeasurementDefs] = useState({});

    const [isResultOpen, setIsResultOpen] = useState(false);
    const [resultItem, setResultItem] = useState(null);

    const [isMatkortDetailOpen, setIsMatkortDetailOpen] = useState(false);
    const [selectedMatkort, setSelectedMatkort] = useState(null);

    const handleAdd = () => {
        if (!newItem.artikelnummer) return;
        const item = {
            id: Date.now().toString(),
            ...newItem
        };
        onUpdateItems([...items, item]);
        setNewItem({ artikelnummer: '', beskrivning: '', ritningsnummer: '', leverantör: '', inköpspris: '' });
    };

    const handleDelete = (id) => {
        onUpdateItems(items.filter(i => i.id !== id));
    };

    const handleEdit = (id, field, value) => {
        onUpdateItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const openConfig = (item) => {
        setConfigItem(item);
        // Load existing defs or create defaults
        if (!measurementDefs[item.id]) {
            const defaults = Array.from({ length: 10 }, (_, i) => ({
                id: `M${i + 1}`,
                active: false,
                nominal: '',
                upperTol: '0,0',
                lowerTol: '0,0',
                isDiameter: false,
                gdtType: 'none',
            }));
            setMeasurementDefs(prev => ({ ...prev, [item.id]: defaults }));
        }
        setIsConfigOpen(true);
    };

    const updateConfig = (defIdx, field, value) => {
        setMeasurementDefs(prev => {
            const currentDefs = prev[configItem.id] || [];
            if (!currentDefs[defIdx]) return prev;

            const newDefs = currentDefs.map((def, i) =>
                i === defIdx ? { ...def, [field]: value } : def
            );
            return { ...prev, [configItem.id]: newDefs };
        });
    };

    const handleRequest = (item) => {
        const defs = measurementDefs[item.id]?.filter(d => d.active) || [];

        if (defs.length === 0) {
            alert("Vänligen konfigurera mätkortet (Mätkort-knappen) och välj minst en parameter innan du skickar ordern.");
            return;
        }

        onRequestMeasurement(item, defs);
    };

    const openResult = (item) => {
        setResultItem(item);
        setIsResultOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 relative">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                    <Database className="text-amber-500" />
                    <h2 className="text-xl font-bold text-slate-100">Autodesk Vault</h2>
                </div>
                <p className="text-xs text-slate-400">Master Data (Swedish)</p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* New Item Form */}
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Skapa Ny Artikel</h3>
                    <div className="space-y-2">
                        <input
                            placeholder="Artikelnummer"
                            value={newItem.artikelnummer}
                            onChange={e => setNewItem({ ...newItem, artikelnummer: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                        <input
                            placeholder="Beskrivning"
                            value={newItem.beskrivning}
                            onChange={e => setNewItem({ ...newItem, beskrivning: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                placeholder="Ritningsnummer"
                                value={newItem.ritningsnummer}
                                onChange={e => setNewItem({ ...newItem, ritningsnummer: e.target.value })}
                                className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                            />
                            <input
                                placeholder="Inköpspris"
                                type="number"
                                value={newItem.inköpspris}
                                onChange={e => setNewItem({ ...newItem, inköpspris: e.target.value })}
                                className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                            />
                        </div>
                        <input
                            placeholder="Leverantör"
                            value={newItem.leverantör}
                            onChange={e => setNewItem({ ...newItem, leverantör: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                        <input
                            placeholder="PDF Ritning (sökväg)"
                            value={newItem.pdfUrl || ''}
                            onChange={e => setNewItem({ ...newItem, pdfUrl: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                        />
                        <button
                            onClick={handleAdd}
                            className="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-1.5 rounded flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Lägg till
                        </button>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="bg-slate-800 p-3 rounded border border-slate-600 relative group">
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="grid grid-cols-1 gap-2">
                                <div className="text-xs text-amber-500 font-mono">{item.artikelnummer}</div>

                                <input
                                    value={item.beskrivning}
                                    onChange={e => handleEdit(item.id, 'beskrivning', e.target.value)}
                                    className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-slate-500 focus:border-amber-500 outline-none text-slate-200"
                                />
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                    <div>
                                        <span className="block text-[10px] text-slate-500">Ritning</span>
                                        <input
                                            value={item.ritningsnummer}
                                            onChange={e => handleEdit(item.id, 'ritningsnummer', e.target.value)}
                                            className="bg-transparent w-full outline-none hover:text-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-500">Pris</span>
                                        <input
                                            value={item.inköpspris}
                                            onChange={e => handleEdit(item.id, 'inköpspris', e.target.value)}
                                            className="bg-transparent w-full outline-none hover:text-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-slate-500">Leverantör</span>
                                    <input
                                        value={item.leverantör}
                                        onChange={e => handleEdit(item.id, 'leverantör', e.target.value)}
                                        className="bg-transparent w-full text-xs outline-none hover:text-slate-300"
                                    />
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between">
                                    <button
                                        onClick={() => openConfig(item)}
                                        className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
                                        title="Konfigurera Mätkort"
                                    >
                                        <Settings size={12} /> Mätkort
                                    </button>
                                    <button
                                        onClick={() => handleRequest(item)}
                                        className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
                                        title="Skicka Mätorder"
                                    >
                                        <Ruler size={12} /> Begär Mätning
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                <button
                    onClick={onSync}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded font-medium flex items-center justify-center gap-2"
                >
                    <Save size={16} /> Generera XML → ERP
                </button>
            </div>

            {/* Config Modal */}
            {isConfigOpen && configItem && (
                <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col p-4 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <div>
                            <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                <Settings size={16} className="text-amber-500" /> Konfigurera Mätkort
                            </h3>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-blue-400 font-mono">{configItem.artikelnummer}</span>
                            </div>
                        </div>
                        <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-800 rounded border border-slate-700">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 w-10 text-center">Aktiv</th>
                                    <th className="p-2 w-12">ID</th>
                                    <th className="p-2">Nominal</th>
                                    <th className="p-2">Uppmätt</th>
                                    <th className="p-2">Tol +</th>
                                    <th className="p-2">Tol -</th>
                                    <th className="p-2">Diameter</th>
                                    <th className="p-2">GD&T</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(measurementDefs[configItem.id] || []).map((def, idx) => {
                                    const resultParam = configItem.lastResult?.parameters?.find(p => p.id === def.id);
                                    return (
                                        <tr key={def.id} className={def.active ? 'bg-slate-700/30' : 'opacity-50'}>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={def.active}
                                                    onChange={(e) => updateConfig(idx, 'active', e.target.checked)}
                                                    className="rounded bg-slate-700 border-slate-500 text-amber-500 focus:ring-amber-500/50"
                                                />
                                            </td>
                                            <td className="p-2 font-mono text-slate-500">{def.id}</td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={def.nominal}
                                                    onChange={(e) => updateConfig(idx, 'nominal', e.target.value)}
                                                    className="w-16 bg-slate-900 border border-slate-600 rounded px-1 py-0.5 text-slate-200"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="p-2">
                                                {resultParam ? (
                                                    <span className={`font-bold font-mono ${resultParam.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {resultParam.measured}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <div className="relative w-16">
                                                    <input
                                                        type="text"
                                                        value={def.upperTol}
                                                        onChange={(e) => updateConfig(idx, 'upperTol', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded-l px-1 py-0.5 text-slate-400 text-xs pr-4 focus:outline-none focus:border-amber-500"
                                                    />
                                                    <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-slate-600">
                                                        <button
                                                            className="h-1/2 px-1 hover:bg-slate-700 text-[8px] text-slate-400 flex items-center justify-center bg-slate-800 rounded-tr"
                                                            onClick={() => {
                                                                const val = parseFloat(String(def.upperTol).replace(',', '.')) || 0;
                                                                updateConfig(idx, 'upperTol', (val + 0.1).toFixed(1).replace('.', ','));
                                                            }}
                                                        >▲</button>
                                                        <button
                                                            className="h-1/2 px-1 hover:bg-slate-700 text-[8px] text-slate-400 flex items-center justify-center bg-slate-800 border-t border-slate-600 rounded-br"
                                                            onClick={() => {
                                                                const val = parseFloat(String(def.upperTol).replace(',', '.')) || 0;
                                                                updateConfig(idx, 'upperTol', (val - 0.1).toFixed(1).replace('.', ','));
                                                            }}
                                                        >▼</button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <div className="relative w-16">
                                                    <input
                                                        type="text"
                                                        value={def.lowerTol}
                                                        onChange={(e) => updateConfig(idx, 'lowerTol', e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-600 rounded-l px-1 py-0.5 text-slate-400 text-xs pr-4 focus:outline-none focus:border-amber-500"
                                                    />
                                                    <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-slate-600">
                                                        <button
                                                            className="h-1/2 px-1 hover:bg-slate-700 text-[8px] text-slate-400 flex items-center justify-center bg-slate-800 rounded-tr"
                                                            onClick={() => {
                                                                const val = parseFloat(String(def.lowerTol).replace(',', '.')) || 0;
                                                                updateConfig(idx, 'lowerTol', (val + 0.1).toFixed(1).replace('.', ','));
                                                            }}
                                                        >▲</button>
                                                        <button
                                                            className="h-1/2 px-1 hover:bg-slate-700 text-[8px] text-slate-400 flex items-center justify-center bg-slate-800 border-t border-slate-600 rounded-br"
                                                            onClick={() => {
                                                                const val = parseFloat(String(def.lowerTol).replace(',', '.')) || 0;
                                                                updateConfig(idx, 'lowerTol', (val - 0.1).toFixed(1).replace('.', ','));
                                                            }}
                                                        >▼</button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={def.isDiameter}
                                                    onChange={(e) => updateConfig(idx, 'isDiameter', e.target.checked)}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={def.gdtType}
                                                    onChange={(e) => updateConfig(idx, 'gdtType', e.target.value)}
                                                    className="bg-slate-900 border border-slate-600 rounded text-slate-200 text-sm font-bold w-12 text-center appearance-none cursor-pointer hover:bg-slate-800"
                                                    title="GD&T Symbol"
                                                >
                                                    <option value="none">-</option>
                                                    <option value="position">⌖</option>
                                                    <option value="flatness">⏥</option>
                                                    <option value="perpendicularity">⟂</option>
                                                    <option value="parallelism">∥</option>
                                                    <option value="concentricity">◎</option>
                                                    <option value="cylindricity">⌭</option>
                                                    <option value="roundness">○</option>
                                                    <option value="straightness">⏤</option>
                                                    <option value="profile_surface">⌓</option>
                                                    <option value="runout">↗</option>
                                                </select>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mätkort Folder - inside modal */}
                    {matkortFolder.filter(mk => mk.articleNumber === configItem.artikelnummer).length > 0 && (
                        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FolderOpen className="text-emerald-400" size={16} />
                                <h3 className="text-xs font-semibold text-emerald-300 uppercase">Sparade Mätkort</h3>
                                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                                    {matkortFolder.filter(mk => mk.articleNumber === configItem.artikelnummer).length}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-auto">
                                {matkortFolder.filter(mk => mk.articleNumber === configItem.artikelnummer).map(mk => (
                                    <div
                                        key={mk.id}
                                        className="bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 cursor-pointer transition-colors border border-slate-700/50 group"
                                        onClick={() => {
                                            setSelectedMatkort(mk);
                                            setIsMatkortDetailOpen(true);
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-mono font-bold text-emerald-400">
                                                {mk.serialNumber}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{new Date(mk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-xs text-slate-400 truncate">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={10} className="text-emerald-500" /> {mk.drawingNumber}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-amber-500 block mt-1">{mk.parameters?.length || 0} Parametrar</span>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            {mk.controller}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-700">
                        <button
                            onClick={() => setIsConfigOpen(false)}
                            className="px-4 py-2 rounded text-xs hover:bg-slate-800 text-slate-400"
                        >
                            Stäng
                        </button>
                        <button
                            onClick={() => {
                                handleRequest(configItem);
                                setIsConfigOpen(false);
                            }}
                            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded text-xs font-medium flex items-center gap-2"
                        >
                            <Ruler size={14} /> Spara & Begär Mätning
                        </button>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {isResultOpen && resultItem && resultItem.lastResult && (
                <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col p-4 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <div>
                            <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                <FileText size={16} className="text-emerald-500" /> Kontrollkort
                            </h3>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-blue-400 font-mono">{resultItem.artikelnummer}</span>
                                {resultItem.lastResult?.serialNumber && (
                                    <span className="font-mono bg-slate-800 px-2 rounded text-emerald-300 border border-slate-600">
                                        ID: {resultItem.lastResult.serialNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setIsResultOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="mb-4 bg-slate-800 p-3 rounded text-sm space-y-1 border border-slate-600">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Status:</span>
                            <span className={`font-bold ${resultItem.lastResult.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {resultItem.lastResult.status}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Signerad av:</span>
                            <span className="text-slate-200">{resultItem.lastResult.controller}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Tid:</span>
                            <span className="text-slate-200">{new Date(resultItem.lastResult.timestamp).toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto rounded border border-slate-700">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-800 text-slate-400 uppercase font-semibold">
                                <tr>
                                    <th className="p-2">ID</th>
                                    <th className="p-2">Nom</th>
                                    <th className="p-2">Mätt</th>
                                    <th className="p-2">Tol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {resultItem.lastResult.parameters.map(p => (
                                    <tr key={p.id}>
                                        <td className="p-2 font-mono text-slate-500">{p.id}</td>
                                        <td className="p-2 text-slate-300">{p.nominal}</td>
                                        <td className={`p-2 font-bold ${p.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>{p.measured}</td>
                                        <td className="p-2 text-slate-500">{p.lower}/{p.upper}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Report Card Modal (Updated) */}
            {isMatkortDetailOpen && selectedMatkort && (
                <MeasurementReportCard
                    data={selectedMatkort}
                    onClose={() => setIsMatkortDetailOpen(false)}
                />
            )}
        </div>
    );
};

export default VaultSystem;
