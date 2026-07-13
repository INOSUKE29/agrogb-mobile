const fs = require('fs');
const file = 'ClienteFormScreen.js';
let data = fs.readFileSync(file, 'utf8');

const replacements = {
  'ObrigatÃ³rio': 'Obrigatório',
  'Nome ou Empresa Ã© obrigatÃ³rio': 'Nome ou Empresa é obrigatório',
  'SessÃ£o': 'Sessão',
  'CLASSIFICAÃ‡ÃƒO': 'CLASSIFICAÇÃO',
  'InformaÃ§Ãµes': 'Informações',
  'IDENTIFICAÃ‡ÃƒO': 'IDENTIFICAÇÃO',
  'RAZÃƒO': 'RAZÃO',
  'JoÃ£o': 'João',
  'NÃºmeros': 'Números',
  'ENDEREÃ‡O': 'ENDEREÇO',
  'LOGÃ STICA': 'LOGÍSTICA',
  'NÃšMERO': 'NÚMERO',
  'MUNICÃ PIO': 'MUNICÍPIO',
  'SÃ£o': 'São',
  'OBSERVAÃ‡Ã•ES': 'OBSERVAÇÕES',
  'AnotaÃ§Ãµes': 'Anotações',
  'visÃ­veis': 'visíveis',
  'operaÃ§Ã£o': 'operação',
  'AÃ§Ãµes': 'Ações'
};

for (const [key, value] of Object.entries(replacements)) {
  data = data.split(key).join(value);
}

// UI Fixes
data = data.replace(
  /inputContainer: \{ backgroundColor: 'rgba\(15, 23, 42, 0\.6\)', borderWidth: 1, borderColor: 'rgba\(255,255,255,0\.08\)'/,
  "inputContainer: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D1D6'"
);

data = data.replace(
  /inputContainerFocused: \{ borderColor: '#3B82F6', backgroundColor: 'rgba\(59, 130, 246, 0\.05\)'/,
  "inputContainerFocused: { borderColor: '#10B981', backgroundColor: '#FFFFFF', elevation: 2 }"
);

data = data.replace(
  /input: \{ flex: 1, color: '#F8FAFC'/,
  "input: { flex: 1, color: '#1C1C1E'"
);

data = data.replace(
  /pill: \{ flex: 1, height: 56, borderRadius: 14, backgroundColor: 'rgba\(15, 23, 42, 0\.6\)', borderWidth: 1, borderColor: 'rgba\(255,255,255,0\.08\)'/,
  "pill: { flex: 1, height: 56, borderRadius: 14, backgroundColor: '#E5E5EA', borderWidth: 1, borderColor: '#D1D1D6'"
);

data = data.replace(
  /pillText: \{ color: '#64748B'/,
  "pillText: { color: '#8E8E93'"
);

data = data.replace(
  /backgroundColor: 'rgba\(0,0,0,0\.3\)'/,
  "backgroundColor: '#E5E5EA'"
);

data = data.replace(
  /toggleText: \{ color: '#E2E8F0'/,
  "toggleText: { color: '#1C1C1E'"
);

fs.writeFileSync(file, data, 'utf8');
