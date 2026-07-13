import os
import sys

# Tentar importar PIL (Geralmente vem com CustomTkinter)
try:
    from PIL import Image, ImageDraw
    print("Biblioteca PIL encontrada!")
except ImportError:
    print("PIL não encontrada via 'import PIL'. Tentando 'import Image'...")
    try:
        import Image, ImageDraw
    except ImportError:
        print("❌ ERRO: Biblioteca Pillow (PIL) não instalada.")
        print("O build do app precisa de imagens PNG.")
        sys.exit(1)

# Caminho dos assets
base_dir = r"c:\Users\Bruno\Documents\AgroGB\mobile_app\assets"
if not os.path.exists(base_dir):
    os.makedirs(base_dir)
    print(f"Pasta criada: {base_dir}")

# Função para gerar imagem sólida
def criar_imagem(nome, tamanho, cor):
    try:
        path = os.path.join(base_dir, nome)
        img = Image.new('RGB', tamanho, color=cor)
        
        # Desenhar um detalhe simples para não ficar tudo igual
        d = ImageDraw.Draw(img)
        w, h = tamanho
        d.rectangle([w*0.2, h*0.2, w*0.8, h*0.8], outline="white", width=int(w*0.02))
        
        img.save(path)
        print(f"✅ Gerado: {nome} ({tamanho[0]}x{tamanho[1]})")
    except Exception as e:
        print(f"❌ Erro ao criar {nome}: {e}")

# Gerar arquivos exigidos pelo app.json
print("Gerando assets padrão para o Expo...")
criar_imagem('icon.png', (1024, 1024), '#10B981')           # Verde principal
criar_imagem('adaptive-icon.png', (1024, 1024), '#10B981')  # Verde principal
criar_imagem('splash.png', (1242, 2436), '#059669')         # Verde mais escuro
criar_imagem('favicon.png', (48, 48), '#10B981')            # Pequeno

print("\nConcluído! Tente o build novamente.")
