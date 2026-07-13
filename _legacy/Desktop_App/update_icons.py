import os
from PIL import Image, ImageOps

# Caminhos
source_image_path = r"C:/Users/Bruno/.gemini/antigravity/brain/5ea1803b-d08c-4498-ae77-9afc09017bb5/uploaded_media_1769472996208.png"
assets_dir = r"c:\Users\Bruno\Documents\AgroGB\mobile_app\assets"

if not os.path.exists(source_image_path):
    print(f"Erro: Imagem fonte não encontrada em {source_image_path}")
    exit(1)

if not os.path.exists(assets_dir):
    os.makedirs(assets_dir)

def make_icon(src, dest, size):
    img = Image.open(src).convert("RGBA")
    # Resize mantendo proporção e centralizando se necessário, ou esticando?
    # Para ícone, melhor redimensionar com alta qualidade
    img = img.resize(size, Image.Resampling.LANCZOS)
    img.save(dest)
    print(f"Gerado: {dest}")

def make_splash(src, dest, size):
    img = Image.open(src).convert("RGBA")
    # Splash screen: criar fundo branco e colocar logo no meio
    background = Image.new("RGB", size, (255, 255, 255))
    
    # Redimensionar logo para caber bem na tela (largura 60% da tela)
    target_width = int(size[0] * 0.6)
    ratio = target_width / img.width
    target_height = int(img.height * ratio)
    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    # Centralizar
    x = (size[0] - target_width) // 2
    y = (size[1] - target_height) // 2
    
    background.paste(img, (x, y), img)
    background.save(dest)
    print(f"Gerado: {dest}")

print("Processando logotipo...")

# 1. icon.png (1024x1024)
make_icon(source_image_path, os.path.join(assets_dir, "icon.png"), (1024, 1024))

# 2. adaptive-icon.png (1024x1024)
make_icon(source_image_path, os.path.join(assets_dir, "adaptive-icon.png"), (1024, 1024))

# 3. favicon.png (48x48)
make_icon(source_image_path, os.path.join(assets_dir, "favicon.png"), (48, 48))

# 4. splash.png (1242x2436) - Logo centralizado em fundo branco
make_splash(source_image_path, os.path.join(assets_dir, "splash.png"), (1242, 2436))

print("Sucesso! Ícones atualizados com a imagem enviada.")
