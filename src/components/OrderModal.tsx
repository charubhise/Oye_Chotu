import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, CheckCircle2, Truck, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  budget: number;
  onOrderConfirmed: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  items,
  budget,
  onOrderConfirmed,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const remaining = budget - totalAmount;

  const handleConfirm = () => {
    const id = `OC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setOrderId(id);
    setIsConfirmed(true);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F97316', '#A855F7', '#34D399', '#38BDF8'],
      });
    } catch {}

    onOrderConfirmed();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-white text-base">
              {isConfirmed ? 'Order Confirmed!' : 'Review & Confirm Order'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {isConfirmed ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h4 className="text-xl font-bold text-white">
                Badhaai Ho! Order Placed!
              </h4>
              <p className="text-sm text-slate-300 max-w-sm mx-auto">
                Chotu ne aapka order sambhaal liya hai! Delivery partner jald hi aapke pate par pahuchega.
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 my-4 max-w-xs mx-auto text-left">
                <div className="text-xs text-slate-400">Order Reference:</div>
                <div className="text-base font-black text-orange-400 font-mono">
                  {orderId}
                </div>
                <div className="text-xs text-slate-300 mt-2">
                  Total Paid: <span className="font-bold text-emerald-400">₹{totalAmount.toLocaleString('en-IN')}</span> (COD)
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer"
              >
                Continue Voice Shopping 🛍️
              </button>
            </div>
          ) : (
            <>
              {/* Delivery Details */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-200">Delivery Address</div>
                    <div className="text-slate-400">102, Shanti Vihar, Shivaji Nagar, Mumbai, MH - 400001</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/80">
                  <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="text-slate-300">
                    Expected Delivery: <span className="text-emerald-400 font-semibold">Tomorrow by 11:00 AM</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800/80">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-slate-300">
                    Payment Method: <span className="font-semibold text-white">Cash on Delivery (COD)</span>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Order Items ({items.length})
                </div>

                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 text-center font-bold text-orange-400">
                        {item.quantity}×
                      </span>
                      <span className="text-slate-200 truncate">
                        {item.product.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-100 shrink-0 ml-2">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Charges</span>
                  <span className="text-emerald-400 font-semibold">FREE (Chotu Offer)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shopping Budget</span>
                  <span>₹{budget.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Confirm CTA */}
              <div className="pt-2">
                <button
                  onClick={handleConfirm}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm & Place Order (Say "Confirm Order")
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
