// server.js - Versão Final (SEM STATUS)
const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Notion
const notion = new Client({
    auth: 'ntn_b360298511599QkI8LW4c9PwSUHyRoRXgqNo5x9Nulsfqw' 
});

const DATABASE_ID = '33d0d6c1309b80529fc6f4ef8175f496';

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
        const response = await notion.pages.create({
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
        // CORREÇÃO: Enviando como Select para bater com o teu Notion
        select: { name: hora } 
    },
    'Observações': {
        rich_text: [{ text: { content: observacoes || '' } }]
    }
    // Status removido completamente
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
            hora: page.properties['Hora Preferida']?.rich_text[0]?.text.content || '',
            observacoes: page.properties['Observações']?.rich_text[0]?.text.content || ''
            // STATUS REMOVIDO DAQUI TAMBÉM
        }));

        res.json({ success: true, marcacoes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});