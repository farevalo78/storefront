// Elementos del DOM
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const doorCountInput = document.getElementById('doorCount');
const doorTypeSelect = document.getElementById('doorType');
const glassTypeSelect = document.getElementById('glassType');
const notesTextarea = document.getElementById('notes');

const framesCostElement = document.getElementById('framesCost');
const doorsCostElement = document.getElementById('doorsCost');
const glassCostElement = document.getElementById('glassCost');
const glassAreaElement = document.getElementById('glassArea');
const totalCostElement = document.getElementById('totalCost');

const generateQuoteBtn = document.getElementById('generateQuote');
const downloadQuoteBtn = document.getElementById('downloadQuote');
const resetFormBtn = document.getElementById('resetForm');

// Precios
const FRAME_PRICE_PER_FOOT = 19;
const DOOR_PRICE = 1200;
const GLASS_PRICES = {
    ugu: 10,
    tempered: 15,
    laminated: 8
};

// Event Listeners para Upload
uploadArea.addEventListener('click', () => imageInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#764ba2';
    uploadArea.style.background = '#f0f1ff';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#667eea';
    uploadArea.style.background = '#f8f9ff';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        imageInput.files = files;
        handleImageUpload();
    }
});

imageInput.addEventListener('change', handleImageUpload);

function handleImageUpload() {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.classList.add('show');
        };
        reader.readAsDataURL(file);
    }
}

// Event Listeners para Cálculos
widthInput.addEventListener('change', calculateQuote);
heightInput.addEventListener('change', calculateQuote);
doorCountInput.addEventListener('change', calculateQuote);
doorTypeSelect.addEventListener('change', calculateQuote);
glassTypeSelect.addEventListener('change', calculateQuote);

// Función Principal de Cálculo
function calculateQuote() {
    const width = parseFloat(widthInput.value) || 0;
    const height = parseFloat(heightInput.value) || 0;
    const doorCount = parseInt(doorCountInput.value) || 0;
    const doorType = doorTypeSelect.value;
    const glassType = glassTypeSelect.value;

    // Cálculo de Marco (Frames)
    // Perímetro = 2 * (ancho + alto)
    const perimeter = 2 * (width + height);
    const framesCost = perimeter * FRAME_PRICE_PER_FOOT;

    // Cálculo de Puertas
    // Validar que se haya seleccionado un tipo
    let doorsCost = 0;
    if (doorType && doorCount > 0) {
        doorsCost = doorCount * DOOR_PRICE;
    }

    // Cálculo de Vidrio
    // Área = ancho * alto (en pies cuadrados)
    const glassArea = width * height;
    let glassCost = 0;
    if (glassType && glassArea > 0) {
        const pricePerSqFt = GLASS_PRICES[glassType];
        glassCost = glassArea * pricePerSqFt;
    }

    // Total
    const totalCost = framesCost + doorsCost + glassCost;

    // Actualizar UI
    framesCostElement.textContent = `$${framesCost.toFixed(2)}`;
    doorsCostElement.textContent = `$${doorsCost.toFixed(2)}`;
    glassCostElement.textContent = `$${glassCost.toFixed(2)}`;
    glassAreaElement.textContent = `${glassArea.toFixed(2)} pie²`;
    totalCostElement.textContent = `$${totalCost.toFixed(2)}`;
}

// Generar Cotización
generateQuoteBtn.addEventListener('click', () => {
    const width = widthInput.value;
    const height = heightInput.value;
    const doorCount = doorCountInput.value;
    const doorType = doorTypeSelect.value;
    const glassType = glassTypeSelect.value;
    const notes = notesTextarea.value;

    if (!width || !height || !doorType || !glassType) {
        alert('Por favor, completa todos los campos requeridos');
        return;
    }

    alert('Cotización generada exitosamente. Usa "Descargar Cotización" para obtener el PDF.');
});

// Descargar Cotización como PDF
downloadQuoteBtn.addEventListener('click', () => {
    const width = widthInput.value;
    const height = heightInput.value;
    const doorCount = doorCountInput.value;
    const doorType = doorTypeSelect.value;
    const glassType = glassTypeSelect.value;
    const notes = notesTextarea.value;

    if (!width || !height || !doorType || !glassType) {
        alert('Por favor, completa todos los campos requeridos antes de descargar');
        return;
    }

    // Crear contenido del PDF
    const content = `
COTIZACIÓN DE STOREFRONT
═══════════════════════════════════════════════════════════

ESPECIFICACIONES:
─────────────────────────────────────────────────────────
Ancho Total: ${width} pies
Alto Total: ${height} pies
Tipo de Puerta: ${doorType.toUpperCase()}
Cantidad de Puertas: ${doorCount}
Tipo de Vidrio: ${glassType.toUpperCase()}
Notas: ${notes || 'N/A'}

DESGLOSE DE COSTOS:
─────────────────────────────────────────────────────────
Marco (Frames): ${framesCostElement.textContent}
Puertas: ${doorsCostElement.textContent}
Vidrio: ${glassCostElement.textContent}
Área de Vidrio: ${glassAreaElement.textContent}

═══════════════════════════════════════════════════════════
TOTAL: ${totalCostElement.textContent}
═══════════════════════════════════════════════════════════

Fecha: ${new Date().toLocaleDateString('es-ES')}
    `;

    // Crear y descargar archivo
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `cotizacion-storefront-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
});

// Limpiar Formulario
resetFormBtn.addEventListener('click', () => {
    widthInput.value = '';
    heightInput.value = '';
    doorCountInput.value = '1';
    doorTypeSelect.value = '';
    glassTypeSelect.value = '';
    notesTextarea.value = '';
    imageInput.value = '';
    previewImage.classList.remove('show');
    
    framesCostElement.textContent = '$0.00';
    doorsCostElement.textContent = '$0.00';
    glassCostElement.textContent = '$0.00';
    glassAreaElement.textContent = '0 pie²';
    totalCostElement.textContent = '$0.00';
});

// Cálculo inicial
calculateQuote();