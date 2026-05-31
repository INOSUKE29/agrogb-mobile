# relatorios/custo_detalhado.py
# Relatório de Custo por KG com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_relatorio_custo_por_kg(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Análise de Custo por Quilo", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # Tabela
    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True)

    import tkinter as tk
    scrollbar = tk.Scrollbar(frame_lista)
    scrollbar.pack(side="right", fill="y")
    
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0,
                       bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white",
                       yscrollcommand=scrollbar.set)
    lista.pack(fill="both", expand=True, padx=10, pady=10)
    scrollbar.config(command=lista.yview)

    def atualizar():
        lista.delete(0, 'end')
        conn = db.conectar()
        
        culturas = conn.execute("SELECT DISTINCT cultura FROM colheita").fetchall()
        
        for c in culturas:
            nome = c[0]
            if not nome: continue
            
            producao = conn.execute("SELECT SUM(producao_total) FROM colheita WHERE cultura=?", (nome,)).fetchone()[0] or 0
            custo = conn.execute("SELECT SUM(valor) FROM compras WHERE cultura=?", (nome,)).fetchone()[0] or 0
            
            c_kg = custo / producao if producao > 0 else 0
            
            lista.insert('end', f"{nome.upper().ljust(35)} | Produção: {producao:>10.2f} kg | Custo Total: R$ {custo:>10.2f} | CUSTO/KG: R$ {c_kg:>8.2f}")
        
        conn.close()

    atualizar()
