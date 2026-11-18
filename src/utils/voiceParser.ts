import type { Category, Product, VoiceIntent } from '../types.ts';

/**
 * Normalizes Indian language text, converts Devanagari numerals and written numbers to digits,
 * and strips common punctuation for robust multilingual voice intent detection.
 */
export function normalizeVoiceInput(input: string): string {
  if (!input) return '';
  let str = input.trim().toLowerCase();

  // Devanagari numerals to standard digits: ०१२३४५६७८९ -> 0123456789
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  devanagariDigits.forEach((digit, idx) => {
    str = str.split(digit).join(String(idx));
  });

  // Common Hindi/Marathi speech number words in English script and Devanagari
  str = str.replace(/\b(pandrah sau|15 sau)\b/gi, '1500');
  str = str.replace(/पंधराशे|पंद्रह सौ/g, '1500');
  str = str.replace(/\b(hazar|hajaar|hazaara|hajar)\b/gi, '1000');
  str = str.replace(/हजार|हज़ार/g, '1000');
  str = str.replace(/\b(do hazar|don hajar)\b/gi, '2000');
  str = str.replace(/दोन हजार|दो हजार/g, '2000');
  str = str.replace(/\b(panch sau|paach she|paachshe)\b/gi, '500');
  str = str.replace(/पाचशे|पांच सौ/g, '500');

  return str;
}

/**
 * Extracts ordinal/position numbers like "first", "second", "dusra", "doosra", "pahila", "2nd", etc.
 */
export function extractPosition(text: string): number | undefined {
  const t = text.toLowerCase();
  if (/\b(1st|first|pehla|pahila|ek number)\b/i.test(t) || /पहिला|पहला/.test(t)) return 1;
  if (/\b(2nd|second|dusra|doosra|don number)\b/i.test(t) || /दूसरा|दुसरा/.test(t)) return 2;
  if (/\b(3rd|third|teesra|tisra|teen number)\b/i.test(t) || /तीसरा|तिसरा/.test(t)) return 3;
  if (/\b(4th|fourth|chautha|char number)\b/i.test(t) || /चौथा/.test(t)) return 4;
  if (/\b(5th|fifth|paanchwa|paachva)\b/i.test(t) || /पाचवा|पांचवा/.test(t)) return 5;

  const match = t.match(/(?:product|item|क्रमांक|नंबर|number)\s*(\d+)/i);
  if (match) return parseInt(match[1], 10);

  const reverseMatch = t.match(/(\d+)(?:st|nd|rd|th)?\s*(?:product|item|वाला|वाले|क्रमांक)/i);
  if (reverseMatch) return parseInt(reverseMatch[1], 10);

  return undefined;
}

/**
 * Extracts price limits (e.g., under 1000, 1000 chya aat, 1000 ke andar, <= 1000)
 */
export function extractPriceLimit(text: string): { maxPrice?: number; minPrice?: number } {
  const norm = normalizeVoiceInput(text);

  const underMatch =
    norm.match(/(?:under|below|less than|kam|aat|chya aat|ke andar|aatle|se kam|च्या आत|च्या आतले|कमी)\s*(?:rs|rs\.|inr|₹|rupaye|rupayanchya|रुपये)?\s*(\d+)/i) ||
    norm.match(/(\d+)\s*(?:rs|rs\.|inr|₹|rupaye|rupayanchya|रुपये)?\s*(?:under|below|chya aat|chya aath|aat|aatle|ke andar|se kam|च्या आत|च्या आतले|पेक्षा कमी)/i);

  if (underMatch) {
    const val = parseInt(underMatch[1], 10);
    if (!isNaN(val) && val > 0) return { maxPrice: val };
  }

  // Generic digits if accompanied by under/aat/andar/kam/आत/कमी
  if (/under|aat|andar|kam|आत|कमी/i.test(norm)) {
    const anyDigit = norm.match(/(\d{3,5})/);
    if (anyDigit) {
      return { maxPrice: parseInt(anyDigit[1], 10) };
    }
  }

  return {};
}

/**
 * Extracts budget amount (e.g. "budget 1500", "mera budget pandrah sau hai", "majha budget 2000 aahe")
 */
