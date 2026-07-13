# compras.py
# Lançamento de Notas e Despesas com visual moderno e Suporte a Código de Barras NF-e

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime, date
import db
import styles
import utils_nfe

def view_compras(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # Dados
    def carregar_itens():
        conn = db.conectar()
        dados = conn.execute("SELECT nome, unidade FROM cadastro ORDER BY nome").fetchall()
        conn.close()
        return dados

    def carregar_culturas():
        conn = db.conectar()
        dados = conn.execute("SELECT nome FROM culturas ORDER BY nome").fetchall()
        conn.close()
        return [d[0] for d in dados]

    itens_db = carregar_itens()
    culturas_db = carregar_culturas()

    # HEADER
    ctk.CTkLabel(t, text="Lançamento de Notas e Despesas (Compras)", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # =============================
    # CARD SCANNER (ADICIONAL)
    # =============================
    scan_frame = ctk.CTkFrame(t, fg_color="#F1F5F9", corner_radius=15, border_width=1, border_color="#CBD5E1")
    scan_frame.pack(fill="x", pady=(0, 10))
    
    ctk.CTkLabel(scan_frame, text="🔍 LEITOR DE NOTA FISCAL (BARCODE):", font=ctk.CTkFont(size=11, weight="bold"), text_color="#64748B").pack(side="left", padx=20, pady=15)
    e_scan = ctk.CTkEntry(scan_frame, placeholder_text="Aguardando scanner (Passe o leitor na Chave de Acesso)...", height=40, font=("Consolas", 12))
    e_scan.pack(side="left", fill="x", expand=True, padx=(0, 20), pady=15)

    def processar_scan(event):
        chave = e_scan.get().strip()
        if len(chave) == 44:
            dados = utils_nfe.extrair_dados_nfe(chave)
            if dados:
                e_obs.delete(0, 'end')
                e_obs.insert(0, f"NF: {dados['numero_nf']} | Série: {dados['serie']} | CNPJ: {dados['cnpj_emitente']}")
                # Sugere data se disponível no sistema de datas atual
                e_data.delete(0, 'end')
                e_data.insert(0, f"01-{dados['mes']}-{dados['ano']}")
                messagebox.showinfo("Sucesso", f"Nota Fiscal #{dados['numero_nf']} Identificada!\nCampos preenchidos automaticamente.")
                e_scan.delete(0, 'end')
                # Coloca o foco no item para continuar preenchimento
                combo_item.focus()
            else:
                messagebox.showwarning("Aviso", "Chave de acesso inválida ou incompleta.")

    e_scan.bind("<Return>", processar_scan)

    # =============================
    # FORMULÁRIO (CARD)
    # =============================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    for i in range(4): form.grid_columnconfigure(i, weight=1)

    # Linha 1
    ctk.CTkLabel(form, text="DATA DA NOTA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_data = ctk.CTkEntry(form, height=40, corner_radius=8)
    e_data.insert(0, date.today().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="ITEM / INSUMO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    combo_item = ctk.CTkComboBox(form, values=[i[0] for i in itens_db], height=40, corner_radius=8)
    combo_item.set("Selecionar...")
    combo_item.grid(row=1, column=1, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="QUANTIDADE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(20, 0))
    e_qtd = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_qtd.grid(row=1, column=2, padx=15, pady=(5, 10), sticky="ew")

    lbl_uni = ctk.CTkLabel(form, text="-", font=ctk.CTkFont(size=13, weight="bold"), text_color=styles.CORES["primaria"])
    lbl_uni.grid(row=1, column=3, pady=(5, 10))

    def item_selected(choice):
        for n, u in itens_db:
            if n == choice: lbl_uni.configure(text=u); break
    combo_item.configure(command=item_selected)

    # Linha 2
    ctk.CTkLabel(form, text="VALOR TOTAL (R$)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    e_valor = ctk.CTkEntry(form, placeholder_text="0.00", height=40, corner_radius=8)
    e_valor.grid(row=3, column=0, padx=15, pady=(5, 25), sticky="ew")

    ctk.CTkLabel(form, text="VINCULAR À CULTURA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=1, sticky="w", padx=25, pady=(10, 0))
    combo_cultura = ctk.CTkComboBox(form, values=culturas_db, height=40, corner_radius=8)
    combo_cultura.set("Geral / Administrativo")
    combo_cultura.grid(row=3, column=1, padx=15, pady=(5, 25), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÃO / Nº NOTA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=2, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Ex: NF 123...", height=40, corner_radius=8)
    e_obs.grid(row=3, column=2, columnspan=2, padx=15, pady=(5, 25), sticky="ew")

    # =============================
    # BOTÕES
    # =============================
    bot_frame = ctk.CTkFrame(t, fg_color="transparent")
    bot_frame.pack(fill="x", pady=10)

    btn_del = ctk.CTkButton(bot_frame, text="🗑 EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir())
    btn_del.pack(side="left")

    btn_save = ctk.CTkButton(bot_frame, text="⚡ REGISTRAR DESPESA", height=45, width=220, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar())
    btn_save.pack(side="right")

    # =============================
    # LISTA
    # =============================
    ctk.CTkLabel(t, text="Lançamentos Recentes:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

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
        for r in conn.execute("SELECT id, data, item, valor, cultura FROM compras WHERE COALESCE(is_deleted, 0) = 0 ORDER BY data DESC LIMIT 50"):
            try: d_br = datetime.strptime(r[1], "%Y-%m-%d").strftime("%d/%m")
            except: d_br = r[1]
            lista.insert(tk.END, f"{str(r[0]).zfill(3)} | {d_br} | {str(r[2]).ljust(35)} | R$ {r[3]:>10,.2f} | {str(r[4])}")
        conn.close()

    def salvar():
        try: d_iso = datetime.strptime(e_data.get(), "%d-%m-%Y").strftime("%Y-%m-%d")
        except: messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY)"); return
        
        ite = combo_item.get()
        if ite == "Selecionar...": messagebox.showerror("Erro", "Selecione o item"); return
        
        try:
            val = float(e_valor.get().replace(",", "."))
            qtd = float(e_qtd.get().replace(",", "."))
        except: messagebox.showerror("Erro", "Quantidade e Valor devem ser números"); return

        conn = db.conectar()
        cur = conn.cursor()
        try:
            cur.execute("""
                INSERT INTO compras
                (uuid, data, item, quantidade, unidade, valor, cultura, observacao, last_updated, sync_status, is_deleted)
                VALUES (?,?,?,?,?,?,?,?,?,0,0)
            """, (db.new_uuid(), d_iso, ite, qtd, lbl_uni.cget("text"), val, combo_cultura.get(), e_obs.get(), db.now_iso()))
            # Estoque
            st_row = cur.execute("SELECT estocavel FROM cadastro WHERE nome=?", (ite,)).fetchone()
            if st_row and st_row[0] == 1:
                cur.execute("""
                    INSERT INTO estoque
                    (uuid, item, produto, quantidade, unidade, valor, origem, data, observacao, last_updated, sync_status, is_deleted)
                    VALUES (?,?,?,?,?,?, 'COMPRA', ?, ?, ?, 0, 0)
                """, (db.new_uuid(), ite, ite, qtd, lbl_uni.cget("text"), val, d_iso, e_obs.get(), db.now_iso()))
            conn.commit()
            messagebox.showinfo("Sucesso", "Compra registrada!"); e_qtd.delete(0, 'end'); e_valor.delete(0, 'end'); e_obs.delete(0, 'end'); atualizar_lista()
        except Exception as e: messagebox.showerror("Erro", f"Falha: {e}")
        finally: conn.close()

    def excluir():
        if not lista.curselection(): return
        item_txt = lista.get(lista.curselection()[0])
        cid = int(item_txt.split(" | ")[0])
        if messagebox.askyesno("Confirmar", "Remover esta nota?"):
            db.soft_delete("compras", cid)
            atualizar_lista()

    atualizar_lista()
    t.bind("<Return>", lambda e: salvar())
