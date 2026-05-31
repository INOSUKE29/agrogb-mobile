# regras_morango.py
# Definição de regras do morango

import tkinter as tk
from tkinter import ttk, messagebox
import db


def tela_regras_morango(root):
    t = tk.Toplevel(root)
    t.title("Regras do Morango")
    t.geometry("700x420")
    t.resizable(False, False)

    # --------------------------
    # PRODUTOS (CAIXA)
    # --------------------------
    def carregar_produtos():
        conn = db.conectar()
        cursor = conn.cursor()
        dados = cursor.execute(
            "SELECT id, nome FROM produtos WHERE unidade='CAIXA' ORDER BY nome"
        ).fetchall()
        conn.close()
        return dados

    produtos = carregar_produtos()

    # --------------------------
    # FORMULÁRIO
    # --------------------------
    form = tk.Frame(t)
    form.pack(pady=10)

    tk.Label(form, text="Produto").grid(row=0, column=0)
    tk.Label(form, text="Tipo").grid(row=0, column=1)
    tk.Label(form, text="Peso mín (kg)").grid(row=0, column=2)
    tk.Label(form, text="Peso máx (kg)").grid(row=0, column=3)

    produto_var = tk.StringVar()
    tipo_var = tk.StringVar(value="NORMAL")

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
        values=["NORMAL", "GRANDE", "PREMIUM", "CONGELADO"],
        state="readonly",
        width=15
    )

    e_min = tk.Entry(form, width=10)
    e_max = tk.Entry(form, width=10)

    combo_produto.grid(row=1, column=0, padx=5)
    combo_tipo.grid(row=1, column=1, padx=5)
    e_min.grid(row=1, column=2, padx=5)
    e_max.grid(row=1, column=3, padx=5)

    # --------------------------
    # SALVAR
    # --------------------------
    def salvar():
        if not produto_var.get():
            messagebox.showerror("Erro", "Selecione o produto")
            return

        produto_id = None
        for p in produtos:
            if p[1] == produto_var.get():
                produto_id = p[0]

        conn = db.conectar()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT OR REPLACE INTO produto_regras
            (produto_id, tipo, usa_bandeja, bandejas_por_caixa, peso_min, peso_max)
            VALUES (?, ?, 1, 4, ?, ?)
            """,
            (
                produto_id,
                tipo_var.get(),
                float(e_min.get() or 0),
                float(e_max.get() or 0)
            )
        )
        conn.commit()
        conn.close()

        messagebox.showinfo("OK", "Regra salva")

    tk.Button(t, text="Salvar Regra", width=20, command=salvar).pack(pady=10)
