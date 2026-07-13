# fornecedores.py
# Cadastro de fornecedores compatível com o app mobile.

import customtkinter as ctk
from tkinter import messagebox

import db
import styles


def view_fornecedores(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(
        t,
        text="Fornecedores",
        font=ctk.CTkFont(size=24, weight="bold"),
        text_color=styles.CORES["texto"],
    ).pack(pady=(10, 20), anchor="w")

    form = ctk.CTkFrame(
        t,
        fg_color=styles.CORES["card"],
        corner_radius=15,
        border_width=1,
        border_color=styles.CORES["borda"][0],
    )
    form.pack(fill="x", pady=10)
    for i in range(4):
        form.grid_columnconfigure(i, weight=1)

    fields = {}

    def add_entry(label, key, row, col, colspan=1, placeholder=""):
        ctk.CTkLabel(
            form,
            text=label,
            font=ctk.CTkFont(size=11, weight="bold"),
            text_color=styles.CORES["texto_leve"],
        ).grid(row=row, column=col, sticky="w", padx=25, pady=(18, 0))
        entry = ctk.CTkEntry(form, placeholder_text=placeholder, height=40, corner_radius=8)
        entry.grid(row=row + 1, column=col, columnspan=colspan, padx=15, pady=(5, 12), sticky="ew")
        fields[key] = entry

    add_entry("NOME", "nome", 0, 0, 2, "Fornecedor ou empresa")
    add_entry("CONTATO", "contato", 0, 2, 1, "Pessoa responsável")
    add_entry("TELEFONE", "telefone", 0, 3, 1, "(00) 00000-0000")
    add_entry("EMAIL", "email", 2, 0, 1, "email@empresa.com")
    add_entry("OBSERVAÇÃO", "observacao", 2, 1, 3, "Condições, prazos, notas internas")

    selecionado = {"id": None}

    def limpar():
        selecionado["id"] = None
        for entry in fields.values():
            entry.delete(0, "end")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    btn_excluir = ctk.CTkButton(
        botoes,
        text="EXCLUIR",
        height=45,
        width=150,
        fg_color=styles.CORES["erro"],
        hover_color="#B91C1C",
        font=ctk.CTkFont(weight="bold"),
        command=lambda: excluir(),
    )
    btn_excluir.pack(side="left")

    btn_salvar = ctk.CTkButton(
        botoes,
        text="SALVAR FORNECEDOR",
        height=45,
        width=220,
        fg_color=styles.CORES["sucesso"],
        hover_color="#059669",
        font=ctk.CTkFont(weight="bold"),
        command=lambda: salvar(),
    )
    btn_salvar.pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(
        t,
        fg_color=styles.CORES["card"],
        corner_radius=15,
        border_width=1,
        border_color=styles.CORES["borda"][0],
    )
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))

    lista = tk.Listbox(
        frame_lista,
        font=("Inter", 11),
        relief="flat",
        bd=0,
        highlightthickness=0,
        bg="white",
        fg="#1E293B",
        selectbackground=styles.CORES["primaria"],
        selectforeground="white",
    )
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT id, nome, contato, telefone, email
            FROM fornecedores
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY nome
        """).fetchall()
        conn.close()
        for r in rows:
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {str(r[1]).ljust(32)} | {r[2] or ''} | {r[3] or ''} | {r[4] or ''}")

    def selecionar(event):
        if not lista.curselection():
            return
        fid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute(
            "SELECT id, nome, contato, telefone, email, observacao FROM fornecedores WHERE id=?",
            (fid,),
        ).fetchone()
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            for key, value in zip(("nome", "contato", "telefone", "email", "observacao"), row[1:]):
                fields[key].insert(0, value or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def salvar():
        nome = fields["nome"].get().strip()
        if not nome:
            messagebox.showerror("Erro", "Nome do fornecedor é obrigatório.")
            return

        values = (
            nome,
            fields["contato"].get().strip(),
            fields["telefone"].get().strip(),
            fields["email"].get().strip(),
            fields["observacao"].get().strip(),
            db.now_iso(),
        )

        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE fornecedores
                    SET nome=?, contato=?, telefone=?, email=?, observacao=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO fornecedores
                    (uuid, nome, contato, telefone, email, observacao, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Fornecedor salvo.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um fornecedor.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover este fornecedor?"):
            db.soft_delete("fornecedores", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
