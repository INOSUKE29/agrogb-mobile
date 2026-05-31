# dimensionamento.py
# Módulo de Cálculo de Dimensionamento de Colheita
# Inspirado na ferramenta SOMA (referência visual)

import customtkinter as ctk
import styles
from tkinter import messagebox

def view_dimensionamento(parent):
    # Container Principal
    t = ctk.CTkFrame(parent, fg_color="transparent")
    t.pack(fill="both", expand=True, padx=30, pady=20)

    # Header
    ctk.CTkLabel(t, text="Dimensionamento da Colheita", 
                 font=ctk.CTkFont(size=24, weight="bold"), 
                 text_color=styles.CORES["texto"]).pack(pady=(0, 20), anchor="w")

    # ======================
    # CARD DE ENTRADA
    # ======================
    card_input = ctk.CTkFrame(t, fg_color="white", corner_radius=15, border_width=1, border_color="#E2E8F0")
    card_input.pack(fill="x", pady=10)

    ctk.CTkLabel(card_input, text="Preencha os campos abaixo", 
                 font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["primaria"]).pack(anchor="w", padx=30, pady=(20, 15))

    grid = ctk.CTkFrame(card_input, fg_color="transparent")
    grid.pack(fill="x", padx=30, pady=(0, 30))
    grid.grid_columnconfigure((0, 1), weight=1)

    # Campos
    def criar_campo(row, label, placeholder):
        ctk.CTkLabel(grid, text=label, font=ctk.CTkFont(size=12, weight="bold"), text_color="#64748B").grid(row=row, column=0, sticky="w", pady=(10, 5))
        entry = ctk.CTkEntry(grid, placeholder_text=placeholder, height=40, border_color="#E2E8F0")
        entry.grid(row=row, column=1, sticky="ew", padx=(20, 0), pady=(5, 5))
        return entry

    e_largura = criar_campo(0, "Largura de corte da plataforma (m):", "Ex: 4.55")
    e_modelo = criar_campo(1, "Modelo da colhedora:", "Ex: MF 3640")
    e_marca = criar_campo(2, "Marca da colhedora:", "Ex: MF Arroz")
    
    # Adicionando campos extras para o cálculo fazer sentido (não presentes na img original mas necessários)
    e_area = criar_campo(3, "Área total a colher (ha):", "Ex: 500")
    e_velocidade = criar_campo(4, "Velocidade média (km/h):", "Ex: 6.0")
    e_eficiencia = criar_campo(5, "Eficiência de campo (%):", "Ex: 75")

    # ======================
    # BOTÕES
    # ======================
    btn_frame = ctk.CTkFrame(t, fg_color="transparent")
    btn_frame.pack(fill="x", pady=20)

    def calcular():
        try:
            largura = float(e_largura.get().replace(",", "."))
            area = float(e_area.get().replace(",", "."))
            vel = float(e_velocidade.get().replace(",", "."))
            efic = float(e_eficiencia.get().replace(",", ".")) / 100
        except ValueError:
            messagebox.showerror("Erro", "Por favor, preencha todos os campos numéricos corretamente.")
            return

        # Lógica de Cálculo Agronômico Simplificado
        # Rendimento Teórico (ha/h) = (Largura * Velocidade) / 10
        # Rendimento Efetivo = Rendimento Teórico * Eficiência
        
        rend_teorico = (largura * vel) / 10
        rend_efetivo = rend_teorico * efic # ha/h por máquina

        # Supondo uma janela de colheita de X horas (vamos fixar ou pedir input, mas para simplificar vamos estimar tempo total)
        tempo_total_horas = area / rend_efetivo

        # Resultado Visual
        lbl_res_largura.configure(text=f"{largura} m")
        lbl_res_rendimento.configure(text=f"{rend_efetivo:.2f} ha/h")
        lbl_res_tempo.configure(text=f"{tempo_total_horas:.1f} h")
        
        # Nº Máquinas (Supondo meta de 200h de trabalho aka 20 dias de 10h)
        # Isso é arbitrário, mas simula a "Recomendação"
        meta_horas = 200 
        num_maquinas = tempo_total_horas / meta_horas
        lbl_res_maquinas.configure(text=f"{max(1, round(num_maquinas, 1))}")

        res_card.pack(fill="x", pady=10) # Mostra o card

    def limpar():
        res_card.pack_forget()
        for e in (e_largura, e_modelo, e_marca, e_area, e_velocidade, e_eficiencia): e.delete(0, 'end')

    ctk.CTkButton(btn_frame, text="⚙️ Processar", height=50, width=150, 
                  font=ctk.CTkFont(size=14, weight="bold"), 
                  fg_color=styles.CORES["primaria"], hover_color="#2563EB", command=calcular).pack(side="left")

    ctk.CTkButton(btn_frame, text="🧹 Limpar", height=50, width=120, 
                  font=ctk.CTkFont(size=14, weight="bold"), 
                  fg_color="#cbd5e1", text_color="#334155", hover_color="#94a3b8", command=limpar).pack(side="left", padx=15)


    # ======================
    # RESULTADO (CARD INFERIOR)
    # ======================
    res_card = ctk.CTkFrame(t, fg_color="white", corner_radius=15, border_width=1, border_color="#E2E8F0")
    # Inicialmente oculto via pack_forget
    
    ctk.CTkLabel(res_card, text="Resultados da Simulação", 
                 font=ctk.CTkFont(size=14, weight="bold"), text_color=styles.CORES["sucesso"]).pack(anchor="w", padx=30, pady=(20, 15))

    res_grid = ctk.CTkFrame(res_card, fg_color="transparent")
    res_grid.pack(fill="x", padx=30, pady=(0, 30))
    res_grid.grid_columnconfigure((0, 1), weight=1)

    def criar_res(label, row, col):
        f = ctk.CTkFrame(res_grid, fg_color="#F8FAFC", corner_radius=8)
        f.grid(row=row, column=col, sticky="nsew", padx=10, pady=10)
        ctk.CTkLabel(f, text=label, font=ctk.CTkFont(size=11), text_color="#64748B").pack(anchor="w", padx=10, pady=(10, 0))
        l_val = ctk.CTkLabel(f, text="---", font=ctk.CTkFont(size=16, weight="bold"), text_color="#1E293B")
        l_val.pack(anchor="w", padx=10, pady=(0, 10))
        return l_val

    lbl_res_largura = criar_res("Faixa de Trabalho (Largura)", 0, 0)
    lbl_res_rendimento = criar_res("Rendimento Operacional", 0, 1)
    lbl_res_tempo = criar_res("Tempo Total Estimado", 1, 0)
    lbl_res_maquinas = criar_res("Máquinas Sugeridas (para 200h)", 1, 1) # Sugestão simples
