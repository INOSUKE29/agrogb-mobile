# relatorios/custo_kg.py
# Cálculo automático de custo real por kg

import tkinter as tk
from tkinter import messagebox
from datetime import datetime
import db

def tela_custo_por_kg(root):
    t = tk.Toplevel(root)
    t.title("Custo Real por Kg")
    t.geometry("420x300")
    t.resizable(False, False)

    tk.Label(t, text="Data inicial (DD-MM-YYYY)").grid(row=0, column=0, sticky="w", padx=10, pady=5)
    e_ini = tk.Entry(t, width=15)
    e_ini.grid(row=0, column=1, pady=5)

    tk.Label(t, text="Data final (DD-MM-YYYY)").grid(row=1, column=0, sticky="w", padx=10, pady=5)
    e_fim = tk.Entry(t, width=15)
    e_fim.grid(row=1, column=1, pady=5)

    resultado = tk.Label(t, text="", justify="left", font=("Arial", 10))
    resultado.grid(row=3, column=0, columnspan=2, padx=10, pady=15)

    def data_ok(d):
        try:
            datetime.strptime(d, "%d-%m-%Y")
            return True
        except:
            return False

    def gerar():
        if not data_ok(e_ini.get()) or not data_ok(e_fim.get()):
            messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY)")
            return

        conn = db.conectar()
        cur = conn.cursor()

        # Total de compras (custo)
        custo = cur.execute(
            """
            SELECT SUM(valor)
            FROM compras
            WHERE data BETWEEN ? AND ?
            """,
            (e_ini.get(), e_fim.get())
        ).fetchone()[0] or 0

        # Produção e descarte
        prod = cur.execute(
            """
            SELECT SUM(producao_total), SUM(descarte_kg)
            FROM colheita
            WHERE data BETWEEN ? AND ?
            """,
            (e_ini.get(), e_fim.get())
        ).fetchone()

        conn.close()

        producao = prod[0] or 0
        descarte = prod[1] or 0
        liquida = producao - descarte

        if liquida <= 0:
            messagebox.showerror("Erro", "Produção líquida inválida")
            return

        custo_kg = custo / liquida

        resultado.config(text=(
            f"Custo total: R$ {custo:.2f}\n"
            f"Produção total: {producao:.2f} kg\n"
            f"Descarte: {descarte:.2f} kg\n"
            f"Produção líquida: {liquida:.2f} kg\n\n"
            f"CUSTO REAL POR KG: R$ {custo_kg:.2f}"
        ))

    tk.Button(t, text="Calcular", width=20, command=gerar)\
        .grid(row=2, column=0, columnspan=2, pady=10)
