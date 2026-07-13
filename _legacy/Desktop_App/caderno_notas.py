# caderno_notas.py
# Caderno de campo simples e sincronizável.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

import db
import styles


def view_caderno_notas(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(t, text="Caderno de Campo", font=ctk.CTkFont(size=24, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(4):
        form.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(form, text="TÍTULO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(18, 0))
    e_titulo = ctk.CTkEntry(form, placeholder_text="Resumo da anotação", height=40, corner_radius=8)
    e_titulo.grid(row=1, column=0, columnspan=2, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="CATEGORIA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(18, 0))
    combo_categoria = ctk.CTkComboBox(form, values=["GERAL", "MANEJO", "PRAGA", "CLIMA", "EQUIPE", "FINANCEIRO"], height=40, corner_radius=8)
    combo_categoria.set("GERAL")
    combo_categoria.grid(row=1, column=2, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="DATA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(18, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="CONTEÚDO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    txt_conteudo = ctk.CTkTextbox(form, height=130, corner_radius=8, border_width=1, border_color=styles.CORES["borda"][0])
    txt_conteudo.grid(row=3, column=0, columnspan=4, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def data_iso(value):
        return datetime.strptime(value.strip(), "%d-%m-%Y").strftime("%Y-%m-%d")

    def limpar():
        selecionado["id"] = None
        e_titulo.delete(0, "end")
        txt_conteudo.delete("1.0", "end")
        combo_categoria.set("GERAL")
        e_data.delete(0, "end")
        e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR NOTA", height=45, width=200, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT id, data, categoria, titulo
            FROM caderno_notas
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY data DESC, id DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for r in rows:
            try:
                d_br = datetime.strptime(r[1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except Exception:
                d_br = r[1]
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {d_br} | {str(r[2]).ljust(12)} | {r[3]}")

    def salvar():
        titulo = e_titulo.get().strip()
        conteudo = txt_conteudo.get("1.0", "end").strip()
        if not titulo:
            messagebox.showerror("Erro", "Título é obrigatório.")
            return
        try:
            data = data_iso(e_data.get())
        except ValueError:
            messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY).")
            return

        values = (titulo, conteudo, data, combo_categoria.get(), db.now_iso())
        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE caderno_notas
                    SET titulo=?, conteudo=?, data=?, categoria=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO caderno_notas
                    (uuid, titulo, conteudo, data, categoria, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Nota salva.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def selecionar(event):
        if not lista.curselection():
            return
        nid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("SELECT id, titulo, conteudo, data, categoria FROM caderno_notas WHERE id=?", (nid,)).fetchone()
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            e_titulo.insert(0, row[1] or "")
            txt_conteudo.insert("1.0", row[2] or "")
            try:
                e_data.delete(0, "end")
                e_data.insert(0, datetime.strptime(row[3], "%Y-%m-%d").strftime("%d-%m-%Y"))
            except Exception:
                e_data.insert(0, row[3] or "")
            combo_categoria.set(row[4] or "GERAL")

    lista.bind("<<ListboxSelect>>", selecionar)

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione uma nota.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover esta nota?"):
            db.soft_delete("caderno_notas", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
