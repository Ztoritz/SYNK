import React, { useState } from 'react';
import { Save, CheckCircle, AlertCircle, FileSpreadsheet, Ruler, Inbox, ArrowRight, UserCheck, X, FileText, FileImage, Plus, LogOut } from 'lucide-react';
import MeasurementReportCard from './MeasurementReportCard';

const ControlMeasurement = ({ onXmlGenerated, incomingRequests = [], archivedRequests = [], onSelectRequest }) => {
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'archive'
    const [currentRequestId, setCurrentRequestId] = useState(null);
    const [isArchiveDetailOpen, setIsArchiveDetailOpen] = useState(false);
    const [selectedArchiveItem, setSelectedArchiveItem] = useState(null);
    const [currentPdfUrl, setCurrentPdfUrl] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    const [operatorName, setOperatorName] = useState('');
    const [isOperatorRegistered, setIsOperatorRegistered] = useState(false);
    const [tempOperatorName, setTempOperatorName] = useState('');
    const [newOperatorInput, setNewOperatorInput] = useState('');

    // Initialize operator list from localStorage or defaults
    const [operatorList, setOperatorList] = useState(() => {
        const saved = localStorage.getItem('simAkers_operators');
        return saved ? JSON.parse(saved) : ['Niklas Jalvemyr', 'Dan Notesjö', 'Olle Ljungberg'];
    });

    // Update localStorage when list changes
    const handleAddOperator = () => {
        if (!newOperatorInput.trim()) return;
        if (operatorList.includes(newOperatorInput.trim())) {
            alert("Operatör finns redan i listan!");
            return;
        }
        const newList = [...operatorList, newOperatorInput.trim()].sort();
        setOperatorList(newList);
        localStorage.setItem('simAkers_operators', JSON.stringify(newList));
        setNewOperatorInput('');
    };

    const handleRegisterOperator = () => {
        if (!tempOperatorName) return;
        setOperatorName(tempOperatorName);
        setIsOperatorRegistered(true);
    };

    const handleLogoutOperator = () => {
        setOperatorName('');
        setIsOperatorRegistered(false);
        setTempOperatorName('');
    };

    const [header, setHeader] = useState({
        articleNumber: '',
        drawingNumber: ''
    });

    const [activeDefinitions, setActiveDefinitions] = useState(null); // If null, defined by user

    const [measurements, setMeasurements] = useState(
        Array.from({ length: 10 }, (_, i) => ({
            id: `M${i + 1}`,
            nominal: '',
            measured: '',
            upperTol: '0,0',
            lowerTol: '0,0',
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

        // Sanitize inputs: remove spaces, replace commas with dots
        const sanitize = (val) => String(val).replace(/\s/g, '').replace(/,/g, '.');

        const nom = parseFloat(sanitize(m.nominal));
        const val = parseFloat(sanitize(m.measured));

        // Ensure robust tolerance handling: 
        // Upper is always +Abs(val), Lower is always -Abs(val)
        const upper = Math.abs(parseFloat(sanitize(m.upperTol)));
        const lower = -Math.abs(parseFloat(sanitize(m.lowerTol)));

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
        if (!isOperatorRegistered) {
            alert("Operatör saknas! Vänligen registrera dig i menyn till vänster.");
            return;
        }

        const timestamp = new Date().toISOString();
        let xml = `<MeasurementReport timestamp="${timestamp}">
  <RequestId>${currentRequestId || ''}</RequestId>
  <ArticleNumber>${header.articleNumber || 'UNKNOWN'}</ArticleNumber>
  <DrawingNumber>${header.drawingNumber || 'UNKNOWN'}</DrawingNumber>
  <Controller>${operatorName}</Controller>
  <Results>
`;

        measurements.forEach(m => {
            if (m.isActive !== false && m.nominal !== '') {
                const status = checkStatus(m);
                xml += `    <Parameter id="${m.id}" type="${m.isDiameter ? 'DIA' : 'LIN'}" method="${m.gdtType || 'NONE'}">
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
        setMeasurements(Array.from({ length: 10 }, (_, i) => ({ id: `M${i + 1}`, isActive: false })));
        setHeader({ articleNumber: '', drawingNumber: '' });
        setCurrentRequestId(null);
    };

    const displayedRequests = (activeTab === 'inbox' ? incomingRequests : archivedRequests).filter(req => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return (
            (req.articleNumber && req.articleNumber.toLowerCase().includes(q)) ||
            (req.drawingNumber && req.drawingNumber.toLowerCase().includes(q)) ||
            (req.serialNumber && req.serialNumber.toLowerCase().includes(q)) ||
            (req.id && req.id.toLowerCase().includes(q))
        );
    });

    return (
        <>
            <div className="flex h-full max-w-7xl mx-auto w-full">
                {/* Incoming Requests Sidebar */}
                <div className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-4">
                            <Inbox size={18} className="text-blue-400" />
                            <h3 className="text-sm font-semibold text-slate-200">Mätordrar</h3>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-4">
                            <input
                                type="text"
                                placeholder="Sök ordrar, artikel, id..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-md py-1.5 pl-8 pr-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <div className="absolute left-2.5 top-2 text-slate-600">
                                <FileText size={12} />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-950 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={`flex-1 text-[10px] py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Inkorg <span className="bg-blue-600 text-white px-1.5 rounded-full text-[9px]">{incomingRequests.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('archive')}
                                className={`flex-1 text-[10px] py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'archive' ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                Arkiv <span className="bg-slate-600 text-slate-300 px-1.5 rounded-full text-[9px]">{archivedRequests.length}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {displayedRequests.length === 0 && (
                            <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center">
                                <Inbox className="mb-2 opacity-20" size={32} />
                                {activeTab === 'inbox' ? 'Inköorgen är tom' : 'Inget i arkivet'}
                            </div>
                        )}
                        {displayedRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => {
                                    if (activeTab === 'archive') {
                                        setSelectedArchiveItem(req);
                                        setIsArchiveDetailOpen(true);
                                    } else {
                                        handleSelectRequest(req);
                                    }
                                }}
                                className={`p-3 rounded border cursor-pointer group transition-all relative overflow-hidden
                                ${activeTab === 'inbox'
                                        ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/30'
                                        : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800'}`}
                            >
                                {/* Status Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${req.status === 'OK' ? 'bg-emerald-500' : (req.status === 'FAIL' ? 'bg-red-500' : 'bg-blue-500')}`}></div>

                                <div className="pl-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-mono font-bold ${activeTab === 'inbox' ? 'text-blue-200' : 'text-emerald-200'}`}>
                                            {req.serialNumber || req.articleNumber}
                                        </span>
                                    </div>

                                    <div className="text-[10px] text-slate-400 mb-2 truncate font-medium">
                                        {req.drawingNumber}
                                    </div>

                                    {/* Parameter & Time Info */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-2">
                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                                            <FileSpreadsheet size={10} />
                                            <span>{req.parameters?.length || req.definitions?.length || 0} mätpunkter</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-mono">
                                            {new Date(req.timestamp).toLocaleDateString('sv-SE')} <span className="text-slate-600">|</span> {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Operator Registration / Management Box (Fixed) */}
                    <div className="p-4 border-t border-slate-700 bg-slate-800/30">
                        {!isOperatorRegistered ? (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2">
                                    <UserCheck size={12} /> Logga in Operatör
                                </h4>

                                {/* Operator Select / Login */}
                                <div className="space-y-2">
                                    <select
                                        value={tempOperatorName}
                                        onChange={(e) => setTempOperatorName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Välj Operatör --</option>
                                        {operatorList.map((op, idx) => (
                                            <option key={idx} value={op}>{op}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleRegisterOperator}
                                        disabled={!tempOperatorName}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={12} /> Logga in
                                    </button>
                                </div>

                                {/* Add New Operator Toggle */}
                                <div className="pt-2 border-t border-slate-700/50">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newOperatorInput}
                                            onChange={(e) => setNewOperatorInput(e.target.value)}
                                            placeholder="Ny operatör..."
                                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            onClick={handleAddOperator}
                                            disabled={!newOperatorInput.trim()}
                                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-600/30 px-2 py-1 rounded text-xs transition-colors"
                                            title="Lägg till i listan"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-emerald-900/20 border border-emerald-500/20 rounded p-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/30">
                                        {operatorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Inloggad</div>
                                        <div className="text-xs text-slate-100 font-medium truncate max-w-[120px]" title={operatorName}>{operatorName}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogoutOperator}
                                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full p-1.5 transition-all"
                                    title="Logga ut"
                                >
                                    <LogOut size={14} />
                                </button>
                            </div>
                        )}
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
                                <button
                                    onClick={generateXml}
                                    disabled={!isOperatorRegistered}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg 
                                    ${isOperatorRegistered
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                    title={!isOperatorRegistered ? "Registrera operatör först" : "Spara mätning"}
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
                                        <th className="p-3 w-16 text-center">Typ</th>
                                        <th className="p-3">Metod</th>
                                        <th className="p-3">Nominell</th>
                                        <th className="p-3">Tolerans (+/-)</th>
                                        <th className="p-3 text-center text-emerald-500/80">Gränser</th>
                                        <th className="p-3 bg-slate-800/50 border-l border-slate-700/50">Uppmätt Värde</th>
                                        <th className="p-3 w-24 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {measurements.map((m, idx) => {
                                        if (m.isActive === false && activeDefinitions) return null; // Hide if not in definition

                                        // Klockren Method: Parsing Logic
                                        const parseSwedishFloat = (val) => {
                                            if (!val) return NaN;
                                            // 1. Remove all spaces
                                            // 2. Replace comma with dot
                                            const clean = String(val).replace(/\s/g, '').replace(/,/g, '.');
                                            return parseFloat(clean);
                                        };

                                        const nom = parseSwedishFloat(m.nominal);
                                        // Remove Math.abs to allow negative deviations (e.g. for ISO fits)
                                        // "Lower" column with value -0.1 implies: Nom - (-0.1) = Nom + 0.1 (common in deviations)
                                        const upper = parseSwedishFloat(m.upperTol) || 0;
                                        const lower = parseSwedishFloat(m.lowerTol) || 0;

                                        // Klockren V3 Fix: Limits Logic
                                        // Screenshot confirms UI inputs are magnitudes (+ [0,2] - [0,2]).
                                        // Min Limit should be Nominal - Lower Magnitude.
                                        // Max Limit should be Nominal + Upper Magnitude.
                                        const minLimit = nom - Math.abs(lower);
                                        const maxLimit = nom + Math.abs(upper);

                                        // Status Check based on calculated limits
                                        let status = 'neutral';
                                        const val = parseSwedishFloat(m.measured);

                                        if (!isNaN(val) && !isNaN(minLimit) && !isNaN(maxLimit)) {
                                            // Use epsilon for float precision
                                            status = (val >= minLimit - 0.000001 && val <= maxLimit + 0.000001) ? 'ok' : 'fail';
                                        }

                                        return (
                                            <tr key={m.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 text-center font-mono text-slate-500">{m.id}</td>

                                                {/* Type (Diameter or Linear) */}
                                                <td className="p-3 text-center font-bold text-slate-400">
                                                    {m.isDiameter ? 'Ø' : 'L'}
                                                </td>

                                                {/* Method / GDT */}
                                                <td className="p-3 text-center">
                                                    {(() => {
                                                        const GDT_INFO = {
                                                            'none': { s: '-', t: 'Ingen formtolerans' },
                                                            'position': { s: '⌖', t: 'Position\nKontrollerar avvikelse från teoretisk exakt position.' },
                                                            'flatness': { s: '⏥', t: 'Planhet\nKontrollerar ytan så den ligger mellan två parallella plan.' },
                                                            'perpendicularity': { s: '⟂', t: 'Vinkelräthet\nKontrollerar att ytan/axeln är 90° mot referens.' },
                                                            'parallelism': { s: '∥', t: 'Parallellitet\nKontrollerar att ytan/axeln är parallell med referens.' },
                                                            'concentricity': { s: '◎', t: 'Koncentricitet\nKontrollerar att centrumaxeln sammanfaller med referensaxel.' },
                                                            'cylindricity': { s: '⌭', t: 'Cylindricitet\nKontrollerar hur cylindrisk en yta är (både rundhet och rakhet).' },
                                                            'roundness': { s: '○', t: 'Rundhet\nKontrollerar cirkulär form (avvikelse från perfekt cirkel).' },
                                                            'straightness': { s: '⏤', t: 'Rakhet\nKontrollerar avvikelse från en rät linje.' },
                                                            'profile_surface': { s: '⌓', t: 'Ytprofil\nKontrollerar formen på en yta jämfört med nominell form.' },
                                                            'runout': { s: '↗', t: 'Kast (Runout)\nKontrollerar total variation vid ett varvs rotation.' }
                                                        };
                                                        const info = GDT_INFO[m.gdtType] || GDT_INFO['none'];
                                                        return (
                                                            <span className="text-2xl font-bold text-slate-200 cursor-help border-b border-dotted border-slate-600 pb-0.5 inline-block" title={info.t}>
                                                                {info.s}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>

                                                {/* Nominal */}
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={m.nominal}
                                                        onChange={(e) => handleUpdate(idx, 'nominal', e.target.value)}
                                                        className="w-full bg-transparent border-b border-slate-600 focus:border-indigo-500 outline-none py-1 font-mono text-indigo-100"
                                                        placeholder="0.00"
                                                    />
                                                </td>

                                                {/* Tolerances */}
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-slate-500 text-xs w-4 text-right">+</span>
                                                        <div className="relative w-16">
                                                            <input
                                                                type="text"
                                                                value={m.upperTol}
                                                                onChange={(e) => handleUpdate(idx, 'upperTol', e.target.value)}
                                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-l px-1 py-0.5 text-xs text-slate-300 text-center pr-4 focus:outline-none focus:border-amber-500"
                                                                readOnly={!!activeDefinitions}
                                                            />
                                                            {!activeDefinitions && (
                                                                <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-slate-700">
                                                                    <button
                                                                        className="h-1/2 px-1 hover:bg-slate-600 text-[10px] text-slate-400 flex items-center justify-center bg-slate-800 rounded-tr"
                                                                        onClick={() => {
                                                                            const val = parseFloat(String(m.upperTol).replace(',', '.')) || 0;
                                                                            handleUpdate(idx, 'upperTol', (val + 0.1).toFixed(1).replace('.', ','));
                                                                        }}
                                                                    >▲</button>
                                                                    <button
                                                                        className="h-1/2 px-1 hover:bg-slate-600 text-[10px] text-slate-400 flex items-center justify-center bg-slate-800 border-t border-slate-700 rounded-br"
                                                                        onClick={() => {
                                                                            const val = parseFloat(String(m.upperTol).replace(',', '.')) || 0;
                                                                            handleUpdate(idx, 'upperTol', (val - 0.1).toFixed(1).replace('.', ','));
                                                                        }}
                                                                    >▼</button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <span className="text-slate-500 text-xs w-4 text-right">-</span>
                                                        <div className="relative w-16">
                                                            <input
                                                                type="text"
                                                                value={m.lowerTol}
                                                                onChange={(e) => handleUpdate(idx, 'lowerTol', e.target.value)}
                                                                className="w-full bg-slate-900/50 border border-slate-700 rounded-l px-1 py-0.5 text-xs text-slate-300 text-center pr-4 focus:outline-none focus:border-amber-500"
                                                                readOnly={!!activeDefinitions}
                                                            />
                                                            {!activeDefinitions && (
                                                                <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l border-slate-700">
                                                                    <button
                                                                        className="h-1/2 px-1 hover:bg-slate-600 text-[10px] text-slate-400 flex items-center justify-center bg-slate-800 rounded-tr"
                                                                        onClick={() => {
                                                                            const val = parseFloat(String(m.lowerTol).replace(',', '.')) || 0;
                                                                            handleUpdate(idx, 'lowerTol', (val + 0.1).toFixed(1).replace('.', ','));
                                                                        }}
                                                                    >▲</button>
                                                                    <button
                                                                        className="h-1/2 px-1 hover:bg-slate-600 text-[10px] text-slate-400 flex items-center justify-center bg-slate-800 border-t border-slate-700 rounded-br"
                                                                        onClick={() => {
                                                                            const val = parseFloat(String(m.lowerTol).replace(',', '.')) || 0;
                                                                            handleUpdate(idx, 'lowerTol', (val - 0.1).toFixed(1).replace('.', ','));
                                                                        }}
                                                                    >▼</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Calculated Limits (Visual Feedback) */}
                                                <td className="p-3 text-center">
                                                    {!isNaN(minLimit) && !isNaN(maxLimit) ? (
                                                        <span className="text-xs font-mono text-emerald-400/80 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30">
                                                            {minLimit.toFixed(2)} - {maxLimit.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-600">-</span>
                                                    )}
                                                </td>

                                                {/* Measured (Highlighted) */}
                                                <td className="p-3 border-l border-slate-700/50 bg-slate-800/10">
                                                    <input
                                                        type="text"
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

            {/* Report Card Modal (Updated) */}
            {isArchiveDetailOpen && selectedArchiveItem && (
                <MeasurementReportCard
                    data={selectedArchiveItem}
                    onClose={() => setIsArchiveDetailOpen(false)}
                />
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
