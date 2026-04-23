const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const NOTION_KEY = process.env.NOTION_KEY;
const MARCACOES_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const PRODUCTS_DATABASE_ID = process.env.NOTION_PRODUCTS_DATABASE_ID;

if (!NOTION_KEY) console.error('❌ NOTION_KEY não definida!');
if (!MARCACOES_DATABASE_ID) console.error('❌ NOTION_DATABASE_ID não definida!');
if (!PRODUCTS_DATABASE_ID) console.error('❌ NOTION_PRODUCTS_DATABASE_ID não definida!');

const notion = new Client({ auth: NOTION_KEY });

function getPlainTextFromTitle(titleArray) {
    if (!Array.isArray(titleArray) || titleArray.length === 0) return '';
    return titleArray.map(item => item.plain_text || '').join('');
}

function getPlainTextFromRichText(richTextArray) {
    if (!Array.isArray(richTextArray) || richTextArray.length === 0) return '';
    return richTextArray.map(item => item.plain_text || '').join('');
}

function getFirstPropertyName(properties, matcher) {
    return Object.keys(properties).find(name => matcher(name.toLowerCase()));
}

async function getDatabaseProperties(databaseId) {
    const dbInfo = await notion.databases.retrieve({ database_id: databaseId });
    return dbInfo.properties || {};
}

function buildMarcacaoProperties(dbProperties, data) {
    const servicoProp = getFirstPropertyName(dbProperties, name => name.includes('servi'));
    const obsProp = getFirstPropertyName(dbProperties, name => name.includes('observa'));

    const properties = {};

    if (data.nome !== undefined) {
        properties['Nome'] = {
            title: [{ text: { content: String(data.nome || '').trim() } }]
        };
    }

    if (data.telefone !== undefined) {
        properties['Telefone'] = {
            phone_number: String(data.telefone || '').trim()
        };
    }

    if (data.data !== undefined) {
        properties['Data Preferida'] = {
            date: { start: data.data }
        };
    }

    if (data.hora !== undefined) {
        properties['Hora Preferida'] = {
            select: { name: data.hora }
        };
    }

    if (servicoProp && data.servico !== undefined) {
        properties[servicoProp] = {
            select: { name: data.servico }
        };
    }

    if (obsProp && data.observacoes !== undefined) {
        properties[obsProp] = {
            rich_text: String(data.observacoes || '').trim()
                ? [{ text: { content: String(data.observacoes).trim() } }]
                : []
        };
    }

    if (data.email !== undefined) {
        properties['Email'] = {
            email: String(data.email || '').trim() || null
        };
    }

    return properties;
}

function buildProductProperties(data) {
    return {
        'Nome': {
            title: [{ text: { content: String(data.nome || '').trim() } }]
        },
        'Preço': {
            number: Number(data.preco || 0)
        },
        'Descrição': {
            rich_text: String(data.descricao || '').trim()
                ? [{ text: { content: String(data.descricao).trim() } }]
                : []
        },
        'Imagem': {
            url: String(data.imagem || '').trim() || null
        }
    };
}

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API online',
        env: {
            notion_key: NOTION_KEY ? '✅ definida' : '❌ em falta',
            marcacoes_database_id: MARCACOES_DATABASE_ID ? '✅ definido' : '❌ em falta',
            products_database_id: PRODUCTS_DATABASE_ID ? '✅ definido' : '❌ em falta'
        }
    });
});

/* =========================
   MARCAÇÕES
========================= */

app.get('/api/marcacoes/verificar', async (req, res) => {
    try {
        const { data, hora } = req.query;

        if (!data || !hora) {
            return res.status(400).json({ success: false, message: 'Data e hora sao obrigatorias' });
        }

        const response = await notion.databases.query({
            database_id: MARCACOES_DATABASE_ID,
            filter: {
                and: [
                    { property: 'Data Preferida', date: { equals: data } },
                    { property: 'Hora Preferida', select: { equals: hora } }
                ]
            }
        });

        return res.json({ success: true, exists: response.results.length > 0 });
    } catch (error) {
        console.error('[verificar] Erro:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar disponibilidade: ' + error.message,
            detail: error.body || null
        });
    }
});

app.post('/api/marcacoes', async (req, res) => {
    try {
        const { nome, telefone, email, servico, data, hora, observacoes } = req.body;

        if (!nome || !telefone || !servico || !data || !hora) {
            return res.status(400).json({ success: false, message: 'Campos obrigatórios em falta' });
        }

        const existingAppointment = await notion.databases.query({
            database_id: MARCACOES_DATABASE_ID,
            filter: {
                and: [
                    { property: 'Data Preferida', date: { equals: data } },
                    { property: 'Hora Preferida', select: { equals: hora } }
                ]
            }
        });

        if (existingAppointment.results.length > 0) {
            return res.status(409).json({
                success: false,
                message: `O horário das ${hora} no dia ${data} já está reservado.`
            });
        }

        const dbProperties = await getDatabaseProperties(MARCACOES_DATABASE_ID);
        const properties = buildMarcacaoProperties(dbProperties, {
            nome, telefone, email, servico, data, hora, observacoes
        });

        await notion.pages.create({
            parent: { database_id: MARCACOES_DATABASE_ID },
            properties
        });

        return res.json({ success: true, message: 'Marcação criada com sucesso!' });
    } catch (error) {
        console.error('=== ERRO CRIAR MARCAÇÃO ===');
        console.error('Mensagem:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao processar a marcação',
            error: error.message,
            detail: error.body || null
        });
    }
});

