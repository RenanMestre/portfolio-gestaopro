// Requer: npm install express @google-analytics/data dotenv

const express = require('express');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001; // Render usa PORT por padrão

// Configure seu arquivo .env com:
// GA_PROPERTY_ID=G-G2FGBS8YY2
// GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

const analyticsDataClient = new BetaAnalyticsDataClient();

app.get('/api/analytics', async (req, res) => {
    try {
        // Exemplo: busca usuários online (últimos 10 minutos)
        const [response] = await analyticsDataClient.runRealtimeReport({
            property: `properties/${process.env.GA_PROPERTY_ID.replace('G-', '')}`,
            dimensions: [{ name: 'minute' }],
            metrics: [{ name: 'activeUsers' }]
        });

        const usersOnline = response.rows.map(row => Number(row.metricValues[0].value));
        // Exemplo: busca páginas mais acessadas hoje
        const [pagesResp] = await analyticsDataClient.runReport({
            property: `properties/${process.env.GA_PROPERTY_ID.replace('G-', '')}`,
            dateRanges: [{ startDate: 'today', endDate: 'today' }],
            dimensions: [{ name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }]
        });

        const pages = {};
        pagesResp.rows.forEach(row => {
            pages[row.dimensionValues[0].value] = Number(row.metricValues[0].value);
        });

        // Total de acessos hoje
        const totalToday = Object.values(pages).reduce((a, b) => a + b, 0);

        // Tempo médio de navegação (simulado, pois depende de configuração extra)
        const avgSession = 3.2;

        res.json({
            usersOnline,
            pages,
            totalToday,
            avgSession
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao consultar Google Analytics', details: err.message });
    }
});

app.listen(port, () => {
    console.log(`API de Analytics rodando em http://localhost:${port}/api/analytics`);
});

// Instruções para deploy no Render.com:
// 1. Crie um novo serviço Web no Render apontando para este repositório ou faça upload dos arquivos.
// 2. No painel do Render, adicione as variáveis de ambiente:
//    - GA_PROPERTY_ID=G-G2FGBS8YY2
//    - GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/service-account.json
// 3. Faça upload do arquivo service-account.json em "Secret Files" do Render e defina o caminho conforme acima.
// 4. Render irá iniciar o servidor automaticamente na porta definida por PORT.
// 5. O endpoint ficará disponível em: https://<seu-app>.onrender.com/api/analytics
