# PDF VAT Calculator

A client-side web application for extracting and calculating missing VAT (Value Added Tax) from financial PDF documents using AI-powered analysis with the Groq API.

## 🎯 Features

- **Zero-Server Architecture**: Everything runs locally in your browser
- **PDF Processing**: Extract text from multi-page PDF documents using pdf.js
- **AI-Powered VAT Extraction**: Use Groq's powerful language models to intelligently identify and calculate missing VAT
- **Interactive Results**: Edit and review extracted transactions in an editable table
- **Export Options**: Download results as CSV or JSON
- **Secure Configuration**: Store API keys locally in browser localStorage

## 📋 Requirements

- **Browser Support**: Modern browser with ES6+ support (Chrome, Firefox, Safari, Edge)
- **Groq API Key**: Obtain from [console.groq.com](https://console.groq.com)
- **Internet Connection**: Required for Groq API calls

## 🚀 Quick Start

### 1. Get Your Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in to your Groq account
3. Navigate to API Keys section
4. Create a new API key (starts with `gsk_`)
5. Copy the key securely

### 2. Open the Application

Open `index.html` in your web browser. The application will load all required dependencies from CDN.

### 3. Configure API Settings

1. Enter your Groq API key in the "Groq API Key" field
2. Select your preferred AI model (default: `llama-3.3-70b-versatile`)
3. Click "Save Config" to store settings in browser localStorage

### 4. Upload PDF

1. Click the upload zone or drag and drop your PDF
2. The app will extract and display a preview of the content
3. Review the extracted text to ensure it's correct

### 5. Extract VAT

1. Click "Extract & Calculate VAT"
2. Wait for the AI to analyze the document
3. Review the results in the interactive table
4. Edit any values if needed

### 6. Export Results

- Click "Export CSV" to download as spreadsheet
- Click "Export JSON" for programmatic use

## 📁 File Structure

```
pdfvatv2/
├── index.html          # Main UI and HTML structure
├── app.js              # Core application logic
└── README.md           # This file
```

## 🏗️ Architecture

### Components

**ConfigManager**
- Handles API key and model configuration
- Manages browser localStorage persistence
- Validates API key format

**PDFProcessor**
- Loads PDF files using pdf.js library
- Extracts text from all pages
- Provides preview functionality

**GroqClient**
- Interfaces with Groq API via fetch()
- Constructs intelligent prompts for VAT extraction
- Parses JSON responses from AI model

**UI Utilities**
- File drag-and-drop handling
- Status notifications
- Table rendering and editing
- Export functionality

## 🔄 Data Flow

```
PDF Upload
    ↓
PDF Text Extraction
    ↓
Groq API Analysis
    ↓
JSON Parsing
    ↓
Table Display
    ↓
Export (CSV/JSON)
```

## 📊 Response Format

The application expects responses in this JSON structure:

```json
{
  "transactions": [
    {
      "no": 1,
      "tanggal": "1 Jan 2026",
      "keterangan": "Al Ghamdi Resto, sarapan dan makan siang",
      "harga_sar": 32.00,
      "vat_sar": 4.80,
      "total_incl_vat": 36.80
    }
  ]
}
```

## 🔒 Security

- **No Server Backend**: All processing happens client-side
- **Local Storage Only**: API keys stored only in browser localStorage
- **HTTPS Recommended**: Use HTTPS when deploying to production
- **No Data Transmission**: PDF content sent only to Groq API, not stored anywhere else

## ⚙️ Configuration Options

### API Models Available

- `llama-3.3-70b-versatile` (Recommended)
- `mixtral-8x7b-32768`
- `llama-3.1-70b-versatile`

### Supported File Types

- PDF files only
- Maximum file size: 50MB

## 🐛 Troubleshooting

### "Invalid API key format" Error
- Ensure your API key starts with `gsk_`
- Copy the entire key including the prefix

### "Failed to load PDF" Error
- Verify the PDF file is valid
- Check file size (max 50MB)
- Try a different PDF file

### "Groq API Error" Response
- Verify your API key is correct and valid
- Check your Groq API account has available quota
- Ensure you have internet connection
- Try selecting a different model

### Missing VAT Calculations
- Ensure the PDF contains clear transaction data
- Check that receipt details are visible in PDF content preview
- Verify the model has enough context from the document

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices (with limitations on large PDF files)

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Full |
| Firefox | ✅ Full |
| Safari  | ✅ Full |
| Edge    | ✅ Full |
| IE 11   | ❌ Not Supported |

## 💡 Tips & Best Practices

1. **PDF Quality**: Use high-quality PDFs with clear text for better extraction
2. **Document Structure**: Ensure summary and receipts are clearly separated
3. **API Key Security**: Don't share your API key; regenerate if compromised
4. **Batch Processing**: Process one PDF at a time for best results
5. **Review Results**: Always review AI-extracted values before using

## 📚 API Documentation

### Groq API Endpoint

```
POST https://api.groq.com/openai/v1/chat/completions
```

### Required Headers

```javascript
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is provided as-is for educational and personal use.

## ℹ️ Additional Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [MDN Web Docs - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 🙏 Acknowledgments

- [Groq](https://groq.com) - AI inference platform
- [PDF.js](https://mozilla.org/pdf.js/) - PDF viewer library
- [Mozilla](https://mozilla.org) - Open source support

---

**Version**: 1.0.0  
**Last Updated**: June 2026  
**Status**: Production Ready
