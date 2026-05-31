# usuarios.py
# Cadastro e controle de usuários (ADM) com visual moderno CustomTkinter

import customtkinter as ctk
from tkinter import messagebox
import styles

def view_usuarios(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=40, pady=20)

    # HEADER
    ctk.CTkLabel(t, text="Controle de Acesso - Usuários", font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(10, 20), anchor="w")

    # ==========================
    # FORMULÁRIO (CARD)
    # ==========================
    form = ctk.CTkFrame(t, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color=styles.CORES["borda"][0])
    form.pack(fill="x", pady=10)

    # Grid config
    form.grid_columnconfigure((0, 1, 2), weight=1)

    ctk.CTkLabel(form, text="USUÁRIO LOGIN", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=0, sticky="w", padx=30, pady=(20, 0))
    e_usuario = ctk.CTkEntry(form, placeholder_text="Ex: joao.agro...", height=40, corner_radius=8)
    e_usuario.grid(row=1, column=0, padx=20, pady=(5, 30), sticky="ew")
    
    ctk.CTkLabel(form, text="SENHA DE ACESSO", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=1, sticky="w", padx=30, pady=(20, 0))
    e_senha = ctk.CTkEntry(form, placeholder_text="No mínimo 4 caracteres...", show="*", height=40, corner_radius=8)
    e_senha.grid(row=1, column=1, padx=20, pady=(5, 30), sticky="ew")
    
    ctk.CTkLabel(form, text="NÍVEL PERMISSÃO", font=ctk.CTkFont(size=12, weight="bold"), text_color=styles.CORES["texto_leve"]).grid(row=0, column=2, sticky="w", padx=30, pady=(20, 0))
    cb_nivel = ctk.CTkComboBox(form, values=["USUARIO", "ADM"], height=40, corner_radius=8)
    cb_nivel.set("USUARIO")
    cb_nivel.grid(row=1, column=2, padx=20, pady=(5, 30), sticky="ew")

    # ==========================
    # BOTÕES
    # ==========================
    botoes = ctk.CTkFrame(t, fg_color="transparent")
    botoes.pack(fill="x", pady=10)

    import supabase_client
    
    selecionado_id = {"id": None}
    usuarios_data = []

    def limpar():
        selecionado_id["id"] = None
        e_usuario.delete(0, 'end'); e_senha.delete(0, 'end')

    def atualizar():
        lista.delete(0, 'end')
        usuarios_data.clear()
        perfis = supabase_client.get_all_profiles()
        for idx, p in enumerate(perfis):
            usuarios_data.append(p)
            email = p.get("email", "Sem Email")
            role = p.get("role", "INDEFINIDO")
            lista.insert('end', f"{str(idx).zfill(3)} | {email.ljust(30)} | {role}")

    btn_excluir = ctk.CTkButton(botoes, text="🗑 EXCLUIR SELECIONADO", fg_color=styles.CORES["erro"], hover_color="#B91C1C", 
                                font=ctk.CTkFont(weight="bold"), height=45, width=180, command=lambda: excluir())
    btn_excluir.pack(side="left")

    btn_salvar = ctk.CTkButton(botoes, text="✨ SALVAR NOVO USUÁRIO", fg_color=styles.CORES["sucesso"], hover_color="#059669",
                              font=ctk.CTkFont(weight="bold"), height=45, width=220, command=lambda: salvar())
    btn_salvar.pack(side="right")

    # ==========================
    # LISTA
    # ==========================
    ctk.CTkLabel(t, text="Usuários do Sistema (Nuvem):", font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", pady=(15, 5))

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

    def selecionar(event):
        if not lista.curselection(): return
        idx = lista.curselection()[0]
        if idx < len(usuarios_data):
            selecionado_id["id"] = usuarios_data[idx].get("id")

    lista.bind("<<ListboxSelect>>", selecionar)
    atualizar()

    def salvar():
        user, pw, nivel = e_usuario.get().strip(), e_senha.get().strip(), cb_nivel.get()
        if not user or not pw:
            messagebox.showerror("Erro", "Nome e Senha são obrigatórios."); return

        nome_completo = user.split("@")[0].capitalize()
        
        sucesso, resposta = supabase_client.admin_create_user(user, pw, nivel, nome_completo)
        
        if sucesso:
            messagebox.showinfo("Sucesso", f"Usuário {user} criado na Nuvem com nível {nivel}!")
            limpar()
            atualizar()
        else:
            msg_erro = resposta.get("msg", str(resposta))
            messagebox.showerror("Erro do Supabase", f"Falha ao criar usuário:\n{msg_erro}")

    def excluir():
        if not selecionado_id["id"]:
            messagebox.showwarning("Atenção", "Selecione um usuário."); return
        if messagebox.askyesno("Confirmação", "Deseja remover este perfil da Nuvem?"):
            sucesso = supabase_client.admin_delete_user(selecionado_id["id"])
            if sucesso:
                messagebox.showinfo("Sucesso", "Perfil excluído com sucesso.")
                selecionado_id["id"] = None
                atualizar()
            else:
                messagebox.showerror("Erro", "Falha ao excluir perfil ou falta de permissão.")
