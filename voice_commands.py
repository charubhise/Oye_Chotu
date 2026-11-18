"""
Voice Command Recognition and Structured NLP Intent Parser for Oye Chotu!
Processes multilingual speech (Hindi, Marathi, Hinglish, Roman Marathi, English)
extracting structured filters: product_type, color, category, max_price, min_price, position, quantity.
Uses Google Gen AI Python SDK (google-genai) with robust local NLP fallback.
"""

import os
import re
import json
from typing import Dict, Any, Optional, Tuple, List


def normalize_speech(text: str) -> str:
    """Standardizes numbers, Devanagari numerals, and colloquial speech tokens."""
    if not text:
        return ""
    s = text.strip().lower()

    # Devanagari digits
    dev_digits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]
    for i, d in enumerate(dev_digits):
        s = s.replace(d, str(i))

    # Spoken Indian numbers
    s = re.sub(r"\b(pandrah sau|15 sau)\b", "1500", s)
    s = s.replace("पंधराशे", "1500").replace("पंद्रह सौ", "1500")
    s = re.sub(r"\b(hazar|hajaar|hazaara|hajar)\b", "1000", s)
    s = s.replace("हजार", "1000").replace("हज़ार", "1000")
    s = re.sub(r"\b(do hazar|don hajar)\b", "2000", s)
    s = s.replace("दोन हजार", "2000").replace("दो हजार", "2000")
    s = re.sub(r"\b(panch sau|paach she|paachshe)\b", "500", s)
    s = s.replace("पाचशे", "500").replace("पांच सौ", "500")

    return s


def detect_language(text: str) -> str:
    if not text:
        return "English"

    dev_chars = len(re.findall(r"[\u0900-\u097F]", text))
    if dev_chars > 2:
        if re.search(r"मला|दाखव|टाक|सांग|आहे|च्या|आत|करा|बघ|काळी|काळे|काळा|निळी|कुर्ती", text):
            return "Marathi"
        return "Hindi"

    t = text.lower()
    if re.search(r"\b(mala|dakhav|dakhva|taak|sang|aahe|maajha|majhya|aat|swasta|kahi|pahila|dusra|radd|ahe|kali|kale|nili|pandhri)\b", t):
        return "Roman Marathi"
    if re.search(r"\b(mujhe|dikhao|dikhaye|daal|daalo|batao|mera|meri|pandrah|sau|hazar|sasta|karo|bataiye|pehle|kaala|neeli|laal)\b", t):
        return "Hinglish"

    return "English"


def extract_budget(text: str) -> Optional[int]:
    norm = normalize_speech(text)
    if "budget" not in norm and "बजेट" not in norm and "kharcha" not in norm and "खर्च" not in norm:
        return None

    m = re.search(r"\b(?:budget|बजेट|kharcha)\s*(?:is|hai|aahe|आहे|of|set|to|=|:)?\s*(?:rs|rs\.|₹|inr)?\s*(\d+)\b", norm)
    if not m:
        m = re.search(r"\b(\d{3,5})\b", norm)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass
    return None


def extract_position(text: str) -> Optional[int]:
    t = text.lower()
    if re.search(r"\b(1st|first|pehla|pahila|ek number)\b", t) or "पहिला" in t or "पहला" in t:
        return 1
    if re.search(r"\b(2nd|second|dusra|doosra|don number)\b", t) or "दूसरा" in t or "दुसरा" in t:
        return 2
    if re.search(r"\b(3rd|third|teesra|tisra|teen number)\b", t) or "तीसरा" in t or "तिसरा" in t:
        return 3
    if re.search(r"\b(4th|fourth|chautha|char number)\b", t) or "चौथा" in t:
        return 4
    if re.search(r"\b(5th|fifth|paanchwa|paachva)\b", t) or "पाचवा" in t or "पांचवा" in t:
        return 5

    m = re.search(r"(?:product|item|क्रमांक|नंबर|number)\s*(\d+)", t)
    if m:
        return int(m.group(1))

    m2 = re.search(r"(\d+)(?:st|nd|rd|th)?\s*(?:product|item|वाला|वाले|क्रमांक)", t)
    if m2:
        return int(m2.group(1))

    return None


def extract_price_limit(text: str) -> Dict[str, Optional[int]]:
    norm = normalize_speech(text)
    under_m = re.search(r"(?:under|below|less than|kam|aat|chya aat|ke andar|आत|आतले|च्या आत|च्या आतले|कमी)\s*(?:rs|rs\.|inr|₹|rupaye|rupayanchya|रुपये)?\s*(\d+)", norm)
    if not under_m:
        under_m = re.search(r"(\d+)\s*(?:rs|rs\.|inr|₹|rupaye|rupayanchya|रुपये)?\s*(?:under|below|chya aat|chya aath|aat|aatle|ke andar|se kam|च्या आत|च्या आतले|पेक्षा कमी)", norm)

    if under_m:
        return {"max_price": int(under_m.group(1))}

    if re.search(r"under|aat|andar|kam|आत|कमी", norm):
        any_d = re.search(r"(\d{3,5})", norm)
        if any_d:
            return {"max_price": int(any_d.group(1))}

    return {"max_price": None}