export function extractBudget(text: string): number | undefined {
  const norm = normalizeVoiceInput(text);
  if (!norm.includes('budget') && !norm.includes('बजेट') && !norm.includes('खर्च') && !norm.includes('kharcha')) {
    return undefined;
  }
  const match =
    norm.match(/\b(?:budget|बजेट|kharcha)\s*(?:is|hai|aahe|आहे|of|set|to|=|:)?\s*(?:rs|rs\.|₹|inr)?\s*(\d+)\b/i) ||
    norm.match(/\b(?:rs|rs\.|₹|inr)?\s*(\d+)\s*(?:ka|cha|चा|चे)?\s*(?:budget|बजेट)\b/i) ||
    norm.match(/\b(\d{3,5})\b/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val >= 100) return val;
  }
  return undefined;
}

/**
 * Extracts quantity from voice (e.g., "quantity to 2", "do kar do", "don kar", "quantity 2")
 */
export function extractQuantity(text: string): number | undefined {
  const norm = normalizeVoiceInput(text);
  if (/\b(?:quantity|qty|प्रमाण|संख्या|पीस|pieces?)\b/i.test(norm) || /\b(?:kar|karo|कर|करा|change|set|to)\b/i.test(norm)) {
    if (/\b(two|do|don|दोन|दो|2)\b/i.test(norm)) return 2;
    if (/\b(three|teen|तीन|3)\b/i.test(norm)) return 3;
    if (/\b(four|char|chaar|चार|4)\b/i.test(norm)) return 4;
    if (/\b(five|paanch|paach|पाच|5)\b/i.test(norm)) return 5;
    if (/\b(one|ek|एक|1)\b/i.test(norm)) return 1;

    const match = norm.match(/\b(\d+)\b/);
    if (match) return parseInt(match[1], 10);
  }
  return undefined;
}

/**
 * Multilingual Colour Extractor supporting English, Hindi, Hinglish, Marathi, Roman Marathi
 */
export function extractColor(text: string): string | undefined {
  const norm = text.toLowerCase();

  // Black: काळा, काळी, काळे, काला, काली, काले, kala, kali, kale, kaala, kaali, black
  if (/काळा|काळी|काळे|काला|काली|काले/.test(text) || /\b(black|kala|kali|kale|kaala|kaali|kaale)\b/i.test(norm)) {
    return 'black';
  }
  // Red: लाल, laal, lal, red, crimson, maroon
  if (/लाल/.test(text) || /\b(red|laal|lal|crimson|maroon)\b/i.test(norm)) {
    return 'red';
  }
  // Blue: निळा, निळी, निळे, नीला, नीली, नीले, ब्लू, nila, nili, nile, neela, neeli, neele, blue, navy, indigo
  if (/निळा|निळी|निळे|नीला|नीली|नीले|ब्लू/.test(text) || /\b(blue|nila|nili|nile|neela|neeli|neele|navy|indigo)\b/i.test(norm)) {
    return 'blue';
  }
  // White: पांढरा, पांढरी, पांढरे, सफेद, सफ़ेद, pandhra, pandhri, pandhre, safed, white
  if (/पांढरा|पांढरी|पांढरे|सफेद|सफ़ेद/.test(text) || /\b(white|pandhra|pandhri|pandhre|safed)\b/i.test(norm)) {
    return 'white';
  }
  // Green: हिरवा, हिरवी, हिरवे, हरा, हरी, हरे, hara, hari, hare, hirwa, hirvi, green, olive
  if (/हिरवा|हिरवी|हिरवे|हरा|हरी|हरे/.test(text) || /\b(green|hara|hari|hare|hirwa|hirvi|olive)\b/i.test(norm)) {
    return 'green';
  }
  // Yellow: पिवळा, पिवळी, पिवळे, पीला, पीली, पीले, peela, peeli, peele, pivla, pivli, yellow, haldi
  if (/पिवळा|पिवळी|पिवळे|पीला|पीली|पीले/.test(text) || /\b(yellow|peela|peeli|peele|pivla|pivli|haldi)\b/i.test(norm)) {
    return 'yellow';
  }
  // Pink: गुलाबी, pink, gulabi
  if (/गुलाबी/.test(text) || /\b(pink|gulabi|rose)\b/i.test(norm)) {
    return 'pink';
  }
  // Brown: तपकिरी, ब्राउन, ब्राऊन, brown, tan, khaki, beige
  if (/तपकिरी|ब्राउन|ब्राऊन/.test(text) || /\b(brown|tapkiri|tan|khaki|beige)\b/i.test(norm)) {
    return 'brown';
  }
  // Grey: ग्रे, grey, gray, charcoal
  if (/ग्रे/.test(text) || /\b(grey|gray|charcoal)\b/i.test(norm)) {
    return 'grey';
  }

  return undefined;
}

