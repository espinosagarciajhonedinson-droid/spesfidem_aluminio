/**
 * Spesfidem Aluminio - App Logic
 * Handles Client Database (IndexedDB), 3-Slot Form, and Admin Dashboard
 */

const DB_KEY = 'spesfidem_clients';
const DB_NAME = 'SpesfidemDB';
const DB_VERSION = 1;
const STORE_NAME = 'clients';

// --- Database Layer (Python Server API) ---
class ClientDB {
    constructor() {
        this.apiUrl = '/api/clients';
    }

    // Initialization is simple health check or no-op
    async init() {
        console.log("Connected to Spesfidem Persistent Server");
    }

    async save(client) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(client)
            });
            if (!response.ok) throw new Error('Error saving to server');
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async delete(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error deleting from server');
        } catch (e) {
            console.error(e);
        }
    }

    async getAll() {
        try {
            // Anti-caching timestamp
            const response = await fetch(`${this.apiUrl}?t=${Date.now()}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.error("Fetch error:", e);
            return [];
        }
    }

    async getById(id) {
        // Fetch all and find (Simpler for this scale)
        const clients = await this.getAll();
        return clients.find(c => String(c.id) === String(id)) || null;
    }

    async getByIdCard(idCard) {
        if (!idCard) return null;
        const clients = await this.getAll();
        // Normalize comparison
        return clients.find(c => String(c.idCard).trim() === String(idCard).trim()) || null;
    }

    async getPaged(page, pageSize, searchQuery = '') {
        const clients = await this.getAll();
        // Sort Newest First (descending ID/Timestamp)
        clients.sort((a, b) => b.id - a.id);

        const query = searchQuery.toLowerCase();
        const filtered = clients.filter(c =>
            !query ||
            (c.fullName && c.fullName.toLowerCase().includes(query)) ||
            (c.cellphone && String(c.cellphone).includes(query)) ||
            (c.idCard && String(c.idCard).includes(query)) ||
            (c.city && c.city.toLowerCase().includes(query))
        );

        const start = (page - 1) * pageSize;
        const pageItems = filtered.slice(start, start + pageSize);

        return { items: pageItems };
    }

    async count(searchQuery = '') {
        const clients = await this.getAll();
        const query = searchQuery.toLowerCase();
        if (!query) return clients.length;

        return clients.filter(c =>
            (c.fullName && c.fullName.toLowerCase().includes(query)) ||
            (c.cellphone && String(c.cellphone).includes(query))
        ).length;
    }
    async getNextSerial() {
        const clients = await this.getAll();
        if (clients.length === 0) return 1;
        const serials = clients.map(c => c.serial || 0);
        return Math.max(...serials) + 1;
    }
}

const db = new ClientDB();

// --- Initialization ---
async function migrateData() {
    // Disabled for Server Mode
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. DB Init
    try {
        await db.init();
        await migrateData();
    } catch (e) {
        console.error("App startup failed:", e);
    }

    // 2. Mobile Menu
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const menu = document.querySelector('.big-menu');
    if (mobileBtn && menu) {
        mobileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close menu on link click
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && !mobileBtn.contains(e.target)) {
                menu.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-times');
                }
            }
        });
    }

    // 3. Admin Page Logic
    if (window.location.pathname.includes('admin.html')) {
        if (sessionStorage.getItem('isAdmin') === 'true') {
            const overlay = document.getElementById('loginOverlay');
            if (overlay) overlay.style.display = 'none';
            loadAdminData();
        }
    }

    // 4. Material Filtering for Shower Divisions
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-slot')) {
            const card = e.target.closest('.product-slot-card') || e.target.closest('.product-slot-card-edit');
            if (!card) return;
            const glassSlot = card.querySelector('.glass-slot') || card.querySelector('.edit-glass-slot');
            if (!glassSlot) return;

            const product = e.target.value;
            const isBathroom = product.includes('Baño');
            const groups = glassSlot.querySelectorAll('optgroup');

            groups.forEach(group => {
                const label = group.label;
                if (isBathroom) {
                    // Only allow Tempered Glass or Acrylic for showers
                    if (label.includes('Templado') || label.includes('Acrílico')) {
                        group.style.display = '';
                    } else {
                        group.style.display = 'none';
                    }
                } else {
                    group.style.display = '';
                }
            });
            // If current selection is hidden, reset it
            const selected = glassSlot.options[glassSlot.selectedIndex];
            if (selected && selected.parentElement.style.display === 'none') {
                glassSlot.value = "";
            }
        }
    });

    // 5. Gallery Init (if on gallery.html)
    if (window.location.pathname.includes('gallery.html')) {
        initGalleryPage();
    }

    // 6. Simulator Slots Init (if on simulator.html)
    const slotsContainer = document.getElementById('slotsContainer');
    if (slotsContainer && window.location.pathname.includes('simulator.html')) {
        initSimulatorSlots(slotsContainer);
    }
});

function initSimulatorSlots(container) {
    const prodOptions = `
        <option value="" selected disabled>Seleccione Producto...</option>
        <optgroup label="Sistemas de Ventanas">
            <option value="Ventana Corrediza">Ventana Corrediza</option>
            <option value="Ventana Proyectante">Ventana Proyectante</option>
            <option value="Ventana Fija">Ventana Fija</option>
        </optgroup>
        <optgroup label="Sistemas de Puertas">
            <option value="Puerta Principal">Puerta Principal</option>
            <option value="Puerta de Patio">Puerta de Patio</option>
            <option value="Puerta de Baño">Puerta de Baño</option>
        </optgroup>
        <optgroup label="Especialidades">
            <option value="División de Baño (Vidrio Templado)">División de Baño (Vidrio Templado)</option>
            <option value="División de Baño (Acrílico)">División de Baño (Acrílico)</option>
            <option value="Vidrio Templado">Vidrio Templado</option>
            <option value="Espejos">Espejos</option>
        </optgroup>
    `;

    // Add 9 more slots (1st is static in HTML, or cleared here)
    for (let i = 2; i <= 10; i++) {
        const div = document.createElement('div');
        div.className = 'product-slot-card';
        div.style.background = 'rgba(255,255,255,0.03)';
        div.style.padding = '1.2rem';
        div.style.borderRadius = '1.2rem';
        div.style.border = '1px solid rgba(255,255,255,0.05)';
        div.innerHTML = `
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem; margin-bottom: 0.8rem;">
                <select class="form-control product-slot" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);">
                    <option value="">Añadir Producto ${i}...</option>
                    ${prodOptions}
                </select>
                <input type="number" class="form-control quantity-slot" min="1" value="1" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.8rem;">
                <select class="form-control color-slot" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);">
                    <option value="Natural">Natural</option>
                    <option value="Negro">Negro</option>
                    <option value="Madera">Madera</option>
                    <option value="Blanco">Blanco</option>
                    <option value="Champagne">Champagne</option>
                </select>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="number" class="form-control width-slot" placeholder="Ancho (m)" step="0.01" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); width: 50%;">
                    <input type="number" class="form-control height-slot" placeholder="Alto (m)" step="0.01" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); width: 50%;">
                </div>
                <select class="form-control glass-slot" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);">
                    <option value="">Vidrio...</option>
                    <optgroup label="Monolítico (Crudo)">
                        <option value="Claro (4mm)">Claro (4mm)</option>
                        <option value="Claro (5mm)">Claro (5mm)</option>
                        <option value="Bronce">Bronce</option>
                        <option value="Gris (Humo)">Gris (Humo)</option>
                        <option value="Azul">Azul</option>
                        <option value="Verde">Verde</option>
                    </optgroup>
                    <optgroup label="Reflectivo / Especial">
                        <option value="Bronce Reflectivo">Bronce Reflectivo</option>
                        <option value="Azul Reflectivo">Azul Reflectivo</option>
                        <option value="Esmeralizado (Sandblasted)">Esmeralizado</option>
                    </optgroup>
                    <optgroup label="Templado">
                        <option value="Templado 6mm Incoloro">6mm Incoloro</option>
                        <option value="Templado 8mm Incoloro">8mm Incoloro</option>
                        <option value="Templado 10mm Incoloro">10mm Incoloro</option>
                    </optgroup>
                </select>
            </div>
        `;
        container.appendChild(div);
    }
}

// --- Client Registration & Quotation Logic ---
async function saveClient(event) {
    event.preventDefault();
    const clientData = collectFormData(false); // Registration mode
    if (!clientData) return;

    try {
        await db.save(clientData);
        showToast("¡Registro Exitoso! Redirigiendo a pagos...", "success");
        event.target.reset();
        setTimeout(() => window.location.replace("checkout.html"), 1500);
    } catch (e) {
        console.error("Save failed:", e);
        showToast("Error al guardar registro.", "error");
    }
}

function prepareQuotation(event) {
    if (event) event.preventDefault();

    // Simulation only requires products, no form validation
    const clientData = collectFormData(true); // Simulation mode
    if (!clientData) return;

    // Store in sessionStorage for the quotation page
    sessionStorage.setItem('currentQuotation', JSON.stringify(clientData));
    window.location.href = 'quotation.html';
}

function collectFormData(isSimulation = false) {
    const fullName = document.getElementById('fullName').value || 'Invitado';
    const cellphone = document.getElementById('cellphone').value || '';
    const city = document.getElementById('city').value || '';
    const address = document.getElementById('address').value || '';
    const email = document.getElementById('email').value || '';
    const landline = '';

    // Payment Plan
    const paymentPlanInput = document.querySelector('input[name="paymentPlan"]:checked');
    const paymentPlan = paymentPlanInput ? paymentPlanInput.value : '75-25';

    // If registering, we need actual data
    if (!isSimulation) {
        if (!document.getElementById('fullName').value || !cellphone || !city) {
            showToast("Por favor complete nombre, celular y ciudad en el Registro.", "error");
            return null;
        }
    }

    const items = [];
    const prodSlots = document.querySelectorAll('.product-slot');
    const qtySlots = document.querySelectorAll('.quantity-slot');
    const colorSlots = document.querySelectorAll('.color-slot');
    const glassSlots = document.querySelectorAll('.glass-slot');

    prodSlots.forEach((slot, i) => {
        const prod = slot.value;
        const qty = parseInt(qtySlots[i].value) || 1;
        if (prod) {
            // Price calculation logic (Simulator estimation)
            const basePrice = getBasePrice(prod);
            const profileMarkup = getProfileMarkup(colorSlots[i].value);
            const glassMarkup = getGlassMarkup(glassSlots[i].value);
            const unitPrice = basePrice + profileMarkup + glassMarkup;
            const total = unitPrice * qty;

            const width = document.querySelectorAll('.width-slot')[i].value;
            const height = document.querySelectorAll('.height-slot')[i].value;
            const sizeString = (width && height) ? `${width}m x ${height}m` : 'N/A';

            items.push({
                product: prod,
                quantity: qty,
                color: colorSlots[i].value,
                size: sizeString,
                glass: glassSlots[i].value,
                unitPrice: unitPrice,
                total: total
            });
        }
    });

    if (items.length === 0) {
        showToast("Seleccione al menos un producto en el Simulador.", "error");
        // Scroll to simulator if empty
        document.getElementById('productSlots').scrollIntoView({ behavior: 'smooth' });
        return null;
    }

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const iva = Math.round(subtotal * 0.19);
    const grandTotal = subtotal + iva;

    return {
        id: Date.now(),
        date: new Date().toLocaleDateString('es-CO'),
        fullName, cellphone, landline, city, address, email,
        status: 'Pendiente',
        product: items[0].product,
        quantity: items[0].quantity,
        items: items,
        paymentPlan: paymentPlan,
        subtotal: subtotal,
        iva: iva,
        grandTotal: grandTotal
    };
}

function getBasePrice(product) {
    const prices = {
        // Ventanas
        'Ventana Corrediza': 380000,
        'Ventana Proyectante': 450000,
        'Ventana Casement': 480000,
        'Ventana Fija': 320000,
        'Ventana Basculante': 430000,
        // Puertas
        'Puerta Principal': 1350000,
        'Puerta de Patio': 980000,
        'Puerta Plegable': 1500000,
        'Puerta de Baño': 550000,
        // Otros
        'División de Baño': 650000, // Legacy fallback
        'División de Baño (Vidrio Templado)': 650000,
        'División de Baño (Acrílico)': 580000, // Slightly cheaper base
        'Vidrio Templado': 180000,
        'Espejos': 140000,
        'Fachada Flotante': 2500000,
        'Pasamanos / Otros': 220000
    };
    return prices[product] || 350000;
}

function getProfileMarkup(color) {
    const markups = {
        'Natural': 0,
        'Blanco': 0,
        'Negro': 50000,
        'Champagne': 80000,
        'Madera': 160000
    };
    return markups[color] || 0;
}

function getGlassMarkup(glassSpec) {
    if (!glassSpec) return 0;

    let baseMarkup = 0;

    // Thickness/Type Logic
    if (glassSpec.includes('4mm')) baseMarkup = 60000;
    else if (glassSpec.includes('5mm')) baseMarkup = 85000;
    else if (glassSpec.includes('6mm')) baseMarkup = 155000;
    else if (glassSpec.includes('8mm')) baseMarkup = 230000;
    else if (glassSpec.includes('10mm')) baseMarkup = 310000;
    else if (glassSpec.includes('6.38mm')) baseMarkup = 260000;
    else if (glassSpec.includes('8.38mm')) baseMarkup = 380000;

    // Type Multipliers/Additives
    if (glassSpec.includes('Templado')) baseMarkup += 20000;
    if (glassSpec.includes('Laminado')) baseMarkup += 40000;
    if (glassSpec.includes('Acrílico')) baseMarkup = 95000; // Base Acrylic cost
    if (glassSpec.includes('Espejo')) baseMarkup = Math.max(baseMarkup, 100000);

    // Tones
    // Standard Colors
    if (glassSpec.includes('Bronce') && !glassSpec.includes('Reflectivo')) baseMarkup += 15000;
    if (glassSpec.includes('Gris') || glassSpec.includes('Humo')) baseMarkup += 15000;
    if (glassSpec.includes('Azul') && !glassSpec.includes('Reflectivo')) baseMarkup += 15000;
    if (glassSpec.includes('Verde')) baseMarkup += 15000;

    // Specialties
    if (glassSpec.includes('Reflectivo')) baseMarkup += 55000;
    if (glassSpec.includes('Esmeralizado') || glassSpec.includes('Sandblasted')) baseMarkup += 45000;

    return baseMarkup;
}

// --- Admin Panel Dashboard ---
let currentPage = 1;
const pageSize = 50;
let lastDeletedClient = null;
let deleteTimeout = null;
let selectedClientIds = new Set();

async function loadAdminData() {
    const tableBody = document.getElementById('clientTableBody');
    if (!tableBody) return;

    try {
        const query = document.getElementById('adminSearch')?.value || '';
        const { items } = await db.getPaged(currentPage, pageSize, query);
        const total = await db.count(query);

        document.getElementById('clientCountHeader').textContent = total;
        updatePaginationUI(Math.ceil(total / pageSize));

        tableBody.innerHTML = '';
        if (items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="17" style="text-align:center; padding:2rem;">No se encontraron resultados.</td></tr>';
            return;
        }

        items.forEach(client => {
            const isChecked = selectedClientIds.has(client.id);
            const row = document.createElement('tr');
            if (isChecked) row.classList.add('is-selected');
            row.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" class="client-checkbox" value="${client.id}" 
                        ${isChecked ? 'checked' : ''} 
                        onclick="toggleSelectClient(${client.id}, this)" 
                        style="cursor:pointer; width: 16px; height: 16px;">
                </td>
                <td>${client.date}</td>
                <td style="font-weight:bold; color:var(--accent);">COT-${String(client.serial || 0).padStart(7, '0')}</td>
                <td style="font-weight:bold;">${client.fullName}</td>
                <td style="color:#64748b; font-family:monospace;">${client.idCard || 'N/A'}</td>
                <td>
                    <div>Cel: ${client.cellphone}</div>
                    ${client.landline ? `<div style="font-size:0.8rem; color:#64748b;">Fijo: ${client.landline}</div>` : ''}
                </td>
                <td><span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:600;">${client.city || 'N/A'}</span></td>
                <td><div style="font-weight:600; color:var(--accent); font-size:0.85rem;">${getProductString(client)}</div></td>
                <td>${client.email}</td>
                <td style="max-width:200px;">${client.address}</td>
                <td><div style="color:#64748b; font-size:0.9rem;">$${(client.subtotal || 0).toLocaleString()}</div></td>
                <td><div style="color:#64748b; font-size:0.9rem;">$${(client.iva || 0).toLocaleString()}</div></td>
                <td>
                    <div style="font-weight:700; color:#059669; font-size:1rem;">$${(client.grandTotal || 0).toLocaleString()}</div>
                    ${client.paymentPlan === '75-25' ?
                    `<div style="font-size:0.7rem; color:#3b82f6; margin-top:2px;">
                            75%: $${Math.round((client.grandTotal || 0) * 0.75).toLocaleString()}
                         </div>`
                    : ''}
                </td>
                <td>
                    ${client.paymentPlan === '100' ?
                    '<span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-weight:600; font-size:0.8rem;">100% Total</span>' :
                    '<span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:4px; font-weight:600; font-size:0.8rem;">75% / 25%</span>'}
                </td>
                <td><span class="status-badge status-${(client.deliveryStatus || 'Pendiente').toLowerCase()}">${client.deliveryStatus || 'Pendiente'}</span></td>
                <td><span class="status-badge status-${(client.paymentStatus || 'Cancelado').toLowerCase()}">${client.paymentStatus || 'Cancelado'}</span></td>
                <td style="display:flex; gap:0.5rem;">
                    <button onclick="openEditModal(${client.id})" class="btn-edit" style="background:#f59e0b; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteClient(${client.id})" class="btn-delete" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        updateHeaderCheckbox();
    } catch (e) {
        console.error("Load data failed:", e);
    }
}

function getProductString(client) {
    if (client.items && Array.isArray(client.items)) {
        return client.items.map(item => {
            const parts = [
                item.quantity > 1 ? `${item.quantity}x` : '',
                item.product,
                item.color && item.color !== 'N/A' ? `(${item.color})` : '',
                item.glass && item.glass !== 'N/A' ? `| ${item.glass}` : '',
                item.size && item.size !== 'N/A' ? `[${item.size}]` : ''
            ].filter(p => p && p.trim() !== '').join(' ');
            return parts;
        }).join(', ');
    }
    return `${client.quantity || 1}x ${client.product || 'N/A'}`;
}

function updatePaginationUI(totalPages) {
    const container = document.getElementById('paginationControls');
    if (!container) return;
    container.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage <= 1 ? 'disabled' : ''} class="btn-nav">Anterior</button>
        <span style="font-weight:bold; color:#64748b;">Página ${currentPage} de ${totalPages || 1}</span>
        <button onclick="changePage(1)" ${currentPage >= totalPages ? 'disabled' : ''} class="btn-nav">Siguiente</button>
    `;
}

