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

    // 🔥 Convert score → %
    function formatConfidence(score) {
        if (typeof score !== "number") return null;
        return (score * 100).toFixed(2) + "%";
    }

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

            const text = await response.text();
            console.log("RAW RESPONSE:", text);

            let result;

            try {
                result = JSON.parse(text);
            } catch (e) {
                displayResult("INVALID RESPONSE");
                return;
            }

            console.log("PARSED RESULT:", result);

            let prediction = "UNKNOWN";
            let confidence = null;

            if (result?.data) {
                let data = result.data;

                // unwrap nested arrays
                while (Array.isArray(data)) {
                    data = data[0];
                }

                // 🔥 HANDLE OBJECT RESPONSE
                if (typeof data === "object") {
                    prediction = data.label || data.prediction || "UNKNOWN";
                    confidence = data.score || data.confidence || null;
                } else {
                    prediction = data;
                }
            } 
            else if (result?.error) {
                prediction = "ERROR";
            }

            console.log("FINAL:", prediction, confidence);

            displayResult(prediction, confidence);

        } catch (error) {
            console.error("FETCH ERROR:", error);
            displayResult("FETCH ERROR");
        } finally {
            analyzeBtn.disabled = false;
            loadingSection.classList.add('hidden');
            previewArea.classList.remove('hidden');
        }
    });

    // 🔥 Display result with confidence
    function displayResult(prediction, confidence = null) {
        resultSection.classList.remove('hidden');
        resultDisplay.className = 'result-display';

        const text = String(prediction);
        const lower = text.toLowerCase();

        let finalText = "";

        if (lower.includes("normal")) {
            resultDisplay.classList.add('res-normal');
            finalText = "NORMAL SCAN";
        } 
        else if (lower.includes("benign")) {
            resultDisplay.classList.add('res-benign');
            finalText = "BENIGN ANOMALY";
        } 
        else if (lower.includes("malignant") || lower.includes("cancer")) {
            resultDisplay.classList.add('res-malignant');

            let subtype = text.replace(/malignant|cancer|-/gi, "").trim();

            if (subtype.length > 0 && subtype !== text) {
                finalText = `MALIGNANT (${subtype})`;
            } else {
                finalText = "MALIGNANCY DETECTED";
            }
        } 
        else {
            finalText = text;
        }

        // 🔥 Add confidence %
        if (confidence !== null) {
            finalText += `<br>Confidence: ${formatConfidence(confidence)}`;
        }

        resultValue.innerHTML = finalText;

        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

});
