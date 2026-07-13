import customtkinter as ctk
from tkinter import messagebox
import db
import styles
import ui_components
from PIL import Image

def view_frota(parent):
    try:
        try: db.criar_tabelas() 
        except: pass
        stats = db.calcular_status_frota()
        
        header_frame = ctk.CTkFrame(parent, fg_color="transparent")
        header_frame.pack(fill="x", padx=30, pady=(30, 15))
    except Exception as e:
        ctk.CTkLabel(parent, text=f"Erro: {e}").pack()
        return
    
    # Helper Modal
    def create_modal(title, w=400, h=500):
        top = ctk.CTkToplevel(parent)
        top.title(title)
        top.geometry(f"{w}x{h}")
        top.transient(parent)
        top.grab_set()
        top.focus_force()
        try:
            x = parent.winfo_rootx() + (parent.winfo_width() // 2) - (w // 2)
            y = parent.winfo_rooty() + (parent.winfo_height() // 2) - (h // 2)
            top.geometry(f"+{x}+{y}")
        except: pass
        return top

    ctk.CTkLabel(header_frame, text="Gestão de Frota", font=("Inter", 26, "bold"), text_color="#1E293B").pack(side="left")

    # NOVA MÁQUINA
    def abrir_novo_cadastro():
        top = create_modal("Nova Máquina", 450, 600)
        ctk.CTkLabel(top, text="Novo Veículo / Máquina", font=("Inter", 20, "bold")).pack(pady=(25, 15))
        
        def entry(lbl): 
            ctk.CTkLabel(top, text=lbl, text_color="gray", font=("Inter", 12)).pack(anchor="w", padx=40, pady=(5,0))
            e = ctk.CTkEntry(top, width=350, height=35); e.pack(pady=(0, 10))
            return e
            
        e_nome = entry("Nome do Veículo (ex: Fiat Strada)")
        e_placa = entry("Placa (Opcional)")
        
        ctk.CTkLabel(top, text="Tipo de Veículo", text_color="gray", font=("Inter", 12)).pack(anchor="w", padx=40, pady=(5,0))
        e_tipo = ctk.CTkOptionMenu(top, values=["Carro", "Caminhão", "Trator", "Colhedora", "Pulverizador", "Outro"], width=350, height=35)
        e_tipo.pack(pady=(0, 10))
        
        # Dynamic label update
        lbl_h = ctk.CTkLabel(top, text="Horímetro / KM Atual", text_color="gray", font=("Inter", 12))
        lbl_h.pack(anchor="w", padx=40, pady=(5,0))
        e_hor = ctk.CTkEntry(top, width=350, height=35); e_hor.pack(pady=(0, 10))

        e_rev = entry("Intervalo de Revisão (KM ou Horas)")
        e_rev.delete(0,'end'); e_rev.insert(0,"10000") # Default pra carro (10k km)
        
        def update_labels(choice):
            if choice in ["Carro", "Caminhão"]:
                lbl_h.configure(text="Quilometragem Atual (KM)")
                e_rev.delete(0,'end'); e_rev.insert(0,"10000")
            else:
                lbl_h.configure(text="Horímetro Atual (h)")
                e_rev.delete(0,'end'); e_rev.insert(0,"250")
        
        e_tipo.configure(command=update_labels)
        update_labels("Carro") # Init
        
        def salvar():
            try:
                if not e_nome.get(): return
                db.add_maquina(e_nome.get(), e_tipo.get(), float(e_hor.get() or 0), float(e_rev.get() or 0), e_placa.get())
                messagebox.showinfo("Sucesso", "Veículo cadastrado!")
                top.destroy()
                view_frota(parent) 
            except: messagebox.showerror("Erro", "Valores inválidos.")
        
        ctk.CTkButton(top, text="Salvar", fg_color=styles.CORES["sucesso"], width=350, height=45, font=("Inter", 14, "bold"), command=salvar).pack(pady=20)

    btn_novo = ctk.CTkButton(header_frame, text="+ Novo Veículo", width=160, height=40, fg_color=styles.CORES["primaria"], font=("Inter", 13, "bold"), command=abrir_novo_cadastro)
    btn_novo.pack(side="right")
    
    # KPIs
    dash_wrap = ctk.CTkFrame(parent, fg_color="white", corner_radius=10, height=80)
    dash_wrap.pack(fill="x", padx=30, pady=5)
    dash_wrap.pack_propagate(False)
    
    def mk_stat(lbl, val, color, icon):
        f = ctk.CTkFrame(dash_wrap, fg_color="transparent")
        f.pack(side="left", padx=30, fill="y", pady=10)
        ctk.CTkLabel(f, text=icon, font=("Segoe UI Emoji", 26)).pack(side="left", padx=(0,10))
        d = ctk.CTkFrame(f, fg_color="transparent")
        d.pack(side="left")
        ctk.CTkLabel(d, text=str(val), font=("Inter", 20, "bold"), text_color=color, anchor="w").pack(anchor="w")
        ctk.CTkLabel(d, text=lbl, font=("Inter", 11, "bold"), text_color="gray", anchor="w").pack(anchor="w")
        ctk.CTkFrame(dash_wrap, width=1, height=40, fg_color="#F1F5F9").pack(side="left")

    mk_stat("Frota Total", sum(stats.values()), "#1E293B", "🚘")
    mk_stat("Operacionais", stats["OK"], styles.CORES["sucesso"], "✅")
    mk_stat("Revisão Próxima", stats["ALERTA"], styles.CORES["aviso"], "⚠️")
    mk_stat("Atrasados", stats["CRITICO"], styles.CORES["erro"], "🚨")

    # LISTA
    scroll = ctk.CTkScrollableFrame(parent, fg_color="transparent")
    scroll.pack(fill="both", expand=True, padx=20, pady=20)
    
    # Tenta pegar dados. Se db.py não retornou Placa (versao antiga da funcao), trata erro.
    # Mas como atualizamos db.py, devemos atualizar get_maquinas para retornar tudo ou a view deve saber lidar.
    # db.get_maquinas retorna tuplas. Se a tupla aumentou, ok.
    maquinas = db.get_maquinas()
    
    if not maquinas: return

    for m in maquinas:
        # DB returns: id, nome, tipo, hor, prox, status, placa, uuid
        # Ajustamos o unpacking para pegar apenas o necessário ou tudo
        try:
            mid, nome, tipo, hor, rev, status, placa, *rest = m
        except:
             # Fallback para versões antigas
             mid, nome, tipo, hor, rev, status = m[:6]
             placa = ""
        
        # Unit Logic
        is_car = tipo in ["Carro", "Caminhão", "Utilitário"]
        unit = "KM" if is_car else "h"
        
        # Calc Status
        intervalo = rev if rev > 0 else 1 # Avoid div zero
        # Para progresso, precisamos saber quando foi a ultima revisao, mas o sistema so guarda a proxima.
        # Vamos estimar progresso baseado em um 'ciclo' padrao se nao tiver historico, ou apenas visual.
        # Simplificacao visual: Se falta muito = verde.
        # Mas vamos usar a logica anterior: horas_restantes
        restante = rev - hor
        # Assumindo intervalo padrao para visualizacao da barra
        ciclo_padrao = 10000 if is_car else 250
        pct = max(0, min(1, restante / ciclo_padrao))
        
        status_color = styles.CORES["sucesso"]; status_txt = "EM DIA"; status_bg = "#ECFDF5"
        if status == "ALERTA": 
            status_color = styles.CORES["aviso"]; status_txt = "ATENÇÃO"; status_bg = "#FFFBEB"
        elif status == "CRITICO":
            status_color = styles.CORES["erro"]; status_txt = "CRÍTICO"; status_bg = "#FEF2F2"

        # CARD
        card = ctk.CTkFrame(scroll, fg_color="white", corner_radius=12, border_width=1, border_color="#E2E8F0", height=100)
        card.pack(fill="x", pady=6, ipady=5)
        
        # Left: Icon & ID
        left = ctk.CTkFrame(card, fg_color="transparent", width=250)
        left.pack(side="left", fill="y", padx=15, pady=10)
        
        ico = "🚘" if is_car else "🚜"
        icon_box = ctk.CTkFrame(left, width=50, height=50, corner_radius=10, fg_color="#F8FAFC")
        icon_box.pack(side="left")
        icon_box.pack_propagate(False)
        ctk.CTkLabel(icon_box, text=ico, font=("Segoe UI Emoji", 24)).place(relx=0.5, rely=0.5, anchor="center")
        
        box_txt = ctk.CTkFrame(left, fg_color="transparent")
        box_txt.pack(side="left", padx=15)
        ctk.CTkLabel(box_txt, text=nome, font=("Inter", 15, "bold"), text_color="#0F172A", anchor="w").pack(anchor="w")
        
        sub = f"{tipo}"
        if placa: sub += f" • {placa.upper()}"
        ctk.CTkLabel(box_txt, text=sub, font=("Inter", 12), text_color="gray", anchor="w").pack(anchor="w")

        # Center
        center = ctk.CTkFrame(card, fg_color="transparent")
        center.pack(side="left", fill="both", expand=True, padx=20, pady=10)
        
        l1 = ctk.CTkFrame(center, fg_color="transparent"); l1.pack(fill="x", pady=(0,5))
        # Format metric
        val_fmt = f"{hor:,.0f} {unit}" if is_car else f"{hor:.1f} {unit}"
        ctk.CTkLabel(l1, text=val_fmt, font=("Inter", 18, "bold"), text_color="#334155").pack(side="left")
        
        badge = ctk.CTkFrame(l1, fg_color=status_bg, corner_radius=10)
        badge.pack(side="right")
        ctk.CTkLabel(badge, text=status_txt, text_color=status_color, font=("Inter", 10, "bold")).pack(padx=8, pady=2)
        
        bar = ctk.CTkProgressBar(center, height=8, corner_radius=4, progress_color=status_color, fg_color="#F1F5F9")
        bar.set(pct); bar.pack(fill="x", pady=5)
        
        rest_fmt = f"{int(restante)} {unit}"
        aux = f"Revisão em {rest_fmt}" if restante >= 0 else f"Atrasado {int(abs(restante))} {unit}"
        ctk.CTkLabel(center, text=aux, font=("Inter", 11), text_color="gray", anchor="w").pack(fill="x")
        
        # Right: Actions
        right = ctk.CTkFrame(card, fg_color="transparent")
        right.pack(side="right", fill="y", padx=15, pady=10)
        
        def f_up(mid=mid, nm=nome, r=rev, is_car=is_car):
             lbl = "Quilometragem" if is_car else "Horímetro"
             x = ctk.CTkInputDialog(text=f"Atualizar {lbl} - {nm}", title="Atualizar")
             val = x.get_input()
             if val: 
                 try: db.update_maquina_revisao(mid, float(val), r); view_frota(parent)
                 except: pass

        def f_serv(mid=mid):
            t = create_modal("Registrar Serviço", 400, 450)
            ctk.CTkLabel(t,text="Novo Serviço",font=("Inter",16,"bold")).pack(pady=10)
            from datetime import datetime; hoje = datetime.now().strftime("%d/%m/%Y")
            f = ctk.CTkFrame(t, fg_color="transparent"); f.pack(fill="x", padx=30)
            ctk.CTkEntry(f, placeholder_text=f"Data ({hoje})").pack(fill="x", pady=5)
            ds=ctk.CTkEntry(f, placeholder_text="Descrição"); ds.pack(fill="x", pady=5)
            cust=ctk.CTkEntry(f, placeholder_text="Valor R$"); cust.pack(fill="x", pady=5)
            def s():
                try: 
                    db.add_manutencao(mid, hoje, ds.get(), float(cust.get().replace(",",".")))
                    t.destroy(); view_frota(parent)
                except: messagebox.showerror("Erro","Inválido")
            ctk.CTkButton(t, text="Salvar", command=s, fg_color=styles.CORES["primaria"]).pack(pady=20)
            
        def f_hist(mid=mid, nm=nome):
            t = create_modal(f"Histórico: {nm}", 500, 500)
            sf=ctk.CTkScrollableFrame(t); sf.pack(fill="both",expand=True, padx=10, pady=10)
            for i in db.get_historico_manutencoes(mid):
                r=ctk.CTkFrame(sf, fg_color="white"); r.pack(fill="x",pady=2)
                ctk.CTkLabel(r,text=i[2], font=("Inter", 11, "bold")).pack(side="left",padx=5)
                ctk.CTkLabel(r,text=i[3]).pack(side="left",padx=5)
                ctk.CTkLabel(r,text=f"R$ {i[4]:.2f}", text_color="#B91C1C").pack(side="right",padx=5)
                
        def f_edit(mid=mid, nm=nome, tp=tipo, h=hor, r=rev, pl=placa, is_car=is_car):
             t = create_modal("Editar Veículo", 350, 500)
             l = "KM" if is_car else "Horímetro"
             
             ctk.CTkLabel(t, text="Nome").pack(anchor="w", padx=30)
             en = ctk.CTkEntry(t); en.insert(0,nm); en.pack(pady=(0,10), padx=30, fill="x")
             
             ctk.CTkLabel(t, text="Placa").pack(anchor="w", padx=30)
             ep = ctk.CTkEntry(t); ep.insert(0,pl or ""); ep.pack(pady=(0,10), padx=30, fill="x")
             
             ctk.CTkLabel(t, text="Tipo").pack(anchor="w", padx=30)
             et = ctk.CTkOptionMenu(t, values=["Carro", "Caminhão", "Trator", "Colhedora", "Pulverizador", "Outro"]); et.set(tp); et.pack(pady=(0,10), padx=30, fill="x")
             
             ctk.CTkLabel(t, text=l).pack(anchor="w", padx=30)
             eh = ctk.CTkEntry(t); eh.insert(0,str(h)); eh.pack(pady=(0,10), padx=30, fill="x")
             
             ctk.CTkLabel(t, text="Próx. Revisão").pack(anchor="w", padx=30)
             er = ctk.CTkEntry(t); er.insert(0,str(r)); er.pack(pady=(0,10), padx=30, fill="x")
             
             def s(): 
                db.update_maquina(mid, en.get(), et.get(), float(eh.get()), float(er.get()), ep.get())
                t.destroy(); view_frota(parent)
             ctk.CTkButton(t, text="Salvar", command=s).pack(pady=20)

        def f_del(mid=mid):
            if messagebox.askyesno("Excluir", "Confirmar exclusão?"): db.delete_maquina(mid); view_frota(parent)

        # Buttons
        ctk.CTkButton(right, text="📜", width=40, height=35, fg_color="#EFF6FF", text_color="#3B82F6", hover_color="#DBEAFE", command=f_hist).pack(side="left", padx=2)
        
        lbl_btn = "At. KM" if is_car else "At. Horas"
        ctk.CTkButton(right, text=lbl_btn, width=90, height=35, fg_color="#F1F5F9", text_color="#334155", hover_color="#E2E8F0", command=f_up).pack(side="left", padx=2)
        
        ctk.CTkButton(right, text="🛠️ Serviço", width=100, height=35, fg_color=styles.CORES["primaria"], command=f_serv).pack(side="left", padx=2)
        
        ctk.CTkFrame(right, width=1, height=20, fg_color="#E2E8F0").pack(side="left", padx=8)

        ctk.CTkButton(right, text="✏️", width=40, height=35, fg_color="#FFF7ED", text_color="#C2410C", hover_color="#FFEDD5", command=lambda: f_edit(mid, nome, tipo, hor, rev, placa, is_car)).pack(side="left", padx=2)
        ctk.CTkButton(right, text="🗑️", width=40, height=35, fg_color="#FEF2F2", text_color="#DC2626", hover_color="#FEE2E2", command=f_del).pack(side="left", padx=2)
