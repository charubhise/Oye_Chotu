# 🤖 Oye Chotu! — “Bas Bolo, Chotu Sambhaal Lega!”

> **A Voice-First Indian Multilingual Shopping Platform**
> Speak in **Hindi, Marathi, Hinglish, Roman Marathi, or English** to instantly discover products, set budgets, add items to your cart, and place orders.

---

## 🌟 Key Features

1. **True Voice-First Interaction**: User speaks naturally into the microphone; speech is processed into shopping intents and the catalogue updates instantly.
2. **Indian Multilingual Understanding**:
   - **Hindi**: “मुझे ब्लू कुर्ती दिखाओ”, “मेरा बजट पंद्रह सौ रुपये है”, “दूसरा प्रोडक्ट कार्ट में डालो”
   - **Marathi (Devanagari)**: “मला हजार रुपयांच्या आत काळे शूज दाखव”, “दुसरा प्रॉडक्ट कार्टमध्ये टाक”, “माझ्या कार्टचा टोटल सांग”
   - **Roman Marathi**: “Mala 1000 rupayanchya aat kale shoes dakhav”, “Dusra product cart madhe taak”, “Majhya cart cha total sang”
   - **Hinglish**: “Oye Chotu, show black shoes under 1000”, “Pichla action wapas lo”, “Sasta option dikhao”
   - **English**: “Set budget to 1500”, “Change quantity to two”, “Confirm my order”
3. **8 Spoken Shopping Actions**:
   - 🔍 Search & Filters (e.g. *Black shoes under 1000*, *Blue kurti*)
   - 💰 Budget Setting (*₹1,500 budget with live spending tracker*)
   - 🛒 Add by displayed position (*Add 2nd product to cart*)
   - 🔢 Quantity Update (*Change quantity to 2*)
   - 🏷️ Cheaper Alternative (*Show me something cheaper*)
   - 🧾 Cart Total & Remaining Budget (*Majhya cart cha total sang*)
   - ↩️ Undo Last Cart Action (*Reverts last cart change*)
   - ✅ Review & Confirm Demo Order (*Checkout and order simulation*)
4. **24 Rich Products** across Fashion, Electronics, Home, Beauty, and Accessories.
5. **Modern Dark Navy UI** with energetic orange/purple highlights and an animated Chotu mascot.

---

## 🚀 How to Run the Python Streamlit App

### 1. Prerequisites
- Python 3.10 or 3.11+
- Virtual environment (recommended)

### 2. Installation
```bash
# Clone or navigate to the repository folder
git clone <repo-url>
cd oye-chotu

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. (Optional) Set Google GenAI API Key for Advanced Multimodal Speech
```bash
export GEMINI_API_KEY="your-gemini-api-key"
```
*Note: If no API key is provided, the application automatically uses its built-in multilingual regex/NLP engine, ensuring 100% functionality offline.*

### 4. Launch Streamlit
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 🧪 Spoken Test Commands to Try

| # | Action | Spoken Test Command | Expected Result |
|---|---|---|---|
| 1 | Set Budget | `Mera budget pandrah sau rupaye hai` | Budget set to ₹1,500 with green progress bar |
| 2 | Filter Products | `मला हजार रुपयांच्या आत काळे शूज दाखव` | Displays black formal & sneaker shoes ≤ ₹1,000 |
| 3 | Add to Cart | `दुसरा प्रॉडक्ट कार्टमध्ये टाक` | Adds Urban Black Running Sneakers (#2) to cart |
| 4 | Change Quantity | `Change quantity to two` | Updates cart quantity to 2 |
| 5 | Cheaper Deals | `Kahi swasta dakhav` / `Show cheaper` | Sorts and displays affordable alternatives |
| 6 | Undo Action | `Undo last cart action` | Reverts the previous cart change |
| 7 | Cart Total | `Majhya cart cha total sang` | Chotu announces total and remaining budget |
| 8 | Order Confirmation | `Confirm my order` | Confirms demo order with summary & order ID |

---

## 📁 Project Structure

```
├── app.py              # Streamlit voice-first UI & audio capture
├── products.py         # 24 sample products & filtering logic
├── voice_commands.py   # Multilingual NLP parser + Google GenAI audio client
├── cart.py             # Cart state, budget tracker, and undo stack
├── database.py         # SQLite storage for catalogue and orders
├── requirements.txt    # Python dependencies
└── README.md           # Documentation & instructions
```
