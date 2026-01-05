/**
 * ProteinValue v3 - Complete Protein Shopping Calculator
 * Features: Barcode scanning, Edit products, Favorites, Community prices
 */

// ==========================================
// STATE & CONFIGURATION
// ==========================================

const state = {
    products: [],
    favorites: [],
    editingProductId: null,
    inputMethod: 'manual',
    scanner: null,
    scannedProduct: null,
    chart: null
};

const PROTEIN_SOURCES = {
    'whey': { label: 'Whey', category: 'animal', emoji: '🥛' },
    'whey-isolate': { label: 'Whey Isolate', category: 'animal', emoji: '🥛' },
    'casein': { label: 'Casein', category: 'animal', emoji: '🥛' },
    'egg': { label: 'Egg White', category: 'animal', emoji: '🥚' },
    'beef': { label: 'Beef', category: 'animal', emoji: '🥩' },
    'chicken': { label: 'Chicken', category: 'animal', emoji: '🍗' },
    'fish': { label: 'Fish', category: 'animal', emoji: '🐟' },
    'dairy': { label: 'Dairy', category: 'animal', emoji: '🧀' },
    'pea': { label: 'Pea', category: 'plant', emoji: '🌱' },
    'soy': { label: 'Soy', category: 'plant', emoji: '🫘' },
    'rice': { label: 'Rice', category: 'plant', emoji: '🌾' },
    'hemp': { label: 'Hemp', category: 'plant', emoji: '🌿' },
    'peanut': { label: 'Peanut', category: 'plant', emoji: '🥜' },
    'lentil': { label: 'Lentil', category: 'plant', emoji: '🫘' },
    'blend-plant': { label: 'Plant Blend', category: 'plant', emoji: '🥗' },
    'blend-mixed': { label: 'Mixed Blend', category: 'other', emoji: '🔀' },
    'collagen': { label: 'Collagen', category: 'other', emoji: '✨' },
    'other': { label: 'Other', category: 'other', emoji: '📦' }
};

const STORES = {
    'amazon': 'Amazon',
    'costco': 'Costco',
    'walmart': 'Walmart',
    'target': 'Target',
    'gnc': 'GNC',
    'vitaminshop': 'Vitamin Shoppe',
    'wholefoods': 'Whole Foods',
    'traderjoes': "Trader Joe's",
    'other': 'Other'
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    loadProducts();
    loadFavorites();
    
    // Method toggle
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMethod(btn.dataset.method));
    });
    
    // Live calculations
    ['product-price', 'servings-count', 'protein-per-serving'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateCalculations);
    });
    
    // Form actions
    document.getElementById('add-product-btn').addEventListener('click', handleAddProduct);
    document.getElementById('update-product-btn').addEventListener('click', handleUpdateProduct);
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelEdit);
    
    // Barcode buttons
    document.getElementById('use-scanned-btn')?.addEventListener('click', useScannedProduct);
    document.getElementById('scan-again-btn')?.addEventListener('click', restartScanner);
    document.getElementById('manual-entry-btn')?.addEventListener('click', () => switchMethod('manual'));
    
    // List actions
    document.getElementById('sort-by').addEventListener('change', updateDisplay);
    document.getElementById('clear-all-btn').addEventListener('click', handleClearAll);
    
    // Header
    document.getElementById('my-list-btn').addEventListener('click', openFavoritesModal);
    
    // Modals
    document.getElementById('close-modal').addEventListener('click', closeProductModal);
    document.getElementById('close-favorites').addEventListener('click', closeFavoritesModal);
    document.getElementById('close-price-modal')?.addEventListener('click', closePriceModal);
    document.getElementById('report-price-btn')?.addEventListener('click', openPriceModal);
    document.getElementById('submit-price-btn')?.addEventListener('click', submitPriceReport);
    
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', closeAllModals);
    });
    
    updateDisplay();
    updateFavoritesCount();
    
    console.log('🥩 ProteinValue v3 initialized!');
}

// ==========================================
// INPUT METHOD
// ==========================================

