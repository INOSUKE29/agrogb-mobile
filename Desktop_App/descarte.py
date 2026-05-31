# descarte.py
# Registro de descarte (perdas) com visual moderno CustomTkinter

import customtkinter as ctk
from tkinter import messagebox
import db
import styles
from datetime import date, datetime

def view_descarte(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # Dados
    def carregar_produtos():
        conn = db.conectar()
        dados = conn.execute("SELECT nome FROM cadastro ORDER BY nome").fetchall()
        conn.close()
        return [d[0] for d in dados]

    produtos_list = carregar_produtos()

    # HEADER
    ctk.CTkLabel(t, text="Registro de Perdas e Descarte", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ==========================
    # FORMULÁRIO (CARD)
    # ==========================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    form.grid_columnconfigure((0, 1, 2, 3), weight=1)

    ctk.CTkLabel(form, text="DATA REGISTRO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, date.today().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=0, padx=15, pady=(5, 30), sticky="ew")

    ctk.CTkLabel(form, text="PRODUTO / ITEM", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    combo_prod = ctk.CTkComboBox(form, values=produtos_list, height=40, corner_radius=8)
    combo_prod.set("Selecionar...")
    combo_prod.grid(row=1, column=1, padx=15, pady=(5, 30), sticky="ew")

    ctk.CTkLabel(form, text="QUANTIDADE (KG)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(20, 0))
    e_qtd = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_qtd.grid(row=1, column=2, padx=15, pady=(5, 30), sticky="ew")

    ctk.CTkLabel(form, text="MOTIVO DO DESCARTE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(20, 0))
    e_motivo = ctk.CTkEntry(form, placeholder_text="Ex: Pragas, podridão...", height=40, corner_radius=8)
    e_motivo.grid(row=1, column=3, padx=15, pady=(5, 30), sticky="ew")

    # ==========================
    # BOTÕES
    # ==========================
    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    selecionado_id = {"id": None}

    def limpar():
        selecionado_id["id"] = None
        e_qtd.delete(0, 'end'); e_motivo.delete(0, 'end')

    def atualizar_lista():
        lista.delete(0, 'end')
        conn = db.conectar()
        for d in conn.execute("SELECT id, data, produto, quantidade_kg, motivo FROM descarte WHERE COALESCE(is_deleted, 0) = 0 ORDER BY data DESC LIMIT 50"):
            lista.insert('end', f"{str(d[0]).zfill(3)} | {d[1]} | {str(d[2]).ljust(25)} | {d[3]:>8.2f} kg | {d[4]}")
        conn.close()

    btn_excluir = ctk.CTkButton(botoes, text="🗑 EXCLUIR REGISTRO", fg_color=styles.CORES["erro"], hover_color="#B91C1C", 
                                font=ctk.CTkFont(weight="bold"), height=45, width=180, command=lambda: excluir())
    btn_excluir.pack(side="left")

    btn_salvar = ctk.CTkButton(botoes, text="✨ SALVAR DESCARTE", fg_color=styles.CORES["sucesso"], hover_color="#059669",
                              font=ctk.CTkFont(weight="bold"), height=45, width=220, command=lambda: salvar())
    btn_salvar.pack(side="right")

    # ==========================
    # LISTA
    # ==========================
    ctk.CTkLabel(t, text="Histórico de Descarte:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

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

    def selecionar(event):
        if not lista.curselection(): return
        item = lista.get(lista.curselection()[0])
        selecionado_id["id"] = int(item.split(" | ")[0])

    lista.bind("<<ListboxSelect>>", selecionar)
    atualizar_lista()

    def salvar():
        prod, raw_qtd = combo_prod.get(), e_qtd.get()
        if prod == "Selecionar..." or not raw_qtd: messagebox.showerror("Erro", "Escolha o produto e a quantidade"); return
        try: qtd = float(raw_qtd.replace(",", "."))
        except: messagebox.showerror("Erro", "Quantidade inválida"); return
        
        try: d_iso = datetime.strptime(e_data.get(), "%d-%m-%Y").strftime("%Y-%m-%d")
        except: messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY)"); return

        conn = db.conectar()
        try:
            conn.execute("""
                INSERT INTO descarte (uuid, produto, data, quantidade_kg, motivo, last_updated, sync_status, is_deleted)
                VALUES (?, ?, ?, ?, ?, ?, 0, 0)
            """, (db.new_uuid(), prod, d_iso, qtd, e_motivo.get(), db.now_iso()))
            conn.commit()
            messagebox.showinfo("Sucesso", "Descarte registrado!"); limpar(); atualizar_lista()
        except: messagebox.showerror("Erro", "Erro ao gravar no banco.")
        finally: conn.close()

    def excluir():
        if not selecionado_id["id"]: messagebox.showwarning("Atenção", "Selecione um item."); return
        if messagebox.askyesno("Confirmação", "Deseja remover este registro?"):
            db.soft_delete("descarte", selecionado_id["id"])
            selecionado_id["id"] = None; atualizar_lista()

    t.bind("<Return>", lambda e: salvar())
