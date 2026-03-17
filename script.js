// Particle JS Config for dark fire/floating particles
particlesJS('particles-js', {
    particles: {
        number: { value: 60, density: { enable: true, value_area: 800 } },
        color: { value: ["#ff4500", "#ff8c00", "#ff2a00"] },
        shape: { type: "circle" },
        opacity: { value: 0.6, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
        size: { value: 3, random: true, anim: { enable: true, speed: 2, size_min: 0.1, sync: false } },
        line_linked: { enable: true, distance: 150, color: "#ff4500", opacity: 0.2, width: 1 },
        move: { enable: true, speed: 1.5, direction: "top", random: true, straight: false, out_mode: "out", bounce: false }
    },
    interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "bubble" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes: { bubble: { distance: 200, size: 6, duration: 2, opacity: 0.8, speed: 3 }, push: { particles_nb: 4 } }
    },
    retina_detect: true
});

// UI Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const imagePreview = document.getElementById('image-preview');
const analyzeBtn = document.getElementById('analyze-btn');
const resetBtn = document.getElementById('reset-btn');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const resultDisplay = document.getElementById('result-display');
const resultValue = document.getElementById('result-value');

let currentFile = null;

// Drag and Drop handlers
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) handleFile(files[0]);
});

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        handleFile(this.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }
    
    currentFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
    imagePreview.src = e.target.result;
    dropZone.classList.add('hidden');
    previewArea.classList.remove('hidden');
    resultSection.classList.add('hidden');
}
    
    reader.readAsDataURL(file);
}

resetBtn.addEventListener('click', () => {
    currentFile = null;
    imagePreview.src = "";
    fileInput.value = "";
    previewArea.classList.add('hidden');
    resultSection.classList.add('hidden');
    dropZone.classList.remove('hidden');
});

analyzeBtn.addEventListener('click', async () => {
    if (!currentFile) return;

    // Show loading UI
    analyzeBtn.disabled = true;
    previewArea.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    const formData = new FormData();
    formData.append('data', currentFile);

    try {
        const response = await fetch('https://san1802-lung-cancer-ai.hf.space/run/predict', {
    method: 'POST',
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        data: [await toBase64(currentFile)]
    })
});
        if (!response.ok) throw new Error("API Request Failed");

        const result = await response.json();
        
        // As requested: After receiving response, display result.data[0]
        let prediction = "UNKNOWN";
        if (result && result.data && result.data.length > 0) {
            prediction = result.data[0];
        }

        displayResult(prediction);

    } catch (error) {
        console.error("Error during analysis:", error);
        displayResult("ERROR");
    } finally {
        analyzeBtn.disabled = false;
        loadingSection.classList.add('hidden');
        previewArea.classList.remove('hidden');
    }
});

function displayResult(prediction) {
    resultSection.classList.remove('hidden');
    resultDisplay.className = 'result-display'; // reset classes
    
    // Format the text and apply specific classes based on prediction string
    const lowerPred = prediction.toLowerCase();
    
    if (lowerPred.includes("normal")) {
        resultDisplay.classList.add('res-normal');
        resultValue.textContent = "NORMAL SCAN";
    } else if (lowerPred.includes("benign")) {
        resultDisplay.classList.add('res-benign');
        resultValue.textContent = "BENIGN ANOMALY";
    } else if (lowerPred.includes("malignant") || lowerPred.includes("cancer")) {
        resultDisplay.classList.add('res-malignant');
        resultValue.textContent = "MALIGNANCY DETECTED";
    } else {
        resultDisplay.style.borderColor = "var(--text-dim)";
        resultDisplay.style.color = "#fff";
        resultValue.innerHTML = prediction.replace("\n", "<br>");
    }
    
    // Scroll to result smoothly
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
}
