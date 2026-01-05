# 🥩 ProteinValue - Smart Protein Shopping

**Compare protein products by cost per gram and find the best value.**

A Progressive Web App (PWA) that helps shoppers make informed decisions about protein purchases.

---

## ✨ Features

### Core Functionality
- 📷 **Camera OCR** - Scan nutrition labels to auto-fill values (uses free Tesseract.js)
- ✏️ **Manual Entry** - Type in product details
- 💰 **Cost Analysis** - See cost per gram and protein per dollar
- 🏆 **Best Value** - Instantly identify the best deal
- 🌈 **Diversity Tracking** - Track variety of protein sources
- 📊 **Visual Comparison** - Bar chart comparing all products

### Technical Features
- 📱 **PWA** - Install on home screen like a native app
- 💾 **Offline Storage** - Products saved locally
- 🔒 **Privacy First** - All data stays on your device
- 🌐 **Cross-Platform** - Works on any device with a browser

---

## 🚀 Quick Start

### Option 1: Run Locally (5 minutes)

1. **Download files** to a folder
2. **Start a local server:**
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve
   
   # Or just double-click index.html
   ```
3. **Open** http://localhost:8000

### Option 2: Deploy to Web (10 minutes)

**Netlify (Easiest):**
1. Go to https://netlify.com
2. Drag the folder onto "Deploy manually"
3. Done! Get your URL

**Vercel:**
```bash
npm install -g vercel
vercel
```

**GitHub Pages:**
1. Create repository
2. Push files
3. Enable Pages in settings

---

## 📱 How to Use

### Manual Entry
1. Enter product name
2. Enter price
3. Enter total protein (or servings × protein/serving)
4. Select protein source type
5. Click "Add Product"

### Camera Mode (OCR)
1. Switch to "📷 Camera" mode
2. Click "Start Camera"
3. Point at nutrition label
4. Click "Capture Label"
5. Review detected values
6. Add price and source manually
7. Click "Add Product"

### Comparing Products
- Products are automatically ranked by cost per gram
- 🏆 Best value is highlighted
- View diversity of protein sources
- Check summary statistics

---

## 📁 Project Structure

```
protein-value/
├── index.html          # Main HTML structure
├── styles.css          # Responsive styling
├── app.js              # Core JavaScript logic + OCR
├── manifest.json       # PWA configuration
├── service-worker.js   # Offline support
└── README.md           # This file
```

---

## 🔧 Customization

### Add More Protein Sources
Edit `app.js`, find `PROTEIN_SOURCES`:
```javascript
const PROTEIN_SOURCES = {
    // Add your custom sources
    'cricket': { label: 'Cricket', category: 'other', emoji: '🦗' },
    // ...
};
```

### Change Theme Colors
Edit `styles.css`:
```css
:root {
    --primary: #059669;      /* Main green */
    --primary-dark: #047857; /* Darker green */
    /* ... */
}
```

---

## 💡 Tips for Best Results

### OCR Tips
- Use good lighting
- Hold camera steady
- Focus on the Nutrition Facts section
- Works best with clear, printed labels

### Value Comparison Tips
- Compare same serving sizes when possible
- Consider amino acid profiles for complete proteins
- Factor in taste/mixability (not just cost!)
- Whole foods often beat powders on cost per gram

---

## 🛣️ Roadmap

### Version 1.0 (Current)
- ✅ Manual product entry
- ✅ Camera OCR for labels
- ✅ Cost per gram calculation
- ✅ Diversity tracking
- ✅ Local storage
- ✅ PWA support

### Future Ideas
- [ ] Barcode scanning (UPC lookup)
- [ ] Price history tracking
- [ ] Community price database
- [ ] Amazon/Walmart price lookup
- [ ] Amino acid profile comparison
- [ ] Export/share comparisons

---

## 🔒 Privacy

- **All data stays on your device**
- No accounts required
- No tracking or analytics
- Optional: Share anonymously to help others (checkbox)

---

## 📄 License

MIT License - Free to use, modify, distribute.

---

## 🙏 Acknowledgments

- **Tesseract.js** - Free OCR in the browser
- **Chart.js** - Beautiful charts
- **MileSaver** - Design inspiration

---

**Built with ❤️ for smart shoppers everywhere**
