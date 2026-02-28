# AgroGB Mobile - Guia de Instalação

## 📱 Sobre o Aplicativo
O AgroGB Mobile é a versão móvel do sistema de gestão rural AgroGB. Ele permite que você registre colheitas, vendas e consulte informações diretamente do campo, mesmo sem conexão com a internet.

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- React Native CLI
- Android Studio (para Android) ou Xcode (para iOS)

### Passo a Passo

**Instalando as dependências:**
```bash
cd mobile_app
npm install
```

**Executável no Android:**
```bash
npm run android
```

**Executar no iOS:**
```bash
cd ios && pod install && cd ..
npm run ios
```

## 🔄 Como Funciona a Sincronização

### Fluxo de Dados
- **Registro Offline:** Você registra colheitas no celular, mesmo sem internet
- **Armazenamento Local:** Os dados ficam salvos no SQLite do celular
- **Sincronização Automática:** Quando houver internet, o aplicativo envia os dados para o servidor
- **Atualização Desktop:** O sistema Desktop recebe e mescla os dados automaticamente

### Identificação Única (UUID)
Cada registro criado no celular recebe um código único (UUID) como:
`8f2d1a3c-b4e5-6789-1234-56789abcdef0`
Isso garante que não haja conflitos quando o mesmo dado for criado no celular e no computador.

## 📊 Estrutura do Banco de Dados

**Tabela: colheitas**
- `uuid` - Identificador único global
- `cultura` - Nome da área/cultura
- `produto` - Produto colhido
- `quantidade` - Quantidade em KG
- `data` - Data da colheita
- `last_updated` - Timestamp da última alteração
- `sync_status` - 0=Pendente, 1=Sincronizado

## 🎯 Próximos Passos
- Implementar API de sincronização
- Turbante de vendas *(Ajustar conforme regra de negócio)*
- Criar painel de controle offline
- Implementar notificações de sincronização
- Adicionar suporte a fotos de colheita

## 💡 Dicas de Uso
- **Sempre registre no campo:** Não precisa esperar ter internet
- **Sincronize regularmente:** Quando tiver WiFi, abra o aplicativo para sincronizar
- **Backup automático:** Os dados ficam salvos tanto no celular quanto no Desktop

## 🔧 Solução de problemas

**Problema: O aplicativo não abre**
- *Solução:* Verifique se todas as dependências foram instaladas com `npm install`

**Problema: Erro de sincronização**
- *Solução:* Verifique sua conexão com a internet e tente novamente

## 📞 Suporte
Para dúvidas ou problemas, consulte a documentação do AgroGB Desktop.
