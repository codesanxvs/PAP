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
        status: getSelect(page, 'Status') || '',
        observacoes: getRichText(page, 'Observações')
    };
}

async function getMarcacoesPorData(data) {
    const response = await notion.databases.query({
        database_id: DATABASE_ID,
        filter: {
            property: 'Data Preferida',
            date: {
                equals: data
            }
        }
    });

    return response.results.map(normalizarMarcacao);
}

async function horarioJaReservado(data, hora) {
    const marcacoes = await getMarcacoesPorData(data);

    return marcacoes.some(marcacao => {
        const status = (marcacao.status || '').trim().toLowerCase();
        const ativo = status === '' || status === 'pendente' || status === 'confirmada';
        return ativo && marcacao.hora === hora;
    });
}

async function getHorasOcupadasParaData(data) {
    const marcacoes = await getMarcacoesPorData(data);

    return marcacoes
        .filter(marcacao => {
            const status = (marcacao.status || '').trim().toLowerCase();
            return status === '' || status === 'pendente' || status === 'confirmada';
        })
        .map(marcacao => marcacao.hora)
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

        const reservado = await horarioJaReservado(data, hora);

        if (reservado) {
            return res.status(409).json({
                success: false,
                message: 'Este horário já está reservado.'
            });
        }

        const properties = {
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
            Observações: {
                rich_text: observacoes
                    ? [{ text: { content: String(observacoes).trim() } }]
                    : []
            }
        };

        // Só tenta criar Status se essa opção existir na tua base.
        // Se não existir, o resto continua a funcionar.
        try {
            properties.Status = {
                select: { name: 'Pendente' }
            };
        } catch (_) {}

        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties
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
                { property: 'Data Preferida', direction: 'ascending' }
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

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor online na porta ${PORT}`);
});