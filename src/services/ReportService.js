import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getBaseTemplate } from '../utils/ReportTemplate';
import { executeQuery } from '../database/database';

// Helper de formatação de moeda formatCurrency
const fmt = (v) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

export const generatePDFAgro = async (type, startDate, endDate) => {
    try {
        let title = '';
        let contentHtml = '';
        const period = `${fmtData(startDate)} até ${fmtData(endDate)}`;

        // 1. Relatório de Vendas
        if (type === 'VENDAS') {
            title = 'Relatório de Vendas';
            const res = await executeQuery(
                `SELECT * FROM vendas WHERE data BETWEEN ? AND ? ORDER BY data DESC`,
                [startDate, endDate]
            );

            let total = 0;
            let rows = '';

            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                total += item.valor * item.quantidade;
                rows += `
                <tr>
                    <td>${fmtData(item.data)}</td>
                    <td><b>${item.cliente}</b></td>
                    <td>${item.produto}</td>
                    <td>${item.quantidade}</td>
                    <td>${fmt(item.valor)}</td>
                    <td><b>${fmt(item.valor * item.quantidade)}</b></td>
                </tr>`;
            }

            contentHtml = `
                <div class="summary-box">
                    <div class="summary-title">RESUMO DO PERÍODO</div>
                    <div style="font-size: 24px; font-weight: 900; color: #10B981">${fmt(total)}</div>
                    <div style="font-size: 12px; color: #6B7280">${res.rows.length} registros encontrados</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>CLIENTE</th>
                            <th>PRODUTO</th>
                            <th>QTD</th>
                            <th>UNITÁRIO</th>
                            <th>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        // 2. Relatório de Estoque (Snapshot - Data range ignorado nesse caso, é o atual)
        else if (type === 'ESTOQUE') {
            title = 'Posição de Estoque Atual';
            const res = await executeQuery(`SELECT * FROM estoque ORDER BY produto ASC`);

            let rows = '';
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                rows += `
                <tr>
                    <td><b>${item.produto}</b></td>
                    <td>${item.quantidade}</td>
                    <td><span class="badge badge-blue">Disponível</span></td>
                    <td>${fmtData(item.last_updated)}</td>
                </tr>`;
            }

            contentHtml = `
                 <div class="summary-box">
                    <div class="summary-title">ITENS CADASTRADOS</div>
                    <div style="font-size: 24px; font-weight: 900; color: #3B82F6">${res.rows.length}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>PRODUTO/INSUMO</th>
                            <th>SALDO ATUAL</th>
                            <th>STATUS</th>
                            <th>ÚLT. MOVIM.</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        // 3. Relatório Detalhado de Colheita (Fase 14)
        else if (type === 'COLHEITA_DETALHADA') {
            title = 'Relatório Operacional de Colheita';
            const res = await executeQuery(
                `SELECT data, cultura, area_id, total_caixas, quantidade, observacao 
                 FROM colheitas 
                 WHERE data BETWEEN ? AND ? AND is_deleted = 0 
                 ORDER BY data DESC, area_id ASC`,
                [startDate, endDate]
            );

            let totalCx = 0;
            let totalKg = 0;
            let rows = '';

            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                totalCx += (item.total_caixas || 0);
                totalKg += (item.quantidade || 0);

                let obsBadge = '';
                if (item.observacao && item.observacao.toUpperCase().includes('CONGELADO')) {
                    obsBadge = '<span class="badge badge-blue" style="margin-right: 4px;">Congelado</span>';
                } else if (item.observacao && item.observacao.toUpperCase().includes('DESCARTE')) {
                    obsBadge = '<span class="badge badge-red" style="margin-right: 4px;">Descarte</span>';
                }

                rows += `
                <tr>
                    <td>${fmtData(item.data)}</td>
                    <td><b>${item.area_id || 'N/A'}</b></td>
                    <td>${item.cultura || 'N/A'}</td>
                    <td>${item.total_caixas || 0}</td>
                    <td>${item.quantidade || 0}</td>
                    <td>${obsBadge}<span style="font-size: 10px; color: #6B7280">${item.observacao || ''}</span></td>
                </tr>`;
            }

            contentHtml = `
                 <div class="summary-box">
                    <div class="summary-title">PRODUÇÃO DO PERÍODO</div>
                    <div style="font-size: 24px; font-weight: 900; color: #10B981">${totalCx} Caixas <span style="font-size: 16px; color: #6B7280; font-weight: normal">(${totalKg} KG)</span></div>
                    <div style="font-size: 12px; color: #6B7280">${res.rows.length} registros computados</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>ÁREA / TALHÃO</th>
                            <th>CULTURA</th>
                            <th>CAIXAS</th>
                            <th>KG TOTAL</th>
                            <th>OBSERVAÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;
        }

        // --- GERAÇÃO FINAL DO PDF ---
        const html = getBaseTemplate(title, period, contentHtml);

        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF gerado em:', uri);

        // Renomear para ficar bonito
        const safeTitle = title.replace(/ /g, '_');
        const newPath = `${FileSystem.documentDirectory}AgroGB_${safeTitle}_${startDate}.pdf`;

        await FileSystem.moveAsync({
            from: uri,
            to: newPath
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(newPath);
        } else {
            alert('Compartilhamento não disponível neste dispositivo');
        }

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Falha ao gerar relatório');
    }
};