def extract_color(text: str) -> Optional[str]:
    """Extracts canonical colour in English from multilingual speech."""
    t = text.lower()

    # Black
    if re.search(r"काळा|काळी|काळे|काला|काली|काले", text) or re.search(r"\b(black|kala|kali|kale|kaala|kaali|kaale)\b", t):
        return "black"
    # Red
    if "लाल" in text or re.search(r"\b(red|laal|lal)\b", t):
        return "red"
    # Blue
    if re.search(r"निळा|निळी|निळे|नीला|नीली|नीले|ब्लू", text) or re.search(r"\b(blue|nila|nili|nile|neela|neeli|neele)\b", t):
        return "blue"
    # White
    if re.search(r"पांढरा|पांढरी|पांढरे|सफेद|सफ़ेद", text) or re.search(r"\b(white|pandhra|pandhri|pandhre|safed)\b", t):
        return "white"
    # Green
    if re.search(r"हिरवा|हिरवी|हिरवे|हरा|हरी|हरे", text) or re.search(r"\b(green|hara|hari|hare|hirwa|hirvi)\b", t):
        return "green"
    # Yellow
    if re.search(r"पिवळा|पिवळी|पिवळे|पीला|पीली|पीले", text) or re.search(r"\b(yellow|peela|peeli|peele|pivla|pivli)\b", t):
        return "yellow"
    # Brown
    if re.search(r"तपकिरी|ब्राउन|ब्राऊन", text) or re.search(r"\b(brown|tapkiri)\b", t):
        return "brown"

    return None


