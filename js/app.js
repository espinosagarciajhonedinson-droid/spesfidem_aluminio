/**
 * Spesfidem Aluminio - App Logic
 * Handles Client Database, Payment Simulation, and Advanced Gallery
 */

const DB_KEY = 'spesfidem_clients';

//Helper to generate gallery data
// Helper to generate gallery data with localized reference images
function generateGalleryData(categoryName, count, title) {
    const images = [];
    // We'll attempt to load up to 50 images. The UI will gracefully handle failures.
    const limit = 50;
    for (let i = 1; i <= limit; i++) {
        const src = `./images/gallery/${categoryName}/${i}.jpg`;
        images.push({
            src: src,
            caption: `${title} - Modelo Premium #${i}`,
            category: categoryName
        });
    }
    return images;
}

// Actual galleries data with localized unique references
const galleries = {
    'ventana_corrediza': generateGalleryData('ventana_corrediza', 20, 'Ventana Corrediza'),
    'ventana_proyectante': generateGalleryData('ventana_proyectante', 20, 'Ventana Proyectante'),
    'ventana_casement': generateGalleryData('ventana_abatible', 20, 'Ventana Abatible'),
    'ventana_abatible': generateGalleryData('ventana_abatible', 20, 'Ventana Abatible'),
    'ventana_batiente': generateGalleryData('ventana_batiente', 20, 'Ventana Batiente'),
    'ventana_fija': generateGalleryData('ventana_fija', 20, 'Ventana Fija'),
    'ventana_basculante': generateGalleryData('ventana_basculante', 20, 'Ventana Basculante'),
    'puerta_principal': generateGalleryData('puerta_principal', 20, 'Puerta Principal'),
    'puerta_patio': generateGalleryData('puerta_patio', 20, 'Puerta Patio'),
    'puerta_plegable': generateGalleryData('puerta_plegable', 20, 'Puerta Plegable'),
    'puerta_bano': generateGalleryData('puerta_bano', 20, 'Puerta Baño'),
    'division_bano': generateGalleryData('division_bano', 20, 'División Baño')
};

// --- Gallery State ---
let currentCategory = null;

// Modified to Open New Page
function openGallery(categoryId) {
    if (!galleries[categoryId]) {
        console.error('Gallery not found for:', categoryId);
        return;
    }
    // Redirect to gallery.html with the category ID
    window.location.href = `gallery.html?category=${categoryId}`;
}

