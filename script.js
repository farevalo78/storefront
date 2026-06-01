// Elementos del DOM
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewImage = document.getElementById('previewImage');
const canvas = document.getElementById('canvas');
const loadingSpinner = document.getElementById('loadingSpinner');

const extractedMeasuresSection = document.getElementById('extractedMeasures');
const extractedText = document.getElementById('extractedText');
const totalPerimeter = document.getElementById('totalPerimeter');
const totalPerimeterFeet = document.getElementById('totalPerimeterFeet');
const manualPerimeterInput = document.getElementById('manualPerimeter');

const configSection = document.getElementById('configSection');
const quoteSection = document.getElementById('quoteSection');

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

// Variables globales
let extractedMeasurements = [];
let calculatedPerimeterInches = 0;
let calculatedPerimeterFeet = 0;
let glassWidth = 0;
let glassHeight = 0;

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

async function handleImageUpload() {
    const file = imageInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            previewImage.src = e.target.result;
            previewImage.classList.add('show');
            
            // Mostrar spinner de carga
            loadingSpinner.style.display = 'block';
            
            // Procesar la imagen
            await processImage(e.target.result);
            
            // Ocultar spinner
            loadingSpinner.style.display = 'none';
            
            // Mostrar secciones
            extractedMeasuresSection.style.display = 'block';
            configSection.style.display = 'block';
            quoteSection.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function processImage(imageData) {
    // Crear una imagen para procesarla
    const img = new Image();
    img.onload = async () => {
        // 1. Extraer texto con OCR (Tesseract)
        extractedMeasurements = await extractMeasurementsOCR(imageData);
        
        // 2. Detectar líneas y calcular perímetro
        const lineLength = detectLinesAndCalculatePerimeter(img);
        
        // Actualizar UI
        updateMeasuresUI();
    };
    img.src = imageData;
}

async function extractMeasurementsOCR(imageData) {
    try {
        const result = await Tesseract.recognize(imageData, 'eng', {
            logger: m => console.log(m)
        });
        
        // Extraer números del texto reconocido
        const text = result.data.text;
        console.log('OCR Text:', text);
        
        // Buscar patrones de números seguidos de " o inch"
        const measurements = text.match(/\d+(\.\d+)?\s*["'\"\s]*(inch)?/gi) || [];
        
        return measurements.map(m => {
            const num = parseFloat(m.match(/\d+(\.\d+)?/)[0]);
            return num;
        });
    } catch (error) {
        console.error('Error en OCR:', error);
        return [];
    }
}

function detectLinesAndCalculatePerimeter(img) {
    // Crear canvas para procesamiento
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Obtener datos de la imagen
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Detectar bordes (Canny edge detection simplificado)
    const edges = detectEdges(imageData);
    
    // Detectar líneas y calcular longitud total
    const totalLineLength = detectLinesHoughTransform(edges, img.width, img.height);
    
    // Convertir píxeles a pulgadas (aproximación: 96 DPI = 1 pulgada por 96 píxeles)
    const DPI = 96;
    const inchesToPulgas = 1;
    const perimeterInches = (totalLineLength / DPI) * inchesToPulgas;
    
    return perimeterInches;
}

function detectEdges(imageData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const edges = new Uint8ClampedArray(width * height);
    
    // Sobel operator para detectar bordes
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // Obtener valores de gris de píxeles vecinos
            const gx = getSobelGx(data, x, y, width);
            const gy = getSobelGy(data, x, y, width);
            
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            edges[y * width + x] = magnitude > 100 ? 255 : 0;
        }
    }
    
    return edges;
}

function getSobelGx(data, x, y, width) {
    const getPixel = (px, py) => {
        if (px < 0 || px >= width || py < 0) return 0;
        return data[(py * width + px) * 4] || 0;
    };
    
    return (-1 * getPixel(x - 1, y - 1)) + (-2 * getPixel(x, y - 1)) + (-1 * getPixel(x + 1, y - 1)) +
           (1 * getPixel(x - 1, y + 1)) + (2 * getPixel(x, y + 1)) + (1 * getPixel(x + 1, y + 1));
}

function getSobelGy(data, x, y, width) {
    const getPixel = (px, py) => {
        if (px < 0 || px >= width || py < 0) return 0;
        return data[(py * width + px) * 4] || 0;
    };
    
    return (-1 * getPixel(x - 1, y - 1)) + (-2 * getPixel(x - 1, y)) + (-1 * getPixel(x - 1, y + 1)) +
           (1 * getPixel(x + 1, y - 1)) + (2 * getPixel(x + 1, y)) + (1 * getPixel(x + 1, y + 1));
}

function detectLinesHoughTransform(edges, width, height) {
    // Versión simplificada: contar píxeles de borde
    let totalPixels = 0;
    for (let i = 0; i < edges.length; i++) {
        if (edges[i] > 0) totalPixels++;
    }
    
    // Estimar longitud de línea (aproximadamente el total de píxeles de borde)
    return totalPixels;
}

function updateMeasuresUI() {
    // Mostrar medidas extraídas
    const measuresText = extractedMeasurements.length > 0 
        ? extractedMeasurements.map(m => m.toFixed(2) + '"').join(', ')
        : 'No se detectaron medidas automáticamente';
    
    extractedText.textContent = measuresText;
    
    // Calcular perímetro
    if (extractedMeasurements.length > 0) {
        // Sumar todas las medidas (asumiendo que son lados del rectángulo)
        calculatedPerimeterInches = extractedMeasurements.reduce((a, b) => a + b, 0);
    } else {
        // Si no se detectan medidas, usar detección de líneas
        calculatedPerimeterInches = detectLinesAndCalculatePerimeter(
            document.createElement('img')
        );
    }
    
    calculatedPerimeterFeet = calculatedPerimeterInches / 12;
    
    totalPerimeter.textContent = calculatedPerimeterInches.toFixed(2) + ' pulgadas';
    totalPerimeterFeet.textContent = calculatedPerimeterFeet.toFixed(2) + ' pies';
}

// Event listeners para cambios
manualPerimeterInput.addEventListener('change', () => {
    if (manualPerimeterInput.value) {
        calculatedPerimeterInches = parseFloat(manualPerimeterInput.value);
        calculatedPerimeterFeet = calculatedPerimeterInches / 12;
        totalPerimeter.textContent = calculatedPerimeterInches.toFixed(2) + ' pulgadas';
        totalPerimeterFeet.textContent = calculatedPerimeterFeet.toFixed(2) + ' pies';
    }
    calculateQuote();
});

doorCountInput.addEventListener('change', calculateQuote);
doorTypeSelect.addEventListener('change', calculateQuote);
glassTypeSelect.addEventListener('change', calculateQuote);

// Función Principal de Cálculo
function calculateQuote() {
    const doorCount = parseInt(doorCountInput.value) || 0;
    const doorType = doorTypeSelect.value;
    const glassType = glassTypeSelect.value;

    // Cálculo de Marco (Frames) - Basado en el perímetro detectado
    const framesCost = calculatedPerimeterFeet * FRAME_PRICE_PER_FOOT;

    // Cálculo de Puertas
    let doorsCost = 0;
    if (doorType && doorCount > 0) {
        doorsCost = doorCount * DOOR_PRICE;
    }

    // Cálculo de Vidrio - Estimar área basada en medidas
    // Asumiendo que el vidrio ocupa el área interior
    let glassArea = 0;
    if (extractedMeasurements.length >= 2) {
        // Usar las dos medidas más grandes como ancho y alto
        const sortedMeasures = [...extractedMeasurements].sort((a, b) => b - a);
        glassWidth = sortedMeasures[0] / 12; // Convertir a pies
        glassHeight = sortedMeasures[1] / 12; // Convertir a pies
        glassArea = glassWidth * glassHeight;
    }
    
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
    const doorType = doorTypeSelect.value;
    const glassType = glassTypeSelect.value;

    if (!doorType || !glassType) {
        alert('Por favor, selecciona el tipo de puerta y vidrio');
        return;
    }

    alert('Cotización generada exitosamente. Usa "Descargar Cotización" para obtener el archivo.');
});

