# relatorios/margem_kg.py
# Relatório de Margem por KG com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_relatorio_margem_kg(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Métrica de Margem/Lucro por KG", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # Container Rolável
    scroll = ctk.CTkScrollableFrame(t, fg_color="transparent")
    scroll.pack(fill="both", expand=True)

    def atualizar():
        for widget in scroll.winfo_children(): widget.destroy()
        
        conn = db.conectar()
        produtos = conn.execute("SELECT DISTINCT produto FROM vendas").fetchall()
        
        if not produtos:
             ctk.CTkLabel(scroll, text="Nenhum dado disponível.", text_color="gray").pack(pady=20)

        for p in produtos:
            nome = p[0]
            if not nome: continue
            
            # Vendas
            vendas = conn.execute("SELECT SUM(valor), SUM(quantidade) FROM vendas WHERE produto=? AND status='ATIVA'", (nome,)).fetchone()
            receita = vendas[0] or 0
            qtd_vendida = vendas[1] or 0
            preco_medio = receita / qtd_vendida if qtd_vendida > 0 else 0
            
            # Custos e Produção (Estimativa)
            termo = nome.split()[0]
            custo_total = conn.execute("SELECT SUM(valor) FROM compras WHERE cultura LIKE ?", (f"%{termo}%",)).fetchone()[0] or 0
            producao_total = conn.execute("SELECT SUM(producao_total) FROM colheita WHERE cultura LIKE ?", (f"%{termo}%",)).fetchone()[0] or 0
            
            custo_kg = custo_total / producao_total if producao_total > 0 else 0
            
            # Lucro por Kg (Preço de Venda Real - Custo de Produção Real)
            lucro_kg = preco_medio - custo_kg
            cor_lucro = "#16A34A" if lucro_kg >= 0 else "#DC2626"

            # CARD
            card = ctk.CTkFrame(scroll, fg_color=styles.CORES["card"], corner_radius=10, border_width=1, border_color=styles.CORES["borda"][0])
            card.pack(fill="x", pady=5, padx=5)
            card.grid_columnconfigure((1, 2, 3), weight=1)
            
            # 1. Produto Header
            ctk.CTkLabel(card, text=nome, font=ctk.CTkFont(size=12, weight="bold"), 
                         text_color="#1E293B").grid(row=0, column=0, padx=15, pady=10, sticky="w")
            
            # 2. Dados Unitários
            info_frame = ctk.CTkFrame(card, fg_color="transparent")
            info_frame.grid(row=0, column=1, columnspan=2, sticky="ew")
            
            ctk.CTkLabel(info_frame, text=f"Preço Médio: R$ {preco_medio:.2f}", text_color=styles.CORES["primaria"], font=ctk.CTkFont(weight="bold")).pack(side="left", padx=10)
            ctk.CTkLabel(info_frame, text="|", text_color="gray").pack(side="left")
            ctk.CTkLabel(info_frame, text=f"Custo Prod: R$ {custo_kg:.2f}", text_color="#B91C1C", font=ctk.CTkFont(weight="bold")).pack(side="left", padx=10)
            
            # 3. Destaque Lucro
            destaque = ctk.CTkFrame(card, fg_color="transparent")
            destaque.grid(row=0, column=3, padx=15, pady=10, sticky="e")
            
            ctk.CTkLabel(destaque, text="LUCRO / KG", font=ctk.CTkFont(size=9), text_color="gray").pack(anchor="e")
            ctk.CTkLabel(destaque, text=f"R$ {lucro_kg:+.2f}", font=ctk.CTkFont(size=15, weight="bold"), text_color=cor_lucro).pack(anchor="e")

        conn.close()

    atualizar()
