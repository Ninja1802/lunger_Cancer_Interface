document.addEventListener("DOMContentLoaded", () => {

    console.log("NEW JS LOADED v3🚀");

    // Particle effect
    particlesJS('particles-js', {
        particles: {
            number: { value: 60 },
            color: { value: ["#ff4500", "#ff8c00", "#ff2a00"] },
            shape: { type: "circle" },
            opacity: { value: 0.6 },
            size: { value: 3 },
            move: { enable: true, speed: 1.5 }
        }
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

    // Upload handling
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            handleFile(this.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert("Please upload an image file");
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

    // 🔥 ANALYZE BUTTON
    analyzeBtn.addEventListener('click', async () => {

        console.log("Analyze clicked");

        if (!currentFile) return;

        analyzeBtn.disabled = true;
        previewArea.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        try {
            const formData = new FormData();
            formData.append('file', currentFile);

            console.log("Sending request to backend...");

            const response = await fetch('https://lunger-cancer-interface.onrender.com/predict', {
                method: 'POST',
                body: formData
            });

            console.log("Response status:", response.status);

            const text = await response.text();
            console.log("RAW RESPONSE:", text);

            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error("JSON parse failed");
                displayResult("INVALID RESPONSE", null, null, null);
                return;
            }

            console.log("PARSED RESULT:", result);

            let predictionLabel = "UNKNOWN";
            let confidence = null;
            let subtype = null;
            let subtypeConf = null;

            if (result?.data) {
                const raw = result.data;

                // Parse: "Prediction: Malignant (1.00)\nSubtype: Squamous_Cell (1.00)"
                const predMatch = raw.match(/Prediction:\s*([^\(]+)\(([0-9.]+)\)/i);
                const subMatch  = raw.match(/Subtype:\s*([^\(]+)\(([0-9.]+)\)/i);

                if (predMatch) {
                    predictionLabel = predMatch[1].trim();       // e.g. "Malignant"
                    confidence      = parseFloat(predMatch[2]);  // e.g. 1.00
                }

                if (subMatch) {
                    subtype     = subMatch[1].trim().replace(/_/g, ' '); // e.g. "Squamous Cell"
                    subtypeConf = parseFloat(subMatch[2]);
                }

            } else if (result?.error) {
                console.error("Backend error:", result.error);
                predictionLabel = "ERROR";
            }

            console.log("FINAL PREDICTION:", predictionLabel, confidence, subtype, subtypeConf);

            displayResult(predictionLabel, confidence, subtype, subtypeConf);

        } catch (error) {
            console.error("FETCH ERROR:", error);
            displayResult("FETCH ERROR", null, null, null);
        } finally {
            analyzeBtn.disabled = false;
            loadingSection.classList.add('hidden');
            previewArea.classList.remove('hidden');
        }
    });

    // Display result
    function displayResult(prediction, confidence, subtype, subtypeConf) {
        resultSection.classList.remove('hidden');
        resultDisplay.className = 'result-display';

        const lower = prediction.toLowerCase();

        const fmtConf = (val) => val != null ? `${Math.round(val * 100)}%` : null;

        if (lower.includes("normal")) {
            resultDisplay.classList.add('res-normal');
            resultValue.innerHTML = `NORMAL SCAN` +
                (fmtConf(confidence) ? `<br><small>${fmtConf(confidence)} confidence</small>` : '');
        }
        else if (lower.includes("benign")) {
            resultDisplay.classList.add('res-benign');
            resultValue.innerHTML = `BENIGN ANOMALY` +
                (fmtConf(confidence) ? `<br><small>${fmtConf(confidence)} confidence</small>` : '');
        }
        else if (lower.includes("malignant") || lower.includes("cancer")) {
            resultDisplay.classList.add('res-malignant');

            let html = `MALIGNANCY DETECTED`;
            if (subtype) {
                html += `<br><span class="subtype">${subtype}</span>`;
                if (fmtConf(subtypeConf)) {
                    html += ` <small>(${fmtConf(subtypeConf)})</small>`;
                }
            }
            if (fmtConf(confidence)) {
                html += `<br><small>${fmtConf(confidence)} confidence</small>`;
            }
            resultValue.innerHTML = html;
        }
        else {
            resultValue.textContent = prediction;
        }

        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

});