function changePage(delta) {
    currentPage += delta;
    loadAdminData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterClients() {
    currentPage = 1;
    loadAdminData();
}

function updateCSVBtnText() {
    const btnText = document.getElementById('csvBtnText');
    if (!btnText) return;
    if (selectedClientIds.size > 0) {
        btnText.textContent = `Descargar Seleccionados (${selectedClientIds.size})`;
    } else {
        btnText.textContent = "Exportar Todos (CSV)";
    }
}

function toggleSelectClient(id, checkbox) {
    const row = checkbox.closest('tr');
    if (checkbox.checked) {
        selectedClientIds.add(id);
        if (row) row.classList.add('is-selected');
    } else {
        selectedClientIds.delete(id);
        if (row) row.classList.remove('is-selected');
    }
    updateCSVBtnText();
    updateHeaderCheckbox();
}

function toggleSelectAll(headerCheckbox) {
    const checkboxes = document.querySelectorAll('.client-checkbox');
    checkboxes.forEach(cb => {
        const id = parseInt(cb.value);
        const row = cb.closest('tr');
        cb.checked = headerCheckbox.checked;
        if (headerCheckbox.checked) {
            selectedClientIds.add(id);
            if (row) row.classList.add('is-selected');
        } else {
            selectedClientIds.delete(id);
            if (row) row.classList.remove('is-selected');
        }
    });
    updateCSVBtnText();
}

function updateHeaderCheckbox() {
    const headerCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.client-checkbox');
    if (!headerCheckbox || checkboxes.length === 0) return;

    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    headerCheckbox.checked = allChecked;
}

// --- Admin Actions ---
async function deleteClient(id) {
    if (!confirm("¿Eliminar este cliente?")) return;
    try {
        const client = await db.getById(id);
        if (client) {
            lastDeletedClient = client;
            await db.delete(id);
            loadAdminData();
            showUndoToast("Registro eliminado.");
        }
    } catch (e) { console.error(e); }
}

async function undoLastDelete() {
    if (!lastDeletedClient) return;
    try {
        await db.save(lastDeletedClient);
        lastDeletedClient = null;
        loadAdminData();
        showToast("Restaurado correctamente.");
    } catch (e) { console.error(e); }
}

function showUndoToast(msg) {
    const container = document.querySelector('.toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.style.cssText = 'display:flex; align-items:center; gap:1rem; padding: 1rem;';
    toast.innerHTML = `
        <span>${msg}</span>
        <button onclick="undoLastDelete(); this.parentElement.remove();" style="background:#fbbf24; border:none; padding:5px 10px; border-radius:4px; font-weight:bold; cursor:pointer;">DESHACER</button>
    `;
    container.appendChild(toast);
    if (deleteTimeout) clearTimeout(deleteTimeout);
    deleteTimeout = setTimeout(() => {
        toast.remove();
        lastDeletedClient = null;
    }, 6000);
}

function showToast(msg, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? '' : 'error'}`;
    toast.innerHTML = `<div class="toast-message">${msg}</div>`;
    container.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Edit Modal Logic ---
async function openEditModal(id) {
    const client = await db.getById(id);
    if (!client) return;

    document.getElementById('editId').value = client.id;
    document.getElementById('editName').value = client.fullName;
    document.getElementById('editDoc').value = client.idCard || '';
    document.getElementById('editCel').value = client.cellphone;
    document.getElementById('editTel').value = client.landline || '';
    document.getElementById('editCity').value = client.city;
    document.getElementById('editAddress').value = client.address;
    document.getElementById('editEmail').value = client.email;
    document.getElementById('editDeliveryStatus').value = client.deliveryStatus || 'Pendiente';
    document.getElementById('editPaymentStatus').value = client.paymentStatus || 'Cancelado';
    document.getElementById('editPaymentPlan').value = client.paymentPlan || '75-25';

    const container = document.getElementById('editProductSlots');
    if (container) {
        container.innerHTML = '';
        const prodOptions = `
            <option value="">Producto...</option>
            <optgroup label="Sistemas de Ventanas">
                <option value="Ventana Corrediza">Ventana Corrediza</option>
                <option value="Ventana Proyectante">Ventana Proyectante</option>
                <option value="Ventana Casement">Ventana Casement</option>
                <option value="Ventana Fija">Ventana Fija</option>
                <option value="Ventana Basculante">Ventana Basculante</option>
            </optgroup>
            <optgroup label="Sistemas de Puertas">
                <option value="Puerta Principal">Puerta Principal</option>
                <option value="Puerta de Patio">Puerta de Patio</option>
                <option value="Puerta Plegable">Puerta Plegable</option>
                <option value="Puerta de Baño">Puerta de Baño</option>
            </optgroup>
            <optgroup label="Especialidades">
                <option value="División de Baño (Vidrio Templado)">División de Baño (Vidrio Templado)</option>
                <option value="División de Baño (Acrílico)">División de Baño (Acrílico)</option>
                <option value="Vidrio Templado">Vidrio Templado</option>
                <option value="Espejos">Espejos</option>
                <option value="Fachada Flotante">Fachada Flotante</option>
                <option value="Pasamanos / Otros">Pasamanos / Otros</option>
            </optgroup>
        `;

        const items = client.items || [{ product: client.product, quantity: client.quantity }];

        for (let i = 0; i < 10; i++) {
            const item = items[i] || { product: '', quantity: 1, color: 'Natural', size: '', glass: 'Monolítico' };
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
                    <select class="edit-product-slot" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px;">
                        ${prodOptions}
                    </select>
                    <input type="number" class="edit-quantity-slot" value="${item.quantity}" min="1" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:4px;">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:0.4rem;">
                    <select class="edit-color-slot" style="padding:5px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.8rem;">
                        <option value="Natural">Natural</option>
                        <option value="Negro">Negro</option>
                        <option value="Madera">Madera</option>
                        <option value="Blanco">Blanco</option>
                        <option value="Champagne">Champagne</option>
                    </select>
                    <input type="text" class="edit-size-slot" placeholder="Tamaño" value="${item.size || ''}" style="padding:5px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.8rem;">
                    <select class="edit-glass-slot" style="padding:5px; border:1px solid #cbd5e1; border-radius:4px; font-size:0.8rem;">
                        <option value="">Vidrio...</option>
                        <optgroup label="Monolítico">
                            <option value="Monolítico 4mm Incoloro">4mm Incoloro</option>
                            <option value="Monolítico 4mm Bronce">4mm Bronce</option>
                            <option value="Monolítico 4mm Gris">4mm Gris</option>
                            <option value="Monolítico 5mm Incoloro">5mm Incoloro</option>
                        </optgroup>
                        <optgroup label="Templado">
                            <option value="Templado 6mm Incoloro">6mm Incoloro</option>
                            <option value="Templado 6mm Bronce">6mm Bronce</option>
                            <option value="Templado 6mm Gris">6mm Gris</option>
                            <option value="Templado 8mm Incoloro">8mm Incoloro</option>
                        </optgroup>
                        <optgroup label="Laminado">
                            <option value="Laminado 6.38mm Incoloro">6.38mm Incoloro</option>
                            <option value="Laminado 8.38mm Incoloro">8.38mm Incoloro</option>
                        </optgroup>
                        <optgroup label="Acrílicos (Baños)">
                            <option value="Acrílico Azul Brisa">Azul Brisa</option>
                            <option value="Acrílico Fucsia">Fucsia</option>
                            <option value="Acrílico Cristal">Cristal (Incoloro)</option>
                            <option value="Acrílico Opalizado">Opalizado</option>
                        </optgroup>
                        <optgroup label="Espejos/Otros">
                            <option value="Espejo 3mm">Espejo 3mm</option>
                            <option value="Espejo 4mm">Espejo 4mm</option>
                            <option value="Vidrio Sandblasting">Sandblasting</option>
                        </optgroup>
                    </select>
                </div>
            `;
            const pSlot = div.querySelector('.edit-product-slot');
            const cSlot = div.querySelector('.edit-color-slot');
            const gSlot = div.querySelector('.edit-glass-slot');
            pSlot.value = item.product;
            cSlot.value = item.color || 'Natural';
            gSlot.value = item.glass || 'Monolítico';
            container.appendChild(div);
        }
    }

    document.getElementById('editOverlay').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editOverlay').style.display = 'none';
}

