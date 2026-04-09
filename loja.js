// =================================================================
// LÓGICA DO CARRINHO (loja.js)
// =================================================================

// Variável global para o carrinho
let cart = [];

// Elementos DOM
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalElement = document.getElementById('cartTotal');
const cartBadge = document.getElementById('cartBadge');
const emptyCartMessage = `
    <div class="empty-cart">
        <p>🛍️ Seu carrinho está vazio</p>
    </div>
`;

// --- FUNÇÕES DE PERSISTÊNCIA ---

// Guarda o carrinho no localStorage do navegador
function saveCart() {
    localStorage.setItem('flashCabeleireiroCart', JSON.stringify(cart));
}

// Carrega o carrinho do localStorage ao iniciar a página
function loadCart() {
    const storedCart = localStorage.getItem('flashCabeleireiroCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartDisplay();
}

// --- FUNÇÕES DE INTERFACE DO CARRINHO ---

// Abre e fecha o carrinho lateral
function toggleCart(open = null) {
    // Se 'open' for null, alterna. Se for true/false, define.
    const isOpening = open === true || (open === null && !cartSidebar.classList.contains('active'));
    
    if (isOpening) {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    } else {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    }
}

// Atualiza a lista de itens e o total no carrinho
function updateCartDisplay() {
    cartItemsContainer.innerHTML = ''; // Limpa a lista atual

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = emptyCartMessage;
    } else {
        let total = 0;
        cart.forEach(item => {
            // Garante que o item é um número para cálculo
            const itemPrice = parseFloat(item.price); 
            const itemTotal = itemPrice * item.quantity;
            total += itemTotal;

            const cartItemHTML = `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <span class="cart-item-price">€${itemPrice.toFixed(2)}</span>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button onclick="changeQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        </div>
                        <button class="btn-remove" onclick="removeFromCart(${item.id})">🗑️</button>
                    </div>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        cartTotalElement.textContent = `€${total.toFixed(2)}`;
    }
    
    // Atualizar o badge de contagem no cabeçalho
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
    // Opcional: Mostrar o badge apenas se houver itens
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';

    saveCart(); // Guarda as alterações no armazenamento local
}


// --- FUNÇÕES DE MANIPULAÇÃO DO CARRINHO ---

// Chamada pelos botões 'Adicionar' (no loja.html)
function addToCart(name, price, id) {
    const existingItem = cart.find(item => item.id === id);
    const floatPrice = parseFloat(price); 

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // ID do produto é um número
        cart.push({ id: id, name, price: floatPrice, quantity: 1 }); 
    }

    updateCartDisplay();
    // Mostra uma notificação de sucesso (opcional)
    showNotification(`${name} adicionado ao carrinho!`);
}

// Altera a quantidade de um item específico
function changeQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCartDisplay();
        }
    }
}

// Remove um item do carrinho
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartDisplay();
}

// Função placeholder para o checkout
function checkout() {
    if (cart.length === 0) {
        alert("O seu carrinho está vazio. Adicione produtos antes de finalizar a compra.");
        return;
    }
    
    // NOTA: Aqui seria a integração com o Stripe/PayPal ou Headless E-commerce.
    
    const total = cartTotalElement.textContent;
    const confirmation = confirm(`Confirma a compra no valor total de ${total}? (Implementação de pagamento simulada)`);

    if (confirmation) {
        alert("Compra finalizada com sucesso! O seu pedido será processado.");
        cart = []; // Limpa o carrinho
        updateCartDisplay();
        toggleCart(false); // Fecha o carrinho
    }
}

// --- FUNÇÃO AUXILIAR DE NOTIFICAÇÃO ---

function showNotification(message) {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.classList.add('notification');
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// --- INICIALIZAÇÃO ---

// Carrega o carrinho quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadCart);

// NOTA: A função initShopify() foi removida para focar na lógica do carrinho em JS puro.


// =================================================================
// LÓGICA GERAL (script.js)
// =================================================================

// Variável SIMULADA para o estado de login (seria gerida por um backend real)
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
let user = {
    name: 'Cliente Flash',
    email: 'cliente@flashcabeleireiro.pt',
    isAdmin: false
};

// --- FUNÇÕES DE INICIALIZAÇÃO DA PÁGINA ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o estado de login ao carregar a página
    setLoggedInState(isLoggedIn);
    
    // 2. Adiciona event listeners para fechar dropdowns e menus
    document.addEventListener('click', (e) => {
        // Fechar dropdown do utilizador
        if (!e.target.closest('#userAvatarMenu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        }
        // Fechar menu de navegação em mobile (se for o caso)
        if (!e.target.closest('.icon-placeholder') && !e.target.closest('#menu')) {
             const menu = document.getElementById('menu');
             if (menu && menu.classList.contains('active') && window.innerWidth <= 768) {
                 menu.classList.remove('active');
             }
        }
    });
});


// --- FUNÇÕES DE NAVEGAÇÃO E MENU ---

// Alterna o menu de navegação em dispositivos móveis
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Alterna o dropdown do avatar do utilizador
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}


// --- FUNÇÕES DE AUTENTICAÇÃO ---

// Atualiza a UI com base no estado de login
function setLoggedInState(state) {
    isLoggedIn = state;
    localStorage.setItem('isLoggedIn', state);

    const loginNotice = document.getElementById('loginNotice');
    const userAvatarMenu = document.getElementById('userAvatarMenu');
    const addCartButtons = document.querySelectorAll('.btn-add-cart');

    if (isLoggedIn) {
        // Oculta aviso de login e mostra menu de usuário
        if (loginNotice) loginNotice.style.display = 'none';
        if (userAvatarMenu) userAvatarMenu.style.display = 'flex';
        
        // Ativar os botões 'Adicionar'
        addCartButtons.forEach(button => {
            button.removeAttribute('disabled');
        });

        // Atualizar informações no dropdown
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userInitials').textContent = user.name.charAt(0);
        }
        // Mostrar link Admin se for o caso
        if (document.getElementById('adminLink')) {
            document.getElementById('adminLink').style.display = user.isAdmin ? 'block' : 'none';
        }

    } else {
        // Mostra aviso de login e oculta menu de usuário
        if (loginNotice) loginNotice.style.display = 'flex';
        if (userAvatarMenu) userAvatarMenu.style.display = 'none';
        
        // Desativar os botões 'Adicionar'
        addCartButtons.forEach(button => {
            button.setAttribute('disabled', 'disabled');
        });
    }
}

// Simula o processo de logout
function logout() {
    setLoggedInState(false);
    // Limpar dados do carrinho (opcional, mas recomendado)
    localStorage.removeItem('flashCabeleireiroCart'); 
    
    // Redirecionar para a página inicial ou de login
    window.location.href = 'loja.html'; 
}

// Simula o login (Chamada na página de login.html)
function login(email, password) {
    // Numa implementação real, verificaria as credenciais no servidor.
    // Aqui, apenas simula um login bem-sucedido:
    
    // Redefine dados simulados de usuário (pode vir de um formulário)
    user.email = email;
    user.name = email.split('@')[0].toUpperCase();
    user.isAdmin = email === 'admin@flash.pt';

    setLoggedInState(true);
    
    // Redireciona para a loja após login
    window.location.href = 'loja.html'; 
}

// Garante que estas funções estão disponíveis globalmente
window.toggleMenu = toggleMenu;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.login = login;

