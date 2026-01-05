/**
 * ProteinValue v2 - World Class Protein Shopping Calculator
 * Features: Step wizard, photo reference, bulk buying, diversity tracking
 */

// ==========================================
// STATE & CONFIGURATION
// ==========================================

const state = {
    currentStep: 1,
    products: [],
    photos: {
        product: null,
        label: null
    },
    chart: null
};

const PROTEIN_SOURCES = {
    // Animal-based
    'whey': { label: 'Whey', category: 'animal', emoji: '🥛' },
    'whey-isolate': { label: 'Whey Isolate', category: 'animal', emoji: '🥛' },
    'casein': { label: 'Casein', category: 'animal', emoji: '🥛' },
    'egg': { label: 'Egg White', category: 'animal', emoji: '🥚' },
    'beef': { label: 'Beef', category: 'animal', emoji: '🥩' },
    'chicken': { label: 'Chicken', category: 'animal', emoji: '🍗' },
    'fish': { label: 'Fish', category: 'animal', emoji: '🐟' },
    'dairy': { label: 'Dairy', category: 'animal', emoji: '🧀' },
    // Plant-based
    'pea': { label: 'Pea', category: 'plant', emoji: '🌱' },
    'soy': { label: 'Soy', category: 'plant', emoji: '🫘' },
    'rice': { label: 'Rice', category: 'plant', emoji: '🌾' },
    'hemp': { label: 'Hemp', category: 'plant', emoji: '🌿' },
    'peanut': { label: 'Peanut', category: 'plant', emoji: '🥜' },
    'lentil': { label: 'Lentil', category: 'plant', emoji: '🫘' },
    'blend-plant': { label: 'Plant Blend', category: 'plant', emoji: '🥗' },
    // Other
    'blend-mixed': { label: 'Mixed Blend', category: 'other', emoji: '🔀' },
    'collagen': { label: 'Collagen', category: 'other', emoji: '✨' },
    'other': { label: 'Other', category: 'other', emoji: '📦' }
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Load saved products
    loadProducts();
    
    // Step navigation
    document.getElementById('next-to-step-2').addEventListener('click', () => goToStep(2));
    document.getElementById('skip-photos-btn').addEventListener('click', () => goToStep(2));
    document.getElementById('back-to-step-1').addEventListener('click', () => goToStep(1));
    document.getElementById('add-another-btn').addEventListener('click', () => {
        resetForm();
        goToStep(1);
    });
    
    // Photo capture - Product
    document.getElementById('capture-product-btn').addEventListener('click', () => {
        document.getElementById('product-photo-input').click();
    });
    document.getElementById('product-photo-input').addEventListener('change', (e) => {
        handlePhotoCapture(e, 'product');
    });
    document.getElementById('retake-product-btn').addEventListener('click', () => {
        retakePhoto('product');
    });
    
    // Photo capture - Label
    document.getElementById('capture-label-btn').addEventListener('click', () => {
        document.getElementById('label-photo-input').click();
    });
    document.getElementById('label-photo-input').addEventListener('change', (e) => {
        handlePhotoCapture(e, 'label');
    });
    document.getElementById('retake-label-btn').addEventListener('click', () => {
        retakePhoto('label');
    });
    
    // Toggle photo reference
    document.getElementById('toggle-photos-btn').addEventListener('click', togglePhotoReference);
    
    // Calculation method toggle
    document.querySelectorAll('input[name="calc-method"]').forEach(input => {
        input.addEventListener('change', handleCalcMethodChange);
    });
    
    // Live calculations
    document.getElementById('product-price').addEventListener('input', updateCalculations);
    document.getElementById('servings-count').addEventListener('input', updateCalculations);
    document.getElementById('protein-per-serving').addEventListener('input', updateCalculations);
    document.getElementById('total-protein').addEventListener('input', updateCalculations);
    
    // Add product
    document.getElementById('add-product-btn').addEventListener('click', handleAddProduct);
    
    // Clear all
    document.getElementById('clear-all-btn').addEventListener('click', handleClearAll);
    
    // Sort
    document.getElementById('sort-by').addEventListener('change', updateDisplay);
    
    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('product-modal').addEventListener('click', (e) => {
        if (e.target.id === 'product-modal') closeModal();
    });
    
    // Initial display update
    updateDisplay();
    
    // If we have products, go to step 3
    if (state.products.length > 0) {
        goToStep(3);
    }
    
    console.log('🥩 ProteinValue v2 initialized!');
}

// ==========================================
// STEP NAVIGATION
// ==========================================

