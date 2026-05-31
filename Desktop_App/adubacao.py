# adubacao.py
# Planejamento de adubação compatível com planos_adubacao do mobile.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

import db
import styles


def view_adubacao(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(t, text="Planos de Adubação", font=ctk.CTkFont(size=24, weight="bold"), text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    def carregar_culturas():
        conn = db.conectar()
        rows = conn.execute("SELECT nome FROM culturas WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return [r[0] for r in rows]

    culturas = carregar_culturas()

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(5):
        form.grid_columnconfigure(i, weight=1)

    def label(text, row, col):
        ctk.CTkLabel(form, text=text, font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=row, column=col, sticky="w", padx=25, pady=(18, 0))

    label("NOME DO PLANO", 0, 0)
    e_nome = ctk.CTkEntry(form, placeholder_text="Ex: Adubação base Estufa A", height=40, corner_radius=8)
    e_nome.grid(row=1, column=0, columnspan=2, padx=15, pady=(5, 12), sticky="ew")

    label("CULTURA", 0, 2)
    combo_cultura = ctk.CTkComboBox(form, values=culturas or ["Geral"], height=40, corner_radius=8)
    combo_cultura.set("Geral")
    combo_cultura.grid(row=1, column=2, padx=15, pady=(5, 12), sticky="ew")

    label("TIPO", 0, 3)
    combo_tipo = ctk.CTkComboBox(form, values=["BASE", "COBERTURA", "FOLIAR", "CORRETIVA", "OUTRA"], height=40, corner_radius=8)
    combo_tipo.set("BASE")
    combo_tipo.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    label("STATUS", 0, 4)
    combo_status = ctk.CTkComboBox(form, values=["PLANEJADO", "EM ANDAMENTO", "APLICADO", "CANCELADO"], height=40, corner_radius=8)
    combo_status.set("PLANEJADO")
    combo_status.grid(row=1, column=4, padx=15, pady=(5, 12), sticky="ew")

    label("ÁREA/LOCAL", 2, 0)
    e_area = ctk.CTkEntry(form, placeholder_text="Talhão, estufa ou área", height=40, corner_radius=8)
    e_area.grid(row=3, column=0, padx=15, pady=(5, 12), sticky="ew")

    label("DATA APLICAÇÃO", 2, 1)
    e_data_aplicacao = ctk.CTkEntry(form, placeholder_text="DD-MM-YYYY", height=40, corner_radius=8)
    e_data_aplicacao.grid(row=3, column=1, padx=15, pady=(5, 12), sticky="ew")

    label("DESCRIÇÃO TÉCNICA", 2, 2)
    e_desc = ctk.CTkEntry(form, placeholder_text="Produto, dose, recomendação", height=40, corner_radius=8)
    e_desc.grid(row=3, column=2, columnspan=3, padx=15, pady=(5, 12), sticky="ew")

    selecionado = {"id": None}

    def to_iso(value, required=False):
        value = value.strip()
        if not value and not required:
            return None
        return datetime.strptime(value, "%d-%m-%Y").strftime("%Y-%m-%d")

    def limpar():
        selecionado["id"] = None
        e_nome.delete(0, "end")
        e_area.delete(0, "end")
        e_data_aplicacao.delete(0, "end")
        e_desc.delete(0, "end")
        combo_cultura.set("Geral")
        combo_tipo.set("BASE")
        combo_status.set("PLANEJADO")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)
    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR PLANO", height=45, width=210, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT id, nome_plano, cultura, tipo_aplicacao, status, data_aplicacao
            FROM planos_adubacao
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY data_criacao DESC, id DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for r in rows:
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {str(r[1]).ljust(32)} | {str(r[2] or '').ljust(20)} | {str(r[3] or '').ljust(10)} | {r[4]} | {r[5] or '-'}")

    def salvar():
        nome = e_nome.get().strip()
        if not nome:
            messagebox.showerror("Erro", "Nome do plano é obrigatório.")
            return
        try:
            data_aplicacao = to_iso(e_data_aplicacao.get(), required=False)
        except ValueError:
            messagebox.showerror("Erro", "Data de aplicação inválida.")
            return
        values = (
            nome,
            combo_cultura.get(),
            combo_tipo.get(),
            e_area.get().strip(),
            e_desc.get().strip(),
            combo_status.get(),
            datetime.now().strftime("%Y-%m-%d"),
            data_aplicacao,
            None,
            db.now_iso(),
        )
        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE planos_adubacao
                    SET nome_plano=?, cultura=?, tipo_aplicacao=?, area_local=?, descricao_tecnica=?,
                        status=?, data_criacao=?, data_aplicacao=?, anexos_uri=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO planos_adubacao
                    (uuid, nome_plano, cultura, tipo_aplicacao, area_local, descricao_tecnica, status,
                     data_criacao, data_aplicacao, anexos_uri, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Plano salvo.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def selecionar(event):
        if not lista.curselection():
            return
        pid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("""
            SELECT id, nome_plano, cultura, tipo_aplicacao, area_local, descricao_tecnica, status, data_aplicacao
            FROM planos_adubacao WHERE id=?
        """, (pid,)).fetchone()
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            e_nome.insert(0, row[1] or "")
            combo_cultura.set(row[2] or "Geral")
            combo_tipo.set(row[3] or "BASE")
            e_area.insert(0, row[4] or "")
            e_desc.insert(0, row[5] or "")
            combo_status.set(row[6] or "PLANEJADO")
            if row[7]:
                try:
                    e_data_aplicacao.insert(0, datetime.strptime(row[7], "%Y-%m-%d").strftime("%d-%m-%Y"))
                except Exception:
                    e_data_aplicacao.insert(0, row[7])

    lista.bind("<<ListboxSelect>>", selecionar)

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um plano.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover este plano?"):
            db.soft_delete("planos_adubacao", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
