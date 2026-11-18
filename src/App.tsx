import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, CartItem, VoiceState, VoiceIntent, CartHistoryEntry, Category } from './types';
import { SAMPLE_PRODUCTS } from './data/products';
import { parseVoiceIntent, filterProducts } from './utils/voiceParser';
import { Header } from './components/Header';
import { ChotuMascot } from './components/ChotuMascot';
import { VoiceDock } from './components/VoiceDock';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { OrderModal } from './components/OrderModal';
import { CompareModal } from './components/CompareModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { DebugPanel } from './components/DebugPanel';
import {
  RotateCcw,
  Filter,
  Sparkles,
  CheckCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Palette,
  Sliders,
  ArrowRightLeft,
  X,
} from 'lucide-react';

export default function App() {
  // Main catalog states
  const [products] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [otherColorOptions, setOtherColorOptions] = useState<Product[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Cart & Budget
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartHistory, setCartHistory] = useState<CartHistoryEntry[]>([]);
  const [budget, setBudget] = useState<number>(1500);

  // Active UI filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(3000);
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating'>('default');
  const [activeFilterTitle, setActiveFilterTitle] = useState<string>('All 85+ Demo Products');
  const [noMatchWarning, setNoMatchWarning] = useState<string | null>(null);

  // Voice & Mascot states
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [chotuMessage, setChotuMessage] = useState<string>(
    'Namaste! Main hoon Chotu. Bas bolo, Chotu sambhaal lega! Mike dabaiye aur bolo kya chahiye.'
  );
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [lastIntent, setLastIntent] = useState<VoiceIntent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // TTS Voice settings
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speechPitch, setSpeechPitch] = useState<number>(1.15);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Modals & Panels
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayedProductsRef = useRef<Product[]>(displayedProducts);
  displayedProductsRef.current = displayedProducts;

  const cartItemsRef = useRef<CartItem[]>(cartItems);
  cartItemsRef.current = cartItems;

  const lastIntentRef = useRef<VoiceIntent | null>(lastIntent);
  lastIntentRef.current = lastIntent;

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (!selectedVoiceURI && voices.length > 0) {
        // Prefer Indian English / Hindi voice if available
        const indian = voices.find(
          (v) =>
            v.lang.includes('hi') ||
            v.lang.includes('IN') ||
            v.name.includes('India') ||
            v.name.includes('Hindi')
        );
        if (indian) {
          setSelectedVoiceURI(indian.voiceURI);
        } else {
          setSelectedVoiceURI(voices[0].voiceURI);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, [selectedVoiceURI]);

  // Robust SpeechSynthesis with overlap prevention and configurable voice
  const speakChotuResponse = useCallback(
    (text: string) => {
      if (isAudioMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

      try {
        // Prevent duplicate or overlapping speech by cancelling any ongoing playback
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;

        const voices = window.speechSynthesis.getVoices();
        let chosenVoice: SpeechSynthesisVoice | undefined;

        if (selectedVoiceURI) {
          chosenVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
        }
        if (!chosenVoice) {
          chosenVoice = voices.find(
            (v) =>
              v.lang.includes('hi') ||
              v.lang.includes('IN') ||
              v.name.includes('India') ||
              v.name.includes('Hindi')
          );
        }
        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }

        utterance.onstart = () => setVoiceState('speaking');
        utterance.onend = () => setVoiceState('idle');
        utterance.onerror = () => setVoiceState('idle');

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
        setVoiceState('idle');
      }
    },
    [isAudioMuted, speechRate, speechPitch, selectedVoiceURI]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart Undo Snapshot Helper
  const saveCartSnapshot = (action: CartHistoryEntry['action'], description: string) => {
    setCartHistory((prev) => [
      ...prev,
      {
        action,
        description,
        previousItems: JSON.parse(JSON.stringify(cartItemsRef.current)),
      },
    ]);
  };

  // Add to cart
  const handleAddToCart = (product: Product, size?: string, quantity = 1) => {
    saveCartSnapshot('add', `Added ${product.name}`);
    setCartItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [...prev, { product, quantity, selectedSize: size || product.sizes?.[0] }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  // Update quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    saveCartSnapshot('update_quantity', `Updated quantity to ${quantity}`);
    setCartItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity } : it))
    );
  };

  // Remove item
  const handleRemoveItem = (productId: string) => {
    saveCartSnapshot('remove', 'Removed item from cart');
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
    showToast('Item removed from cart');
  };

  // Clear cart
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    saveCartSnapshot('clear', 'Cleared entire cart');
    setCartItems([]);
    showToast('Cart cleared');
  };

  // Undo last cart action
  const handleUndo = () => {
    if (cartHistory.length === 0) {
      const msg = 'Undo karne ke liye koi pichla action nahi mila!';
      setChotuMessage(msg);
      speakChotuResponse(msg);
      return;
    }
    const lastEntry = cartHistory[cartHistory.length - 1];
    setCartItems(lastEntry.previousItems);
    setCartHistory((prev) => prev.slice(0, -1));
    const msg = 'Pichla cart action undo kar diya ji! Cart restore ho gaya.';
    setChotuMessage(msg);
    speakChotuResponse(msg);
    showToast('Undo successful!');
  };

  // Reset to full catalog
  const handleResetCatalog = () => {
    setDisplayedProducts(SAMPLE_PRODUCTS);
    setOtherColorOptions([]);
    setVisibleCount(8);
    setSelectedCategory('all');
    setSelectedColor('all');
    setMaxPriceFilter(3000);
    setSortBy('default');
    setNoMatchWarning(null);
    setActiveFilterTitle(`All ${SAMPLE_PRODUCTS.length} Demo Products`);
    const msg = 'Saare products screen par hazir hain ji!';
    setChotuMessage(msg);
    speakChotuResponse(msg);
  };

  // Synchronize manual UI filters (Category, Color, Price, Sort) with catalog
  const applyManualFilters = (
    cat: string,
    col: string,
    priceLimit: number,
    sortOption: 'default' | 'price_asc' | 'price_desc' | 'rating'
  ) => {
    const mockIntent: VoiceIntent = {
      intent: 'search',
      transcript: 'Manual UI filter',
      detectedLanguage: 'en',
      parameters: {
        category: cat !== 'all' ? (cat as Category) : undefined,
        requestedColor: col !== 'all' ? col : undefined,
        maxPrice: priceLimit < 3000 ? priceLimit : undefined,
        sortBy: sortOption !== 'default' ? sortOption : undefined,
      },
      replyText: '',
    };

    const { matchingProducts, otherColorOptions: altColors, noMatchMessage } = filterProducts(
      SAMPLE_PRODUCTS,
      mockIntent
    );

    setDisplayedProducts(matchingProducts);
    setOtherColorOptions(altColors);
    setVisibleCount(8);
    setNoMatchWarning(noMatchMessage || null);

    const parts: string[] = [];
    if (col !== 'all') parts.push(col.charAt(0).toUpperCase() + col.slice(1));
    if (cat !== 'all') parts.push(cat.charAt(0).toUpperCase() + cat.slice(1));
    if (priceLimit < 3000) parts.push(`Under ₹${priceLimit}`);

    const title = parts.length > 0 ? `${matchingProducts.length} ${parts.join(' ')}` : `All ${matchingProducts.length} Products`;
    setActiveFilterTitle(title);
  };

  // Central Voice Execution Engine
  const executeVoiceCommand = async (
    transcript: string,
    audioBase64?: string,
    mimeType?: string
  ) => {
    setVoiceState('processing');
    setErrorMessage('');
    setLastTranscript(transcript);

    try {
      let intentResult: VoiceIntent | null = null;

      // 1. Try server endpoint if audio was recorded
      if (audioBase64) {
        try {
          const resp = await fetch('/api/voice-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, audioBase64, mimeType }),
          });
          if (resp.ok) {
            intentResult = await resp.json();
          }
        } catch (e) {
          console.warn('Backend /api/voice-command fallback to local parser:', e);
        }
      }

      // 2. Parse using local structured intent parser
      if (!intentResult) {
        intentResult = parseVoiceIntent(transcript, displayedProductsRef.current);
      }

      setLastIntent(intentResult);
      const { intent, parameters, replyText } = intentResult;

      // Execute based on intent
      switch (intent) {
        case 'set_budget': {
          const newBudget = parameters.budget || 1500;
          setBudget(newBudget);
          const reply = `Haan ji! Aapka shopping budget ₹${newBudget.toLocaleString('en-IN')} set kar diya! Chotu budget sambhaal lega!`;
          setChotuMessage(reply);
          speakChotuResponse(reply);
          showToast(`Budget set to ₹${newBudget}`);
          break;
        }

        case 'search': {
          // Strict filtering: Every result MUST satisfy all requested attributes
          const { matchingProducts, otherColorOptions: alts, noMatchMessage } = filterProducts(
            SAMPLE_PRODUCTS,
            intentResult
          );

          setDisplayedProducts(matchingProducts);
          setOtherColorOptions(alts);
          setVisibleCount(8);

          // Update active filter title truthfully
          const labelParts: string[] = [];
          if (parameters.requestedColor) {
            labelParts.push(
              parameters.requestedColor.charAt(0).toUpperCase() + parameters.requestedColor.slice(1)
            );
          }
          if (parameters.requestedType) {
            labelParts.push(
              parameters.requestedType.charAt(0).toUpperCase() + parameters.requestedType.slice(1)
            );
          } else if (parameters.category) {
            labelParts.push(
              parameters.category.charAt(0).toUpperCase() + parameters.category.slice(1)
            );
          } else if (parameters.query) {
            labelParts.push(`"${parameters.query}"`);
          }
          if (parameters.maxPrice) {
            labelParts.push(`Under ₹${parameters.maxPrice}`);
          }

          const filterLabel = labelParts.length > 0 ? labelParts.join(' ') : 'Filtered Products';
          setActiveFilterTitle(`${matchingProducts.length} ${filterLabel} found`);
          setNoMatchWarning(noMatchMessage || null);

          if (matchingProducts.length > 0) {
            const countSpeech = `${matchingProducts.length} ${parameters.requestedColor || ''} ${parameters.requestedType || 'options'}`;
            const reply = `Yay! Ye dekho, tumhare liye ${countSpeech} mil gaye!`;
            setChotuMessage(reply);
            speakChotuResponse(reply);
          } else {
            const msg = noMatchMessage || 'Oopsie! Exact match nahi mila. Colour ya budget change karke dekhein?';
            setChotuMessage(msg);
            speakChotuResponse(msg);
          }
          break;
        }

        case 'show_more': {
          const currentList = displayedProductsRef.current;
          if (visibleCount < currentList.length) {
            setVisibleCount((prev) => Math.min(prev + 8, currentList.length));
            const reply = 'Haan ji! Chotu ne aur cute options load kar diye!';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          } else {
            const reply = 'Saare matching products pehle se screen par dikh rahe hain ji!';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          }
          break;
        }

        case 'sort_price_low': {
          const sorted = [...displayedProductsRef.current].sort((a, b) => a.price - b.price);
          setDisplayedProducts(sorted);
          setSortBy('price_asc');
          const reply = 'Arre wah! Chotu ne sabse saste aur badhiya options pehle laga diye!';
          setChotuMessage(reply);
          speakChotuResponse(reply);
          showToast('Sorted: Lowest Price First');
          break;
        }

        case 'sort_price_high': {
          const sorted = [...displayedProductsRef.current].sort((a, b) => b.price - a.price);
          setDisplayedProducts(sorted);
          setSortBy('price_desc');
          const reply = 'Done ji! Premium options sabse upar set kar diye!';
          setChotuMessage(reply);
          speakChotuResponse(reply);
          showToast('Sorted: Highest Price First');
          break;
        }

        case 'compare': {
          const currentList = displayedProductsRef.current;
          if (currentList.length >= 2) {
            setIsCompareOpen(true);
            const reply = `Yay! #1 ${currentList[0].name} aur #2 ${currentList[1].name} ka comparison hazir hai!`;
            setChotuMessage(reply);
            speakChotuResponse(reply);
          } else {
            const reply = 'Comparison ke liye screen par kam se kam 2 products hone chahiye ji!';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          }
          break;
        }

        case 'add_to_cart': {
          const pos = parameters.position || 1;
          const currentList = displayedProductsRef.current;
          const targetIndex = pos - 1;

          if (targetIndex >= 0 && targetIndex < currentList.length) {
            const prod = currentList[targetIndex];
            handleAddToCart(prod, prod.sizes?.[0], parameters.quantity || 1);
            const posWord = pos === 2 ? 'Doosra' : `#${pos}`;
            const reply = `Done ji! ${posWord} item ${prod.name} tumhare cart mein add kar diya!`;
            setChotuMessage(reply);
            speakChotuResponse(reply);
            setIsCartOpen(true);
          } else {
            const reply = `Position #${pos} par koi product nahi mila boss! Screen par dekhiye.`;
            setChotuMessage(reply);
            speakChotuResponse(reply);
          }
          break;
        }

        case 'remove_item': {
          const currentCart = cartItemsRef.current;
          if (currentCart.length > 0) {
            const pos = parameters.position;
            const targetProd = pos && pos <= currentCart.length ? currentCart[pos - 1].product : currentCart[currentCart.length - 1].product;
            handleRemoveItem(targetProd.id);
            const reply = `Done ji! ${targetProd.name} cart se remove kar diya gaya hai!`;
            setChotuMessage(reply);
            speakChotuResponse(reply);
          } else {
            const reply = 'Cart pehle se khali hai boss!';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          }
          break;
        }

        case 'clear_cart': {
          handleClearCart();
          const reply = 'Done ji! Cart pura khali kar diya hai! Naye सिरे se shopping karein?';
          setChotuMessage(reply);
          speakChotuResponse(reply);
          break;
        }

        case 'update_quantity': {
          const qty = parameters.quantity || 2;
          const currentCart = cartItemsRef.current;
          if (currentCart.length > 0) {
            const targetProd = currentCart[currentCart.length - 1].product;
            handleUpdateQuantity(targetProd.id, qty);
            const reply = `Done ji! ${targetProd.name} ki quantity ${qty} kar di gayi hai!`;
            setChotuMessage(reply);
            speakChotuResponse(reply);
            setIsCartOpen(true);
          } else {
            const reply = 'Cart abhi khali hai! Pehle product add kijiye.';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          }
          break;
        }

        case 'find_cheaper': {
          // If there is an active category or type, find cheaper in that type
          const currentList = displayedProductsRef.current;
          let pool = currentList;
          if (currentList.length === 0 || currentList.length === SAMPLE_PRODUCTS.length) {
            pool = SAMPLE_PRODUCTS;
          }
          const sorted = [...pool].sort((a, b) => a.price - b.price);
          setDisplayedProducts(sorted);
          setActiveFilterTitle('Cheapest Value Picks (Sorted by Price)');
          const reply = 'Arre wah! Isse saste aur badhiya options bhi mil gaye!';
          setChotuMessage(reply);
          speakChotuResponse(reply);
          break;
        }

        case 'undo': {
          handleUndo();
          break;
        }

        case 'get_cart_total': {
          const total = cartItemsRef.current.reduce(
            (s, it) => s + it.product.price * it.quantity,
            0
          );
          const rem = budget - total;
          const reply = `Tumhare cart ka total hai ₹${total.toLocaleString('en-IN')}. Budget mein se ₹${rem.toLocaleString('en-IN')} bache hain! Shopping mast chal rahi hai!`;
          setChotuMessage(reply);
          speakChotuResponse(reply);
          setIsCartOpen(true);
          break;
        }

        case 'confirm_order':
        case 'review_order': {
          if (cartItemsRef.current.length === 0) {
            const reply = 'Aapka cart khali hai boss! Pehle kuch pasand karke add toh kijiye!';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          } else {
            setIsOrderModalOpen(true);
            const reply = 'Yeh raha aapke order ka summary! Review karke confirm kijiye.';
            setChotuMessage(reply);
            speakChotuResponse(reply);
          }
          break;
        }

        case 'reset_filter': {
          handleResetCatalog();
          break;
        }

        default: {
          const reply = replyText || 'Samajh gaya! Chotu aapke command par kaam kar raha hai.';
          setChotuMessage(reply);
          speakChotuResponse(reply);
        }
      }

      setVoiceState('idle');
    } catch (err: any) {
      console.error('Error executing voice command:', err);
      setErrorMessage('Command samajhne mein dikkat aayi. Kripya dobara bolein.');
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 3000);
    }
  };

  const cartTotal = cartItems.reduce((s, it) => s + it.product.price * it.quantity, 0);
  const cartItemCount = cartItems.reduce((s, it) => s + it.quantity, 0);

  // Available Category Options
  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Items', icon: '✨' },
    { id: 'fashion', label: 'Fashion & Wear', icon: '👗' },
    { id: 'accessories', label: 'Bags & Accessories', icon: '🎒' },
    { id: 'electronics', label: 'Electronics & Audio', icon: '🎧' },
    { id: 'home', label: 'Home & Kitchen', icon: '🏠' },
    { id: 'beauty', label: 'Beauty & Care', icon: '💄' },
  ];

  // Available Color Options
  const colorOptions = [
    { id: 'all', label: 'All Colors' },
    { id: 'black', label: 'Black', dot: 'bg-black border border-slate-600' },
    { id: 'white', label: 'White', dot: 'bg-white border border-slate-400' },
    { id: 'red', label: 'Red', dot: 'bg-red-500' },
    { id: 'blue', label: 'Blue', dot: 'bg-blue-500' },
    { id: 'green', label: 'Green', dot: 'bg-emerald-500' },
    { id: 'yellow', label: 'Yellow', dot: 'bg-amber-400' },
    { id: 'pink', label: 'Pink', dot: 'bg-pink-400' },
    { id: 'brown', label: 'Brown', dot: 'bg-amber-800' },
  ];

  // Visible slice of exact matches
  const visibleProducts = displayedProducts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Header Bar */}
      <Header
        cartCount={cartItemCount}
        cartTotal={cartTotal}
        budget={budget}
        onOpenCart={() => setIsCartOpen(true)}
        isAudioMuted={isAudioMuted}
        onToggleMute={() => setIsAudioMuted(!isAudioMuted)}
        onResetCatalog={handleResetCatalog}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
        isDebugOpen={isDebugOpen}
        onToggleDebug={() => setIsDebugOpen(!isDebugOpen)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Diagnostic Debug Inspector (Collapsible) */}
        <DebugPanel
          intent={lastIntent}
          isOpen={isDebugOpen}
          onToggle={() => setIsDebugOpen(!isDebugOpen)}
          displayedCount={displayedProducts.length}
          totalCatalogCount={SAMPLE_PRODUCTS.length}
        />

        {/* Chotu Robot Mascot & Speech Header */}
        <ChotuMascot
          state={voiceState}
          message={chotuMessage}
          onSpeakAgain={() => speakChotuResponse(chotuMessage)}
          isAudioMuted={isAudioMuted}
        />

        {/* PRIMARY VOICE SHOPPING DOCK */}
        <VoiceDock
          voiceState={voiceState}
          onVoiceCommand={executeVoiceCommand}
          lastTranscript={lastTranscript}
          errorMessage={errorMessage}
        />

        {/* ============================================================= */}
        {/* WORKING SEARCH & FILTER CONTROLS (Category, Color, Price, Sort) */}
        {/* ============================================================= */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
          {/* Row 1: Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-orange-400" />
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  applyManualFilters(cat.id, selectedColor, maxPriceFilter, sortBy);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Row 2: Colour Filters & Budget Slider & Sort Dropdown */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Color Swatch Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                Colour:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedColor(c.id);
                      applyManualFilters(selectedCategory, c.id, maxPriceFilter, sortBy);
                    }}
                    className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedColor === c.id
                        ? 'bg-purple-950 text-purple-200 border-purple-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {c.dot && <span className={`w-2 h-2 rounded-full ${c.dot}`} />}
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider & Sort Controls */}
            <div className="flex items-center gap-4 flex-wrap sm:ml-auto">
              {/* Budget / Price Limit Slider */}
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium">Max:</span>
                <span className="font-bold text-emerald-400">₹{maxPriceFilter}</span>
                <input
                  type="range"
                  min="400"
                  max="3000"
                  step="100"
                  value={maxPriceFilter}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setMaxPriceFilter(val);
                    applyManualFilters(selectedCategory, selectedColor, val, sortBy);
                  }}
                  className="w-24 sm:w-28 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setSortBy(val);
                    applyManualFilters(selectedCategory, selectedColor, maxPriceFilter, val);
                  }}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="default" className="bg-slate-900">Featured</option>
                  <option value="price_asc" className="bg-slate-900">Price: Low to High</option>
                  <option value="price_desc" className="bg-slate-900">Price: High to Low</option>
                  <option value="rating" className="bg-slate-900">Highest Rated</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {(selectedCategory !== 'all' || selectedColor !== 'all' || maxPriceFilter < 3000 || sortBy !== 'default') && (
                <button
                  onClick={handleResetCatalog}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/40 border border-rose-500/30 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Title & Comparison Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{activeFilterTitle}</span>
              <span className="text-xs font-normal text-slate-400">
                (Showing {Math.min(visibleCount, displayedProducts.length)} of {displayedProducts.length})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {displayedProducts.length >= 2 && (
              <button
                onClick={() => setIsCompareOpen(true)}
                className="text-xs font-semibold text-purple-300 hover:text-white flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                Compare #1 & #2
              </button>
            )}

            {displayedProducts.length !== SAMPLE_PRODUCTS.length && (
              <button
                onClick={handleResetCatalog}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:border-orange-500/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Show All Products
              </button>
            )}
          </div>
        </div>

        {/* Empty State with truthful message and polite guidance */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8 space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-lg font-bold text-white">Exact match nahi mila</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              {noMatchWarning ||
                "Sorry, Chotu ko exact match nahi mila. Colour ya budget change karke dekhein?"}
            </p>
            <div className="pt-2">
              <button
                onClick={handleResetCatalog}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-xl hover:from-orange-600 hover:to-amber-600 transition shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                Reset All Filters (Show All Products)
              </button>
            </div>
          </div>
        ) : (
          /* Responsive Product Card Grid (6–12 items displayed properly) */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {visibleProducts.map((product, index) => {
                const positionNumber = index + 1;
                const isInCart = cartItems.some((it) => it.product.id === product.id);

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    positionNumber={positionNumber}
                    onAddToCart={(p, size) => handleAddToCart(p, size, 1)}
                    isItemInCart={isInCart}
                  />
                );
              })}
            </div>

            {/* Pagination / Show More Button */}
            {visibleCount < displayedProducts.length && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 8, displayedProducts.length))}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500 text-slate-200 font-bold text-xs rounded-2xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Show More ({displayedProducts.length - visibleCount} remaining)</span>
                  <ChevronDown className="w-4 h-4 text-orange-400" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ============================================================= */}
        {/* SEPARATE ALTERNATIVE COLOURS SECTION (NEVER MIXED IN EXACT SEARCH RESULTS) */}
        {/* ============================================================= */}
        {otherColorOptions.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Palette className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Other colours you may like (Doosre colors)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Alternative colours available in this category
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {otherColorOptions.map((product, idx) => {
                const isInCart = cartItems.some((it) => it.product.id === product.id);
                return (
                  <ProductCard
                    key={`alt-${product.id}`}
                    product={product}
                    positionNumber={displayedProducts.length + idx + 1}
                    onAddToCart={(p, size) => handleAddToCart(p, size, 1)}
                    isItemInCart={isInCart}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Slide-in Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        budget={budget}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onUndo={handleUndo}
        canUndo={cartHistory.length > 0}
        onProceedToOrder={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
      />

      {/* Order Review & Confirmation Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={cartItems}
        budget={budget}
        onOrderConfirmed={() => {
          setCartItems([]);
          setCartHistory([]);
          const msg = 'Badhaai ho! Aapka demo order confirm ho gaya! Chotu ne sambhaal liya!';
          setChotuMessage(msg);
          speakChotuResponse(msg);
        }}
      />

      {/* Product Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={displayedProducts.slice(0, 2)}
        onAddToCart={(p) => handleAddToCart(p, p.sizes?.[0], 1)}
      />

      {/* Voice Settings Personality Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        availableVoices={availableVoices}
        selectedVoiceURI={selectedVoiceURI}
        onSelectVoice={(uri) => setSelectedVoiceURI(uri)}
        speechRate={speechRate}
        onChangeRate={(r) => setSpeechRate(r)}
        speechPitch={speechPitch}
        onChangePitch={(p) => setSpeechPitch(p)}
        onTestVoice={() => speakChotuResponse('Haan ji! Main hoon Chotu! Bas bolo, Chotu sambhaal lega!')}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-orange-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