function goToStep(step) {
    state.currentStep = step;
    
    // Update step indicator
    document.querySelectorAll('.step-indicator .step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < step) {
            el.classList.add('completed');
        } else if (i + 1 === step) {
            el.classList.add('active');
        }
    });
    
    // Show/hide step content
    document.querySelectorAll('.step-content').forEach((el, i) => {
        el.classList.toggle('hidden', i + 1 !== step);
    });
    
    // Step-specific actions
    if (step === 2) {
        setupPhotoReference();
    }
    
    if (step === 3) {
        updateDisplay();
    }
    
    // Scroll to top
    document.querySelector('.sidebar').scrollTop = 0;
}

// ==========================================
// PHOTO HANDLING
// ==========================================

function handlePhotoCapture(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        state.photos[type] = imageData;
        
        // Update UI
        const img = document.getElementById(`${type}-photo-img`);
        const preview = document.getElementById(`${type}-photo-preview`);
        const retakeBtn = document.getElementById(`retake-${type}-btn`);
        
        img.src = imageData;
        img.classList.remove('hidden');
        preview.classList.add('hidden');
        retakeBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function retakePhoto(type) {
    state.photos[type] = null;
    
    const img = document.getElementById(`${type}-photo-img`);
    const preview = document.getElementById(`${type}-photo-preview`);
    const retakeBtn = document.getElementById(`retake-${type}-btn`);
    const input = document.getElementById(`${type}-photo-input`);
    
    img.classList.add('hidden');
    img.src = '';
    preview.classList.remove('hidden');
    retakeBtn.classList.add('hidden');
    input.value = '';
}

function setupPhotoReference() {
    const container = document.getElementById('photo-reference');
    const productRef = document.getElementById('ref-product-img');
    const labelRef = document.getElementById('ref-label-img');
    
    let hasPhotos = false;
    
    if (state.photos.product) {
        productRef.src = state.photos.product;
        productRef.classList.remove('hidden');
        hasPhotos = true;
    } else {
        productRef.classList.add('hidden');
    }
    
    if (state.photos.label) {
        labelRef.src = state.photos.label;
        labelRef.classList.remove('hidden');
        hasPhotos = true;
    } else {
        labelRef.classList.add('hidden');
    }
    
    container.classList.toggle('hidden', !hasPhotos);
}

function togglePhotoReference() {
    const images = document.getElementById('reference-images');
    const btn = document.getElementById('toggle-photos-btn');
    
    if (images.style.display === 'none') {
        images.style.display = 'flex';
        btn.textContent = 'Hide';
    } else {
        images.style.display = 'none';
        btn.textContent = 'Show';
    }
}

// ==========================================
// CALCULATION METHODS
// ==========================================

function handleCalcMethodChange(e) {
    const method = e.target.value;
    
    document.getElementById('per-serving-inputs').classList.toggle('hidden', method !== 'per-serving');
    document.getElementById('total-inputs').classList.toggle('hidden', method !== 'total');
    
    updateCalculations();
}

function updateCalculations() {
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    const method = document.querySelector('input[name="calc-method"]:checked').value;
    
    let totalProtein = 0;
    
    if (method === 'per-serving') {
        const servings = parseFloat(document.getElementById('servings-count').value) || 0;
        const perServing = parseFloat(document.getElementById('protein-per-serving').value) || 0;
        totalProtein = servings * perServing;
    } else {
        totalProtein = parseFloat(document.getElementById('total-protein').value) || 0;
    }
    
    // Update display
    document.getElementById('calc-total-protein').textContent = 
        totalProtein > 0 ? `${totalProtein.toFixed(0)}g` : '-- g';
    
    if (price > 0 && totalProtein > 0) {
        const costPerGram = price / totalProtein;
        const proteinPerDollar = totalProtein / price;
        
        document.getElementById('calc-cost-per-gram').textContent = `$${costPerGram.toFixed(3)}`;
        document.getElementById('calc-protein-per-dollar').textContent = `${proteinPerDollar.toFixed(1)}g`;
    } else {
        document.getElementById('calc-cost-per-gram').textContent = '$--';
        document.getElementById('calc-protein-per-dollar').textContent = '-- g';
    }
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

function handleAddProduct() {
    hideError();
    
    // Gather data
    const name = document.getElementById('product-name').value.trim();
    const brand = document.getElementById('product-brand').value.trim();
    const source = document.getElementById('protein-source').value;
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    const containerSize = document.getElementById('container-size').value;
    const containerUnit = document.getElementById('container-unit').value;
    const servingSize = document.getElementById('serving-size').value;
    const servingUnit = document.getElementById('serving-unit').value;
    const notes = document.getElementById('product-notes').value.trim();
    const contribute = document.getElementById('contribute-data').checked;
    
    const method = document.querySelector('input[name="calc-method"]:checked').value;
    let totalProtein = 0;
    let servingsCount = 0;
    let proteinPerServing = 0;
    
    if (method === 'per-serving') {
        servingsCount = parseFloat(document.getElementById('servings-count').value) || 0;
        proteinPerServing = parseFloat(document.getElementById('protein-per-serving').value) || 0;
        totalProtein = servingsCount * proteinPerServing;
    } else {
        totalProtein = parseFloat(document.getElementById('total-protein').value) || 0;
    }
    
    // Validate
    if (!name) {
        showError('Please enter a product name');
        return;
    }
    
    if (!source) {
        showError('Please select a protein source');
        return;
    }
    
    if (price <= 0) {
        showError('Please enter a valid price');
        return;
    }
    
    if (totalProtein <= 0) {
        showError('Please enter protein content');
        return;
    }
    
    // Calculate values
    const costPerGram = price / totalProtein;
    const proteinPerDollar = totalProtein / price;
    
    // Create product object
    const product = {
        id: Date.now(),
        name,
        brand,
        source,
        price,
        containerSize: containerSize ? `${containerSize} ${containerUnit}` : null,
        servingsCount,
        proteinPerServing,
        servingSize: servingSize ? `${servingSize} ${servingUnit}` : null,
        totalProtein,
        costPerGram,
        proteinPerDollar,
        notes,
        contribute,
        photos: { ...state.photos },
        createdAt: new Date().toISOString()
    };
    
    // Add to state
    state.products.push(product);
    
    // Save
    saveProducts();
    
    // Go to comparison
    goToStep(3);
    
    // Show success
    showSuccess(`Added: ${name}`);
}

function deleteProduct(id) {
    state.products = state.products.filter(p => p.id !== id);
    saveProducts();
    updateDisplay();
    
    if (state.products.length === 0) {
        resetForm();
        goToStep(1);
    }
}

function handleClearAll() {
    if (state.products.length === 0) return;
    
    if (confirm('Clear all products? This cannot be undone.')) {
        state.products = [];
        saveProducts();
        resetForm();
        goToStep(1);
    }
}

function resetForm() {
    // Reset photos
    state.photos = { product: null, label: null };
    retakePhoto('product');
    retakePhoto('label');
    
    // Reset form fields
    document.getElementById('product-name').value = '';
    document.getElementById('product-brand').value = '';
    document.getElementById('protein-source').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('container-size').value = '';
    document.getElementById('servings-count').value = '';
    document.getElementById('protein-per-serving').value = '';
    document.getElementById('serving-size').value = '';
    document.getElementById('total-protein').value = '';
    document.getElementById('product-notes').value = '';
    
    // Reset calc method
    document.querySelector('input[name="calc-method"][value="per-serving"]').checked = true;
    document.getElementById('per-serving-inputs').classList.remove('hidden');
    document.getElementById('total-inputs').classList.add('hidden');
    
    // Reset calculations display
    document.getElementById('calc-total-protein').textContent = '-- g';
    document.getElementById('calc-cost-per-gram').textContent = '$--';
    document.getElementById('calc-protein-per-dollar').textContent = '-- g';
}

// ==========================================
// STORAGE
// ==========================================

function saveProducts() {
    // Don't save photos to localStorage (too large)
    const toSave = state.products.map(p => ({
        ...p,
        photos: null // Strip photos for storage
    }));
    localStorage.setItem('proteinvalue_products', JSON.stringify(toSave));
}

function loadProducts() {
    const saved = localStorage.getItem('proteinvalue_products');
    if (saved) {
        try {
            state.products = JSON.parse(saved);
        } catch (e) {
            state.products = [];
        }
    }
}

// ==========================================
// DISPLAY & SORTING
// ==========================================

function updateDisplay() {
    if (state.products.length === 0) {
        document.getElementById('chart-placeholder').classList.remove('hidden');
        document.getElementById('comparison-chart').classList.add('hidden');
        return;
    }
    
    // Sort products
    const sortBy = document.getElementById('sort-by').value;
    const sorted = sortProducts([...state.products], sortBy);
    const best = sorted[0];
    
    // Update best value card
    document.getElementById('best-product-name').textContent = best.name;
    document.getElementById('best-product-brand').textContent = best.brand || '';
    document.getElementById('best-cost-per-gram').textContent = `$${best.costPerGram.toFixed(3)}`;
    document.getElementById('best-protein-per-dollar').textContent = `${best.proteinPerDollar.toFixed(1)}g`;
    
    // Update quick stats
    document.getElementById('total-products').textContent = state.products.length;
    
    const sources = new Set(state.products.map(p => p.source));
    document.getElementById('diversity-count').textContent = sources.size;
    
    // Calculate savings (best vs worst)
    if (state.products.length > 1) {
        const avgCost = state.products.reduce((sum, p) => sum + p.costPerGram, 0) / state.products.length;
        const savings = ((avgCost - best.costPerGram) / avgCost * 100).toFixed(0);
        document.getElementById('savings-percent').textContent = `${savings}%`;
    } else {
        document.getElementById('savings-percent').textContent = '--';
    }
    
    // Update diversity
    updateDiversity();
    
    // Update products list
    updateProductsList(sorted);
    
    // Update chart
    updateChart(sorted);
}

function sortProducts(products, sortBy) {
    switch (sortBy) {
        case 'cost-asc':
            return products.sort((a, b) => a.costPerGram - b.costPerGram);
        case 'cost-desc':
            return products.sort((a, b) => b.costPerGram - a.costPerGram);
        case 'protein-desc':
            return products.sort((a, b) => b.proteinPerDollar - a.proteinPerDollar);
        case 'name-asc':
            return products.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return products.sort((a, b) => a.costPerGram - b.costPerGram);
    }
}

function updateDiversity() {
    const sources = new Set(state.products.map(p => p.source));
    const uniqueSources = [...sources];
    
    const container = document.getElementById('diversity-sources');
    container.innerHTML = uniqueSources.map(source => {
        const info = PROTEIN_SOURCES[source] || { label: source, category: 'other', emoji: '📦' };
        return `<span class="source-tag ${info.category}">${info.emoji} ${info.label}</span>`;
    }).join('');
    
    // Update tip
    const tip = document.getElementById('diversity-tip');
    const hasAnimal = uniqueSources.some(s => PROTEIN_SOURCES[s]?.category === 'animal');
    const hasPlant = uniqueSources.some(s => PROTEIN_SOURCES[s]?.category === 'plant');
    
    if (uniqueSources.length === 1) {
        tip.textContent = '💡 Try adding products from different sources for better nutrition!';
    } else if (hasAnimal && hasPlant) {
        tip.textContent = '🌟 Great mix of animal and plant proteins!';
    } else if (uniqueSources.length < 3) {
        tip.textContent = '👍 Good start! Consider adding more variety.';
    } else {
        tip.textContent = '🌟 Excellent protein diversity!';
    }
}

function updateProductsList(sorted) {
    const container = document.getElementById('products-list');
    const bestId = sorted[0]?.id;
    
    container.innerHTML = sorted.map((product, index) => {
        const sourceInfo = PROTEIN_SOURCES[product.source] || { label: product.source, category: 'other', emoji: '📦' };
        const isBest = product.id === bestId;
        
        return `
            <div class="product-item ${isBest ? 'best' : ''}" data-id="${product.id}" onclick="showProductDetail(${product.id})">
                <div class="product-rank">${isBest ? '🏆' : index + 1}</div>
                <div class="product-info">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-meta">
                        <span class="product-source-badge ${sourceInfo.category}">${sourceInfo.emoji} ${sourceInfo.label}</span>
                        <span>$${product.price.toFixed(2)}</span>
                        <span>${product.totalProtein}g protein</span>
                    </div>
                </div>
                <div class="product-values">
                    <div class="product-cost">$${product.costPerGram.toFixed(3)}<small>/g</small></div>
                    <div class="product-protein">${product.proteinPerDollar.toFixed(1)}g/$1</div>
                </div>
                <button class="product-delete" onclick="event.stopPropagation(); deleteProduct(${product.id})">🗑️</button>
            </div>
        `;
    }).join('');
}

function updateChart(sorted) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    const placeholder = document.getElementById('chart-placeholder');
    const canvas = document.getElementById('comparison-chart');
    
    placeholder.classList.add('hidden');
    canvas.classList.remove('hidden');
    
    // Destroy existing chart
    if (state.chart) {
        state.chart.destroy();
    }
    
    // Prepare data (show protein per dollar - higher is better)
    const labels = sorted.map(p => truncateText(p.name, 12));
    const data = sorted.map(p => p.proteinPerDollar);
    
    // Colors
    const colors = sorted.map((_, i) => {
        if (i === 0) return '#f59e0b'; // Gold for best
        if (i === 1) return '#10b981'; // Green for second
        if (i === 2) return '#6366f1'; // Purple for third
        return '#9ca3af'; // Gray for rest
    });
    
    state.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Grams of Protein per $1',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 0,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(context) {
                            return sorted[context[0].dataIndex].name;
                        },
                        label: function(context) {
                            const product = sorted[context.dataIndex];
                            return [
                                `${context.parsed.y.toFixed(1)}g protein per $1`,
                                `$${product.costPerGram.toFixed(3)} per gram`,
                                `$${product.price.toFixed(2)} total`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f3f4f6'
                    },
                    title: {
                        display: true,
                        text: 'Protein per Dollar (g/$)',
                        font: { size: 12, weight: '600' },
                        color: '#6b7280'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// ==========================================
// PRODUCT DETAIL MODAL
// ==========================================

function showProductDetail(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const sourceInfo = PROTEIN_SOURCES[product.source] || { label: product.source, emoji: '📦' };
    
    const modal = document.getElementById('product-modal');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <div class="modal-product">
            <h2>${escapeHtml(product.name)}</h2>
            ${product.brand ? `<p class="modal-brand">${escapeHtml(product.brand)}</p>` : ''}
            
            <div class="modal-stats">
                <div class="modal-stat highlight">
                    <span class="ms-label">Cost per Gram</span>
                    <span class="ms-value">$${product.costPerGram.toFixed(3)}</span>
                </div>
                <div class="modal-stat">
                    <span class="ms-label">Protein per $1</span>
                    <span class="ms-value">${product.proteinPerDollar.toFixed(1)}g</span>
                </div>
            </div>
            
            <div class="modal-details">
                <div class="md-row">
                    <span>Source:</span>
                    <strong>${sourceInfo.emoji} ${sourceInfo.label}</strong>
                </div>
                <div class="md-row">
                    <span>Price:</span>
                    <strong>$${product.price.toFixed(2)}</strong>
                </div>
                ${product.containerSize ? `
                <div class="md-row">
                    <span>Container:</span>
                    <strong>${product.containerSize}</strong>
                </div>
                ` : ''}
                <div class="md-row">
                    <span>Total Protein:</span>
                    <strong>${product.totalProtein}g</strong>
                </div>
                ${product.servingsCount ? `
                <div class="md-row">
                    <span>Servings:</span>
                    <strong>${product.servingsCount}</strong>
                </div>
                <div class="md-row">
                    <span>Protein/Serving:</span>
                    <strong>${product.proteinPerServing}g</strong>
                </div>
                ` : ''}
                ${product.servingSize ? `
                <div class="md-row">
                    <span>Serving Size:</span>
                    <strong>${product.servingSize}</strong>
                </div>
                ` : ''}
            </div>
            
            ${product.notes ? `
            <div class="modal-notes">
                <strong>Notes:</strong>
                <p>${escapeHtml(product.notes)}</p>
            </div>
            ` : ''}
            
            <button class="modal-delete-btn" onclick="deleteProduct(${product.id}); closeModal();">
                🗑️ Delete Product
            </button>
        </div>
    `;
    
    // Add modal styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal-product h2 { font-size: 20px; margin-bottom: 4px; }
            .modal-brand { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
            .modal-stats { display: flex; gap: 16px; margin-bottom: 24px; }
            .modal-stat { flex: 1; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center; }
            .modal-stat.highlight { background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
            .ms-label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
            .ms-value { font-size: 24px; font-weight: 800; color: #047857; }
            .modal-details { margin-bottom: 20px; }
            .md-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .md-row span { color: #6b7280; }
            .modal-notes { padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            .modal-notes strong { display: block; margin-bottom: 4px; }
            .modal-notes p { color: #4b5563; margin: 0; }
            .modal-delete-btn { width: 100%; padding: 12px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
            .modal-delete-btn:hover { background: #fee2e2; }
        `;
        document.head.appendChild(styles);
    }
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

// ==========================================
// UI HELPERS
// ==========================================

function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = '❌ ' + msg;
    el.style.background = '#fef2f2';
    el.style.borderColor = '#fecaca';
    el.style.color = '#dc2626';
    el.classList.remove('hidden');
    
    setTimeout(() => el.classList.add('hidden'), 5000);
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}

function showSuccess(msg) {
    const el = document.getElementById('error-message');
    el.textContent = '✅ ' + msg;
    el.style.background = '#f0fdf4';
    el.style.borderColor = '#86efac';
    el.style.color = '#15803d';
    el.classList.remove('hidden');
    
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Make functions available globally
window.deleteProduct = deleteProduct;
window.showProductDetail = showProductDetail;
window.closeModal = closeModal;
