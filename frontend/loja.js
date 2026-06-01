let produtosLoja = [];
let pesquisaAtual = '';

function normalizarImagem(src) {
    if (!src || typeof src !== 'string' || !src.trim()) {
        return 'https://via.placeholder.com/700x700/f4f4f4/999999?text=Produto';
    }
    return src;
}

function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function escaparHTML(valor) {
    return String(valor || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function safeJsonFetch(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Resposta inválida do servidor (${res.status}).`);
    }

    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erro no pedido');
    }

    return data;
}

function atualizarInfoPesquisa(totalFiltrado, totalProdutos) {
    const info = document.getElementById('produtoSearchInfo');
    if (!info) return;

    if (!totalProdutos) {
        info.textContent = 'Sem produtos disponíveis.';
        return;
    }

    if (!pesquisaAtual) {
        info.textContent = `${totalProdutos} produto${totalProdutos === 1 ? '' : 's'} disponível${totalProdutos === 1 ? '' : 'eis'}.`;
        return;
    }

    info.textContent = `${totalFiltrado} resultado${totalFiltrado === 1 ? '' : 's'} encontrado${totalFiltrado === 1 ? '' : 's'} para "${pesquisaAtual}".`;
}

function obterProdutosFiltrados() {
    const termo = normalizarTexto(pesquisaAtual);

    if (!termo) return produtosLoja;

    return produtosLoja.filter(produto => {
        const nome = normalizarTexto(produto.nome);
        const descricao = normalizarTexto(produto.descricao);
        const preco = normalizarTexto(Number(produto.preco || 0).toFixed(2));

        return nome.includes(termo) || descricao.includes(termo) || preco.includes(termo);
    });
}

function renderizarProdutos() {
    const grid = document.getElementById('sugestoesGrid');
    if (!grid) return;

    const produtosFiltrados = obterProdutosFiltrados();
    atualizarInfoPesquisa(produtosFiltrados.length, produtosLoja.length);

    if (!produtosLoja.length) {
        grid.innerHTML = `
            <div class="loja-empty-state">
                <p>De momento não existem produtos disponíveis.</p>
            </div>
        `;
        return;
    }

    if (!produtosFiltrados.length) {
        grid.innerHTML = `
            <div class="loja-empty-state">
                <p>Nenhum produto encontrado.</p>
                <small>Tente pesquisar por outro nome, descrição ou preço.</small>
            </div>
        `;
        return;
    }

    grid.innerHTML = produtosFiltrados.map((produto, index) => `
        <article class="produto-card-novo">
            <div class="produto-img-wrap">
                ${index === 0 && !pesquisaAtual ? '<span class="badge-status badge-novidade">Novidade</span>' : ''}
                <img 
                    src="${normalizarImagem(produto.imagem)}" 
                    alt="${escaparHTML(produto.nome || 'Produto')}"
                    loading="lazy"
                >
            </div>

            <div class="produto-info-novo">
                <p class="produto-nome">${escaparHTML(produto.nome || 'Produto sem nome')}</p>
                <p class="produto-descricao-loja">${escaparHTML(produto.descricao || 'Sem descrição disponível.')}</p>

                <div class="produto-preco-wrap">
                    <span class="preco-final">€${Number(produto.preco || 0).toFixed(2)}</span>
                </div>
            </div>
        </article>
    `).join('');
}

async function renderLoja() {
    const grid = document.getElementById('sugestoesGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="loja-empty-state">
            <p>A carregar produtos...</p>
        </div>
    `;

    try {
        const data = await safeJsonFetch(`${API_BASE_URL}/api/produtos`);
        produtosLoja = data.produtos || [];
        renderizarProdutos();
    } catch (err) {
        produtosLoja = [];
        atualizarInfoPesquisa(0, 0);
        grid.innerHTML = `
            <div class="loja-empty-state">
                <p>${escaparHTML(err.message)}</p>
            </div>
        `;
    }
}

function initPesquisaProdutos() {
    const input = document.getElementById('produtoSearch');
    const limparBtn = document.getElementById('limparPesquisaBtn');

    if (!input) return;

    input.addEventListener('input', () => {
        pesquisaAtual = input.value.trim();
        if (limparBtn) limparBtn.classList.toggle('active', Boolean(pesquisaAtual));
        renderizarProdutos();
    });

    if (limparBtn) {
        limparBtn.addEventListener('click', () => {
            input.value = '';
            pesquisaAtual = '';
            limparBtn.classList.remove('active');
            input.focus();
            renderizarProdutos();
        });
    }
}

function initScrollTopButton() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (!scrollBtn) return;

    window.addEventListener('scroll', () => {
        scrollBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initPesquisaProdutos();
    renderLoja();
    initScrollTopButton();
});
