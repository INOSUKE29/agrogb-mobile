import React, { useState, useEffect } from 'react';
import { Microscope, TestTube, Leaf, Droplet, Layers, FileText, Plus, Download, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { AgronomistService } from '../../../../../packages/services/src/agronomistService';

// Define the types
type AnalysisType = 'Solo' | 'Foliar' | 'Água' | 'Substrato';

interface AnalysisItem {
  id: string;
  type: AnalysisType;
  date: string;
  field: string;
  status: 'Concluído' | 'Em Análise' | 'Pendente';
  metrics: Record<string, string>;
}
export const AnalisesScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalysisType>('Solo');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalysisItem[]>([]);
  const [allData, setAllData] = useState<AnalysisItem[]>([]);

  useEffect(() => {
    async function fetchAnalises() {
      setLoading(true);
      try {
        const svc = new AgronomistService(supabase);
        const analises = await svc.getAnalisesLaboratoriais();
        
        const mappedData: AnalysisItem[] = analises.map(a => {
          // Normalize type to match AnalysisType
          let tipo: AnalysisType = 'Solo';
          if (a.tipo === 'foliar') tipo = 'Foliar';
          if (a.tipo === 'agua') tipo = 'Água';
          if (a.tipo === 'substrato') tipo = 'Substrato';

          let status: AnalysisItem['status'] = 'Em Análise';
          if (a.data_resultado) status = 'Concluído';

          return {
            id: a.id.substring(0, 8).toUpperCase(), // short ID
            type: tipo,
            date: new Date(a.data_coleta || a.created_at).toLocaleDateString('pt-BR'),
            field: a.cliente?.nome_completo ? `Cliente: ${a.cliente.nome_completo}` : 'Talhão Não Especificado',
            status,
            metrics: a.resultados || {}
          };
        });

        setAllData(mappedData);
      } catch (e) {
        console.error('Error fetching analises', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalises();
  }, []);

  useEffect(() => {
    setData(allData.filter(item => item.type === activeTab));
  }, [activeTab, allData]);

  const tabs: { label: AnalysisType; icon: React.ReactNode }[] = [
    { label: 'Solo', icon: <Layers size={18} /> },
    { label: 'Foliar', icon: <Leaf size={18} /> },
    { label: 'Água', icon: <Droplet size={18} /> },
    { label: 'Substrato', icon: <TestTube size={18} /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Em Análise': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a192f] text-gray-200 p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 shadow-inner">
            <Microscope className="text-green-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Central de Análises</h1>
            <p className="text-sm text-gray-400 mt-1">Gerencie resultados de solo, tecido, água e substratos</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-green-900/20 hover:shadow-green-500/30">
          <Plus size={18} strokeWidth={2.5} />
          Nova Análise
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-white/5 pb-3">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              activeTab === tab.label
                ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="animate-spin text-green-500 mb-4" size={40} />
            <p className="font-medium text-gray-300">Carregando análises...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-72 text-gray-400 bg-[#112240] rounded-2xl border border-white/5 border-dashed">
            <div className="p-4 bg-white/5 rounded-full mb-4">
              {tabs.find(t => t.label === activeTab)?.icon}
            </div>
            <p className="text-lg font-medium text-gray-300">Nenhuma análise encontrada</p>
            <p className="text-sm mt-1 text-gray-500">Não há registros de análises de {activeTab.toLowerCase()} no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.map(item => (
              <div 
                key={item.id} 
                className="premium-card bg-[#112240] rounded-2xl border border-white/5 p-6 hover:border-green-500/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/10"
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <span className="text-xs font-mono text-green-400/90 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                      {item.id}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-3 group-hover:text-green-400 transition-colors">{item.field}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.date}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
                  {Object.entries(item.metrics).map(([key, value]) => (
                    <div key={key} className="bg-[#0a192f] p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
                      <p className="text-xs text-gray-500 font-medium mb-1">{key}</p>
                      <p className="text-sm font-semibold text-gray-200">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-5 border-t border-white/5 flex gap-3">
                  <button 
                    disabled={item.status !== 'Concluído'}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      item.status === 'Concluído' 
                      ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20' 
                      : 'bg-white/5 text-gray-600 border-transparent cursor-not-allowed'
                    }`}
                  >
                    <FileText size={16} />
                    Ver Laudo
                  </button>
                  <button 
                    disabled={item.status !== 'Concluído'}
                    className={`px-3 py-2.5 rounded-lg transition-colors border ${
                      item.status === 'Concluído'
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-white/20'
                      : 'bg-white/5 text-gray-600 border-transparent cursor-not-allowed'
                    }`}
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalisesScreen;
