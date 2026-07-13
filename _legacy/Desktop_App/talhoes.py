# talhoes.py
# Gestão de talhões/áreas produtivas compatível com o app mobile.

import customtkinter as ctk
from tkinter import messagebox

import db
import styles


def view_talhoes(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(
        t,
        text="Talhões e Áreas",
        font=ctk.CTkFont(size=24, weight="bold"),
        text_color=styles.CORES["texto"],
    ).pack(pady=(10, 20), anchor="w")

    def carregar_culturas():
        conn = db.conectar()
        rows = conn.execute("""
            SELECT uuid, nome
            FROM culturas
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY nome
        """).fetchall()
        conn.close()
        return rows

    culturas = carregar_culturas()
    cultura_por_nome = {nome: uuid for uuid, nome in culturas}

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

    ctk.CTkLabel(form, text="NOME DO TALHÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(18, 0))
    e_nome = ctk.CTkEntry(form, placeholder_text="Ex: Estufa A", height=40, corner_radius=8)
    e_nome.grid(row=1, column=0, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="ÁREA (HA)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(18, 0))
    e_area = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_area.grid(row=1, column=1, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="CULTURA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(18, 0))
    combo_cultura = ctk.CTkComboBox(form, values=list(cultura_por_nome.keys()) or ["Sem cultura"], height=40, corner_radius=8)
    combo_cultura.set("Sem cultura")
    combo_cultura.grid(row=1, column=2, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="STATUS", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(18, 0))
    combo_status = ctk.CTkComboBox(form, values=["ATIVO", "DESCANSO", "MANUTENCAO", "INATIVO"], height=40, corner_radius=8)
    combo_status.set("ATIVO")
    combo_status.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas de manejo, localização, irrigação", height=40, corner_radius=8)
    e_obs.grid(row=3, column=0, columnspan=4, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def limpar():
        selecionado["id"] = None
        e_nome.delete(0, "end")
        e_area.delete(0, "end")
        e_obs.delete(0, "end")
        combo_cultura.set("Sem cultura")
        combo_status.set("ATIVO")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    ctk.CTkButton(
        botoes,
        text="EXCLUIR",
        height=45,
        width=150,
        fg_color=styles.CORES["erro"],
        hover_color="#B91C1C",
        font=ctk.CTkFont(weight="bold"),
        command=lambda: excluir(),
    ).pack(side="left")

    ctk.CTkButton(
        botoes,
        text="SALVAR TALHÃO",
        height=45,
        width=210,
        fg_color=styles.CORES["sucesso"],
        hover_color="#059669",
        font=ctk.CTkFont(weight="bold"),
        command=lambda: salvar(),
    ).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT t.id, t.nome, t.area_ha, COALESCE(c.nome, ''), t.status
            FROM talhoes t
            LEFT JOIN culturas c ON c.uuid = t.cultura_id
            WHERE COALESCE(t.is_deleted, 0) = 0
            ORDER BY t.nome
        """).fetchall()
        conn.close()
        for r in rows:
            area = f"{r[2]:.2f} ha" if r[2] is not None else "-"
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {str(r[1]).ljust(28)} | {area.ljust(10)} | {str(r[3]).ljust(24)} | {r[4]}")

    def selecionar(event):
        if not lista.curselection():
            return
        tid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("SELECT id, nome, area_ha, cultura_id, status, observacao FROM talhoes WHERE id=?", (tid,)).fetchone()
        cultura_nome = None
        if row and row[3]:
            cultura_nome = conn.execute("SELECT nome FROM culturas WHERE uuid=?", (row[3],)).fetchone()
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            e_nome.insert(0, row[1] or "")
            e_area.insert(0, "" if row[2] is None else str(row[2]))
            combo_cultura.set(cultura_nome[0] if cultura_nome else "Sem cultura")
            combo_status.set(row[4] or "ATIVO")
            e_obs.insert(0, row[5] or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def salvar():
        nome = e_nome.get().strip()
        if not nome:
            messagebox.showerror("Erro", "Nome do talhão é obrigatório.")
            return
        try:
            area = float(e_area.get().replace(",", ".")) if e_area.get().strip() else None
        except ValueError:
            messagebox.showerror("Erro", "Área deve ser numérica.")
            return

        cultura_id = cultura_por_nome.get(combo_cultura.get())
        values = (nome, area, cultura_id, combo_status.get(), e_obs.get().strip(), db.now_iso())

        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE talhoes
                    SET nome=?, area_ha=?, cultura_id=?, status=?, observacao=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO talhoes
                    (uuid, nome, area_ha, cultura_id, status, observacao, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Talhão salvo.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um talhão.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover este talhão?"):
            db.soft_delete("talhoes", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
