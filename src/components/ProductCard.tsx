import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Star, Check, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  positionNumber: number; // 1-based index (e.g. 1, 2, 3)
  onAddToCart: (product: Product, size?: string) => void;
  isItemInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  positionNumber,
  onAddToCart,
  isItemInCart = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard'
  );

  const discountPercent = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  // Map color names to Tailwind styles for accurate visual swatch
  const getColorDotClass = (c: string) => {
    switch (c.toLowerCase()) {
      case 'black':
        return 'bg-black border border-slate-600';
      case 'red':
        return 'bg-red-500';
      case 'blue':
        return 'bg-blue-500';
      case 'white':
        return 'bg-white border border-slate-400';
      case 'green':
        return 'bg-emerald-500';
      case 'yellow':
        return 'bg-amber-400';
      case 'pink':
        return 'bg-pink-400';
      case 'brown':
        return 'bg-amber-800';
      case 'grey':
      case 'gray':
        return 'bg-slate-400';
      default:
        return 'bg-slate-500';
    }
  };

  return (
    <div
      data-testid={`product-card-${positionNumber}`}
      className="group bg-slate-900/90 border border-slate-800/90 hover:border-orange-500/50 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 relative"
    >
      {/* Top Media Container */}
      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden flex items-center justify-center">
        {!imageError ? (
          <img
            src={product.image}
            alt={`${product.color} ${product.name}`}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Clean SVG Fallback Card */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-center">
            <span className="text-3xl mb-1">
              {product.productType === 'shoes'
                ? '👟'
                : product.productType === 'kurti' || product.productType === 'dress'
                ? '👗'
                : product.productType === 'tshirt' || product.productType === 'hoodie'
                ? '👕'
                : product.productType === 'headphones' || product.productType === 'speaker'
                ? '🎧'
                : product.productType === 'watch'
                ? '⌚'
                : product.productType === 'backpack' || product.productType === 'handbag' || product.productType === 'wallet'
                ? '🎒'
                : '🛍️'}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {product.color} {product.productType}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Verified Demo Sample</span>
          </div>
        )}

        {/* Big Position Badge - Critical for voice commands like "Doosra product cart mein daal" */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-slate-950/90 border border-orange-500/60 text-white px-2.5 py-1 rounded-lg shadow-md backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-black tracking-wider text-orange-400">
            #{positionNumber}
          </span>
        </div>

        {/* Color Swatch Badge */}
        <div className="absolute top-2.5 right-2.5 bg-slate-950/90 backdrop-blur-sm text-[11px] font-semibold text-slate-200 px-2.5 py-0.5 rounded-md border border-slate-700/60 flex items-center gap-1.5 shadow">
          <span className={`w-2.5 h-2.5 rounded-full shadow-inner ${getColorDotClass(product.color)}`} />
          <span className="capitalize">{product.color}</span>
        </div>

        {/* Discount Tag */}
        {discountPercent > 0 && (
          <div className="absolute bottom-2.5 left-2.5 bg-purple-600/95 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow">
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Subtitles: Marathi & Hindi */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-300/90 line-clamp-1 mb-1">
            {product.marathiName && <span>{product.marathiName}</span>}
            {product.marathiName && product.hindiName && <span>•</span>}
            {product.hindiName && <span className="text-amber-300/80">{product.hindiName}</span>}
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {product.description}
          </p>

          {/* Available Sizes Pills */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
                Sizes:
              </span>
              <div className="flex items-center gap-1">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors ${
                      selectedSize === sz
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/60'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price & Add to Cart Action */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-emerald-400">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
              <span className="flex items-center text-amber-400 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                {product.rating}
              </span>
              <span>• {product.reviewCount} reviews</span>
            </div>
          </div>

          <button
            onClick={() => onAddToCart(product, selectedSize)}
            aria-label={`Add #${positionNumber} ${product.name} to cart`}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer ${
              isItemInCart
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
            }`}
          >
            {isItemInCart ? (
              <>
                <Check className="w-3.5 h-3.5" />
                In Cart
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