/**
 * Multilingual Product Type & Category Extractor
 */
export function extractProductTypeAndCategory(text: string): { productType?: string; category?: Category } {
  const norm = text.toLowerCase();

  // Kurti / Kurta / Saree
  if (/कुर्ती|कुर्त्या|कुर्ता|कुर्ते/.test(text) || /\b(kurti|kurtis|kurta|kurtas|anarkali)\b/i.test(norm)) {
    return { productType: 'kurti', category: 'fashion' };
  }
  if (/साडी|साड्या|साड़ी/.test(text) || /\b(saree|sarees|sari|saris)\b/i.test(norm)) {
    return { productType: 'saree', category: 'fashion' };
  }

  // Shoes / Sneakers
  if (/शूज|जूते|जूता|चप्पल|बूट|स्नीकर्स/.test(text) || /\b(shoe|shoes|sneaker|sneakers|chappal|chappals|boot|boots|footwear|loafers|heels)\b/i.test(norm)) {
    return { productType: 'shoes', category: 'fashion' };
  }

  // T-shirts / Tops
  if (/टी-शर्ट|टीशर्ट|टॉप/.test(text) || /\b(tshirt|t-shirt|tee|tees|top|tops|polo)\b/i.test(norm)) {
    return { productType: 'tshirt', category: 'fashion' };
  }

  // Jeans / Trousers
  if (/जीन्स/.test(text) || /\b(jeans|jean|denim)\b/i.test(norm)) {
    return { productType: 'jeans', category: 'fashion' };
  }
  if (/पँट|पेंट|ट्राउझर|चीनो|कार्गो/.test(text) || /\b(trouser|trousers|chino|chinos|cargo|pants)\b/i.test(norm)) {
    return { productType: 'trousers', category: 'fashion' };
  }

  // Hoodies / Sweatshirts
  if (/हूडि|हुडी|स्वेटशर्ट/.test(text) || /\b(hoodie|hoodies|sweatshirt|sweatshirts)\b/i.test(norm)) {
    return { productType: 'hoodie', category: 'fashion' };
  }

  // Dresses
  if (/ड्रेस|गाऊन/.test(text) || /\b(dress|dresses|gown|maxi|sundress)\b/i.test(norm)) {
    return { productType: 'dress', category: 'fashion' };
  }

  // Bags / Backpacks / Wallets
  if (/बॅकपॅक|दप्तर/.test(text) || /\b(backpack|backpacks|laptop bag)\b/i.test(norm)) {
    return { productType: 'backpack', category: 'accessories' };
  }
  if (/हँडबॅग|पर्स|स्लिंग/.test(text) || /\b(handbag|handbags|purse|tote|sling bag)\b/i.test(norm)) {
    return { productType: 'handbag', category: 'accessories' };
  }
  if (/पाकीट|वॉलेट|बटवा/.test(text) || /\b(wallet|wallets|cardholder)\b/i.test(norm)) {
    return { productType: 'wallet', category: 'accessories' };
  }

  // Jewellery / Sunglasses
  if (/दागिने|नेकलेस|झुमके|बांगड्या/.test(text) || /\b(jewellery|jewelry|necklace|choker|earrings|jhumka|bangles)\b/i.test(norm)) {
    return { productType: 'jewellery', category: 'accessories' };
  }
  if (/चश्मा|गॉगल|सनग्लासेस/.test(text) || /\b(sunglasses|glasses|shades|goggles|chashma)\b/i.test(norm)) {
    return { productType: 'sunglasses', category: 'accessories' };
  }

  // Watches
  if (/घड्याळ|घड़ी|वॉच/.test(text) || /\b(watch|watches|smartwatch|chronograph)\b/i.test(norm)) {
    return { productType: 'watch', category: 'electronics' };
  }

  // Headphones / Audio / Gadgets
  if (/हेडफोन्स|हेडफोन|इयरबड्स|इयरफोन/.test(text) || /\b(headphone|headphones|earphone|earphones|earbud|earbuds|airpods)\b/i.test(norm)) {
    return { productType: 'headphones', category: 'electronics' };
  }
  if (/स्पीकर/.test(text) || /\b(speaker|speakers|bluetooth speaker)\b/i.test(norm)) {
    return { productType: 'speaker', category: 'electronics' };
  }
  if (/पॉवर बँक|पावर बैंक/.test(text) || /\b(powerbank|power bank|battery pack)\b/i.test(norm)) {
    return { productType: 'powerbank', category: 'electronics' };
  }
  if (/चार्जर/.test(text) || /\b(charger|adapter)\b/i.test(norm)) {
    return { productType: 'charger', category: 'electronics' };
  }
  if (/कीबोर्ड/.test(text) || /\b(keyboard|gaming keyboard)\b/i.test(norm)) {
    return { productType: 'keyboard', category: 'electronics' };
  }

  // Home & Kitchen
  if (/बाटली|बोतल/.test(text) || /\b(bottle|water bottle|flask)\b/i.test(norm)) {
    return { productType: 'bottle', category: 'home' };
  }
  if (/पॅन|कढई|तवा/.test(text) || /\b(pan|frying pan|cookware|tawa)\b/i.test(norm)) {
    return { productType: 'pan', category: 'home' };
  }
  if (/मग|कप/.test(text) || /\b(mug|coffee mug|cup)\b/i.test(norm)) {
    return { productType: 'mug', category: 'home' };
  }
  if (/लाइट्स|दिवे|मेणबत्ती/.test(text) || /\b(light|lights|fairy lights|candle)\b/i.test(norm)) {
    return { productType: 'lights', category: 'home' };
  }
  if (/बेडशीट|चादर/.test(text) || /\b(bedsheet|bed sheet|bedding|linens)\b/i.test(norm)) {
    return { productType: 'bedsheet', category: 'home' };
  }

  // Beauty & Skincare
  if (/सीरम|सनस्क्रीन/.test(text) || /\b(serum|face serum|sunscreen)\b/i.test(norm)) {
    return { productType: 'serum', category: 'beauty' };
  }
  if (/फेस वॉश|क्लिनझर/.test(text) || /\b(facewash|face wash|cleanser)\b/i.test(norm)) {
    return { productType: 'facewash', category: 'beauty' };
  }
  if (/हेअर ऑईल|तेल/.test(text) || /\b(hair oil|oil)\b/i.test(norm)) {
    return { productType: 'oil', category: 'beauty' };
  }
  if (/लिपस्टिक/.test(text) || /\b(lipstick|lip shade)\b/i.test(norm)) {
    return { productType: 'lipstick', category: 'beauty' };
  }

  // Broad categories
  if (/\b(fashion|clothes|clothing|wear|dress|कपडे)\b/i.test(norm)) {
    return { category: 'fashion' };
  }
  if (/\b(electronics|gadgets|tech|इलेक्ट्रॉनिक्स)\b/i.test(norm)) {
    return { category: 'electronics' };
  }
  if (/\b(home|kitchen|घरातील)\b/i.test(norm)) {
    return { category: 'home' };
  }
  if (/\b(beauty|skincare|मेकअप)\b/i.test(norm)) {
    return { category: 'beauty' };
  }
  if (/\b(accessories|ॲक्सेसरीज)\b/i.test(norm)) {
    return { category: 'accessories' };
  }

  return {};
}

