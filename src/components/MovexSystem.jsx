import React, { useState } from 'react';
import { Server, Plus, Save, Trash2, Factory } from 'lucide-react';

const MovexSystem = ({ items, onUpdateItems, onSync }) => {
    const [newItem, setNewItem] = useState({
        partNumber: '',
        description: '',
        drawingNumber: '',
        supplier: '',
        purchasePrice: ''
    });

    const handleAdd = () => {
        if (!newItem.partNumber) return;
        const item = {
            id: Date.now().toString(),
            ...newItem,
        };
        onUpdateItems([...items, item]);
        setNewItem({ partNumber: '', description: '', drawingNumber: '', supplier: '', purchasePrice: '' });
    };

    const handleDelete = (id) => {
        onUpdateItems(items.filter(i => i.id !== id));
    };

    const handleEdit = (id, field, value) => {
        onUpdateItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                    <Factory className="text-blue-500" />
                    <h2 className="text-xl font-bold text-slate-100">Movex ERP</h2>
                </div>
                <p className="text-xs text-slate-400">Production System (English)</p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* New Item Form */}
                <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase">Create New Part</h3>
                    <div className="space-y-2">
                        <input
                            placeholder="Part Number"
                            value={newItem.partNumber}
                            onChange={e => setNewItem({ ...newItem, partNumber: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                        <input
                            placeholder="Description"
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                placeholder="Drawing No"
                                value={newItem.drawingNumber}
                                onChange={e => setNewItem({ ...newItem, drawingNumber: e.target.value })}
                                className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                            />
                            <input
                                placeholder="Purchase Price"
                                type="number"
                                value={newItem.purchasePrice}
                                onChange={e => setNewItem({ ...newItem, purchasePrice: e.target.value })}
                                className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                            />
                        </div>
                        <input
                            placeholder="Supplier"
                            value={newItem.supplier}
                            onChange={e => setNewItem({ ...newItem, supplier: e.target.value })}
                            className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                        />
                        <button
                            onClick={handleAdd}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-1.5 rounded flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add Part
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
                                <div className="text-xs text-blue-500 font-mono">{item.partNumber}</div>
                                <input
                                    value={item.description}
                                    onChange={e => handleEdit(item.id, 'description', e.target.value)}
                                    className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-slate-500 focus:border-blue-500 outline-none text-slate-200"
                                />
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                                    <div>
                                        <span className="block text-[10px] text-slate-500">Drawing</span>
                                        <input
                                            value={item.drawingNumber}
                                            onChange={e => handleEdit(item.id, 'drawingNumber', e.target.value)}
                                            className="bg-transparent w-full outline-none hover:text-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-500">Price</span>
                                        <input
                                            value={item.purchasePrice}
                                            onChange={e => handleEdit(item.id, 'purchasePrice', e.target.value)}
                                            className="bg-transparent w-full outline-none hover:text-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[10px] text-slate-500">Supplier</span>
                                    <input
                                        value={item.supplier}
                                        onChange={e => handleEdit(item.id, 'supplier', e.target.value)}
                                        className="bg-transparent w-full text-xs outline-none hover:text-slate-300"
                                    />
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
                    <Save size={16} /> Generate XML -> Vault
                </button>
            </div>
        </div>
    );
};

export default MovexSystem;
