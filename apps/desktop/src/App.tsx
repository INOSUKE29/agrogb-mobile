import { HashRouter, Routes, Route } from 'react-router-dom';
import LoginScreen from './screens/Auth/LoginScreen';
import DashboardLayout from './screens/Dashboard/DashboardLayout';
import OverviewScreen from './screens/Dashboard/OverviewScreen';
import HarvestScreen from './screens/Dashboard/HarvestScreen';
import FinancialScreen from './screens/Dashboard/FinancialScreen';
import UsersScreen from './screens/Dashboard/UsersScreen';
import AgroDashboard from './screens/Dashboard/AgroDashboard';
import ClienteDashboard from './screens/Dashboard/ClienteDashboard';
import TalhoesScreen from './screens/Dashboard/TalhoesScreen';
import PlantioScreen from './screens/Dashboard/PlantioScreen';
import AreasEPlantioScreen from './screens/Dashboard/AreasEPlantioScreen';
import CadernoAgricolaScreen from './screens/Dashboard/CadernoAgricolaScreen';
import RecomendacoesScreen from './screens/Dashboard/RecomendacoesScreen';
import ReceituarioAgronomicoScreen from './screens/Dashboard/ReceituarioAgronomicoScreen';
import MeusClientesScreen from './screens/Dashboard/MeusClientesScreen';
import SettingsScreen from './screens/Dashboard/SettingsScreen';
import VendasScreen from './screens/Dashboard/VendasScreen';
import CulturasScreen from './screens/Dashboard/CulturasScreen';
import MonitoramentoScreen from './screens/Dashboard/MonitoramentoScreen';
import EstoqueScreen from './screens/Dashboard/EstoqueScreen';
import FrotaScreen from './screens/Dashboard/FrotaScreen';
import TarefasScreen from './screens/Dashboard/TarefasScreen';
import CustosScreen from './screens/Dashboard/CustosScreen';
import CategoriasDespesaScreen from './screens/Dashboard/CategoriasDespesaScreen';
import CadastroBasicoScreen from './screens/Dashboard/CadastroBasicoScreen';
import AdminCatalogScreen from './screens/Dashboard/AdminCatalogScreen';
import ComprasScreen from './screens/Dashboard/ComprasScreen';
import CotacoesScreen from './screens/Dashboard/CotacoesScreen';
import FornecedoresScreen from './screens/Dashboard/FornecedoresScreen';
import EncomendasScreen from './screens/Dashboard/EncomendasScreen';
import ClimaScreen from './screens/Dashboard/ClimaScreen';
import RelatoriosScreen from './screens/Dashboard/RelatoriosScreen';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="text-foreground bg-background transition-colors duration-300" style={{ height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Toaster 
          position="top-right" 
          toastOptions={{
            className: 'glass text-white border border-[var(--color-border)]',
            style: {
              background: 'var(--color-background)',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }} 
        />
        <HashRouter>
          <ErrorBoundary>
          <Routes>
            {/* Rota de Login */}
            <Route path="/" element={<LoginScreen />} />
            
            {/* Rotas Autenticadas */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              {/* Redirecionamento Padrão */}
              <Route index element={<OverviewScreen />} />

              {/* PORTAL ADMIN */}
              <Route path="admin" element={<OverviewScreen />} />
              <Route path="admin/usuarios" element={<UsersScreen />} />
              <Route path="admin/planos" element={<div className="text-white p-8">Em breve: Gestão de Planos e Assinaturas (Admin)</div>} />
              <Route path="admin/financeiro" element={<FinancialScreen />} />
              <Route path="admin/biblioteca" element={<AdminCatalogScreen />} />

              {/* PORTAL AGRÔNOMO */}
              <Route path="agronomo" element={<AgroDashboard />} />
              <Route path="agronomo/clientes" element={<MeusClientesScreen />} />
              <Route path="agronomo/recomendacoes" element={<RecomendacoesScreen />} />
              <Route path="agronomo/visitas" element={<div className="text-white p-8">Em breve: Visitas Técnicas</div>} />

              {/* PORTAL CLIENTE (PRODUTOR) */}
              <Route path="cliente" element={<ClienteDashboard />} />
              <Route path="cliente/relatorios" element={<RelatoriosScreen />} />
              <Route path="cliente/areas" element={<AreasEPlantioScreen />} />
              <Route path="cliente/colheita" element={<HarvestScreen />} />
              <Route path="cliente/monitoramento" element={<MonitoramentoScreen />} />
              <Route path="cliente/caderno" element={<CadernoAgricolaScreen />} />
              <Route path="cliente/financeiro" element={<FinancialScreen />} />
              <Route path="cliente/vendas" element={<VendasScreen />} />
              <Route path="cliente/estoque" element={<EstoqueScreen />} />
              <Route path="cliente/frota" element={<FrotaScreen />} />
              <Route path="cliente/tarefas" element={<TarefasScreen />} />
              <Route path="cliente/custos" element={<CustosScreen />} />
              <Route path="cliente/categorias" element={<CategoriasDespesaScreen />} />
              <Route path="cliente/cadastro" element={<CadastroBasicoScreen />} />
              <Route path="cliente/fornecedores" element={<FornecedoresScreen />} />
              <Route path="cliente/cotacoes" element={<CotacoesScreen />} />
              <Route path="cliente/compras" element={<ComprasScreen />} />
              <Route path="cliente/encomendas" element={<EncomendasScreen />} />
              <Route path="cliente/clima" element={<ClimaScreen />} />
              <Route path="cliente/recomendacoes" element={<ReceituarioAgronomicoScreen />} />

              {/* Antigas Rotas de Fallback (para não quebrar a compilação) */}
              <Route path="colheita" element={<HarvestScreen />} />
              <Route path="financeiro" element={<FinancialScreen />} />
              <Route path="usuarios" element={<UsersScreen />} />
              <Route path="agenda" element={<TarefasScreen />} />
              <Route path="configuracoes" element={<SettingsScreen />} />
              <Route path="recomendacoes" element={<RecomendacoesScreen />} />
              
              {/* Fallback Not Found dentro do Dashboard */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center p-12 text-[var(--color-muted)] h-full">
                  <h2 className="text-3xl font-black text-white mb-2">404</h2>
                  <p>A tela que você tentou acessar não foi encontrada ou a rota está incorreta.</p>
                  <button onClick={() => window.history.back()} className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/20">
                    ⬅ Voltar para a tela anterior
                  </button>
                </div>
              } />
            </Route>

            {/* Global Fallback Not Found */}
            <Route path="*" element={
                <div className="flex flex-col items-center justify-center p-12 text-[var(--color-muted)] h-screen w-screen bg-[#0D1711]">
                  <h2 className="text-3xl font-black text-white mb-2">404 - Página Não Encontrada</h2>
                  <p>A rota acessada não existe na aplicação.</p>
                  <button onClick={() => window.history.back()} className="mt-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl transition-all shadow-lg">
                    ⬅ Voltar para a tela anterior
                  </button>
                </div>
            } />
          </Routes>
          </ErrorBoundary>
        </HashRouter>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
