# plantio.py
# Registro de Plantio com visual moderno CustomTkinter

import customtkinter as ctk
from tkinter import messagebox
import db
import styles
from datetime import datetime

def view_plantio(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # Dados
    def carregar_culturas():
        conn = db.conectar()
        dados = conn.execute("SELECT nome FROM culturas ORDER BY nome").fetchall()
        conn.close()
        return [d[0] for d in dados]

    culturas_list = carregar_culturas()
    
    # HEADER
    ctk.CTkLabel(t, text="Registro de Plantio (Produção)", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ==========================
    # FORMULÁRIO (CARD)
    # ==========================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    for i in range(4): form.grid_columnconfigure(i, weight=1)

    # Linha 1
    ctk.CTkLabel(form, text="CULTURA / ÁREA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    combo_cultura = ctk.CTkComboBox(form, values=culturas_list, height=40, corner_radius=8)
    combo_cultura.set("Selecionar...")
    combo_cultura.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="QUANTIDADE PÉS", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    e_qtd = ctk.CTkEntry(form, placeholder_text="0", height=40, corner_radius=8)
    e_qtd.grid(row=1, column=1, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="TIPO PLANTIO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(20, 0))
    combo_tipo = ctk.CTkComboBox(form, values=["Comprada", "Própria", "Replantio"], height=40, corner_radius=8)
    combo_tipo.set("Comprada")
    combo_tipo.grid(row=1, column=2, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="DATA (DD-MM-YYYY)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(20, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=3, padx=15, pady=(5, 10), sticky="ew")

    # Linha 2
    ctk.CTkLabel(form, text="OBSERVAÇÕES DO LOTE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas extras sobre este plantio...", height=40, corner_radius=8)
    e_obs.grid(row=3, column=0, columnspan=4, padx=15, pady=(5, 25), sticky="ew")

    # ==========================
    # BOTÕES
    # ==========================
    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    selecionado_id = {"id": None}

    def limpar():
        selecionado_id["id"] = None
        e_qtd.delete(0, 'end'); e_obs.delete(0, 'end'); combo_cultura.set("Selecionar...")
        e_data.delete(0, 'end'); e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))

    def atualizar_lista():
        lista.delete(0, 'end')
        conn = db.conectar()
        for p in conn.execute("SELECT id, data, cultura, tipo_plantio, quantidade_pes FROM plantio WHERE COALESCE(is_deleted, 0) = 0 ORDER BY data DESC"):
            try: d_br = datetime.strptime(p[1], '%Y-%m-%d').strftime('%d/%m/%Y')
            except: d_br = p[1]
            lista.insert('end', f"{str(p[0]).zfill(3)} | {d_br} | {str(p[2]).ljust(30)} | {str(p[3]).center(15)} | {p[4]} pés")
        conn.close()

    btn_del = ctk.CTkButton(botoes, text="🗑 EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir())
    btn_del.pack(side="left")

    btn_save = ctk.CTkButton(botoes, text="✨ SALVAR PLANTIO", height=45, width=200, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar())
    btn_save.pack(side="right")

    # ==========================
    # LISTA
    # ==========================
    ctk.CTkLabel(t, text="Lotes em Produção:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True)

    import tkinter as tk
    scrollbar = tk.Scrollbar(frame_lista)
    scrollbar.pack(side="right", fill="y")
    
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white", yscrollcommand=scrollbar.set)
    lista.pack(fill="both", expand=True, padx=10, pady=10)
    scrollbar.config(command=lista.yview)

    def selecionar(event):
        if not lista.curselection(): return
        item = lista.get(lista.curselection()[0])
        pid = int(item.split(" | ")[0])
        conn = db.conectar()
        r = conn.execute("SELECT id, cultura, quantidade_pes, tipo_plantio, data, observacao FROM plantio WHERE id=?", (pid,)).fetchone()
        conn.close()
        if r:
            limpar(); selecionado_id["id"] = r[0]
            combo_cultura.set(r[1]); e_qtd.insert(0, str(r[2])); combo_tipo.set(r[3])
            try: d_bt = datetime.strptime(r[4], '%Y-%m-%d').strftime('%d-%m-%Y')
            except: d_bt = r[4]
            e_data.delete(0, 'end'); e_data.insert(0, d_bt); e_obs.insert(0, r[5] or "")

    lista.bind("<<ListboxSelect>>", selecionar)
    atualizar_lista()

    def salvar():
        try: d_iso = datetime.strptime(e_data.get(), "%d-%m-%Y").strftime("%Y-%m-%d")
        except: messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY)"); return
        
        cult = combo_cultura.get()
        if cult == "Selecionar...": messagebox.showerror("Erro", "Escolha a cultura"); return
        
        try: qtd = int(e_qtd.get())
        except: messagebox.showerror("Erro", "Quantidade deve ser inteiro"); return

        conn = db.conectar()
        try:
            if selecionado_id["id"]:
                conn.execute("""
                    UPDATE plantio
                    SET cultura=?, quantidade_pes=?, tipo_plantio=?, data=?, observacao=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (cult, qtd, combo_tipo.get(), d_iso, e_obs.get(), db.now_iso(), selecionado_id["id"]))
            else:
                conn.execute("""
                    INSERT INTO plantio (uuid, cultura, quantidade_pes, tipo_plantio, data, observacao, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), cult, qtd, combo_tipo.get(), d_iso, e_obs.get(), db.now_iso()))
            conn.commit()
            messagebox.showinfo("Sucesso", "Plantio registrado!"); limpar(); atualizar_lista()
        except: messagebox.showerror("Erro", "Erro ao gravar dados.")
        finally: conn.close()

    def excluir():
        if not selecionado_id["id"]: return
        if messagebox.askyesno("Confirmação", "Deseja remover este lote?"):
            db.soft_delete("plantio", selecionado_id["id"])
            limpar(); atualizar_lista()

    t.bind("<Return>", lambda e: salvar())
