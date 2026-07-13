# cadastro.py
# Cadastro Geral de Itens com visual moderno CustomTkinter

import customtkinter as ctk
from tkinter import messagebox
import db
import styles

def view_cadastro(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Cadastro Geral de Itens e Produtos", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ======================
    # FORMULÁRIO (CARD)
    # ======================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    for i in range(4): form.grid_columnconfigure(i, weight=1)

    # Linha 1
    ctk.CTkLabel(form, text="NOME DO ITEM", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=25, pady=(20, 0))
    e_nome = ctk.CTkEntry(form, placeholder_text="Ex: Morango Especial...", height=40, corner_radius=8)
    e_nome.grid(row=1, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="UNIDADE MEDIDA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=25, pady=(20, 0))
    combo_uni = ctk.CTkComboBox(form, values=["KG", "UNIDADE", "CAIXA", "LITROS", "PACOTE"], height=40, corner_radius=8)
    combo_uni.set("KG")
    combo_uni.grid(row=1, column=1, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="TIPO CATEGORIA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=25, pady=(20, 0))
    combo_tipo = ctk.CTkComboBox(form, values=["PRODUTO", "INSUMO", "EMBALAGEM", "SERVICO"], height=40, corner_radius=8)
    combo_tipo.set("PRODUTO")
    combo_tipo.grid(row=1, column=2, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="ESTOCÁVEL?", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=3, sticky="w", padx=25, pady=(20, 0))
    estocavel_var = ctk.StringVar(value="SIM")
    sw_est = ctk.CTkSegmentedButton(form, values=["SIM", "NÃO"], variable=estocavel_var, height=40)
    sw_est.grid(row=1, column=3, padx=15, pady=(5, 10), sticky="ew")

    # Linha 2
    ctk.CTkLabel(form, text="VENDÁVEL (CLIENTE)?", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=0, sticky="w", padx=25, pady=(10, 0))
    vendavel_var = ctk.StringVar(value="SIM")
    sw_ven = ctk.CTkSegmentedButton(form, values=["SIM", "NÃO"], variable=vendavel_var, height=40)
    sw_ven.grid(row=3, column=0, padx=15, pady=(5, 25), sticky="ew")

    ctk.CTkLabel(form, text="OBSERVAÇÕES INTERNAS", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=2, column=1, sticky="w", padx=25, pady=(10, 0))
    e_obs = ctk.CTkEntry(form, placeholder_text="Detalhes do item...", height=40, corner_radius=8)
    e_obs.grid(row=3, column=1, columnspan=3, padx=15, pady=(5, 25), sticky="ew")

    # Linha 3 (Detalhes Agronômicos - V7.0)
    ctk.CTkLabel(form, text="DETALHES AGRONÔMICOS (V7.0)", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["primaria"]).grid(row=4, column=0, columnspan=4, sticky="w", padx=25, pady=(20, 10))

    ctk.CTkLabel(form, text="PRINCÍPIO ATIVO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=5, column=0, sticky="w", padx=25, pady=(5, 0))
    e_principio = ctk.CTkEntry(form, placeholder_text="Ex: Glifosato...", height=40, corner_radius=8)
    e_principio.grid(row=6, column=0, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="COMPOSIÇÃO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=5, column=1, sticky="w", padx=25, pady=(5, 0))
    e_comp = ctk.CTkEntry(form, placeholder_text="Ex: 480g/L...", height=40, corner_radius=8)
    e_comp.grid(row=6, column=1, padx=15, pady=(5, 10), sticky="ew")

    ctk.CTkLabel(form, text="CLASSE TOXICOLÓGICA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=5, column=2, columnspan=2, sticky="w", padx=25, pady=(5, 0))
    combo_tox = ctk.CTkComboBox(form, values=["", "VERMELHO (Extremamente)", "AMARELO (Altamente)", "AZUL (Medianamente)", "VERDE (Pouco)"], height=40, corner_radius=8)
    combo_tox.set("")
    combo_tox.grid(row=6, column=2, columnspan=2, padx=15, pady=(5, 10), sticky="ew")

    # ======================
    # BOTÕES
    # ======================
    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    selecionado_id = {"id": None}

    def limpar():
        selecionado_id["id"] = None
        e_nome.delete(0, 'end'); e_obs.delete(0, 'end'); combo_uni.set("KG"); combo_tipo.set("PRODUTO")
        estocavel_var.set("SIM"); vendavel_var.set("SIM")
        # Limpar Campos V7
        e_principio.delete(0, 'end'); e_comp.delete(0, 'end'); combo_tox.set("")

    def atualizar_lista():
        lista.delete(0, 'end')
        conn = db.conectar()
        for i in conn.execute("SELECT id, nome, unidade, tipo, estocavel, vendavel FROM cadastro WHERE COALESCE(is_deleted, 0) = 0 ORDER BY nome"):
            st = "ESTOQUE" if i[4] == 1 else "S/ ESTOQUE"
            ve = "VENDA" if i[5] == 1 else "INTERNO"
            lista.insert('end', f"{str(i[0]).zfill(3)} | {str(i[1]).ljust(30)} | {i[2].center(8)} | {i[3].ljust(12)} | {st} | {ve}")
        conn.close()

    btn_del = ctk.CTkButton(botoes, text="🗑 EXCLUIR", height=45, width=150, fg_color=styles.CORES["erro"], hover_color="#B91C1C", font=ctk.CTkFont(weight="bold"), command=lambda: excluir())
    btn_del.pack(side="left")

    btn_save = ctk.CTkButton(botoes, text="✨ SALVAR ITEM", height=45, width=200, fg_color=styles.CORES["sucesso"], hover_color="#059669", font=ctk.CTkFont(weight="bold"), command=lambda: salvar())
    btn_save.pack(side="right")

    # ======================
    # LISTA
    # ======================
    ctk.CTkLabel(t, text="Itens Cadastrados:", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

    frame_lista = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    frame_lista.pack(fill="both", expand=True)

    import tkinter as tk
    scrollbar = tk.Scrollbar(frame_lista)
    scrollbar.pack(side="right", fill="y")
    
    lista = tk.Listbox(frame_lista, font=("Inter", 11), relief="flat", bd=0, highlightthickness=0, bg="white", fg="#1E293B", selectbackground=styles.CORES["primaria"], selectforeground="white", yscrollcommand=scrollbar.set)
    lista.pack(fill="both", expand=True, padx=10, pady=10)
    scrollbar.config(command=lista.yview)

    def selecionar(event):
        if not lista.curselection(): return
        item = lista.get(lista.curselection()[0])
        cid = int(item.split(" | ")[0])
        conn = db.conectar()
        # V7: Adicionado fetch das novas colunas (coalesce para evitar None crash no insert UI)
        r = conn.execute("""
            SELECT id, nome, unidade, tipo, estocavel, vendavel, observacao, 
            principio_ativo, composicao, classe_toxicologica 
            FROM cadastro WHERE id=?""", (cid,)).fetchone()
        conn.close()
        if r:
            limpar(); selecionado_id["id"] = r[0]
            e_nome.insert(0, r[1]); combo_uni.set(r[2]); combo_tipo.set(r[3])
            estocavel_var.set("SIM" if r[4] == 1 else "NÃO")
            vendavel_var.set("SIM" if r[5] == 1 else "NÃO")
            e_obs.insert(0, r[6] or "")
            
            # V7 Fields
            e_principio.insert(0, r[7] or "")
            e_comp.insert(0, r[8] or "")
            combo_tox.set(r[9] or "")

    lista.bind("<<ListboxSelect>>", selecionar)
    atualizar_lista()

    def salvar():
        nm = e_nome.get().strip()
        if not nm: messagebox.showerror("Erro", "Nome é obrigatório"); return
        est = 1 if estocavel_var.get() == "SIM" else 0
        ven = 1 if vendavel_var.get() == "SIM" else 0
        
        # Novos campos V7
        princ = e_principio.get().strip()
        comp = e_comp.get().strip()
        tox = combo_tox.get().strip()

        conn = db.conectar()
        try:
            if selecionado_id["id"]:
                conn.execute("""
                    UPDATE cadastro SET 
                    nome=?, unidade=?, tipo=?, estocavel=?, vendavel=?, observacao=?, 
                    principio_ativo=?, composicao=?, classe_toxicologica=?, last_updated=?, sync_status=0
                    WHERE id=?""",
                             (nm, combo_uni.get(), combo_tipo.get(), est, ven, e_obs.get(), princ, comp, tox, db.now_iso(), selecionado_id["id"]))
            else:
                conn.execute("""
                    INSERT INTO cadastro 
                    (uuid, nome, unidade, tipo, estocavel, vendavel, observacao, principio_ativo, composicao, classe_toxicologica, last_updated, sync_status, is_deleted) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0)""",
                             (db.new_uuid(), nm, combo_uni.get(), combo_tipo.get(), est, ven, e_obs.get(), princ, comp, tox, db.now_iso()))
            conn.commit()
            messagebox.showinfo("Sucesso", "Item cadastrado!"); limpar(); atualizar_lista()
        except Exception as e: 
            messagebox.showerror("Erro", f"Falha técnica ao salvar item: {e}")
        finally: conn.close()

    def excluir():
        if not selecionado_id["id"]: return
        if messagebox.askyesno("Confirmação", "Deseja remover este item?"):
            db.soft_delete("cadastro", selecionado_id["id"])
            limpar(); atualizar_lista()

    t.bind("<Return>", lambda e: salvar())
