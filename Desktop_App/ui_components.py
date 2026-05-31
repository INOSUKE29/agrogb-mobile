import customtkinter as ctk
from PIL import Image
import os
import sys

# Cache de imagens para evitar reload constante
_img_cache = {}

def get_resource_path(relative_path):
    """Retorna caminho absoluto para recursos (compatível com PyInstaller)"""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def get_icon(path, size=(24, 24)):
    """Carrega e caccheia ícones"""
    full_path = get_resource_path(path)
    key = (full_path, size) # Cache por path E tamanho
    
    if key in _img_cache:
        return _img_cache[key]
    
    if os.path.exists(full_path):
        try:
            pil_img = Image.open(full_path)
            ctk_img = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=size)
            _img_cache[key] = ctk_img
            return ctk_img
        except Exception as e:
            print(f"Erro ao carregar icone {path}: {e}")
            return None
    return None

class ModernList(ctk.CTkScrollableFrame):
    """
    Lista moderna para substituir o tk.Listbox.
    Suporta renderização customizada de linhas com titulo, subtitulo e ícone.
    """
    def __init__(self, master, item_height=60, command=None, **kwargs):
        super().__init__(master, **kwargs)
        self.items = []
        self.item_height = item_height
        self.command = command # Callback ao clicar (recebe o objeto item)
        self.selected_item = None
        self.rows = []

        # Estilo interno
        self.fg_color = "transparent"

    def clear(self):
        for widget in self.winfo_children():
            widget.destroy()
        self.items = []
        self.rows = []
        self.selected_item = None

    def add_item(self, id_val, title, subtitle="", icon_path=None, badge_text=None, badge_color=None):
        """Adiciona um item visual à lista"""
        row_frame = ctk.CTkFrame(self, corner_radius=8, fg_color="white", height=self.item_height)
        row_frame.pack(fill="x", pady=5, padx=5)
        
        # Configurar grid do row
        row_frame.grid_columnconfigure(1, weight=1)
        
        # Icone
        if icon_path:
            img = get_icon(icon_path, size=(32, 32))
            if img:
                lbl_icon = ctk.CTkLabel(row_frame, text="", image=img)
                lbl_icon.grid(row=0, column=0, rowspan=2, padx=10, pady=5)
        
        # Textos
        lbl_title = ctk.CTkLabel(row_frame, text=title, font=ctk.CTkFont(size=13, weight="bold"), text_color="#1E293B", anchor="w")
        lbl_title.grid(row=0, column=1, sticky="ew", padx=(5, 10), pady=(5, 0))
        
        lbl_sub = ctk.CTkLabel(row_frame, text=subtitle, font=ctk.CTkFont(size=11), text_color="#64748B", anchor="w")
        lbl_sub.grid(row=1, column=1, sticky="ew", padx=(5, 10), pady=(0, 5))
        
        # Badge (opcional)
        if badge_text:
            color = badge_color if badge_color else "#3B82F6"
            lbl_badge = ctk.CTkLabel(row_frame, text=f" {badge_text} ", fg_color=color, text_color="white", corner_radius=8, font=ctk.CTkFont(size=10, weight="bold"))
            lbl_badge.grid(row=0, column=2, rowspan=2, padx=10)

        # Dados do item
        item_data = {"id": id_val, "title": title, "subtitle": subtitle}
        self.items.append(item_data)
        self.rows.append(row_frame)

        # Eventos
        def on_click(e):
            self._select_row(row_frame, item_data)
        
        for w in row_frame.winfo_children():
            w.bind("<Button-1>", on_click)
        row_frame.bind("<Button-1>", on_click)
        
    def _select_row(self, widget, item_data):
        # Resetar cores
        for row in self.rows:
            row.configure(fg_color="white", border_width=0)
            
        # Destacar selecionado
        widget.configure(fg_color="#F0FDF4", border_color="#15803D", border_width=2)
        self.selected_item = item_data
        
        if self.command:
            self.command(item_data)

class StatCard(ctk.CTkFrame):
    """Card de estatística para Dashboards"""
    def __init__(self, master, title, value, icon_emoji="📊", color="#3B82F6", **kwargs):
        super().__init__(master, corner_radius=10, fg_color="white", border_width=1, border_color="#E2E8F0", **kwargs)
        
        self.lbl_title = ctk.CTkLabel(self, text=title.upper(), font=ctk.CTkFont(size=11, weight="bold"), text_color="#64748B")
        self.lbl_title.pack(pady=(15, 5))
        
        self.lbl_value = ctk.CTkLabel(self, text=value, font=ctk.CTkFont(size=24, weight="bold"), text_color=color)
        self.lbl_value.pack(pady=(0, 15))
        
    def update_value(self, value, color=None):
        self.lbl_value.configure(text=value)
        if color:
            self.lbl_value.configure(text_color=color)

class LauncherButton(ctk.CTkFrame):
    """
    Botão estilo Launcher (Grade) para o menu principal.
    Simples, quadrado, iconografia flat. Suporta imagens PNG.
    """
    def __init__(self, master, text, icon_emoji="🟦", icon_path=None, command=None, size=(150, 150), fg_color="white", text_color="#334151", hover_color="#15803D", **kwargs):
        super().__init__(master, width=size[0], height=size[1], corner_radius=10, fg_color=fg_color, border_width=1, border_color="#E2E8F0", **kwargs)
        self.command = command
        self.hover_color = hover_color
        
        self.pack_propagate(False) # Respeita tamanho fixo
        
        # Layout interno usando pack para evitar corte com escala do Windows (DPI)
        self.lbl_icon = ctk.CTkLabel(self, text=icon_emoji, font=ctk.CTkFont(size=40), text_color=text_color)
        
        # Tenta carregar imagem se fornecida
        if icon_path:
            img = get_icon(icon_path, size=(64, 64))
            if img:
                self.lbl_icon.configure(image=img, text="")
                
        self.lbl_icon.pack(expand=True, pady=(20, 0))
        
        # Texto
        self.lbl_text = ctk.CTkLabel(self, text=text.upper(), font=ctk.CTkFont(size=12, weight="bold"), text_color=text_color, wraplength=size[0]-20)
        self.lbl_text.pack(expand=True, pady=(0, 20))
        
        # Eventos
        self.bind("<Button-1>", self._on_click)
        self.lbl_icon.bind("<Button-1>", self._on_click)
        self.lbl_text.bind("<Button-1>", self._on_click)
        
        self.bind("<Enter>", self._on_enter)
        self.bind("<Leave>", self._on_leave)
        
        self.default_fg = fg_color

    def _on_click(self, event):
        if self.command: self.command()

    def _on_enter(self, event):
        self.configure(border_color=self.hover_color, border_width=2) 

    def _on_leave(self, event):
        self.configure(border_color="#E2E8F0", border_width=1)
