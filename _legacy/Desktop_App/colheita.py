# colheita.py
# Registro de Colheita Diária com visual moderno e ferramentas de compartilhamento

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime
import db
import styles
import utils_pdf
import uuid

def view_colheita(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # ESTADO LOCAL
    itens_sessao = []  # {'item': nome, 'qtd': val, 'unidade': uni}

    # Dados
    def carregar_culturas():
        conn = db.conectar()
        dados = conn.execute("SELECT nome FROM culturas WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return [d[0] for d in dados]

    def carregar_produtos():
        conn = db.conectar()
        dados = conn.execute("SELECT nome, unidade FROM cadastro WHERE (vendavel = 1 OR tipo = 'PRODUTO') AND COALESCE(is_deleted, 0) = 0 ORDER BY nome").fetchall()
        conn.close()
        return dados

    culturas_list = carregar_culturas()
    produtos_db = carregar_produtos()

    # HEADER
    ctk.CTkLabel(t, text="Registro de Colheita Diária", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # =========================
    # CARD CABEÇALHO (DATA / CULTURA)
    # =========================
    frame_topo = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_topo.pack(fill="x", pady=10)
    
    frame_topo.grid_columnconfigure((0, 1), weight=1)

    ctk.CTkLabel(frame_topo, text="DATA DA COLHEITA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_data = ctk.CTkEntry(frame_topo, height=40, corner_radius=8)
    e_data.insert(0, datetime.now().strftime("%d-%m-%Y"))
    e_data.grid(row=1, column=0, padx=15, pady=(5, 20), sticky="ew")

    ctk.CTkLabel(frame_topo, text="ÁREA / CULTURA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    combo_cultura = ctk.CTkComboBox(frame_topo, values=culturas_list, height=40, corner_radius=8)
    combo_cultura.set("Selecionar Área...")
    combo_cultura.grid(row=1, column=1, padx=15, pady=(5, 20), sticky="ew")

    # =========================
    # CARD ADIÇÃO DE ITENS
    # =========================
    frame_add = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_add.pack(fill="x", pady=10)
    
    for i in range(4): frame_add.grid_columnconfigure(i, weight=1)

    ctk.CTkLabel(frame_add, text="PRODUTO / VARIEDADE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    combo_prod = ctk.CTkComboBox(frame_add, values=[p[0] for p in produtos_db], height=40, corner_radius=8)
    combo_prod.set("Selecionar...")
    combo_prod.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(frame_add, text="QUANTIDADE", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    
    f_q = ctk.CTkFrame(frame_add, fg_color="transparent")
    f_q.grid(row=1, column=1, padx=15, pady=(5, 10), sticky="ew")
    
    e_qtd = ctk.CTkEntry(f_q, placeholder_text="0.00", height=40, corner_radius=8)
    e_qtd.pack(side="left", fill="x", expand=True)

    def pesar():
        import utils_balanca
        p = utils_balanca.ler_peso_balanca()
        e_qtd.delete(0, 'end'); e_qtd.insert(0, str(p))

    ctk.CTkButton(f_q, text="⚖️", width=40, height=40, fg_color="#64748B", command=pesar).pack(side="right", padx=(5, 0))

    lbl_uni = ctk.CTkLabel(frame_add, text="UNID: -", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["primaria"])
    lbl_uni.grid(row=1, column=2, pady=(5, 10))

    def prod_selected(choice):
        for p, u in produtos_db:
            if p == choice: lbl_uni.configure(text=f"UNID: {u}"); break
    combo_prod.configure(command=prod_selected)

    def adicionar():
        p, q = combo_prod.get(), e_qtd.get()
        if p == "Selecionar..." or not q: return
        try:
            q_val = float(q.replace(",", "."))
            u = lbl_uni.cget("text").replace("UNID: ", "")
            itens_sessao.append({'item': p, 'qtd': q_val, 'unidade': u})
            atualizar_sublista()
            e_qtd.delete(0, 'end'); combo_prod.set("Selecionar...")
        except: messagebox.showerror("Erro", "Quantidade inválida")

    btn_add = ctk.CTkButton(frame_add, text="➕ ADICIONAR", height=40, fg_color=styles.CORES["primaria"], 
                            hover_color="#2563EB", font=ctk.CTkFont(weight="bold"), command=adicionar)
    btn_add.grid(row=1, column=3, padx=15, pady=(5, 10), sticky="ew")

    # Lista temporária
    lista_box = ctk.CTkTextbox(frame_add, height=100, corner_radius=8, border_width=1, border_color="#CBD5E1", font=("Inter", 11))
    lista_box.grid(row=2, column=0, columnspan=4, padx=15, pady=(10, 20), sticky="ew")

    def atualizar_sublista():
        lista_box.configure(state="normal")
        lista_box.delete("1.0", "end")
        for i, item in enumerate(itens_sessao):
            lista_box.insert("end", f"#{i+1} | {item['item'].ljust(30)} | {item['qtd']:>8.2f} {item['unidade']}\n")
        lista_box.configure(state="disabled")

    # =========================
    # CARD RODAPÉ (PERDAS)
    # =========================
    frame_footer = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_footer.pack(fill="x", pady=10)
    frame_footer.grid_columnconfigure((0, 1, 2), weight=1)

    ctk.CTkLabel(frame_footer, text="CONGELADO (KG)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_cong = ctk.CTkEntry(frame_footer, placeholder_text="0.00", height=40, corner_radius=8)
    e_cong.grid(row=1, column=0, padx=15, pady=(5, 30), sticky="ew")

    ctk.CTkLabel(frame_footer, text="DESCARTE / PERDA (KG)", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    e_desc = ctk.CTkEntry(frame_footer, placeholder_text="0.00", height=40, corner_radius=8)
    e_desc.grid(row=1, column=1, padx=15, pady=(5, 30), sticky="ew")

    ctk.CTkLabel(frame_footer, text="OBSERVAÇÃO GERAL", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(20, 0))
    e_obs = ctk.CTkEntry(frame_footer, placeholder_text="Notas extras...", height=40, corner_radius=8)
    e_obs.grid(row=1, column=2, padx=15, pady=(5, 30), sticky="ew")

    def salvar():
        try: d_iso = datetime.strptime(e_data.get(), "%d-%m-%Y").strftime("%Y-%m-%d")
        except: messagebox.showerror("Erro", "Data inválida (DD-MM-YYYY)"); return
        
        cult = combo_cultura.get()
        if cult == "Selecionar Área..." or not itens_sessao:
            messagebox.showerror("Erro", "Selecione a área e adicione ao menos um item colhido"); return

        conn = db.conectar()
        cur = conn.cursor()
        ts = db.now_iso()

        try:
            # Novo Schema (Mobile-Parity): Uma linha por item em 'colheitas'
            # Ignoramos 'congelado' e 'descarte' globais por enquanto ou associamos ao primeiro item?
            # Melhor abordagem: Se o usuário preencheu descarte/cong, criar registros de descarte ou dividir?
            # Pela simplicidade e paridade:
            # 1. Os itens vão para 'colheitas'
            # 2. Descarte vai para tabela 'descarte' (se preenchido)
            
            # Inserir Itens Colhidos
            for i in itens_sessao:
                uid_new = str(uuid.uuid4())
                congelado = float(e_cong.get().replace(",", ".")) if e_cong.get() else 0
                cur.execute("""
                    INSERT INTO colheitas (uuid, data, cultura, produto, quantidade, congelado, observacao, last_updated, sync_status, is_deleted) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
                """, (uid_new, d_iso, cult, i['item'], i['qtd'], congelado, e_obs.get(), ts))

            # Inserir Descarte (Se houver)
            if e_desc.get() and float(e_desc.get()) > 0:
                 uid_desc = str(uuid.uuid4())
                 # Assumimos 'Produto Diverso' ou pegamos o primeiro da lista como referencia
                 prod_ref = itens_sessao[0]['item'] if itens_sessao else "Geral"
                 cur.execute("""
                    INSERT INTO descarte (uuid, produto, data, quantidade_kg, motivo, last_updated, sync_status, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, 0, 0)
                 """, (uid_desc, prod_ref, d_iso, float(e_desc.get()), "Descarte Colheita", ts))

            conn.commit()
            messagebox.showinfo("Sucesso", "Colheita registrada e sincronizada!")
            itens_sessao.clear(); atualizar_sublista(); e_cong.delete(0, 'end'); e_desc.delete(0, 'end'); e_obs.delete(0, 'end')

        except Exception as e: 
            messagebox.showerror("Erro", f"Erro ao salvar: {e}")
            print(e)
        finally: conn.close()

    def compartilhar_wpp():
        if not itens_sessao:
            messagebox.showwarning("Atenção", "Adicione itens à colheita para compartilhar."); return
        
        msg = f"*Resumo de Colheita AgroGB - {e_data.get()}*\n\n"
        msg += f"📍 *Área:* {combo_cultura.get()}\n📊 *Itens Colhidos:*\n"
        total = 0
        for i in itens_sessao:
            msg += f"• {i['item']}: {i['qtd']:.2f} {i['unidade']}\n"; total += i['qtd']
        msg += f"\n⚖️ *Total:* {total:.2f} KG\n"
        if e_obs.get(): msg += f"📝 *Obs:* {e_obs.get()}"
        utils_pdf.abrir_whatsapp(msg)

    # BOTÕES FINAIS
    bot_f = ctk.CTkFrame(t, fg_color="transparent")
    bot_f.pack(fill="x", pady=10)

    btn_wpp = ctk.CTkButton(bot_f, text="📱 COMPARTILHAR NO WHATSAPP", height=50, width=280, 
                            fg_color="#25D366", hover_color="#128C7E", 
                            font=ctk.CTkFont(weight="bold"), command=compartilhar_wpp)
    btn_wpp.pack(side="right")

    btn_save = ctk.CTkButton(bot_f, text="💾 SALVAR COLHEITA", height=50, width=250, 
                             fg_color=styles.CORES["sucesso"], hover_color="#059669", 
                             font=ctk.CTkFont(size=14, weight="bold"), command=salvar)
    btn_save.pack(side="left")

    t.bind("<Return>", lambda e: salvar())
