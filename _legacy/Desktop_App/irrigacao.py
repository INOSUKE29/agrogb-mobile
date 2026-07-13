# irrigacao.py
# Registro de irrigação compatível com o app mobile.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

import db
import styles


def view_irrigacao(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(t, text="Irrigação", font=ctk.CTkFont(size=24, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    def carregar_talhoes():
        conn = db.conectar()
        rows = conn.execute("""
            SELECT uuid, nome
            FROM talhoes
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY nome
        """).fetchall()
        conn.close()
        return rows

    talhoes = carregar_talhoes()
    talhao_por_nome = {nome: uuid for uuid, nome in talhoes}

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(5):
        form.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(form, text="TALHÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(18, 0))
    combo_talhao = ctk.CTkComboBox(form, values=list(talhao_por_nome.keys()) or ["Sem talhão"], height=40, corner_radius=8)
    combo_talhao.set("Sem talhão")
    combo_talhao.grid(row=1, column=0, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="TURNO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(18, 0))
    combo_turno = ctk.CTkComboBox(form, values=["MANHA", "TARDE", "NOITE"], height=40, corner_radius=8)
    combo_turno.set("MANHA")
    combo_turno.grid(row=1, column=1, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="DURAÇÃO (MIN)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(18, 0))
    e_duracao = ctk.CTkEntry(form, placeholder_text="0", height=40, corner_radius=8)
    e_duracao.grid(row=1, column=2, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="VOLUME (M3)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(18, 0))
    e_volume = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_volume.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="DATA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=4, sticky="w", padx=25, pady=(18, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=4, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas sobre turno, bomba, chuva ou manejo", height=40, corner_radius=8)
    e_obs.grid(row=3, column=0, columnspan=5, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def limpar():
        selecionado["id"] = None
        combo_talhao.set("Sem talhão")
        combo_turno.set("MANHA")
        e_duracao.delete(0, "end")
        e_volume.delete(0, "end")
        e_obs.delete(0, "end")
        e_data.delete(0, "end")
        e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))

    def data_iso(value):
        return datetime.strptime(value.strip(), "%d-%m-%Y").strftime("%Y-%m-%d")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR IRRIGAÇÃO", height=45, width=220, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT i.id, i.data, COALESCE(t.nome, ''), i.turno, i.duracao_min, i.volumetria_m3, i.status
            FROM irrigacao i
            LEFT JOIN talhoes t ON t.uuid = i.talhao_uuid
            WHERE COALESCE(i.is_deleted, 0) = 0
            ORDER BY i.data DESC, i.id DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for r in rows:
            try:
                d_br = datetime.strptime(r[1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except Exception:
                d_br = r[1]
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {d_br} | {str(r[2]).ljust(28)} | {str(r[3]).ljust(6)} | {r[4] or 0} min | {r[5] or 0} m3 | {r[6]}")

    def salvar():
        talhao_uuid = talhao_por_nome.get(combo_talhao.get())
        if not talhao_uuid:
            messagebox.showerror("Erro", "Selecione um talhão.")
            return
        try:
            duracao = int(e_duracao.get())
            volume = float(e_volume.get().replace(",", ".")) if e_volume.get().strip() else None
            data = data_iso(e_data.get())
        except ValueError:
            messagebox.showerror("Erro", "Duração, volume ou data inválidos.")
            return

        values = (talhao_uuid, combo_turno.get(), duracao, volume, "CONCLUIDO", data, e_obs.get().strip(), db.now_iso())
        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE irrigacao
                    SET talhao_uuid=?, turno=?, duracao_min=?, volumetria_m3=?, status=?, data=?,
                        observacao=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO irrigacao
                    (uuid, talhao_uuid, turno, duracao_min, volumetria_m3, status, data, observacao,
                     last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Irrigação salva.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def selecionar(event):
        if not lista.curselection():
            return
        iid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("SELECT id, talhao_uuid, turno, duracao_min, volumetria_m3, data, observacao FROM irrigacao WHERE id=?", (iid,)).fetchone()
        talhao = conn.execute("SELECT nome FROM talhoes WHERE uuid=?", (row[1],)).fetchone() if row else None
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            combo_talhao.set(talhao[0] if talhao else "Sem talhão")
            combo_turno.set(row[2] or "MANHA")
            e_duracao.insert(0, str(row[3] or ""))
            e_volume.insert(0, str(row[4] or ""))
            try:
                e_data.delete(0, "end")
                e_data.insert(0, datetime.strptime(row[5], "%Y-%m-%d").strftime("%d-%m-%Y"))
            except Exception:
                pass
            e_obs.insert(0, row[6] or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um registro.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover esta irrigação?"):
            db.soft_delete("irrigacao", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