function switchMethod(method) {
    state.inputMethod = method;
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
    
    document.getElementById('barcode-section').classList.toggle('hidden', method !== 'barcode');
    document.getElementById('manual-section').classList.toggle('hidden', method !== 'manual');
    
    if (method === 'barcode') {
        startBarcodeScanner();
    } else {
        stopBarcodeScanner();
    }
}

// ==========================================
// BARCODE SCANNER
// ==========================================

function startBarcodeScanner() {
    document.getElementById('scan-status').classList.add('hidden');
    document.getElementById('scan-result').classList.add('hidden');
    document.getElementById('scan-error').classList.add('hidden');
    
    if (state.scanner) return;
    
    try {
        state.scanner = new Html5Qrcode("barcode-reader");
        
        state.scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.5 },
            onBarcodeScanned,
            () => {}
        ).catch(err => {
            console.error('Scanner error:', err);
            showScanError('Could not access camera. Please allow camera permissions.');
        });
    } catch (err) {
        console.error('Scanner init error:', err);
        showScanError('Barcode scanner not supported.');
    }
}

function stopBarcodeScanner() {
    if (state.scanner) {
        state.scanner.stop().then(() => {
            state.scanner.clear();
            state.scanner = null;
        }).catch(() => {});
    }
}

function restartScanner() {
    document.getElementById('scan-result').classList.add('hidden');
    document.getElementById('scan-error').classList.add('hidden');
    state.scannedProduct = null;
    startBarcodeScanner();
}

async function onBarcodeScanned(barcode) {
    console.log('Scanned:', barcode);
    stopBarcodeScanner();
    
    document.getElementById('scan-status').classList.remove('hidden');
    
    try {
        const product = await lookupBarcode(barcode);
        document.getElementById('scan-status').classList.add('hidden');
        
        if (product) {
            state.scannedProduct = product;
            document.getElementById('scanned-product-name').textContent = product.name;
            document.getElementById('scan-result').classList.remove('hidden');
        } else {
            document.getElementById('scan-error').classList.remove('hidden');
        }
    } catch (error) {
        document.getElementById('scan-status').classList.add('hidden');
        document.getElementById('scan-error').classList.remove('hidden');
    }
}

