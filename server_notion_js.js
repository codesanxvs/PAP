// server.js - Backend para integração com Notion
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
    auth: 'SEU_NOTION_TOKEN_AQUI' // Substitua pelo seu token
});

const DATABASE_ID = 'SEU_DATABASE_ID_AQUI'; // Substitua pelo ID da sua base

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
                    title: [
                        {
                            text: {
                                content: nome
                            }
                        }
                    ]
                },
                'Telefone': {
                    phone_number: telefone
                },
                'Email': {
                    email: email || null
                },
                'Serviço': {
                    select: {
                        name: servico
                    }
                },
                'Data': {
                    date: {
                        start: data
                    }
                },
                'Hora': {
                    rich_text: [
                        {
                            text: {
                                content: hora
                            }
                        }
                    ]
                },
                'Observações': {
                    rich_text: [
                        {
                            text: {
                                content: observacoes || ''
                            }
                        }
                    ]
                },
                'Status': {
                    select: {
                        name: 'Pendente'
                    }
                }
            }
        });

        console.log('✅ Marcação criada no Notion:', response.id);

        res.json({
            success: true,
            message: 'Marcação criada com sucesso!',
            notionPageId: response.id
        });

    } catch (error) {
        console.error('❌ Erro ao criar marcação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar marcação',
            error: error.message
        });
    }
});

// Rota para listar marcações (para o painel admin)
app.get('/api/marcacoes', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            sorts: [
                {
                    property: 'Data de Criação',
                    direction: 'descending'
                }
            ]
        });

        const marcacoes = response.results.map(page => ({
            id: page.id,
            nome: page.properties.Nome.title[0]?.text.content || '',
            telefone: page.properties.Telefone.phone_number || '',
            email: page.properties.Email.email || '',
            servico: page.properties.Serviço.select?.name || '',
            data: page.properties.Data.date?.start || '',
            hora: page.properties.Hora.rich_text[0]?.text.content || '',
            observacoes: page.properties.Observações.rich_text[0]?.text.content || '',
            status: page.properties.Status.select?.name || 'Pendente'
        }));

        res.json({
            success: true,
            marcacoes
        });

    } catch (error) {
        console.error('❌ Erro ao listar marcações:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar marcações',
            error: error.message
        });
    }
});

// Rota para atualizar status da marcação
app.patch('/api/marcacoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await notion.pages.update({
            page_id: id,
            properties: {
                'Status': {
                    select: {
                        name: status
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Status atualizado com sucesso!'
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📝 Pronto para receber marcações e enviar para o Notion!`);
});