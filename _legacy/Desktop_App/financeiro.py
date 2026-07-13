# financeiro.py
# Resumo financeiro do sistema com visual moderno CustomTkinter

import customtkinter as ctk
import db
import styles

def view_financeiro(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Resumo Financeiro Geral", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # DADOS
    conn = db.conectar()
    entradas = conn.execute("SELECT SUM(valor) FROM vendas WHERE status='ATIVA'").fetchone()[0] or 0
    saidas = conn.execute("SELECT SUM(valor) FROM compras").fetchone()[0] or 0
    conn.close()

    saldo = entradas - saidas

    # ==========================
    # CARDS DE INDICADORES
    # ==========================
    frame_cards = ctk.CTkFrame(t, fg_color="transparent")
    frame_cards.pack(fill="x", pady=20)

    def criar_card(container, titulo, valor, cor_texto):
        card = ctk.CTkFrame(container, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
        card.pack(side="left", fill="both", expand=True, padx=10)
        
        ctk.CTkLabel(card, text=titulo, font=ctk.CTkFont(size=13, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", padx=25, pady=(20, 0))
        ctk.CTkLabel(card, text=f"R$ {valor:,.2f}", font=ctk.CTkFont(size=28, weight="bold"), text_color=cor_texto).pack(anchor="w", padx=25, pady=(5, 25))

    criar_card(frame_cards, "Faturamento (Entradas)", entradas, styles.CORES["sucesso"])
    criar_card(frame_cards, "Custos Op. (Saídas)", saidas, styles.CORES["erro"])
    criar_card(frame_cards, "Saldo em Caixa", saldo, styles.CORES["primaria"] if saldo >= 0 else styles.CORES["erro"])
