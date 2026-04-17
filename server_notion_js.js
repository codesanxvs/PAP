const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const notion = new Client({
    auth: process.env.NOTION_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

function getPlainTextFromTitle(titleArray) {
    if (!Array.isArray(titleArray) || titleArray.length === 0) return '';
    return titleArray.map(item => item.plain_text || '').join('');
}

function getPlainTextFromRichText(richTextArray) {
    if (!Array.isArray(richTextArray) || richTextArray.length === 0) return '';
    return richTextArray.map(item => item.plain_text || '').join('');
}

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de marcações online'
    });
});

app.get('/api/marcacoes/verificar', async (req, res) => {
    try {
        const { data, hora } = req.query;

        if (!data || !hora) {
            return res.status(400).json({
                success: false,
                message: 'Data e hora são obrigatórias'
            });
        }

        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                and: [
                    {
                        property: 'Data Preferida',
                        date: {
                            equals: data
                        }
                    },
                    {
                        property: 'Hora Preferida',
                        select: {
                            equals: hora
                        }
                    }
                ]
            }
        });

        return res.json({
            success: true,
            exists: response.results.length > 0
        });
    } catch (error) {
        console.error('❌ Erro ao verificar disponibilidade:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar disponibilidade',
            error: error.message
        });
    }
});

app.post('/api/marcacoes', async (req, res) => {
    try {
        const { nome, telefone, email, servico, data, hora, observacoes } = req.body;

        if (!nome || !telefone || !servico || !data || !hora) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios faltando'
            });
        }

        const existingAppointment = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                and: [
                    {
                        property: 'Data Preferida',
                        date: {
                            equals: data
                        }
                    },
                    {
                        property: 'Hora Preferida',
                        select: {
                            equals: hora
                        }
                    }
                ]
            }
        });

        if (existingAppointment.results.length > 0) {
            return res.status(409).json({
                success: false,
                message: `O horário das ${hora} no dia ${data} já está reservado.`
            });
        }

        const properties = {
            'Nome': {
                title: [{ text: { content: nome.trim() } }]
            },
            'Telefone': {
                phone_number: telefone.trim()
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
                rich_text: observacoes && observacoes.trim()
                    ? [{ text: { content: observacoes.trim() } }]
                    : []
            }
        };

        // Só inclui email se for válido — o Notion rejeita null neste campo
        if (email && email.includes('@')) {
            properties['Email'] = { email: email.trim() };
        }

        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties
        });

        console.log('✅ Marcação criada no Notion!');
        return res.json({
            success: true,
            message: 'Marcação criada com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao criar marcação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao processar a marcação',
            error: error.message
        });
    }
});

app.get('/api/marcacoes', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            sorts: [
                { property: 'Data Preferida', direction: 'descending' }
            ]
        });

        const marcacoes = response.results.map(page => ({
            id: page.id,
            nome: getPlainTextFromTitle(page.properties['Nome']?.title),
            telefone: page.properties['Telefone']?.phone_number || '',
            email: page.properties['Email']?.email || '',
            servico: page.properties['Serviço Pretendido']?.select?.name || '',
            data: page.properties['Data Preferida']?.date?.start || '',
            hora: page.properties['Hora Preferida']?.select?.name || '',
            observacoes: getPlainTextFromRichText(page.properties['Observações']?.rich_text)
        }));

        return res.json({
            success: true,
            marcacoes
        });
    } catch (error) {
        console.error('❌ Erro ao listar marcações:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar marcações',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
});