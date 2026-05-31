# utils_nfe.py
# Utilitário para parsear chaves de acesso de NF-e (44 dígitos)

def extrair_dados_nfe(chave):
    """
    Estrutura da Chave NF-e (44 dígitos):
    - cUF: 0-2 (2)
    - AAMM: 2-6 (4)
    - CNPJ: 6-20 (14)
    - mod: 20-22 (2)
    - serie: 22-25 (3)
    - nNF: 25-34 (9)
    - tpEmis: 34-35 (1)
    - cNF: 35-43 (8)
    - cDV: 43-44 (1)
    """
    if len(chave) != 44 or not chave.isdigit():
        return None

    try:
        dados = {
            "ano": "20" + chave[2:4],
            "mes": chave[4:6],
            "cnpj_emitente": chave[6:20],
            "modelo": chave[20:22],
            "serie": chave[22:25],
            "numero_nf": str(int(chave[25:34])), # remove zeros à esquerda
        }
        return dados
    except:
        return None

def formatar_cnpj(cnpj):
    if len(cnpj) != 14: return cnpj
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"
