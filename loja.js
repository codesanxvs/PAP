function getProdutosLoja() {
    const stored = localStorage.getItem('flashProducts');
    if (stored) return JSON.parse(stored);
    return [];
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
        <div class="produto-card-novo">
            <div class="produto-img-wrap">
                ${index === 0 ? '<span class="badge-status badge-novidade">Novidade</span>' : ''}
                <img src="${produto.imagem || 'https://via.placeholder.com/400x400/f0f0f0/999?text=Produto'}" alt="${produto.nome}">
            </div>
            <div class="produto-info-novo">
                <p class="produto-nome">${produto.nome}</p>
                <p class="produto-descricao-loja">${produto.descricao}</p>
                <div class="produto-preco-wrap">
                    <span class="preco-final">€${Number(produto.preco).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function initScrollReveal() {
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    sections.forEach(section => observer.observe(section));
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
    initScrollReveal();
    initScrollTopButton();
});