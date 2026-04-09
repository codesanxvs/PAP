// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all sections for animation
document.querySelectorAll('.section').forEach(section => {
    observer.observe(section);
});

// Mobile menu toggle function
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'flex';
        menu.style.flexDirection = 'column';
        menu.style.position = 'absolute';
        menu.style.top = '100%';
        menu.style.left = '0';
        menu.style.width = '100%';
        menu.style.background = 'white';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.padding = '20px';
        menu.style.zIndex = '1000';
    } else {
        menu.style.display = '';
        menu.style.position = '';
        menu.style.background = '';
        menu.style.boxShadow = '';
        menu.style.padding = '';
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu');
    const icon = document.querySelector('.icon-placeholder');
    
    if (!menu || !icon) return;
    
    if (!menu.contains(event.target) && !icon.contains(event.target)) {
        if (window.innerWidth <= 768) {
            menu.style.display = '';
            menu.style.position = '';
            menu.style.background = '';
            menu.style.boxShadow = '';
            menu.style.padding = '';
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    
    if (window.innerWidth > 768) {
        menu.style.display = '';
        menu.style.position = '';
        menu.style.background = '';
        menu.style.boxShadow = '';
        menu.style.padding = '';
    }
});

// Add active class to current navigation item
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.menu a[href^="#"]');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 220;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = '#c89238';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = '#bd8a30';
            link.style.fontWeight = 'bold';
        }
    });
});

// Service cards hover effect enhancement
const serviceCards = document.querySelectorAll('.service-card');
serviceCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.borderLeft = '4px solid #d4af37';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.borderLeft = 'none';
    });
});

// Initialize page animations
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.service-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    setTimeout(() => {
        if (document.body) {
            document.body.classList.add('loaded');
        }
    }, 100);

    // Initialize IntersectionObserver for .anim elements (if any)
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.anim').forEach(section => {
        animObserver.observe(section);
    });
});


// ========== SISTEMA DE CARRINHO - FLASH CABELEIREIRO ==========

// Array para armazenar itens do carrinho
let cart = [];

// ========== VERIFICAR LOGIN E HABILITAR BOTÕES ==========
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadCartFromStorage();
    updateCartUI();
});

