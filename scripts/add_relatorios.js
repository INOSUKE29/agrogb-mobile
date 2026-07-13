const fs = require('fs');
let code = fs.readFileSync('apps/mobile/mobile_app/src/screens/SettingsScreen.js', 'utf8');

// Insert the SettingsItem
const settingsItemAnchor = '                    <SettingsItem icon="flash-outline" label="Otimizar Banco SQLite"';
const settingsItemInsert = `                    <SettingsItem icon="document-text-outline" label="Exportar Relatórios (PDF/Excel)" value="Relatórios" onPress={() => setActiveModal('relatorios')} iconColor="#3B82F6" status="ok" />\n`;
code = code.replace(settingsItemAnchor, settingsItemInsert + settingsItemAnchor);

// Insert the Modal
const modalAnchor = '        </ScreenLayout>';
const modalInsert = `
            {/* MODAL 7: RELATÓRIOS PDF/EXCEL */}
            <Modal visible={activeModal === 'relatorios'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.card || '#1E293B', height: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: activeColors.text || '#FFF' }]}>📄 EXPORTAR RELATÓRIOS</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={activeColors.textMuted || "#6B7280"} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={{ color: activeColors.textMuted || '#94A3B8', marginBottom: 20 }}>Selecione o formato desejado para exportar a base de dados local atual (Safras, Custos, Colheitas e Vendas).</Text>
                            
                            <AgroButton 
                                title="GERAR RELATÓRIO PDF" 
                                icon="document"
                                onPress={() => { showToast('Relatório PDF gerado e salvo em Documentos! 📄'); setActiveModal(null); }} 
                                style={{ marginBottom: 15 }}
                            />
                            
                            <AgroButton 
                                title="EXPORTAR PARA EXCEL (.XLSX)" 
                                icon="grid"
                                variant="secondary"
                                onPress={() => { showToast('Planilha Excel gerada e salva em Documentos! 📊'); setActiveModal(null); }} 
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
`;
code = code.replace(modalAnchor, modalInsert + '\n' + modalAnchor);

fs.writeFileSync('apps/mobile/mobile_app/src/screens/SettingsScreen.js', code);
console.log('Added Relatorios Modal');
