/* ============================================
   NE&AN — ADMIN PANEL JS
   ============================================ */

let currentFilter     = 'all';
let pedidosListener   = null;
let productosListener = null;
let allPedidos        = [];
let editingProductId  = null;

// ── Utilidades ────────────────────────────
function formatPrice(p) {
    return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(p);
}

function formatDate(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function toast(msg, isError = false) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.remove('hidden', 'error');
    if (isError) t.classList.add('error');
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('hidden'), 300); }, 3000);
}

function statusLabel(s) {
    return {
        nuevo:      'Nuevo',
        preparando: 'En Preparación',
        listo:      'Listo',
        encamino:   'En Camino',
        entregado:  'Entregado'
    }[s] || s;
}

// ── Auth ──────────────────────────────────
window.fsOnAuth(window.auth, (user) => {
    if (user) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        initPanel();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
    }
});

window.doLogin = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ingresando...';
    btn.disabled = true;
    err.classList.add('hidden');
    try {
        await window.fsSignIn(window.auth,
            document.getElementById('login-email').value,
            document.getElementById('login-password').value
        );
    } catch {
        err.classList.remove('hidden');
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        btn.disabled = false;
    }
};

window.doLogout = async function() {
    if (pedidosListener)   { pedidosListener();   pedidosListener   = null; }
    if (productosListener) { productosListener(); productosListener = null; }
    await window.fsSignOut(window.auth);
};

// ── Init ──────────────────────────────────
function initPanel() {
    showSection('pedidos');
    loadNegocio();
}

// ── Navegación ────────────────────────────
window.showSection = function(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('sec-' + name).classList.add('active');
    document.querySelector(`.nav-item[onclick*="${name}"]`).classList.add('active');
    if (name === 'pedidos')   initPedidos();
    if (name === 'productos') initProductos();
    if (name === 'negocio')   cargarEstadoNegocio();
};

// ════════════════════════════════════════════
// PEDIDOS
// ════════════════════════════════════════════
function initPedidos() {
    if (pedidosListener) return;
    const q = window.fsQuery(window.fsCollection(window.db, 'orders'), window.fsOrderBy('createdAt', 'desc'));
    pedidosListener = window.fsOnSnapshot(q, snap => {
        allPedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderPedidos();
    });
}