function checkLoginStatus() {
    try {
        const userJson = localStorage.getItem('flashUser');
        const user = userJson ? JSON.parse(userJson) : null;
        
        const loginNotice = document.getElementById('loginNotice');
        const addButtons = document.querySelectorAll('.btn-add-cart');
        
        if (user) {
            // Usuário logado - habilitar botões
            if (loginNotice) loginNotice.style.display = 'none';
            
            addButtons.forEach(function(btn) {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
        } else {
            // Usuário não logado - desabilitar botões
            if (loginNotice) loginNotice.style.display = 'block';
            
            addButtons.forEach(function(btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Faça login para adicionar ao carrinho';
            });
        }
    } catch (error) {
        console.error('Erro ao verificar login:', error);
    }
}

// ========== ADICIONAR AO CARRINHO ==========
function addToCart(name, price, id) {
    try {
        // Verificar se está logado
        const userJson = localStorage.getItem('flashUser');
        if (!userJson) {
            alert('❌ Você precisa fazer login para adicionar produtos ao carrinho!');
            window.location.href = 'login.html';
            return;
        }

        // Verificar se produto já está no carrinho
        const existingItem = cart.find(function(item) {
            return item.id === id;
        });

        if (existingItem) {
            // Aumentar quantidade
            existingItem.quantity += 1;
            showNotification('✅ Quantidade atualizada!');
        } else {
            // Adicionar novo produto
            cart.push({
                id: id,
                name: name,
                price: price,
                quantity: 1
            });
            showNotification('✅ Produto adicionado ao carrinho!');
        }

        // Salvar carrinho e atualizar UI
        saveCartToStorage();
        updateCartUI();
        
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        alert('❌ Erro ao adicionar produto. Tente novamente.');
    }
}

// ========== REMOVER DO CARRINHO ==========
function removeFromCart(id) {
    try {
        cart = cart.filter(function(item) {
            return item.id !== id;
        });
        
        saveCartToStorage();
        updateCartUI();
        showNotification('🗑️ Produto removido do carrinho');
    } catch (error) {
        console.error('Erro ao remover do carrinho:', error);
    }
}

// ========== ATUALIZAR QUANTIDADE ==========
function updateQuantity(id, change) {
    try {
        const item = cart.find(function(item) {
            return item.id === id;
        });
        
        if (item) {
            item.quantity += change;
            
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                saveCartToStorage();
                updateCartUI();
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
    }
}

// ========== ATUALIZAR UI DO CARRINHO ==========
function updateCartUI() {
    try {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartBadge = document.getElementById('cartBadge');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItemsContainer) return;
        
        // Calcular total de itens
        const totalItems = cart.reduce(function(sum, item) {
            return sum + item.quantity;
        }, 0);
        
        // Calcular total em dinheiro
        const totalPrice = cart.reduce(function(sum, item) {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Atualizar badge
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        // Atualizar total
        if (cartTotal) {
            cartTotal.textContent = '€' + totalPrice.toFixed(2);
        }
        
        // Atualizar lista de produtos
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart"><p>🛍️ Seu carrinho está vazio</p></div>';
        } else {
            let html = '';
            cart.forEach(function(item) {
                html += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p class="cart-item-price">€${item.price.toFixed(2)}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-control">
                                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                            </div>
                            <button class="btn-remove" onclick="removeFromCart(${item.id})">🗑️</button>
                        </div>
                    </div>
                `;
            });
            cartItemsContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Erro ao atualizar UI do carrinho:', error);
    }
}

// ========== TOGGLE CARRINHO ==========
function toggleCart() {
    try {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        if (sidebar && overlay) {
            const isOpen = sidebar.classList.contains('active');
            
            if (isOpen) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                sidebar.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    } catch (error) {
        console.error('Erro ao abrir/fechar carrinho:', error);
    }
}

// ========== FINALIZAR COMPRA ==========
function checkout() {
    try {
        if (cart.length === 0) {
            alert('🛒 Seu carrinho está vazio!');
            return;
        }
        
        const user = JSON.parse(localStorage.getItem('flashUser'));
        
        if (!user) {
            alert('❌ Você precisa estar logado para finalizar a compra!');
            window.location.href = 'login.html';
            return;
        }
        
        // Calcular total
        const total = cart.reduce(function(sum, item) {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Criar resumo da compra
        let resumo = '🛍️ RESUMO DA COMPRA\n\n';
        resumo += '📦 Produtos:\n';
        cart.forEach(function(item) {
            resumo += `• ${item.name} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}\n`;
        });
        resumo += `\n💰 TOTAL: €${total.toFixed(2)}\n\n`;
        resumo += '✅ Confirmar compra?';
        
        if (confirm(resumo)) {
            // Aqui você integraria com Shopify, PayPal, etc.
            // Por enquanto, apenas simular compra bem-sucedida
            
            alert(`✅ Compra realizada com sucesso!\n\n🎉 Obrigado pela sua compra, ${user.name}!\n\n📧 Você receberá um email de confirmação em breve.\n💳 Total pago: €${total.toFixed(2)}`);
            
            // Limpar carrinho
            cart = [];
            saveCartToStorage();
            updateCartUI();
            toggleCart();
            
            // Em produção, redirecionar para página de sucesso
            // window.location.href = 'obrigado.html';
        }
    } catch (error) {
        console.error('Erro ao finalizar compra:', error);
        alert('❌ Erro ao processar compra. Tente novamente.');
    }
}

// ========== SALVAR CARRINHO NO LOCALSTORAGE ==========
function saveCartToStorage() {
    try {
        localStorage.setItem('flashCart', JSON.stringify(cart));
    } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
    }
}

// ========== CARREGAR CARRINHO DO LOCALSTORAGE ==========
function loadCartFromStorage() {
    try {
        const cartJson = localStorage.getItem('flashCart');
        if (cartJson) {
            cart = JSON.parse(cartJson);
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        cart = [];
    }
}

// ========== MOSTRAR NOTIFICAÇÃO ==========
function showNotification(message) {
    try {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Mostrar notificação
        setTimeout(function() {
            notification.classList.add('show');
        }, 100);
        
        // Remover após 3 segundos
        setTimeout(function() {
            notification.classList.remove('show');
            setTimeout(function() {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    } catch (error) {
        console.error('Erro ao mostrar notificação:', error);
    }
}

// ========== INTEGRAÇÃO SHOPIFY (OPCIONAL) ==========
// Descomente e configure se quiser usar Shopify real

/*
function initShopify() {
    if (typeof ShopifyBuy !== 'undefined') {
        var client = ShopifyBuy.buildClient({
            domain: 'SEU_DOMINIO.myshopify.com',
            storefrontAccessToken: 'SUA_TOKEN_AQUI'
        });
        
        ShopifyBuy.UI.onReady(client).then(function (ui) {
            // Criar botões de compra para cada produto
            ui.createComponent('collection', {
                id: 'ID_DA_COLECAO',
                node: document.getElementById('produtosGrid'),
                moneyFormat: '€{{amount}}',
                options: {
                    product: {
                        styles: {
                            button: {
                                'background-color': '#c89238',
                                ':hover': {
                                    'background-color': '#bd8a30'
                                }
                            }
                        },
                        text: {
                            button: 'Adicionar ao Carrinho'
                        }
                    },
                    cart: {
                        text: {
                            title: 'Carrinho',
                            empty: 'Seu carrinho está vazio',
                            button: 'Finalizar Compra',
                            total: 'Total',
                            notice: 'Envio calculado no checkout.'
                        }
                    }
                }
            });
        });
    }
}

// Chamar quando página carregar
document.addEventListener('DOMContentLoaded', initShopify);
*/

console.log('🛍️ Sistema de Carrinho Ativo - Flash Cabeleireiro');

