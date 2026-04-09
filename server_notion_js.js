// server_notion_js.js - Versão Otimizada para Render
const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();

// O Render define a porta automaticamente. Se não houver, usa a 10000.
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Notion - Lendo das Environment Variables do Render
const notion = new Client({
    auth: process.env.NOTION_KEY 
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Rota para criar marcação
app.post('/api/marcacoes', async (req, res) => {
    try {
        const { nome, telefone, email, servico, data, hora, observacoes } = req.body;

        // Validação básica
        if (!nome || !telefone || !servico || !data || !hora) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios faltando'
            });
        }

        // Criar página no Notion
        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                'Nome': {
                    title: [{ text: { content: nome || 'Sem Nome' } }]
                },
                'Telefone': {
                    phone_number: telefone || ''
                },
                'Email': {
                    email: email && email.includes('@') ? email : null
                },
                'Serviço Pretendido': {
                    select: { name: servico } 
                },
                'Data Preferida': {
                    date: { start: data }
                },
                'Hora Preferida': { 
                    select: { name: hora } 
                },
                'Observações': {
                    rich_text: [{ text: { content: observacoes || '' } }]
                }
            }
        });

        console.log('✅ Marcação criada no Notion!');
        res.json({ success: true, message: 'Marcação criada com sucesso!' });

    } catch (error) {
        console.error('❌ Erro:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para listar marcações
app.get('/api/marcacoes', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            sorts: [{ property: 'Data Preferida', direction: 'descending' }]
        });

        const marcacoes = response.results.map(page => ({
            id: page.id,
            nome: page.properties['Nome']?.title[0]?.text.content || '',
            telefone: page.properties['Telefone']?.phone_number || '',
            email: page.properties['Email']?.email || '',
            servico: page.properties['Serviço Pretendido']?.select?.name || '',
            data: page.properties['Data Preferida']?.date?.start || '',
            hora: page.properties['Hora Preferida']?.select?.name || '',
            observacoes: page.properties['Observações']?.rich_text[0]?.text.content || ''
        }));

        res.json({ success: true, marcacoes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
}); 