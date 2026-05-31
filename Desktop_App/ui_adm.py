# ui_adm.py
# Painel Administrativo Matriz - PREMIUM SAAS EDITION (LITE/FAST)
# Removido Matplotlib para evitar travamentos no Windows. Uso de UI Pura.

import customtkinter as ctk
import styles
import ui_components
import os
from datetime import datetime

def iniciar_painel_adm(root, usuario_logado):
    # ==========================
    # PALETA DE CORES PREMIUM SAAS
    # ==========================
    COR_SIDEBAR = "#022C22"       # Emerald 950
    COR_SIDEBAR_HOVER = "#064E3B" # Emerald 900
    COR_SIDEBAR_ACTIVE = "#047857"# Emerald 600
    
    COR_FUNDO = "#F3F4F6"         # Cool Gray 100
    COR_CARD = "#FFFFFF"          # Branco puro
    COR_BORDA = "#E5E7EB"         # Borda sutil
    
    COR_TEXTO_TITULO = "#111827"  # Gray 900
    COR_TEXTO_SUB = "#6B7280"     # Gray 500
    COR_PRIMARIA = "#10B981"      # Emerald 500
    
    main_f = ctk.CTkFrame(root, fg_color=COR_FUNDO)
    main_f.pack(expand=True, fill="both")
    
    main_f.grid_columnconfigure(1, weight=1)
    main_f.grid_rowconfigure(0, weight=1)

    # ==========================
    # BARRA LATERAL
    # ==========================
    sidebar = ctk.CTkFrame(main_f, fg_color=COR_SIDEBAR, width=280, corner_radius=0)
    sidebar.grid(row=0, column=0, sticky="nsew")
    sidebar.pack_propagate(False)

    header_logo = ctk.CTkFrame(sidebar, fg_color="transparent")
    header_logo.pack(fill="x", pady=(30, 20), padx=25)
    ctk.CTkLabel(header_logo, text="🌿 AgroGB", font=ctk.CTkFont(size=26, weight="bold"), text_color="#34D399").pack(anchor="w")
    ctk.CTkLabel(header_logo, text="Enterprise Edition", font=ctk.CTkFont(size=10, weight="bold"), text_color="#6EE7B7").pack(anchor="w", padx=35)

    scroll_sidebar = ctk.CTkScrollableFrame(sidebar, fg_color="transparent")
    scroll_sidebar.pack(fill="both", expand=True, pady=10)

    content_area = ctk.CTkFrame(main_f, fg_color=COR_FUNDO, corner_radius=0)
    content_area.grid(row=0, column=1, sticky="nsew")

    # ==========================
    # MODAL DE TROCA DE ACESSO
    # ==========================
    def abrir_modal_troca_acesso():
        modal = ctk.CTkToplevel(root)
        modal.title("Troca de Acesso")
        modal.geometry("450x500")
        modal.resizable(False, False)
        modal.configure(fg_color="#FFFFFF")
        modal.attributes("-topmost", True)
        
        modal.update_idletasks()
        x = (modal.winfo_screenwidth() // 2) - (450 // 2)
        y = (modal.winfo_screenheight() // 2) - (500 // 2)
        modal.geometry(f"+{x}+{y}")
        
        ctk.CTkLabel(modal, text="Alternar Perfil", font=ctk.CTkFont(size=22, weight="bold"), text_color=COR_TEXTO_TITULO).pack(pady=(30, 5))
        ctk.CTkLabel(modal, text="Escolha a visão que deseja simular no sistema.", font=ctk.CTkFont(size=13), text_color=COR_TEXTO_SUB).pack(pady=(0, 30))
        
        def set_perfil(novo_perfil):
            modal.destroy()
            for w in root.winfo_children(): w.destroy()
            if novo_perfil == "cliente":
                import ui_produtor 
                ui_produtor.iniciar_painel_produtor(root, usuario_logado)
            elif novo_perfil == "agronomo":
                import ui_agronomo
                ui_agronomo.iniciar_painel_agronomo(root, usuario_logado)
            else:
                iniciar_painel_adm(root, usuario_logado)
                
        def criar_card_perfil(parent, titulo, desc, icone, cor_fundo, cor_texto, cmd):
            f = ctk.CTkButton(parent, text="", height=75, fg_color="#F9FAFB", hover_color="#F3F4F6", border_width=1, border_color="#E5E7EB", corner_radius=12, command=cmd)
            f.pack(fill="x", padx=30, pady=8)
            
            icon_bg = ctk.CTkFrame(f, width=45, height=45, corner_radius=22, fg_color=cor_fundo)
            icon_bg.place(x=15, y=15)
            ctk.CTkLabel(icon_bg, text=icone, font=ctk.CTkFont(size=20), text_color=cor_texto).place(relx=0.5, rely=0.5, anchor="center")
            
            ctk.CTkLabel(f, text=titulo, font=ctk.CTkFont(size=14, weight="bold"), text_color=COR_TEXTO_TITULO, bg_color="transparent").place(x=75, y=15)
            ctk.CTkLabel(f, text=desc, font=ctk.CTkFont(size=11), text_color=COR_TEXTO_SUB, bg_color="transparent").place(x=75, y=40)

        criar_card_perfil(modal, "Administrador Global", "Acesso total, financeiro e configurações", "🛡️", "#ECFDF5", "#059669", lambda: set_perfil("adm"))
        criar_card_perfil(modal, "Engenheiro Agrônomo", "Gestão técnica de lavouras e receituários", "🌱", "#EFF6FF", "#2563EB", lambda: set_perfil("agronomo"))
        criar_card_perfil(modal, "Cliente / Produtor", "Visão final do cliente do ecossistema", "👤", "#FEF2F2", "#DC2626", lambda: set_perfil("cliente"))
        
        ctk.CTkButton(modal, text="Cancelar", fg_color="transparent", text_color=COR_TEXTO_SUB, hover_color="#F3F4F6", command=modal.destroy).pack(pady=20)


    # ==========================
    # DASHBOARD PRINCIPAL
    # ==========================
    def exibir_dashboard():
        for w in content_area.winfo_children(): w.destroy()
        
        main_view = ctk.CTkScrollableFrame(content_area, fg_color="transparent")
        main_view.pack(fill="both", expand=True)
        
        header_content = ctk.CTkFrame(main_view, fg_color="transparent", height=100)
        header_content.pack(fill="x", padx=40, pady=(30, 10))
        
        saudacao = "Bom dia" if datetime.now().hour < 12 else "Boa tarde" if datetime.now().hour < 18 else "Boa noite"
        nome_user = usuario_logado.get('usuario', 'Admin').split()[0]
        
        text_f = ctk.CTkFrame(header_content, fg_color="transparent")
        text_f.pack(side="left")
        ctk.CTkLabel(text_f, text=f"{saudacao}, {nome_user}! 👋", font=ctk.CTkFont(size=28, weight="bold"), text_color=COR_TEXTO_TITULO).pack(anchor="w")
        ctk.CTkLabel(text_f, text="Aqui está o panorama completo da plataforma hoje.", font=ctk.CTkFont(size=14), text_color=COR_TEXTO_SUB).pack(anchor="w")
        
        btn_rel = ctk.CTkButton(header_content, text="⬇️  Exportar Relatório", font=ctk.CTkFont(weight="bold"), fg_color="#FFFFFF", text_color=COR_TEXTO_TITULO, border_width=1, border_color=COR_BORDA, hover_color="#F9FAFB")
        btn_rel.pack(side="right")

        cards_frame = ctk.CTkFrame(main_view, fg_color="transparent")
        cards_frame.pack(fill="x", padx=35, pady=(10, 20))
        cards_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        def criar_card_premium(parent, titulo, valor, icone, trend, trend_is_positive, icon_color_bg, icon_color_fg, row, col):
            # Removido os bindings de <Enter> e <Leave> para evitar travamentos de UI na renderização do CustomTkinter
            f = ctk.CTkFrame(parent, fg_color=COR_CARD, corner_radius=16, height=140, border_width=1, border_color=COR_BORDA)
            f.grid(row=row, column=col, padx=8, pady=5, sticky="nsew")
            f.grid_propagate(False)
            
            icon_bg = ctk.CTkFrame(f, width=40, height=40, corner_radius=20, fg_color=icon_color_bg)
            icon_bg.place(x=20, y=20)
            ctk.CTkLabel(icon_bg, text=icone, font=ctk.CTkFont(size=18), text_color=icon_color_fg).place(relx=0.5, rely=0.5, anchor="center")
            
            ctk.CTkLabel(f, text=titulo, font=ctk.CTkFont(size=13, weight="bold"), text_color=COR_TEXTO_SUB).place(x=70, y=28)
            ctk.CTkLabel(f, text=valor, font=ctk.CTkFont(size=36, weight="bold"), text_color=COR_TEXTO_TITULO).place(x=20, y=70)
            
            trend_color = "#059669" if trend_is_positive else "#DC2626"
            trend_bg = "#D1FAE5" if trend_is_positive else "#FEE2E2"
            trend_icon = "↗" if trend_is_positive else "↘"
            
            badge = ctk.CTkFrame(f, corner_radius=10, fg_color=trend_bg, height=24)
            badge.place(x=20, y=115)
            ctk.CTkLabel(badge, text=f"{trend_icon} {trend}", font=ctk.CTkFont(size=11, weight="bold"), text_color=trend_color).pack(padx=8, pady=2)
            
        criar_card_premium(cards_frame, "Produtividade Média", "58 sc/ha", "🌾", "2.1% vs Safra Ant", True, "#ECFDF5", "#059669", 0, 0)
        criar_card_premium(cards_frame, "Custo Operacional", "R$ 4.2k/ha", "💸", "1.5% vs Meta", False, "#FEF2F2", "#DC2626", 0, 1)
        criar_card_premium(cards_frame, "Clima & Solo (IoT)", "32°C | 40%", "🌤️", "Estável", True, "#EFF6FF", "#2563EB", 0, 2)
        criar_card_premium(cards_frame, "Estoque & Tarefas", "12 Atrasos", "⚠️", "Crítico", False, "#FEF3C7", "#D97706", 0, 3)

        # --- SEÇÃO VISUAL (SEM MATPLOTLIB PARA NÃO TRAVAR) ---
        graficos_f = ctk.CTkFrame(main_view, fg_color="transparent")
        graficos_f.pack(fill="both", expand=True, padx=35, pady=10)
        graficos_f.grid_columnconfigure((0, 1), weight=1, uniform="group1")
        
        # Dashboard de Custo Estimado vs Realizado (UI Pura)
        graf_linha = ctk.CTkFrame(graficos_f, fg_color=COR_CARD, corner_radius=16, border_width=1, border_color=COR_BORDA)
        graf_linha.grid(row=0, column=0, padx=8, sticky="nsew")
        ctk.CTkLabel(graf_linha, text="Custo Estimado vs Realizado (R$)", font=ctk.CTkFont(size=16, weight="bold"), text_color=COR_TEXTO_TITULO).pack(pady=(20, 0), anchor="w", padx=25)
        
        def add_progress(parent, nome, estimado, realizado, cor):
            f = ctk.CTkFrame(parent, fg_color="transparent")
            f.pack(fill="x", padx=25, pady=10)
            
            # Texto superior (Nome e R$)
            text_box = ctk.CTkFrame(f, fg_color="transparent")
            text_box.pack(fill="x")
            ctk.CTkLabel(text_box, text=nome, font=ctk.CTkFont(size=12, weight="bold"), text_color=COR_TEXTO_SUB, anchor="w").pack(side="left")
            ctk.CTkLabel(text_box, text=f"Est: {estimado}k | Real: {realizado}k", font=ctk.CTkFont(size=11, weight="bold"), text_color=COR_TEXTO_TITULO).pack(side="right")
            
            # Barra de progresso comparativa
            taxa = realizado / estimado
            cor_atual = cor if taxa <= 1.05 else "#DC2626" # Vermelho se estourar 5% da meta
            
            pb = ctk.CTkProgressBar(f, progress_color=cor_atual, fg_color="#F3F4F6", height=12)
            pb.pack(fill="x", expand=True, pady=(5, 0))
            pb.set(min(taxa, 1.0)) # Limita a barra visualmente a 100%

        add_progress(graf_linha, "Insumos (Sementes/Adubos)", 450, 430, "#10B981") # Verde (Dentro da meta)
        add_progress(graf_linha, "Maquinário (Combustível)", 200, 240, "#10B981") # Estourou meta (Fica vermelho automático)
        add_progress(graf_linha, "Mão de Obra", 150, 150, "#6366F1")
        add_progress(graf_linha, "Manutenção & Outros", 80, 60, "#EC4899")
        
        # Painel de Alertas de IoT e Progresso
        ativ_f = ctk.CTkFrame(graficos_f, fg_color=COR_CARD, corner_radius=16, border_width=1, border_color=COR_BORDA)
        ativ_f.grid(row=0, column=1, padx=8, sticky="nsew")
        ctk.CTkLabel(ativ_f, text="Alertas Críticos (Sensores & Estoque)", font=ctk.CTkFont(size=16, weight="bold"), text_color=COR_TEXTO_TITULO).pack(pady=(20, 15), anchor="w", padx=25)
        
        def add_alerta(parent, icone, titulo, desc, nivel):
            f = ctk.CTkFrame(parent, fg_color="transparent")
            f.pack(fill="x", padx=25, pady=8)
            
            cor_icone = "#DC2626" if nivel == "ALTO" else "#D97706"
            
            icon_box = ctk.CTkFrame(f, width=36, height=36, corner_radius=8, fg_color="#FEE2E2" if nivel == "ALTO" else "#FEF3C7")
            icon_box.pack(side="left", padx=(0, 15))
            icon_box.pack_propagate(False)
            ctk.CTkLabel(icon_box, text=icone, font=ctk.CTkFont(size=18), text_color=cor_icone).place(relx=0.5, rely=0.5, anchor="center")
            
            text_col = ctk.CTkFrame(f, fg_color="transparent")
            text_col.pack(side="left", fill="x", expand=True)
            ctk.CTkLabel(text_col, text=titulo, font=ctk.CTkFont(size=13, weight="bold"), text_color=COR_TEXTO_TITULO).pack(anchor="w")
            ctk.CTkLabel(text_col, text=desc, font=ctk.CTkFont(size=11), text_color=COR_TEXTO_SUB).pack(anchor="w")
            
        add_alerta(ativ_f, "📉", "Estoque Crítico: Ureia", "Restam apenas 15 toneladas no Galpão 2.", "ALTO")
        add_alerta(ativ_f, "🚜", "Atraso Operacional", "Pulverização do Talhão 4 atrasada em 2 dias.", "MEDIO")
        add_alerta(ativ_f, "💧", "Alerta IoT: Estresse Hídrico", "Sensor S-04 indica umidade de solo < 20%.", "ALTO")
        add_alerta(ativ_f, "🌡️", "Alerta Climático", "Previsão de geada na madruga (0°C).", "ALTO")

    # ==========================
    # MENU DA SIDEBAR
    # ==========================
    def carregar_tela(modulo_nome, active_btn_title):
        # Destrói tudo que está na área central
        for w in content_area.winfo_children(): w.destroy()
        
        # Reseta as cores dos botões na sidebar
        for w in scroll_sidebar.winfo_children():
            if isinstance(w, ctk.CTkButton):
                w.configure(fg_color="transparent", text_color="#A7F3D0")
                if w.cget("text").endswith(active_btn_title):
                    w.configure(fg_color=COR_SIDEBAR_ACTIVE, text_color="#FFFFFF")
        
        # Injeta a tela real
        if modulo_nome == "dashboard":
            exibir_dashboard()
        elif modulo_nome == "clientes":
            import clientes
            clientes.view_clientes(content_area)
        elif modulo_nome == "talhoes":
            import talhoes
            talhoes.view_talhoes(content_area)
        elif modulo_nome == "usuarios":
            import usuarios
            usuarios.view_usuarios(content_area)
        elif modulo_nome == "monitoramento":
            import monitoramento
            monitoramento.view_monitoramento(content_area)
        elif modulo_nome == "relatorios":
            import dashboard_mensal
            dashboard_mensal.view_dashboard_mensal(content_area)

    def add_menu(title, icon, cmd, active=False):
        fundo = COR_SIDEBAR_ACTIVE if active else "transparent"
        texto = "#FFFFFF" if active else "#A7F3D0"
        
        btn = ctk.CTkButton(scroll_sidebar, text=f"{icon}   {title}", font=ctk.CTkFont(size=14, weight="bold" if active else "normal"), 
                            fg_color=fundo, text_color=texto, hover_color=COR_SIDEBAR_HOVER, 
                            anchor="w", height=42, command=cmd, corner_radius=8)
        btn.pack(fill="x", padx=16, pady=3)
        return btn

    ctk.CTkLabel(scroll_sidebar, text="VISÃO GERAL", font=ctk.CTkFont(size=11, weight="bold"), text_color="#059669").pack(anchor="w", padx=20, pady=(10, 5))
    add_menu("Dashboard Central", "🏠", lambda: carregar_tela("dashboard", "Dashboard Central"), active=True)
    add_menu("Relatórios BI", "📊", lambda: carregar_tela("relatorios", "Relatórios BI"))
    
    ctk.CTkLabel(scroll_sidebar, text="MÓDULOS DE GESTÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color="#059669").pack(anchor="w", padx=20, pady=(20, 5))
    add_menu("Gestão de Clientes", "👥", lambda: carregar_tela("clientes", "Gestão de Clientes"))
    add_menu("Áreas e Talhões", "🗺️", lambda: carregar_tela("talhoes", "Áreas e Talhões"))
    add_menu("Recomendações", "📋", lambda: None)
    add_menu("Monitoramento", "🛰️", lambda: carregar_tela("monitoramento", "Monitoramento"))
    add_menu("Financeiro", "💰", lambda: None)
    
    ctk.CTkLabel(scroll_sidebar, text="ADMINISTRAÇÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color="#059669").pack(anchor="w", padx=20, pady=(20, 5))
    add_menu("Controle de Usuários", "🔐", lambda: carregar_tela("usuarios", "Controle de Usuários"))
    add_menu("Configurações do App", "⚙️", lambda: None)
    add_menu("Auditoria do Sistema", "🧾", lambda: None)

    # --- RODAPÉ DA SIDEBAR ---
    footer_sidebar = ctk.CTkFrame(sidebar, fg_color="transparent")
    footer_sidebar.pack(fill="x", side="bottom", pady=25)
    
    perfil_f = ctk.CTkFrame(footer_sidebar, fg_color="transparent")
    perfil_f.pack(fill="x", padx=20, pady=(0, 15))
    
    avatar = ctk.CTkFrame(perfil_f, width=40, height=40, corner_radius=20, fg_color="#10B981")
    avatar.pack(side="left")
    ctk.CTkLabel(avatar, text="ADM", font=ctk.CTkFont(size=12, weight="bold"), text_color="white").place(relx=0.5, rely=0.5, anchor="center")
    
    texto_perfil = ctk.CTkFrame(perfil_f, fg_color="transparent")
    texto_perfil.pack(side="left", padx=10)
    ctk.CTkLabel(texto_perfil, text=f"{usuario_logado.get('usuario', 'Admin')}", font=ctk.CTkFont(size=13, weight="bold"), text_color="white").pack(anchor="w")
    ctk.CTkLabel(texto_perfil, text="admin@agrogb.com", font=ctk.CTkFont(size=11), text_color="#6EE7B7").pack(anchor="w")
    
    ctk.CTkButton(footer_sidebar, text="🔄 Trocar Acesso", fg_color=COR_SIDEBAR_HOVER, hover_color="#047857", text_color="#FFFFFF", height=38, command=abrir_modal_troca_acesso).pack(fill="x", padx=20, pady=(0, 8))
    ctk.CTkButton(footer_sidebar, text="Sair do Sistema", fg_color="transparent", text_color="#FCA5A5", hover_color="#7F1D1D", height=38, command=root.destroy).pack(fill="x", padx=20)

    exibir_dashboard()
