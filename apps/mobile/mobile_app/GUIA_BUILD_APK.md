# 🚀 Guia de Build do APK - AgroGB Mobile

## ✅ Pré-requisitos Concluídos

- [x] Projeto configurado para Expo
- [x] Código adaptado para expo-sqlite
- [x] Arquivos de configuração criados (app.json, eas.json)

---

## 📋 Passo a Passo para Gerar o APK

### 1. Instalar Dependências

```bash
cd mobile_app
npm install
```

### 2. Instalar Expo CLI Globalmente

```bash
npm install -g expo-cli eas-cli
```

### 3. Criar Conta no Expo (Se não tiver)

1. Acesse: https://expo.dev/signup
2. Crie uma conta gratuita
3. Confirme o email

### 4. Fazer Login no Expo CLI

```bash
eas login
```

Digite seu email e senha do Expo.

### 5. Configurar o Projeto

```bash
eas build:configure
```

Responda:
- "Would you like to automatically create an EAS project?" → **Yes**

### 6. Localizar o APK (Caminho Oficial)

Após o sucesso do comando, o seu instalador estará sempre em:
`C:\Users\Bruno\Documents\AgroGB\mobile_app\android\app\build\outputs\apk\release\app-release.apk`

### 7. Baixar o APK

Quando o build terminar, você verá:
```
✅ Build finished
📱 Download: https://expo.dev/artifacts/...
```

Clique no link ou copie e cole no navegador para baixar o APK.

---

## 📱 Instalar no Celular

### Opção 1: Via USB
```bash
adb install caminho/para/o/arquivo.apk
```

### Opção 2: Transferir Arquivo
1. Baixe o APK no PC
2. Envie para o celular (WhatsApp, email, etc)
3. Abra o arquivo no celular
4. Permita "Instalar de fontes desconhecidas"
5. Instale o app

---

## 🔧 Comandos Úteis

### Ver Status do Build
```bash
eas build:list
```

### Cancelar Build em Andamento
```bash
eas build:cancel
```

### Build de Produção (Otimizado)
```bash
eas build --platform android --profile production
```

---

## ⚠️ Possíveis Erros

### "You need to be logged in"
**Solução:** Execute `eas login` novamente

### "Project not configured"
**Solução:** Execute `eas build:configure`

### "Build failed"
**Solução:** Verifique os logs no link fornecido pelo Expo

---

## 💡 Dicas

1. **Build Preview** gera APK mais rápido (recomendado para testes)
2. **Build Production** gera APK otimizado (para distribuição final)
3. O APK ficará disponível por 30 dias no Expo
4. Você pode fazer builds ilimitados no plano gratuito

---

## 🎯 Próximos Passos Após o APK

1. Instalar no celular e testar
2. Cadastrar uma colheita de teste
3. Verificar se os dados estão sendo salvos
4. Distribuir para outros usuários
