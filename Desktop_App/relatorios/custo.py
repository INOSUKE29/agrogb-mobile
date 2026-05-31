# relatorios/custo.py
# Relatório de Custos Reais com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_relatorio_custo(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Relatório de Custos Reais por Cultura", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # Tabela (Scrollable Frame ou Listbox)
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
        
        culturas = conn.execute("SELECT DISTINCT cultura FROM plantio").fetchall()
        
        for c in culturas:
            nome = c[0]
            if not nome: continue
            
            pes = conn.execute("SELECT SUM(quantidade_pes) FROM plantio WHERE cultura=?", (nome,)).fetchone()[0] or 0
            # Vendas (Busca aproximada no nome do produto)
            vendido = conn.execute("SELECT SUM(quantidade) FROM vendas WHERE produto LIKE ?", (f"%{nome}%",)).fetchone()[0] or 0
            dsct = conn.execute("SELECT SUM(quantidade_kg) FROM descarte WHERE produto LIKE ?", (f"%{nome}%",)).fetchone()[0] or 0
            producao = vendido + dsct
            
            custo_total = conn.execute("SELECT SUM(valor) FROM compras WHERE cultura=?", (nome,)).fetchone()[0] or 0
            
            c_kg = custo_total / producao if producao > 0 else 0
            c_pe = custo_total / pes if pes > 0 else 0
            
            lista.insert('end', f"{nome.upper().ljust(25)} | Pés: {pes:>5} | Prod: {producao:>8.2f} kg | Custo T: R$ {custo_total:>10.2f} | C/Kg: R$ {c_kg:>6.2f} | C/Pé: R$ {c_pe:>7.4f}")
        
        conn.close()

    atualizar()
