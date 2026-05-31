# vendas.py
# Registro de Comercialização com visual moderno e ferramentas de compartilhamento

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime
import db
import styles
import os
import utils_pdf
import uuid

def view_vendas(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # Dados
    def carregar_clientes():
        conn = db.conectar()
        dados = conn.execute("SELECT nome FROM clientes WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return [d[0] for d in dados]

    def carregar_produtos():
        conn = db.conectar()
        dados = conn.execute("SELECT nome, unidade FROM cadastro WHERE vendavel = 1 AND COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return dados

    clientes_list = carregar_clientes()
    produtos_db = carregar_produtos()

    # HEADER
    ctk.CTkLabel(t, text="Registro de Comercialização (Vendas)", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ==========================
    # FORMULÁRIO (CARD)
    # ==========================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    for i in range(5): form.grid_columnconfigure(i, weight=1)

    # Linha 1
    ctk.CTkLabel(form, text="DATA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="CLIENTE / COMPRADOR", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, columnspan=2, sticky="w", padx=25, pady=(20, 0))
    combo_cli = ctk.CTkComboBox(form, values=clientes_list, height=40, corner_radius=8)
    combo_cli.set("Selecionar Cliente...")
    combo_cli.grid(row=1, column=1, columnspan=2, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="PRODUTO / VARIEDADE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, columnspan=2, sticky="w", padx=25, pady=(20, 0))
    combo_prod = ctk.CTkComboBox(form, values=[p[0] for p in produtos_db], height=40, corner_radius=8)
    combo_prod.set("Selecionar Item...")
    combo_prod.grid(row=1, column=3, columnspan=2, padx=15, pady=(5, 10), sticky="ew")

    # Linha 2
    ctk.CTkLabel(form, text="QUANTIDADE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    
    frame_peso = ctk.CTkFrame(form, fg_color="transparent")
    frame_peso.grid(row=3, column=0, padx=15, pady=(5, 25), sticky="ew")
    
    e_qtd = ctk.CTkEntry(frame_peso, placeholder_text="0.00", height=40, corner_radius=8)
    e_qtd.pack(side="left", fill="x", expand=True)
    
    def pesar():
        import utils_balanca
        p = utils_balanca.ler_peso_balanca()
        e_qtd.delete(0, 'end'); e_qtd.insert(0, str(p))
    
    ctk.CTkButton(frame_peso, text="⚖️", width=40, height=40, font=("Inter", 16), fg_color="#64748B", command=pesar).pack(side="right", padx=(5, 0))

    ctk.CTkLabel(form, text="UNID.", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=1, sticky="w", padx=25, pady=(10, 0))
    lbl_unidade = ctk.CTkLabel(form, text="-", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["primaria"])
    lbl_unidade.grid(row=3, column=1, pady=(5, 25))

    ctk.CTkLabel(form, text="VALOR TOTAL (R$)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=2, sticky="w", padx=25, pady=(10, 0))
    e_valor = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_valor.grid(row=3, column=2, padx=15, pady=(5, 25), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÕES", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=3, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Notas extras...", height=40, corner_radius=8)
    e_obs.grid(row=3, column=3, columnspan=2, padx=15, pady=(5, 25), sticky="ew")

    def prod_selecionado(choice):
        for n, u in produtos_db:
            if n == choice:
                lbl_unidade.configure(text=u)
                break
    combo_prod.configure(command=prod_selecionado)

    # ==========================
    # BOTÕES
    # ==========================
    bot_frame = ctk.CTkFrame(t, fg_color="transparent")
    bot_frame.pack(fill="x", pady=10)

    btn_f_wpp = ctk.CTkButton(bot_frame, text="📱 WHATSAPP", height=50, width=150, fg_color="#25D366", hover_color="#128C7E", font=ctk.CTkFont(weight="bold"), command=lambda: acao_extra("WPP"))
    btn_f_wpp.pack(side="right", padx=10)

    btn_f_pdf = ctk.CTkButton(bot_frame, text="📄 GERAR PDF", height=50, width=150, fg_color="#D32F2F", hover_color="#B71C1C", font=ctk.CTkFont(weight="bold"), command=lambda: acao_extra("PDF"))
    btn_f_pdf.pack(side="right")

    btn_salvar = ctk.CTkButton(bot_frame, text="🚀 CONFIRMAR VENDA", font=ctk.CTkFont(weight="bold"), 
                               height=50, width=200, corner_radius=12,
                               fg_color=styles.CORES["sucesso"], hover_color="#059669", command=lambda: salvar())
    btn_salvar.pack(side="left")

    # ==========================
    # LISTA (TABELA)
    # ==========================
    ctk.CTkLabel(t, text="Vendas Recentes do Mês (Selecione para PDF/Zap):", font=ctk.CTkFont(size=14, weight="bold"), 
                 text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True, pady=(0, 10))

    import tkinter as tk
    scrollbar = tk.Scrollbar(frame_lista)
    scrollbar.pack(side="right", fill="y")
    
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0,
                       bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white",
                       yscrollcommand=scrollbar.set)
    lista.pack(fill="both", expand=True, padx=10, pady=10)
    scrollbar.config(command=lista.yview)

    def atualizar_lista():
        lista.delete(0, tk.END)
        conn = db.conectar()
        for r in conn.execute("SELECT id, data, cliente, produto, valor FROM vendas WHERE COALESCE(is_deleted, 0) = 0 ORDER BY data DESC LIMIT 50"):
            try: d_br = datetime.strptime(r[1], "%Y-%m-%d").strftime("%d/%m")
            except: d_br = r[1]
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {d_br} | {str(r[2]).ljust(30)} | {str(r[3]).ljust(25)} | R$ {r[4]:,.2f}")
        conn.close()

    def salvar():
        try: d_iso = datetime.strptime(e_data.get(), "%d-%m-%Y").strftime("%Y-%m-%d")
        except: messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY)"); return
        
        cli, prod = combo_cli.get(), combo_prod.get()
        if cli == "Selecionar Cliente..." or prod == "Selecionar Item...":
            messagebox.showerror("Erro", "Selecione o Cliente e o Produto"); return

        try:
            val = float(e_valor.get().replace(",", "."))
            qtd = float(e_qtd.get().replace(",", "."))
        except: messagebox.showerror("Erro", "Quantidade e Valor devem ser numéricos"); return

        conn = db.conectar()
        uid = str(uuid.uuid4())
        ts = db.now_iso()
        try:
            conn.execute("INSERT INTO vendas (uuid, produto, quantidade, valor, data, cliente, status, observacao, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, 'ATIVA', ?, ?, 0, 0)",
                        (uid, prod, qtd, val, d_iso, cli, e_obs.get(), ts))
            conn.commit()
            messagebox.showinfo("Sucesso", "Venda realizada com sucesso!")
            e_qtd.delete(0, 'end'); e_valor.delete(0, 'end'); e_obs.delete(0, 'end'); atualizar_lista()
        except Exception as e: messagebox.showerror("Erro", f"Erro: {e}")
        finally: conn.close()

    def acao_extra(tipo):
        if not lista.curselection():
            messagebox.showwarning("Atenção", "Selecione uma venda na lista abaixo")
            return
        
        texto = lista.get(lista.curselection()[0])
        vid = int(texto.split(" | ")[0])
        
        conn = db.conectar()
        v = conn.execute("SELECT id, data, cliente, produto, quantidade, valor, observacao FROM vendas WHERE id=?", (vid,)).fetchone()
        conn.close()
        
        if not v: return
        v_dict = {'id': v[0], 'data': v[1], 'cliente': v[2], 'produto': v[3], 'qtd': v[4], 'valor': v[5], 'obs': v[6]}
        
        if tipo == "PDF":
            path = utils_pdf.gerar_recibo_venda(v_dict)
            os.startfile(os.path.abspath(path))
        elif tipo == "WPP":
            try: d_br = datetime.strptime(v_dict['data'], "%Y-%m-%d").strftime("%d/%m/%Y")
            except: d_br = v_dict['data']
            msg = f"*Recibo AgroGB - Venda #{v_dict['id']}*\n\n"
            msg += f"🗓 *Data:* {d_br}\n👤 *Cliente:* {v_dict['cliente']}\n🍎 *Produto:* {v_dict['produto']}\n📦 *Qtd:* {v_dict['qtd']}\n💰 *Total:* R$ {v_dict['valor']:,.2f}\n"
            if v_dict['obs']: msg += f"\n📝 *Obs:* {v_dict['obs']}"
            utils_pdf.abrir_whatsapp(msg)

    atualizar_lista()
    t.bind("<Return>", lambda e: salvar())
