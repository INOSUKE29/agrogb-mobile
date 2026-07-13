# custos.py
# Cadastro de custos (insumos e embalagens)

import tkinter as tk
from tkinter import ttk, messagebox
import db
import utils


def tela_custos(root):
    t = tk.Toplevel(root)
    t.title("Custos")
    t.geometry("800x460")
    t.resizable(False, False)

    # --------------------------
    # PRODUTOS
    # --------------------------
    def carregar_produtos():
        conn = db.conectar()
        cursor = conn.cursor()
        dados = cursor.execute(
            "SELECT id, nome, unidade FROM produtos ORDER BY nome"
        ).fetchall()
        conn.close()
        return dados

    produtos = carregar_produtos()

    selecionado = {"id": None}

    # --------------------------
    # FORMULÁRIO
    # --------------------------
    form = tk.Frame(t)
    form.pack(pady=10)

    tk.Label(form, text="Produto").grid(row=0, column=0)
    tk.Label(form, text="Tipo").grid(row=0, column=1)
    tk.Label(form, text="Quantidade").grid(row=0, column=2)
    tk.Label(form, text="Valor total (R$)").grid(row=0, column=3)
    tk.Label(form, text="Data (DD-MM-YYYY)").grid(row=0, column=4)

    produto_var = tk.StringVar()
    tipo_var = tk.StringVar(value="INSUMO")

    combo_produto = ttk.Combobox(
        form,
        textvariable=produto_var,
        values=[p[1] for p in produtos],
        state="readonly",
        width=20
    )

    combo_tipo = ttk.Combobox(
        form,
        textvariable=tipo_var,
        values=["INSUMO", "EMBALAGEM"],
        state="readonly",
        width=12
    )

    e_qtd = tk.Entry(form, width=10)
    e_valor = tk.Entry(form, width=12)
    e_data = tk.Entry(form, width=12)

    combo_produto.grid(row=1, column=0, padx=5)
    combo_tipo.grid(row=1, column=1, padx=5)
    e_qtd.grid(row=1, column=2, padx=5)
    e_valor.grid(row=1, column=3, padx=5)
    e_data.grid(row=1, column=4, padx=5)

    tk.Label(form, text="Observação").grid(row=2, column=0)
    e_obs = tk.Entry(form, width=60)
    e_obs.grid(row=3, column=0, columnspan=5, padx=5, pady=5)

    # --------------------------
    # LISTA
    # --------------------------
    lista = tk.Listbox(t, width=120)
    lista.pack(pady=10)

    def atualizar():
        lista.delete(0, tk.END)
        conn = db.conectar()
        cursor = conn.cursor()
        for c in cursor.execute(
            """
            SELECT id, produto, tipo, quantidade, valor_total, data
            FROM custos
            ORDER BY data DESC
            """
        ):
            lista.insert(
                tk.END,
                f"{c[0]} | {c[1]} | {c[2]} | "
                f"Qtd: {c[3]} | R$ {c[4]:.2f} | {c[5]}"
            )
        conn.close()

    atualizar()

    # --------------------------
    # SALVAR
    # --------------------------
    def salvar():
        if not produto_var.get():
            messagebox.showerror("Erro", "Selecione um produto")
            return

        if not utils.validar_numero(e_qtd.get()):
            messagebox.showerror("Erro", "Quantidade inválida")
            return

        if not utils.validar_numero(e_valor.get()):
            messagebox.showerror("Erro", "Valor inválido")
            return

        if not utils.validar_data(e_data.get()):
            messagebox.showerror("Erro", "Data inválida")
            return

        produto_id = None
        unidade = None
        for p in produtos:
            if p[1] == produto_var.get():
                produto_id = p[0]
                unidade = p[2]

        conn = db.conectar()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO custos
            (produto_id, produto, tipo, unidade, quantidade, valor_total, data, observacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                produto_id,
                produto_var.get(),
                tipo_var.get(),
                unidade,
                float(e_qtd.get()),
                float(e_valor.get()),
                e_data.get(),
                e_obs.get()
            )
        )
        conn.commit()
        conn.close()

        e_qtd.delete(0, tk.END)
        e_valor.delete(0, tk.END)
        e_data.delete(0, tk.END)
        e_obs.delete(0, tk.END)
        combo_produto.set("")
        atualizar()

    # --------------------------
    # BOTÕES
    # --------------------------
    tk.Button(t, text="Salvar Custo", width=20, command=salvar).pack(pady=5)
