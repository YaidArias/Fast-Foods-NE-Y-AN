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

    const modal = document.getElementById('product-modal');
    // Construir modal con foto grande si existe
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

    
