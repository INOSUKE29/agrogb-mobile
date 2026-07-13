# fertirrigacao.py
# Registro de fertirrigação compatível com o app mobile.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

import db
import styles


def view_fertirrigacao(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(t, text="Fertirrigação", font=ctk.CTkFont(size=24, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

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

    label("FÓRMULA / MISTURA", 0, 1)
    e_formula = ctk.CTkEntry(form, placeholder_text="Ex: NPK + Ca", height=40, corner_radius=8)
    e_formula.grid(row=1, column=1, columnspan=2, padx=15, pady=(5, 12), sticky="ew")

    label("ÁGUA (L)", 0, 3)
    e_agua = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_agua.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    label("DOSAGEM (KG)", 0, 4)
    e_dosagem = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_dosagem.grid(row=1, column=4, padx=15, pady=(5, 12), sticky="ew")

    label("DATA", 2, 0)
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=3, column=0, padx=15, pady=(5, 18), sticky="ew")

    label("STATUS", 2, 1)
    combo_status = ctk.CTkComboBox(form, values=["PLANEJADO", "CONCLUIDO", "CANCELADO"], height=40, corner_radius=8)
    combo_status.set("CONCLUIDO")
    combo_status.grid(row=3, column=1, padx=15, pady=(5, 18), sticky="ew")

    label("OBSERVAÇÃO", 2, 2)
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas da aplicação", height=40, corner_radius=8)
    e_obs.grid(row=3, column=2, columnspan=3, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def data_iso(value):
        return datetime.strptime(value.strip(), "%d-%m-%Y").strftime("%Y-%m-%d")

    def limpar():
        selecionado["id"] = None
        combo_talhao.set("Sem talhão")
        e_formula.delete(0, "end")
        e_agua.delete(0, "end")
        e_dosagem.delete(0, "end")
        e_obs.delete(0, "end")
        e_data.delete(0, "end")
        e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
        combo_status.set("CONCLUIDO")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR FERTIRRIGAÇÃO", height=45, width=250, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT f.id, f.data, COALESCE(t.nome, ''), f.formula, f.volume_agua_l, f.dosagem_insumo_kg, f.status
            FROM fertirrigacao f
            LEFT JOIN talhoes t ON t.uuid = f.talhao_uuid
            WHERE COALESCE(f.is_deleted, 0) = 0
            ORDER BY f.data DESC, f.id DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for r in rows:
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {r[1]} | {str(r[2]).ljust(24)} | {str(r[3] or '').ljust(28)} | {r[4] or 0} L | {r[5] or 0} kg | {r[6]}")

    def salvar():
        talhao_uuid = talhao_por_nome.get(combo_talhao.get())
        if not talhao_uuid:
            messagebox.showerror("Erro", "Selecione um talhão.")
            return
        try:
            agua = float(e_agua.get().replace(",", ".")) if e_agua.get().strip() else None
            dosagem = float(e_dosagem.get().replace(",", ".")) if e_dosagem.get().strip() else None
            data = data_iso(e_data.get())
        except ValueError:
            messagebox.showerror("Erro", "Água, dosagem ou data inválidos.")
            return
        values = (talhao_uuid, e_formula.get().strip(), agua, dosagem, data, combo_status.get(), e_obs.get().strip(), db.now_iso())
        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE fertirrigacao
                    SET talhao_uuid=?, formula=?, volume_agua_l=?, dosagem_insumo_kg=?, data=?,
                        status=?, observacao=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO fertirrigacao
                    (uuid, talhao_uuid, formula, volume_agua_l, dosagem_insumo_kg, data, status,
                     observacao, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Fertirrigação salva.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def selecionar(event):
        if not lista.curselection():
            return
        fid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("SELECT id, talhao_uuid, formula, volume_agua_l, dosagem_insumo_kg, data, status, observacao FROM fertirrigacao WHERE id=?", (fid,)).fetchone()
        talhao = conn.execute("SELECT nome FROM talhoes WHERE uuid=?", (row[1],)).fetchone() if row else None
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            combo_talhao.set(talhao[0] if talhao else "Sem talhão")
            e_formula.insert(0, row[2] or "")
            e_agua.insert(0, "" if row[3] is None else str(row[3]))
            e_dosagem.insert(0, "" if row[4] is None else str(row[4]))
            e_data.delete(0, "end")
            try:
                e_data.insert(0, datetime.strptime(row[5], "%Y-%m-%d").strftime("%d-%m-%Y"))
            except Exception:
                e_data.insert(0, row[5] or "")
            combo_status.set(row[6] or "CONCLUIDO")
            e_obs.insert(0, row[7] or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um registro.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover esta fertirrigação?"):
            db.soft_delete("fertirrigacao", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
