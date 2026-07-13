# relatorios/margem.py
# Relatório de Margem de Lucro com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_relatorio_margem(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Relatório de Margem de Lucro Estimada", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # Container Rolável
    scroll = ctk.CTkScrollableFrame(t, fg_color="transparent")
    scroll.pack(fill="both", expand=True)

    def atualizar():
        for widget in scroll.winfo_children(): widget.destroy()
        
        conn = db.conectar()
        produtos = conn.execute("SELECT DISTINCT produto FROM vendas").fetchall()
        
        if not produtos:
            ctk.CTkLabel(scroll, text="Nenhuma venda registrada.", text_color="gray").pack(pady=20)

        for p in produtos:
            nome = p[0]
            if not nome: continue
            
            receita = conn.execute("SELECT SUM(valor) FROM vendas WHERE produto=? AND status='ATIVA'", (nome,)).fetchone()[0] or 0
            # Estimativa simples de custo baseada no nome
            termo_busca = nome.split()[0]
            custo = conn.execute("SELECT SUM(valor) FROM compras WHERE cultura LIKE ?", (f"%{termo_busca}%",)).fetchone()[0] or 0
            
            margem = receita - custo
            porcento = (margem / receita * 100) if receita > 0 else 0
            
            # Cores
            cor_margem = "#16A34A" if margem >= 0 else "#DC2626" # Verde ou Vermelho
            
            # CARD
            card = ctk.CTkFrame(scroll, fg_color=styles.CORES["card"], corner_radius=10, border_width=1, border_color=styles.CORES["borda"][0])
            card.pack(fill="x", pady=5, padx=5)
            card.grid_columnconfigure((1, 2, 3), weight=1)
            
            # 1. Produto
            ctk.CTkLabel(card, text=nome, font=ctk.CTkFont(size=13, weight="bold"), 
                         text_color="#1E293B").grid(row=0, column=0, padx=15, pady=15, sticky="w")
            
            # 2. Receita
            f_rec = ctk.CTkFrame(card, fg_color="transparent")
            f_rec.grid(row=0, column=1)
            ctk.CTkLabel(f_rec, text="Receita", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_rec, text=f"R$ {receita:,.2f}", font=ctk.CTkFont(size=12, weight="bold"), text_color="#15803D").pack()
            
            # 3. Custo Est.
            f_cus = ctk.CTkFrame(card, fg_color="transparent")
            f_cus.grid(row=0, column=2)
            ctk.CTkLabel(f_cus, text="Custo Est.", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_cus, text=f"R$ {custo:,.2f}", font=ctk.CTkFont(size=12, weight="bold"), text_color="#B91C1C").pack()
            
            # 4. Margem
            f_mar = ctk.CTkFrame(card, fg_color="transparent")
            f_mar.grid(row=0, column=3, padx=10)
            ctk.CTkLabel(f_mar, text=f"{porcento:.1f}%", font=ctk.CTkFont(size=16, weight="bold"), text_color=cor_margem).pack()
            ctk.CTkLabel(f_mar, text=f"R$ {margem:,.2f}", font=ctk.CTkFont(size=10), text_color=cor_margem).pack()

        conn.close()

    atualizar()
