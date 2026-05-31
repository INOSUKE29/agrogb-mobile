import os
import json
import logging
import pytesseract
from PIL import Image
import openai
from db import BancoDeDados

class AgroScannerIA:
    """
    Módulo V7.0: Responsável por gerir o fluxo de Scanner Inteligente.
    Integra OCR (Tesseract) e LLM (OpenAI/Gemini) para estruturar dados agrícolas.
    """

    def __init__(self, db_instance: BancoDeDados = None, ocr_cmd_path: str = None):
        self.db = db_instance
        self.logger = logging.getLogger(__name__)

        # Configuração do Tesseract (OCR)
        # Em Windows, geralmente precisa apontar o binário
        if ocr_cmd_path:
            pytesseract.pytesseract.tesseract_cmd = ocr_cmd_path

    def processar_imagens(self, path_produto: str, path_rotulo: str) -> dict:
        """
        Recebe caminhos das imagens (Produto e Rótulo) e retorna os dados estruturados.
        """
        self.logger.info(f"🧠 Iniciando análise inteligente V7.0: {path_produto} + {path_rotulo}")
        
        try:
            # 1. OCR no Rótulo (Prioridade para texto técnico)
            texto_bruto = self._executar_ocr(path_rotulo)
            
            # Se o rótulo falhar ou tiver pouco texto, tenta o produto (frente)
            if len(texto_bruto) < 50:
                self.logger.warning("⚠️ Texto do rótulo insuficiente. Tentando OCR na frente do produto.")
                texto_bruto += "\n" + self._executar_ocr(path_produto)

            if len(texto_bruto) < 20:
                return {"erro": "OCR falhou. Texto ilegível ou imagem muito desfocada.", "sucesso": False}

            # 2. Análise via LLM (AI)
            dados_estruturados = self._consultar_ia_agronomica(texto_bruto)
            
            return {
                "sucesso": True,
                "dados": dados_estruturados,
                "ocr_raw": texto_bruto
            }

        except Exception as e:
            self.logger.error(f"❌ Erro crítico no Scanner IA: {e}")
            return {"sucesso": False, "erro": str(e)}

    def _executar_ocr(self, image_path: str) -> str:
        """Roda o Tesseract na imagem especificada."""
        try:
            if not os.path.exists(image_path):
                return ""
            img = Image.open(image_path)
            # Configuração otimizada para blocos de texto (psm 6) + Português (por)
            text = pytesseract.image_to_string(img, lang='por', config='--psm 6')
            return text.strip()
        except Exception as e:
            self.logger.error(f"Erro OCR ({image_path}): {e}")
            return ""

    def _consultar_ia_agronomica(self, texto_ocr: str) -> dict:
        """
        Envia o texto bruto para a IA (Simulada ou Real) e retorna JSON.
        """
        
        # PROMPT V7.0 ESPECIALIZADO
        prompt_system = (
            "Você é um Engenheiro Agrônomo Sênior especialista em regulação e cadastro de insumos."
            "Sua tarefa é extrair dados técnicos estruturados de textos de rótulos/bulas agrícolas."
        )

        prompt_user = f"""
        Analise o texto abaixo (extraído via OCR) e retorne um JSON estrito com as chaves:
        nome_comercial, fabricante, categoria (ex: Inseticida, Fungicida, Adubo), 
        principio_ativo, classe_toxicologica, composicao_quimica, 
        culturas_indicadas (lista), dose_padrao, observacao_tecnica (resumo).

        Se não encontrar, use null. Não invente dados.
        
        TEXTO OCR:
        "{texto_ocr[:3000]}"
        """

        # MOCKUP (SE SEM CHAVE API)
        # Se não tiver API Key configurada, retornamos um "Mock Inteligente" baseado em palavras-chave
        # para garantir funcionamento nos testes do usuário sem custos de API.
        if not os.getenv("OPENAI_API_KEY"):
            return self._mock_ia_local(texto_ocr)
        
        # CHAMADA REAL (OpenAI)
        try:
            client = openai.OpenAI()
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": prompt_system},
                    {"role": "user", "content": prompt_user}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            self.logger.error(f"Erro API OpenAI: {e}")
            return self._mock_ia_local(texto_ocr) # Fallback

    def _mock_ia_local(self, texto: str) -> dict:
        """
        Simula uma IA extraindo dados por Regex simples/Keywords.
        Útil para demonstração ou fallback offline.
        """
        texto_up = texto.upper()
        
        categoria = "INSUMO"
        if "HERBICIDA" in texto_up: categoria = "DEFENSIVO (HERBICIDA)"
        elif "INSETICIDA" in texto_up: categoria = "DEFENSIVO (INSETICIDA)"
        elif "FUNGICIDA" in texto_up: categoria = "DEFENSIVO (FUNGICIDA)"
        elif "FERTILIZANTE" in texto_up or "ADUBO" in texto_up: categoria = "FERTILIZANTE"

        return {
            "nome_comercial": "PRODUTO DETECTADO (MOCK)",
            "fabricante": "FABRICANTE DESCONHECIDO",
            "categoria": categoria,
            "principio_ativo": "NÃO IDENTIFICADO",
            "classe_toxicologica": "NÃO IDENTIFICADO",
            "composicao_quimica": "NÃO IDENTIFICADO",
            "culturas_indicadas": [],
            "dose_padrao": "Consultar Bula",
            "observacao_tecnica": f"Leitura OCR Parcial. Texto identificado: {texto[:50]}..."
        }

if __name__ == "__main__":
    # Teste rápido
    scanner = AgroScannerIA()
    print("Módulo Scanner IA carregado com sucesso.")