def extract_product_type_and_category(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extracts canonical product_type and category from multilingual speech."""
    t = text.lower()

    # Kurti / Kurta
    if re.search(r"कुर्ती|कुर्त्या|कुर्ता|कुर्ते", text) or re.search(r"\b(kurti|kurtis|kurta|kurtas)\b", t):
        return "kurti", "fashion"
    # Shoes / Sneakers
    if re.search(r"शूज|जूते|जूता|चप्पल|बूट|स्नीकर्स", text) or re.search(r"\b(shoe|shoes|sneaker|sneakers|chappal|chappals|boot|boots|footwear)\b", t):
        return "shoes", "fashion"
    # Saree
    if re.search(r"साडी|साड्या|साड़ी", text) or re.search(r"\b(saree|sarees|sari|saris)\b", t):
        return "saree", "fashion"
    # Jeans
    if re.search(r"जीन्स|पँट|पेंट", text) or re.search(r"\b(jeans|jean|denim|pants|trouser)\b", t):
        return "jeans", "fashion"
    # Headphones / Earphones
    if re.search(r"हेडफोन्स|हेडफोन|इयरबड्स|इयरफोन", text) or re.search(r"\b(headphone|headphones|earphone|earphones|earbud|earbuds|airpods)\b", t):
        return "headphones", "electronics"
    # Watch
    if re.search(r"घड्याळ|घड़ी|वॉच", text) or re.search(r"\b(watch|smartwatch|fitness tracker)\b", t):
        return "watch", "electronics"
    # Powerbank
    if re.search(r"पॉवर बँक|पावर बैंक", text) or re.search(r"\b(powerbank|power bank|battery pack)\b", t):
        return "powerbank", "electronics"
    # Keyboard
    if "कीबोर्ड" in text or re.search(r"\b(keyboard|gaming keyboard)\b", t):
        return "keyboard", "electronics"
    # Speaker
    if "स्पीकर" in text or re.search(r"\b(speaker|speakers|bluetooth speaker)\b", t):
        return "speaker", "electronics"
    # Charger
    if "चार्जर" in text or re.search(r"\b(charger|adapter)\b", t):
        return "charger", "electronics"
    # Bottle
    if re.search(r"बाटली|बोतल", text) or re.search(r"\b(bottle|water bottle|flask)\b", t):
        return "bottle", "home"
    # Pan
    if re.search(r"पॅन|कढई|तवा", text) or re.search(r"\b(pan|frying pan|cookware|tawa)\b", t):
        return "pan", "home"
    # Mug
    if re.search(r"मग|कप", text) or re.search(r"\b(mug|coffee mug|cup)\b", t):
        return "mug", "home"
    # Lights
    if re.search(r"लाइट्स|दिवे", text) or re.search(r"\b(light|lights|fairy lights)\b", t):
        return "lights", "home"
    # Bedsheet
    if re.search(r"बेडशीट|चादर", text) or re.search(r"\b(bedsheet|bed sheet|linens)\b", t):
        return "bedsheet", "home"
    # Serum
    if "सीरम" in text or re.search(r"\b(serum|face serum)\b", t):
        return "serum", "beauty"
    # Facewash
    if "फेस वॉश" in text or re.search(r"\b(facewash|face wash)\b", t):
        return "facewash", "beauty"
    # Hair oil
    if re.search(r"हेअर ऑईल|तेल", text) or re.search(r"\b(hair oil|oil)\b", t):
        return "oil", "beauty"
    # Lipstick
    if "लिपस्टिक" in text or re.search(r"\b(lipstick|lip shade)\b", t):
        return "lipstick", "beauty"
    # Wallet
    if re.search(r"पाकीट|पर्स|बटवा", text) or re.search(r"\b(wallet|purse)\b", t):
        return "wallet", "accessories"
    # Sunglasses
    if re.search(r"चश्मा|गॉगल", text) or re.search(r"\b(sunglasses|glasses|shades|goggles)\b", t):
        return "sunglasses", "accessories"
    # Backpack
    if re.search(r"बॅग|दप्तर", text) or re.search(r"\b(backpack|bag|college bag)\b", t):
        return "backpack", "accessories"

    # Category fallback
    if re.search(r"\b(fashion|clothes|clothing|wear|dress|कपडे)\b", t):
        return None, "fashion"
    if re.search(r"\b(electronics|gadgets|tech|इलेक्ट्रॉनिक्स)\b", t):
        return None, "electronics"
    if re.search(r"\b(home|kitchen|घरातील)\b", t):
        return None, "home"
    if re.search(r"\b(beauty|skincare|मेकअप)\b", t):
        return None, "beauty"
    if re.search(r"\b(accessories|ॲक्सेसरीज)\b", t):
        return None, "accessories"

    return None, None


def parse_intent_locally(transcript: str) -> Dict[str, Any]:
    """Structured offline NLP intent parser with strict field extraction."""
    norm = normalize_speech(transcript)
    lang = detect_language(transcript)

    # 1. SET BUDGET
    budget = extract_budget(transcript)
    if budget is not None:
        return {
            "intent": "set_budget",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {"budget": budget},
            "reply_text": f"Aapka shopping budget ₹{budget:,} set kar diya! Ab bataiye kya kharidna hai?",
        }

    # 2. UNDO
    if re.search(r"\b(undo|pichla|maagcha|wapas|cancel last|revert|रद्द|मागे|वापस)\b", norm) and "order" not in norm:
        return {
            "intent": "undo",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {},
            "reply_text": "Pichla cart action undo kar diya! Chotu ne cart pehle jaisa kar diya.",
        }

    # 3. CART TOTAL & BUDGET
    if re.search(r"\b(total|kitna hua|kiti zala|sang|batao|bataiye|kiti zale|bill|kitna bacha|shillak|remaining|सांग|एकूण|टोटल)\b", norm):
        if "cart" in norm or "पैसे" in norm or "bill" in norm or "total" in norm or "खर्च" in norm:
            return {
                "intent": "get_cart_total",
                "transcript": transcript,
                "detected_language": lang,
                "parameters": {},
                "reply_text": "Chotu aapke cart ka total aur budget status check kar raha hai!",
            }

    # 4. FIND CHEAPER
    if re.search(r"\b(cheaper|sasta|swast|swasta|kam daam|kam price|affordable|स्वस्त|सस्ता|कमी किमतीत)\b", norm):
        return {
            "intent": "find_cheaper",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {"sort_by": "price_asc"},
            "reply_text": "Yeh lijiye sabse saste aur badhiya alternatives! Chotu ne best deals dhoondh li hain.",
        }

    # 5. CHANGE QUANTITY
    qty = None
    if re.search(r"\b(two|do|don|दोन|दो|2)\b", norm) and ("quantity" in norm or "kar" in norm or "करा" in norm or "change" in norm):
        qty = 2
    elif re.search(r"\b(three|teen|तीन|3)\b", norm) and ("quantity" in norm or "kar" in norm):
        qty = 3
    elif re.search(r"\b(one|ek|एक|1)\b", norm) and ("quantity" in norm or "kar" in norm):
        qty = 1

    if qty is not None:
        pos = extract_position(transcript) or 1
        return {
            "intent": "update_quantity",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {"quantity": qty, "position": pos},
            "reply_text": f"Item ki quantity {qty} kar di gayi hai!",
        }

    # 6. ADD TO CART
    pos = extract_position(transcript)
    is_add = bool(re.search(r"\b(add|daal|taak|daalo|ghya|kharidna|buy|put)\b", norm) or re.search(r"टाक|टाका|घ्या|डालो|ऐड|खरेदी", norm))
    has_cart = "cart" in norm or "कार्ट" in norm or "कार्टमध्ये" in norm or "कार्टात" in norm
    if is_add and (has_cart or pos is not None):
        target_pos = pos if pos is not None else 1
        pos_word = "Doosra" if target_pos == 2 else f"{target_pos} number ka"
        return {
            "intent": "add_to_cart",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {"position": target_pos, "quantity": 1},
            "reply_text": f"{pos_word} product cart mein daal diya! Chotu sambhaal raha hai!",
        }

    # 7. CONFIRM ORDER
    if (
        (re.search(r"\b(confirm|book|place)\b", norm) and re.search(r"\b(order|checkout)\b", norm))
        or re.search(r"\b(checkout|order confirm|order book)\b", norm)
        or re.search(r"ऑर्डर कन्फर्म|ऑर्डर बुक|ऑर्डर करा|खरेदी पूर्ण", norm)
    ):
        return {
            "intent": "confirm_order",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {},
            "reply_text": "Aapka demo order review karke confirm kiya ja raha hai!",
        }

    # 8. RESET / SHOW ALL
    if re.search(r"\b(show all|sab dikhao|sagle dakhav|reset|clear filter|सगळे दाखव|सब दिखाओ)\b", norm):
        return {
            "intent": "reset_filter",
            "transcript": transcript,
            "detected_language": lang,
            "parameters": {},
            "reply_text": "Saare products screen par hazir hain!",
        }

    # 9. STRUCTURED SEARCH & FILTER EXTRACTION
    limits = extract_price_limit(transcript)
    color = extract_color(transcript)
    prod_type, category = extract_product_type_and_category(transcript)

    clean_q = norm
    clean_q = re.sub(r"\b(oye|chotu|chhotu|show|me|please|dikhao|dikhaye|dakhav|dakhva|mala|mujhe|humko|aat|chya|ke|andar|rupaye|rupayanchya|rs|under|below|less than|sound|search|find|दाखव|दाखवा|दाखव|मला|दिखाओ)\b", "", clean_q)
    clean_q = re.sub(r"\b\d+\b", "", clean_q).strip()

    max_p = limits.get("max_price")
    color_desc = f"{color} " if color else ""
    type_desc = prod_type or (category if category else clean_q or "products")

    reply = f"Yeh lijiye aapke liye {color_desc}{type_desc}"
    if max_p:
        reply += f" under ₹{max_p}"
    reply += "!"

    return {
        "intent": "search",
        "transcript": transcript,
        "detected_language": lang,
        "parameters": {
            "query": clean_q or None,
            "requested_type": prod_type,
            "requested_color": color,
            "category": category,
            "max_price": max_p,
        },
        "reply_text": reply,
    }


def process_audio_with_gemini(audio_bytes: bytes, mime_type: str = "audio/webm") -> Optional[Dict[str, Any]]:
    """Transcribes and extracts structured intent using Google Gen AI SDK."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = """
        You are Oye Chotu, an Indian multilingual shopping voice assistant.
        Listen to the audio in Hindi, Marathi, Hinglish, Roman Marathi, or English.
        Extract exact structured filters and return ONLY a valid JSON object:
        {
          "transcript": string,
          "detected_language": "Hindi" | "Marathi" | "Hinglish" | "Roman Marathi" | "English",
          "intent": "search" | "set_budget" | "add_to_cart" | "update_quantity" | "remove_item" | "get_cart_total" | "find_cheaper" | "undo" | "confirm_order" | "reset_filter",
          "parameters": {
             "query": string | null,
             "requested_type": "kurti" | "shoes" | "saree" | "jeans" | "headphones" | "watch" | "powerbank" | "keyboard" | "speaker" | "charger" | "bottle" | "pan" | "mug" | "lights" | "bedsheet" | "serum" | "facewash" | "oil" | "lipstick" | "wallet" | "sunglasses" | "backpack" | null,
             "requested_color": "black" | "red" | "blue" | "white" | "green" | "yellow" | "brown" | null,
             "max_price": number | null,
             "min_price": number | null,
             "category": "fashion" | "electronics" | "home" | "beauty" | "accessories" | null,
             "position": number | null,
             "quantity": number | null,
             "budget": number | null
          },
          "reply_text": string
        }
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                prompt
            ]
        )

        resp_text = response.text.strip()
        if resp_text.startswith("```"):
            resp_text = re.sub(r"^```(?:json)?\n?", "", resp_text)
            resp_text = re.sub(r"\n?```$", "", resp_text)

        data = json.loads(resp_text)
        return data
    except Exception as e:
        print(f"GenAI audio processing warning: {e}")
        return None
