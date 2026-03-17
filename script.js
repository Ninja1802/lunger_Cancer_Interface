document.addEventListener("DOMContentLoaded", () => {

    console.log("JS LOADED");

    // Particle JS
    particlesJS('particles-js', {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: ["#ff4500", "#ff8c00", "#ff2a00"] },
            shape: { type: "circle" },
            opacity: { value: 0.6, random: true },
            size: { value: 3, random: true },
            line_linked: { enable: true, distance: 150, color: "#ff4500", opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1.5, direction: "top", random: true }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "bubble" }, onclick: { enable: true, mode: "push" } },
            modes: { bubble: { distance: 200, size: 6 }, push: { particles_nb: 4 } }
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

    console.log("Analyze button:", analyzeBtn);

    let currentFile = null;

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    // Handle file
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
        };

        reader.readAsDataURL(file);
    }

    // Reset
    resetBtn.addEventListener('click', () => {
        currentFile = null;
        imagePreview.src = "";
        fileInput.value = "";
        previewArea.classList.add('hidden');
        resultSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    // Convert to Base64
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Analyze
    analyzeBtn.addEventListener('click', async () => {
        console.log("Analyze button clicked");

        if (!currentFile) return;

        analyzeBtn.disabled = true;
        previewArea.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        try {
            const base64Image = await toBase64(currentFile);

            const response = await fetch('https://san1802-lung-cancer-ai.hf.space/run/predict', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    data: [base64Image]
                })
            });

            if (!response.ok) throw new Error("API Request Failed");

            const result = await response.json();
            console.log("API RESPONSE:", result);

            let prediction = "UNKNOWN";

            if (result?.data) {
                if (Array.isArray(result.data[0])) {
                    prediction = result.data[0][0];
                } else if (typeof result.data[0] === "string") {
                    prediction = result.data[0];
                } else {
                    prediction = JSON.stringify(result.data[0]);
                }
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

    // Display result
    function displayResult(prediction) {
        resultSection.classList.remove('hidden');
        resultDisplay.className = 'result-display';

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

        resultSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

});
