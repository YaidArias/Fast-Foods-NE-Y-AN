/* ============================================
   COMIDAS RÁPIDAS NE&AN - APP CON FIREBASE
   ============================================ */

// ============================================
// DATA
// ============================================
const PRODUCTS = [
    { id: 1, name: "Chuzos", price: 5000, description: "Deliciosos chuzos asados a la parrilla con el sabor tradicional que te encanta.", icon: "fa-fire", badge: "Más vendido" },
    { id: 2, name: "Chorizos Asados", price: 9000, description: "Chorizos santarrosanos asados a la perfección, jugosos y llenos de sabor.", icon: "fa-drumstick-bite", badge: null },
    { id: 3, name: "Choriespecial", price: 18000, description: "Bollo, carne, pollo, chorizo santarrosano, queso, maíz, papa ripio y salsas. ¡La especialidad de la casa!", icon: "fa-star", badge: "Especialidad" },
    { id: 4, name: "Choricarne", price: 15000, description: "Bollo, carne, chorizo, queso, maíz, papa ripio y salsas. Una explosión de sabores.", icon: "fa-hamburger", badge: null },
    { id: 5, name: "Choripollo", price: 15000, description: "Bollo, pollo, chorizo, queso, maíz, papa ripio y salsas. La combinación perfecta.", icon: "fa-drumstick-bite", badge: null }
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
let currentFilter = 'all';
let ordersUnsubscribe = null;
let myOrdersUnsubscribe = null;

// ============================================
// UTILITIES
// ============================================
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
}

function generateOrderId() {
    return 'NEAN-' + Date.now().toString(36).toUpperCase();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
                        <i class="fas fa-plus"></i> Agregar
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
                <button class="qty-btn" onclick="changeQuantity(-1)"><i class="fas fa-minus"></i></button>
                <span class="qty-value" id="modal-qty">1</span>
                <button class="qty-btn" onclick="changeQuantity(1)"><i class="fas fa-plus"></i></button>
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
    const total = currentProduct.price * currentQuantity;
    document.querySelector('.btn-add-modal').innerHTML = `
        <i class="fas fa-shopping-cart"></i> Agregar ${formatPrice(total)} al carrito
    `;
}

function addToCartFromModal() {
    if (!currentProduct) return;
    const existingItem = cart.find(item => item.id === currentProduct.id);
    if (existingItem) {
        existingItem.quantity += currentQuantity;
    } else {
        cart.push({ id: currentProduct.id, name: currentProduct.name, price: currentProduct.price, icon: currentProduct.icon, quantity: currentQuantity });
    }
    updateCartBadge();
    closeModal();
    showToast(`${currentQuantity} ${currentProduct.name} agregado${currentQuantity > 1 ? 's' : ''}`);
    currentProduct = null;
    currentQuantity = 1;
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('active');
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
                <div class="cart-item-image"><i class="fas ${item.icon}"></i></div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="cart-qty-btn" onclick="updateCartItem(${index}, -1)"><i class="fas fa-minus"></i></button>
                    <span class="cart-qty-value">${item.quantity}</span>
                    <button class="cart-qty-btn" onclick="updateCartItem(${index}, 1)"><i class="fas fa-plus"></i></button>
                </div>
                <button class="cart-item-remove" onclick="removeCartItem(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('');
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = formatPrice(total);
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cart-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function updateCartItem(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    updateCartBadge();
    showCart();
}

function removeCartItem(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    updateCartBadge();
    showCart();
    showToast(`${itemName} eliminado`);
}

// ============================================
// CHECKOUT & SEND ORDER
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
    document.getElementById('checkout-modal').classList.remove('active');
    document.body.style.overflow = '';
}

async function sendOrder(event) {
    event.preventDefault();
    
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked').value;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderId = generateOrderId();
    
    const orderData = {
        orderId: orderId,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        notes: notes,
        paymentMethod: payment,
        items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total: total,
        status: 'nuevo',
        createdAt: new Date(),
        notified: false
    };
    
    try {
        const ordersRef = window.firebaseCollection(window.db, 'orders');
        await window.firebaseAddDoc(ordersRef, orderData);
        
        // Notificación ntfy
        await sendNtfyNotification(orderData);
        
        // Guardar en localStorage
        let myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
        myOrders.push(orderId);
        localStorage.setItem('myOrders', JSON.stringify(myOrders));
        
        closeCheckout();
        showSuccessModal(orderId);
        
        cart = [];
        updateCartBadge();
        document.getElementById('checkout-form').reset();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al enviar pedido. Intenta de nuevo.');
    }
}

