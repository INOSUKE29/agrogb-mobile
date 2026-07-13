# build_exe.py
import os
import subprocess
import sys
import customtkinter

def build():
    print("Iniciando BUILD DEFINITIVO E ULTRA-LEVE do AgroGB v2.0...")
    
    # Removido 'requests' e dependências externas problemáticas.
    # Agora o sistema usa apenas ferramentas nativas do Python + CustomTkinter.
    cmd = [
        "pyinstaller",
        "--noconsole",
        "--onefile",
        "--add-data", "assets;assets",
        "--collect-all", "customtkinter",
        "--icon", "assets/app_icon.ico",
        "--name", "AgroGB_v2",
        "--clean",
        "main.py"
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("\n🚀 BUILD FINALIZADO COM SUCESSO!")
        print("Arquivo gerado: dist/AgroGB_v2.exe")
    except Exception as e:
        print(f"\n❌ ERRO NO BUILD: {e}")

if __name__ == "__main__":
    build()
