export type Category = 'fashion' | 'electronics' | 'home' | 'beauty' | 'accessories';

export interface Product {
  id: string;
  name: string;
  marathiName?: string;
  hindiName?: string;
  category: Category;
  categoryLabel: string;
  productType: string; // e.g. 'kurti', 'shoes', 'sneakers', 'tshirt', 'jeans', 'trousers', 'saree', 'dress', 'hoodie', 'backpack', 'handbag', 'wallet', 'jewellery', 'sunglasses', 'watch', 'headphones'
  price: number;
  originalPrice: number;
  sizes: string[]; // e.g. ['S', 'M', 'L', 'XL'] or ['UK 7', 'UK 8', 'UK 9'] or ['Free Size']
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  color: string; // e.g. 'black', 'red', 'blue', 'white', 'green', 'yellow', 'brown', 'pink', 'grey'
  tags: string[];
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export type SupportedLanguage = 'auto' | 'hi' | 'mr' | 'en' | 'hinglish';

export interface VoiceIntent {
  intent:
    | 'search'
    | 'show_more'
    | 'set_budget'
    | 'add_to_cart'
    | 'update_quantity'
    | 'remove_item'
    | 'clear_cart'
    | 'get_cart_total'
    | 'find_cheaper'
    | 'sort_price_low'
    | 'sort_price_high'
    | 'compare'
    | 'undo'
    | 'review_order'
    | 'confirm_order'
    | 'reset_filter'
    | 'unknown';
  transcript: string;
  detectedLanguage: string;
  parameters: {
    query?: string;
    requestedType?: string;
    requestedColor?: string;
    maxPrice?: number;
    minPrice?: number;
    category?: Category;
    sortBy?: 'price_asc' | 'price_desc' | 'rating';
    position?: number; // 1-based index from displayed products
    productName?: string;
    quantity?: number;
    budget?: number;
    comparePositions?: [number, number];
  };
  replyText: string;
  chotuVoiceMarathi?: string;
  chotuVoiceHindi?: string;
  noMatchReason?: string;
  isAmbiguousColor?: boolean;
}

export interface CartHistoryEntry {
  action: 'add' | 'remove' | 'update_quantity' | 'clear';
  description: string;
  previousItems: CartItem[];
}

