/**
 * ProteinValue - Smart Protein Shopping Calculator
 * Features: OCR label reading, cost comparison, diversity tracking
 */

// ==========================================
// STATE & CONFIGURATION
// ==========================================

const state = {
    products: [],
    inputMode: 'manual',
    cameraStream: null,
    chart: null,
    ocrWorker: null,
    detectedValues: {
        protein: null,
        servings: null
    }
};

const PROTEIN_SOURCES = {
    // Animal-based
    whey: { label: 'Whey', category: 'animal', emoji: '🥛' },
    casein: { label: 'Casein', category: 'animal', emoji: '🥛' },
    egg: { label: 'Egg White', category: 'animal', emoji: '🥚' },
    beef: { label: 'Beef', category: 'animal', emoji: '🥩' },
    chicken: { label: 'Chicken', category: 'animal', emoji: '🍗' },
    fish: { label: 'Fish', category: 'animal', emoji: '🐟' },
    dairy: { label: 'Dairy', category: 'animal', emoji: '🧀' },
    // Plant-based
    pea: { label: 'Pea', category: 'plant', emoji: '🌱' },
    soy: { label: 'Soy', category: 'plant', emoji: '🫘' },
    rice: { label: 'Rice', category: 'plant', emoji: '🌾' },
    hemp: { label: 'Hemp', category: 'plant', emoji: '🌿' },
    peanut: { label: 'Peanut', category: 'plant', emoji: '🥜' },
    'blend-plant': { label: 'Plant Blend', category: 'plant', emoji: '🥗' },
    // Mixed/Other
    'blend-mixed': { label: 'Mixed Blend', category: 'mixed', emoji: '🔀' },
    collagen: { label: 'Collagen', category: 'other', emoji: '✨' },
    other: { label: 'Other', category: 'other', emoji: '📦' }
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
    
    // Input mode toggle
    document.querySelectorAll('input[name="input-mode"]').forEach(input => {
        input.addEventListener('change', handleInputModeChange);
    });
    
    // Add product button
    document.getElementById('add-product-btn').addEventListener('click', handleAddProduct);
    
    // Clear all button
    document.getElementById('clear-all-btn').addEventListener('click', handleClearAll);
    
    // Camera controls
    document.getElementById('start-camera-btn').addEventListener('click', startCamera);
    document.getElementById('capture-btn').addEventListener('click', captureImage);
    document.getElementById('retake-btn').addEventListener('click', retakeImage);
    document.getElementById('use-detected-btn').addEventListener('click', useDetectedValues);
    
    // Auto-calculate total protein when servings/per-serving change
    document.getElementById('servings').addEventListener('input', calculateTotalProtein);
    document.getElementById('protein-per-serving').addEventListener('input', calculateTotalProtein);
    
    // Update display
    updateDisplay();
    
    console.log('🥩 ProteinValue initialized!');
}

// ==========================================
// INPUT MODE HANDLING
// ==========================================

function handleInputModeChange(e) {
    state.inputMode = e.target.value;
    
    const manualInputs = document.getElementById('manual-inputs');
    const cameraInputs = document.getElementById('camera-inputs');
    
    if (state.inputMode === 'manual') {
        manualInputs.classList.remove('hidden');
        cameraInputs.classList.add('hidden');
        stopCamera();
    } else {
        manualInputs.classList.add('hidden');
        cameraInputs.classList.remove('hidden');
    }
}

function calculateTotalProtein() {
    const servings = parseFloat(document.getElementById('servings').value) || 0;
    const perServing = parseFloat(document.getElementById('protein-per-serving').value) || 0;
    
    if (servings > 0 && perServing > 0) {
        document.getElementById('total-protein').value = Math.round(servings * perServing);
    }
}

// ==========================================
// CAMERA & OCR
// ==========================================

