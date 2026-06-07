// ============================================================================
// PDF VAT Calculator - Main Application Logic
// ============================================================================

// Configuration Management
class ConfigManager {
    constructor() {
        this.storageKey = 'pdfVatConfig';
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const config = JSON.parse(saved);
                document.getElementById('apiKey').value = config.apiKey || '';
                document.getElementById('model').value = config.model || 'llama-3.3-70b-versatile';
            }
        } catch (error) {
            console.error('Failed to load configuration:', error);
        }
    }

    save() {
        try {
            const config = {
                apiKey: document.getElementById('apiKey').value,
                model: document.getElementById('model').value
            };
            localStorage.setItem(this.storageKey, JSON.stringify(config));
            showStatus('Configuration saved successfully!', 'success');
        } catch (error) {
            showStatus('Failed to save configuration: ' + error.message, 'error');
        }
    }

    getApiKey() {
        return document.getElementById('apiKey').value.trim();
    }

    getModel() {
        return document.getElementById('model').value;
    }

    isValid() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            showStatus('Please enter your Groq API key', 'error');
            return false;
        }
        if (!apiKey.startsWith('gsk_')) {
            showStatus('Invalid API key format. Must start with "gsk_"', 'error');
            return false;
        }
        return true;
    }
}

// PDF Processing
class PDFProcessor {
    constructor() {
        this.pdf = null;
        this.text = '';
    }

    async loadPDF(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            await this.extractText();
            return true;
        } catch (error) {
            console.error('PDF loading error:', error);
            showStatus('Failed to load PDF: ' + error.message, 'error');
            return false;
        }
    }

    async extractText() {
        this.text = '';
        try {
            for (let i = 1; i <= this.pdf.numPages; i++) {
                const page = await this.pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                this.text += `\n--- PAGE ${i} ---\n${pageText}`;
            }
        } catch (error) {
            console.error('Text extraction error:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    getText() {
        return this.text;
    }

    getPreview(maxChars = 1000) {
        return this.text.substring(0, maxChars) + (this.text.length > maxChars ? '\n...' : '');
    }
}

// Groq API Interface
class GroqClient {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
    }

    buildPrompt(pdfText) {
        return `You are a financial document analyzer. Analyze the provided PDF text containing financial transactions and VAT information.

Your task:
1. Extract all transaction details from page 1 (summary)
2. Cross-reference with supporting receipts on subsequent pages
3. Calculate or extract the missing VAT amount for each transaction
4. Return a properly formatted JSON array

Important rules:
- VAT is typically calculated as: VAT = (Price / 100) * 15 (for 15% VAT) or extract from supporting documents
- Total (incl. VAT) = Price + VAT
- Maintain the original currency (SAR - Saudi Riyal)
- Include all fields: no, tanggal (date), keterangan (description), harga_sar (price), vat_sar (VAT), total_incl_vat

PDF Content:
${pdfText}

Return ONLY a valid JSON array in this exact format:
{
  "transactions": [
    {
      "no": 1,
      "tanggal": "Date",
      "keterangan": "Description",
      "harga_sar": 0.00,
      "vat_sar": 0.00,
      "total_incl_vat": 0.00
    }
  ]
}`;
    }

    async extractVAT(pdfText) {
        try {
            const prompt = this.buildPrompt(pdfText);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a financial document analyzer specialized in extracting VAT and transaction details from PDF documents.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 4096
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from AI model');
            }

            const result = JSON.parse(jsonMatch[0]);
            return result.transactions || [];
        } catch (error) {
            console.error('Groq API error:', error);
            throw error;
        }
    }
}

