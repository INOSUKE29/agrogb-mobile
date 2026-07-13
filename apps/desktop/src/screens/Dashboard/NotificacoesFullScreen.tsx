import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  CloudRain, 
  Package, 
  Clock, 
  Check, 
  Trash2, 
  Filter 
} from 'lucide-react';

type NotificationType = 'alert' | 'recommendation' | 'inventory' | 'weather';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}



type FilterType = 'all' | 'unread' | 'alerts' | 'recommendations';

export const NotificacoesFullScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'alerts') return n.type === 'alert' || n.type === 'weather';
    if (activeFilter === 'recommendations') return n.type === 'recommendation';
    return true;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'weather': return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'recommendation': return <CheckCircle2 className="w-5 h-5 text-[#10B981]" />;
      case 'inventory': return <Package className="w-5 h-5 text-amber-400" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-gray-100 p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[rgba(16,185,129,0.1)] rounded-xl border border-[rgba(16,185,129,0.2)]">
            <Bell className="w-8 h-8 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Central de Notificações</h1>
            <p className="text-sm text-gray-400 mt-1">Gerencie seus alertas e atualizações do sistema</p>
          </div>
        </div>
        
        <button 
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm font-medium transition-all duration-200"
        >
          <Check className="w-4 h-4" />
          Marcar todas como lidas
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-400 mr-2" />
          
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'all' 
                ? 'bg-[#10B981] text-white' 
                : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'unread' 
                ? 'bg-[#10B981] text-white' 
                : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            Não Lidas
          </button>
          <button
            onClick={() => setActiveFilter('alerts')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'alerts' 
                ? 'bg-[#10B981] text-white' 
                : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            Alertas
          </button>
          <button
            onClick={() => setActiveFilter('recommendations')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === 'recommendations' 
                ? 'bg-[#10B981] text-white' 
                : 'bg-[rgba(255,255,255,0.05)] text-gray-400 hover:text-gray-200 hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            Recomendações
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300">Nenhuma notificação encontrada</h3>
              <p className="text-sm text-gray-500 mt-2">Você está em dia com todas as suas atualizações.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`group relative flex flex-col sm:flex-row gap-4 p-5 rounded-2xl transition-all duration-300 ${
                  notification.read 
                    ? 'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]' 
                    : 'bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.2)] shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                } hover:bg-[rgba(255,255,255,0.06)]`}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></div>
                )}

                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-full shrink-0 ${
                    notification.read ? 'bg-[rgba(255,255,255,0.05)]' : 'bg-[rgba(255,255,255,0.1)]'
                  }`}>
                    {getIconForType(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`text-base font-semibold mb-1 ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                      {notification.title}
                    </h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {notification.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:justify-center gap-2 border-t border-[rgba(255,255,255,0.05)] sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 mt-4 sm:mt-0">
                  {!notification.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-[#10B981] hover:bg-[rgba(16,185,129,0.1)] rounded-lg transition-colors tooltip-trigger"
                      title="Marcar como lida"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-[rgba(248,113,113,0.1)] rounded-lg transition-colors tooltip-trigger"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificacoesFullScreen;
