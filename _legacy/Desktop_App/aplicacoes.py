# aplicacoes.py
# Registro de aplicações agrícolas compatível com o app mobile.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime, timedelta

import db
import styles


def view_aplicacoes(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(t, text="Aplicações", font=ctk.CTkFont(size=24, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    def carregar_talhoes():
        conn = db.conectar()
        rows = conn.execute("SELECT uuid, nome FROM talhoes WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return rows

    talhoes = carregar_talhoes()
    talhao_por_nome = {nome: uuid for uuid, nome in talhoes}

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(5):
        form.grid_columnconfigure(i, weight=1)

    def label(text, row, col):
        ctk.CTkLabel(form, text=text, font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=row, column=col, sticky="w", padx=25, pady=(18, 0))

    label("TALHÃO", 0, 0)
    combo_talhao = ctk.CTkComboBox(form, values=list(talhao_por_nome.keys()) or ["Sem talhão"], height=40, corner_radius=8)
    combo_talhao.set("Sem talhão")
    combo_talhao.grid(row=1, column=0, padx=15, pady=(5, 12), sticky="ew")

    label("PRODUTO", 0, 1)
    e_produto = ctk.CTkEntry(form, placeholder_text="Produto aplicado", height=40, corner_radius=8)
    e_produto.grid(row=1, column=1, columnspan=2, padx=15, pady=(5, 12), sticky="ew")

    label("PRAGA/ALVO", 0, 3)
    e_alvo = ctk.CTkEntry(form, placeholder_text="Alvo da aplicação", height=40, corner_radius=8)
    e_alvo.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    label("DATA", 0, 4)
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=4, padx=15, pady=(5, 12), sticky="ew")

    label("DOSE/HA", 2, 0)
    e_dose = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_dose.grid(row=3, column=0, padx=15, pady=(5, 18), sticky="ew")

    label("CALDA (L)", 2, 1)
    e_calda = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_calda.grid(row=3, column=1, padx=15, pady=(5, 18), sticky="ew")

    label("CARÊNCIA (DIAS)", 2, 2)
    e_carencia = ctk.CTkEntry(form, placeholder_text="0", height=40, corner_radius=8)
    e_carencia.grid(row=3, column=2, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def parse_date(value):
        return datetime.strptime(value.strip(), "%d-%m-%Y")

    def limpar():
        selecionado["id"] = None
        combo_talhao.set("Sem talhão")
        for entry in (e_produto, e_alvo, e_dose, e_calda, e_carencia):
            entry.delete(0, "end")
        e_data.delete(0, "end")
        e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR APLICAÇÃO", height=45, width=230, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT a.id, a.data, COALESCE(t.nome, ''), a.produto_nome, a.praga_alvo, a.data_liberacao
            FROM aplicacoes a
            LEFT JOIN talhoes t ON t.uuid = a.talhao_uuid
            WHERE COALESCE(a.is_deleted, 0) = 0
            ORDER BY a.data DESC, a.id DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for r in rows:
            try:
                d_br = datetime.strptime(r[1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except Exception:
                d_br = r[1]
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {d_br} | {str(r[2]).ljust(24)} | {str(r[3]).ljust(26)} | {r[4] or ''} | Lib: {r[5] or '-'}")

    def salvar():
        talhao_uuid = talhao_por_nome.get(combo_talhao.get())
        produto = e_produto.get().strip()
        if not talhao_uuid or not produto:
            messagebox.showerror("Erro", "Talhão e produto são obrigatórios.")
            return
        try:
            data = parse_date(e_data.get())
            dose = float(e_dose.get().replace(",", ".")) if e_dose.get().strip() else None
            calda = float(e_calda.get().replace(",", ".")) if e_calda.get().strip() else None
            carencia = int(e_carencia.get()) if e_carencia.get().strip() else 0
            data_liberacao = (data + timedelta(days=carencia)).strftime("%Y-%m-%d") if carencia else None
        except ValueError:
            messagebox.showerror("Erro", "Valores numéricos ou data inválidos.")
            return

        values = (talhao_uuid, produto, e_alvo.get().strip(), dose, calda, data.strftime("%Y-%m-%d"), carencia, data_liberacao, db.now_iso())
        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE aplicacoes
                    SET talhao_uuid=?, produto_nome=?, praga_alvo=?, dose_ha=?, volume_calda_l=?,
                        data=?, carencia_dias=?, data_liberacao=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO aplicacoes
                    (uuid, talhao_uuid, produto_nome, praga_alvo, dose_ha, volume_calda_l, data,
                     carencia_dias, data_liberacao, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Aplicação salva.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def selecionar(event):
        if not lista.curselection():
            return
        aid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("SELECT id, talhao_uuid, produto_nome, praga_alvo, dose_ha, volume_calda_l, data, carencia_dias FROM aplicacoes WHERE id=?", (aid,)).fetchone()
        talhao = conn.execute("SELECT nome FROM talhoes WHERE uuid=?", (row[1],)).fetchone() if row else None
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            combo_talhao.set(talhao[0] if talhao else "Sem talhão")
            e_produto.insert(0, row[2] or "")
            e_alvo.insert(0, row[3] or "")
            e_dose.insert(0, "" if row[4] is None else str(row[4]))
            e_calda.insert(0, "" if row[5] is None else str(row[5]))
            e_data.delete(0, "end")
            try:
                e_data.insert(0, datetime.strptime(row[6], "%Y-%m-%d").strftime("%d-%m-%Y"))
            except Exception:
                e_data.insert(0, row[6] or "")
            e_carencia.insert(0, "" if row[7] is None else str(row[7]))

    lista.bind("<<ListboxSelect>>", selecionar)

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione uma aplicação.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover esta aplicação?"):
            db.soft_delete("aplicacoes", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
