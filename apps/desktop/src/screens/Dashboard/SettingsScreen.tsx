import React, { useState } from 'react';
import { User, Shield, Monitor, Key, Bell, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeProvider';

export default function SettingsScreen() {
    const [activeTab, setActiveTab] = useState<'conta' | 'seguranca' | 'sistema'>('conta');
    const { theme, setTheme } = useTheme();

    const handleSave = () => {
        toast.success('Configurações salvas com sucesso!');
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-12">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-500" />
                        Configurações
                    </h1>
                    <p className="text-gray-600 dark:text-[var(--color-muted)] font-medium mt-1">
                        Gerencie sua conta, preferências de sistema e segurança.
                    </p>
                </div>
                
                <Button onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
                    Salvar Alterações
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                
                {/* MENU LATERAL DE CONFIG */}
                <aside className="w-full md:w-64 flex flex-col gap-2 flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('conta')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'conta' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-600 dark:text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:text-white border border-transparent'}`}
                    >
                        <User className="w-5 h-5" /> Minha Conta
                    </button>
                    <button 
                        onClick={() => setActiveTab('seguranca')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'seguranca' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-600 dark:text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:text-white border border-transparent'}`}
                    >
                        <Shield className="w-5 h-5" /> Segurança
                    </button>
                    <button 
                        onClick={() => setActiveTab('sistema')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'sistema' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-gray-600 dark:text-[var(--color-muted)] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:text-white border border-transparent'}`}
                    >
                        <Monitor className="w-5 h-5" /> Sistema
                    </button>
                </aside>

                {/* ÁREA DE CONTEÚDO DA ABA */}
                <Card className="flex-1 p-6 md:p-8 relative">
                    
                    {/* Efeito luminoso de fundo */}
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 opacity-5 rounded-full blur-[80px] pointer-events-none" />

                    {activeTab === 'conta' && (
                        <div className="flex flex-col gap-6 animate-fade-in relative z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Perfil de Usuário</h2>
                            
                            <div className="flex items-center gap-6 mb-4">
                                <Avatar fallback="B" size="lg" className="w-24 h-24 text-3xl border-4 border-white dark:border-[#111111] shadow-xl" />
                                <Button variant="secondary" size="sm">Alterar Foto</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nome Completo" placeholder="Ex: Bruno Gomes" defaultValue="Bruno Gomes" />
                                <Input label="E-mail" type="email" placeholder="bruno@agrogb.com" defaultValue="bruno@agrogb.com" />
                                <Input label="Telefone" placeholder="(00) 00000-0000" />
                                <Input label="Cargo/Função" placeholder="Ex: Administrador" defaultValue="Administrador" disabled />
                            </div>
                        </div>
                    )}

                    {activeTab === 'seguranca' && (
                        <div className="flex flex-col gap-6 animate-fade-in relative z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Segurança da Conta</h2>
                            
                            <div className="grid grid-cols-1 gap-6 max-w-md">
                                <Input label="Senha Atual" type="password" placeholder="••••••••" leftIcon={<Key className="w-4 h-4" />} />
                                <Input label="Nova Senha" type="password" placeholder="••••••••" leftIcon={<Shield className="w-4 h-4" />} />
                                <Input label="Confirmar Nova Senha" type="password" placeholder="••••••••" />
                            </div>

                            <div className="mt-6 border-t border-[var(--color-border)] pt-6">
                                <h3 className="text-lg font-bold text-red-400 mb-2">Sessões Ativas</h3>
                                <p className="text-sm text-gray-600 dark:text-[var(--color-muted)] mb-4">Você está conectado em 1 dispositivo no momento (Desktop Atual).</p>
                                <Button variant="danger" size="sm">Encerrar todas as outras sessões</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sistema' && (
                        <div className="flex flex-col gap-6 animate-fade-in relative z-10">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Preferências do Sistema</h2>
                            
                            <div className="flex flex-col gap-6 max-w-sm">
                                <Select 
                                    label="Tema"
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                                    options={[
                                        { label: 'Claro', value: 'light' },
                                        { label: 'Escuro', value: 'dark' },
                                        { label: 'Sistema (Automático)', value: 'system' }
                                    ]}
                                />
                                
                                <Select 
                                    label="Idioma"
                                    defaultValue="pt-BR"
                                    options={[
                                        { label: 'Português (Brasil)', value: 'pt-BR' },
                                        { label: 'English', value: 'en-US' }
                                    ]}
                                />

                                <div className="border-t border-[var(--color-border)] pt-6 mt-2 flex items-center justify-between">
                                    <span className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-blue-400" />
                                        Receber notificações importantes do sistema
                                    </span>
                                    <Switch defaultChecked />
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

// Icon hack to allow the component to render without an error since we didn't import Settings icon here
function Settings(props: Record<string, string | number | boolean | null>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
}