async function sendNtfyNotification(orderData) {
    const ntfyTopic = 'nean-pedidos-sq-2026';
    
    const message = 
        `🔔 NUEVO PEDIDO NE&AN\n` +
        `📋 Orden: ${orderData.orderId}\n` +
        `👤 Cliente: ${orderData.customerName}\n` +
        `📱 Tel: ${orderData.customerPhone}\n` +
        `📍 Dir: ${orderData.customerAddress}\n` +
        `💳 Pago: ${orderData.paymentMethod}\n\n` +
        `🛒 PRODUCTOS:\n` +
        orderData.items.map(i => `• ${i.quantity}x ${i.name} - $${i.price.toLocaleString('es-CO')}`).join('\n') +
        `\n\n💰 TOTAL: $${orderData.total.toLocaleString('es-CO')}\n` +
        `${orderData.notes ? '📝 Notas: ' + orderData.notes + '\n' : ''}`;
    
    try {
        // Método 1: fetch normal
        const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
            method: 'POST',
            body: message,
            headers: {
                'Title': '🔔 Nuevo Pedido NE&AN',
                'Priority': 'high',
                'Tags': 'shopping_cart,fire'
            }
        });
        
        if (response.ok) {
            console.log('✅ Notificación ntfy enviada por fetch');
            return;
        }
    } catch (e) {
        console.log('❌ Fetch falló, intentando método alternativo:', e);
    }
    
    // Método 2: Usar iframe oculto (evita CORS)
    try {
        const encodedMessage = encodeURIComponent(message);
        const url = `https://ntfy.sh/${ntfyTopic}?message=${encodedMessage}&priority=high&title=${encodeURIComponent('🔔 Nuevo Pedido NE&AN')}`;
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 2000);
        
        console.log('✅ Notificación ntfy enviada por iframe');
    } catch (e2) {
        console.log('❌ Ambos métodos fallaron:', e2);
    }
}

function showSuccessModal(orderId) {
    const modal = document.getElementById('success-modal');
    document.getElementById('success-order-id').textContent = `Pedido: ${orderId}`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSuccess() {
    document.getElementById('success-modal').classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// MY ORDERS
// ============================================
function showMyOrders() {
    const modal = document.getElementById('my-orders-modal');
    const ordersList = document.getElementById('orders-list');
    
    ordersList.innerHTML = `
        <div class="orders-empty">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando pedidos...</p>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadMyOrders();
}

function closeMyOrders() {
    document.getElementById('my-orders-modal').classList.remove('active');
    document.body.style.overflow = '';
    if (myOrdersUnsubscribe) {
        myOrdersUnsubscribe();
        myOrdersUnsubscribe = null;
    }
}

function loadMyOrders() {
    const myOrderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
    const ordersList = document.getElementById('orders-list');
    
    if (myOrderIds.length === 0) {
        ordersList.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-receipt"></i>
                <p>No tienes pedidos aún</p>
            </div>
        `;
        return;
    }
    
    const ordersRef = window.firebaseCollection(window.db, 'orders');
    const q = window.firebaseQuery(ordersRef, window.firebaseOrderBy('createdAt', 'desc'));
    
    myOrdersUnsubscribe = window.firebaseOnSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (myOrderIds.includes(data.orderId)) {
                orders.push({ id: doc.id, ...data });
            }
        });
        
        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="orders-empty">
                    <i class="fas fa-receipt"></i>
                    <p>No tienes pedidos aún</p>
                </div>
            `;
            return;
        }
        
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">${order.orderId}</span>
                    <span class="order-status status-${order.status}">${getStatusLabel(order.status)}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
                <div class="order-total">${formatPrice(order.total)}</div>
                <div class="order-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(order.createdAt)}</span>
                    <span><i class="fas fa-credit-card"></i> ${order.paymentMethod}</span>
                </div>
            </div>
        `).join('');
    });
}

function getStatusLabel(status) {
    const labels = { nuevo: 'Nuevo', preparando: 'En Preparación', listo: 'Listo', entregado: 'Entregado' };
    return labels[status] || status;
}

// ============================================
// ADMIN PANEL
// ============================================
function showAdminLogin() {
    document.getElementById('admin-login-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').classList.remove('active');
    document.body.style.overflow = '';
}

async function adminLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        await window.firebaseSignIn(window.auth, email, password);
        closeAdminLogin();
        showAdminPanel();
    } catch (error) {
        showToast('Credenciales incorrectas');
    }
}

function showAdminPanel() {
    document.getElementById('admin-panel-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    loadAdminOrders();
}

function closeAdminPanel() {
    document.getElementById('admin-panel-modal').classList.remove('active');
    document.body.style.overflow = '';
    if (ordersUnsubscribe) {
        ordersUnsubscribe();
        ordersUnsubscribe = null;
    }
}

function loadAdminOrders() {
    const adminOrders = document.getElementById('admin-orders');
    adminOrders.innerHTML = `
        <div class="orders-empty">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando pedidos...</p>
        </div>
    `;
    
    const ordersRef = window.firebaseCollection(window.db, 'orders');
    const q = window.firebaseQuery(ordersRef, window.firebaseOrderBy('createdAt', 'desc'));
    
    ordersUnsubscribe = window.firebaseOnSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        renderAdminOrders(orders);
    });
}

