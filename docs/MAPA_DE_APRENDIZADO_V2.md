# MAPA DE APRENDIZADO V2: SUPABASE, ANIMAÇÕES E ARQUITETURA DO SISTEMA

Este documento registra todas as lições aprendidas e obstáculos técnicos superados durante o desenvolvimento da **Fase 7 e V2** do aplicativo AgroGB. Ele serve como consulta futura para evitar retrabalhos.

---

## 1. O Enigma do "Robô Navegador" e a Segurança do Windows
**O que tentamos:** Usar o comando `/browser` da Inteligência Artificial para ler páginas do GitHub e navegar na web controlando o Google Chrome do PC pela porta `9222` (Modo Desenvolvedor).
**O obstáculo:** O Windows (junto com regras de Firewall/Antivírus) cria uma "parede de isolamento" (User Session vs System Session). Como a Inteligência Artificial roda nos bastidores do sistema, ela fica fisicamente proibida de "ver" e interagir com as janelas do usuário na Área de Trabalho.
**A Solução/Aprendizado:** 
- Descobrimos que a Inteligência Artificial possui ferramentas de navegação nativas "invisíveis" (`read_url_content` e `search_web`).
- Em vez de forçar a conexão com o navegador Chrome visual do usuário, a IA pode extrair dados, ler documentações e pesquisar erros no Google de forma direta através dos próprios códigos do sistema.
- **Conclusão:** O comando `/browser` não é necessário para programação de alto nível.

## 2. Autenticação na Nuvem: Supabase V2
**O que tentamos:** Fazer login de usuários na nuvem via Supabase.
**O obstáculo:** O sistema parou de reconhecer a chave antiga (`sb_publishable_...`).
**A Solução/Aprendizado:**
- A versão mais recente do Supabase SDK (v2.x) exige chaves no formato JWT (Token longo que começa com `eyJhbGci...`).
- O fluxo de login agora é um sistema duplo e inteligente:
  1. Se digitar **admin/admin**, o App ignora a nuvem, puxa os dados do SQLite local (Offline) e libera o Acesso Total (Modo Deus).
  2. Se digitar e-mail e senha normais, o App vai na nuvem (Supabase), valida os dados e baixa o perfil correto (Produtor ou Agrônomo).

## 3. Experiência de Usuário Premium (UI/UX)
**O que tentamos:** Manter a interface profissional sem deixar o aplicativo "seco" e vazio.
**O obstáculo:** Ao reescrever a tela, perdemos os efeitos 3D, blur e a entrada cinematográfica da logo.
**A Solução/Aprendizado:**
- Nunca simplificar demais a Interface de um aplicativo focado em uso corporativo (Enterprise).
- As animações nativas (`Animated.spring`, `Fade`) em conjunto com as bibliotecas `react-native-reanimated` e `moti` devem ser obrigatórias na tela de entrada (Splash Screen) para passar a percepção de Sistema Nível Banco (Nubank).
- Adicionamos um "Easter Egg" poderoso: **7 toques no Logo Verde** com resposta tátil (Vibração) acionam a passagem secreta do Administrador sem precisar preencher e-mail.

## 4. O Fluxo de Build (Metro Bundler vs APK Local)
**Aprendizado:**
- Ao gerar versões `.apk` finais, elas ficam guardadas na pasta oculta do Android.
- Para testes rápidos em tempo real durante o desenvolvimento, usar o `npx expo start -c` em um terminal PowerShell isolado é a melhor forma de gerar o QR Code (sem depender do Android Studio pesado) e testar no app **Expo Go** direto no celular com a internet no mesmo Wi-Fi.

---
**Status do AgroGB Mobile:** Arquitetura V2 consolidada. Conexão Web Inteligente operante. Nuvem funcionando. Módulos de Produtor e Agrônomo desenhados.