/**
 * Detects language based on script and characteristic markers
 */
export function detectLanguage(text: string): string {
  if (!text) return 'English';
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (devanagariCount > 2) {
    if (/मला|दाखव|टाक|सांग|आहे|च्या|आत|करा|बघ|काळी|काळे|काळा|निळी|पांढरी|कुर्ती/i.test(text)) return 'Marathi';
    return 'Hindi';
  }

  const t = text.toLowerCase();
  if (/\b(mala|dakhav|dakhva|taak|sang|aahe|maajha|majhya|aat|swasta|kahi|pahila|dusra|radd|ahe|kali|kale|nili|pandhri)\b/i.test(t)) {
    return 'Roman Marathi';
  }
  if (/\b(mujhe|dikhao|dikhaye|daal|daalo|batao|mera|meri|pandrah|sau|hazar|sasta|karo|bataiye|pehle|kaala|neeli|laal|dhoondh)\b/i.test(t)) {
    return 'Hinglish';
  }

  return 'English';
}

/**
 * Main intent parsing function for Indian Multilingual voice shopping.
 * Returns structured parameters and cute Chotu response text.
 */
export function parseVoiceIntent(rawTranscript: string, currentCatalog: Product[] = []): VoiceIntent {
  const transcript = rawTranscript.trim();
  const norm = normalizeVoiceInput(transcript);
  const lang = detectLanguage(transcript);

  // 1. SHOW MORE
  if (/\b(show more|aur dikhao|aankhi dakhav|more options|aur options|next products|more items|आणखी दाखव|और दिखाओ)\b/i.test(norm)) {
    return {
      intent: 'show_more',
      transcript,
      detectedLanguage: lang,
      parameters: {},
      replyText: 'Haan ji! Chotu aapke liye aur cute options load kar raha hai!',
      chotuVoiceMarathi: 'हो नक्कीच! छोटू आणखी पर्याय दाखवतो आहे!',
      chotuVoiceHindi: 'हां जी! छोटू आपके लिए और प्यारे ऑप्शंस ला रहा है!',
    };
  }

  // 2. SORT BY PRICE LOW / HIGH
  if (/\b(sort by lowest price|lowest price|cheapest first|saste pehle|kam price pehle|low to high|कमी किमतीत|सस्ते पहले)\b/i.test(norm)) {
    return {
      intent: 'sort_price_low',
      transcript,
      detectedLanguage: lang,
      parameters: { sortBy: 'price_asc' },
      replyText: 'Arre wah! Chotu ne sabse saste aur badhiya products pehle laga diye!',
      chotuVoiceMarathi: 'छोटूने सर्वात स्वस्त आणि मस्त प्रॉडक्ट्स आधी लावले आहेत!',
      chotuVoiceHindi: 'अरे वाह! छोटू ने सबसे कम कीमत वाले प्रोडक्ट्स पहले लगा दिए!',
    };
  }
  if (/\b(sort by highest price|expensive first|high to low|जास्त किमतीत|महंगे पहले)\b/i.test(norm)) {
    return {
      intent: 'sort_price_high',
      transcript,
      detectedLanguage: lang,
      parameters: { sortBy: 'price_desc' },
      replyText: 'Done ji! Premium high-end options sabse upar set kar diye!',
      chotuVoiceMarathi: 'प्रीमियम ऑप्शन्स सर्वात वर दाखवले आहेत!',
      chotuVoiceHindi: 'प्रीमियम ऑप्शंस सबसे ऊपर सेट कर दिए गए हैं!',
    };
  }

  // 3. COMPARE PRODUCTS
  if (/\b(compare|comparison|tulna|dono mein kya difference|फरक काय|तुलना करा)\b/i.test(norm)) {
    return {
      intent: 'compare',
      transcript,
      detectedLanguage: lang,
      parameters: { comparePositions: [1, 2] },
      replyText: 'Yay! Chotu dono products ka comparison side-by-side dikha raha hai!',
      chotuVoiceMarathi: 'छोटू दोन्ही प्रॉडक्ट्सची तुलना स्क्रीनवर दाखवत आहे!',
      chotuVoiceHindi: 'छोटू दोनों प्रोडक्ट्स की तुलना दिखा रहा है!',
    };
  }

  // 4. CLEAR CART
  if (/\b(clear my cart|clear cart|empty cart|cart khali karo|cart clear karo|कार्ट रिकामी करा|कार्ट खाली करो)\b/i.test(norm)) {
    return {
      intent: 'clear_cart',
      transcript,
      detectedLanguage: lang,
      parameters: {},
      replyText: 'Cart clear kar diya gaya hai ji! Naye सिरे se shopping shuru karein?',
      chotuVoiceMarathi: 'कार्ट पूर्णपणे रिकामी केली आहे!',
      chotuVoiceHindi: 'कार्ट खाली कर दिया गया है जी!',
    };
  }

  // 5. REMOVE ITEM
  if (/\b(remove that item|remove item|delete item|item hatao|cart se nikal|हटाओ|काढून टाक)\b/i.test(norm) && !norm.includes('filter')) {
    const pos = extractPosition(transcript);
    return {
      intent: 'remove_item',
      transcript,
      detectedLanguage: lang,
      parameters: { position: pos },
      replyText: 'Item cart se remove kar diya gaya hai!',
      chotuVoiceMarathi: 'आयटम कार्टमधून काढून टाकला आहे!',
      chotuVoiceHindi: 'आइटम कार्ट से हटा दिया गया है!',
    };
  }

  // 6. SET BUDGET
  const budgetVal = extractBudget(transcript);
  if (budgetVal !== undefined) {
    return {
      intent: 'set_budget',
      transcript,
      detectedLanguage: lang,
      parameters: { budget: budgetVal },
      replyText: `Haan ji! Aapka shopping budget ₹${budgetVal.toLocaleString('en-IN')} set kar diya! Chotu budget sambhaal lega!`,
      chotuVoiceMarathi: `तुमचा बजेट ₹${budgetVal} सेट केला आहे! छोटू खर्च सांभाळेल!`,
      chotuVoiceHindi: `हाँ जी! आपका बजट ₹${budgetVal} तय कर दिया गया है! बताइए क्या ढूंढें?`,
    };
  }

  // 7. UNDO LAST CART ACTION
  if (/\b(undo|pichla|maagcha|wapas|cancel last|revert|रद्द|मागे|वापस)\b/i.test(norm) && !norm.includes('order')) {
    return {
      intent: 'undo',
      transcript,
      detectedLanguage: lang,
      parameters: {},
      replyText: 'Pichla action undo kar diya ji! Cart restore ho gaya.',
      chotuVoiceMarathi: 'मागची कृती रद्द केली आहे! कार्ट पूर्ववत झाली.',
      chotuVoiceHindi: 'पिछला एक्शन अनडू कर दिया गया है जी!',
    };
  }

  // 8. CART TOTAL & REMAINING BUDGET
  if (
    /\b(total|kitna hua|kiti zala|sang|batao|bataiye|kiti zale|bill|kitna bacha|shillak|remaining|सांग|एकूण|टोटल)\b/i.test(norm) &&
    (norm.includes('cart') || norm.includes('पैसे') || norm.includes('bill') || norm.includes('total') || norm.includes('खर्च'))
  ) {
    return {
      intent: 'get_cart_total',
      transcript,
      detectedLanguage: lang,
      parameters: {},
      replyText: 'Chotu aapke cart ka total aur budget status check kar raha hai!',
      chotuVoiceMarathi: 'मी तुमच्या कार्टची एकूण रक्कम तपासतो आहे!',
      chotuVoiceHindi: 'आपके कार्ट का कुल योग छोटू अभी बता रहा है!',
    };
  }

  // 9. FIND CHEAPER ALTERNATIVE
  if (/\b(cheaper|sasta|swast|swasta|kam daam|kam price|affordable|स्वस्त|सस्ता|कमी किमतीत)\b/i.test(norm)) {
    return {
      intent: 'find_cheaper',
      transcript,
      detectedLanguage: lang,
      parameters: { sortBy: 'price_asc' },
      replyText: 'Arre wah! Isse saste aur mast options bhi mil gaye!',
      chotuVoiceMarathi: 'अरे वा! यापेक्षा स्वस्त आणि छान पर्याय सापडले!',
      chotuVoiceHindi: 'अरे वाह! इससे सस्ते और बढ़िया विकल्प मिल गए!',
    };
  }

  // 10. CHANGE QUANTITY
  const targetQty = extractQuantity(transcript);
  if (targetQty !== undefined && (norm.includes('quantity') || norm.includes('kar') || norm.includes('set') || norm.includes('करा'))) {
    const pos = extractPosition(transcript) || 1;
    return {
      intent: 'update_quantity',
      transcript,
      detectedLanguage: lang,
      parameters: { quantity: targetQty, position: pos },
      replyText: `Done ji! Item ki quantity ${targetQty} kar di gayi hai!`,
      chotuVoiceMarathi: `आयटमची संख्या ${targetQty} केली आहे!`,
      chotuVoiceHindi: `डन जी! वस्तु की संख्या ${targetQty} कर दी गई है!`,
    };
  }

  // 11. ADD TO CART BY POSITION OR KEYWORD
  const posForAdd = extractPosition(transcript);
  const isAddKeyword = /\b(add|daal|taak|daalo|ghya|kharidna|buy|put)\b/i.test(norm) || /टाक|टाका|घ्या|डालो|ऐड|खरेदी/.test(norm);
  const hasCartMention = norm.includes('cart') || norm.includes('कार्ट') || /कार्टमध्ये|कार्टात/.test(norm);
  const isAddCommand = isAddKeyword && (hasCartMention || posForAdd !== undefined);

  if (isAddCommand && posForAdd !== undefined) {
    const posWord = posForAdd === 2 ? 'Doosra' : `${posForAdd} number ka`;
    return {
      intent: 'add_to_cart',
      transcript,
      detectedLanguage: lang,
      parameters: { position: posForAdd, quantity: 1 },
      replyText: `Done ji! ${posWord} item tumhare cart mein add kar diya! Shopping mast chal rahi hai!`,
      chotuVoiceMarathi: `डन! ${posForAdd === 2 ? 'दुसरा' : `${posForAdd} क्रमांकाचा`} प्रॉडक्ट कार्टमध्ये जोडला आहे!`,
      chotuVoiceHindi: `डन जी! ${posForAdd === 2 ? 'दूसरा' : `${posForAdd} नंबर का`} प्रोडक्ट कार्ट में डाल दिया गया है!`,
    };
  }

  // 12. ORDER CONFIRMATION
  if (
    (/\b(confirm|book|place)\b/i.test(norm) && /\b(order|checkout)\b/i.test(norm)) ||
    /\b(checkout|order confirm|order book)\b/i.test(norm) ||
    /ऑर्डर कन्फर्म|ऑर्डर बुक|ऑर्डर करा|खरेदी पूर्ण/.test(norm)
  ) {
    return {
      intent: 'confirm_order',
      transcript,
      detectedLanguage: lang,
      parameters: {},
      replyText: 'Aapka order review karke confirm karne ja rahe hain!',
      chotuVoiceMarathi: 'तुमची ऑर्डर कन्फर्म करत आहे!',
      chotuVoiceHindi: 'आपका आर्डर कन्फर्म किया जा रहा है!',
    };
  }

  // 13. RESET / SHOW ALL
  if (/\b(show all|sab dikhao|sagle dakhav|reset|clear filter|सगळे दाखव|सब दिखाओ)\b/i.test(norm)) {
    return {
      intent: 'reset_filter',
      transcript,
      detectedLanguage: lang,
      parameters: {},
      replyText: 'Saare products screen par hazir hain ji!',
      chotuVoiceMarathi: 'सर्व प्रॉडक्ट्स स्क्रीनवर हजर आहेत!',
      chotuVoiceHindi: 'सभी उत्पाद स्क्रीन पर मौजूद हैं जी!',
    };
  }

  // 14. STRUCTURED PRODUCT SEARCH & FILTERS
  const priceLimits = extractPriceLimit(transcript);
  const color = extractColor(transcript);
  const { productType, category } = extractProductTypeAndCategory(transcript);

  // Clean query for UI display
  const cleanQuery = norm
    .replace(/\b(oye|chotu|chhotu|show|me|please|dikhao|dikhaye|dakhav|dakhva|mala|mujhe|humko|aat|chya|ke|andar|rupaye|rupayanchya|rs|under|below|less than|sound|search|find|दाखव|दाखवा|दाखव|मला|दिखाओ)\b/gi, '')
    .replace(/\b\d+\b/g, '')
    .trim();

  const colorLabel = color ? `${color} ` : '';
  const typeLabel = productType || (category ? `${category} items` : cleanQuery || 'products');

  let replyText = `Haan ji! Chotu tumhare liye ${colorLabel}${typeLabel}`;
  if (priceLimits.maxPrice) {
    replyText += ` under ₹${priceLimits.maxPrice}`;
  }
  replyText += ` dhoondh raha hai!`;

  return {
    intent: 'search',
    transcript,
    detectedLanguage: lang,
    parameters: {
      query: cleanQuery || undefined,
      requestedType: productType,
      requestedColor: color,
      category,
      maxPrice: priceLimits.maxPrice,
      minPrice: priceLimits.minPrice,
    },
    replyText,
  };
}

