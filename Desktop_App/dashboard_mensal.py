# dashboard_mensal.py
# Dashboard mensal unificado do AgroGB com visual moderno e BI dinâmico

import customtkinter as ctk
from datetime import date
import db
import styles
try:
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
except ImportError:
    plt = None
    FigureCanvasTkAgg = None

def view_dashboard_mensal(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # HEADER
    header_f = ctk.CTkFrame(t, fg_color="transparent")
    header_f.pack(fill="x", pady=(0, 20))
    
    ctk.CTkLabel(header_f, text="Dashboard Gerencial - BI Rural", 
                 font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(side="left")

    # FILTROS
    filtro_f = ctk.CTkFrame(header_f, fg_color="white", corner_radius=10, border_width=1, border_color="#E2E8F0")
    filtro_f.pack(side="right")

    meses = [str(m).zfill(2) for m in range(1, 13)]
    ano_atual = date.today().year
    anos = [str(a) for a in range(ano_atual - 2, ano_atual + 1)]

    cb_mes = ctk.CTkComboBox(filtro_f, values=meses, width=100, corner_radius=8)
    cb_mes.set(date.today().strftime("%m"))
    cb_mes.pack(side="left", padx=5, pady=5)

    cb_ano = ctk.CTkComboBox(filtro_f, values=anos, width=100, corner_radius=8)
    cb_ano.set(str(ano_atual))
    cb_ano.pack(side="left", padx=5, pady=5)

    def atualizar_tudo(choice=None):
        m, a = cb_mes.get(), cb_ano.get()
        receita, despesa, lucro = db.get_kpi_financeiro(m, a)
        
        atualizar_labels_kpi(receita, despesa, lucro)
        
        replotar_grafico(a)

    cb_mes.configure(command=atualizar_tudo)
    cb_ano.configure(command=atualizar_tudo)

    # Scrollable Area
    scroll_area = ctk.CTkScrollableFrame(t, fg_color="transparent")
    scroll_area.pack(fill="both", expand=True)

    # ==========================
    # KPI CARDS
    # ==========================
    import ui_components
    
    # ==========================
    # KPI CARDS
    # ==========================
    kpi_frame = ctk.CTkFrame(scroll_area, fg_color="transparent")
    kpi_frame.pack(fill="x", pady=10)
    kpi_frame.grid_columnconfigure((0, 1, 2), weight=1)

    kpi_receita = ui_components.StatCard(kpi_frame, "TOTAL RECEITA", "R$ 0,00", color=styles.CORES["sucesso"])
    kpi_receita.grid(row=0, column=0, padx=10, sticky="nsew")

    kpi_despesa = ui_components.StatCard(kpi_frame, "TOTAL DESPESAS", "R$ 0,00", color=styles.CORES["erro"])
    kpi_despesa.grid(row=0, column=1, padx=10, sticky="nsew")

    kpi_lucro = ui_components.StatCard(kpi_frame, "LUCRO ESTIMADO", "R$ 0,00", color=styles.CORES["primaria"])
    kpi_lucro.grid(row=0, column=2, padx=10, sticky="nsew")

    # Atualizador de UI para KPIs
    def atualizar_labels_kpi(r, d, l):
        kpi_receita.update_value(f"R$ {r:,.2f}")
        kpi_despesa.update_value(f"R$ {d:,.2f}")
        kpi_lucro.update_value(f"R$ {l:,.2f}", styles.CORES["sucesso"] if l >= 0 else styles.CORES["erro"])

    # Ajusta função pai para chamar nosso atualizador
    # (Isso é um monkey patch local na lógica do atualizar_tudo que já existe no escopo)

    # ==========================
    # ÁREA DE GRÁFICOS
    # ==========================
    charts_frame = ctk.CTkFrame(scroll_area, fg_color="transparent")
    charts_frame.pack(fill="x", pady=20)
    charts_frame.grid_columnconfigure(0, weight=2)
    charts_frame.grid_columnconfigure(1, weight=1)

    # --- CARD 1: FLUXO DE CAIXA (Barras) ---
    chart_card_bar = ctk.CTkFrame(charts_frame, fg_color="white", corner_radius=15, border_width=1, border_color="#E2E8F0")
    chart_card_bar.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
    
    ctk.CTkLabel(chart_card_bar, text="Fluxo Financeiro Anual", 
                 font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(15, 5), anchor="w", padx=20)

    canvas_bar_f = ctk.CTkFrame(chart_card_bar, fg_color="white")
    canvas_bar_f.pack(fill="both", expand=True, padx=10, pady=(0, 15))

    # --- CARD 2: DISTRIBUIÇÃO (Rosca) ---
    chart_card_pie = ctk.CTkFrame(charts_frame, fg_color="white", corner_radius=15, border_width=1, border_color="#E2E8F0")
    chart_card_pie.grid(row=0, column=1, sticky="nsew", padx=(10, 0))

    ctk.CTkLabel(chart_card_pie, text="Vendas por Produto (Top 5)", 
                 font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(15, 5), anchor="w", padx=20)

    canvas_pie_f = ctk.CTkFrame(chart_card_pie, fg_color="white")
    canvas_pie_f.pack(fill="both", expand=True, padx=10, pady=(0, 15))


    def replotar_grafico(ano):
        if plt is None or FigureCanvasTkAgg is None:
            for w in canvas_bar_f.winfo_children(): w.destroy()
            for w in canvas_pie_f.winfo_children(): w.destroy()
            dados = db.get_fluxo_caixa_anual(ano)
            receita = sum(d[1] for d in dados)
            despesa = sum(d[2] for d in dados)
            ctk.CTkLabel(
                canvas_bar_f,
                text=f"Resumo anual\nEntradas: R$ {receita:,.2f}\nSaídas: R$ {despesa:,.2f}",
                font=ctk.CTkFont(size=15, weight="bold"),
                text_color=styles.CORES["texto"],
            ).pack(expand=True, pady=40)
            produtos = db.get_vendas_por_produto(cb_mes.get(), cb_ano.get())
            texto = "\n".join([f"{p}: R$ {v:,.2f}" for p, v in produtos]) or "Sem dados"
            ctk.CTkLabel(
                canvas_pie_f,
                text=texto,
                font=ctk.CTkFont(size=13),
                text_color=styles.CORES["texto"],
            ).pack(expand=True, pady=40)
            return

        # 1. PLOT BARRAS (Fluxo)
        for w in canvas_bar_f.winfo_children(): w.destroy()
        dados = db.get_fluxo_caixa_anual(ano)
        receitas = [d[1] for d in dados]
        despesas = [d[2] for d in dados]

        fig1, ax1 = plt.subplots(figsize=(6, 3.5), dpi=100)
        fig1.patch.set_facecolor('white')
        ax1.set_facecolor('white')
        
        x = range(12)
        width = 0.35
        ax1.bar([i - width/2 for i in x], receitas, width, label='Entrada', color='#10B981', alpha=0.9, edgecolor='none')
        ax1.bar([i + width/2 for i in x], despesas, width, label='Saída', color='#EF4444', alpha=0.9, edgecolor='none')
        
        ax1.set_xticks(x)
        ax1.set_xticklabels(['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], color="#64748B", fontsize=8)
        ax1.set_yticklabels([], color="white"); ax1.spines['top'].set_visible(False)
        ax1.spines['right'].set_visible(False); ax1.spines['left'].set_visible(False)
        ax1.spines['bottom'].set_color('#E2E8F0'); ax1.grid(axis='y', linestyle='--', alpha=0.2)
        ax1.legend(frameon=False, loc='upper center', ncol=2, bbox_to_anchor=(0.5, 1.1), labelcolor="#475569")
        
        FigureCanvasTkAgg(fig1, master=canvas_bar_f).get_tk_widget().pack(fill="both", expand=True)
        plt.close(fig1)

        # 2. PLOT ROSCA (Produtos)
        for w in canvas_pie_f.winfo_children(): w.destroy()
        
        # Pega dados do mês atual selecionado no combo (ou pega totais do ano se preferir)
        # Vamos pegar do mês selecionado para ser dinâmico
        dados_prod = db.get_vendas_por_produto(cb_mes.get(), cb_ano.get())
        
        fig2, ax2 = plt.subplots(figsize=(4, 3.5), dpi=100)
        fig2.patch.set_facecolor('white')
        
        if not dados_prod:
            ax2.text(0.5, 0.5, "Sem dados", ha='center', va='center', color="#94A3B8")
            ax2.axis('off')
        else:
            labels = [d[0] for d in dados_prod]
            valores = [d[1] for d in dados_prod]
            colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            
            wedges, texts, autotexts = ax2.pie(valores, labels=None, autopct='%1.0f%%', startangle=90, colors=colors, pctdistance=0.85)
            
            # Estilo Donut
            centre_circle = plt.Circle((0,0),0.70,fc='white')
            fig2.gca().add_artist(centre_circle)
            
            # Legenda compacta abaixo
            ax2.legend(wedges, labels, loc="center", bbox_to_anchor=(0.5, -0.1), ncol=2, frameon=False, fontsize=8)
            plt.setp(autotexts, size=8, weight="bold", color="white")
            ax2.axis('equal')

        FigureCanvasTkAgg(fig2, master=canvas_pie_f).get_tk_widget().pack(fill="both", expand=True)
        plt.close(fig2)

    # Inicializa
    atualizar_tudo()
