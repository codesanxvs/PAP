function getProdutosLoja() {
    const stored = localStorage.getItem('flashProducts');

    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }

    return [];
}

function normalizarImagem(src) {
    if (!src || typeof src !== 'string' || !src.trim()) {
        return 'https://via.placeholder.com/700x700/f4f4f4/999999?text=Produto';
    }
    return src;
}

function renderLoja() {
    const grid = document.getElementById('sugestoesGrid');
    if (!grid) return;

    const produtos = getProdutosLoja();

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