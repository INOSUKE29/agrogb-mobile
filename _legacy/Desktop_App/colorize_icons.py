from PIL import Image, ImageOps, ImageEnhance
import os

def process_icon(input_path, output_path, color_mode):
    if not os.path.exists(input_path): return

    img = Image.open(input_path).convert("RGBA")
    
    # 1. Transparência
    datas = img.getdata()
    newData = []
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # 2. Saturação
    enhancer = ImageEnhance.Color(img)
    img = enhancer.enhance(2.2)
    
    # 3. Cores
    r, g, b, a = img.split()
    
    if color_mode == "gold": new_img = Image.merge("RGBA", (r, r, b, a))
    elif color_mode == "red": new_img = Image.merge("RGBA", (r, g, g, a))
    elif color_mode == "blue": new_img = Image.merge("RGBA", (b, g, r, a))
    elif color_mode == "purple": new_img = Image.merge("RGBA", (b, r, g, a))
    elif color_mode == "cyan": new_img = Image.merge("RGBA", (g, b, r, a))
    elif color_mode == "lime": new_img = Image.merge("RGBA", (g, r, g, a))
    else: new_img = img

    new_img.save(output_path)
    print(f"Icone processado: {output_path}")

# Mapeamento para garantir todos os módulos
icon_map = {
    # Originais
    "assets/registro.png": "original",
    "assets/clientes.png": "blue",
    "assets/vendas.png": "gold",
    "assets/compras.png": "red",
    "assets/plantio.png": "cyan",
    "assets/colheita.png": "purple",
    
    # Derivados para cobrir o que falta
    "assets/culturas.png": "lime",   
    "assets/descarte.png": "red",    
    "assets/estoque.png": "gold",    
    "assets/usuarios.png": "blue",   
    "assets/financeiro.png": "lime", 
    "assets/relatorios.png": "purple", # Baseado em colheita (dados)
    "assets/margens.png": "cyan",      # Baseado em plantio (crescimento)
}

# Criar cópias para os derivados antes de processar
derivados = {
    "assets/culturas.png": "assets/plantio.png",
    "assets/descarte.png": "assets/vendas.png",
    "assets/estoque.png": "assets/registro.png",
    "assets/usuarios.png": "assets/clientes.png",
    "assets/financeiro.png": "assets/vendas.png",
    "assets/relatorios.png": "assets/colheita.png",
    "assets/margens.png": "assets/plantio.png",
}

for dest, src in derivados.items():
    if os.path.exists(src) and not os.path.exists(dest):
        img = Image.open(src)
        img.save(dest)

# Processar Tudo
for path, mode in icon_map.items():
    process_icon(path, path.replace(".png", "_color.png"), mode)
