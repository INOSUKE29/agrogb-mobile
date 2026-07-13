import json
import os

path = r"c:\Users\Bruno\Documents\AgroGB\mobile_app\node_modules\react-native-gesture-handler\package.json"

if os.path.exists(path):
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            print(f"Versão Instalada: {data.get('version')}")
    except Exception as e:
        print(f"Erro ao ler: {e}")
else:
    print("Pasta do pacote não encontrada")
