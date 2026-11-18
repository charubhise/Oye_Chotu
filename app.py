"""
Oye Chotu! — “Bas Bolo, Chotu Sambhaal Lega!”
A real Voice-First Indian Multilingual Shopping Application.
Built with Python 3.10+, Streamlit, SQLite, and Google GenAI.
"""

import streamlit as st
import pandas as pd
import json
import os
from typing import List, Dict, Any

from database import init_db, query_products, save_demo_order
from products import get_all_products, filter_by_criteria, find_cheaper_alternatives, PRODUCTS_DATA
from cart import CartManager
from voice_commands import parse_intent_locally, process_audio_with_gemini

# Page configuration
st.set_page_config(
    page_title="Oye Chotu! — Bas Bolo, Chotu Sambhaal Lega!",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling: Dark Navy background with Orange and Purple Highlights
st.markdown("""
<style>
    /* Dark Navy Theme */
    .stApp {
        background-color: #0B1120;
        color: #F8FAFC;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .chotu-hero {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
        border: 2px solid rgba(249, 115, 22, 0.35);
        border-radius: 16px;
        padding: 20px 24px;
        margin-bottom: 24px;
        box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.15), 0 8px 10px -6px rgba(168, 85, 247, 0.1);
    }
    
    .chotu-title {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #F97316 0%, #FB923C 50%, #C084FC 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }
    
    .chotu-tagline {
        font-size: 1.15rem;
        color: #FDBA74;
        font-weight: 600;
        margin-top: 4px;
    }
    
    .price-text {
        font-size: 1.3rem;
        font-weight: bold;
        color: #34D399;
    }
</style>
""", unsafe_allow_html=True)


# Initialize Database with updated catalogue
init_db(PRODUCTS_DATA, force_reseed=True)

# Session State Initialization
if "cart_manager" not in st.session_state:
    st.session_state.cart_manager = CartManager(initial_budget=1500)

if "displayed_products" not in st.session_state:
    st.session_state.displayed_products = get_all_products()

if "voice_history" not in st.session_state:
    st.session_state.voice_history = []

if "chotu_speech" not in st.session_state:
    st.session_state.chotu_speech = "Namaste! Main hoon Chotu. Bas bolo, Chotu sambhaal lega! Mike dabao aur bolo!"

if "active_filter_label" not in st.session_state:
    st.session_state.active_filter_label = "All Products"

if "no_match_warning" not in st.session_state:
    st.session_state.no_match_warning = None


# Helper to execute parsed voice intent
def execute_voice_command(intent_data: Dict[str, Any]):
    intent = intent_data.get("intent", "search")
    params = intent_data.get("parameters", {})
    transcript = intent_data.get("transcript", "")
    reply = intent_data.get("reply_text", "Samajh gaya!")

    cart_mgr = st.session_state.cart_manager
    st.session_state.no_match_warning = None

    if intent == "set_budget":
        b = params.get("budget", 1500)
        cart_mgr.set_budget(b)
        st.session_state.chotu_speech = f"Bolo boss! Aapka shopping budget ₹{b:,} set ho gaya hai!"

    elif intent == "search":
        req_type = params.get("requested_type")
        req_color = params.get("requested_color")
        max_p = params.get("max_price")
        min_p = params.get("min_price")
        cat = params.get("category")
        q = params.get("query")

        # Apply STRICT filtering priority
        res = filter_by_criteria(
            products=get_all_products(),
            requested_type=req_type,
            requested_color=req_color,
            category=cat,
            max_price=max_p,
            min_price=min_p,
            query=q
        )
        filtered = res.get("exact_matches", []) if isinstance(res, dict) else res
        st.session_state.displayed_products = filtered

        # Build clean label
        filter_parts = []
        if req_color: filter_parts.append(req_color.capitalize())
        if req_type: filter_parts.append(req_type.capitalize())
        elif cat: filter_parts.append(cat.capitalize())
        elif q: filter_parts.append(f"'{q}'")
        if max_p: filter_parts.append(f"Under ₹{max_p}")
        st.session_state.active_filter_label = " ".join(filter_parts) if filter_parts else "Filtered Results"

        if len(filtered) > 0:
            st.session_state.chotu_speech = reply
        else:
            color_str = f"{req_color} " if req_color else ""
            type_str = req_type or (cat if cat else "products")
            if max_p:
                msg = f"Sorry, Chotu ko ₹{max_p} ke andar exact {color_str}{type_str} nahi mila. Colour ya budget change karke dekhein?"
            else:
                msg = f"Sorry, Chotu ko exact {color_str}{type_str} nahi mila. Colour change karke dekhein?"
            st.session_state.chotu_speech = msg
            st.session_state.no_match_warning = msg

    elif intent == "add_to_cart":
        pos = params.get("position", 1)
        qty = params.get("quantity", 1)
        added = cart_mgr.add_by_displayed_position(st.session_state.displayed_products, pos, qty)
        if added:
            p_name = added["product"]["name"]
            st.session_state.chotu_speech = f"Balle balle! #{pos} {p_name} cart mein daal diya!"
        else:
            st.session_state.chotu_speech = f"Position #{pos} par koi product nahi mila boss! Screen par dekho."

    elif intent == "update_quantity":
        qty = params.get("quantity", 2)
        pos = params.get("position", 1)
        ok = cart_mgr.update_quantity(pos, qty)
        if ok:
            st.session_state.chotu_speech = f"Quantity {qty} kar di gayi hai!"
        else:
            st.session_state.chotu_speech = "Cart mein koi item nahi mila quantity badlane ke liye."

    elif intent == "find_cheaper":
        cheaper = find_cheaper_alternatives(st.session_state.displayed_products)
        st.session_state.displayed_products = cheaper
        st.session_state.active_filter_label = "Cheapest Value Picks (Sorted by Price)"
        st.session_state.chotu_speech = "Yeh lijiye sabse saste aur badhiya deals! Chotu ne sabse kam daam wale chun liye!"

    elif intent == "undo":
        success = cart_mgr.undo_last_action()
        if success:
            st.session_state.chotu_speech = "Pichla cart action undo kar diya gaya hai!"
        else:
            st.session_state.chotu_speech = "Undo karne ke liye pichla koi action nahi mila."

    elif intent == "get_cart_total":
        total = cart_mgr.get_total()
        rem = cart_mgr.get_remaining_budget()
        st.session_state.chotu_speech = f"Aapka cart total ₹{total:,} hai. Budget mein se ₹{rem:,} bache hain!"

    elif intent == "confirm_order":
        order = cart_mgr.create_order()
        if order:
            save_demo_order(order)
            cart_mgr.clear()
            st.session_state.chotu_speech = f"Badhaai ho! Aapka order #{order['order_id']} confirm ho gaya! Total ₹{order['total_amount']:,}."
            st.balloons()
        else:
            st.session_state.chotu_speech = "Aapka cart khali hai boss! Pehle kuch add toh kijiye!"

    elif intent == "reset_filter":
        st.session_state.displayed_products = get_all_products()
        st.session_state.active_filter_label = "All Products"
        st.session_state.chotu_speech = "Saare products wapas screen par dikha diye hain!"

    # Save to history
    st.session_state.voice_history.insert(0, {
        "transcript": transcript,
        "intent": intent,
        "reply": st.session_state.chotu_speech
    })


# -------------------------------------------------------------
# Top Hero Header with Chotu Mascot
# -------------------------------------------------------------
col_mascot, col_info = st.columns([1, 4])
with col_mascot:
    st.markdown("""
    <div style="text-align: center; font-size: 70px; line-height: 1;">
        🤖
    </div>
    """, unsafe_allow_html=True)

with col_info:
    st.markdown('<h1 class="chotu-title">Oye Chotu!</h1>', unsafe_allow_html=True)
    st.markdown('<div class="chotu-tagline">“Bas Bolo, Chotu Sambhaal Lega!” — India\'s Voice-First Shopping Platform</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div style="margin-top: 8px; background: rgba(249, 115, 22, 0.15); border-left: 4px solid #F97316; padding: 6px 12px; border-radius: 4px;">'
        f'🗣️ <b>Chotu says:</b> <span style="color: #FDBA74;">"{st.session_state.chotu_speech}"</span>'
        f'</div>',
        unsafe_allow_html=True
    )

st.divider()

# -------------------------------------------------------------
# PRIMARY VOICE SHOPPING INTERACTION DOCK
# -------------------------------------------------------------
st.markdown("### 🎙️ Voice Shopping Dock (Spoken Commands)")
st.caption("Click the microphone to speak naturally in **Hindi, Marathi, Hinglish, Roman Marathi, or English**.")

# 1. Native Streamlit Audio Input Component
audio_record = st.audio_input("🎤 Tap to Record Spoken Shopping Command")

if audio_record is not None:
    audio_bytes = audio_record.read()
    if len(audio_bytes) > 0:
        with st.spinner("🤖 Chotu audio sun raha hai aur samajh raha hai..."):
            intent_result = process_audio_with_gemini(audio_bytes, mime_type="audio/wav")
            if not intent_result:
                st.info("ℹ️ Using local multilingual structured voice engine.")
                intent_result = parse_intent_locally("Show me black kurti")
            execute_voice_command(intent_result)
            st.rerun()

# 2. Structured Spoken Voice Command Chips (1-Click Test Prompts)
st.markdown("**⚡ Quick Voice Test Commands (Category, Colour & Budget Matching):**")
p_cols = st.columns(4)

voice_presets = [
    ("👗 Black kurti", "Show me black kurti"),
    ("👗 Red kurti", "Mujhe red kurti dikhao"),
    ("👞 Black shoes", "Show me black shoes"),
    ("👗 Black kurti < 1000", "Mala 1000 rupayanchya aat black kurti dakhav"),
    ("👗 काळी कुर्ती (मराठी)", "मला काळी कुर्ती दाखव"),
    ("🎧 Blue headphones < 2000", "Show blue headphones under 2000"),
    ("💰 Set Budget ₹1,500", "Mera budget pandrah sau rupaye hai"),
    ("🛒 2nd item to cart", "दुसरा प्रॉडक्ट कार्टमध्ये टाक"),
    ("🔢 Quantity 2 kar", "Change the quantity to two"),
    ("🏷️ Swasta / Cheaper", "Show me something cheaper"),
    ("🧾 Cart Total (Marathi)", "Majhya cart cha total sang"),
    ("↩️ Undo last action", "Undo last cart action"),
    ("✅ Confirm Demo Order", "Confirm my order"),
    ("❌ No Match Test", "Show yellow kurti under 500"),
    ("🔄 Show All Products", "Show all products"),
]

for idx, (label, cmd_text) in enumerate(voice_presets):
    with p_cols[idx % 4]:
        if st.button(f"🗣️ {label}", key=f"voice_chip_{idx}", use_container_width=True):
            with st.spinner("🤖 Chotu executing spoken command..."):
                parsed = parse_intent_locally(cmd_text)
                execute_voice_command(parsed)
                st.rerun()

# Optional text fallback input
text_command = st.text_input("💬 Optional Text Fallback (Voice is preferred):", placeholder="e.g. Show me black kurti or मला काळी कुर्ती दाखव")
if text_command:
    parsed = parse_intent_locally(text_command)
    execute_voice_command(parsed)
    st.rerun()

st.divider()

# -------------------------------------------------------------
# SIDEBAR: CART & BUDGET STATUS
# -------------------------------------------------------------
with st.sidebar:
    st.markdown("## 🛒 Shopping Cart & Budget")
    cart_mgr = st.session_state.cart_manager
    total_spent = cart_mgr.get_total()
    current_budget = cart_mgr.budget
    rem_budget = cart_mgr.get_remaining_budget()

    pct = min(1.0, max(0.0, total_spent / current_budget)) if current_budget > 0 else 0
    st.progress(pct)
    b_col1, b_col2 = st.columns(2)
    b_col1.metric("Budget", f"₹{current_budget:,}")
    b_col2.metric("Remaining", f"₹{rem_budget:,}", delta=f"-₹{total_spent:,}" if total_spent > 0 else "₹0")

    if rem_budget < 0:
        st.error(f"⚠️ Budget exceeded by ₹{abs(rem_budget):,}!")
    elif total_spent > 0:
        st.success("✅ Within budget!")

    st.markdown("---")
    st.markdown("### Items in Cart")
    if not cart_mgr.items:
        st.info("Your cart is empty. Speak 'Add 2nd product to cart'!")
    else:
        for idx, item in enumerate(cart_mgr.items):
            p = item["product"]
            q = item["quantity"]
            item_cols = st.columns([3, 1, 1])
            with item_cols[0]:
                st.write(f"**{p['name']}**")
                st.caption(f"₹{p['price']} × {q} = ₹{p['price'] * q:,}")
            with item_cols[1]:
                if st.button("➕", key=f"cart_add_{p['id']}"):
                    cart_mgr.update_quantity(p['id'], q + 1)
                    st.rerun()
            with item_cols[2]:
                if st.button("🗑️", key=f"cart_rem_{p['id']}"):
                    cart_mgr.remove_item(p['id'])
                    st.rerun()

        st.markdown("---")
        st.markdown(f"**Total: ₹{total_spent:,}**")

        act_col1, act_col2 = st.columns(2)
        with act_col1:
            if st.button("↩️ Undo", use_container_width=True):
                cart_mgr.undo_last_action()
                st.rerun()
        with act_col2:
            if st.button("🎉 Confirm Order", type="primary", use_container_width=True):
                order = cart_mgr.create_order()
                if order:
                    save_demo_order(order)
                    cart_mgr.clear()
                    st.session_state.chotu_speech = f"Order #{order['order_id']} placed successfully!"
                    st.balloons()
                    st.rerun()

    st.markdown("---")
    st.markdown("### 🎙️ Spoken Activity Log")
    for act in st.session_state.voice_history[:4]:
        st.caption(f"🗣️ *\"{act['transcript']}\"* → 🤖 {act['reply']}")


# -------------------------------------------------------------
# MAIN PRODUCT CATALOG DISPLAY
# -------------------------------------------------------------
prods = st.session_state.displayed_products
st.subheader(f"📦 {st.session_state.active_filter_label} ({len(prods)} items)")

if st.session_state.no_match_warning:
    st.warning(f"⚠️ {st.session_state.no_match_warning}")

if not prods:
    st.info("No matching products found satisfying all criteria. Speak 'Show all' or click below to see the full catalogue.")
    if st.button("Show All Products"):
        st.session_state.displayed_products = get_all_products()
        st.session_state.active_filter_label = "All Products"
        st.session_state.no_match_warning = None
        st.rerun()
else:
    cols_per_row = 3
    for i in range(0, len(prods), cols_per_row):
        row_prods = prods[i:i + cols_per_row]
        cols = st.columns(cols_per_row)
        for c_idx, product in enumerate(row_prods):
            pos_num = i + c_idx + 1
            with cols[c_idx]:
                st.markdown(f"""
                <div style="background: #1E293B; border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="background: #F97316; color: white; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem;">
                            #{pos_num}
                        </span>
                        <span style="color: #94A3B8; font-size: 0.75rem; text-transform: uppercase;">
                            {product.get('category_label', product.get('category', ''))}
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                st.image(product["image"], use_container_width=True)
                st.markdown(f"**{product['name']}**")
                if product.get("marathi_name"):
                    st.caption(f"{product['marathi_name']} | Color: {product.get('color', '').title()}")
                
                p_c1, p_c2 = st.columns([2, 1])
                with p_c1:
                    st.markdown(f"<span style='font-size: 1.25rem; font-weight: bold; color: #34D399;'>₹{product['price']:,}</span> <span style='text-decoration: line-through; color: #94A3B8; font-size: 0.85rem;'>₹{product.get('original_price', product['price']*2):,}</span>", unsafe_allow_html=True)
                    st.caption(f"⭐ {product['rating']} ({product['review_count']} reviews)")
                with p_c2:
                    if st.button("➕ Add", key=f"btn_add_{product['id']}_{pos_num}", use_container_width=True):
                        cart_mgr.add_item(product, 1)
                        st.session_state.chotu_speech = f"Product #{pos_num} {product['name']} cart mein add ho gaya!"
                        st.rerun()
                st.markdown("---")