function renderAdminOrders(orders) {
    const adminOrders = document.getElementById('admin-orders');
    
    const filteredOrders = currentFilter === 'all' 
        ? orders 
        : orders.filter(o => o.status === currentFilter);
    
    if (filteredOrders.length === 0) {
        adminOrders.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-inbox"></i>
                <p>No hay pedidos ${currentFilter !== 'all' ? 'en este estado' : ''}</p>
            </div>
        `;
        return;
    }
    
    adminOrders.innerHTML = filteredOrders.map(order => `
        <div class="admin-order-card">
            <div class="admin-order-header">
                <div class="admin-order-info">
                    <h4>${order.orderId}</h4>
                    <p><i class="fas fa-user"></i> ${order.customerName} | <i class="fas fa-phone"></i> ${order.customerPhone}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${order.customerAddress}</p>
                    ${order.notes ? `<p><i class="fas fa-sticky-note"></i> ${order.notes}</p>` : ''}
                </div>
                <div class="admin-order-actions">
                    <span class="order-status status-${order.status}">${getStatusLabel(order.status)}</span>
                </div>
            </div>
            <div class="admin-order-items">
                ${order.items.map(i => `• ${i.quantity}x ${i.name} ($${i.price.toLocaleString('es-CO')})`).join('<br>')}
            </div>
            <div class="admin-order-footer">
                <span class="admin-order-total">${formatPrice(order.total)}</span>
                <span class="admin-order-payment"><i class="fas fa-credit-card"></i> ${order.paymentMethod}</span>
                <span style="font-size:0.8rem;color:var(--gray-600)">${formatDate(order.createdAt)}</span>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                ${order.status !== 'nuevo' ? `<button class="btn-status btn-status-nuevo" onclick="updateOrderStatus('${order.id}', 'nuevo')">Nuevo</button>` : ''}
                ${order.status !== 'preparando' ? `<button class="btn-status btn-status-preparando" onclick="updateOrderStatus('${order.id}', 'preparando')">Preparando</button>` : ''}
                ${order.status !== 'listo' ? `<button class="btn-status btn-status-listo" onclick="updateOrderStatus('${order.id}', 'listo')">Listo</button>` : ''}
                ${order.status !== 'entregado' ? `<button class="btn-status btn-status-entregado" onclick="updateOrderStatus('${order.id}', 'entregado')">Entregado</button>` : ''}
                <button class="btn-status btn-delete" onclick="deleteOrder('${order.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function filterOrders(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    loadAdminOrders();
}

async function updateOrderStatus(orderId, status) {
    try {
        const orderRef = window.firebaseDoc(window.db, 'orders', orderId);
        await window.firebaseUpdateDoc(orderRef, { status: status });
        showToast(`Pedido marcado como: ${getStatusLabel(status)}`);
    } catch (error) {
        showToast('Error al actualizar estado');
    }
}

async function deleteOrder(orderId) {
    if (!confirm('¿Eliminar este pedido?')) return;
    try {
        const orderRef = window.firebaseDoc(window.db, 'orders', orderId);
        await window.firebaseDeleteDoc(orderRef);
        showToast('Pedido eliminado');
    } catch (error) {
        showToast('Error al eliminar');
    }
}

function refreshOrders() {
    loadAdminOrders();
    showToast('Pedidos actualizados');
}

// ============================================
// AUTH STATE
// ============================================
window.firebaseOnAuthStateChanged(window.auth, (user) => {
    const adminAccess = document.getElementById('admin-access');
    if (adminAccess) {
        adminAccess.style.display = 'block';
    }
});

// ============================================
// CLOSE MODALS
// ============================================
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        if (e.target.id === 'product-modal') closeModal();
        if (e.target.id === 'cart-modal') closeCart();
        if (e.target.id === 'checkout-modal') closeCheckout();
        if (e.target.id === 'success-modal') closeSuccess();
        if (e.target.id === 'my-orders-modal') closeMyOrders();
        if (e.target.id === 'admin-login-modal') closeAdminLogin();
        if (e.target.id === 'admin-panel-modal') closeAdminPanel();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal(); closeCart(); closeCheckout(); closeSuccess(); 
        closeMyOrders(); closeAdminLogin(); closeAdminPanel();
    }
});

// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW failed', err));
    });
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE (requerido por type="module")
// ============================================
window.openProductModal = openProductModal;
window.closeModal = closeModal;
window.changeQuantity = changeQuantity;
window.addToCartFromModal = addToCartFromModal;
window.showCart = showCart;
window.closeCart = closeCart;
window.updateCartItem = updateCartItem;
window.removeCartItem = removeCartItem;
window.checkout = checkout;
window.closeCheckout = closeCheckout;
window.sendOrder = sendOrder;
window.closeSuccess = closeSuccess;
window.showMyOrders = showMyOrders;
window.closeMyOrders = closeMyOrders;
window.showAdminLogin = showAdminLogin;
window.closeAdminLogin = closeAdminLogin;
window.adminLogin = adminLogin;
window.closeAdminPanel = closeAdminPanel;
window.refreshOrders = refreshOrders;
window.filterOrders = filterOrders;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    renderMenu();
    updateCartBadge();
});