async function startCamera() {
    try {
        const video = document.getElementById('video');
        const startBtn = document.getElementById('start-camera-btn');
        const captureBtn = document.getElementById('capture-btn');
        
        // Request camera access
        state.cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video.srcObject = state.cameraStream;
        video.classList.remove('hidden');
        
        startBtn.classList.add('hidden');
        captureBtn.classList.remove('hidden');
        
        // Hide any previous results
        document.getElementById('captured-image').classList.add('hidden');
        document.getElementById('ocr-results').classList.add('hidden');
        document.getElementById('retake-btn').classList.add('hidden');
        
    } catch (error) {
        console.error('Camera error:', error);
        showError('Could not access camera. Please allow camera permissions or use manual entry.');
    }
}

function stopCamera() {
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
    }
    
    const video = document.getElementById('video');
    video.srcObject = null;
}

async function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const capturedImage = document.getElementById('captured-image');
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert to image
    const imageData = canvas.toDataURL('image/png');
    capturedImage.src = imageData;
    
    // Update UI
    video.classList.add('hidden');
    capturedImage.classList.remove('hidden');
    document.getElementById('capture-btn').classList.add('hidden');
    document.getElementById('retake-btn').classList.remove('hidden');
    
    // Stop camera stream
    stopCamera();
    
    // Run OCR
    await runOCR(imageData);
}

function retakeImage() {
    document.getElementById('captured-image').classList.add('hidden');
    document.getElementById('ocr-results').classList.add('hidden');
    document.getElementById('retake-btn').classList.add('hidden');
    document.getElementById('start-camera-btn').classList.remove('hidden');
    
    state.detectedValues = { protein: null, servings: null };
}

