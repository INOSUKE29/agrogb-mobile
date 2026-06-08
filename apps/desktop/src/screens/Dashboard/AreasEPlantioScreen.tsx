import React, { useState } from 'react';
import { Map, Leaf, Sprout } from 'lucide-react';
import TalhoesScreen from './TalhoesScreen';
import CulturasScreen from './CulturasScreen';
import PlantioScreen from './PlantioScreen';

export default function AreasEPlantioScreen() {
    const [activeTab, setActiveTab] = useState<'TALHOES' | 'CULTURAS' | 'PLANTIO'>('TALHOES');

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6">
            
            {/* TABS NAVIGATION */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0 mx-auto w-full max-w-3xl mt-4">
                <button
                    onClick={() => setActiveTab('TALHOES')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                        activeTab === 'TALHOES'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Map className="w-4 h-4" /> Talhões e Áreas
                </button>
                <button
                    onClick={() => setActiveTab('CULTURAS')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                        activeTab === 'CULTURAS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Leaf className="w-4 h-4" /> Culturas (Safras)
                </button>
                <button
                    onClick={() => setActiveTab('PLANTIO')}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm ${
                        activeTab === 'PLANTIO'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Sprout className="w-4 h-4" /> Ciclo de Plantio
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-auto custom-scrollbar relative px-1">
                {activeTab === 'TALHOES' && <TalhoesScreen />}
                {activeTab === 'CULTURAS' && <CulturasScreen />}
                {activeTab === 'PLANTIO' && <PlantioScreen />}
            </div>

        </div>
    );
}
