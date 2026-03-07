export const getBaseTemplate = (title, period, content, footerText = "AgroGB Mobile - Inteligência de Campo") => {
    const today = new Date().toLocaleDateString('pt-BR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Relatório AgroGB</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
            
            body {
                font-family: 'Inter', sans-serif;
                margin: 0;
                padding: 50px;
                color: #1F2937;
                background: #FFF;
                line-height: 1.5;
            }

            @page {
                margin: 20px;
                @bottom-center {
                    content: "Página " counter(page);
                    font-size: 10px;
                    color: #9CA3AF;
                }
            }

            .header {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 3px solid #10B981;
                padding-bottom: 25px;
                margin-bottom: 40px;
            }

            .brand {
                display: flex;
                flex-direction: column;
            }

            .brand-logo {
                font-size: 28px;
                font-weight: 800;
                color: #10B981;
                margin: 0;
                letter-spacing: -1.5px;
            }

            .brand-tagline {
                font-size: 10px;
                font-weight: 600;
                color: #6B7280;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-top: -4px;
            }

            .doc-info {
                text-align: right;
            }

            .doc-title {
                font-size: 20px;
                font-weight: 800;
                color: #111827;
                margin: 0;
                text-transform: uppercase;
            }

            .doc-meta {
                font-size: 11px;
                color: #6B7280;
                margin-top: 4px;
                font-weight: 500;
            }

            .summary-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 40px;
            }

            .summary-box {
                flex: 1;
                min-width: 150px;
                background-color: #F9FAFB;
                border: 1px solid #E5E7EB;
                border-radius: 12px;
                padding: 20px;
                text-align: left;
            }

            .summary-label {
                font-size: 10px;
                font-weight: 700;
                color: #6B7280;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }

            .summary-value {
                font-size: 22px;
                font-weight: 800;
                color: #10B981;
            }

            table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                font-size: 11px;
                margin-bottom: 30px;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #E5E7EB;
            }

            thead {
                background-color: #F3F4F6;
                color: #374151;
            }

            th {
                padding: 14px 12px;
                text-align: left;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 9px;
                letter-spacing: 0.5px;
                border-bottom: 1px solid #E5E7EB;
            }

            td {
                padding: 12px;
                border-bottom: 1px solid #F3F4F6;
                color: #4B5563;
            }

            tr:last-child td {
                border-bottom: none;
            }

            tr:nth-child(even) {
                background-color: #FAFAFA;
            }

            .footer {
                position: fixed;
                bottom: 30px;
                left: 50px;
                right: 50px;
                text-align: center;
                font-size: 9px;
                color: #9CA3AF;
                padding-top: 15px;
                border-top: 1px solid #F3F4F6;
            }

            .badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 9px;
                font-weight: 700;
                text-transform: uppercase;
            }
            .badge-success { background: #DCFCE7; color: #166534; }
            .badge-error { background: #FEE2E2; color: #991B1B; }
            .badge-neutral { background: #F3F4F6; color: #374151; }
            .badge-info { background: #DBEAFE; color: #1E40AF; }

        </style>
    </head>
    <body>
        <div class="header">
            <div class="brand">
                <h2 class="brand-logo">AGRO<span style="color: #1F2937">GB</span></h2>
                <span class="brand-tagline">Inteligência de Campo</span>
            </div>
            <div class="doc-info">
                <h1 class="doc-title">${title}</h1>
                <div class="doc-meta">Período: ${period}</div>
                <div class="doc-meta">Emitido em: ${today}</div>
            </div>
        </div>

        <div class="content">
            ${content}
        </div>

        <div class="footer">
            ${footerText} &bull; Gerado via AgroGB Professional v7.0
        </div>
    </body>
    </html>
    `;
};
