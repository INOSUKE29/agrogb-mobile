# Relatório Técnico: Investigação de Erro pós-Build

**Para:** Ian (Desenvolvedor / Responsável pela Construção do Código)
**Assunto:** Investigação do erro `Exception: Cannot set UserProperties. Token hasn't been set yet.`

---

## 1. Descrição do Problema
Após a geração da build do aplicativo AgroGB Mobile, os usuários estão enfrentando um crash na tela imediatamente após o login (possivelmente a tela de Carregamento ou a tela Principal de Módulos).

A interface exibe a mensagem capturada pelo `ErrorBoundary` do React:
> **`Exception: Cannot set UserProperties. Token hasn't been set yet.`**

Clicar em "TENTAR NOVAMENTE" no `ErrorBoundary` limpa a sessão do usuário no `AsyncStorage` (`@user_session`, etc.), o que força o retorno à tela de Login, criando um loop em que o usuário não consegue acessar a aplicação na versão compilada (Release/Build).

---

## 2. Ações de Investigação Realizadas

Foi realizada uma varredura completa (grep/busca profunda) em todo o repositório, incluindo:
* Diretório de código-fonte (`src/`).
* Arquivos de configuração (`package.json`, `app.json`, `babel.config.js`).
* Diretório de dependências (`node_modules/`).
* Dependências do Supabase e do Expo.

**Resultados da Busca:**
* **Nenhum** arquivo de código-fonte ou dependência direta instalada via npm contém a string `"UserProperties"` ou `"Token hasn't been set yet"`.
* O `package.json` **não possui** bibliotecas de Analytics comumente associadas a essa nomenclatura (ex: Amplitude, Mixpanel, Firebase Analytics, Instabug, AppsFlyer).
* A busca na web (StackOverflow, GitHub Issues) não retornou resultados exatos para essa combinação de mensagens no ecossistema atual do React Native/Expo.

---

## 3. Hipóteses e Causa Raiz Provável

Como o erro **só ocorre na versão buildada** (e não ocorre durante o desenvolvimento normal via `expo start`), as causas mais prováveis são:

1. **SDK Nativa Embutida / Injeção de Analytics:**
   O método `setUserProperties` é um padrão clássico de ferramentas de Analytics ou Crash Reporting. É possível que algum pacote (como alguma SDK de push notification de terceiros, chat, ou telemetria) esteja inicializando na camada nativa (Android/iOS) ou exigindo uma chave de inicialização (Token) que não foi configurada nas variáveis de ambiente do servidor de Build (EAS, por exemplo).
   * *Suspeita:* Embora não esteja no `package.json`, ferramentas do ecossistema EAS podem estar injetando telemetria (ex: Expo Updates, Expo Dev Client) ou há alguma dependência transitiva nativa que requer um token.

2. **Falta de Variáveis de Ambiente no EAS Build:**
   Se a build estiver sendo feita via Expo Application Services (EAS), o serviço pode estar carecendo de um Token (ex: `EXPO_TOKEN`, tokens do Supabase ou de alguma outra API) que existia no `.env` local mas não foi adicionado aos secrets do EAS (usando `eas secret:create`).

3. **Comportamento Específico de Release (Minificação/Hermes):**
   Durante o processo de build para Release, o código JavaScript é minificado pelo Terser e compilado no motor Hermes. Se houver alguma configuração malformada ou importação dinâmica que só falha no modo de produção, isso pode causar a falha da injeção do "Token".

---

## 4. Próximos Passos Recomendados para o Desenvolvedor (Ian)

Para resolver ou isolar definitivamente a causa deste problema, sugere-se a execução dos seguintes passos:

1. **Verificar os Secrets / Environment Variables do EAS:**
   Acesse o painel do [Expo (expo.dev)](https://expo.dev/) no projeto `AgroGB Mobile` e verifique se todas as variáveis de ambiente necessárias para a produção (Tokens de API, Supabase, etc.) estão corretamente cadastradas na seção "Secrets" do projeto.

2. **Revisar Dependências Adicionadas Recentemente:**
   Identificar qual foi a última dependência nativa ou de rastreamento adicionada antes das builds começarem a falhar. Caso haja alguma SDK que precise ser inicializada no `App.js` com um token, certifique-se de que a inicialização ocorra *antes* do usuário fazer login ou do sistema tentar atribuir propriedades do usuário.

3. **Gerar uma Build de "Profile" ou "Debug" Conectada:**
   * Caso esteja gerando via EAS, tente rodar uma build interna para simular o erro com logs:
     `eas build --profile development --platform android`
   * Ou utilize o **`expo-dev-client`** para capturar os logs exatos do Logcat (Android) ou XCode (iOS), o que revelará o stacktrace nativo de onde essa Exception originou.
   * Se for um APK construído localmente (`npx expo run:android --variant release`), verifique os logs usando o comando: `adb logcat | grep -i react` ou `adb logcat | grep -i exception`.

4. **Isolar o Ponto de Falha no Login:**
   Em `src/screens/LoginScreen.js` ou no momento em que o `RootNavigator` redireciona para a `HomeScreen`, comente temporariamente chamadas assíncronas que interajam com bibliotecas de terceiros logo após o login e gere uma nova build para ver se o erro persiste.

---
*Relatório gerado automaticamente através da análise profunda do repositório atual.*