// Descargar Cotización
downloadQuoteBtn.addEventListener('click', () => {
    const doorType = doorTypeSelect.value;
    const glassType = glassTypeSelect.value;
    const notes = notesTextarea.value;

    if (!doorType || !glassType) {
        alert('Por favor, completa todos los campos requeridos antes de descargar');
        return;
    }

    // Crear contenido del archivo
    const content = `
COTIZACION DE STOREFRONT
═══════════════════════════════════════════════════════════

MEDIDAS EXTRAIDAS DEL DIBUJO:
───────────────────────────────────────────────────────────
Medidas detectadas: ${extractedText.textContent}
Perímetro Total: ${totalPerimeter.textContent}
Perímetro en Pies: ${totalPerimeterFeet.textContent}

ESPECIFICACIONES:
───────────────────────────────────────────────────────────
Tipo de Puerta: ${doorTypeSelect.value.toUpperCase()}
Cantidad de Puertas: ${doorCountInput.value}
Tipo de Vidrio: ${glassType.toUpperCase()}
Área de Vidrio: ${glassAreaElement.textContent}
Notas: ${notes || 'N/A'}

DESGLOSE DE COSTOS:
───────────────────────────────────────────────────────────
Marco (Frames) @ $${FRAME_PRICE_PER_FOOT}/pie: ${framesCostElement.textContent}
Puertas @ $${DOOR_PRICE}/c/u: ${doorsCostElement.textContent}
Vidrio: ${glassCostElement.textContent}

═══════════════════════════════════════════════════════════
TOTAL: ${totalCostElement.textContent}
═══════════════════════════════════════════════════════════

Fecha: ${new Date().toLocaleDateString('es-ES')}
Hora: ${new Date().toLocaleTimeString('es-ES')}
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
    location.reload();
});

// Cálculo inicial
calculateQuote();