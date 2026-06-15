const fs = require('fs');

const file = 'apps/mobile/mobile_app/src/theme/DarkTheme.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("bg: '#0B1220'", "bg: '#0F172A'");
content = content.replace("bgCard: '#1F2937'", "bgCard: '#1E293B'");
content = content.replace("bgInput: '#111827'", "bgInput: '#FFFFFF'");
content = content.replace("bgSec: '#111827'", "bgSec: '#1E293B'");

content = content.replace("green: '#22C55E'", "green: '#10B981'");
content = content.replace("greenDark: '#16A34A'", "greenDark: '#059669'");
content = content.replace("greenGlow: '#4ADE80'", "greenGlow: '#34D399'");

content = content.replace("textPrimary: '#F9FAFB'", "textPrimary: '#F8FAFC'");
content = content.replace("textSecondary: '#9CA3AF'", "textSecondary: '#94A3B8'");
content = content.replace("borderFocus: '#22C55E'", "borderFocus: '#10B981'");

// Add textInput color right after textSecondary
if (!content.includes('textInput:')) {
    content = content.replace("textSecondary: '#94A3B8',", "textSecondary: '#94A3B8',\n    textInput: '#0F172A',\n    textPlaceholder: '#64748B',");
}

// Modify input styling
content = content.replace("color: D.textPrimary,", "color: D.textInput,");
content = content.replace("borderColor: D.border,", "borderColor: '#E2E8F0', // Borda sutil no branco");

// Change Header gradient
content = content.replace("headerGrad: ['#1A3A2A', '#1a3260']", "headerGrad: ['#064E3B', '#0F172A']");

fs.writeFileSync(file, content, 'utf8');
console.log('Theme patched successfully.');