app.get('/api/marcacoes', async (req, res) => {
    try {
        const dbProperties = await getDatabaseProperties(MARCACOES_DATABASE_ID);
        const servicoProp = getFirstPropertyName(dbProperties, name => name.includes('servi'));
        const obsProp = getFirstPropertyName(dbProperties, name => name.includes('observa'));

        const response = await notion.databases.query({
            database_id: MARCACOES_DATABASE_ID,
            sorts: [{ property: 'Data Preferida', direction: 'descending' }]
        });

        const marcacoes = response.results.map(page => ({
            id: page.id,
            nome: getPlainTextFromTitle(page.properties['Nome']?.title),
            telefone: page.properties['Telefone']?.phone_number || '',
            email: page.properties['Email']?.email || '',
            servico: servicoProp ? page.properties[servicoProp]?.select?.name || '' : '',
            observacoes: obsProp ? getPlainTextFromRichText(page.properties[obsProp]?.rich_text) : '',
            data: page.properties['Data Preferida']?.date?.start || '',
            hora: page.properties['Hora Preferida']?.select?.name || ''
        }));

        return res.json({ success: true, marcacoes });
    } catch (error) {
        console.error('Erro listar marcações:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar marcações',
            error: error.message
        });
    }
});

app.put('/api/marcacoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, telefone, email, servico, data, hora, observacoes } = req.body;

        if (!nome || !telefone || !servico || !data || !hora) {
            return res.status(400).json({ success: false, message: 'Campos obrigatórios em falta para editar.' });
        }

        const dbProperties = await getDatabaseProperties(MARCACOES_DATABASE_ID);

        const duplicated = await notion.databases.query({
            database_id: MARCACOES_DATABASE_ID,
            filter: {
                and: [
                    { property: 'Data Preferida', date: { equals: data } },
                    { property: 'Hora Preferida', select: { equals: hora } }
                ]
            }
        });

        const existsAnother = duplicated.results.some(page => page.id !== id);

        if (existsAnother) {
            return res.status(409).json({
                success: false,
                message: `Já existe outra marcação para ${data} às ${hora}.`
            });
        }

        const properties = buildMarcacaoProperties(dbProperties, {
            nome, telefone, email, servico, data, hora, observacoes
        });

        await notion.pages.update({
            page_id: id,
            properties
        });

        return res.json({ success: true, message: 'Marcação editada com sucesso.' });
    } catch (error) {
        console.error('Erro editar marcação:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao editar a marcação',
            error: error.message,
            detail: error.body || null
        });
    }
});

app.delete('/api/marcacoes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await notion.pages.update({
            page_id: id,
            archived: true
        });

        return res.json({ success: true, message: 'Marcação eliminada com sucesso.' });
    } catch (error) {
        console.error('Erro eliminar marcação:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao eliminar a marcação',
            error: error.message,
            detail: error.body || null
        });
    }
});

/* =========================
   PRODUTOS
========================= */

app.get('/api/produtos', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: PRODUCTS_DATABASE_ID
        });

        const produtos = response.results.map(page => ({
            id: page.id,
            nome: getPlainTextFromTitle(page.properties['Nome']?.title),
            preco: page.properties['Preço']?.number || 0,
            descricao: getPlainTextFromRichText(page.properties['Descrição']?.rich_text),
            imagem: page.properties['Imagem']?.url || ''
        }));

        return res.json({ success: true, produtos });
    } catch (error) {
        console.error('Erro listar produtos:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar produtos',
            error: error.message
        });
    }
});

app.post('/api/produtos', async (req, res) => {
    try {
        const { nome, preco, descricao, imagem } = req.body;

        if (!nome || preco === undefined || preco === null) {
            return res.status(400).json({
                success: false,
                message: 'Nome e preço são obrigatórios.'
            });
        }

        await notion.pages.create({
            parent: { database_id: PRODUCTS_DATABASE_ID },
            properties: buildProductProperties({ nome, preco, descricao, imagem })
        });

        return res.json({ success: true, message: 'Produto criado com sucesso.' });
    } catch (error) {
        console.error('Erro criar produto:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao criar produto',
            error: error.message
        });
    }
});

app.put('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, preco, descricao, imagem } = req.body;

        if (!nome || preco === undefined || preco === null) {
            return res.status(400).json({
                success: false,
                message: 'Nome e preço são obrigatórios.'
            });
        }

        await notion.pages.update({
            page_id: id,
            properties: buildProductProperties({ nome, preco, descricao, imagem })
        });

        return res.json({ success: true, message: 'Produto editado com sucesso.' });
    } catch (error) {
        console.error('Erro editar produto:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao editar produto',
            error: error.message
        });
    }
});

app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await notion.pages.update({
            page_id: id,
            archived: true
        });

        return res.json({ success: true, message: 'Produto eliminado com sucesso.' });
    } catch (error) {
        console.error('Erro eliminar produto:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao eliminar produto',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('Servidor online na porta ' + PORT);
});