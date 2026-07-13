# equipes.py
# Cadastro de equipe operacional compatível com o app mobile.

import customtkinter as ctk
from tkinter import messagebox

import db
import styles


def view_equipes(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(
        t,
        text="Equipes",
        font=ctk.CTkFont(size=24, weight="bold"),
        text_color=styles.CORES["texto"],
    ).pack(pady=(10, 20), anchor="w")

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(4):
        form.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(form, text="NOME", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(18, 0))
    e_nome = ctk.CTkEntry(form, placeholder_text="Nome do colaborador", height=40, corner_radius=8)
    e_nome.grid(row=1, column=0, columnspan=2, padx=15, pady=(5, 18), sticky="ew")

    ctk.CTkLabel(form, text="CARGO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(18, 0))
    combo_cargo = ctk.CTkComboBox(form, values=["GERENTE", "CAPATAZ", "OPERADOR", "AUXILIAR", "TECNICO"], height=40, corner_radius=8)
    combo_cargo.set("OPERADOR")
    combo_cargo.grid(row=1, column=2, padx=15, pady=(5, 18), sticky="ew")

    ctk.CTkLabel(form, text="DOCUMENTO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(18, 0))
    e_doc = ctk.CTkEntry(form, placeholder_text="CPF/RG", height=40, corner_radius=8)
    e_doc.grid(row=1, column=3, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def limpar():
        selecionado["id"] = None
        e_nome.delete(0, "end")
        e_doc.delete(0, "end")
        combo_cargo.set("OPERADOR")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR EQUIPE", height=45, width=210, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT id, nome, cargo, documento, status
            FROM equipes
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY nome
        """).fetchall()
        conn.close()
        for r in rows:
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {str(r[1]).ljust(34)} | {str(r[2]).ljust(12)} | {r[3] or ''} | {r[4]}")

    def selecionar(event):
        if not lista.curselection():
            return
        eid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("SELECT id, nome, cargo, documento FROM equipes WHERE id=?", (eid,)).fetchone()
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            e_nome.insert(0, row[1] or "")
            combo_cargo.set(row[2] or "OPERADOR")
            e_doc.insert(0, row[3] or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def salvar():
        nome = e_nome.get().strip()
        if not nome:
            messagebox.showerror("Erro", "Nome é obrigatório.")
            return
        values = (nome, combo_cargo.get(), e_doc.get().strip(), "ATIVO", db.now_iso())
        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE equipes
                    SET nome=?, cargo=?, documento=?, status=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO equipes
                    (uuid, nome, cargo, documento, status, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Equipe salva.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um registro.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover este colaborador?"):
            db.soft_delete("equipes", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
