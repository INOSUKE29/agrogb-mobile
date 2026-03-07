import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getBaseTemplate } from '../utils/ReportTemplate';
import { executeQuery } from '../database/database';

// Helper de formatação
const fmt = (v) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
const fmtKg = (v) => v ? `${v.toLocaleString('pt-BR')} kg` : '0 kg';
const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

export const generatePDFAgro = async (type, startDate, endDate) => {
    try {
        let title = '';
        let contentHtml = '';
        const period = `${fmtData(startDate)} até ${fmtData(endDate)}`;

        // 1. Relatório de Vendas
        if (type === 'VENDAS') {
            title = 'Relatório de Comercialização';
            const res = await executeQuery(
                `SELECT * FROM vendas WHERE data BETWEEN ? AND ? AND is_deleted = 0 ORDER BY data DESC`,
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
                <div class="summary-container">
                    <div class="summary-box">
                        <div class="summary-label">Volume Total Vendas</div>
                        <div class="summary-value">${fmt(total)}</div>
                    </div>
                    <div class="summary-box">
                         <div class="summary-label">Qtd. Transações</div>
                         <div class="summary-value" style="color: #1F2937">${res.rows.length}</div>
                    </div>
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
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center">Nenhum registro encontrado</td></tr>'}</tbody>
                </table>
            `;
        }

        // 2. Relatório de Estoque
        else if (type === 'ESTOQUE') {
            title = 'Inventário de Insumos e Produtos';
            const res = await executeQuery(`SELECT * FROM estoque WHERE is_deleted = 0 ORDER BY produto ASC`);

            let rows = '';
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                rows += `
                <tr>
                    <td><b>${item.produto}</b></td>
                    <td>${item.quantidade}</td>
                    <td><span class="badge ${item.quantidade > 0 ? 'badge-info' : 'badge-error'}">${item.quantidade > 0 ? 'Disponível' : 'Esgotado'}</span></td>
                    <td>${fmtData(item.last_updated)}</td>
                </tr>`;
            }

            contentHtml = `
                 <div class="summary-container">
                    <div class="summary-box">
                        <div class="summary-label">Itens em Catálogo</div>
                        <div class="summary-value" style="color: #3B82F6">${res.rows.length}</div>
                    </div>
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
                    <tbody>${rows || '<tr><td colspan="4" style="text-align:center">Nenhum registro encontrado</td></tr>'}</tbody>
                </table>
            `;
        }

        // 3. Relatório de Colheita (NOVO)
        else if (type === 'COLHEITA') {
            title = 'Rastreabilidade de Colheita';
            const res = await executeQuery(
                `SELECT * FROM colheitas WHERE data BETWEEN ? AND ? AND is_deleted = 0 ORDER BY data DESC`,
                [startDate, endDate]
            );

            let totalQtd = 0;
            let rows = '';
            for (let i = 0; i < res.rows.length; i++) {
                const item = res.rows.item(i);
                totalQtd += item.quantidade;
                rows += `
                <tr>
                    <td>${fmtData(item.data)}</td>
                    <td><b>${item.cultura}</b></td>
                    <td>${item.produto}</td>
                    <td>${fmtKg(item.quantidade)}</td>
                    <td>${item.observacao || '-'}</td>
                </tr>`;
            }

            contentHtml = `
                <div class="summary-container">
                    <div class="summary-box">
                        <div class="summary-label">Produção Total Acumulada</div>
                        <div class="summary-value" style="color: #10B981">${fmtKg(totalQtd)}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>DATA</th>
                            <th>CULTURA</th>
                            <th>PRODUTO/LOTE</th>
                            <th>QUANTIDADE</th>
                            <th>NOTAS</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="5" style="text-align:center">Nenhum registro encontrado</td></tr>'}</tbody>
                </table>
            `;
        }

        // --- GERAÇÃO FINAL DO PDF ---
        const html = getBaseTemplate(title, period, contentHtml);

        const { uri } = await Print.printToFileAsync({ html });
        console.log('PDF gerado em:', uri);

        const safeTitle = title.replace(/ /g, '_');
        const filename = `AgroGB_${safeTitle}_${new Date().getTime()}.pdf`;
        const newPath = `${FileSystem.documentDirectory}${filename}`;

        await FileSystem.moveAsync({
            from: uri,
            to: newPath
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(newPath);
        }

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
    }
};