function renderPedidos() {
    const list = document.getElementById('pedidos-list');
    const data = currentFilter === 'all' ? allPedidos : allPedidos.filter(p => p.status === currentFilter);

    if (data.length === 0) {
        list.innerHTML = `<div class="empty"><i class="fas fa-inbox"></i><p>No hay pedidos${currentFilter !== 'all' ? ' en este estado' : ''}</p></div>`;
        return;
    }

    list.innerHTML = data.map(p => `
        <div class="pedido-card ${p.status}">
            <div class="pedido-top">
                <div>
                    <div class="pedido-id">${p.orderId}</div>
                    <div style="font-size:0.78rem;color:var(--text-light)">${formatDate(p.createdAt)}</div>
                </div>
                <span class="badge-estado badge-${p.status}">${statusLabel(p.status)}</span>
            </div>
            <div class="pedido-info"><i class="fas fa-user"></i> ${p.customerName} &nbsp;|&nbsp; <i class="fas fa-phone"></i> <a href="tel:${p.customerPhone}" style="color:var(--primary)">${p.customerPhone}</a></div>
            <div class="pedido-info"><i class="fas fa-map-marker-alt"></i> ${p.customerAddress}</div>
            ${p.notes ? `<div class="pedido-info"><i class="fas fa-sticky-note"></i> ${p.notes}</div>` : ''}
            <div class="pedido-items">
                ${p.items.map(i => `• ${i.quantity}x ${i.name} — $${i.price.toLocaleString('es-CO')}`).join('<br>')}
            </div>
            <div class="pedido-bottom">
                <span class="pedido-total">${formatPrice(p.total)}</span>
                <span style="font-size:0.85rem;color:var(--text-light)"><i class="fas fa-credit-card"></i> ${p.paymentMethod}</span>
                <div class="pedido-actions">
                    ${p.status !== 'nuevo'      ? `<button class="btn-estado btn-nuevo"      onclick="setEstado('${p.id}','nuevo')">Nuevo</button>` : ''}
                    ${p.status !== 'preparando' ? `<button class="btn-estado btn-preparando" onclick="setEstado('${p.id}','preparando')">Preparando</button>` : ''}
                    ${p.status !== 'listo'      ? `<button class="btn-estado btn-listo"      onclick="setEstado('${p.id}','listo')">Listo</button>` : ''}
                    ${p.status !== 'encamino'   ? `<button class="btn-estado btn-encamino"   onclick="setEstado('${p.id}','encamino')">En Camino</button>` : ''}
                    ${p.status !== 'entregado'  ? `<button class="btn-estado btn-entregado"  onclick="setEstado('${p.id}','entregado')">Entregado</button>` : ''}
                    <button class="btn-estado btn-eliminar" onclick="deletePedido('${p.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

window.setFilter = function(btn, filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPedidos();
};

window.setEstado = async function(id, status) {
    try {
        await window.fsUpdateDoc(window.fsDoc(window.db, 'orders', id), { status });
        toast(`Pedido: ${statusLabel(status)}`);
    } catch { toast('Error al actualizar', true); }
};

window.deletePedido = async function(id) {
    if (!confirm('¿Eliminar este pedido?')) return;
    try {
        await window.fsDeleteDoc(window.fsDoc(window.db, 'orders', id));
        toast('Pedido eliminado');
    } catch { toast('Error al eliminar', true); }
};

window.refreshPedidos = function() {
    if (pedidosListener) { pedidosListener(); pedidosListener = null; }
    initPedidos();
    toast('Pedidos actualizados');
};

// ════════════════════════════════════════════
// PRODUCTOS
// ════════════════════════════════════════════
function initProductos() {
    if (productosListener) return;
    const colRef = window.fsCollection(window.db, 'productos');
    productosListener = window.fsOnSnapshot(colRef, snap => {
        const prods = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        prods.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        renderProductos(prods);
    });
}

function renderProductos(prods) {
    const grid = document.getElementById('productos-list');
    if (prods.length === 0) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><i class="fas fa-hamburger"></i><p>No hay productos aún. ¡Crea el primero!</p></div>`;
        return;
    }
    grid.innerHTML = prods.map(p => `
        <div class="prod-card ${p.activo === false ? 'inactive' : ''}">
            <div class="prod-img">
                ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-hamburger\\'></i>'">` : `<i class="fas fa-hamburger"></i>`}
            </div>
            <div class="prod-body">
                ${p.badge ? `<span class="prod-badge-tag">${p.badge}</span>` : ''}
                <div class="prod-name">${p.nombre}</div>
                <div class="prod-desc">${p.descripcion}</div>
                <div class="prod-price">${formatPrice(p.precio)}</div>
                <span class="prod-status ${p.activo !== false ? 'active' : 'inactive'}">
                    ${p.activo !== false ? '● Activo' : '● Inactivo'}
                </span>
            </div>
            <div class="prod-footer">
                <button class="btn-edit" onclick="openProductForm('${p.id}')"><i class="fas fa-edit"></i> Editar</button>
                <button class="btn-del"  onclick="deleteProducto('${p.id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

window.openProductForm = async function(prodId = null) {
    editingProductId = prodId;
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('img-preview-wrap').style.display = 'none';
    document.getElementById('modal-title').textContent = prodId ? 'Editar Producto' : 'Nuevo Producto';

    const imgInput = document.getElementById('prod-imagen');
    imgInput.oninput = function() {
        const url = this.value.trim();
        if (url) {
            document.getElementById('img-preview').src = url;
            document.getElementById('img-preview-wrap').style.display = 'block';
        } else {
            document.getElementById('img-preview-wrap').style.display = 'none';
        }
    };

    if (prodId) {
        try {
            const snap = await window.fsGetDoc(window.fsDoc(window.db, 'productos', prodId));
            if (snap.exists()) {
                const d = snap.data();
                document.getElementById('prod-id').value     = prodId;
                document.getElementById('prod-nombre').value = d.nombre      || '';
                document.getElementById('prod-desc').value   = d.descripcion || '';
                document.getElementById('prod-precio').value = d.precio      || '';
                document.getElementById('prod-badge').value  = d.badge       || '';
                document.getElementById('prod-activo').value = String(d.activo !== false);
                document.getElementById('prod-imagen').value    = d.imagen      || '';
                document.getElementById('prod-categoria').value = d.categoria   || 'menu';
                if (d.imagen) {
                    document.getElementById('img-preview').src = d.imagen;
                    document.getElementById('img-preview-wrap').style.display = 'block';
                }
            }
        } catch (e) { console.error(e); }
    }

    document.getElementById('product-modal').classList.remove('hidden');
};

window.closeProductForm = function() {
    document.getElementById('product-modal').classList.add('hidden');
    editingProductId = null;
};

window.saveProduct = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('save-prod-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        const data = {
            nombre:      document.getElementById('prod-nombre').value.trim(),
            descripcion: document.getElementById('prod-desc').value.trim(),
            precio:      Number(document.getElementById('prod-precio').value),
            badge:       document.getElementById('prod-badge').value.trim() || null,
            activo:      document.getElementById('prod-activo').value === 'true',
            imagen:      document.getElementById('prod-imagen').value.trim() || null,
            categoria:   document.getElementById('prod-categoria').value || 'menu',
            orden:       Date.now()
        };

        const prodId = document.getElementById('prod-id').value;
        if (prodId) {
            await window.fsUpdateDoc(window.fsDoc(window.db, 'productos', prodId), data);
            toast('Producto actualizado correctamente');
        } else {
            await window.fsAddDoc(window.fsCollection(window.db, 'productos'), data);
            toast('Producto creado correctamente');
        }
        closeProductForm();
    } catch (err) {
        toast('Error al guardar: ' + err.message, true);
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        btn.disabled = false;
    }
};

