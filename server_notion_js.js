const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Validar variáveis de ambiente ao arrancar
const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_KEY) console.error('❌ NOTION_KEY não definida!');
if (!DATABASE_ID) console.error('❌ NOTION_DATABASE_ID não definida!');

const notion = new Client({ auth: NOTION_KEY });

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
        message: 'API de marcacoes online',
        env: {
            notion_key: NOTION_KEY ? '✅ definida' : '❌ em falta',
            database_id: DATABASE_ID ? '✅ definido' : '❌ em falta'
        }
    });
});

// ─── VERIFICAR DISPONIBILIDADE ────────────────────────────────────────────────
app.get('/api/marcacoes/verificar', async (req, res) => {
    try {
        const { data, hora } = req.query;

        if (!data || !hora) {
            return res.status(400).json({ success: false, message: 'Data e hora sao obrigatorias' });
        }

        if (!DATABASE_ID) {
            return res.status(500).json({ success: false, message: 'DATABASE_ID não configurado no servidor' });
        }

        console.log(`[verificar] data=${data} hora=${hora}`);

        // Fazer duas queries separadas e cruzar os resultados manualmente
        // (mais robusto do que depender de filtros AND no Notion)
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                and: [
                    {
                        property: 'Data Preferida',
                        date: { equals: data }
                    },
                    {
                        property: 'Hora Preferida',
                        select: { equals: hora }
                    }
                ]
            }
        });

        console.log(`[verificar] resultados encontrados: ${response.results.length}`);

        return res.json({ success: true, exists: response.results.length > 0 });

    } catch (error) {
        console.error('[verificar] Erro:', error.message);
        console.error('[verificar] Body:', JSON.stringify(error.body, null, 2));

        // Devolver mensagem clara ao cliente
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar disponibilidade: ' + error.message,
            detail: error.body || null
        });
    }
});

// ─── CRIAR MARCAÇÃO ───────────────────────────────────────────────────────────
app.post('/api/marcacoes', async (req, res) => {
    try {
        const { nome, telefone, email, servico, data, hora, observacoes } = req.body;

        console.log('=== NOVA MARCACAO ===');
        console.log('Dados:', JSON.stringify(req.body, null, 2));

        if (!nome || !telefone || !servico || !data || !hora) {
            return res.status(400).json({ success: false, message: 'Campos obrigatorios faltando' });
        }

        if (!DATABASE_ID) {
            return res.status(500).json({ success: false, message: 'DATABASE_ID não configurado no servidor' });
        }

        // Verificar duplicado antes de criar
        const existingAppointment = await notion.databases.query({
            database_id: DATABASE_ID,
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
                message: `O horario das ${hora} no dia ${data} ja esta reservado.`
            });
        }

        // Descobrir nomes exatos das propriedades na BD
        const dbInfo = await notion.databases.retrieve({ database_id: DATABASE_ID });
        const propNames = Object.keys(dbInfo.properties);
        console.log('Propriedades da BD Notion:', JSON.stringify(propNames, null, 2));

        const properties = {
            'Nome': { title: [{ text: { content: nome.trim() } }] },
            'Telefone': { phone_number: telefone.trim() },
            'Data Preferida': { date: { start: data } },
            'Hora Preferida': { select: { name: hora } },
        };

        const servicoProp = propNames.find(p => p.toLowerCase().includes('servi'));
        if (servicoProp) {
            properties[servicoProp] = { select: { name: servico } };
        }

        const obsProp = propNames.find(p => p.toLowerCase().includes('observa'));
        if (obsProp) {
            properties[obsProp] = {
                rich_text: observacoes && observacoes.trim()
                    ? [{ text: { content: observacoes.trim() } }]
                    : []
            };
        }

        if (email && email.includes('@')) {
            properties['Email'] = { email: email.trim() };
        }

        console.log('Properties a enviar:', JSON.stringify(properties, null, 2));

        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties
        });

        console.log('Marcacao criada!');
        return res.json({ success: true, message: 'Marcacao criada com sucesso!' });

    } catch (error) {
        console.error('=== ERRO ===');
        console.error('Mensagem:', error.message);
        console.error('Body:', JSON.stringify(error.body, null, 2));
        return res.status(500).json({
            success: false,
            message: 'Erro ao processar a marcacao',
            error: error.message,
            detail: error.body || null
        });
    }
});

// ─── LISTAR MARCAÇÕES ─────────────────────────────────────────────────────────
app.get('/api/marcacoes', async (req, res) => {
    try {
        if (!DATABASE_ID) {
            return res.status(500).json({ success: false, message: 'DATABASE_ID não configurado no servidor' });
        }

        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            sorts: [{ property: 'Data Preferida', direction: 'descending' }]
        });

        const marcacoes = response.results.map(page => ({
            id: page.id,
            nome: getPlainTextFromTitle(page.properties['Nome']?.title),
            telefone: page.properties['Telefone']?.phone_number || '',
            email: page.properties['Email']?.email || '',
            data: page.properties['Data Preferida']?.date?.start || '',
            hora: page.properties['Hora Preferida']?.select?.name || '',
        }));

        return res.json({ success: true, marcacoes });

    } catch (error) {
        console.error('Erro listar:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erro ao listar marcacoes',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('Servidor online na porta ' + PORT);
});