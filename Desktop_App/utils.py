# utils.py
from datetime import datetime

def validar_data(data_str):
    try:
        datetime.strptime(data_str, "%Y-%m-%d")
        return True
    except:
        return False

def validar_numero(valor):
    try:
        float(valor)
        return True
    except:
        return False