async function runOCR(imageData) {
    const statusEl = document.getElementById('ocr-status');
    const resultsEl = document.getElementById('ocr-results');
    
    statusEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
    
    try {
        // Initialize Tesseract worker
        const worker = await Tesseract.createWorker('eng');
        
        // Run OCR
        const { data: { text } } = await worker.recognize(imageData);
        
        // Terminate worker
        await worker.terminate();
        
        console.log('OCR Raw Text:', text);
        
        // Parse nutrition info from text
        const parsed = parseNutritionLabel(text);
        
        statusEl.classList.add('hidden');
        
        if (parsed.protein || parsed.servings) {
            state.detectedValues = parsed;
            
            document.getElementById('detected-protein').textContent = 
                parsed.protein ? `${parsed.protein}g` : '--';
            document.getElementById('detected-servings').textContent = 
                parsed.servings ? parsed.servings : '--';
            
            resultsEl.classList.remove('hidden');
        } else {
            showError('Could not detect values from label. Please enter manually.');
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        statusEl.classList.add('hidden');
        showError('Error reading label. Please enter values manually.');
    }
}

function parseNutritionLabel(text) {
    const result = { protein: null, servings: null };
    
    // Normalize text
    const normalized = text.toLowerCase().replace(/\s+/g, ' ');
    
    // Look for protein values
    // Patterns: "protein 25g", "protein: 25 g", "protein 25 grams"
    const proteinPatterns = [
        /protein[:\s]*(\d+(?:\.\d+)?)\s*g/i,
        /protein[:\s]*(\d+(?:\.\d+)?)\s*grams?/i,
        /(\d+(?:\.\d+)?)\s*g\s*protein/i
    ];
    
    for (const pattern of proteinPatterns) {
        const match = text.match(pattern);
        if (match) {
            result.protein = parseFloat(match[1]);
            break;
        }
    }
    
    // Look for servings
    // Patterns: "servings per container 24", "servings: 30", "24 servings"
    const servingsPatterns = [
        /servings?\s*(?:per\s*container)?[:\s]*(\d+)/i,
        /(\d+)\s*servings?\s*(?:per\s*container)?/i,
        /about\s*(\d+)\s*servings?/i
    ];
    
    for (const pattern of servingsPatterns) {
        const match = text.match(pattern);
        if (match) {
            const num = parseInt(match[1]);
            // Sanity check - servings should be reasonable (1-500)
            if (num >= 1 && num <= 500) {
                result.servings = num;
                break;
            }
        }
    }
    
    return result;
}

function useDetectedValues() {
    const { protein, servings } = state.detectedValues;
    
    if (protein && servings) {
        // Calculate total protein
        const totalProtein = Math.round(protein * servings);
        document.getElementById('camera-total-protein').value = totalProtein;
    } else if (protein) {
        // Just set as-is, user will need to multiply
        document.getElementById('camera-total-protein').value = protein;
    }
    
    document.getElementById('ocr-results').classList.add('hidden');
    showSuccess('Values applied! Add price and source to complete.');
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

function handleAddProduct() {
    hideError();
    
    let productData;
    
    if (state.inputMode === 'manual') {
        productData = getManualInputData();
    } else {
        productData = getCameraInputData();
    }
    
    // Validate
    if (!productData.name) {
        showError('Please enter a product name');
        return;
    }
    
    if (!productData.price || productData.price <= 0) {
        showError('Please enter a valid price');
        return;
    }
    
    if (!productData.totalProtein || productData.totalProtein <= 0) {
        showError('Please enter total protein amount');
        return;
    }
    
    if (!productData.source) {
        showError('Please select a protein source');
        return;
    }
    
    // Calculate values
    productData.costPerGram = productData.price / productData.totalProtein;
    productData.proteinPerDollar = productData.totalProtein / productData.price;
    productData.id = Date.now();
    productData.contributeData = document.getElementById('contribute-data').checked;
    
    // Add to state
    state.products.push(productData);
    
    // Save to localStorage
    saveProducts();
    
    // Update display
    updateDisplay();
    
    // Clear form
    clearForm();
    
    // Show success feedback
    showSuccess(`Added: ${productData.name}`);
}

function getManualInputData() {
    const servings = parseFloat(document.getElementById('servings').value) || 0;
    const perServing = parseFloat(document.getElementById('protein-per-serving').value) || 0;
    let totalProtein = parseFloat(document.getElementById('total-protein').value) || 0;
    
    // If total not entered but servings data exists, calculate
    if (totalProtein === 0 && servings > 0 && perServing > 0) {
        totalProtein = servings * perServing;
    }
    
    return {
        name: document.getElementById('product-name').value.trim(),
        price: parseFloat(document.getElementById('product-price').value) || 0,
        totalProtein: totalProtein,
        source: document.getElementById('protein-source').value,
        servings: servings,
        proteinPerServing: perServing
    };
}

function getCameraInputData() {
    return {
        name: document.getElementById('camera-product-name').value.trim(),
        price: parseFloat(document.getElementById('camera-product-price').value) || 0,
        totalProtein: parseFloat(document.getElementById('camera-total-protein').value) || 0,
        source: document.getElementById('camera-protein-source').value
    };
}

function clearForm() {
    // Manual inputs
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('total-protein').value = '';
    document.getElementById('servings').value = '';
    document.getElementById('protein-per-serving').value = '';
    document.getElementById('protein-source').value = '';
    
    // Camera inputs
    document.getElementById('camera-product-name').value = '';
    document.getElementById('camera-product-price').value = '';
    document.getElementById('camera-total-protein').value = '';
    document.getElementById('camera-protein-source').value = '';
}

function deleteProduct(id) {
    state.products = state.products.filter(p => p.id !== id);
    saveProducts();
    updateDisplay();
}

function handleClearAll() {
    if (state.products.length === 0) return;
    
    if (confirm('Clear all products? This cannot be undone.')) {
        state.products = [];
        saveProducts();
        updateDisplay();
    }
}

// ==========================================
// STORAGE
// ==========================================

function saveProducts() {
    localStorage.setItem('proteinvalue_products', JSON.stringify(state.products));
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
// DISPLAY & CALCULATIONS
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
    
    // Sort by cost per gram (best first)
    const sorted = [...state.products].sort((a, b) => a.costPerGram - b.costPerGram);
    const best = sorted[0];
    
    // Update best value card
    document.getElementById('best-product-name').textContent = best.name;
    document.getElementById('best-cost-per-gram').textContent = `$${best.costPerGram.toFixed(3)}`;
    document.getElementById('best-protein-per-dollar').textContent = `${best.proteinPerDollar.toFixed(1)}g`;
    
    // Update diversity
    updateDiversityScore();
    
    // Update table
    updateProductsTable(sorted);
    
    // Update summary
    updateSummary(sorted);
    
    // Update chart
    updateChart(sorted);
}

function updateDiversityScore() {
    const sources = new Set(state.products.map(p => p.source));
    const uniqueSources = [...sources];
    
    document.getElementById('diversity-score').textContent = uniqueSources.length;
    
    const sourcesContainer = document.getElementById('diversity-sources');
    sourcesContainer.innerHTML = uniqueSources.map(source => {
        const info = PROTEIN_SOURCES[source] || { label: source, category: 'other', emoji: '📦' };
        return `<span class="source-tag ${info.category}">${info.emoji} ${info.label}</span>`;
    }).join('');
    
    // Update tip based on diversity
    const tip = document.getElementById('diversity-tip');
    if (uniqueSources.length === 1) {
        tip.textContent = '💡 Try adding products from different sources for better nutrition!';
    } else if (uniqueSources.length < 3) {
        tip.textContent = '👍 Good start! Consider adding more variety.';
    } else {
        tip.textContent = '🌟 Great diversity! You\'re getting a good mix of protein sources.';
    }
}

function updateProductsTable(sorted) {
    const tbody = document.getElementById('products-tbody');
    const bestId = sorted[0]?.id;
    
    tbody.innerHTML = sorted.map(product => {
        const sourceInfo = PROTEIN_SOURCES[product.source] || { label: product.source, emoji: '📦' };
        const isBest = product.id === bestId;
        
        return `
            <tr class="${isBest ? 'best-row' : ''}" data-id="${product.id}">
                <td>
                    ${isBest ? '🏆 ' : ''}
                    <strong>${escapeHtml(product.name)}</strong>
                    <br><small>$${product.price.toFixed(2)} / ${product.totalProtein}g</small>
                </td>
                <td>${sourceInfo.emoji} ${sourceInfo.label}</td>
                <td><strong>$${product.costPerGram.toFixed(3)}</strong></td>
                <td>${product.proteinPerDollar.toFixed(1)}g</td>
                <td>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateSummary(sorted) {
    document.getElementById('total-products').textContent = state.products.length;
    
    // Calculate average cost per gram
    const avgCostPerGram = state.products.reduce((sum, p) => sum + p.costPerGram, 0) / state.products.length;
    document.getElementById('avg-cost-per-gram').textContent = `$${avgCostPerGram.toFixed(3)}/g`;
    
    // Calculate savings of best vs average
    if (state.products.length > 1) {
        const best = sorted[0];
        const savingsPercent = ((avgCostPerGram - best.costPerGram) / avgCostPerGram * 100).toFixed(0);
        document.getElementById('savings-vs-avg').textContent = `${savingsPercent}% vs avg`;
    } else {
        document.getElementById('savings-vs-avg').textContent = '--';
    }
}

function updateChart(sorted) {
    const ctx = document.getElementById('comparison-chart').getContext('2d');
    
    // Destroy existing chart
    if (state.chart) {
        state.chart.destroy();
    }
    
    // Prepare data
    const labels = sorted.map(p => truncateText(p.name, 15));
    const proteinPerDollar = sorted.map(p => p.proteinPerDollar);
    
    // Color based on ranking
    const colors = sorted.map((_, i) => {
        if (i === 0) return '#f59e0b'; // Gold for best
        if (i === 1) return '#10b981'; // Green for second
        return '#6b7280'; // Gray for rest
    });
    
    state.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Protein per Dollar (g/$)',
                data: proteinPerDollar,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 6
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
                    callbacks: {
                        label: function(context) {
                            const product = sorted[context.dataIndex];
                            return [
                                `${context.parsed.y.toFixed(1)}g per $1`,
                                `$${product.costPerGram.toFixed(3)} per gram`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Grams of Protein per Dollar'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
}

// ==========================================
// UI HELPERS
// ==========================================

function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = '❌ ' + msg;
    el.classList.remove('hidden');
    
    setTimeout(() => {
        el.classList.add('hidden');
    }, 5000);
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
    
    setTimeout(() => {
        el.classList.add('hidden');
        el.style.background = '';
        el.style.borderColor = '';
        el.style.color = '';
    }, 3000);
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

// Make deleteProduct available globally for onclick
window.deleteProduct = deleteProduct;
