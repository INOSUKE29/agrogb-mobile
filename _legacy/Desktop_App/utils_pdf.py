# utils_pdf.py
# Utilitário para geração de PDFs profissionais integrados ao AgroGB

import os
from datetime import datetime

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    from reportlab.lib import colors
except ImportError:
    A4 = None
    canvas = None
    cm = 28.3465
    colors = None

def gerar_recibo_venda(venda_data):
    """
    venda_data: dict com {id, data, cliente, produto, qtd, valor, obs}
    """
    app_data = os.getenv('LOCALAPPDATA', os.path.expanduser('~'))
    base_dir = os.path.join(app_data, "AgroGB", "recibos")
    os.makedirs(base_dir, exist_ok=True)
    
    filename = os.path.join(base_dir, f"recibo_venda_{venda_data['id']}.pdf")
    if canvas is None:
        txt_filename = filename.replace(".pdf", ".txt")
        with open(txt_filename, "w", encoding="utf-8") as f:
            f.write("AGROGB - RECIBO DE VENDA\n")
            f.write(f"Recibo: {venda_data['id']}\n")
            f.write(f"Data: {venda_data['data']}\n")
            f.write(f"Cliente: {venda_data['cliente']}\n")
            f.write(f"Produto: {venda_data['produto']}\n")
            f.write(f"Quantidade: {venda_data['qtd']}\n")
            f.write(f"Valor total: R$ {venda_data['valor']:,.2f}\n")
            if venda_data.get('obs'):
                f.write(f"Observações: {venda_data['obs']}\n")
            f.write(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        return txt_filename
    
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    # 1. CABEÇALHO COM LOGO
    try:
        # Usa a logo oficial carregada pelo usuário
        c.drawImage("assets/logo_oficial.jpg", 2*cm, height-3.5*cm, width=2.5*cm, preserveAspectRatio=True, mask='auto')
    except:
        # Fallback para o ícone original caso a logo não exista
        try: c.drawImage("assets/app_icon.png", 2*cm, height-3.5*cm, width=2.5*cm, preserveAspectRatio=True, mask='auto')
        except: pass
    
    c.setFont("Helvetica-Bold", 18)
    c.drawString(5*cm, height-2.2*cm, "AGROGB - GESTÃO RURAL")
    c.setFont("Helvetica", 10)
    c.drawString(5*cm, height-2.8*cm, "Sistema de Gestão Profissional de Safra")
    
    c.setStrokeColor(colors.lightgrey)
    c.line(2*cm, height-4*cm, width-2*cm, height-4*cm)
    
    # 2. CORPO DO RECIBO
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width/2, height-5*cm, f"RECIBO DE VENDA Nº {venda_data['id']}")
    
    y = height - 7*cm
    c.setFont("Helvetica", 12)
    
    # Grid de dados
    dados = [
        ("DATA DA VENDA:", venda_data['data']),
        ("CLIENTE:", venda_data['cliente']),
        ("PRODUTO:", venda_data['produto']),
        ("QUANTIDADE:", f"{venda_data['qtd']} unidades"),
        ("VALOR TOTAL:", f"R$ {venda_data['valor']:,.2f}"),
    ]
    
    for label, valor in dados:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2.5*cm, y, label)
        c.setFont("Helvetica", 11)
        c.drawString(7*cm, y, str(valor))
        y -= 0.8*cm
    
    # Observações
    if venda_data.get('obs'):
        y -= 0.5*cm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2.5*cm, y, "OBSERVAÇÕES:")
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(7*cm, y, venda_data['obs'])
        y -= 1.2*cm
        
    # 3. RODAPÉ DE ASSINATURA
    c.line(4*cm, 5*cm, width-4*cm, 5*cm)
    c.drawCentredString(width/2, 4.5*cm, "Assinatura do Responsável")
    
    c.setFont("Helvetica", 8)
    c.drawCentredString(width/2, 2*cm, f"Documento gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    
    c.save()
    return filename

def abrir_whatsapp(mensagem, telefone=None):
    """Gera link do WhatsApp para compartilhamento"""
    import webbrowser
    import urllib.parse
    
    msg_url = urllib.parse.quote(mensagem)
    if telefone:
        link = f"https://wa.me/{telefone}?text={msg_url}"
    else:
        link = f"https://wa.me/?text={msg_url}"
        
    webbrowser.open(link)
