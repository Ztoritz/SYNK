import React, { useState, useEffect, useRef } from 'react';
import VaultSystem from './components/VaultSystem';
import MovexSystem from './components/MovexSystem';
import { ArrowRightLeft, Activity, Code, LayoutDashboard, Ruler, RotateCcw, Wifi } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import ControlMeasurement from './components/ControlMeasurement';
import NetworkSimulation from './components/NetworkSimulation';
import io from 'socket.io-client';

function App() {
    const [currentView, setCurrentView] = useState('configurator'); // 'configurator' | 'measurement'

    // Server Configuration
    // Server Configuration
    const SERVER_DOMAIN = 'oso80gcwkkwgogocc8wsowco.109.205.176.58.sslip.io';
    const PROTOCOL = window.location.protocol;
    // For Socket.io, we typically use the same base URL
    const API_URL = import.meta.env.VITE_API_URL || `${PROTOCOL}//${SERVER_DOMAIN}`;
    // const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Socket State
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    // Track processed reports to prevent duplicates (not strictly needed with sockets but good safety)
    const processedReportIds = useRef(new Set());

    // State
    const [vaultItems, setVaultItems] = useState([
        { id: '1', artikelnummer: '20-100', beskrivning: 'Stålavalts', ritningsnummer: 'R-1001', leverantör: 'Svenskt Stål AB', inköpspris: '5000', pdfUrl: '\\\\SERVER\\Ritningar\\R-1001.pdf' }
    ]);

    const [movexItems, setMovexItems] = useState([
        { id: '2', partNumber: '99-500', description: 'Bearing Housing', drawingNumber: 'D-5050', supplier: 'Global Bearings Inc', purchasePrice: '120.50' }
    ]);

    const [xmlLog, setXmlLog] = useState(''); // We'll use this to log socket events now too
    const [measurementRequests, setMeasurementRequests] = useState([]);
    const [archivedRequests, setArchivedRequests] = useState([]);
    const [matkortFolder, setMatkortFolder] = useState([]);

    // Refs
    const requestsRef = useRef(measurementRequests);
    requestsRef.current = measurementRequests;
    const archivesRef = useRef(archivedRequests);
    archivesRef.current = archivedRequests;

    // Initialize Socket Connection
    useEffect(() => {
        const newSocket = io(API_URL);

        newSocket.on('connect', () => {
            console.log("Connected to Socket Server");
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log("Disconnected from Socket Server");
            setConnected(false);
        });

        // Initial State Sync
        newSocket.on('init_state', (data) => {
            console.log("Initial State:", data);
            setMeasurementRequests(data.activeOrders || []);
            setArchivedRequests(data.archivedOrders || []); // Sync Archive from Server!
        });

        // 1. Order Created (Broadcasted back to us, or from others)
        newSocket.on('order_created', (order) => {
            console.log("Order Created Event:", order);
            setMeasurementRequests(prev => {
                if (prev.find(o => o.id === order.id)) return prev;
                return [order, ...prev];
            });
        });

        // 2. Order Completed (From Mobile or SYNK)
        newSocket.on('order_completed', (completedOrder) => {
            console.log("Order Completed:", completedOrder);

            // Update Active Requests (Remove)
            setMeasurementRequests(prev => prev.filter(r => r.id !== completedOrder.id));

            // Update Archive (Add to top)
            setArchivedRequests(prev => {
                if (prev.some(o => o.id === completedOrder.id)) return prev;
                return [completedOrder, ...prev];
            });

            // Vault/Logic updates can still happen here if needed, 
            // but the SOURCE OF TRUTH is now the socket event.
            handleOrderCompletion(completedOrder);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Logic to handle a completed order (Archiving, Vault Update)
    // Logic to update Vault and Matkort (Side effects only)
    const handleOrderCompletion = (order) => {
        // 1. Update Vault Item
        if (order.articleNumber) {
            setVaultItems(prev => prev.map(item => {
                if (item.artikelnummer === order.articleNumber) {
                    const isAllOk = order.results.every(r => r.status === 'OK');

                    // Generate Serial
                    const existingCount = (item.measurementHistory || []).length;
                    const serialNumber = `M-${order.drawingNumber}-${(existingCount + 1).toString().padStart(3, '0')}`;

                    const resultObj = {
                        controller: order.controller,
                        timestamp: order.completedAt,
                        status: isAllOk ? 'OK' : 'FAIL',
                        parameters: order.results,
                        serialNumber: serialNumber
                    };

                    // Update Item History
                    return {
                        ...item,
                        lastResult: resultObj,
                        measurementHistory: [resultObj, ...(item.measurementHistory || [])]
                    };
                }
                return item;
            }));
        }

        // 2. Save to Matkort Folder (Inventory)
        const isAllOk = order.results.every(r => r.status === 'OK');
        const matkort = {
            id: order.id || Date.now().toString(),
            serialNumber: `M-${order.drawingNumber}-Socket`,
            articleNumber: order.articleNumber,
            drawingNumber: order.drawingNumber,
            controller: order.controller,
            timestamp: order.completedAt,
            status: isAllOk ? 'OK' : 'FAIL',
            parameters: order.results,
        };

        setMatkortFolder(prev => {
            if (prev.some(m => m.id === matkort.id)) return prev;
            return [matkort, ...prev];
        });
    };

    // Wrapper to append measurement logs and handle feedback loop
    const handleMeasurementXml = (xml, directRequestId = null) => {

        setXmlLog(xml);

        // Parse "MeasurementReport" to sync back to Vault
        if (xml.includes('<MeasurementReport')) {

            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, "text/xml");

            const article = doc.querySelector('ArticleNumber')?.textContent;
            const controller = doc.querySelector('Controller')?.textContent;
            const timestamp = doc.documentElement.getAttribute('timestamp');
            const requestId = directRequestId || doc.querySelector('RequestId')?.textContent?.trim();



            let generatedSerialNumber = null; // Hoisted variable

            // Archiving Logic
            console.log("Processing XML. Found RequestId:", requestId);

            if (requestId) {

                const currentRequests = requestsRef.current;
                const currentArchives = archivesRef.current;

                const reqIndex = currentRequests.findIndex(r => r.id === requestId);

                console.log("Matched Request Index:", reqIndex);

                // Parse measurement results first
                const results = Array.from(doc.querySelectorAll('Parameter')).map(p => ({
                    id: p.getAttribute('id'),
                    nominal: p.querySelector('Nominal')?.textContent,
                    measured: p.querySelector('Measured')?.textContent,
                    status: p.querySelector('Status')?.textContent,
                    upper: p.querySelector('Tolerance')?.getAttribute('upper'),
                    lower: p.querySelector('Tolerance')?.getAttribute('lower'),
                    // Capture new attributes
                    type: p.getAttribute('type'),
                    method: p.getAttribute('method')
                }));
                const isAllOk = results.every(r => r.status === 'OK');

                if (reqIndex !== -1) {
                    // SYNC MODE: If connected, let Server handle it (Single Source of Truth)
                    if (socket && connected) {
                        const payload = {
                            id: requestId,
                            results,
                            controller
                        };
                        socket.emit('submit_measurement', payload);
                        console.log("📡 Sent measurement to server:", payload);
                        // Local state will update via 'order_completed' event
                    } else {
                        // OFFLINE MODE: Legacy Local Logic
                        const req = currentRequests[reqIndex];

                        // Generate Final Card Serial Number: M-[Drawing]-[Seq]
                        const existingCount = currentArchives.filter(ar => ar.drawingNumber === req.drawingNumber).length;
                        const sequence = (existingCount + 1).toString().padStart(3, '0');
                        generatedSerialNumber = `M-${req.drawingNumber}-${sequence}`;

                        // Include measured values in archived request!
                        const archivedReq = {
                            ...req,
                            archivedAt: new Date().toISOString(),
                            status: isAllOk ? 'OK' : 'FAIL',
                            serialNumber: generatedSerialNumber,
                            controller,
                            timestamp,
                            parameters: results // Include all measurement results!
                        };

                        setMeasurementRequests(prev => prev.filter(r => r.id !== requestId));
                        setArchivedRequests(prev => [archivedReq, ...prev]);
                        console.log("Archived Final Card (Offline):", generatedSerialNumber);

                        // Save measurement card to Inventor Mätkort folder
                        const matkort = {
                            id: Date.now().toString(),
                            serialNumber: generatedSerialNumber,
                            articleNumber: article,
                            drawingNumber: req.drawingNumber,
                            controller,
                            timestamp,
                            archivedAt: new Date().toISOString(),
                            status: isAllOk ? 'OK' : 'FAIL',
                            parameters: results,
                            xml: xml
                        };
                        setMatkortFolder(prev => [matkort, ...prev]);
                    }
                }
            }

            if (article) {
                const results = Array.from(doc.querySelectorAll('Parameter')).map(p => ({
                    id: p.getAttribute('id'),
                    nominal: p.querySelector('Nominal')?.textContent,
                    measured: p.querySelector('Measured')?.textContent,
                    status: p.querySelector('Status')?.textContent,
                    upper: p.querySelector('Tolerance')?.getAttribute('upper'),
                    lower: p.querySelector('Tolerance')?.getAttribute('lower'),
                }));

                const isAllOk = results.every(r => r.status === 'OK');

                setVaultItems(prev => prev.map(item => {
                    if (item.artikelnummer === article) {
                        const resultObj = {
                            controller,
                            timestamp,
                            status: isAllOk ? 'OK' : 'FAIL',
                            parameters: results,
                            serialNumber: generatedSerialNumber
                        };

                        const history = item.measurementHistory || [];

                        return {
                            ...item,
                            lastResult: resultObj,
                            measurementHistory: [resultObj, ...history]
                        };
                    }
                    return item;
                }));
            }
        }
    };

    // Handle incoming measurement request from Vault
    const handleRequestMeasurement = (item, definitions = []) => {
        const timestamp = new Date().toISOString();
        const request = {
            id: Date.now().toString(),
            articleNumber: item.artikelnummer,
            drawingNumber: item.ritningsnummer,
            pdfUrl: item.pdfUrl,
            definitions, // Array of { id, nominal, ... }
            timestamp
        };

        // Emit Socket Event (Real-Time JSON)
        if (socket && connected) {
            socket.emit('create_order', request);

            // Also log the legacy XML view for the user
            const defXml = definitions.length > 0 ? `
  <Definitions>
${definitions.map(d => `    <Param ID="${d.id}" Nominal="${d.nominal}" TolUp="${d.upperTol}" TolLo="${d.lowerTol}" GD="${d.gdtType}" />`).join('\n')}
  </Definitions>` : '';

            const xml = `<MeasurementRequest timestamp="${timestamp}" id="${request.id}">
  <ArticleNumber>${item.artikelnummer}</ArticleNumber>
  <DrawingNumber>${item.ritningsnummer}</DrawingNumber>
  <PdfUrl>${item.pdfUrl || ''}</PdfUrl>
  <Status>REQUESTED</Status>${defXml}
</MeasurementRequest>`;
            setXmlLog(`Sending via Socket (JSON)...\nLegacy XML Log:\n${xml}`);
        } else {
            alert("Server connection lost. Cannot send order.");
        }
    };

    // Sync Logics
    const syncToMovex = () => {
        // Current Movex Items Map
        const movexMap = new Map(movexItems.map(i => [i.id, i]));

        // Map Vault (Swedish) -> Movex (English)
        const syncedItems = vaultItems.map(v => {
            return {
                id: v.id,
                partNumber: v.artikelnummer,
                description: v.beskrivning,
                drawingNumber: v.ritningsnummer,
                supplier: v.leverantör,
                purchasePrice: v.inköpspris
            };
        });

        const newMovexList = [...movexItems];
        syncedItems.forEach(newItem => {
            const index = newMovexList.findIndex(m => m.id === newItem.id);
            if (index >= 0) {
                newMovexList[index] = newItem;
            } else {
                newMovexList.push(newItem);
            }
        });

        setMovexItems(newMovexList);

        // Generate XML Log
        const xml = `<SyncBatch direction="VaultToERP" timestamp="${new Date().toISOString()}">
  ${syncedItems.map(item => `  <Item>
    <PartNumber>${item.partNumber}</PartNumber>
    <Description>${item.description}</Description>
    <DrawingNumber>${item.drawingNumber}</DrawingNumber>
    <Supplier>${item.supplier}</Supplier>
    <Price currency="SEK">${item.purchasePrice}</Price>
  </Item>`).join('\n')}
</SyncBatch>`;
        setXmlLog(xml);
    };

    const syncToVault = () => {
        // Map Movex (English) -> Vault (Swedish)
        const syncedItems = movexItems.map(m => {
            return {
                id: m.id,
                artikelnummer: m.partNumber,
                beskrivning: m.description,
                ritningsnummer: m.drawingNumber,
                leverantör: m.supplier,
                inköpspris: m.purchasePrice
            };
        });

        const newVaultList = [...vaultItems];
        syncedItems.forEach(newItem => {
            const index = newVaultList.findIndex(v => v.id === newItem.id);
            if (index >= 0) {
                newVaultList[index] = newItem;
            } else {
                newVaultList.push(newItem);
            }
        });

        setVaultItems(newVaultList);

        // Generate XML Log
        const xml = `<SyncBatch direction="ERPToVault" timestamp="${new Date().toISOString()}">
  ${syncedItems.map(item => `  <Artikel>
    <Artikelnummer>${item.artikelnummer}</Artikelnummer>
    <Beskrivning>${item.beskrivning}</Beskrivning>
    <Ritningsnummer>${item.ritningsnummer}</Ritningsnummer>
    <Leverantör>${item.leverantör}</Leverantör>
    <Pris>${item.inköpspris}</Pris>
  </Artikel>`).join('\n')}
</SyncBatch>`;
        setXmlLog(xml);
    };

    const handleReset = () => {
        if (confirm('Rensa all historik och återställ mätningar? (Artiklar och Konfiguration sparas)')) {
            // 1. Clear Local Vault History
            setVaultItems(prev => prev.map(item => {
                const { lastResult, measurementHistory, ...rest } = item;
                return rest;
            }));

            setXmlLog('System Reset Initiated...');

            // 2. Clear Server State (which will broadcast empty lists back to us)
            if (socket && connected) {
                socket.emit('reset_state');
            } else {
                // Fallback for offline mode
                setMeasurementRequests([]);
                setArchivedRequests([]);
            }
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="h-14 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-blue-600 flex items-center justify-center text-white font-bold">
                            <ArrowRightLeft size={18} />
                        </div>
                        <h1 className="font-semibold text-lg tracking-tight">Vault <span className="text-slate-500 mx-1">↔</span> Movex Integration</h1>
                    </div>

                    {/* Navigation Menu */}
                    <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setCurrentView('configurator')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${currentView === 'configurator' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <LayoutDashboard size={14} /> Konfigurator
                        </button>
                        <button
                            onClick={() => setCurrentView('measurement')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${currentView === 'measurement' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Ruler size={14} /> Kontrollmätning
                        </button>
                        <button
                            onClick={() => setCurrentView('network')}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${currentView === 'network' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Wifi size={14} /> Nätverk
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-medium"
                    >
                        <RotateCcw size={14} /> Nollställ
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs font-mono text-emerald-400 border border-slate-700">
                        <Activity size={12} /> Live Simulering
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            {currentView === 'configurator' ? (
                <div className="flex-1 flex overflow-hidden">
                    {/* Vault Side (Left) */}
                    <div className="w-1/3 min-w-[300px]">
                        <VaultSystem
                            items={vaultItems}
                            onUpdateItems={setVaultItems}
                            onSync={syncToMovex}
                            onRequestMeasurement={handleRequestMeasurement}
                            matkortFolder={matkortFolder}
                        />
                    </div>

                    {/* XML Viewer (Center) */}
                    <div className="w-1/3 border-r border-slate-700 bg-slate-950 flex flex-col">
                        <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code className="text-slate-500" />
                                <h3 className="font-semibold text-slate-300">XML Exchange Channel</h3>
                            </div>
                            {xmlLog && <span className="text-xs text-slate-500">Last Sync: {new Date().toLocaleTimeString()}</span>}
                        </div>
                        <div className="flex-1 p-4 overflow-auto font-mono text-xs">
                            {xmlLog ? (
                                <pre className="text-blue-300 whitespace-pre-wrap">{xmlLog}</pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                    <ArrowRightLeft className="mb-2 opacity-20" size={48} />
                                    <p>Waiting for synchronization...</p>
                                    <p className="text-[10px] opacity-70 mt-1">Initiate sync from either system</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Movex Side (Right) */}
                    <div className="w-1/3 min-w-[300px]">
                        <MovexSystem items={movexItems} onUpdateItems={setMovexItems} onSync={syncToVault} />
                    </div>
                </div>
            ) : currentView === 'measurement' ? (
                /* Measurement View */
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 flex">
                        <ControlMeasurement
                            onXmlGenerated={handleMeasurementXml}
                            incomingRequests={measurementRequests}
                            archivedRequests={archivedRequests}
                            onSelectRequest={(id) => {
                                // Optional: mark as read or remove from queue
                            }}
                        />

                        {/* Optional: Side XML view for measurement too */}
                        <div className="w-96 border-l border-slate-700 bg-slate-950 flex flex-col">
                            <div className="p-4 border-b border-slate-700 bg-slate-900/30">
                                <h3 className="font-semibold text-slate-300 flex items-center gap-2"><Code size={16} /> Sync Output</h3>
                            </div>
                            <div className="flex-1 p-4 overflow-auto font-mono text-xs bg-black/20">
                                {xmlLog ? <pre className="text-emerald-300 whitespace-pre-wrap">{xmlLog}</pre> : <span className="text-slate-600">No data generated yet.</span>}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Network View */
                <div className="flex-1 overflow-hidden">
                    <NetworkSimulation />
                </div>
            )}
        </div>
    );
}

export default App;
