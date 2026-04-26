/* ============================================
   COMIDAS RÁPIDAS NE&AN - APP CON FIREBASE
   ============================================ */

// Productos por defecto (se sobreescriben con los de Firestore)
const PRODUCTS_DEFAULT = [
    { id: 'p1', nombre: "Chuzos",          precio: 5000,  descripcion: "Deliciosos chuzos asados a la parrilla con el sabor tradicional que te encanta.", icon: "fa-fire",         badge: "Más vendido" },
    { id: 'p2', nombre: "Chorizos Asados", precio: 9000,  descripcion: "Chorizos santarrosanos asados a la perfección, jugosos y llenos de sabor.",       icon: "fa-drumstick-bite", badge: null },
    { id: 'p3', nombre: "Choriespecial",   precio: 18000, descripcion: "Bollo, carne, pollo, chorizo santarrosano, queso, maíz, papa ripio y salsas.",     icon: "fa-star",          badge: "Especialidad" },
    { id: 'p4', nombre: "Choricarne",      precio: 15000, descripcion: "Bollo, carne, chorizo, queso, maíz, papa ripio y salsas.",                         icon: "fa-hamburger",     badge: null },
    { id: 'p5', nombre: "Choripollo",      precio: 15000, descripcion: "Bollo, pollo, chorizo, queso, maíz, papa ripio y salsas.",                         icon: "fa-drumstick-bite", badge: null }
];

// Info por defecto del negocio
const NEGOCIO_DEFAULT = {
    nombre:     "Comidas Rápidas NE&AN",
    ubicacion:  "La Aurora, Cesar",
    tel1:       "3156848558",
    tel2:       "3226144727",
    dias:       "Viernes - Sábados y Domingo",
    horario:    "05:00 PM - 11:00 PM",
    bienvenida: "¡Bienvenido! Pide tu comida favorita y te la llevamos gratis a tu casa 🛵",
    domicilio:  "Domicilio Gratis"
};

let PRODUCTS = [];
let NEGOCIO  = { ...NEGOCIO_DEFAULT };

// ============================================
// STATE
// ============================================
let cart = [];
let currentProduct  = null;
let currentQuantity = 1;
let currentFilter   = 'all';
let ordersUnsubscribe    = null;
let myOrdersUnsubscribe  = null;

// ============================================
// UTILITIES
// ============================================
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(price);
}

