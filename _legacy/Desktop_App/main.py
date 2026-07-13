# main.py
import customtkinter as ctk
import db
import telas

def main():
    db.criar_tabelas()

    # Motor de Atualização Silenciosa
    import utils_update
    import sync_cloud # Módulo de Sincronização com Supabase
    
    # Inicia Sincronização em Background (Thread)
    try:
        sync_cloud.start_sync_thread()
    except Exception as e:
        print(f"Erro ao iniciar sync: {e}")

    # Inicializa com CustomTkinter para suporte a temas modernos
    root = ctk.CTk()
    utils_update.registrar_versao_binario(root)
    # utils_update.verificar_atualizacao() # Desativado até configurar servidor real
    
    root.withdraw()  # esconde a janela principal durante o login
    
    # Define o ícone do sistema
    try:
        root.iconbitmap("assets/app_icon.ico") # Formato ICO é melhor para Windows Taskbar
    except:
        try:
            from PIL import Image
            img = Image.open("assets/app_icon.png")
            root.iconphoto(False, ctk.CTkImage(light_image=img, dark_image=img))
        except: pass

    # Função de segurança ao fechar
    def ao_fechar():
        import utils_backup
        utils_backup.rotina_fechamento()
        root.destroy()

    root.protocol("WM_DELETE_WINDOW", ao_fechar)
    telas.tela_login(root)

    root.mainloop()

if __name__ == "__main__":
    main()