// UI Utilities
function showStatus(message, type = 'info') {
    const statusElements = {
        'uploadStatus': ['uploadStatus'],
        'processingStatus': ['processingStatus']
    };

    for (const elementId of Object.keys(statusElements)) {
        const element = document.getElementById(elementId);
        if (element && element.style.display !== 'none') {
            element.textContent = message;
            element.className = `status ${type}`;
            break;
        }
    }

    if (!Object.keys(statusElements).some(id => document.getElementById(id).style.display !== 'none')) {
        const element = document.getElementById('processingStatus') || document.getElementById('uploadStatus');
        if (element) {
            element.textContent = message;
            element.className = `status ${type}`;
        }
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('apiKey');
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
}

function saveConfiguration() {
    configManager.save();
}

// File Handling
function setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('dragover');
        });
    });

    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });
}

function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

async function handleFiles(files) {
    if (!files || files.length === 0) {
        showStatus('No file selected', 'error');
        return;
    }

    const file = files[0];
    if (file.type !== 'application/pdf') {
        showStatus('Please select a PDF file', 'error');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showStatus('File size exceeds 50MB limit', 'error');
        return;
    }

    showStatus('Loading PDF...', 'info');
    pdfProcessor = new PDFProcessor();

    if (await pdfProcessor.loadPDF(file)) {
        showStatus('PDF loaded successfully!', 'success');
        displayPDFPreview();
        showProcessingSection();
    }
}

function displayPDFPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewDiv = document.getElementById('pdfPreview');
    const preview = pdfProcessor.getPreview(2000);
    previewDiv.textContent = preview;
    previewSection.style.display = 'block';
}

function showProcessingSection() {
    document.getElementById('processingSection').style.display = 'block';
}

async function processPDF() {
    if (!configManager.isValid()) {
        return;
    }

    const processBtn = document.getElementById('processBtn');
    processBtn.disabled = true;

    try {
        showStatus('Sending to AI for VAT extraction...', 'info');

        const client = new GroqClient(configManager.getApiKey(), configManager.getModel());
        const transactions = await client.extractVAT(pdfProcessor.getText());

        if (!transactions || transactions.length === 0) {
            showStatus('No transactions found in the PDF', 'error');
            return;
        }

        displayResults(transactions);
        showStatus('VAT extraction completed successfully!', 'success');
    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
        console.error('Processing error:', error);
    } finally {
        processBtn.disabled = false;
    }
}

function displayResults(transactions) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${transaction.no}</td>
            <td><input type="text" value="${transaction.tanggal}"></td>
            <td><input type="text" value="${transaction.keterangan}"></td>
            <td><input type="number" step="0.01" value="${transaction.harga_sar}"></td>
            <td><input type="number" step="0.01" value="${transaction.vat_sar}"></td>
            <td><input type="number" step="0.01" value="${transaction.total_incl_vat}"></td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('resultsSection').style.display = 'block';
}

function exportToCSV() {
    const table = document.getElementById('resultsTable');
    const rows = Array.from(table.querySelectorAll('tr'));
    
    let csv = '';
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const values = cells.map(cell => {
            const input = cell.querySelector('input');
            const value = input ? input.value : cell.textContent;
            return `"${value.replace(/"/g, '""')}"`;
        });
        csv += values.join(',') + '\n';
    });

    downloadFile(csv, 'vat_transactions.csv', 'text/csv');
}

function exportToJSON() {
    const tbody = document.getElementById('resultsBody');
    const transactions = [];

    tbody.querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td input');
        transactions.push({
            no: parseInt(cells[0].value),
            tanggal: cells[1].value,
            keterangan: cells[2].value,
            harga_sar: parseFloat(cells[3].value),
            vat_sar: parseFloat(cells[4].value),
            total_incl_vat: parseFloat(cells[5].value)
        });
    });

    const json = JSON.stringify({ transactions }, null, 2);
    downloadFile(json, 'vat_transactions.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function resetAll() {
    document.getElementById('fileInput').value = '';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('processingSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('uploadStatus').className = 'status';
    document.getElementById('processingStatus').className = 'status';
    pdfProcessor = null;
    showStatus('Ready to upload a new PDF', 'info');
}

// ============================================================================
// Initialization
// ============================================================================

let configManager;
let pdfProcessor = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    configManager = new ConfigManager();
    setupDragAndDrop();
    showStatus('Ready to upload PDF', 'info');
});
