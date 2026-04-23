function normalizarImagem(src) {
    if (!src || typeof src !== 'string' || !src.trim()) {
        return 'https://via.placeholder.com/700x700/f4f4f4/999999?text=Produto';
    }
    return src;
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
        const produtos = data.produtos || [];

        if (!produtos.length) {
            grid.innerHTML = `
                <div class="loja-empty-state">
                    <p>De momento não existem produtos disponíveis.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = produtos.map((produto, index) => `
            <article class="produto-card-novo">
                <div class="produto-img-wrap">
                    ${index === 0 ? '<span class="badge-status badge-novidade">Novidade</span>' : ''}
                    <img 
                        src="${normalizarImagem(produto.imagem)}" 
                        alt="${produto.nome || 'Produto'}"
                        loading="lazy"
                    >
                </div>

                <div class="produto-info-novo">
                    <p class="produto-nome">${produto.nome || 'Produto sem nome'}</p>
                    <p class="produto-descricao-loja">${produto.descricao || 'Sem descrição disponível.'}</p>

                    <div class="produto-preco-wrap">
                        <span class="preco-final">€${Number(produto.preco || 0).toFixed(2)}</span>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (err) {
        grid.innerHTML = `
            <div class="loja-empty-state">
                <p>${err.message}</p>
            </div>
        `;
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
    renderLoja();
    initScrollTopButton();
});