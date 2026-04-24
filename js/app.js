/* ============================================
   COMIDAS RÁPIDAS NE&AN - APP LOGIC
   ============================================ */

// ============================================
// DATA
// ============================================
const PRODUCTS = [
    {
        id: 1,
        name: "Chuzos",
        price: 5000,
        description: "Deliciosos chuzos asados a la parrilla con el sabor tradicional que te encanta.",
        icon: "fa-fire",
        badge: "Más vendido"
    },
    {
        id: 2,
        name: "Chorizos Asados",
        price: 9000,
        description: "Chorizos santarrosanos asados a la perfección, jugosos y llenos de sabor.",
        icon: "fa-drumstick-bite",
        badge: null
    },
    {
        id: 3,
        name: "Choriespecial",
        price: 18000,
        description: "Bollo, carne, pollo, chorizo santarrosano, queso, maíz, papa ripio y salsas. ¡La especialidad de la casa!",
        icon: "fa-star",
        badge: "Especialidad"
    },
    {
        id: 4,
        name: "Choricarne",
        price: 15000,
        description: "Bollo, carne, chorizo, queso, maíz, papa ripio y salsas. Una explosión de sabores.",
        icon: "fa-hamburger",
        badge: null
    },
    {
        id: 5,
        name: "Choripollo",
        price: 15000,
        description: "Bollo, pollo, chorizo, queso, maíz, papa ripio y salsas. La combinación perfecta.",
        icon: "fa-drumstick-bite",
        badge: null
    }
];

const BUSINESS = {
    name: "Comidas Rápidas NE&AN",
    phone: "573177798409",
    whatsappNumber: "3177798409",
    address: "Santander de Quilichao, Cauca",
    delivery: "Gratis"
};

// ============================================
// STATE
// ============================================
let cart = [];
let currentProduct = null;
let currentQuantity = 1;

// ============================================
// UTILITIES
// ============================================
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ============================================
// SPLASH SCREEN
// ============================================
function initSplash() {
    const splash = document.getElementById('splash-screen');
    const app = document.getElementById('app');

    setTimeout(() => {
        splash.classList.add('hidden');
        app.classList.remove('hidden');
    }, 2500);
}

// ============================================
// RENDER MENU
// ============================================
function renderMenu() {
    const grid = document.getElementById('menu-grid');

    grid.innerHTML = PRODUCTS.map(product => `
        <div class="product-card" onclick="openProductModal(${product.id})">
            <div class="product-image">
                <i class="fas ${product.icon}"></i>
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h4 class="product-name">${product.name}</h4>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="btn-add" onclick="event.stopPropagation(); openProductModal(${product.id})">
                        <i class="fas fa-plus"></i>
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// PRODUCT MODAL
// ============================================
function openProductModal(productId) {
    currentProduct = PRODUCTS.find(p => p.id === productId);
    currentQuantity = 1;

    if (!currentProduct) return;

    const modal = document.getElementById('product-modal');
    const modalProduct = document.getElementById('modal-product');

    modalProduct.innerHTML = `
        <div class="modal-product-image">
            <i class="fas ${currentProduct.icon}"></i>
        </div>
        <div class="modal-product-info">
            <h3 class="modal-product-name">${currentProduct.name}</h3>
            <p class="modal-product-description">${currentProduct.description}</p>
            <div class="modal-product-price">${formatPrice(currentProduct.price)}</div>

            <div class="quantity-selector">
                <button class="qty-btn" onclick="changeQuantity(-1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="qty-value" id="modal-qty">1</span>
                <button class="qty-btn" onclick="changeQuantity(1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>

            <button class="btn-add-modal" onclick="addToCartFromModal()">
                <i class="fas fa-shopping-cart"></i>
                Agregar ${formatPrice(currentProduct.price)} al carrito
            </button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function changeQuantity(delta) {
    currentQuantity += delta;
    if (currentQuantity < 1) currentQuantity = 1;
    if (currentQuantity > 20) currentQuantity = 20;

    document.getElementById('modal-qty').textContent = currentQuantity;

    // Update button text with total
    const total = currentProduct.price * currentQuantity;
    const btn = document.querySelector('.btn-add-modal');
    btn.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        Agregar ${formatPrice(total)} al carrito
    `;
}

function addToCartFromModal() {
    if (!currentProduct) return;

    const existingItem = cart.find(item => item.id === currentProduct.id);

    if (existingItem) {
        existingItem.quantity += currentQuantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            icon: currentProduct.icon,
            quantity: currentQuantity
        });
    }

    updateCartBadge();
    closeModal();
    showToast(`${currentQuantity} ${currentProduct.name} agregado${currentQuantity > 1 ? 's' : ''}`);

    currentProduct = null;
    currentQuantity = 1;
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentProduct = null;
    currentQuantity = 1;
}

// ============================================
// CART
// ============================================
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

function showCart() {
    const modal = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <p>Tu carrito está vacío</p>
                <p style="font-size: 0.85rem; margin-top: 8px;">¡Agrega algunos productos deliciosos!</p>
            </div>
        `;
        cartTotal.textContent = formatPrice(0);
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="cart-qty-btn" onclick="updateCartItem(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="cart-qty-value">${item.quantity}</span>
                    <button class="cart-qty-btn" onclick="updateCartItem(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <button class="cart-item-remove" onclick="removeCartItem(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = formatPrice(total);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function updateCartItem(index, delta) {
    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartBadge();
    showCart(); // Re-render
}

function removeCartItem(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    updateCartBadge();
    showCart();
    showToast(`${itemName} eliminado`);
}

// ============================================
// CHECKOUT
// ============================================
function checkout() {
    if (cart.length === 0) {
        showToast('Agrega productos primero');
        return;
    }

    closeCart();

    const modal = document.getElementById('checkout-modal');
    const summaryItems = document.getElementById('order-summary-items');
    const summaryTotal = document.getElementById('order-summary-total');

    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.quantity}x ${item.name}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    summaryTotal.textContent = formatPrice(total);

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function sendOrder(event) {
    event.preventDefault();

    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked').value;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Build WhatsApp message
    let message = `*🍖 NUEVO PEDIDO - ${BUSINESS.name}*\n\n`;
    message += `*👤 Cliente:* ${name}\n`;
    message += `*📱 Teléfono:* ${phone}\n`;
    message += `*📍 Dirección:* ${address}\n\n`;

    message += `*📋 PEDIDO:*\n`;
    cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}\n`;
    });

    message += `\n*💰 Total:* ${formatPrice(total)}\n`;
    message += `*💳 Método de pago:* ${payment}\n`;

    if (notes) {
        message += `\n*📝 Notas:* ${notes}\n`;
    }

    message += `\n¡Gracias por tu pedido! 🙏`;

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${BUSINESS.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    // Clear cart
    cart = [];
    updateCartBadge();
    closeCheckout();
    showToast('¡Pedido enviado por WhatsApp!');

    // Reset form
    document.getElementById('checkout-form').reset();
}

// ============================================
// CLOSE MODALS ON BACKDROP CLICK
// ============================================
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        if (e.target.id === 'product-modal') closeModal();
        if (e.target.id === 'cart-modal') closeCart();
        if (e.target.id === 'checkout-modal') closeCheckout();
    }
});

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        closeCart();
        closeCheckout();
    }
});

// ============================================
// SERVICE WORKER (PWA)
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    renderMenu();
    updateCartBadge();
});
