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

if (!process.env.NOTION_KEY || !DATABASE_ID) {
    console.warn('⚠️ NOTION_KEY ou NOTION_DATABASE_ID não estão definidos.');
}

function getTitle(page, propertyName) {
    return page.properties?.[propertyName]?.title?.[0]?.plain_text || '';
}

function getPhone(page, propertyName) {
    return page.properties?.[propertyName]?.phone_number || '';
}

function getEmail(page, propertyName) {
    return page.properties?.[propertyName]?.email || '';
}

function getSelect(page, propertyName) {
    return page.properties?.[propertyName]?.select?.name || '';
}

function getDate(page, propertyName) {
    return page.properties?.[propertyName]?.date?.start || '';
}

function getRichText(page, propertyName) {
    return page.properties?.[propertyName]?.rich_text?.[0]?.plain_text || '';
}

function normalizarMarcacao(page) {
    return {
        id: page.id,
        nome: getTitle(page, 'Nome'),
        telefone: getPhone(page, 'Telefone'),
        email: getEmail(page, 'Email'),
        servico: getSelect(page, 'Serviço Pretendido'),
        data: getDate(page, 'Data Preferida'),
        hora: getSelect(page, 'Hora Preferida'),
        status: getSelect(page, 'Status') || 'Pendente',
        observacoes: getRichText(page, 'Observações')
    };
}

// CORRIGIDO: O filtro "does_not_equal: Cancelada" na API do Notion
// NÃO devolve registos onde o campo Status está vazio/null,
// o que faz com que marcações sem status passem a verificação.
// A solução correcta é filtrar explicitamente pelos status activos:
// Pendente OU Confirmada.
async function horarioJaReservado(data, hora) {
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
                },
                {
                    // Em vez de "does_not_equal: Cancelada" (que ignora nulos),
                    // filtramos explicitamente pelos status que bloqueiam o horário.
                    or: [
                        {
                            property: 'Status',
                            select: {
                                equals: 'Pendente'
                            }
                        },
                        {
                            property: 'Status',
                            select: {
                                equals: 'Confirmada'
                            }
                        },
                        // Cobre o caso de registos sem Status definido (campo vazio)
                        {
                            property: 'Status',
                            select: {
                                is_empty: true
                            }
                        }
                    ]
                }
            ]
        }
    });

    return response.results.length > 0;
}

// Mesma correcção aplicada à query de horários ocupados
async function getHorasOcupadasParaData(data) {
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
                    or: [
                        {
                            property: 'Status',
                            select: {
                                equals: 'Pendente'
                            }
                        },
                        {
                            property: 'Status',
                            select: {
                                equals: 'Confirmada'
                            }
                        },
                        {
                            property: 'Status',
                            select: {
                                is_empty: true
                            }
                        }
                    ]
                }
            ]
        }
    });

    return response.results
        .map(page => getSelect(page, 'Hora Preferida'))
        .filter(Boolean);
}

app.get('/', (req, res) => {
    return res.json({
        success: true,
        message: 'API Flash Cabeleireiro online'
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

        const exists = await horarioJaReservado(data, hora);

        return res.json({
            success: true,
            exists
        });
    } catch (error) {
        console.error('❌ Erro ao verificar horário:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar disponibilidade',
            error: error.message
        });
    }
});

app.get('/api/marcacoes/horarios-ocupados', async (req, res) => {
    try {
        const { data } = req.query;

        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'A data é obrigatória'
            });
        }

        const horasOcupadas = await getHorasOcupadasParaData(data);

        return res.json({
            success: true,
            horasOcupadas
        });
    } catch (error) {
        console.error('❌ Erro ao obter horários ocupados:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao obter horários ocupados',
            error: error.message
        });
    }
});

app.post('/api/marcacoes', async (req, res) => {
    try {
        const { nome, telefone, email, servico, data, hora, observacoes } = req.body || {};

        if (!nome || !telefone || !servico || !data || !hora) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios faltando'
            });
        }

        // Verificação de duplicado no servidor (protecção principal contra race conditions)
        const reservado = await horarioJaReservado(data, hora);

        if (reservado) {
            return res.status(409).json({
                success: false,
                message: 'Este horário já está reservado.'
            });
        }

        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                Nome: {
                    title: [{ text: { content: String(nome).trim() } }]
                },
                Telefone: {
                    phone_number: String(telefone).trim()
                },
                Email: {
                    email: email && String(email).includes('@') ? String(email).trim() : null
                },
                'Serviço Pretendido': {
                    select: { name: String(servico) }
                },
                'Data Preferida': {
                    date: { start: String(data) }
                },
                'Hora Preferida': {
                    select: { name: String(hora) }
                },
                Status: {
                    select: { name: 'Pendente' }
                },
                Observações: {
                    rich_text: observacoes
                        ? [{ text: { content: String(observacoes).trim() } }]
                        : []
                }
            }
        });

        return res.json({
            success: true,
            message: 'Marcação criada com sucesso!'
        });
    } catch (error) {
        console.error('❌ Erro ao criar marcação:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno ao criar marcação',
            error: error.message
        });
    }
});

app.get('/api/marcacoes', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            sorts: [
                { property: 'Data Preferida', direction: 'ascending' },
                { property: 'Hora Preferida', direction: 'ascending' }
            ]
        });

        const marcacoes = response.results.map(normalizarMarcacao);

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

app.patch('/api/marcacoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};

        const statusPermitidos = ['Pendente', 'Confirmada', 'Cancelada'];

        if (!status || !statusPermitidos.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status inválido'
            });
        }

        await notion.pages.update({
            page_id: id,
            properties: {
                Status: {
                    select: { name: status }
                }
            }
        });

        return res.json({
            success: true,
            message: 'Status atualizado com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: error.message
        });
    }
});

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Erro inesperado:', err);
    return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
});