function generateOrderId() {
    return 'NEAN-' + Date.now().toString(36).toUpperCase();
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ============================================
// CARGAR DATOS DESDE FIRESTORE
// ============================================
async function loadFirestoreData() {
    // 1. Cargar info del negocio
    try {
        const snap = await window.firebaseGetDocs(
            window.firebaseQuery(window.firebaseCollection(window.db, 'config'))
        );
        snap.forEach(d => {
            if (d.id === 'negocio') NEGOCIO = { ...NEGOCIO_DEFAULT, ...d.data() };
        });
        applyNegocioToUI();
    } catch (e) { console.log('Usando info negocio por defecto'); }

    // 2. Cargar productos desde Firestore
    try {
        const snap = await window.firebaseGetDocs(
            window.firebaseCollection(window.db, 'productos')
        );
        const prods = [];
        snap.forEach(d => {
            const p = d.data();
            if (p.activo !== false) prods.push({ id: d.id, ...p });
        });

        if (prods.length > 0) {
            // Ordenar por campo 'orden'
            prods.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            PRODUCTS = prods;
        } else {
            // Si no hay productos en Firestore, usar los por defecto
            PRODUCTS = PRODUCTS_DEFAULT;
        }
    } catch (e) {
        console.log('Usando productos por defecto');
        PRODUCTS = PRODUCTS_DEFAULT;
    }

    renderMenu();
}

function applyNegocioToUI() {
    // Actualizar hero
    const heroP = document.querySelector('.hero-content p');
    if (heroP) heroP.textContent = NEGOCIO.bienvenida;

    // Actualizar badge domicilio
    const heroBadge = document.querySelector('.hero-badge span');
    if (heroBadge) heroBadge.textContent = NEGOCIO.domicilio;

    // Actualizar info cards
    const infoCards = document.querySelectorAll('.info-card');
    if (infoCards.length >= 3) {
        // Horario
        const horarioPs = infoCards[0].querySelectorAll('p');
        if (horarioPs[0]) horarioPs[0].textContent = NEGOCIO.dias;
        if (horarioPs[1]) horarioPs[1].textContent = NEGOCIO.horario;
        // Ubicación
        const ubicP = infoCards[1].querySelector('p');
        if (ubicP) ubicP.textContent = NEGOCIO.ubicacion;
        // Teléfono
        const telP = infoCards[2].querySelector('p');
        if (telP) telP.textContent = `${NEGOCIO.tel1}${NEGOCIO.tel2 ? ' - ' + NEGOCIO.tel2 : ''}`;
    }
}

// ============================================
// SPLASH SCREEN
// ============================================
function initSplash() {
    const splash = document.getElementById('splash-screen');
    const app    = document.getElementById('app');
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
    if (!PRODUCTS.length) {
        grid.innerHTML = `<div style="text-align:center;padding:40px;color:#999"><i class="fas fa-spinner fa-spin" style="font-size:2rem"></i><p style="margin-top:12px">Cargando menú...</p></div>`;
        return;
    }
    grid.innerHTML = PRODUCTS.map(product => `
        <div class="product-card" onclick="openProductModal('${product.id}')">
            <div class="product-image" style="${product.imagen ? `background-image:url('${product.imagen}');background-size:cover;background-position:center` : ''}">
                ${!product.imagen ? `<i class="fas ${product.icon || 'fa-hamburger'}"></i>` : ''}
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h4 class="product-name">${product.nombre || product.name}</h4>
                <p class="product-description">${product.descripcion || product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${formatPrice(product.precio || product.price)}</span>
                    <button class="btn-add" onclick="event.stopPropagation(); openProductModal('${product.id}')">
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
    currentProduct  = PRODUCTS.find(p => p.id === productId || p.id === String(productId));
    currentQuantity = 1;
    if (!currentProduct) return;

    const precio = currentProduct.precio || currentProduct.price;
    const nombre = currentProduct.nombre || currentProduct.name;
    const desc   = currentProduct.descripcion || currentProduct.description;
    const icon   = currentProduct.icon || 'fa-hamburger';
    const img    = currentProduct.imagen || null;
    const badge  = currentProduct.badge  || null;

    const modal = document.getElementById('product-modal');
    // Mostrar foto grande si el producto tiene imagen
    const imgHTML = img
        ? '<div class="modal-product-image-full"><img src="' + img + '" alt="' + nombre + '" class="modal-product-img-full">' + (badge ? '<span class="modal-product-badge">' + badge + '</span>' : '') + '</div>'
        : '<div class="modal-product-image"><i class="fas ' + icon + '"></i>' + (badge ? '<span class="product-badge">' + badge + '</span>' : '') + '</div>';

    document.getElementById('modal-product').innerHTML =
        imgHTML +
        '<div class="modal-product-info">' +
        '<h3 class="modal-product-name">' + nombre + '</h3>' +
        '<p class="modal-product-description">' + desc + '</p>' +
        '<div class="modal-product-price">' + formatPrice(precio) + '</div>' +
        '<div class="quantity-selector">' +
        '<button class="qty-btn" onclick="changeQuantity(-1)"><i class="fas fa-minus"></i></button>' +
        '<span class="qty-value" id="modal-qty">1</span>' +
        '<button class="qty-btn" onclick="changeQuantity(1)"><i class="fas fa-plus"></i></button>' +
        '</div>' +
        '<button class="btn-add-modal" onclick="addToCartFromModal()">' +
        '<i class="fas fa-shopping-cart"></i> Agregar ' + formatPrice(precio) + ' al carrito' +
        '</button></div>';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function changeQuantity(delta) {
    currentQuantity = Math.max(1, Math.min(20, currentQuantity + delta));
    document.getElementById('modal-qty').textContent = currentQuantity;
    const precio = currentProduct.precio || currentProduct.price;
    document.querySelector('.btn-add-modal').innerHTML = `
        <i class="fas fa-shopping-cart"></i> Agregar ${formatPrice(precio * currentQuantity)} al carrito
    `;
}

function addToCartFromModal() {
    if (!currentProduct) return;
    const nombre = currentProduct.nombre || currentProduct.name;
    const precio = currentProduct.precio || currentProduct.price;
    const icon   = currentProduct.icon   || 'fa-hamburger';
    const existing = cart.find(item => item.id === currentProduct.id);
    if (existing) {
        existing.quantity += currentQuantity;
    } else {
        cart.push({ id: currentProduct.id, name: nombre, price: precio, icon, quantity: currentQuantity });
    }
    updateCartBadge();
    closeModal();
    showToast(`${currentQuantity} ${nombre} agregado${currentQuantity > 1 ? 's' : ''}`);
    currentProduct  = null;
    currentQuantity = 1;
}

function closeModal() {
    document.getElementById('product-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentProduct  = null;
    currentQuantity = 1;
}

// ============================================
// CART
// ============================================
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const total = cart.reduce((s, i) => s + i.quantity, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
}

function showCart() {
    const modal     = document.getElementById('cart-modal');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <p>Tu carrito está vacío</p>
                <p style="font-size:0.85rem;margin-top:8px">¡Agrega algunos productos deliciosos!</p>
            </div>`;
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
                    <button class="cart-qty-btn" onclick="updateCartItem(${index},-1)"><i class="fas fa-minus"></i></button>
                    <span class="cart-qty-value">${item.quantity}</span>
                    <button class="cart-qty-btn" onclick="updateCartItem(${index},1)"><i class="fas fa-plus"></i></button>
                </div>
                <button class="cart-item-remove" onclick="removeCartItem(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `).join('');
        cartTotal.textContent = formatPrice(cart.reduce((s, i) => s + i.price * i.quantity, 0));
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
    const name = cart[index].name;
    cart.splice(index, 1);
    updateCartBadge();
    showCart();
    showToast(`${name} eliminado`);
}

// ============================================
// CHECKOUT & SEND ORDER
// ============================================
function checkout() {
    if (cart.length === 0) { showToast('Agrega productos primero'); return; }
    closeCart();
    const summaryItems = document.getElementById('order-summary-items');
    const summaryTotal = document.getElementById('order-summary-total');
    summaryItems.innerHTML = cart.map(i => `
        <div class="summary-item">
            <span>${i.quantity}x ${i.name}</span>
            <span>${formatPrice(i.price * i.quantity)}</span>
        </div>`).join('');
    summaryTotal.textContent = formatPrice(cart.reduce((s, i) => s + i.price * i.quantity, 0));
    document.getElementById('checkout-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    document.getElementById('checkout-modal').classList.remove('active');
    document.body.style.overflow = '';
}

async function sendOrder(event) {
    event.preventDefault();
    const name    = document.getElementById('customer-name').value.trim();
    const phone   = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const notes   = document.getElementById('customer-notes').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const total   = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderId = generateOrderId();

    const orderData = {
        orderId, customerName: name, customerPhone: phone,
        customerAddress: address, notes, paymentMethod: payment,
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total, status: 'nuevo', createdAt: new Date()
    };

    try {
        await window.firebaseAddDoc(window.firebaseCollection(window.db, 'orders'), orderData);
        sendNtfyNotification(orderData);
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

// ============================================
// NTFY NOTIFICACIÓN
// ============================================
function sendNtfyNotification(orderData) {
    const ntfyTopic = 'nean-pedidos-sq-2026';
    const itemsTexto = orderData.items.map(i => `- ${i.quantity}x ${i.name} ($${i.price.toLocaleString('es-CO')})`).join('\n');
    const mensaje =
        `NUEVO PEDIDO NE&AN\n` +
        `Orden: ${orderData.orderId}\n` +
        `Cliente: ${orderData.customerName}\n` +
        `Tel: ${orderData.customerPhone}\n` +
        `Direccion: ${orderData.customerAddress}\n` +
        `Pago: ${orderData.paymentMethod}\n\n` +
        `PRODUCTOS:\n${itemsTexto}\n\n` +
        `TOTAL: $${orderData.total.toLocaleString('es-CO')}` +
        (orderData.notes ? `\nNotas: ${orderData.notes}` : '');

    fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        headers: { 'Content-Type':'text/plain', 'Title':'Nuevo Pedido NE&AN', 'Priority':'high', 'Tags':'shopping_cart,fire,bell' },
        body: mensaje
    })
    .then(res => console.log(res.ok ? 'Notificacion ntfy enviada correctamente' : 'ntfy error: ' + res.status))
    .catch(err => console.log('Error ntfy:', err.message));
}

function showSuccessModal(orderId) {
    document.getElementById('success-order-id').textContent = 'Pedido: ' + orderId;
    document.getElementById('success-modal').classList.add('active');
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
    document.getElementById('orders-list').innerHTML = `<div class="orders-empty"><i class="fas fa-spinner fa-spin"></i><p>Cargando pedidos...</p></div>`;
    document.getElementById('my-orders-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    loadMyOrders();
}

function closeMyOrders() {
    document.getElementById('my-orders-modal').classList.remove('active');
    document.body.style.overflow = '';
    if (myOrdersUnsubscribe) { myOrdersUnsubscribe(); myOrdersUnsubscribe = null; }
}

function loadMyOrders() {
    const myOrderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
    const ordersList = document.getElementById('orders-list');
    if (myOrderIds.length === 0) {
        ordersList.innerHTML = `<div class="orders-empty"><i class="fas fa-receipt"></i><p>No tienes pedidos aún</p></div>`;
        return;
    }
    const q = window.firebaseQuery(window.firebaseCollection(window.db,'orders'), window.firebaseOrderBy('createdAt','desc'));
    myOrdersUnsubscribe = window.firebaseOnSnapshot(q, snap => {
        const orders = [];
        snap.forEach(d => { const data = d.data(); if (myOrderIds.includes(data.orderId)) orders.push({ id: d.id, ...data }); });
        if (orders.length === 0) {
            ordersList.innerHTML = `<div class="orders-empty"><i class="fas fa-receipt"></i><p>No tienes pedidos aún</p></div>`;
            return;
        }
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">${order.orderId}</span>
                    <span class="order-status status-${order.status}">${getStatusLabel(order.status)}</span>
                </div>
                <div class="order-items">${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</div>
                <div class="order-total">${formatPrice(order.total)}</div>
                <div class="order-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(order.createdAt)}</span>
                    <span><i class="fas fa-credit-card"></i> ${order.paymentMethod}</span>
                </div>
            </div>`).join('');
    });
}

function getStatusLabel(status) {
    return { nuevo:'Nuevo', preparando:'En Preparación', listo:'Listo', encamino: 'En Camino', entregado:'Entregado' }[status] || status;
}

// ============================================
// ADMIN (login rápido desde la app principal)
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
    const btn = event.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
    btn.disabled = true;
    try {
        await window.firebaseSignIn(window.auth,
            document.getElementById('admin-email').value,
            document.getElementById('admin-password').value
        );
        await activarNotificacionesAdmin();
        closeAdminLogin();
        // Redirigir al panel admin
        window.location.href = '/admin.html';
    } catch (error) {
        showToast('Credenciales incorrectas');
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        btn.disabled = false;
    }
}

// ============================================
// NOTIFICACIONES PUSH PARA ADMIN
// ============================================
let notificacionesActivas = false;
let adminPushListener     = null;
let pedidosYaVistos       = new Set();

async function activarNotificacionesAdmin() {
    if (!('Notification' in window)) return;
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') { showToast('Activa las notificaciones del navegador'); return; }
    notificacionesActivas = true;
    iniciarListenerNuevosPedidos();
    showToast('Notificaciones activadas');
}

function iniciarListenerNuevosPedidos() {
    if (adminPushListener) return;
    const q = window.firebaseQuery(window.firebaseCollection(window.db,'orders'), window.firebaseOrderBy('createdAt','desc'));
    let primeraVez = true;
    adminPushListener = window.firebaseOnSnapshot(q, snap => {
        if (primeraVez) { snap.forEach(d => pedidosYaVistos.add(d.id)); primeraVez = false; return; }
        snap.docChanges().forEach(change => {
            if (change.type !== 'added') return;
            const docId = change.doc.id;
            if (pedidosYaVistos.has(docId)) return;
            pedidosYaVistos.add(docId);
            const pedido = change.doc.data();
            const ahora  = Date.now();
            const creado = pedido.createdAt?.toDate ? pedido.createdAt.toDate().getTime() : ahora;
            if (ahora - creado < 30000) mostrarNotificacionPedido(pedido);
        });
    });
}

async function mostrarNotificacionPedido(pedido) {
    const payload = { orderId: pedido.orderId || 'Nuevo', customerName: pedido.customerName || 'Cliente', items: pedido.items || [], total: pedido.total || 0 };
    if ('serviceWorker' in navigator) {
        try {
            const swReg = await navigator.serviceWorker.ready;
            if (swReg.active) { swReg.active.postMessage({ type: 'NUEVO_PEDIDO', payload }); return; }
        } catch (e) {}
    }
    if (Notification.permission === 'granted') {
        const resumen = payload.items.length ? payload.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'Ver detalles';
        new Notification(`Nuevo Pedido - ${payload.orderId}`, {
            body: `${payload.customerName} pidio: ${resumen}. Total: $${Number(payload.total).toLocaleString('es-CO')}`,
            icon: '/images/icon-192.png', requireInteraction: true
        });
    }
}

// ============================================
// CLOSE MODALS
// ============================================
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        if (e.target.id === 'product-modal')     closeModal();
        if (e.target.id === 'cart-modal')        closeCart();
        if (e.target.id === 'checkout-modal')    closeCheckout();
        if (e.target.id === 'success-modal')     closeSuccess();
        if (e.target.id === 'my-orders-modal')   closeMyOrders();
        if (e.target.id === 'admin-login-modal') closeAdminLogin();
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeCart(); closeCheckout(); closeSuccess(); closeMyOrders(); closeAdminLogin(); }
});

// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('SW registrado'))
            .catch(err => console.log('SW fallo:', err));
    });
}

// ============================================
// EXPONER FUNCIONES GLOBALMENTE
// ============================================
window.openProductModal           = openProductModal;
window.closeModal                 = closeModal;
window.changeQuantity             = changeQuantity;
window.addToCartFromModal         = addToCartFromModal;
window.showCart                   = showCart;
window.closeCart                  = closeCart;
window.updateCartItem             = updateCartItem;
window.removeCartItem             = removeCartItem;
window.checkout                   = checkout;
window.closeCheckout              = closeCheckout;
window.sendOrder                  = sendOrder;
window.closeSuccess               = closeSuccess;
window.showMyOrders               = showMyOrders;
window.closeMyOrders              = closeMyOrders;
window.showAdminLogin             = showAdminLogin;
window.closeAdminLogin            = closeAdminLogin;
window.adminLogin                 = adminLogin;
window.activarNotificacionesAdmin = activarNotificacionesAdmin;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    initSplash();
    updateCartBadge();
    await loadFirestoreData();
});