// Function to load data on gallery.html
function initGalleryPage() {
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');

    if (!categoryId || !galleries[categoryId]) {
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #ef4444;">
                    <h3><i class="fas fa-exclamation-triangle"></i> Error de Categoría</h3>
                    <p>No se pudo cargar la galería: ${categoryId ? 'Categoría no encontrada' : 'Falta parámetro de categoría'}</p>
                    <p><small>Debug: ${categoryId || 'null'}</small></p>
                    <a href="index.html" class="btn-primary" style="margin-top:1rem; display:inline-block;">Volver al Inicio</a>
                </div>
            `;
        }
        console.error('Gallery loading failed:', categoryId);
        return;
    }

    const images = galleries[categoryId];
    const grid = document.getElementById('galleryGrid');
    const title = document.getElementById('pageTitle');

    if (title) {
        // Format title nicely (e.g. ventana_corrediza -> Ventana Corrediza)
        title.textContent = categoryId.replace(/_/g, ' ').toUpperCase();
    }

    if (grid) {
        grid.innerHTML = ''; // Clear
        if (images.length === 0) {
            grid.innerHTML = `<div style="color:white; grid-column:1/-1;">No hay imágenes en esta categoría.</div>`;
        }
        // Monitor if any images were actually added
        if (images.length === 0) {
            grid.innerHTML = `
                <div class="empty-gallery-msg">
                    <h2>Catálogo en Renovación</h2>
                    <p>Estamos actualizando nuestra base de datos con fotografías reales 4K. Vuelva pronto.</p>
                </div>
            `;
            return;
        }

        images.forEach(img => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.style.display = 'none'; // Hide initially

            const imageObj = new Image();
            imageObj.src = img.src;

            imageObj.onload = () => {
                // Only show if image exists
                item.style.display = 'block';
                item.innerHTML = `
                    <div style="position:relative; overflow:hidden;">
                        <img src="${img.src}" class="gallery-img" alt="${img.caption}" onclick="viewFullImage('${img.src}')">
                        <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.7); padding:5px 10px; border-radius:5px; font-size:0.7rem;">
                            <i class="fas fa-search-plus" style="color:var(--accent);"></i>
                        </div>
                    </div>
                    <div class="gallery-caption">${img.caption}</div>
                `;
            };

            imageObj.onerror = () => {
                // Remove if 404
                item.remove();
            };

            grid.appendChild(item);
        });
    }
}

function viewFullImage(src) {
    // Simple full screen view for the dedicated page
    window.open(src, '_blank');
}

// Reserved for old lightbox just in case
function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) lb.style.display = "none";
}

// --- Client Registration Logic ---
function saveClient(event) {
    event.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const cellphone = document.getElementById('cellphone').value;
    const landline = document.getElementById('landline').value;
    const city = document.getElementById('city').value;
    const address = document.getElementById('address').value;
    const email = document.getElementById('email').value;
    const product = document.getElementById('product') ? document.getElementById('product').value : 'N/A';
    const quantity = document.getElementById('quantity') ? document.getElementById('quantity').value : '1';

    const newClient = {
        id: Date.now(),
        fullName,
        cellphone,
        landline,
        city,
        address,
        email,
        product,
        quantity,
        date: new Date().toLocaleString()
    };

    let clients = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    clients.push(newClient);
    localStorage.setItem(DB_KEY, JSON.stringify(clients));

    showToast(`¡Gracias ${fullName}! Tus datos han sido registrados.<br>Te contactaremos pronto.`);
    document.getElementById('clientForm').reset();
}

// --- Payment Simulation ---
function simulatePayment(provider) {
    let message = "";
    if (provider === 'Nequi') {
        message = `<strong>Cuenta Nequi</strong><br>Envía a: 323 204 5129<br><em>Envíanos el comprobante al WhatsApp.</em>`;
    } else if (provider === 'B. Bogota') {
        message = `<strong>Banco de Bogotá</strong><br>Cuenta Ahorros: 583092325<br>Titular: Spesfidem Aluminio`;
    } else if (provider === 'DaviPlata') {
        message = `<strong>DaviPlata</strong><br>Envía a: 323 204 5129`;
    } else {
        message = `Iniciando pasarela de pago segura con ${provider}...<br>(Simulación)`;
    }
    showToast(message);
}

// --- Toast Logic ---
function showToast(htmlMessage) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <div class="toast-message">${htmlMessage}</div>
    `;

    container.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// --- Admin Panel Logic ---
function loadAdminData() {
    const tableBody = document.getElementById('clientTableBody');
    if (!tableBody) return;

    // Use DB_KEY defined at top
    const clients = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const countElement = document.getElementById('clientCount');

    if (countElement) countElement.textContent = clients.length;

    tableBody.innerHTML = '';

    if (clients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No hay clientes registrados aún.</td></tr>';
        return;
    }

    clients.sort((a, b) => b.id - a.id);

    clients.forEach(client => {
        const row = document.createElement('tr');
        // Corrected Column Mapping: Date, Name, Phones, City, Email, Address, Actions
        row.innerHTML = `
            <td>${client.date}</td>
            <td style="font-weight:bold; color:var(--text-dark);">${client.fullName}</td>
            <td>
                <div>Cel: ${client.cellphone}</div>
                ${client.landline ? `<div style="font-size:0.85em; color:#64748b;">Fijo: ${client.landline}</div>` : ''}
            </td>
            <td><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:600;">${client.city || 'N/A'}</span></td>
            <td>
                <div style="font-weight:600; color:var(--accent);">${client.product || 'N/A'}</div>
                <div style="font-size:0.85em; color:#64748b;">Cant: ${client.quantity || '1'}</div>
            </td>
            <td>${client.email}</td>
            <td style="max-width:200px; word-wrap:break-word;">${client.address}</td>
            <td style="display:flex; gap:0.5rem;">
                <button onclick="openEditModal(${client.id})" class="btn-edit" style="background:#f59e0b; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" title="Editar Datos">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteClient(${client.id})" class="btn-delete" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" title="Eliminar Registro">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- Undo Logic ---
let lastDeletedClient = null;
let undoTimeout = null;

function deleteClient(id) {
    if (!confirm("¿Está seguro que desea eliminar este registro?")) return;

    let clients = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const clientToDelete = clients.find(c => c.id === id);

    if (clientToDelete) {
        lastDeletedClient = clientToDelete;

        // Remove from DB
        clients = clients.filter(c => c.id !== id);
        localStorage.setItem(DB_KEY, JSON.stringify(clients));

        // Refresh UI
        loadAdminData();

        // Show Toast with Undo
        showUndoToast("Registro eliminado.");
    }
}

function undoLastDelete() {
    if (!lastDeletedClient) return;

    let clients = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    clients.push(lastDeletedClient);
    localStorage.setItem(DB_KEY, JSON.stringify(clients));

    lastDeletedClient = null;
    loadAdminData();
    showToast("Acción deshecha. El cliente ha sido restaurado.");
}

function showUndoToast(msg) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '1rem';

    toast.innerHTML = `
        <i class="fas fa-trash-alt"></i>
        <span>${msg}</span>
        <button onclick="undoLastDelete(); this.parentElement.remove();" style="background:#fbbf24; color:black; border:none; padding:5px 10px; border-radius:4px; font-weight:bold; cursor:pointer;">
            <i class="fas fa-undo"></i> Deshacer
        </button>
    `;

    container.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 6000); // Give them 6 seconds to undo
}

// --- Edit Client Logic ---
function openEditModal(id) {
    let clients = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const client = clients.find(c => c.id === id);
    if (!client) return;

    document.getElementById('editId').value = client.id;
    document.getElementById('editName').value = client.fullName || '';
    document.getElementById('editCel').value = client.cellphone || '';
    document.getElementById('editTel').value = client.landline || '';
    document.getElementById('editCity').value = client.city || '';
    document.getElementById('editAddress').value = client.address || '';
    document.getElementById('editEmail').value = client.email || '';
    if (document.getElementById('editProduct')) document.getElementById('editProduct').value = client.product || '';
    if (document.getElementById('editQuantity')) document.getElementById('editQuantity').value = client.quantity || '1';

    // Show modal
    document.getElementById('editOverlay').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editOverlay').style.display = 'none';
}

function saveEditClient(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editId').value);

    let clients = JSON.parse(localStorage.getItem(DB_KEY)) || [];
    const index = clients.findIndex(c => c.id === id);

    if (index !== -1) {
        // Update fields
        clients[index].fullName = document.getElementById('editName').value;
        clients[index].cellphone = document.getElementById('editCel').value;
        clients[index].landline = document.getElementById('editTel').value;
        clients[index].city = document.getElementById('editCity').value;
        clients[index].address = document.getElementById('editAddress').value;
        clients[index].email = document.getElementById('editEmail').value;
        if (document.getElementById('editProduct')) clients[index].product = document.getElementById('editProduct').value;
        if (document.getElementById('editQuantity')) clients[index].quantity = document.getElementById('editQuantity').value;

        localStorage.setItem(DB_KEY, JSON.stringify(clients));
        loadAdminData();
        closeEditModal();
        showToast("Datos del cliente actualizados exitosamente.");
    }
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const menu = document.querySelector('.big-menu');

    if (mobileBtn && menu) {
        mobileBtn.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }

    loadAdminData();
});

// --- FAQ Interactivity ---
function toggleFAQ(element) {
    const item = element.parentElement;
    item.classList.toggle('active');
}

