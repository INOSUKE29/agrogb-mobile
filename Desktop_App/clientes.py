# clientes.py
# Gestão de Clientes com visual moderno CustomTkinter

import customtkinter as ctk
from tkinter import messagebox
import db
import styles
import uuid
from datetime import datetime
import utils_whatsapp # Added this import at the top as it's used in a function

def view_clientes(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Gestão de Clientes / Compradores", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ======================
    # FORMULÁRIO (CARD)
    # ======================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    for i in range(3): form.grid_columnconfigure(i, weight=1)

    # Linha 1
    ctk.CTkLabel(form, text="NOME OU RAZÃO SOCIAL", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_nome = ctk.CTkEntry(form, placeholder_text="Nome completo...", height=40, corner_radius=8)
    e_nome.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="TELEFONE / WHATSAPP", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    e_fone = ctk.CTkEntry(form, placeholder_text="(00) 00000-0000", height=40, corner_radius=8)
    e_fone.grid(row=1, column=1, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="CPF OU CNPJ", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(20, 0))
    e_doc = ctk.CTkEntry(form, placeholder_text="000.000.000-00", height=40, corner_radius=8)
    e_doc.grid(row=1, column=2, padx=15, pady=(5, 10), sticky="ew")

    # Linha 2
    ctk.CTkLabel(form, text="ENDEREÇO DE ENTREGA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    e_end = ctk.CTkEntry(form, placeholder_text="Rua, Número, Bairro...", height=40, corner_radius=8)
    e_end.grid(row=3, column=0, columnspan=2, padx=15, pady=(5, 25), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÕES", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=2, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas extras...", height=40, corner_radius=8)
    e_obs.grid(row=3, column=2, padx=15, pady=(5, 25), sticky="ew")

    # ======================
    # BOTÕES
    # ======================
    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    selecionado_id = {"id": None}

    def limpar():
        selecionado_id["id"] = None
        for e in (e_nome, e_fone, e_doc, e_end, e_obs): e.delete(0, 'end')

    def atualizar_lista():
        lista.delete(0, 'end')
        conn = db.conectar()
        for r in conn.execute("SELECT id, nome, telefone, cpf_cnpj, endereco, observacao FROM clientes WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome"):
            lista.insert('end', f"{str(r[0]).zfill(3)} | {str(r[1]).ljust(30)} | {str(r[2]).ljust(15)} | {r[3]}")
        conn.close()

    btn_del = ctk.CTkButton(botoes, text="🗑 EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir())
    btn_del.pack(side="left")

    btn_lip = ctk.CTkButton(botoes, text="🧹 LIMPAR", height=45, width=120, fg_color="#64748B", hover_color="#475569", font=ctk.CTkFont(weight="bold"), command=limpar)
    btn_lip.pack(side="right", padx=10)

    btn_save = ctk.CTkButton(botoes, text="✨ SALVAR CLIENTE", height=45, width=200, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar())
    btn_save.pack(side="right")

    # ======================
    # LISTA
    # ======================
    import ui_components
    
    # LISTA MODERNA
    ctk.CTkLabel(t, text="Clientes Cadastrados:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

    frame_lista = ctk.CTkFrame(t, fg_color="transparent")
    frame_lista.pack(fill="both", expand=True)

    def selecionar_cliente(item_data):
        cid = item_data["id"]
        conn = db.conectar()
        r = conn.execute("SELECT id, nome, telefone, endereco, cpf_cnpj, observacao FROM clientes WHERE id=?", (cid,)).fetchone()
        conn.close()
        if r:
            limpar(); selecionado_id["id"] = r[0]
            e_nome.insert(0, r[1])
            e_fone.insert(0, r[2] or "")
            e_end.insert(0, r[3] or "")
            e_doc.insert(0, r[4] or "")
            e_obs.insert(0, r[5] or "")

    lista = ui_components.ModernList(frame_lista, command=selecionar_cliente)
    lista.pack(fill="both", expand=True)

    def atualizar_lista():
        lista.clear()
        conn = db.conectar()
        res = conn.execute("SELECT id, nome, telefone, cpf_cnpj, endereco, observacao FROM clientes WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        
        for r in res:
            sub = f"📞 {r[2]}  |  📄 {r[3]}" if r[2] else f"📄 {r[3]}"
            lista.add_item(
                id_val=r[0],
                title=r[1],
                subtitle=sub,
                icon_path="assets/clientes_color.png"
            )
    
    atualizar_lista()

    def salvar():
        nome = e_nome.get().strip()
        if not nome: messagebox.showerror("Erro", "Nome é obrigatório"); return
        conn = db.conectar()
        try:
            uid = str(uuid.uuid4())
            ts = db.now_iso()
            if selecionado_id["id"]:
                conn.execute("UPDATE clientes SET nome=?, telefone=?, endereco=?, cpf_cnpj=?, observacao=?, last_updated=?, sync_status=0 WHERE id=?",
                             (nome, e_fone.get(), e_end.get(), e_doc.get(), e_obs.get(), ts, selecionado_id["id"]))
            else:
                conn.execute("INSERT INTO clientes (uuid, nome, telefone, endereco, cpf_cnpj, observacao, last_updated, sync_status, is_deleted) VALUES (?,?,?,?,?,?,?,0,0)",
                             (uid, nome, e_fone.get(), e_end.get(), e_doc.get(), e_obs.get(), ts))
            conn.commit()
            messagebox.showinfo("Sucesso", "Cliente registrado!"); limpar(); atualizar_lista()
        except: messagebox.showerror("Erro", "Falha técnica ao salvar.")
        finally: conn.close()

    def excluir():
        if not selecionado_id["id"]: return
        if messagebox.askyesno("Confirmação", "Deseja remover este cliente?"):
            db.soft_delete("clientes", selecionado_id["id"])
            limpar(); atualizar_lista()

    t.bind("<Return>", lambda e: salvar())
