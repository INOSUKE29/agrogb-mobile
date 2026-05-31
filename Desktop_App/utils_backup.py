# utils_backup.py
# Utilitário de segurança e backup automatizado para o AgroGB

import os
import shutil
import zipfile
from datetime import datetime
from tkinter import messagebox

def realizar_backup_imediato(manual=False):
    """
    Realiza uma cópia compactada do banco de dados agrogb.db
    """
    import db
    db_file = db.DB_PATH
    
    app_data = os.getenv('LOCALAPPDATA', os.path.expanduser('~'))
    backup_dir = os.path.join(app_data, "AgroGB", "backups")
    
    if not os.path.exists(db_file):
        if manual: messagebox.showerror("Erro", f"Banco de dados '{db_file}' não encontrado para backup.")
        return False

    try:
        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"backup_agro_gb_{timestamp}.zip"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Cria o ZIP protegendo o arquivo original
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(db_file, arcname="agrogb.db")
            
        # Limpeza: mantém apenas os últimos 10 backups para não lotar o disco
        manter_ultimos_backups(backup_dir, 10)
        
        if manual:
            messagebox.showinfo("Segurança", f"Backup realizado com sucesso!\nSalvo em: {backup_path}")
        return True
        
    except Exception as e:
        if manual: messagebox.showerror("Erro no Backup", f"Falha ao salvar dados: {e}")
        return False

def manter_ultimos_backups(diretorio, max_arquivos):
    """Remove backups antigos para economizar espaço"""
    arquivos = [os.path.join(diretorio, f) for f in os.listdir(diretorio) if f.endswith(".zip")]
    arquivos.sort(key=os.path.getmtime, reverse=True)
    
    for arq in arquivos[max_arquivos:]:
        try: os.remove(arq)
        except: pass

def rotina_fechamento():
    """Gatilho silencioso chamado ao fechar o programa"""
    realizar_backup_imediato(manual=False)
