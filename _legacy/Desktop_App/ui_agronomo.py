# ui_agronomo.py
# Painel do Agrônomo - MASTER BLUEPRINT

import customtkinter as ctk
import styles
import ui_components

try:
    import matplotlib
    matplotlib.use("TkAgg")
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    from matplotlib.figure import Figure
    HAS_MATPLOTLIB = True
except Exception:
    HAS_MATPLOTLIB = False

def iniciar_painel_agronomo(root, usuario_logado):
    # Definindo as cores do Master Blueprint
    COR_SIDEBAR = "#0F172A"      
    COR_FUNDO = "#F8FAFC"        
    COR_PRIMARIA = "#10B981"     
    COR_TEXTO_SIDEBAR = "#94A3B8"
    
    main_f = ctk.CTkFrame(root, fg_color=COR_FUNDO)
    main_f.pack(expand=True, fill="both")
    
    main_f.grid_columnconfigure(1, weight=1)
    main_f.grid_rowconfigure(0, weight=1)

    # ==========================
    # BARRA LATERAL (ESCURA PREMIUM)
    # ==========================
    sidebar = ctk.CTkFrame(main_f, fg_color=COR_SIDEBAR, width=260, corner_radius=0)
    sidebar.grid(row=0, column=0, sticky="nsew")
    sidebar.pack_propagate(False)

    # Logo
    header_logo = ctk.CTkFrame(sidebar, fg_color="transparent")
    header_logo.pack(fill="x", pady=25)
    ctk.CTkLabel(header_logo, text="🌿 AgroGB", font=ctk.CTkFont(size=24, weight="bold"), text_color=COR_PRIMARIA).pack()
    ctk.CTkLabel(header_logo, text="Painel do Agrônomo", font=ctk.CTkFont(size=12), text_color=COR_TEXTO_SIDEBAR).pack()

    # Botões do Menu
    scroll_sidebar = ctk.CTkScrollableFrame(sidebar, fg_color="transparent")
    scroll_sidebar.pack(fill="both", expand=True, pady=5)

    content_area = ctk.CTkFrame(main_f, fg_color=COR_FUNDO, corner_radius=0)
    content_area.grid(row=0, column=1, sticky="nsew")

    def load_view(f):
        for w in content_area.winfo_children(): w.destroy()
        f(content_area)

    # Função do Modal de Troca de Acesso para voltar
    def abrir_modal_troca_acesso():
        modal = ctk.CTkToplevel(root)
        modal.title("Troca de Acesso")
        modal.geometry("400x450")
        modal.resizable(False, False)
        modal.configure(fg_color="white")
        modal.attributes("-topmost", True)
        
        modal.update_idletasks()
        x = (modal.winfo_screenwidth() // 2) - (400 // 2)
        y = (modal.winfo_screenheight() // 2) - (450 // 2)
        modal.geometry(f"+{x}+{y}")
        
        ctk.CTkLabel(modal, text="Trocar Acesso", font=ctk.CTkFont(size=18, weight="bold"), text_color="#1E293B").pack(pady=(20, 5))
        ctk.CTkLabel(modal, text="Navegue pelo sistema com diferentes perfis.", font=ctk.CTkFont(size=12), text_color="#64748B").pack(pady=(0, 20))
        
        def set_perfil(novo_perfil):
            modal.destroy()
            for w in root.winfo_children(): w.destroy()
            if novo_perfil == "cliente":
                import ui_produtor 
                ui_produtor.iniciar_painel_produtor(root, usuario_logado)
            elif novo_perfil == "agronomo":
                iniciar_painel_agronomo(root, usuario_logado)
            else:
                import ui_adm
                ui_adm.iniciar_painel_adm(root, usuario_logado)
                
        btn_adm = ctk.CTkButton(modal, text="🛡️ Administrador\nAcesso total ao sistema", height=60, fg_color="#F8FAFC", hover_color="#F1F5F9", text_color="#1E293B", border_width=1, border_color="#E2E8F0", command=lambda: set_perfil("adm"))
        btn_adm.pack(fill="x", padx=20, pady=5)
        
        btn_agro = ctk.CTkButton(modal, text="🌱 Agrônomo\nAcesso às funcionalidades de agrônomo", height=60, fg_color="#F8FAFC", hover_color="#F1F5F9", text_color="#1E293B", border_width=1, border_color=COR_PRIMARIA, command=lambda: set_perfil("agronomo"))
        btn_agro.pack(fill="x", padx=20, pady=5)
        
        btn_cli = ctk.CTkButton(modal, text="👤 Cliente\nVisualização como cliente", height=60, fg_color="#F8FAFC", hover_color="#F1F5F9", text_color="#1E293B", border_width=1, border_color="#E2E8F0", command=lambda: set_perfil("cliente"))
        btn_cli.pack(fill="x", padx=20, pady=5)
        
        ctk.CTkButton(modal, text="Confirmar Troca", height=40, fg_color=COR_PRIMARIA, hover_color="#059669", font=ctk.CTkFont(weight="bold")).pack(fill="x", padx=20, pady=25)

    def exibir_dashboard_agronomo():
        for w in content_area.winfo_children(): w.destroy()
        
        main_view = ctk.CTkScrollableFrame(content_area, fg_color="transparent")
        main_view.pack(fill="both", expand=True)
        
        # --- TOPO ---
        top_bar = ctk.CTkFrame(main_view, fg_color="white", height=70, corner_radius=0)
        top_bar.pack(fill="x")
        top_bar.pack_propagate(False)
        
        ctk.CTkLabel(top_bar, text="Dashboard do Agrônomo", font=ctk.CTkFont(size=22, weight="bold"), text_color="#1E293B").pack(side="left", padx=30)

        # --- CARDS DE INDICADORES ---
        cards_frame = ctk.CTkFrame(main_view, fg_color="transparent")
        cards_frame.pack(fill="x", padx=25, pady=(20, 10))
        cards_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        def criar_card_blueprint(parent, titulo, valor, icone, desc, row, col):
            f = ctk.CTkFrame(parent, fg_color="white", corner_radius=12, height=110, border_width=1, border_color="#E2E8F0")
            f.grid(row=row, column=col, padx=8, pady=5, sticky="nsew")
            f.grid_propagate(False)
            
            ctk.CTkLabel(f, text=f"{icone}  {titulo}", font=ctk.CTkFont(size=12, weight="bold"), text_color="#64748B").place(x=15, y=15)
            ctk.CTkLabel(f, text=valor, font=ctk.CTkFont(size=32, weight="bold"), text_color="#1E293B").place(x=15, y=40)
            ctk.CTkLabel(f, text=desc, font=ctk.CTkFont(size=10, weight="bold"), text_color=COR_PRIMARIA).place(x=15, y=80)
            
        criar_card_blueprint(cards_frame, "Meus Clientes", "42", "👥", "Fazendas ativas", 0, 0)
        criar_card_blueprint(cards_frame, "Visitas Agendadas", "8", "📍", "Próximos 7 dias", 0, 1)
        criar_card_blueprint(cards_frame, "Recomendações", "156", "📋", "Emitidas no mês", 0, 2)
        criar_card_blueprint(cards_frame, "Áreas", "87", "🗺️", "Talhões monitorados", 0, 3)

        # Placeholder para Listas (Clientes Críticos etc)
        listas_f = ctk.CTkFrame(main_view, fg_color="transparent")
        listas_f.pack(fill="both", expand=True, padx=25, pady=10)
        
        box_atividades = ctk.CTkFrame(listas_f, fg_color="white", corner_radius=12, border_width=1, border_color="#E2E8F0")
        box_atividades.pack(fill="both", expand=True, padx=8, pady=5)
        ctk.CTkLabel(box_atividades, text="Minhas Próximas Atividades", font=ctk.CTkFont(size=14, weight="bold"), text_color="#1E293B").pack(pady=15, anchor="w", padx=20)
        
        ctk.CTkLabel(box_atividades, text="• Visita técnica - Fazenda Boa Vista (Amanhã)", text_color="#64748B").pack(anchor="w", padx=20, pady=2)
        ctk.CTkLabel(box_atividades, text="• Emissão de Receituário - Cliente João Silva (Em 2 dias)", text_color="#64748B").pack(anchor="w", padx=20, pady=2)

    def add_menu(title, icon, cmd, active=False):
        fundo = "#1E293B" if active else "transparent"
        texto = COR_PRIMARIA if active else COR_TEXTO_SIDEBAR
        btn = ctk.CTkButton(scroll_sidebar, text=f"{icon}   {title}", font=ctk.CTkFont(size=13, weight="bold" if active else "normal"), 
                            fg_color=fundo, text_color=texto, hover_color="#1E293B", 
                            anchor="w", height=40, command=cmd, corner_radius=6)
        btn.pack(fill="x", padx=15, pady=2)
        return btn

    add_menu("Dashboard Técnico", "🏠", exibir_dashboard_agronomo, active=True)
    add_menu("Clientes (CRM)", "👥", lambda: print("Clientes"))
    add_menu("Fazendas (Propriedades)", "🏡", lambda: print("Fazendas"))
    add_menu("Áreas e Talhões", "🗺️", lambda: print("Áreas"))
    add_menu("Manejo (Prescrições)", "📋", lambda: print("Rec"))
    add_menu("Monitoramento (Diagnóstico)", "🔍", lambda: print("Monitoramento"))
    add_menu("Relatórios de Campo", "📊", lambda: print("Relatórios"))

    # --- RODAPÉ DA SIDEBAR (MODAL) ---
    footer_sidebar = ctk.CTkFrame(sidebar, fg_color="transparent")
    footer_sidebar.pack(fill="x", side="bottom", pady=20)
    
    ctk.CTkLabel(footer_sidebar, text=f"🌱 {usuario_logado.get('usuario', 'Consultor')}", font=ctk.CTkFont(size=12, weight="bold"), text_color="white").pack(anchor="w", padx=20)
    
    # IMPORTANTE: Botão Trocar Acesso visível para todos os perfis durante o Modo Teste
    ctk.CTkButton(footer_sidebar, text="🔄 Trocar Acesso", fg_color="transparent", border_width=1, border_color="#334155", hover_color="#1E293B", text_color="#94A3B8", height=35, command=abrir_modal_troca_acesso).pack(fill="x", padx=20, pady=(15,0))
    
    ctk.CTkButton(footer_sidebar, text="Sair do App", fg_color="transparent", text_color="#EF4444", hover_color="#1E293B", height=30, command=root.destroy).pack(fill="x", padx=20, pady=(5,0))

    exibir_dashboard_agronomo()
