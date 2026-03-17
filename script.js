document.addEventListener("DOMContentLoaded", () => {

    console.log("JS LOADED 🚀");

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

            const response = await fetch('https://lunger-cancer-interface.onrender.com/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Backend request failed");

            const result = await response.json();
            console.log("RAW BACKEND RESPONSE:", result);

            let prediction = "UNKNOWN";

            // 🔥 FINAL FIX: unwrap nested arrays safely
            if (result?.data) {
                let data = result.data;

                while (Array.isArray(data)) {
                    data = data[0];
                }

                prediction = data;
            } 
            else if (result?.error) {
                console.error("Backend error:", result.error);
                prediction = "ERROR";
            }

            console.log("FINAL PREDICTION:", prediction);

            displayResult(prediction);

        } catch (error) {
            console.error("Frontend error:", error);
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

        const lower = String(prediction).toLowerCase(); // 🔥 safe conversion

        if (lower.includes("normal")) {
            resultDisplay.classList.add('res-normal');
            resultValue.textContent = "NORMAL SCAN";
        } else if (lower.includes("benign")) {
            resultDisplay.classList.add('res-benign');
            resultValue.textContent = "BENIGN ANOMALY";
        } else if (lower.includes("malignant") || lower.includes("cancer")) {
            resultDisplay.classList.add('res-malignant');
            resultValue.textContent = "MALIGNANCY DETECTED";
        } else {
            resultValue.textContent = prediction;
        }

        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

});
