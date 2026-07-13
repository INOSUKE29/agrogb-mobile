# culturas.py
# Gerenciamento de Culturas com visual moderno CustomTkinter

import customtkinter as ctk
from tkinter import messagebox
import db
import styles

def view_culturas(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Gerenciamento de Áreas e Culturas", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ==========================
    # FORMULÁRIO (CARD)
    # ==========================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    form.grid_columnconfigure((0, 1), weight=1)

    ctk.CTkLabel(form, text="NOME DA CULTURA / ÁREA", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=30, pady=(20, 0))
    e_nome = ctk.CTkEntry(form, placeholder_text="Ex: Morango Estufa A...", height=45, corner_radius=8)
    e_nome.grid(row=1, column=0, padx=20, pady=(5, 30), sticky="ew")
    
    ctk.CTkLabel(form, text="OBSERVAÇÃO GERAL", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=30, pady=(20, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas sobre este plantio...", height=45, corner_radius=8)
    e_obs.grid(row=1, column=1, padx=20, pady=(5, 30), sticky="ew")

    # ==========================
    # BOTÕES
    # ==========================
    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    selecionado_id = {"id": None}

    def limpar():
        selecionado_id["id"] = None
        e_nome.delete(0, 'end'); e_obs.delete(0, 'end')

    def atualizar_lista():
        lista.delete(0, 'end')
        conn = db.conectar()
        for c in conn.execute("SELECT id, nome, observacao FROM culturas WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome"):
            lista.insert('end', f"{str(c[0]).zfill(3)} | {str(c[1]).ljust(30)} | {c[2] or ''}")
        conn.close()

    btn_excluir = ctk.CTkButton(botoes, text="🗑 EXCLUIR CULTURA", fg_color=styles.CORES["erro"], hover_color="#B91C1C", 
                                font=ctk.CTkFont(weight="bold"), height=45, width=180, command=lambda: excluir())
    btn_excluir.pack(side="left")

    btn_salvar = ctk.CTkButton(botoes, text="✨ SALVAR CULTURA", fg_color=styles.CORES["sucesso"], hover_color="#059669",
                              font=ctk.CTkFont(weight="bold"), height=45, width=220, command=lambda: salvar())
    btn_salvar.pack(side="right")

    # ==========================
    # LISTA
    # ==========================
    ctk.CTkLabel(t, text="Culturas Cadastradas:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(0, 10))

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
        partes = item.split(" | ")
        selecionado_id["id"] = int(partes[0])
        e_nome.delete(0, 'end'); e_nome.insert(0, partes[1].strip())
        e_obs.delete(0, 'end'); e_obs.insert(0, partes[2] if len(partes) > 2 else "")

    lista.bind("<<ListboxSelect>>", selecionar)
    atualizar_lista()

    def salvar():
        nome, obs = e_nome.get().strip(), e_obs.get().strip()
        if not nome: messagebox.showerror("Erro", "Nome da cultura é obrigatório"); return
        conn = db.conectar()
        try:
            if selecionado_id["id"]:
                conn.execute(
                    "UPDATE culturas SET nome=?, observacao=?, last_updated=?, sync_status=0 WHERE id=?",
                    (nome, obs, db.now_iso(), selecionado_id["id"]),
                )
            else:
                conn.execute(
                    "INSERT INTO culturas (uuid, nome, observacao, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, 0, 0)",
                    (db.new_uuid(), nome, obs, db.now_iso()),
                )
            conn.commit()
            messagebox.showinfo("Sucesso", "Cultura gravada!"); limpar(); atualizar_lista()
        except: messagebox.showerror("Erro", "Falha ao salvar cultura.")
        finally: conn.close()

    def excluir():
        if not selecionado_id["id"]: messagebox.showwarning("Atenção", "Selecione uma cultura."); return
        if messagebox.askyesno("Confirmação", "Deseja remover esta cultura permanentemente?"):
            db.soft_delete("culturas", selecionado_id["id"])
            limpar(); atualizar_lista()
