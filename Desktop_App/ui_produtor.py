# ui_produtor.py
# Painel do Cliente (Produtor) - MASTER BLUEPRINT

import customtkinter as ctk

def iniciar_painel_produtor(root, usuario_logado):
    COR_SIDEBAR = "#0F172A"      
    COR_FUNDO = "#F8FAFC"        
    COR_PRIMARIA = "#10B981"     
    COR_TEXTO_SIDEBAR = "#94A3B8"
    
    main_f = ctk.CTkFrame(root, fg_color=COR_FUNDO)
    main_f.pack(expand=True, fill="both")
    
    main_f.grid_columnconfigure(1, weight=1)
    main_f.grid_rowconfigure(0, weight=1)

    # ==========================
    # BARRA LATERAL 
    # ==========================
    sidebar = ctk.CTkFrame(main_f, fg_color=COR_SIDEBAR, width=260, corner_radius=0)
    sidebar.grid(row=0, column=0, sticky="nsew")
    sidebar.pack_propagate(False)

    header_logo = ctk.CTkFrame(sidebar, fg_color="transparent")
    header_logo.pack(fill="x", pady=25)
    ctk.CTkLabel(header_logo, text="🌿 AgroGB", font=ctk.CTkFont(size=24, weight="bold"), text_color=COR_PRIMARIA).pack()
    ctk.CTkLabel(header_logo, text="Área do Cliente", font=ctk.CTkFont(size=12), text_color=COR_TEXTO_SIDEBAR).pack()

    scroll_sidebar = ctk.CTkScrollableFrame(sidebar, fg_color="transparent")
    scroll_sidebar.pack(fill="both", expand=True, pady=5)

    content_area = ctk.CTkFrame(main_f, fg_color=COR_FUNDO, corner_radius=0)
    content_area.grid(row=0, column=1, sticky="nsew")

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
                iniciar_painel_produtor(root, usuario_logado)
            elif novo_perfil == "agronomo":
                import ui_agronomo
                ui_agronomo.iniciar_painel_agronomo(root, usuario_logado)
            else:
                import ui_adm
                ui_adm.iniciar_painel_adm(root, usuario_logado)
                
        btn_adm = ctk.CTkButton(modal, text="🛡️ Administrador\nAcesso total ao sistema", height=60, fg_color="#F8FAFC", hover_color="#F1F5F9", text_color="#1E293B", border_width=1, border_color="#E2E8F0", command=lambda: set_perfil("adm"))
        btn_adm.pack(fill="x", padx=20, pady=5)
        
        btn_agro = ctk.CTkButton(modal, text="🌱 Agrônomo\nAcesso às funcionalidades de agrônomo", height=60, fg_color="#F8FAFC", hover_color="#F1F5F9", text_color="#1E293B", border_width=1, border_color="#E2E8F0", command=lambda: set_perfil("agronomo"))
        btn_agro.pack(fill="x", padx=20, pady=5)
        
        btn_cli = ctk.CTkButton(modal, text="👤 Cliente\nVisualização como cliente", height=60, fg_color="#F8FAFC", hover_color="#F1F5F9", text_color="#1E293B", border_width=1, border_color=COR_PRIMARIA, command=lambda: set_perfil("cliente"))
        btn_cli.pack(fill="x", padx=20, pady=5)
        
        ctk.CTkButton(modal, text="Confirmar Troca", height=40, fg_color=COR_PRIMARIA, hover_color="#059669", font=ctk.CTkFont(weight="bold")).pack(fill="x", padx=20, pady=25)

    def exibir_dashboard_cliente():
        for w in content_area.winfo_children(): w.destroy()
        main_view = ctk.CTkScrollableFrame(content_area, fg_color="transparent")
        main_view.pack(fill="both", expand=True)
        
        top_bar = ctk.CTkFrame(main_view, fg_color="white", height=70, corner_radius=0)
        top_bar.pack(fill="x")
        top_bar.pack_propagate(False)
        ctk.CTkLabel(top_bar, text="Meu Resumo Agrícola", font=ctk.CTkFont(size=22, weight="bold"), text_color="#1E293B").pack(side="left", padx=30)

        cards_frame = ctk.CTkFrame(main_view, fg_color="transparent")
        cards_frame.pack(fill="x", padx=25, pady=(20, 10))
        cards_frame.grid_columnconfigure((0, 1, 2), weight=1)
        
        def criar_card(parent, titulo, valor, icone, desc, row, col):
            f = ctk.CTkFrame(parent, fg_color="white", corner_radius=12, height=110, border_width=1, border_color="#E2E8F0")
            f.grid(row=row, column=col, padx=8, pady=5, sticky="nsew")
            f.grid_propagate(False)
            ctk.CTkLabel(f, text=f"{icone}  {titulo}", font=ctk.CTkFont(size=12, weight="bold"), text_color="#64748B").place(x=15, y=15)
            ctk.CTkLabel(f, text=valor, font=ctk.CTkFont(size=32, weight="bold"), text_color="#1E293B").place(x=15, y=40)
            ctk.CTkLabel(f, text=desc, font=ctk.CTkFont(size=10, weight="bold"), text_color=COR_PRIMARIA).place(x=15, y=80)
            
        criar_card(cards_frame, "Minhas Áreas", "3", "🗺️", "Talhões cadastrados", 0, 0)
        criar_card(cards_frame, "Recomendações", "12", "📋", "Últimos 30 dias", 0, 1)
        criar_card(cards_frame, "Clima Local", "24°C", "☁️", "Sem chuvas previstas", 0, 2)

    def add_menu(title, icon, cmd, active=False):
        fundo = "#1E293B" if active else "transparent"
        texto = COR_PRIMARIA if active else COR_TEXTO_SIDEBAR
        btn = ctk.CTkButton(scroll_sidebar, text=f"{icon}   {title}", font=ctk.CTkFont(size=13, weight="bold" if active else "normal"), 
                            fg_color=fundo, text_color=texto, hover_color="#1E293B", 
                            anchor="w", height=40, command=cmd, corner_radius=6)
        btn.pack(fill="x", padx=15, pady=2)
        return btn

    add_menu("Início", "🏠", exibir_dashboard_cliente, active=True)
    add_menu("Minhas Áreas", "🗺️", lambda: print("Áreas Cliente"))
    add_menu("Recomendações", "📋", lambda: print("Rec Cliente"))
    add_menu("Financeiro", "💰", lambda: print("Fin Cliente"))

    footer_sidebar = ctk.CTkFrame(sidebar, fg_color="transparent")
    footer_sidebar.pack(fill="x", side="bottom", pady=20)
    
    ctk.CTkLabel(footer_sidebar, text=f"👤 {usuario_logado.get('usuario', 'Produtor')}", font=ctk.CTkFont(size=12, weight="bold"), text_color="white").pack(anchor="w", padx=20)
    
    ctk.CTkButton(footer_sidebar, text="🔄 Trocar Acesso", fg_color="transparent", border_width=1, border_color="#334155", hover_color="#1E293B", text_color="#94A3B8", height=35, command=abrir_modal_troca_acesso).pack(fill="x", padx=20, pady=(15,0))
    
    ctk.CTkButton(footer_sidebar, text="Sair do App", fg_color="transparent", text_color="#EF4444", hover_color="#1E293B", height=30, command=root.destroy).pack(fill="x", padx=20, pady=(5,0))

    exibir_dashboard_cliente()
