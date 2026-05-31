# styles.py
# Definições de estilo moderno para o AgroGB usando CustomTkinter v2026

import customtkinter as ctk

# Configuração Global do Tema
ctk.set_appearance_mode("light") 
ctk.set_default_color_theme("blue") 

# Paleta de Cores (Padrão Profissional)
# Paleta de Cores (Tema: Agro Comfort / Natural)
# Foco em redução de brilho e tons mais corporativos/campo
CORES = {
    "fundo": ("#F5F7F5", "#1C1C1C"),       # Off-white esverdeado (menos agressivo que branco gelo)
    "sidebar": ("#2F3E30", "#1E1E1E"),    # Verde Floresta Profundo / Cinza Carvão
    "card": ("#FFFFFF", "#2D2D2D"),
    "primaria": "#15803D",                 # Verde Agro Sóbrio (Substitui azul tech)
    "destaque": "#16A34A",                 # Verde Folha
    "sucesso": "#166534",                  # Verde Escuro Sucesso
    "aviso": "#D97706",                    # Laranja Queimado (menos neon)
    "erro": "#DC2626",                     # Vermelho Tijolo
    "texto": ("#1F2937", "#E5E7EB"),       # Cinza Chumbo
    "texto_leve": ("#4B5563", "#9CA3AF"),
    "hover": ("#E5E7EB", "#374151"),
    "borda": ("#CBD5E1", "#374151")
}

# Fontes Modernas (Inter / Segoe UI)
FONTES = {
    "titulo": ("Inter", 24, "bold"),
    "subtitulo": ("Inter", 16, "bold"),
    "texto": ("Inter", 12),
    "botao": ("Inter", 12, "bold"),
    "small": ("Inter", 11)
}

def aplicar_estilo_botao(widget, tipo="padrao"):
    if tipo == "sucesso":
        widget.configure(fg_color=CORES["sucesso"], hover_color="#059669")
    elif tipo == "erro":
        widget.configure(fg_color=CORES["erro"], hover_color="#B91C1C")
    else:
        widget.configure(fg_color=CORES["primaria"], hover_color="#2563EB")

# --- Funções de Compatibilidade (Para módulos Legados) ---
def configurar_toplevel(t): pass
def estilo_card(f): pass
def estilo_entry(e): pass