async function saveEditClient(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const client = await db.getById(id);
    if (!client) return;

    client.fullName = document.getElementById('editName').value;
    client.idCard = document.getElementById('editDoc').value;
    client.cellphone = document.getElementById('editCel').value;
    client.landline = document.getElementById('editTel').value;
    client.city = document.getElementById('editCity').value;
    client.address = document.getElementById('editAddress').value;
    client.email = document.getElementById('editEmail').value;
    client.deliveryStatus = document.getElementById('editDeliveryStatus').value;
    client.paymentStatus = document.getElementById('editPaymentStatus').value;
    client.paymentPlan = document.getElementById('editPaymentPlan').value;

    const items = [];
    const pSlots = document.querySelectorAll('.edit-product-slot');
    const qSlots = document.querySelectorAll('.edit-quantity-slot');
    const colorSlots = document.querySelectorAll('.edit-color-slot');
    const sizeSlots = document.querySelectorAll('.edit-size-slot');
    const glassSlots = document.querySelectorAll('.edit-glass-slot');

    pSlots.forEach((slot, i) => {
        const prod = slot.value;
        const qty = parseInt(qSlots[i].value) || 1;
        if (prod) {
            const basePrice = getBasePrice(prod);
            const profileMarkup = getProfileMarkup(colorSlots[i].value);
            const glassMarkup = getGlassMarkup(glassSlots[i].value);
            const unitPrice = basePrice + profileMarkup + glassMarkup;

            items.push({
                product: prod,
                quantity: qty,
                color: colorSlots[i].value,
                size: sizeSlots[i].value,
                glass: glassSlots[i].value,
                unitPrice: unitPrice,
                total: unitPrice * qty
            });
        }
    });

    if (items.length > 0) {
        client.product = items[0].product;
        client.quantity = items[0].quantity;
        client.items = items;
        const subtotal = items.reduce((acc, it) => acc + it.total, 0);
        client.subtotal = subtotal;
        client.iva = Math.round(subtotal * 0.19);
        client.grandTotal = subtotal + client.iva;
    }

    await db.save(client);
    closeEditModal();
    loadAdminData();
    showToast("Cambios guardados correctamente.");
}