async function lookupBarcode(barcode) {
    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        
        if (data.status === 1 && data.product) {
            const p = data.product;
            return {
                barcode: barcode,
                name: p.product_name || p.product_name_en || 'Unknown Product',
                brand: p.brands || '',
                protein: p.nutriments?.proteins_serving || p.nutriments?.proteins_100g || null,
                servingSize: p.serving_size || null
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

function useScannedProduct() {
    if (!state.scannedProduct) return;
    
    switchMethod('manual');
    
    const p = state.scannedProduct;
    document.getElementById('product-name').value = p.name || '';
    document.getElementById('product-brand').value = p.brand || '';
    document.getElementById('product-barcode').value = p.barcode || '';
    if (p.protein) document.getElementById('protein-per-serving').value = p.protein;
    
    state.scannedProduct = null;
    showSuccess('Product loaded! Add price and verify details.');
}

function showScanError(message) {
    document.getElementById('scan-status').classList.add('hidden');
    document.getElementById('scan-error').querySelector('.error-text').textContent = message;
    document.getElementById('scan-error').classList.remove('hidden');
}

// ==========================================
// CALCULATIONS
// ==========================================

function updateCalculations() {
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    const servings = parseFloat(document.getElementById('servings-count').value) || 0;
    const perServing = parseFloat(document.getElementById('protein-per-serving').value) || 0;
    
    const totalProtein = servings * perServing;
    
    document.getElementById('calc-total-protein').textContent = totalProtein > 0 ? `${totalProtein.toFixed(0)}g` : '-- g';
    
    if (price > 0 && totalProtein > 0) {
        document.getElementById('calc-cost-per-gram').textContent = `$${(price / totalProtein).toFixed(3)}`;
        document.getElementById('calc-protein-per-dollar').textContent = `${(totalProtein / price).toFixed(1)}g`;
    } else {
        document.getElementById('calc-cost-per-gram').textContent = '$--';
        document.getElementById('calc-protein-per-dollar').textContent = '-- g';
    }
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

function handleAddProduct() {
    const data = getFormData();
    if (!validateProduct(data)) return;
    
    data.totalProtein = data.servingsCount * data.proteinPerServing;
    data.costPerGram = data.price / data.totalProtein;
    data.proteinPerDollar = data.totalProtein / data.price;
    data.id = Date.now();
    data.createdAt = new Date().toISOString();
    
    state.products.push(data);
    saveProducts();
    updateDisplay();
    clearForm();
    showSuccess(`Added: ${data.name}`);
}

function handleUpdateProduct() {
    if (!state.editingProductId) return;
    
    const data = getFormData();
    if (!validateProduct(data)) return;
    
    data.totalProtein = data.servingsCount * data.proteinPerServing;
    data.costPerGram = data.price / data.totalProtein;
    data.proteinPerDollar = data.totalProtein / data.price;
    
    const index = state.products.findIndex(p => p.id === state.editingProductId);
    if (index !== -1) {
        data.id = state.editingProductId;
        data.createdAt = state.products[index].createdAt;
        data.updatedAt = new Date().toISOString();
        state.products[index] = data;
    }
    
    saveProducts();
    updateDisplay();
    cancelEdit();
    closeProductModal();
    showSuccess(`Updated: ${data.name}`);
}

function getFormData() {
    return {
        name: document.getElementById('product-name').value.trim(),
        brand: document.getElementById('product-brand').value.trim(),
        barcode: document.getElementById('product-barcode').value.trim(),
        source: document.getElementById('protein-source').value,
        price: parseFloat(document.getElementById('product-price').value) || 0,
        store: document.getElementById('product-store').value,
        containerSize: document.getElementById('container-size').value,
        containerUnit: document.getElementById('container-unit').value,
        servingsCount: parseFloat(document.getElementById('servings-count').value) || 0,
        proteinPerServing: parseFloat(document.getElementById('protein-per-serving').value) || 0,
        servingSize: document.getElementById('serving-size').value,
        servingUnit: document.getElementById('serving-unit').value,
        notes: document.getElementById('product-notes').value.trim()
    };
}

function validateProduct(data) {
    hideError();
    if (!data.name) { showError('Please enter a product name'); return false; }
    if (!data.source) { showError('Please select a protein source'); return false; }
    if (data.price <= 0) { showError('Please enter a valid price'); return false; }
    if (data.servingsCount <= 0 || data.proteinPerServing <= 0) { 
        showError('Please enter servings and protein per serving'); return false; 
    }
    return true;
}

function editProduct(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    state.editingProductId = id;
    switchMethod('manual');
    
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-brand').value = product.brand || '';
    document.getElementById('product-barcode').value = product.barcode || '';
    document.getElementById('protein-source').value = product.source || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-store').value = product.store || '';
    document.getElementById('container-size').value = product.containerSize || '';
    document.getElementById('container-unit').value = product.containerUnit || 'lb';
    document.getElementById('servings-count').value = product.servingsCount || '';
    document.getElementById('protein-per-serving').value = product.proteinPerServing || '';
    document.getElementById('serving-size').value = product.servingSize || '';
    document.getElementById('serving-unit').value = product.servingUnit || 'g';
    document.getElementById('product-notes').value = product.notes || '';
    
    document.getElementById('form-title').textContent = '✏️ Edit Product';
    document.getElementById('add-product-btn').classList.add('hidden');
    document.getElementById('update-product-btn').classList.remove('hidden');
    document.getElementById('cancel-edit-btn').classList.remove('hidden');
    
    updateCalculations();
    closeProductModal();
    document.querySelector('.sidebar').scrollTop = 0;
}

function cancelEdit() {
    state.editingProductId = null;
    document.getElementById('form-title').textContent = '➕ Add Product';
    document.getElementById('add-product-btn').classList.remove('hidden');
    document.getElementById('update-product-btn').classList.add('hidden');
    document.getElementById('cancel-edit-btn').classList.add('hidden');
    clearForm();
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    state.products = state.products.filter(p => p.id !== id);
    state.favorites = state.favorites.filter(fid => fid !== id);
    saveProducts();
    saveFavorites();
    updateDisplay();
    updateFavoritesCount();
    closeProductModal();
}

function clearForm() {
    ['product-name', 'product-brand', 'product-barcode', 'protein-source', 
     'product-price', 'product-store', 'container-size', 'servings-count',
     'protein-per-serving', 'serving-size', 'product-notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('calc-total-protein').textContent = '-- g';
    document.getElementById('calc-cost-per-gram').textContent = '$--';
    document.getElementById('calc-protein-per-dollar').textContent = '-- g';
}

function handleClearAll() {
    if (state.products.length === 0) return;
    if (confirm('Clear all products?')) {
        state.products = [];
        state.favorites = [];
        saveProducts();
        saveFavorites();
        updateDisplay();
        updateFavoritesCount();
    }
}

// ==========================================
// FAVORITES
// ==========================================

function toggleFavorite(id) {
    const index = state.favorites.indexOf(id);
    if (index === -1) state.favorites.push(id);
    else state.favorites.splice(index, 1);
    saveFavorites();
    updateDisplay();
    updateFavoritesCount();
}

function updateFavoritesCount() {
    const badge = document.getElementById('favorites-count');
    badge.textContent = state.favorites.length;
    badge.classList.toggle('hidden', state.favorites.length === 0);
}

// ==========================================
// STORAGE
// ==========================================

function saveProducts() {
    localStorage.setItem('proteinvalue_products', JSON.stringify(state.products));
}

function loadProducts() {
    try {
        state.products = JSON.parse(localStorage.getItem('proteinvalue_products')) || [];
    } catch { state.products = []; }
}

function saveFavorites() {
    localStorage.setItem('proteinvalue_favorites', JSON.stringify(state.favorites));
}

function loadFavorites() {
    try {
        state.favorites = JSON.parse(localStorage.getItem('proteinvalue_favorites')) || [];
    } catch { state.favorites = []; }
}

// ==========================================
// DISPLAY
// ==========================================

function updateDisplay() {
    const resultsSection = document.getElementById('results-section');
    const chartPlaceholder = document.getElementById('chart-placeholder');
    const chartCanvas = document.getElementById('comparison-chart');
    
    if (state.products.length === 0) {
        resultsSection.classList.add('hidden');
        chartPlaceholder.classList.remove('hidden');
        chartCanvas.classList.add('hidden');
        return;
    }
    
    resultsSection.classList.remove('hidden');
    chartPlaceholder.classList.add('hidden');
    chartCanvas.classList.remove('hidden');
    
    const sortBy = document.getElementById('sort-by').value;
    const sorted = sortProducts([...state.products], sortBy);
    const best = sorted[0];
    
    document.getElementById('best-product-name').textContent = best.name;
    document.getElementById('best-product-brand').textContent = best.brand || '';
    document.getElementById('best-cost-per-gram').textContent = `$${best.costPerGram.toFixed(3)}`;
    document.getElementById('best-protein-per-dollar').textContent = `${best.proteinPerDollar.toFixed(1)}g`;
    
    document.getElementById('total-products').textContent = state.products.length;
    document.getElementById('diversity-count').textContent = new Set(state.products.map(p => p.source)).size;
    
    if (state.products.length > 1) {
        const worst = [...state.products].sort((a, b) => b.costPerGram - a.costPerGram)[0];
        document.getElementById('savings-percent').textContent = 
            `${((worst.costPerGram - best.costPerGram) / worst.costPerGram * 100).toFixed(0)}%`;
    } else {
        document.getElementById('savings-percent').textContent = '--';
    }
    
    updateDiversity();
    updateProductsList(sorted);
    updateChart(sorted);
}

function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'cost-asc': return products.sort((a, b) => a.costPerGram - b.costPerGram);
        case 'cost-desc': return products.sort((a, b) => b.costPerGram - a.costPerGram);
        case 'name-asc': return products.sort((a, b) => a.name.localeCompare(b.name));
        case 'date-desc': return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        default: return products.sort((a, b) => a.costPerGram - b.costPerGram);
    }
}

function updateDiversity() {
    const sources = [...new Set(state.products.map(p => p.source))];
    document.getElementById('diversity-sources').innerHTML = sources.map(s => {
        const info = PROTEIN_SOURCES[s] || { label: s, category: 'other', emoji: '📦' };
        return `<span class="source-tag ${info.category}">${info.emoji} ${info.label}</span>`;
    }).join('');
    
    const hasAnimal = sources.some(s => PROTEIN_SOURCES[s]?.category === 'animal');
    const hasPlant = sources.some(s => PROTEIN_SOURCES[s]?.category === 'plant');
    
    document.getElementById('diversity-tip').textContent = 
        sources.length === 1 ? '💡 Add different sources for better nutrition!' :
        hasAnimal && hasPlant ? '🌟 Great mix of animal and plant proteins!' :
        '👍 Good variety! Consider mixing protein types.';
}

function updateProductsList(sorted) {
    const bestId = sorted[0]?.id;
    document.getElementById('products-list').innerHTML = sorted.map((p, i) => {
        const info = PROTEIN_SOURCES[p.source] || { label: p.source, emoji: '📦' };
        const isBest = p.id === bestId;
        const isFav = state.favorites.includes(p.id);
        const store = STORES[p.store] || '';
        
        return `
            <div class="product-item ${isBest ? 'best' : ''}" data-id="${p.id}">
                <div class="product-rank">${isBest ? '🏆' : i + 1}</div>
                <div class="product-info" onclick="openProductModal(${p.id})">
                    <div class="product-name">${escapeHtml(p.name)}</div>
                    <div class="product-meta">
                        <span>${info.emoji} ${info.label}</span>
                        <span>$${p.price.toFixed(2)}</span>
                        ${store ? `<span>@ ${store}</span>` : ''}
                    </div>
                </div>
                <div class="product-values" onclick="openProductModal(${p.id})">
                    <div class="product-cost">$${p.costPerGram.toFixed(3)}<small>/g</small></div>
                    <div class="product-protein">${p.proteinPerDollar.toFixed(1)}g/$1</div>
                </div>
                <div class="product-actions">
                    <button class="product-action-btn favorite ${isFav ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite(${p.id})">
                        ${isFav ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateChart(sorted) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    if (state.chart) state.chart.destroy();
    
    state.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(p => truncateText(p.name, 12)),
            datasets: [{
                label: 'Protein per $1 (g)',
                data: sorted.map(p => p.proteinPerDollar),
                backgroundColor: sorted.map((_, i) => 
                    i === 0 ? '#f59e0b' : i === 1 ? '#10b981' : i === 2 ? '#6366f1' : '#9ca3af'
                ),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: ctx => sorted[ctx[0].dataIndex].name,
                        label: ctx => [
                            `${ctx.parsed.y.toFixed(1)}g protein per $1`,
                            `$${sorted[ctx.dataIndex].costPerGram.toFixed(3)} per gram`
                        ]
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Protein per Dollar (g/$)' } },
                x: { ticks: { maxRotation: 45 } }
            }
        }
    });
}

// ==========================================
// MODALS
// ==========================================

function openProductModal(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;
    
    const info = PROTEIN_SOURCES[p.source] || { label: p.source, emoji: '📦' };
    const store = STORES[p.store] || '';
    const isFav = state.favorites.includes(p.id);
    
    document.getElementById('modal-body').innerHTML = `
        <div class="modal-product-header">
            <h2>${escapeHtml(p.name)}</h2>
            ${p.brand ? `<p class="brand">${escapeHtml(p.brand)}</p>` : ''}
        </div>
        <div class="modal-stats">
            <div class="modal-stat highlight">
                <div class="label">Cost/Gram</div>
                <div class="value">$${p.costPerGram.toFixed(3)}</div>
            </div>
            <div class="modal-stat">
                <div class="label">Protein/$1</div>
                <div class="value">${p.proteinPerDollar.toFixed(1)}g</div>
            </div>
        </div>
        <div class="modal-details">
            <div class="modal-detail-row"><span>Source</span><strong>${info.emoji} ${info.label}</strong></div>
            <div class="modal-detail-row"><span>Price</span><strong>$${p.price.toFixed(2)}${store ? ` @ ${store}` : ''}</strong></div>
            ${p.containerSize ? `<div class="modal-detail-row"><span>Container</span><strong>${p.containerSize} ${p.containerUnit}</strong></div>` : ''}
            <div class="modal-detail-row"><span>Total Protein</span><strong>${p.totalProtein.toFixed(0)}g</strong></div>
            <div class="modal-detail-row"><span>Servings</span><strong>${p.servingsCount}</strong></div>
            <div class="modal-detail-row"><span>Protein/Serving</span><strong>${p.proteinPerServing}g</strong></div>
            ${p.servingSize ? `<div class="modal-detail-row"><span>Serving Size</span><strong>${p.servingSize} ${p.servingUnit}</strong></div>` : ''}
            ${p.barcode ? `<div class="modal-detail-row"><span>Barcode</span><strong>${p.barcode}</strong></div>` : ''}
        </div>
        ${p.notes ? `<div class="modal-notes"><strong>Notes</strong>${escapeHtml(p.notes)}</div>` : ''}
        <div class="modal-actions">
            <button class="btn-edit" onclick="editProduct(${p.id})">✏️ Edit</button>
            <button class="btn-secondary" onclick="toggleFavorite(${p.id}); closeProductModal();">${isFav ? '💔 Unfavorite' : '❤️ Favorite'}</button>
            <button class="btn-danger" onclick="deleteProduct(${p.id})">🗑️ Delete</button>
        </div>
    `;
    document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

function openFavoritesModal() {
    const favProducts = state.products.filter(p => state.favorites.includes(p.id));
    document.getElementById('no-favorites').classList.toggle('hidden', favProducts.length > 0);
    document.getElementById('favorites-list').innerHTML = favProducts.map(p => {
        const info = PROTEIN_SOURCES[p.source] || { label: p.source, emoji: '📦' };
        return `
            <div class="favorite-item" onclick="closeFavoritesModal(); openProductModal(${p.id})">
                <div class="product-info">
                    <div class="product-name">${escapeHtml(p.name)}</div>
                    <div class="product-meta">${info.emoji} ${info.label} • $${p.costPerGram.toFixed(3)}/g</div>
                </div>
                <button class="product-action-btn" onclick="event.stopPropagation(); toggleFavorite(${p.id}); openFavoritesModal();">❤️</button>
            </div>
        `;
    }).join('');
    document.getElementById('favorites-modal').classList.remove('hidden');
}

function closeFavoritesModal() {
    document.getElementById('favorites-modal').classList.add('hidden');
}

function openPriceModal() {
    document.getElementById('report-product').innerHTML = '<option value="">-- Select --</option>' + 
        state.products.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    document.getElementById('price-modal').classList.remove('hidden');
}

function closePriceModal() {
    document.getElementById('price-modal').classList.add('hidden');
}

function closeAllModals() {
    closeProductModal();
    closeFavoritesModal();
    closePriceModal();
}

function submitPriceReport() {
    alert('Thank you! Price reports coming in future update.');
    closePriceModal();
}

// ==========================================
// HELPERS
// ==========================================

function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = '❌ ' + msg;
    el.className = 'error-message';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showSuccess(msg) {
    const el = document.getElementById('error-message');
    el.textContent = '✅ ' + msg;
    el.className = 'success-message';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, max) {
    if (!text) return '';
    return text.length <= max ? text : text.substring(0, max) + '...';
}

// Global functions
window.openProductModal = openProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.toggleFavorite = toggleFavorite;
window.closeProductModal = closeProductModal;
window.closeFavoritesModal = closeFavoritesModal;
window.closePriceModal = closePriceModal;
