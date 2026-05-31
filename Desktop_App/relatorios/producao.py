# relatorios/producao.py
# Relatório de Produção com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_relatorio_producao(parent):
    # Container (adaptado para ser embeddable se necessário)
    # Se parent for Tab, usaremos ele direto
    
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=10, pady=10) # Margem menor pois pode estar em aba

    # HEADER (Opcional, se estiver em aba talvez não precise, mas mantemos)
    ctk.CTkLabel(t, text="Produção Consolidada", font=ctk.CTkFont(size=20, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(0, 10), anchor="w")

    # Container Rolável
    scroll = ctk.CTkScrollableFrame(t, fg_color="transparent")
    scroll.pack(fill="both", expand=True)

    def atualizar():
        for widget in scroll.winfo_children(): widget.destroy()
        
        conn = db.conectar()
        dados = conn.execute("""
            SELECT cultura, SUM(producao_total), SUM(congelado_kg), SUM(descarte_kg)
            FROM colheita
            GROUP BY cultura
            ORDER BY producao_total DESC
        """).fetchall()
        
        if not dados:
             ctk.CTkLabel(scroll, text="Nenhum dado de produção encontrado.", text_color="gray").pack(pady=20)

        for d in dados:
            nome = d[0] or "N/A"
            total = d[1] or 0
            cong = d[2] or 0
            desc = d[3] or 0
            
            # CARD
            card = ctk.CTkFrame(scroll, fg_color=styles.CORES["card"], corner_radius=10, border_width=1, border_color=styles.CORES["borda"][0])
            card.pack(fill="x", pady=5, padx=5)
            card.grid_columnconfigure((1, 2, 3), weight=1)
            
            # 1. Cultura
            ctk.CTkLabel(card, text=nome.upper(), font=ctk.CTkFont(size=14, weight="bold"), 
                         text_color=styles.CORES["primaria"]).grid(row=0, column=0, padx=15, pady=10, sticky="w")
            
            # 2. Total
            f_tot = ctk.CTkFrame(card, fg_color="transparent")
            f_tot.grid(row=0, column=1)
            ctk.CTkLabel(f_tot, text="Total Colhido", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_tot, text=f"{total:,.1f} kg", font=ctk.CTkFont(size=13, weight="bold")).pack()
            
            # 3. Congelado
            f_cong = ctk.CTkFrame(card, fg_color="transparent")
            f_cong.grid(row=0, column=2)
            ctk.CTkLabel(f_cong, text="Congelado", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_cong, text=f"{cong:,.1f} kg", font=ctk.CTkFont(size=12, weight="bold"), text_color="#3B82F6").pack()

            # 4. Descarte
            f_desc = ctk.CTkFrame(card, fg_color="transparent")
            f_desc.grid(row=0, column=3, padx=10)
            ctk.CTkLabel(f_desc, text="Descarte", font=ctk.CTkFont(size=10), text_color="gray").pack()
            ctk.CTkLabel(f_desc, text=f"{desc:,.1f} kg", font=ctk.CTkFont(size=12, weight="bold"), text_color="#EF4444").pack()

        conn.close()

    atualizar()
