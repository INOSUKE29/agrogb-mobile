# relatorios/dashboard.py
# Painel Analítico de Relatórios

import customtkinter as ctk
from tkinter import messagebox
import db
import styles
from datetime import datetime, timedelta
try:
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
except ImportError:
    plt = None
    FigureCanvasTkAgg = None

# Imports dos submódulos para acesso rápido nas abas (futuro)
# Por enquanto mantemos a lógica original mas preparado para expansão

def view_relatorios(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Painel Analítico de Relatórios", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # TABS
    tabview = ctk.CTkTabview(t, corner_radius=15, fg_color=styles.CORES["card"], 
                              border_width=1, border_color=styles.CORES["borda"][0])
    tabview.pack(fill="both", expand=True)

    tab_periodo = tabview.add("Por Período")
    tab_ranking = tabview.add("Ranking de Produtos")
    tab_producao = tabview.add("Produção") # Nova aba para integrar o relatório antigo
    tab_prod_pe = tabview.add("Produtividade/Pé")
    tab_margem = tabview.add("Margem Est.")
    tab_margem_kg = tabview.add("Lucro/Kg")

    # ==================================================
    # ABA 1 — RELATÓRIO POR PERÍODO
    # ==================================================
    tab_periodo.grid_columnconfigure((0, 1), weight=1)
    
    ctk.CTkLabel(tab_periodo, text="DATA INICIAL", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_inicio = ctk.CTkEntry(tab_periodo, height=40, corner_radius=8)
    e_inicio.insert(0, (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"))
    e_inicio.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(tab_periodo, text="DATA FINAL", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    e_fim = ctk.CTkEntry(tab_periodo, height=40, corner_radius=8)
    e_fim.insert(0, datetime.now().strftime("%Y-%m-%d"))
    e_fim.grid(row=1, column=1, padx=15, pady=(5, 10), sticky="ew")

    lbl_resumo = ctk.CTkLabel(tab_periodo, text="Clique em Gerar para ver os dados...", font=ctk.CTkFont(size=16, weight="bold"), text_color=styles.CORES["primaria"])
    lbl_resumo.grid(row=3, column=0, columnspan=2, pady=30)

    def gerar_periodo():
        conn = db.conectar()
        v = conn.execute("SELECT SUM(valor) FROM vendas WHERE data BETWEEN ? AND ? AND status='ATIVA'", (e_inicio.get(), e_fim.get())).fetchone()[0] or 0
        c = conn.execute("SELECT SUM(valor) FROM compras WHERE data BETWEEN ? AND ?", (e_inicio.get(), e_fim.get())).fetchone()[0] or 0
        conn.close()
        
        lbl_resumo.configure(text=f"Faturamento: R$ {v:,.2f}  |  Investimento: R$ {c:,.2f}  |  Margem: R$ {(v-c):,.2f}")

    btn_periodo = ctk.CTkButton(tab_periodo, text="📊 GERAR RELATÓRIO", height=45, fg_color=styles.CORES["primaria"], command=gerar_periodo)
    btn_periodo.grid(row=2, column=0, columnspan=2, padx=15, pady=10, sticky="ew")

    # ==================================================
    # ABA 2 — RANKING DE PRODUTOS
    # ==================================================
    def gerar_ranking():
        conn = db.conectar()
        dados = conn.execute("SELECT produto, SUM(valor) as total FROM vendas WHERE status='ATIVA' GROUP BY produto ORDER BY total DESC LIMIT 5").fetchall()
        conn.close()
        
        if not dados: return
        
        nomes = [d[0] for d in dados]
        valores = [d[1] for d in dados]

        for widget in tab_ranking.winfo_children():
            widget.destroy()

        if plt is None or FigureCanvasTkAgg is None:
            texto = "\n".join(f"{nome}: R$ {valor:,.2f}" for nome, valor in dados)
            ctk.CTkLabel(
                tab_ranking,
                text=texto,
                font=ctk.CTkFont(size=14),
                text_color=styles.CORES["texto"],
            ).pack(fill="both", expand=True, padx=20, pady=20)
            return
        
        fig, ax = plt.subplots(figsize=(6, 3), dpi=100)
        ax.barh(nomes[::-1], valores[::-1], color="#3B82F6")
        ax.set_title("Vendas por Produto (R$)", fontsize=10, fontweight='bold', color="#1E293B")
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        plt.tight_layout()
        
        canvas = FigureCanvasTkAgg(fig, master=tab_ranking)
        canvas.get_tk_widget().pack(fill="both", expand=True, padx=20, pady=20)
        canvas.draw()

    btn_rank = ctk.CTkButton(tab_ranking, text="🔄 ATUALIZAR GRÁFICO", command=gerar_ranking)
    btn_rank.pack(pady=10)
    gerar_ranking()
    
    # ABA 3 — LISTA DE PRODUÇÃO RÁPIDA (Integração)
    # ==================================================
    import relatorios.producao as rel_prod # Import dinâmico
    rel_prod.view_relatorio_producao(tab_producao) # Reúsa a view antiga dentro da aba

    # ==================================================
    # ABA 4 — PRODUTIVIDADE POR PÉ
    # ==================================================
    import relatorios.producao_pe as rel_pe
    rel_pe.view_relatorio_producao_por_pe(tab_prod_pe)

    # ==================================================
    # ABA 5 — MARGEM ESTIMADA
    # ==================================================
    import relatorios.margem as rel_margem
    rel_margem.view_relatorio_margem(tab_margem)

    # ==================================================
    # ABA 6 — LUCRO POR KG
    # ==================================================
    import relatorios.margem_kg as rel_mkg
    rel_mkg.view_relatorio_margem_kg(tab_margem_kg)