/**
 * Filter products using strict priorities:
 * Priority 1: Match requested product type
 * Priority 2: Match requested category
 * Priority 3: Match requested colour (NEVER silently substitute different colours!)
 * Priority 4: Apply price limits
 * Priority 5: Check availability
 *
 * Returns:
 * - matchingProducts: strictly satisfying ALL active filters!
 * - otherColorOptions: suggested items in other colours (NEVER mixed into search results)
 * - noMatchMessage: truthful explanation if no exact match exists
 */
export function filterProducts(
  products: Product[],
  intent: VoiceIntent
): {
  matchingProducts: Product[];
  otherColorOptions: Product[];
  noMatchMessage?: string;
} {
  const { requestedType, requestedColor, maxPrice, minPrice, category, sortBy, query } =
    intent.parameters;

  let filtered = products.filter((p) => p.inStock);

  // 1. Strict Product Type Match
  if (requestedType) {
    filtered = filtered.filter(
      (p) => (p.productType || '').toLowerCase() === requestedType.toLowerCase()
    );
  }

  // 2. Strict Category Match
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  // 3. Strict Colour Match (CRITICAL: Every item MUST have this exact verified color)
  if (requestedColor) {
    filtered = filtered.filter(
      (p) => (p.color || '').toLowerCase() === requestedColor.toLowerCase()
    );
  }

  // 4. Price Limits
  if (maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= maxPrice);
  }
  if (minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= minPrice);
  }

  // 5. Fallback generic text query ONLY if neither type nor color was extracted
  if (!requestedType && !requestedColor && !category && query) {
    const qTokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    filtered = filtered.filter((p) => {
      const textCorpus = `${p.name} ${p.marathiName || ''} ${p.hindiName || ''} ${p.description} ${p.tags.join(' ')}`.toLowerCase();
      return qTokens.every((t) => textCorpus.includes(t));
    });
  }

  // Sorting
  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // Separate alternative color options (NEVER mixed into exact results)
  let otherColorOptions: Product[] = [];
  if (requestedColor && (requestedType || category)) {
    otherColorOptions = products.filter((p) => {
      if (!p.inStock) return false;
      if (requestedType && (p.productType || '').toLowerCase() !== requestedType.toLowerCase()) return false;
      if (category && p.category !== category) return false;
      if ((p.color || '').toLowerCase() === requestedColor.toLowerCase()) return false;
      if (maxPrice !== undefined && p.price > maxPrice) return false;
      return true;
    }).slice(0, 4);
  }

  // Truthful message when exact matches are empty
  let noMatchMessage: string | undefined = undefined;
  if (filtered.length === 0) {
    const colorDesc = requestedColor ? `${requestedColor} ` : '';
    const typeDesc = requestedType || (category ? `${category} items` : 'products');

    if (maxPrice !== undefined) {
      noMatchMessage = `Sorry, Chotu ko ₹${maxPrice} ke andar exact ${colorDesc}${typeDesc} nahi mila. Colour ya budget change karke dekhein?`;
    } else {
      noMatchMessage = `Sorry, Chotu ko exact ${colorDesc}${typeDesc} nahi mila. Colour change karke dekhein?`;
    }
  }

  return { matchingProducts: filtered, otherColorOptions, noMatchMessage };
}
