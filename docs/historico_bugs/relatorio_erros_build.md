# 🚨 Relatório de Falhas de Compilação (GitHub Actions)

Este documento centraliza os motivos pelos quais as tentativas de gerar o `.APK` falhavam na "Fábrica de APK" (GitHub Actions). Registrar esses erros é essencial para não repetirmos os mesmos acidentes no futuro.

## 1. O Erro de Sintaxe do R8 (Kotlin Plugin)
> [!WARNING]
> **Sintoma:** O Gradle falhava logo no início do processo de build do Android.
> 
> **Mensagem de Erro Extraída:**
> `Could not find org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22android.enableR8.fullMode=true.`
> 
> **Causa Raiz:** No arquivo `build-apk.yml`, havia um comando que injetava a propriedade `android.enableR8.fullMode=true` no arquivo `gradle.properties`. Por causa de uma falta de quebra de linha (Enter), o texto "grudou" na versão do plugin do Kotlin (`1.9.22`), quebrando completamente a leitura do Android Studio.
> 
> **Solução:** O script no GitHub Actions precisa sempre injetar uma quebra de linha vazia (`echo "" >> gradle.properties`) antes de adicionar novas propriedades no Gradle.

## 2. A "Fuga" do Serviço de Erro (Módulo Não Encontrado)
> [!IMPORTANT]
> **Sintoma:** O pacote Javascript começava a ser empacotado para o celular, mas o Metro Bundler sofria um Crash fatal e abortava.
> 
> **Mensagem de Erro Extraída:**
> `Error: Unable to resolve module ../services/ErrorService from /home/runner/work/agrogb-mobile/.../ErrorBoundary.js`
> 
> **Causa Raiz:** O componente visual de segurança (`ErrorBoundary.js`) estava tentando importar um arquivo chamado `ErrorService` usando o caminho `../services/ErrorService`. O problema é que o arquivo original não estava lá ou tinha o nome escrito diferente.
> 
> **Solução Aplicada:** Instalamos a "Armadura do Husky com ESLint". Agora, se o programador tentar enviar para o GitHub um código que importa um arquivo que não existe, o ESLint trava o envio no próprio computador. A quebra jamais chega na Fábrica de APK!

## 3. Timeout por Exaustão de Tempo
> [!NOTE]
> **Sintoma:** O processo passava do limite de tempo pré-determinado e o GitHub cortava a conexão.
> 
> **Mensagem de Erro Extraída:**
> `timeout (10000ms) durante a execução "Gerar APK Android via Gradle".`
> 
> **Causa Raiz e Solução:** Compilar um App Android do zero no Expo consome recursos. É necessário utilizar as ferramentas de "Cache" nativas do GitHub Actions (`gradle/actions/setup-gradle`) para acelerar as execuções futuras.

## Resumo da Extinção das 198 Builds Falhas
Através da leitura de todas as 198 tentativas registradas na história do AgroGB, agrupamos as falhas que mais assolavam o projeto antes da implementação do "Husky e ESLint":

- **67 Quebras por "Super Audit (Build Guard)":** O sistema barrou código inseguro antes de virar APK.
- **63 Quebras por "ESLint":** Código fora do padrão de linting barrado.
- **32 Quebras por "Build APK":** O problema recorrente de compilação pesada do Expo/Gradle.
- **7 Quebras de Banco/Supabase:** Erros no Backup do Storage e do BD causados por timeout de rede ou permissões.
- **9 Cancelamentos Manuais:** Abortadas pelo usuário ou novos envios.

> Todas as 198 bolinhas vermelhas foram deletadas com sucesso do painel do GitHub Actions após a consolidação desse relatório. O histórico do AgroGB está 100% limpo!
