import React, { useState, useEffect } from 'react';
import { Monitor, Server, Database, Folder, ArrowRight, CheckCircle, Clock, Wifi, HardDrive } from 'lucide-react';

const NetworkSimulation = ({ onSendMeasurementOrder, onReceiveResults }) => {
    const [packets, setPackets] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);

    // Network nodes configuration
    const nodes = {
        cadPlm: {
            id: 'cadPlm',
            name: 'CAD/PLM Dator',
            ip: '192.168.1.10',
            x: 80,
            y: 120,
            software: ['Autodesk Inventor 2024', 'Vault Professional Server', 'SQL Server Express'],
            color: 'amber',
            icon: Monitor
        },
        fileServer: {
            id: 'fileServer',
            name: 'Filserver',
            ip: '192.168.1.5',
            x: 400,
            y: 300,
            software: ['Windows Server 2022', 'SMB File Share', '\\\\SERVER\\XMLExchange'],
            color: 'blue',
            icon: Folder
        },
        matstation: {
            id: 'matstation',
            name: 'Mätstation',
            ip: '192.168.1.20',
            x: 720,
            y: 120,
            software: ['Kontrollmätning App', 'FileSystemWatcher', 'SQLite Lokal DB'],
            color: 'emerald',
            icon: Server
        },
        erp: {
            id: 'erp',
            name: 'ERP Server',
            ip: '192.168.1.30',
            x: 400,
            y: 480,
            software: ['Movex/M3 ERP', 'IBM DB2 Database', 'REST API Gateway'],
            color: 'purple',
            icon: Database
        }
    };

    // Add log entry
    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString('sv-SE');
        setLogs(prev => [{
            id: Date.now(),
            timestamp,
            message,
            type
        }, ...prev].slice(0, 20));
    };

    // Animate packet from source to target
    const sendPacket = (from, to, label, onComplete) => {
        const packet = {
            id: Date.now(),
            from: nodes[from],
            to: nodes[to],
            label,
            progress: 0
        };

        setPackets(prev => [...prev, packet]);

        // Animate packet
        let progress = 0;
        const interval = setInterval(() => {
            progress += 3;
            setPackets(prev => prev.map(p =>
                p.id === packet.id ? { ...p, progress: Math.min(progress, 100) } : p
            ));

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setPackets(prev => prev.filter(p => p.id !== packet.id));
                    if (onComplete) onComplete();
                }, 200);
            }
        }, 30);
    };

    // Simulate sending measurement order
    const simulateMeasurementOrder = () => {
        addLog('Vault: Skapar mätorder XML...', 'send');

        setTimeout(() => {
            sendPacket('cadPlm', 'fileServer', 'MätorderXML', () => {
                addLog('Fil sparad: \\\\SERVER\\XMLExchange\\mätorder_001.xml', 'success');

                setTimeout(() => {
                    addLog('FileSystemWatcher: Ny fil detekterad!', 'receive');
                    sendPacket('fileServer', 'matstation', 'Filnotis', () => {
                        addLog('Mätstation: Läser in mätorder...', 'info');
                        addLog('Mätstation: Order mottagen - väntar på mätning', 'success');
                    });
                }, 500);
            });
        }, 300);
    };

    // Simulate returning results
    const simulateReturnResults = () => {
        addLog('Mätstation: Genererar resultat XML...', 'send');

        setTimeout(() => {
            sendPacket('matstation', 'fileServer', 'ResultatXML', () => {
                addLog('Fil sparad: \\\\SERVER\\XMLExchange\\resultat_001.xml', 'success');

                setTimeout(() => {
                    addLog('Vault FileWatcher: Resultat detekterat!', 'receive');
                    sendPacket('fileServer', 'cadPlm', 'Resultat', () => {
                        addLog('Vault: Importerar mätresultat till artikel...', 'info');
                        addLog('Vault: Mätkortet uppdaterat ✓', 'success');
                    });
                }, 500);
            });
        }, 300);
    };

    // Simulate ERP sync
    const simulateErpSync = () => {
        addLog('Vault: Exporterar artikeldata till ERP...', 'send');

        setTimeout(() => {
            sendPacket('cadPlm', 'fileServer', 'ArtikelXML', () => {
                addLog('XML sparad för ERP-import', 'success');

                setTimeout(() => {
                    sendPacket('fileServer', 'erp', 'Import', () => {
                        addLog('Movex: Läser artikeldata...', 'receive');
                        addLog('Movex: Artikel synkroniserad ✓', 'success');
                    });
                }, 300);
            });
        }, 300);
    };

    // Calculate packet position
    const getPacketPosition = (packet) => {
        const fromX = packet.from.x + 60;
        const fromY = packet.from.y + 40;
        const toX = packet.to.x + 60;
        const toY = packet.to.y + 40;

        const x = fromX + (toX - fromX) * (packet.progress / 100);
        const y = fromY + (toY - fromY) * (packet.progress / 100);

        return { x, y };
    };

    // Get color classes
    const getColorClasses = (color) => ({
        amber: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500', glow: 'shadow-amber-500/50' },
        blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', glow: 'shadow-blue-500/50' },
        emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500', glow: 'shadow-emerald-500/50' },
        purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', glow: 'shadow-purple-500/50' }
    }[color]);

    return (
        <div className="flex h-full bg-slate-950">
            {/* Network Visualization */}
            <div className="flex-1 relative overflow-hidden">
                {/* Header */}
                <div className="absolute top-4 left-4 z-10">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Wifi className="text-blue-400" /> Nätverksarkitektur
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Lokalt nätverk - 192.168.1.0/24</p>
                </div>

                {/* Control Buttons */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={simulateMeasurementOrder}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium flex items-center gap-2"
                    >
                        <ArrowRight size={14} /> Skicka Mätorder
                    </button>
                    <button
                        onClick={simulateReturnResults}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-2"
                    >
                        <ArrowRight size={14} /> Returnera Resultat
                    </button>
                    <button
                        onClick={simulateErpSync}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium flex items-center gap-2"
                    >
                        <ArrowRight size={14} /> Synka ERP
                    </button>
                </div>

                {/* Network Lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* CAD/PLM to FileServer */}
                    <line x1={140} y1={160} x2={400} y2={340} stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
                    {/* FileServer to Mätstation */}
                    <line x1={460} y1={340} x2={720} y2={160} stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
                    {/* FileServer to ERP */}
                    <line x1={430} y1={380} x2={430} y2={480} stroke="#334155" strokeWidth="2" strokeDasharray="5,5" />
                </svg>

                {/* Network Nodes */}
                {Object.values(nodes).map(node => {
                    const colors = getColorClasses(node.color);
                    const Icon = node.icon;
                    return (
                        <div
                            key={node.id}
                            onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                            className={`absolute cursor-pointer transition-all duration-200 ${selectedNode?.id === node.id ? 'scale-105' : 'hover:scale-102'}`}
                            style={{ left: node.x, top: node.y }}
                        >
                            <div className={`w-32 bg-slate-800 rounded-lg border-2 ${colors.border} ${selectedNode?.id === node.id ? `shadow-lg ${colors.glow}` : ''}`}>
                                {/* Header */}
                                <div className={`${colors.bg} rounded-t-md px-3 py-2 flex items-center gap-2`}>
                                    <Icon size={14} className="text-white" />
                                    <span className="text-[10px] font-bold text-white truncate">{node.name}</span>
                                </div>

                                {/* IP */}
                                <div className="px-3 py-2 border-b border-slate-700">
                                    <div className="font-mono text-xs text-slate-300">{node.ip}</div>
                                </div>

                                {/* Status */}
                                <div className="px-3 py-2 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[10px] text-slate-500">Online</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Animated Packets */}
                {packets.map(packet => {
                    const pos = getPacketPosition(packet);
                    return (
                        <div
                            key={packet.id}
                            className="absolute z-20 pointer-events-none"
                            style={{
                                left: pos.x - 30,
                                top: pos.y - 15,
                                transition: 'none'
                            }}
                        >
                            <div className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-mono shadow-lg shadow-blue-500/50 flex items-center gap-1">
                                <HardDrive size={10} />
                                {packet.label}
                            </div>
                        </div>
                    );
                })}

                {/* Selected Node Details */}
                {selectedNode && (
                    <div className="absolute bottom-4 left-4 bg-slate-800 rounded-lg border border-slate-700 p-4 w-80">
                        <h3 className={`font-bold ${getColorClasses(selectedNode.color).text} mb-2 flex items-center gap-2`}>
                            <selectedNode.icon size={16} />
                            {selectedNode.name}
                        </h3>
                        <div className="text-xs text-slate-400 mb-3">
                            IP: <span className="font-mono text-slate-300">{selectedNode.ip}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase mb-2">Installerad Programvara:</div>
                        <ul className="space-y-1">
                            {selectedNode.software.map((sw, i) => (
                                <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                                    <CheckCircle size={10} className="text-emerald-500" />
                                    {sw}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Communication Log */}
            <div className="w-80 border-l border-slate-700 bg-slate-900 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                    <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                        <Clock size={16} className="text-blue-400" />
                        Kommunikationslogg
                    </h3>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-1">
                    {logs.length === 0 ? (
                        <div className="text-center text-slate-600 text-xs py-8">
                            Klicka på en knapp för att simulera kommunikation
                        </div>
                    ) : (
                        logs.map(log => (
                            <div
                                key={log.id}
                                className={`text-xs p-2 rounded border-l-2 ${log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' :
                                        log.type === 'send' ? 'bg-amber-500/10 border-amber-500 text-amber-300' :
                                            log.type === 'receive' ? 'bg-blue-500/10 border-blue-500 text-blue-300' :
                                                'bg-slate-800 border-slate-600 text-slate-400'
                                    }`}
                            >
                                <span className="text-slate-500 font-mono mr-2">{log.timestamp}</span>
                                {log.message}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NetworkSimulation;
