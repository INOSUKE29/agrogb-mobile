# monitoramento.py
# Registro simples de monitoramento de campo compatível com a tabela mobile base.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

import db
import styles


def view_monitoramento(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(t, text="Monitoramento de Campo", font=ctk.CTkFont(size=24, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    def carregar_culturas():
        conn = db.conectar()
        rows = conn.execute("SELECT nome FROM culturas WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return [r[0] for r in rows]

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(4):
        form.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(form, text="CULTURA / ÁREA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(18, 0))
    combo_cultura = ctk.CTkComboBox(form, values=carregar_culturas() or ["Geral"], height=40, corner_radius=8)
    combo_cultura.set("Geral")
    combo_cultura.grid(row=1, column=0, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="DATA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(18, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=1, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Sintomas, estágio, alerta, recomendação", height=40, corner_radius=8)
    e_obs.grid(row=3, column=0, columnspan=4, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"uuid": None}

    def data_iso(value):
        return datetime.strptime(value.strip(), "%d-%m-%Y").strftime("%Y-%m-%d")

    def limpar():
        selecionado["uuid"] = None
        combo_cultura.set("Geral")
        e_obs.delete(0, "end")
        e_data.delete(0, "end")
        e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR MONITORAMENTO", height=45, width=260, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    rows_cache = []

    def atualizar_lista():
        nonlocal rows_cache
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows_cache = conn.execute("""
            SELECT uuid, data, cultura, observacao
            FROM monitoramento
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY data DESC, last_updated DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for idx, r in enumerate(rows_cache, start=1):
            lista.insert(tk.END, f"{str(idx).zfill(3)} | {r[1] or ''} | {str(r[2] or '').ljust(24)} | {r[3] or ''}")

    def salvar():
        try:
            data = data_iso(e_data.get())
        except ValueError:
            messagebox.showerror("Erro", "Data inválida.")
            return
        values = (combo_cultura.get(), data, None, e_obs.get().strip(), db.now_iso())
        conn = db.conectar()
        try:
            if selecionado["uuid"]:
                conn.execute("""
                    UPDATE monitoramento
                    SET cultura=?, data=?, imagem_base64=?, observacao=?, last_updated=?, sync_status=0
                    WHERE uuid=?
                """, (*values, selecionado["uuid"]))
            else:
                conn.execute("""
                    INSERT INTO monitoramento
                    (uuid, cultura, data, imagem_base64, observacao, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Monitoramento salvo.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def selecionar(event):
        if not lista.curselection():
            return
        idx = lista.curselection()[0]
        row = rows_cache[idx]
        limpar()
        selecionado["uuid"] = row[0]
        e_data.delete(0, "end")
        try:
            e_data.insert(0, datetime.strptime(row[1], "%Y-%m-%d").strftime("%d-%m-%Y"))
        except Exception:
            e_data.insert(0, row[1] or "")
        combo_cultura.set(row[2] or "Geral")
        e_obs.insert(0, row[3] or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def excluir():
        if not selecionado["uuid"]:
            messagebox.showwarning("Atenção", "Selecione um registro.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover este monitoramento?"):
            conn = db.conectar()
            conn.execute("UPDATE monitoramento SET is_deleted=1, sync_status=0, last_updated=? WHERE uuid=?", (db.now_iso(), selecionado["uuid"]))
            conn.commit()
            conn.close()
            limpar()
            atualizar_lista()

    atualizar_lista()