// --- Gallery Logic (for gallery.html) ---
const galleries = {
    'ventana_corrediza': 5, 'ventana_proyectante': 103, 'ventana_casement': 20,
    'ventana_batiente': 41, 'ventana_fija': 100, 'ventana_basculante': 100,
    'puerta_principal': 232, 'puerta_patio': 100, 'puerta_plegable': 100,
    'puerta_bano': 100, 'division_bano': 59, 'espejos': 0,
    'espejos_decorativos': 50, 'division_acrilico': 0, 'ventana_abatible': 105,
    'vidrio_templado': 103
};

function initGalleryPage() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const grid = document.getElementById('galleryGrid');
    const title = document.getElementById('pageTitle');
    if (!cat || !grid) return;

    if (title) title.textContent = cat.replace(/_/g, ' ').toUpperCase();
    grid.innerHTML = '';

    const count = galleries[cat] || 0;
    const version = Date.now(); // Cache buster

    for (let i = 1; i <= count; i++) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        // Relative container to position button absolute
        item.style.position = 'relative';

        const img = new Image();
        img.className = 'gallery-img';
        img.alt = `${cat} Model ${i}`;

        // Add to DOM first so we can append button
        item.appendChild(img);

        // Add Cart Button
        const btn = document.createElement('button');
        btn.className = 'btn-add-cart';
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        btn.title = "Agregar a Cotización";

        // We need the final src for the cart, which resolves after error handling.
        // Simplified approach: Pass the base JPG path, if it fails, the user wouldn't see/click it anyway (hidden).
        // Actually, if it fails to PNG, the cart might register JPG. 
        // For now, let's just pass a generic reference.
        btn.onclick = (e) => {
            e.stopPropagation(); // Prevent gallery viewer open
            addToCartFromGallery(cat, img.src);
        };

        item.appendChild(btn);

        // SMART FORMAT HANDLING: Try .jpg first (usually real photos), then .png (placeholders or logo-style)
        const tryPngFallback = () => {
            img.src = `./images/gallery/${cat}/${i}.png?v=${version}`;
            img.onerror = () => {
                item.style.display = 'none'; // Only hide if BOTH fail
            };
        };

        img.onerror = tryPngFallback;
        img.src = `./images/gallery/${cat}/${i}.jpg?v=${version}`;

        img.onclick = () => {
            window.location.href = `view_photo.html?src=${encodeURIComponent(img.src)}&cat=${encodeURIComponent(cat)}`;
        };



        const caption = document.createElement('div');
        caption.className = 'gallery-caption';
        caption.textContent = `Modelo Premium #${i}`;
        item.appendChild(caption);
        grid.appendChild(item);
    }
}

