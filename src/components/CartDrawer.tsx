import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, RotateCcw, ArrowRight, Wallet, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  budget: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onProceedToOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  budget,
  onUpdateQuantity,
  onRemoveItem,
  onUndo,
  canUndo,
  onProceedToOrder,
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const remainingBudget = budget - totalAmount;
  const isBudgetExceeded = remainingBudget < 0;
  const budgetPercent = Math.min(100, Math.max(0, (totalAmount / budget) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Shopping Cart</h2>
              <p className="text-xs text-slate-400">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in cart
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Budget Tracker Widget */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-orange-400" />
              Budget Tracker
            </span>
            <span
              className={`font-bold ${
                isBudgetExceeded ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {isBudgetExceeded
                ? `Exceeded by ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`
                : `₹${remainingBudget.toLocaleString('en-IN')} remaining`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${budgetPercent}%` }}
              className={`h-full transition-all duration-300 ${
                isBudgetExceeded
                  ? 'bg-rose-500'
                  : budgetPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
            <span>Spent: ₹{totalAmount.toLocaleString('en-IN')}</span>
            <span>Target: ₹{budget.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-3 text-3xl">
                🛒
              </div>
              <p className="font-semibold text-slate-200">Your cart is empty!</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Speak into the mic: <span className="text-orange-300">"Add 2nd product to cart"</span> or <span className="text-orange-300">"दूसरा प्रॉडक्ट कार्टमध्ये टाक"</span>
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex gap-3 items-center"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-800"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-white line-clamp-1">
                    {item.product.name}
                  </h4>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    ₹{item.product.price.toLocaleString('en-IN')}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      × {item.quantity} = ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-white min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(item.product.id, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      aria-label="Remove item"
                      className="p-1 text-slate-500 hover:text-rose-400 transition ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 space-y-3">
            {/* Subtotal summary */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Cart Total</span>
              <span className="text-lg font-bold text-white">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex gap-2">
              {/* Undo action button */}
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                  canUndo
                    ? 'border-purple-500/40 text-purple-300 bg-purple-950/30 hover:bg-purple-900/40'
                    : 'border-slate-800 text-slate-600 bg-slate-900/50 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo Action
              </button>

              {/* Review & Place Order button */}
              <button
                onClick={onProceedToOrder}
                className="flex-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                Review & Confirm Order
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
