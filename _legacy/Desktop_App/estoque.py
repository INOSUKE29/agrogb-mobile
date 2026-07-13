# estoque.py
# Controle de Estoque com visual moderno e ferramentas de compartilhamento

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime
import db
import styles
import utils_pdf

def view_estoque(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # Dados
    def carregar_itens():
        conn = db.conectar()
        dados = conn.execute("SELECT nome, unidade FROM cadastro WHERE estocavel = 1 ORDER BY nome").fetchall()
        conn.close()
        return dados

    itens_db = carregar_itens()

    # HEADER
    ctk.CTkLabel(t, text="Controle e Ajuste de Estoque", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # =============================
    # FORMULÁRIO – AJUSTE MANUAL (CARD)
    # =============================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    for i in range(4): form.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(form, text="ITEM NO ESTOQUE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    combo_item = ctk.CTkComboBox(form, values=[i[0] for i in itens_db], height=40, corner_radius=8)
    combo_item.set("Selecionar...")
    combo_item.grid(row=1, column=0, padx=15, pady=(5, 25), sticky="ew")

    ctk.CTkLabel(form, text="QUANTIDADE (+/-)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    e_qtd = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_qtd.grid(row=1, column=1, padx=15, pady=(5, 25), sticky="ew")

    lbl_uni = ctk.CTkLabel(form, text="UNID: -", font=ctk.CTkFont(size=13, weight="bold"), text_color=styles.CORES["primaria"])
    lbl_uni.grid(row=1, column=2, pady=(5, 25))

    ctk.CTkLabel(form, text="OBSERVAÇÃO DO AJUSTE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(20, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Motivo do ajuste...", height=40, corner_radius=8)
    e_obs.grid(row=1, column=3, padx=15, pady=(5, 25), sticky="ew")

    def item_selected(choice):
        for n, u in itens_db:
            if n == choice: lbl_uni.configure(text=f"UNID: {u}"); break
    combo_item.configure(command=item_selected)

    # =============================
    # BOTÕES
    # =============================
    bot_frame = ctk.CTkFrame(t, fg_color="transparent")
    bot_frame.pack(fill="x", pady=10)

    def compartilhar_estoque():
        conn = db.conectar()
        dados = conn.execute("SELECT item, unidade, SUM(quantidade) AS saldo FROM estoque GROUP BY item, unidade HAVING saldo <> 0 ORDER BY item").fetchall()
        conn.close()
        
        if not dados:
            messagebox.showinfo("Aviso", "Não há itens com saldo para compartilhar."); return

        msg = f"*📦 Status de Estoque AgroGB - {datetime.now().strftime('%d/%m/%Y')}*\n\n"
        for d in dados:
            alerta = "⚠️" if d[2] < 5 else "✅"
            msg += f"{alerta} *{d[0]}:* {d[2]:.2f} {d[1]}\n"
        utils_pdf.abrir_whatsapp(msg)

    btn_wpp = ctk.CTkButton(bot_frame, text="📱 SHARE WHATSAPP", height=45, width=200, fg_color="#25D366", hover_color="#128C7E", font=ctk.CTkFont(weight="bold"), command=compartilhar_estoque)
    btn_wpp.pack(side="right")

    btn_save = ctk.CTkButton(bot_frame, text="💾 APLICAR AJUSTE", height=45, width=200, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar())
    btn_save.pack(side="left")

    # =============================
    # LISTA
    # =============================
    ctk.CTkLabel(t, text="Saldos Atuais em Depósito:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True)

    import tkinter as tk
    scrollbar = tk.Scrollbar(frame_lista)
    scrollbar.pack(side="right", fill="y")
    
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white", yscrollcommand=scrollbar.set)
    lista.pack(fill="both", expand=True, padx=10, pady=10)
    scrollbar.config(command=lista.yview)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        for d in conn.execute("SELECT item, unidade, SUM(quantidade) AS saldo FROM estoque GROUP BY item, unidade HAVING saldo <> 0 ORDER BY item"):
            lista.insert(tk.END, f"{str(d[0]).ljust(40)} | SALDO: {d[2]:>10.2f} {d[1]}")
        conn.close()

    def salvar():
        ite = combo_item.get()
        if ite == "Selecionar...": messagebox.showerror("Erro", "Selecione o item"); return
        try: qtd = float(e_qtd.get().replace(",", "."))
        except: messagebox.showerror("Erro", "Quantidade inválida"); return

        conn = db.conectar()
        try:
            u = lbl_uni.cget("text").replace("UNID: ", "")
            conn.execute("INSERT INTO estoque (item, quantidade, unidade, valor, origem, data, observacao) VALUES (?,?,?,0,'AJUSTE',?,?)",
                        (ite, qtd, u, datetime.now().strftime("%Y-%m-%d"), e_obs.get()))
            conn.commit()
            messagebox.showinfo("Sucesso", "Ajuste concluído!"); e_qtd.delete(0, 'end'); e_obs.delete(0, 'end'); atualizar_lista()
        except Exception as e: messagebox.showerror("Erro", f"Falha: {e}")
        finally: conn.close()

    atualizar_lista()
    t.bind("<Return>", lambda e: salvar())