window.deleteProducto = async function(id) {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
        await window.fsDeleteDoc(window.fsDoc(window.db, 'productos', id));
        toast('Producto eliminado');
    } catch { toast('Error al eliminar', true); }
};

// ════════════════════════════════════════════
// NEGOCIO
// ════════════════════════════════════════════
async function loadNegocio() {
    try {
        const snap = await window.fsGetDoc(window.fsDoc(window.db, 'config', 'negocio'));
        if (snap.exists()) {
            const d = snap.data();
            document.getElementById('neg-nombre').value     = d.nombre      || '';
            document.getElementById('neg-ubicacion').value  = d.ubicacion   || '';
            document.getElementById('neg-tel1').value       = d.tel1        || '';
            document.getElementById('neg-tel2').value       = d.tel2        || '';
            document.getElementById('neg-dias').value       = d.dias        || '';
            document.getElementById('neg-horario').value    = d.horario     || '';
            document.getElementById('neg-bienvenida').value = d.bienvenida  || '';
            document.getElementById('neg-domicilio').value  = d.domicilio   || '';
        }
    } catch (e) { console.log('Cargando valores por defecto'); }
}

window.saveNegocio = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;
    try {
        await window.fsSetDoc(window.fsDoc(window.db, 'config', 'negocio'), {
            nombre:     document.getElementById('neg-nombre').value.trim(),
            ubicacion:  document.getElementById('neg-ubicacion').value.trim(),
            tel1:       document.getElementById('neg-tel1').value.trim(),
            tel2:       document.getElementById('neg-tel2').value.trim(),
            dias:       document.getElementById('neg-dias').value.trim(),
            horario:    document.getElementById('neg-horario').value.trim(),
            bienvenida: document.getElementById('neg-bienvenida').value.trim(),
            domicilio:  document.getElementById('neg-domicilio').value.trim(),
        });
        toast('Informacion del negocio guardada');
    } catch (err) {
        toast('Error al guardar: ' + err.message, true);
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
        btn.disabled = false;
    }
};

// ════════════════════════════════════════════
// ESTADO NEGOCIO (ABIERTO / CERRADO)
// ════════════════════════════════════════════
async function cargarEstadoNegocio() {
    try {
        const snap = await window.fsGetDoc(window.fsDoc(window.db, 'config', 'estado'));
        const card = document.getElementById('estado-negocio-card');
        const subtitulo = document.getElementById('estado-subtitulo');
        const btnAbrir  = document.getElementById('btn-abrir');
        const btnCerrar = document.getElementById('btn-cerrar');

        if (snap.exists() && snap.data().abierto === false) {
            // CERRADO manualmente
            card.className = 'estado-negocio-card cerrado';
            subtitulo.innerHTML = '<i class="fas fa-circle"></i> Cerrado manualmente';
            btnAbrir.style.display  = 'flex';
            btnCerrar.style.display = 'none';
        } else if (snap.exists() && snap.data().abierto === true) {
            // ABIERTO manualmente
            card.className = 'estado-negocio-card abierto';
            subtitulo.innerHTML = '<i class="fas fa-circle"></i> Abierto manualmente';
            btnAbrir.style.display  = 'none';
            btnCerrar.style.display = 'flex';
        } else {
            // Modo automático por horario
            card.className = 'estado-negocio-card automatico';
            subtitulo.innerHTML = '<i class="fas fa-clock"></i> Automático (por horario)';
            btnAbrir.style.display  = 'flex';
            btnCerrar.style.display = 'flex';
        }
    } catch (e) {
        console.log('Error cargando estado negocio:', e);
    }
}

window.toggleEstadoNegocio = async function(abierto) {
    try {
        await window.fsSetDoc(window.fsDoc(window.db, 'config', 'estado'), {
            abierto: abierto,
            updatedAt: new Date()
        });
        toast(abierto ? '✅ Negocio abierto' : '🔒 Negocio cerrado');
        cargarEstadoNegocio();
    } catch (err) {
        toast('Error al cambiar estado: ' + err.message, true);
    }
};
