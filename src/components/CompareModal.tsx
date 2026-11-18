import React from 'react';
import { Product } from '../types';
import { X, Check, Plus, Star, ArrowRightLeft } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddToCart,
}) => {
  if (!isOpen || products.length < 2) return null;

  const [p1, p2] = products;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-orange-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Chotu's Product Comparison</h2>
              <p className="text-xs text-slate-400">Comparing #1 vs #2 side-by-side</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Table Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4 sm:gap-6 divide-x divide-slate-800">
          {/* Product 1 */}
          <div className="flex flex-col justify-between pr-2 sm:pr-4 space-y-4">
            <div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-3">
                <img src={p1.image} alt={p1.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-slate-950/90 text-orange-400 text-xs font-black px-2 py-0.5 rounded border border-orange-500/50">
                  #1
                </span>
                <span className="absolute top-2 right-2 bg-slate-950/90 text-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-700 capitalize">
                  {p1.color}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-2">{p1.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-3">{p1.description}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Price:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{p1.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Color:</span>
                <span className="font-semibold text-slate-200 capitalize">{p1.color}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rating:</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {p1.rating} ({p1.reviewCount})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sizes:</span>
                <span className="text-slate-300 font-medium">{p1.sizes?.join(', ')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(p1);
                onClose();
              }}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Add #1 to Cart
            </button>
          </div>

          {/* Product 2 */}
          <div className="flex flex-col justify-between pl-4 sm:pl-6 space-y-4">
            <div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-3">
                <img src={p2.image} alt={p2.name} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-slate-950/90 text-orange-400 text-xs font-black px-2 py-0.5 rounded border border-orange-500/50">
                  #2
                </span>
                <span className="absolute top-2 right-2 bg-slate-950/90 text-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-700 capitalize">
                  {p2.color}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-2">{p2.name}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-3">{p2.description}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Price:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{p2.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Color:</span>
                <span className="font-semibold text-slate-200 capitalize">{p2.color}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Rating:</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {p2.rating} ({p2.reviewCount})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sizes:</span>
                <span className="text-slate-300 font-medium">{p2.sizes?.join(', ')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onAddToCart(p2);
                onClose();
              }}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" />
              Add #2 to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