// --- Navigation ---
function openGallery(cat) {
    window.location.href = `gallery.html?category=${cat}`;
}

// --- Admin Auth & Utilities ---

function logout() {
    if (confirm("¿Seguro que desea cerrar sesión?")) {
        sessionStorage.removeItem("isAdmin");
        window.location.reload();
    }
}

/* --- PQR LOGIC --- */
function updateCharCount(textarea) {
    const count = textarea.value.length;
    const counterDisplay = document.getElementById('charCount');
    counterDisplay.textContent = `${count} / 500`;

    if (count >= 500) {
        counterDisplay.style.color = '#ef4444'; // Red warning
    } else {
        counterDisplay.style.color = '#64748b';
    }
}

function updateFileName(input) {
    const display = document.getElementById('fileNameDisplay');
    if (input.files && input.files.length > 0) {
        display.textContent = input.files[0].name;
        display.style.color = '#facc15';
    } else {
        display.textContent = 'Seleccionar Archivo (Img, PDF)';
        display.style.color = '#cbd5e1';
    }
}

function handlePQRSubmit(e) {
    e.preventDefault();

    // Get form values
    const form = e.target;
    const type = form.userType.value;
    const name = form.pqrName.value;
    const city = form.pqrCity.value;
    const phone = form.pqrPhone.value;
    const email = form.pqrEmail.value;
    const message = form.pqrMessage.value;

    // Construct Email Body
    const subject = `PQR: ${type} - ${name}`;
    const body = `
Hola Spesfidem Aluminio,

Envío la siguiente solicitud desde el formulario web:

--- DATOS DEL USUARIO ---
Tipo: ${type}
Nombre: ${name}
Ciudad: ${city}
Celular: ${phone}
Correo: ${email}

--- MENSAJE ---
${message}
    `.trim();

    // Check file for alert (still needed as browser restriction warning)
    const fileInput = document.getElementById('pqrFile');
    if (fileInput.files.length > 0) {
        alert("NOTA IMPORTANTE:\n\nPor seguridad del navegador, el archivo seleccionado NO se puede adjuntar automáticamente.\n\nPor favor, ARRASTRE O ADJUNTE SU ARCHIVO manualmente en el correo que se abrirá a continuación.");
    }

    // UX Feedback - IMMEDIATE ACTION
    const btn = form.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fas fa-check"></i> PROCESANDO...';
    btn.disabled = true;

    // Open Mail Client IMMEDIATELY
    window.location.href = `mailto:spesfidemaluminio@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Show Success Modal (simulating "Received" feedback)
    const modal = document.getElementById('pqrSuccessModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Fallback if modal not present (e.g. old page cache)
        alert("¡Gracias! Su solicitud ha sido procesada. Por favor confirme el envío en su correo.");
        window.location.href = 'index.html';
    }
}

function closePQRModal() {
    window.location.href = 'index.html';
}
function adminLogin(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('loginError');

    // Admin Credentials as specified previously
    if (user === '14298116' && pass === '14298116Je*') {
        sessionStorage.setItem('isAdmin', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        loadAdminData();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
    }
}

async function downloadCSV() {
    try {
        let clientsToExport = [];
        if (selectedClientIds.size > 0) {
            for (const id of selectedClientIds) {
                const client = await db.getById(id);
                if (client) clientsToExport.push(client);
            }
        } else {
            clientsToExport = await db.getAll();
        }

        if (clientsToExport.length === 0) {
            showToast("No hay datos para exportar.", "error");
            return;
        }

        // Header
        let csv = "Fecha,Cotizacion,Nombre,Documento,Celular,Fijo,Ciudad,Direccion,Email,Productos,Subtotal,IVA (19%),Total,Plan Pago,Estado de Entrega,Estado de Pago\n";

        // Rows
        clientsToExport.forEach(c => {
            const prods = getProductString(c).replace(/,/g, " |");
            const cot = `COT-${String(c.serial || 0).padStart(7, '0')}`;
            csv += `"${c.date || ''}","${cot}","${c.fullName || ''}","${c.idCard || 'N/A'}","${c.cellphone || ''}","${c.landline || ''}","${c.city || ''}","${c.address || ''}","${c.email || ''}","${prods}","$${(c.subtotal || 0).toLocaleString()}","$${(c.iva || 0).toLocaleString()}","$${(c.grandTotal || 0).toLocaleString()}","${c.paymentPlan || '75-25'}","${c.deliveryStatus || 'Pendiente'}","${c.paymentStatus || 'Cancelado'}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Spesfidem_Clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Export failed:", e);
    }
}

function printClients() {
    const table = document.querySelector('table');
    const printDate = document.getElementById('printDate');
    if (printDate) printDate.textContent = new Date().toLocaleDateString('es-CO') + ' ' + new Date().toLocaleTimeString('es-CO');
    if (!table) return;

    const selectionActive = selectedClientIds.size > 0;
    if (selectionActive) {
        table.classList.add('print-selection-active');
    }

    window.print();

    if (selectionActive) {
        table.classList.remove('print-selection-active');
    }
}

function toggleFAQ(el) {
    el.parentElement.classList.toggle('active');
}
