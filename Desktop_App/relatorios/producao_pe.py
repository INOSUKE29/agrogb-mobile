# relatorios/producao_pe.py
# Relatório de Produção por Pé com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_relatorio_producao_por_pe(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Produtividade por Pé (Safra)", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # Container Rolável (Substitui Listbox)
    scroll = ctk.CTkScrollableFrame(t, fg_color="transparent")
    scroll.pack(fill="both", expand=True)

    def atualizar():
        # Limpar
        for widget in scroll.winfo_children(): widget.destroy()
        
        conn = db.conectar()
        culturas = conn.execute("SELECT DISTINCT cultura FROM plantio").fetchall()
        
        if not culturas:
             ctk.CTkLabel(scroll, text="Nenhum dado de plantio encontrado.", text_color="gray").pack(pady=20)

        for c in culturas:
            nome = c[0]
            if not nome: continue
            
            pes = conn.execute("SELECT SUM(quantidade_pes) FROM plantio WHERE cultura=?", (nome,)).fetchone()[0] or 0
            producao = conn.execute("SELECT SUM(producao_total) FROM colheita WHERE cultura=?", (nome,)).fetchone()[0] or 0
            
            kg_por_pe = producao / pes if pes > 0 else 0
            
            # CARD
            card = ctk.CTkFrame(scroll, fg_color=styles.CORES["card"], corner_radius=10, border_width=1, border_color=styles.CORES["borda"][0])
            card.pack(fill="x", pady=5, padx=5)
            
            # Grid Layout do Card
            card.grid_columnconfigure((1, 2, 3), weight=1)
            
            # 1. Cultura
            ctk.CTkLabel(card, text=nome.upper(), font=ctk.CTkFont(size=14, weight="bold"), 
                         text_color=styles.CORES["primaria"]).grid(row=0, column=0, rowspan=2, padx=15, pady=10, sticky="w")
            
            # 2. Total Pés
            f_pes = ctk.CTkFrame(card, fg_color="transparent")
            f_pes.grid(row=0, column=1, padx=10, pady=5)
            ctk.CTkLabel(f_pes, text="Total Pés", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_pes, text=f"{pes:,.0f}", font=ctk.CTkFont(size=12, weight="bold")).pack()
            
            # 3. Produção Total
            f_prod = ctk.CTkFrame(card, fg_color="transparent")
            f_prod.grid(row=0, column=2, padx=10, pady=5)
            ctk.CTkLabel(f_prod, text="Prod. Total", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_prod, text=f"{producao:,.1f} kg", font=ctk.CTkFont(size=12, weight="bold")).pack()

            # 4. Média (Destaque)
            f_media = ctk.CTkFrame(card, fg_color=styles.CORES["fundo_claro"], corner_radius=6)
            f_media.grid(row=0, column=3, padx=15, pady=10, sticky="e")
            
            ctk.CTkLabel(f_media, text="MÉDIA / PÉ", font=ctk.CTkFont(size=9, weight="bold"), text_color=styles.CORES["primaria"]).pack(padx=10, pady=(5, 0))
            ctk.CTkLabel(f_media, text=f"{kg_por_pe:.3f} kg", font=ctk.CTkFont(size=14, weight="bold"), text_color="#059669").pack(padx=10, pady=(0, 5))

        conn.close()

    atualizar()
