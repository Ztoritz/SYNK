import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle, FileSpreadsheet, Ruler, Inbox, ArrowRight, UserCheck, X, FileText, FileImage } from 'lucide-react';

const ControlMeasurement = ({ onXmlGenerated, incomingRequests = [], archivedRequests = [], onSelectRequest }) => {
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'archive'
    const [currentRequestId, setCurrentRequestId] = useState(null);
    const [isArchiveDetailOpen, setIsArchiveDetailOpen] = useState(false);
    const [selectedArchiveItem, setSelectedArchiveItem] = useState(null);
    const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

    const [header, setHeader] = useState({
        articleNumber: '',
        drawingNumber: ''
    });

    const [selectedController, setSelectedController] = useState('');
    const [activeDefinitions, setActiveDefinitions] = useState(null); // If null, defined by user

    const [measurements, setMeasurements] = useState(
        Array.from({ length: 10 }, (_, i) => ({
            id: `M${i + 1}`,
            nominal: '',
            measured: '',
            upperTol: '0.1',
            lowerTol: '-0.1',
            isDiameter: false,
            gdtType: 'none',
            isActive: true
        }))
    );

    // Auto-fill form and definitions when user clicks a request
    const handleSelectRequest = (req) => {
        setCurrentRequestId(req.id); // Track ID for archiving
        setHeader({
            articleNumber: req.articleNumber,
            drawingNumber: req.drawingNumber
        });
        setCurrentPdfUrl(req.pdfUrl || null);

        // If definitions exist, overwrite local state to match
        if (req.definitions && req.definitions.length > 0) {
            setActiveDefinitions(req.definitions);

            // Map definitions to measurement rows
            const newMeasurements = Array.from({ length: 10 }, (_, i) => {
                const id = `M${i + 1}`;
                const def = req.definitions.find(d => d.id === id);
                if (def) {
                    return {
                        id,
                        nominal: def.nominal,
                        measured: '',
                        upperTol: def.upperTol,
                        lowerTol: def.lowerTol,
                        isDiameter: false, // Default or from definition if added
                        gdtType: def.gdtType,
                        isActive: true
                    };
                } else {
                    return { id, isActive: false };
                }
            });
            setMeasurements(newMeasurements);
        } else {
            // If no definitions provided (should not happen with new VaultSystem logic), show nothing active
            setActiveDefinitions([]);
            setMeasurements(Array.from({ length: 10 }, (_, i) => ({
                id: `M${i + 1}`,
                isActive: false
            })));
        }

        if (onSelectRequest) onSelectRequest(req.id);
    };

    const checkStatus = (m) => {
        if (!m.isActive && activeDefinitions) return 'skip';
        if (m.nominal === '' || m.measured === '') return 'neutral';
        const nom = parseFloat(m.nominal);
        const val = parseFloat(m.measured);
        const upper = parseFloat(m.upperTol);
        const lower = parseFloat(m.lowerTol);

        if (isNaN(nom) || isNaN(val) || isNaN(upper) || isNaN(lower)) return 'neutral';

        const diff = val - nom;
        return (diff <= upper && diff >= lower) ? 'ok' : 'fail';
    };

    const handleUpdate = (index, field, value) => {
        const newM = [...measurements];
        newM[index][field] = value;
        setMeasurements(newM);
    };

    const generateXml = () => {
        if (!selectedController) {
            alert("Signatur saknas! Vänligen välj en kontrollant innan du sparar.");
            return;
        }

        const timestamp = new Date().toISOString();
        let xml = `<MeasurementReport timestamp="${timestamp}">
  <RequestId>${currentRequestId || ''}</RequestId>
  <ArticleNumber>${header.articleNumber || 'UNKNOWN'}</ArticleNumber>
  <DrawingNumber>${header.drawingNumber || 'UNKNOWN'}</DrawingNumber>
  <Controller>${selectedController} (${selectedController === 'NJA' ? 'Niklas Jalvemyr' : 'Dan Notesjö'})</Controller>
  <Results>
`;

        measurements.forEach(m => {
            if (m.isActive !== false && m.nominal !== '') {
                const status = checkStatus(m);
                xml += `    <Parameter id="${m.id}">
      <Description>${m.isDiameter ? 'DIA' : 'LIN'} ${m.gdtType !== 'none' ? m.gdtType.toUpperCase() : ''}</Description>
      <Nominal>${m.nominal}</Nominal>
      <Measured>${m.measured}</Measured>
      <Tolerance upper="${m.upperTol}" lower="${m.lowerTol}" />
      <Status>${status.toUpperCase()}</Status>
    </Parameter>
`;
            }
        });

        xml += `  </Results>
</MeasurementReport>`;

        onXmlGenerated(xml, currentRequestId);

        // Success Feedback
        alert(`Mätkort för ${header.articleNumber} har sparats till Arkivet!`);

        // Reset after sync
        setSelectedController('');
        setMeasurements(Array.from({ length: 10 }, (_, i) => ({ id: `M${i + 1}`, isActive: false })));
        setHeader({ articleNumber: '', drawingNumber: '' });
        setCurrentRequestId(null);
    };

    const displayedRequests = activeTab === 'inbox' ? incomingRequests : archivedRequests;

    return (
        <>
            <div className="flex h-full max-w-7xl mx-auto w-full">
                {/* Incoming Requests Sidebar */}
                <div className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-4">
                            <Inbox size={18} className="text-blue-400" />
                            <h3 className="text-sm font-semibold text-slate-200">Ordrar</h3>
                        </div>
                        {/* Tabs */}
                        <div className="flex bg-slate-950 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={`flex-1 text-[10px] py-1 rounded font-medium transition-colors ${activeTab === 'inbox' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Inkorg ({incomingRequests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('archive')}
                                className={`flex-1 text-[10px] py-1 rounded font-medium transition-colors ${activeTab === 'archive' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Arkiv
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {displayedRequests.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-xs">
                                {activeTab === 'inbox' ? 'Inga väntande ordrar' : 'Inget arkiverat'}
                            </div>
                        )}
                        {displayedRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => {
                                    if (activeTab === 'archive') {
                                        // Open detail view for archived items
                                        setSelectedArchiveItem(req);
                                        setIsArchiveDetailOpen(true);
                                    } else {
                                        handleSelectRequest(req);
                                    }
                                }}
                                className={`p-3 rounded border cursor-pointer group transition-all 
                                ${activeTab === 'inbox'
                                        ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700'
                                        : 'bg-slate-900/30 border-slate-800 hover:bg-slate-800 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-mono font-bold ${activeTab === 'inbox' ? 'text-blue-300' : 'text-emerald-400'}`}>
                                        {req.serialNumber || req.articleNumber}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-xs text-slate-400 truncate">
                                    {req.serialNumber ? (
                                        <span className="flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> {req.drawingNumber}</span>
                                    ) : req.drawingNumber}
                                </div>
                                {(req.definitions?.length > 0 || req.parameters?.length > 0) && (
                                    <span className="text-[9px] text-amber-500 block mt-1">
                                        {req.parameters?.length || req.definitions?.length} Parametrar
                                    </span>
                                )}

                                {activeTab === 'inbox' && (
                                    <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">Ladda <ArrowRight size={10} /></span>
                                    </div>
                                )}
                                {activeTab === 'archive' && (
                                    <div className="mt-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-blue-400 flex items-center gap-1">Visa <ArrowRight size={10} /></span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Form */}
                <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-700">
                    {/* Header / Context */}
                    <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <Ruler size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100">Kontrollmätning</h2>
                                    <p className="text-sm text-slate-400">Kvalitetskontroll</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Controller Signature Dropdown */}
                                <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1 border border-slate-600">
                                    <UserCheck size={16} className={selectedController ? 'text-emerald-400' : 'text-slate-500'} />
                                    <select
                                        value={selectedController}
                                        onChange={(e) => setSelectedController(e.target.value)}
                                        className="bg-transparent text-xs text-slate-200 outline-none"
                                    >
                                        <option value="">-- Signera --</option>
                                        <option value="Niklas Jalvemyr">Niklas Jalvemyr</option>
                                        <option value="Olle Ljungberg">Olle Ljungberg</option>
                                    </select>
                                </div>

                                <button
                                    onClick={generateXml}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg 
                                    ${selectedController
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                            : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`}
                                >
                                    <Save size={18} /> Spara
                                </button>

                                {currentPdfUrl && (
                                    <button
                                        onClick={() => setIsPdfModalOpen(true)}
                                        className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg shadow-blue-600/20"
                                    >
                                        <FileImage size={18} /> Ritning
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Artikelnummer</label>
                                <input
                                    value={header.articleNumber}
                                    onChange={(e) => setHeader({ ...header, articleNumber: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-100 focus:border-emerald-500 outline-none"
                                    placeholder="t.ex. 123-456-ABC"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ritningsnummer</label>
                                <input
                                    value={header.drawingNumber}
                                    onChange={(e) => setHeader({ ...header, drawingNumber: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-100 focus:border-emerald-500 outline-none"
                                    placeholder="t.ex. DRW-9000-X"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Matrix Form */}
                    <div className="flex-1 overflow-auto p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/20 to-slate-900">
                        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 w-16 text-center">ID</th>
                                        {/** GDT Header Removed */}
                                        <th className="p-3">Nominell</th>
                                        <th className="p-3">Tolerans (+/-)</th>
                                        <th className="p-3 bg-slate-800/50 border-l border-slate-700/50">Uppmätt Värde</th>
                                        <th className="p-3 w-24 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {measurements.map((m, idx) => {
                                        if (m.isActive === false && activeDefinitions) return null; // Hide if not in definition

                                        const status = checkStatus(m);
                                        return (
                                            <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 text-center font-mono text-slate-500">{m.id}</td>

                                                {/* Type & GDT */}
                                                {/** GDT Cell Removed */}

                                                {/* Nominal */}
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={m.nominal}
                                                        onChange={(e) => handleUpdate(idx, 'nominal', e.target.value)}
                                                        className="w-full bg-transparent border-b border-slate-600 focus:border-indigo-500 outline-none py-1 font-mono text-indigo-100"
                                                        placeholder="0.00"
                                                        readOnly={true} // Always Readonly as per request
                                                        disabled
                                                    />
                                                </td>

                                                {/* Tolerances */}
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-slate-500 text-xs w-4 text-right">+</span>
                                                        <input
                                                            type="number"
                                                            value={m.upperTol}
                                                            onChange={(e) => handleUpdate(idx, 'upperTol', e.target.value)}
                                                            className="w-16 bg-slate-900/50 border border-slate-700 rounded px-1 py-0.5 text-xs text-slate-300 text-center"
                                                            readOnly={!!activeDefinitions}
                                                        />
                                                        <span className="text-slate-500 text-xs w-4 text-right">-</span>
                                                        <input
                                                            type="number"
                                                            value={m.lowerTol}
                                                            onChange={(e) => handleUpdate(idx, 'lowerTol', e.target.value)}
                                                            className="w-16 bg-slate-900/50 border border-slate-700 rounded px-1 py-0.5 text-xs text-slate-300 text-center"
                                                            readOnly={!!activeDefinitions}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Measured (Highlighted) */}
                                                <td className="p-3 border-l border-slate-700/50 bg-slate-800/10">
                                                    <input
                                                        type="number"
                                                        value={m.measured}
                                                        onChange={(e) => handleUpdate(idx, 'measured', e.target.value)}
                                                        className={`w-full bg-slate-900 border rounded px-3 py-1.5 font-mono font-bold outline-none transition-colors
                                                        ${status === 'ok' ? 'border-emerald-500/50 text-emerald-400' : ''}
                                                        ${status === 'fail' ? 'border-red-500/50 text-red-400' : ''}
                                                        ${status === 'neutral' ? 'border-slate-600 text-slate-200' : ''}
                                                    `}
                                                        placeholder="Enter Value"
                                                    />
                                                </td>

                                                {/* Status */}
                                                <td className="p-3 text-center">
                                                    {status === 'ok' && <CheckCircle className="inline text-emerald-500 animate-in zoom-in duration-200" size={20} />}
                                                    {status === 'fail' && <AlertCircle className="inline text-red-500 animate-in zoom-in duration-200" size={20} />}
                                                    {status === 'neutral' && <div className="w-2 h-2 bg-slate-700 rounded-full inline-block"></div>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Archive Detail Modal */}
            {isArchiveDetailOpen && selectedArchiveItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <div>
                                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                    <FileText size={16} className="text-emerald-500" /> Kontrollkort (Arkiv)
                                </h3>
                                <div className="flex items-center gap-4 text-xs mt-1">
                                    <span className="font-mono bg-emerald-900/30 px-2 py-0.5 rounded text-emerald-300 border border-emerald-600/30">
                                        {selectedArchiveItem.serialNumber}
                                    </span>
                                    <span className="text-blue-400 font-mono">{selectedArchiveItem.articleNumber}</span>
                                    <span className="text-slate-500">{selectedArchiveItem.drawingNumber}</span>
                                </div>
                            </div>
                            <button onClick={() => setIsArchiveDetailOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>

                        {/* Info Header */}
                        <div className="bg-slate-800/50 rounded-lg p-3 m-4 mb-0 border border-slate-700">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-500 block">Kontrollant</span>
                                    <span className="text-emerald-400 font-medium">{selectedArchiveItem.controller}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Datum</span>
                                    <span className="text-slate-300">{new Date(selectedArchiveItem.timestamp).toLocaleDateString('sv-SE')}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Status</span>
                                    <span className={`font-bold ${selectedArchiveItem.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {selectedArchiveItem.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Parameters Table */}
                        <div className="flex-1 overflow-auto m-4">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2 w-16 text-center">Status</th>
                                        <th className="p-2">ID</th>
                                        <th className="p-2">Nominellt</th>
                                        <th className="p-2">Uppmätt</th>
                                        <th className="p-2">Tolerans</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {selectedArchiveItem.parameters?.map(p => (
                                        <tr key={p.id} className={p.status === 'OK' ? '' : 'bg-red-900/20'}>
                                            <td className="p-2 text-center">
                                                {p.status === 'OK' ? (
                                                    <CheckCircle size={14} className="text-emerald-400 mx-auto" />
                                                ) : (
                                                    <AlertCircle size={14} className="text-red-400 mx-auto" />
                                                )}
                                            </td>
                                            <td className="p-2 font-mono text-slate-500">{p.id}</td>
                                            <td className="p-2 text-slate-300">{p.nominal}</td>
                                            <td className={`p-2 font-bold font-mono ${p.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {p.measured}
                                            </td>
                                            <td className="p-2 text-slate-500">{p.lower} / {p.upper}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t border-slate-700">
                            <button
                                onClick={() => setIsArchiveDetailOpen(false)}
                                className="px-4 py-2 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300"
                            >
                                Stäng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Drawing Modal */}
            {isPdfModalOpen && currentPdfUrl && (
                <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <div>
                                <h3 className="font-bold text-slate-100 flex items-center gap-2">
                                    <FileImage size={16} className="text-blue-500" /> Ritning
                                </h3>
                                <div className="text-xs text-slate-400 mt-1 font-mono">{currentPdfUrl}</div>
                            </div>
                            <button onClick={() => setIsPdfModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>

                        {/* Simulated PDF Viewer */}
                        <div className="flex-1 flex items-center justify-center bg-slate-950 p-8 overflow-auto">
                            <div className="bg-white rounded shadow-2xl w-full max-w-2xl aspect-[1/1.414] flex flex-col items-center justify-center p-8 relative">
                                {/* Simulated drawing content */}
                                <div className="absolute top-4 right-4 text-[10px] font-mono text-slate-500">
                                    {header.drawingNumber}
                                </div>
                                <div className="border-2 border-slate-300 w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                                    <div className="text-lg font-bold text-slate-800">{header.articleNumber}</div>
                                    <div className="text-sm text-slate-600">{header.drawingNumber}</div>

                                    {/* Simulated drawing - dimensions */}
                                    <div className="flex-1 flex items-center justify-center w-full">
                                        <div className="relative">
                                            <div className="w-64 h-32 bg-slate-200 rounded-lg border-2 border-slate-400 flex items-center justify-center">
                                                <div className="text-xl font-bold text-slate-600">⬡</div>
                                            </div>
                                            {/* Dimension lines */}
                                            <div className="absolute -top-6 left-0 right-0 flex justify-center text-xs text-red-600 font-mono">
                                                ← M1: Ø50±0.1 →
                                            </div>
                                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-xs text-red-600 font-mono rotate-90">
                                                M2: 100±0.2
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title block */}
                                    <div className="w-full border-t-2 border-slate-400 pt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                                        <div>
                                            <span className="block text-slate-400">Ritad av</span>
                                            Konstruktion
                                        </div>
                                        <div>
                                            <span className="block text-slate-400">Datum</span>
                                            {new Date().toLocaleDateString('sv-SE')}
                                        </div>
                                        <div>
                                            <span className="block text-slate-400">Skala</span>
                                            1:1
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center gap-2 p-4 border-t border-slate-700">
                            <div className="text-xs text-slate-500">
                                📁 Sökväg: <span className="font-mono text-slate-400">{currentPdfUrl}</span>
                            </div>
                            <button
                                onClick={() => setIsPdfModalOpen(false)}
                                className="px-4 py-2 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-300"
                            >
                                Stäng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ControlMeasurement;
