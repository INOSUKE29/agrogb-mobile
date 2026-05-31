# utils_update.py
# Motor de atualização automática para o AgroGB v2.0
# Versão Ultra-Estável: usa ZERO bibliotecas externas para evitar erros no EXE.

import urllib.request
import json
import os
import sys
import subprocess
import threading
from tkinter import messagebox

VERSION = "2.1.0"
# URL Onde ficaria o arquivo de metadados das versões
UPDATE_URL = "https://raw.githubusercontent.com/usuario/agrogb/main/update_v2.json"

def verificar_atualizacao(manual=False):
    """
    Inicia a verificação de versão em uma thread separada para não travar o Login
    """
    thread = threading.Thread(target=_check_remote_version, args=(manual,))
    thread.daemon = True
    thread.start()

def _check_remote_version(manual):
    try:
        # 1. Busca metadados remotos usando a biblioteca NATIVA do Python (urllib)
        # Tenta conectar ao GitHub para ver se há nova versão
        with urllib.request.urlopen(UPDATE_URL, timeout=5) as response:
            data = json.loads(response.read().decode())
            nova_versao = data.get("version", VERSION)
            url_download = data.get("url", "")
        
        if manual:
            print(f"Versão Local: {VERSION} | Versão na Nuvem: {nova_versao}")

        if nova_versao > VERSION:
            if messagebox.askyesno("Atualização Disponível", 
                                  f"Uma nova versão ({nova_versao}) do AgroGB foi encontrada!\n\n"
                                  "Você deseja baixar a nova versão agora?"):
                import webbrowser
                webbrowser.open(url_download)
                sys.exit() # Fecha o programa para o usuário instalar a nova
        else:
            if manual:
                messagebox.showinfo("Sistema Atualizado", 
                                  f"Você já está na v{VERSION}! Este é o AgroGB em sua melhor forma.")
                
    except Exception as e:
        if manual:
            messagebox.showerror("Conexão", f"Não foi possível checar atualizações agora.\nVerifique sua internet.")

def _executar_update_total():
    """Lógica de substituição de binário"""
    with open("agrogb_updater.bat", "w") as f:
        f.write("@echo off\n")
        f.write("timeout /t 2 /nobreak > nul\n")
        f.write("start AgroGB_v2.exe\n")
        f.write("del %0\n")
    
    messagebox.showinfo("AgroGB Update", "O sistema será fechado para atualizar.")
    subprocess.Popen(["agrogb_updater.bat"], shell=True)
    sys.exit()

def registrar_versao_binario(root):
    """Adiciona a versão visual no título"""
    root.title(f"AgroGB v{VERSION} - Safra 2026")
