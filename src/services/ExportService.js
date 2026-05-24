import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const ExportService = {
    /**
     * Exporta um array de objetos para Excel e abre o menu de compartilhamento
     * @param {Array} data - Lista de objetos [{col1: val, col2: val}]
     * @param {String} fileName - Nome do arquivo (sem extensão)
     */
    exportToExcel: async (data, fileName = 'relatorio_agrogb') => {
        try {
            if (!data || data.length === 0) {
                Alert.alert('Aviso', 'Não há dados para exportar.');
                return;
            }

            // 1. Criar worksheet
            const ws = XLSX.utils.json_to_sheet(data);
            
            // 2. Criar workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Relatorio");

            // 3. Gerar binário base64
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // 4. Salvar temporariamente no dispositivo
            const uri = FileSystem.cacheDirectory + `${fileName}_${new Date().getTime()}.xlsx`;
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: FileSystem.EncodingType.Base64
            });

            // 5. Compartilhar
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    dialogTitle: 'Exportar Relatório AgroGB',
                    UTI: 'com.microsoft.excel.xlsx'
                });
            } else {
                Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo.');
            }
        } catch (error) {
            console.error('Export Error:', error);
            Alert.alert('Erro', 'Falha ao gerar arquivo Excel.');
        }
    },
    
    /**
     * Exporta dados para um PDF formatado profissionalmente
     */
    exportToPDF: async (title, data, fileName = 'relatorio') => {
        try {
            const Print = require('expo-print');
            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
                        h1 { color: #065F46; border-bottom: 2px solid #065F46; padding-bottom: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #F3F4F6; color: #065F46; text-align: left; padding: 12px; border-bottom: 1px solid #E5E7EB; }
                        td { padding: 12px; border-bottom: 1px solid #F3F4F6; }
                        .footer { margin-top: 50px; font-size: 10px; color: #9CA3AF; text-align: center; }
                    </style>
                </head>
                <body>
                    <h1>${title}</h1>
                    <p>Gerado em: ${new Date().toLocaleString()}</p>
                    <table>
                        <thead>
                            <tr>
                                ${Object.keys(data[0] || {}).map(k => `<th>${k.toUpperCase()}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    ${Object.values(row).map(v => `<td>${v}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">AgroGB Enterprise v7.0 - Gestão Rural de Alta Performance</div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('PDF Export Error:', error);
            Alert.alert('Erro', 'Falha ao gerar PDF.');
        }
    }
};
