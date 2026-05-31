# financeiro_lancamentos.py
# Contas a pagar/receber compatível com financeiro_transacoes do mobile.

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

import db
import styles


def view_lancamentos_financeiros(parent):
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    ctk.CTkLabel(
        t,
        text="Lançamentos Financeiros",
        font=ctk.CTkFont(size=24, weight="bold"),
        text_color=styles.CORES["texto"],
    ).pack(pady=(10, 20), anchor="w")

    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)
    for i in range(5):
        form.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(form, text="TIPO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(18, 0))
    combo_tipo = ctk.CTkComboBox(form, values=["PAGAR", "RECEBER"], height=40, corner_radius=8)
    combo_tipo.set("PAGAR")
    combo_tipo.grid(row=1, column=0, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="DESCRIÇÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(18, 0))
    e_desc = ctk.CTkEntry(form, placeholder_text="Ex: Nota de insumos", height=40, corner_radius=8)
    e_desc.grid(row=1, column=1, columnspan=2, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="VALOR (R$)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(18, 0))
    e_valor = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_valor.grid(row=1, column=3, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="VENCIMENTO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=4, sticky="w", padx=25, pady=(18, 0))
    e_venc = ctk.CTkEntry(form, placeholder_text="DD-MM-YYYY", height=40, corner_radius=8)
    e_venc.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_venc.grid(row=1, column=4, padx=15, pady=(5, 12), sticky="ew")

    ctk.CTkLabel(form, text="STATUS", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    combo_status = ctk.CTkComboBox(form, values=["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"], height=40, corner_radius=8)
    combo_status.set("PENDENTE")
    combo_status.grid(row=3, column=0, padx=15, pady=(5, 18), sticky="ew")

    ctk.CTkLabel(form, text="CATEGORIA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=1, sticky="w", padx=25, pady=(10, 0))
    e_categoria = ctk.CTkEntry(form, placeholder_text="Insumos, mão de obra, venda", height=40, corner_radius=8)
    e_categoria.grid(row=3, column=1, padx=15, pady=(5, 18), sticky="ew")

    ctk.CTkLabel(form, text="ENTIDADE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=2, sticky="w", padx=25, pady=(10, 0))
    e_entidade = ctk.CTkEntry(form, placeholder_text="Cliente ou fornecedor", height=40, corner_radius=8)
    e_entidade.grid(row=3, column=2, padx=15, pady=(5, 18), sticky="ew")

    ctk.CTkLabel(form, text="DATA PAGAMENTO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=3, sticky="w", padx=25, pady=(10, 0))
    e_pag = ctk.CTkEntry(form, placeholder_text="DD-MM-YYYY", height=40, corner_radius=8)
    e_pag.grid(row=3, column=3, padx=15, pady=(5, 18), sticky="ew")

    selecionado = {"id": None}

    def parse_date(value, required=True):
        value = value.strip()
        if not value and not required:
            return None
        return datetime.strptime(value, "%d-%m-%Y").strftime("%Y-%m-%d")

    def limpar():
        selecionado["id"] = None
        e_desc.delete(0, "end")
        e_valor.delete(0, "end")
        e_venc.delete(0, "end")
        e_venc.insert(0, datetime.now().strftime("%d-%m-%Y"))
        e_categoria.delete(0, "end")
        e_entidade.delete(0, "end")
        e_pag.delete(0, "end")
        combo_tipo.set("PAGAR")
        combo_status.set("PENDENTE")

    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    ctk.CTkButton(botoes, text="EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir()).pack(side="left")
    ctk.CTkButton(botoes, text="SALVAR LANÇAMENTO", height=45, width=230, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar()).pack(side="right")

    import tkinter as tk

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(10, 0))
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white")
    lista.pack(fill="both", expand=True, padx=10, pady=10)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        rows = conn.execute("""
            SELECT id, tipo, descricao, valor, vencimento, status, entidade_nome
            FROM financeiro_transacoes
            WHERE COALESCE(is_deleted, 0) = 0
            ORDER BY vencimento DESC, id DESC
            LIMIT 100
        """).fetchall()
        conn.close()
        for r in rows:
            try:
                venc = datetime.strptime(r[4], "%Y-%m-%d").strftime("%d/%m/%Y")
            except Exception:
                venc = r[4]
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {r[1].ljust(7)} | {str(r[2]).ljust(32)} | R$ {r[3]:>10,.2f} | {venc} | {r[5]} | {r[6] or ''}")

    def selecionar(event):
        if not lista.curselection():
            return
        fid = int(lista.get(lista.curselection()[0]).split(" | ")[0])
        conn = db.conectar()
        row = conn.execute("""
            SELECT id, tipo, descricao, valor, vencimento, data_pagamento, status, categoria, entidade_nome
            FROM financeiro_transacoes
            WHERE id=?
        """, (fid,)).fetchone()
        conn.close()
        if row:
            limpar()
            selecionado["id"] = row[0]
            combo_tipo.set(row[1])
            e_desc.insert(0, row[2] or "")
            e_valor.insert(0, str(row[3] or ""))
            try:
                e_venc.delete(0, "end")
                e_venc.insert(0, datetime.strptime(row[4], "%Y-%m-%d").strftime("%d-%m-%Y"))
            except Exception:
                e_venc.insert(0, row[4] or "")
            if row[5]:
                try:
                    e_pag.insert(0, datetime.strptime(row[5], "%Y-%m-%d").strftime("%d-%m-%Y"))
                except Exception:
                    e_pag.insert(0, row[5])
            combo_status.set(row[6] or "PENDENTE")
            e_categoria.insert(0, row[7] or "")
            e_entidade.insert(0, row[8] or "")

    lista.bind("<<ListboxSelect>>", selecionar)

    def salvar():
        if not e_desc.get().strip():
            messagebox.showerror("Erro", "Descrição é obrigatória.")
            return
        try:
            valor = float(e_valor.get().replace(",", "."))
            vencimento = parse_date(e_venc.get())
            data_pagamento = parse_date(e_pag.get(), required=False)
        except ValueError:
            messagebox.showerror("Erro", "Valor ou data inválidos.")
            return

        values = (
            combo_tipo.get(),
            e_desc.get().strip(),
            valor,
            vencimento,
            data_pagamento,
            combo_status.get(),
            e_categoria.get().strip(),
            e_entidade.get().strip(),
            db.now_iso(),
        )

        conn = db.conectar()
        try:
            if selecionado["id"]:
                conn.execute("""
                    UPDATE financeiro_transacoes
                    SET tipo=?, descricao=?, valor=?, vencimento=?, data_pagamento=?, status=?,
                        categoria=?, entidade_nome=?, last_updated=?, sync_status=0
                    WHERE id=?
                """, (*values, selecionado["id"]))
            else:
                conn.execute("""
                    INSERT INTO financeiro_transacoes
                    (uuid, tipo, descricao, valor, vencimento, data_pagamento, status, categoria,
                     entidade_nome, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (db.new_uuid(), *values))
            conn.commit()
            messagebox.showinfo("Sucesso", "Lançamento salvo.")
            limpar()
            atualizar_lista()
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha ao salvar: {exc}")
        finally:
            conn.close()

    def excluir():
        if not selecionado["id"]:
            messagebox.showwarning("Atenção", "Selecione um lançamento.")
            return
        if messagebox.askyesno("Confirmação", "Deseja remover este lançamento?"):
            db.soft_delete("financeiro_transacoes", selecionado["id"])
            limpar()
            atualizar_lista()

    atualizar_lista()
