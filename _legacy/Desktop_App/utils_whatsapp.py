import webbrowser
import urllib.parse
from tkinter import messagebox

def abrir_whatsapp(numero, mensagem=""):
    """
    Abre o link do WhatsApp para o número informado.
    Remove formatação (parênteses, traços) antes de enviar.
    """
    if not numero:
        messagebox.showwarning("Atenção", "Número de celular não informado.")
        return

    # Limpar número (manter apenas digitos)
    numero_limpo = "".join(filter(str.isdigit, numero))
    
    # Garantir código do país (Brasil 55 padrão se não tiver)
    if not numero_limpo.startswith("55") and len(numero_limpo) >= 10:
        numero_limpo = "55" + numero_limpo

    # URL Encode da mensagem
    msg_encoded = urllib.parse.quote(mensagem)
    
    url = f"https://wa.me/{numero_limpo}?text={msg_encoded}"
    
    try:
        webbrowser.open(url)
    except Exception as e:
        messagebox.showerror("Erro", f"Não foi possível abrir o navegador: {e}")
