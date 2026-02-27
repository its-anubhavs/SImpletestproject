"use client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { where } from "firebase/firestore";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const faqs = [
  {
    q: "Is this oil suitable for all hair types?",
    a: "Yes, our oils are carefully formulated to work across all hair types — straight, wavy, curly, and coily.",
  },
  {
    q: "How long until I see results?",
    a: "Most customers notice visible improvements in 2–4 weeks with consistent use 2–3 times per week.",
  },
  {
    q: "Are there any chemicals or parabens?",
    a: "Absolutely not. Every ingredient is 100% natural, cold-pressed, and free from synthetic additives.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes! Free shipping on all orders above ₹499 across India.",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= Math.floor(rating) ? "text-amber-400" : s - 0.5 <= rating ? "text-amber-300" : "text-stone-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-b border-stone-200 transition-all ${open ? "bg-emerald-50/50" : ""}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-5 px-6 text-left group"
      >
        <span className="font-semibold text-stone-800 text-sm md:text-base group-hover:text-emerald-700 transition-colors">
          {q}
        </span>
        <span
          className={`ml-4 flex-shrink-0 w-7 h-7 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-600 transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5" : "max-h-0"}`}
      >
        <p className="px-6 text-stone-600 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function HairAura() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const router = useRouter();

  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item,
      ),
    );
  };

  const decreaseQty = (id) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    );
  };

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(storedCart);
  }, []);

  const applyCoupon = async () => {
    if (!couponCode || cart.length === 0) return;

    try {
      setCouponLoading(true);

      const q = query(
        collection(db, "coupons"),
        where("code", "==", couponCode.toUpperCase()),
        where("active", "==", true),
      );

      const snapshot = await getDocs(q);

      // ❌ INVALID / INACTIVE COUPON
      if (snapshot.empty || snapshot.size !== 1) {
        setAppliedCoupon(null);
        setDiscountAmount(0);

        // ❌ clear coupon from localStorage
        localStorage.removeItem("appliedCoupon");

        setToastMsg("Invalid or inactive coupon");
        setTimeout(() => setToastMsg(""), 2800);
        return;
      }

      // ✅ VALID COUPON
      const couponData = snapshot.docs[0].data();

      const discount = Math.floor((cartTotal * couponData.discount) / 100);

      setAppliedCoupon(couponData);
      setDiscountAmount(discount);

      // ✅ SAVE COUPON TO localStorage (STEP 2)
      localStorage.setItem(
        "appliedCoupon",
        JSON.stringify({
          code: couponData.code,
          discount: couponData.discount,
          discountAmount: discount,
        }),
      );

      setToastMsg(`Coupon applied! You saved ₹${discount}`);
      setTimeout(() => setToastMsg(""), 2800);
    } catch (err) {
      console.error(err);
      alert("Error applying coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    if (appliedCoupon) {
      const discount = Math.floor((cartTotal * appliedCoupon.discount) / 100);
      setDiscountAmount(discount);
    }
  }, [cart, appliedCoupon]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
        );

        const snapshot = await getDocs(q);

        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productsData);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing)
        return prev.map((p) =>
          p.id === product.id ? { ...p, qty: p.qty + 1 } : p,
        );

      return [
        ...prev,
        {
          id: product.id,
          name: product.title,
          image: product.imageUrl,
          ml: product.size,
          price: product.price,
          qty: 1,
        },
      ];
    });

    setToastMsg(`${product.title} added to cart!`);
    setTimeout(() => setToastMsg(""), 2800);
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((p) => p.id !== id));
  const cartTotal = cart.reduce((sum, p) => sum + p.price * p.qty, 0);
  const cartCount = cart.reduce((sum, p) => sum + p.qty, 0);

  const shippingFee = cartTotal >= 499 ? 0 : 49;

  useEffect(() => {
    const finalTotal = Math.max(0, cartTotal + shippingFee - discountAmount);

    localStorage.setItem("checkoutTotal", finalTotal.toString());
  }, [cartTotal, discountAmount, shippingFee]);

  return (
    <div
      className="font-sans bg-[#faf9f6] text-stone-800 overflow-x-hidden"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; }
        
        .font-display { font-family: 'Cormorant Garamond', Georgia, serif; }
        .font-body { font-family: 'DM Sans', system-ui, sans-serif; }
        
        .hero-gradient {
          background: linear-gradient(135deg, #1a3329 0%, #2d5a42 40%, #1e4535 70%, #0f2318 100%);
        }
        
        .leaf-pattern {
          background-image: radial-gradient(circle at 20% 80%, rgba(78,160,100,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(78,160,100,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(78,160,100,0.05) 0%, transparent 70%);
        }
        
        .card-hover {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.12);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #2d6a4f, #1a4a35);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #40916c, #2d6a4f);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary > * { position: relative; z-index: 1; }
        
        .animate-fade-up {
          animation: fadeUp 0.7s ease forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .toast {
          animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.4s forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(120%); }
        }
        
        .tag-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        
        .section-divider {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #2d6a4f, #95d5b2);
          margin: 16px auto;
        }
        
        .cart-overlay {
          transition: opacity 0.3s ease;
        }
        .cart-panel {
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .ingredient-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.8);
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #2d6a4f; border-radius: 3px; }

        .trust-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .hero-text { font-size: 2.5rem !important; }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast fixed bottom-6 right-6 z-[200] bg-emerald-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-body text-sm">
          <svg
            className="w-5 h-5 text-emerald-300 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {toastMsg}
        </div>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <>
          <div
            className="cart-overlay fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="cart-panel fixed right-0 top-0 h-full w-full sm:w-[420px] z-[110] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <h3 className="font-display text-2xl font-semibold text-stone-800">
                Your Cart
              </h3>
              <button
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-400">
                  <svg
                    className="w-16 h-16 mb-4 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <p className="font-body text-sm">Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-stone-50 rounded-2xl"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <div className="flex-1">
                      <p className="font-body font-medium text-stone-800 text-sm leading-tight">
                        {item.name}
                      </p>
                      <p className="font-body text-xs text-stone-500 mt-0.5">
                        {item.ml}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-display text-emerald-700 font-semibold">
                          ₹{item.price * item.qty}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-body">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseQty(item.id)}
                              className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-300 transition"
                            >
                              −
                            </button>

                            <span className="min-w-[20px] text-center font-body text-sm">
                              {item.qty}
                            </span>

                            <button
                              onClick={() => increaseQty(item.id)}
                              className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-300 transition"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-600 transition ml-2"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-stone-100">
                <div className="flex justify-between mb-1 font-body text-sm text-stone-500">
                  {/* Coupon Section */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 border border-stone-300 px-3 py-2 rounded-lg text-sm"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        {couponLoading ? "Checking..." : "Apply"}
                      </button>
                    </div>

                    {appliedCoupon && (
                      <p className="text-emerald-600 text-xs mt-2">
                        {appliedCoupon.code} applied • You saved ₹
                        {discountAmount}
                      </p>
                    )}
                  </div>

                  <span>Subtotal</span>
                  <span>₹{cartTotal}</span>
                </div>
                {cartTotal < 499 && (
                  <p className="font-body text-xs text-amber-600 mb-3">
                    Add ₹{499 - cartTotal} more for free shipping!
                  </p>
                )}
                {cartTotal >= 499 && (
                  <p className="font-body text-xs text-emerald-600 mb-3 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Free shipping unlocked!
                  </p>
                )}
                <div className="flex justify-between mb-4 font-body font-semibold text-stone-800">
                  <span>Total</span>
                  <span className="font-display text-xl text-emerald-700">
                    ₹
                    {Math.max(
                      0,
                      cartTotal + shippingFee - discountAmount,
                    ).toFixed(0)}
                  </span>
                </div>
                <button
                  onClick={() => router.push("/checkout")}
                  className="btn-primary w-full text-white cursor-pointer hover:text-black py-4 rounded-2xl"
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <a
            href="#"
            className="font-display text-2xl font-bold tracking-wide transition-colors text-emerald-800"
          >
            Hair<span className="italic font-light">Aura</span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {["About", "Products", "Ingredients", "Reviews", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="font-body text-sm font-medium transition-colors hover:text-emerald-400 text-stone-600"
                >
                  {item}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full transition-all text-stone-700 cursor-pointer hover:bg-stone-500"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-amber-400 text-stone-900 text-[10px] font-bold rounded-full flex items-center justify-center font-body"
                  style={{ width: 18, height: 18 }}
                >
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg
                className={`w-6 h-6 ${scrolled ? "text-stone-700" : "text-white"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-stone-100 px-6 py-4 space-y-3">
            {["About", "Products", "Ingredients", "Reviews", "Contact"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className="block font-body text-stone-700 font-medium py-2 border-b border-stone-50"
                >
                  {item}
                </a>
              ),
            )}
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      <section className="hero-gradient leaf-pattern min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 left-10 w-48 h-48 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="absolute top-0 right-1/3 w-96 h-96 rounded-full bg-teal-400/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-24 pb-16 grid md:grid-cols-2 gap-16 items-center w-full relative z-10">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-body text-emerald-300 text-xs font-medium tracking-widest uppercase">
                100% Ayurvedic · No Chemicals
              </span>
            </div>
            <h1
              className="font-display hero-text text-emerald-300 leading-tight"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
            >
              Unlock Your
              <br />
              <em className="text-emerald-300">Hair is Natural</em>
              <br />
              Potential
            </h1>
            <p className="font-body text-gray-700 mt-6 text-base md:text-lg leading-relaxed max-w-md">
              Ancient Ayurvedic wisdom, cold-pressed purity, and modern science
              — crafted for hair that is truly alive.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <a
                href="#products"
                className="btn-primary text-white px-8 py-4 rounded-2xl font-body font-semibold text-sm tracking-wide inline-flex items-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                <span>Shop Products</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 text-gray-700 hover:text-white font-body text-sm font-medium transition-colors px-2 py-4"
              >
                Learn Our Story →
              </a>
            </div>
            <div className="flex flex-wrap gap-6 mt-12">
              {[
                ["10K+", "Happy Customers"],
                ["4.9★", "Average Rating"],
                ["100%", "Natural Ingredients"],
              ].map(([val, label]) => (
                <div key={label}>
                  <p className="font-display text-3xl font-bold text-gray-700">
                    {val}
                  </p>
                  <p className="font-body text-gray-600 text-xs mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center items-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl scale-75" />
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=80"
                alt="Premium Hair Oil"
                className="w-80 md:w-96 rounded-3xl shadow-2xl shadow-black/40 object-cover aspect-square"
              />
              <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl px-5 py-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-600 text-lg">
                    🌿
                  </div>
                  <div>
                    <p className="font-body font-semibold text-stone-800 text-sm">
                      Cold-Pressed
                    </p>
                    <p className="font-body text-stone-500 text-xs">
                      Nutrient-Rich Formula
                    </p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-6 bg-emerald-700 text-white rounded-2xl px-4 py-3 shadow-xl">
                <p className="font-body text-xs font-semibold">
                  ✓ Dermatologist
                </p>
                <p className="font-body text-xs opacity-80">
                  Tested & Approved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 flex flex-wrap justify-center md:justify-between gap-4">
            {[
              "🌿 Paraben-Free",
              "🔬 Lab Tested",
              "🐰 Cruelty-Free",
              "♻️ Eco Packaging",
              "🚚 Free Shipping ₹499+",
            ].map((badge) => (
              <span key={badge} className="trust-badge text-white/70 text-xs">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="max-w-7xl mx-auto px-5 md:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-4 bg-emerald-50 rounded-3xl" />
            <img
              src="https://images.unsplash.com/photo-1542621334-a254cf47733d?w=700&q=80"
              alt="Natural herbs and oils"
              className="relative rounded-2xl w-full object-cover shadow-xl"
              style={{ aspectRatio: "4/5" }}
            />
            <div className="absolute bottom-6 right-6 bg-white rounded-2xl p-5 shadow-lg max-w-[200px]">
              <p className="font-display text-3xl font-bold text-emerald-700">
                15+
              </p>
              <p className="font-body text-stone-600 text-sm mt-1">
                Active botanical ingredients per bottle
              </p>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <span className="font-body text-emerald-600 text-xs font-semibold tracking-widest uppercase">
              Our Story
            </span>
            <div
              className="section-divider ml-0 mt-2 mb-4"
              style={{ margin: "8px 0 16px" }}
            />
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight text-stone-900">
              Where Ancient Wisdom
              <br />
              <em>Meets Modern Science</em>
            </h2>
            <p className="font-body text-stone-600 mt-6 leading-relaxed">
              Born from generations of Ayurvedic knowledge, HairAura blends
              time-tested botanical formulations with contemporary
              cold-extraction techniques to preserve every drop of nature is
              goodness.
            </p>
            <p className="font-body text-stone-600 mt-4 leading-relaxed">
              We source our herbs directly from certified organic farms across
              Kerala and Himachal Pradesh — no middlemen, no compromises. Every
              batch is small-batch produced to ensure quality you can trust.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {[
                ["Certified Organic", "All herbs are pesticide-free"],
                ["GMP Certified", "Manufacturing excellence"],
                ["Dermatologist Tested", "Safe for all skin types"],
                ["pH Balanced", "Scalp-friendly formula"],
              ].map(([title, desc]) => (
                <div key={title} className="bg-stone-50 rounded-xl p-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                    <svg
                      className="w-4 h-4 text-emerald-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="font-body font-semibold text-stone-800 text-sm">
                    {title}
                  </p>
                  <p className="font-body text-stone-500 text-xs mt-1">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── INGREDIENTS HIGHLIGHT ─── */}
      <section
        id="ingredients"
        className="bg-[#0f2318] py-24 overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,106,79,0.3),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-5 md:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="font-body text-emerald-400 text-xs font-semibold tracking-widest uppercase">
              What is Inside
            </span>
            <div className="section-divider mt-2" />
            <h2 className="font-display text-4xl md:text-5xl text-white mt-4 font-semibold">
              Nature is <em className="text-emerald-300">Finest</em> Ingredients
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                name: "Brahmi",
                emoji: "🌿",
                desc: "Strengthens hair roots, reduces thinning, and promotes thicker growth.",
              },
              {
                name: "Bhringraj",
                emoji: "🌱",
                desc: "The 'King of Hair' herb known to reverse hair loss and premature greying.",
              },
              {
                name: "Amla",
                emoji: "🫐",
                desc: "Rich in Vitamin C, deeply nourishes follicles and adds brilliant shine.",
              },
              {
                name: "Rosemary",
                emoji: "🪴",
                desc: "Clinically shown to improve hair density and scalp circulation.",
              },
            ].map((ing) => (
              <div
                key={ing.name}
                className="ingredient-card rounded-2xl p-6 text-center"
              >
                <span className="text-4xl">{ing.emoji}</span>
                <h4 className="font-display text-xl font-semibold text-stone-800 mt-3">
                  {ing.name}
                </h4>
                <p className="font-body text-stone-600 text-sm mt-2 leading-relaxed">
                  {ing.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      {/* ─── PRODUCTS ─── */}
      <section id="products" className="max-w-7xl mx-auto px-5 md:px-8 py-24">
        <div className="text-center mb-14">
          <span className="font-body text-emerald-600 text-xs font-semibold tracking-widest uppercase">
            Shop
          </span>
          <div className="section-divider mt-2" />
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 mt-4">
            Our Collection
          </h2>
          <p className="font-body text-stone-500 mt-4 max-w-md mx-auto">
            Each oil is thoughtfully crafted for a specific hair concern. Find
            your perfect match.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {loadingProducts ? (
            <p className="col-span-full text-center font-body text-stone-500">
              Loading products...
            </p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="card-hover bg-white rounded-3xl overflow-hidden shadow-md group"
              >
                {/* IMAGE */}
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-64 w-full bg-stone-100 flex items-center justify-center text-sm text-stone-400">
                    No Image
                  </div>
                )}

                {/* CONTENT */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating rating={product.rating} />
                    <span className="font-body text-stone-400 text-xs">
                      ({product.reviews?.toLocaleString() || 0})
                    </span>
                  </div>

                  <h4 className="font-display text-xl font-semibold text-stone-800 mt-2">
                    {product.title}
                  </h4>

                  <p className="font-body text-stone-400 text-xs mt-0.5">
                    {product.size}
                  </p>

                  <ul className="mt-3 space-y-1">
                    {product.benefits?.map((b) => (
                      <li
                        key={b}
                        className="flex items-center gap-2 font-body text-xs text-stone-500"
                      >
                        <svg
                          className="w-3 h-3 text-emerald-500 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-stone-100">
                    <div>
                      <p className="font-display text-2xl font-bold text-emerald-700">
                        ₹{product.price}
                      </p>
                      <p className="font-body text-stone-400 text-xs line-through">
                        ₹{product.mrp}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="btn-primary text-white px-5 py-2.5 rounded-xl font-body font-medium text-sm flex items-center gap-2"
                    >
                      <span>Add to Cart</span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ─── HOW TO USE ─── */}
      <section className="bg-emerald-50 py-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <span className="font-body text-emerald-600 text-xs font-semibold tracking-widest uppercase">
              Ritual Guide
            </span>
            <div className="section-divider mt-2" />
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 mt-4">
              How To Use
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: "💧",
                title: "Warm the Oil",
                desc: "Gently warm 2–3 tsp in your palms or in a small bowl.",
              },
              {
                step: "02",
                icon: "✋",
                title: "Apply & Massage",
                desc: "Section your hair and massage oil into scalp for 5–7 minutes.",
              },
              {
                step: "03",
                icon: "⏱️",
                title: "Leave On",
                desc: "Let it sit for at least 1 hour, or overnight for best results.",
              },
              {
                step: "04",
                icon: "🚿",
                title: "Wash Off",
                desc: "Rinse with your regular mild shampoo. Repeat 2–3x per week.",
              },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-12px)] w-6 h-0.5 bg-emerald-200 z-10" />
                )}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <span className="font-body text-emerald-200 font-bold text-4xl leading-none block">
                    {s.step}
                  </span>
                  <span className="text-3xl mt-2 block">{s.icon}</span>
                  <h4 className="font-display text-lg font-semibold text-stone-800 mt-3">
                    {s.title}
                  </h4>
                  <p className="font-body text-stone-500 text-sm mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section id="reviews" className="max-w-7xl mx-auto px-5 md:px-8 py-24">
        <div className="text-center mb-14">
          <span className="font-body text-emerald-600 text-xs font-semibold tracking-widest uppercase">
            Social Proof
          </span>
          <div className="section-divider mt-2" />
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-stone-900 mt-4">
            Real Results,
            <br />
            <em>Real People</em>
          </h2>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="flex -space-x-2">
              {[
                "https://i.pravatar.cc/40?img=1",
                "https://i.pravatar.cc/40?img=5",
                "https://i.pravatar.cc/40?img=10",
                "https://i.pravatar.cc/40?img=15",
                "https://i.pravatar.cc/40?img=20",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <p className="font-body text-stone-600 text-sm">
              <strong>10,000+</strong> verified reviews · <strong>4.9</strong> ★
              avg rating
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Riya Sharma",
              location: "Mumbai",
              rating: 5,
              text: "My hair fall dropped significantly within 3 weeks. I was skeptical at first but the results genuinely surprised me. The oil absorbs quickly and doesn't feel heavy.",
              time: "2 weeks ago",
              avatar: "https://i.pravatar.cc/60?img=1",
            },
            {
              name: "Aman Verma",
              location: "Delhi",
              rating: 5,
              text: "Very light and non-sticky. I've tried dozens of oils and this is the first one that doesn't leave my pillow covered in grease. The fragrance is subtle and natural.",
              time: "1 month ago",
              avatar: "https://i.pravatar.cc/60?img=5",
            },
            {
              name: "Neha Patel",
              location: "Bangalore",
              rating: 4,
              text: "Great results and love that it's all natural. My scalp feels healthier and less itchy. Would give 5 stars but delivery took a bit longer than expected.",
              time: "3 weeks ago",
              avatar: "https://i.pravatar.cc/60?img=10",
            },
          ].map((review) => (
            <div
              key={review.name}
              className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div>
                  <p className="font-body font-semibold text-stone-800 text-sm">
                    {review.name}
                  </p>
                  <p className="font-body text-stone-400 text-xs">
                    {review.location}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <StarRating rating={review.rating} />
                  <p className="font-body text-stone-300 text-xs mt-1">
                    {review.time}
                  </p>
                </div>
              </div>
              <p className="font-body text-stone-600 text-sm leading-relaxed flex-1">
                {review.text}
              </p>
              <div className="mt-4 pt-4 border-t border-stone-50 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-body text-emerald-600 text-xs font-medium">
                  Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="bg-stone-50 py-24">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <div className="text-center mb-12">
            <span className="font-body text-emerald-600 text-xs font-semibold tracking-widest uppercase">
              FAQ
            </span>
            <div className="section-divider mt-2" />
            <h2 className="font-display text-4xl font-semibold text-stone-900 mt-4">
              Got Questions?
            </h2>
          </div>
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-stone-100">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="bg-gradient-to-r from-emerald-800 to-emerald-700 py-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="max-w-4xl mx-auto px-5 md:px-8 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-5xl text-white font-semibold">
            Start Your Hair Journey now
            <br />
            <em className="text-emerald-200">Today</em>
          </h2>
          <p className="font-body text-emerald-200 mt-4 max-w-md mx-auto">
            Free shipping on orders above ₹499. 30-day money-back guarantee. No
            questions asked.
          </p>
          <a
            href="#products"
            className="inline-flex items-center gap-2 mt-8 bg-white text-emerald-800 px-8 py-4 rounded-2xl font-body font-bold text-sm hover:bg-emerald-50 transition shadow-lg"
          >
            Shop Now — Free Shipping Available
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </section>

      <section id="contact" className="max-w-7xl mx-auto px-5 md:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="font-body text-emerald-600 text-xs font-semibold tracking-widest uppercase">
              Get In Touch
            </span>
            <div
              className="section-divider ml-0 mt-2 mb-4"
              style={{ margin: "8px 0 16px" }}
            />
            <h2 className="font-display text-4xl font-semibold text-stone-900">
              We are Here
              <br />
              <em>To Help</em>
            </h2>
            <p className="font-body text-stone-600 mt-4 leading-relaxed">
              Have a question about our products or your order? Our team is
              ready to assist you.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: "📧", label: "Email", value: "support@hairaura.in" },
                { icon: "📞", label: "Phone", value: "+91 9XXXXXXXXX" },
                { icon: "📍", label: "Address", value: "Delhi, India" },
                {
                  icon: "⏰",
                  label: "Support Hours",
                  value: "Mon–Sat, 10am–7pm IST",
                },
              ].map((contact) => (
                <div key={contact.label} className="flex items-center gap-4">
                  <span className="text-2xl">{contact.icon}</span>
                  <div>
                    <p className="font-body text-stone-400 text-xs">
                      {contact.label}
                    </p>
                    <p className="font-body font-medium text-stone-700 text-sm">
                      {contact.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {/* WhatsApp CTA Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-7"
              style={{
                background: "linear-gradient(135deg, #1a3329 0%, #2d6a4f 100%)",
              }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
              <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/5 translate-y-10 -translate-x-6" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-lg">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.534 5.856L.054 23.25a.75.75 0 00.916.916l5.394-1.48A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.97-1.366l-.355-.212-3.683 1.01 1.01-3.684-.213-.355A9.726 9.726 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-white text-sm">
                      Chat on WhatsApp
                    </p>
                    <p className="font-body text-white/50 text-xs">
                      Typically replies in minutes
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
                    <span className="font-body text-[#25D366] text-xs font-medium">
                      Online
                    </span>
                  </div>
                </div>
                <p className="font-body text-white/70 text-sm leading-relaxed mb-5">
                  Have a quick question? Our hair care experts are available on
                  WhatsApp to help you choose the right oil, track your order,
                  or assist with anything else.
                </p>
                <a
                  href="https://wa.me/919XXXXXXXXX?text=Hi%2C%20I%20have%20a%20question%20about%20HairAura%20products!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 w-full justify-center bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 rounded-2xl font-body font-bold text-sm transition-all duration-200 shadow-lg shadow-green-900/30 hover:shadow-green-900/50 hover:-translate-y-0.5"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
                  </svg>
                  Start WhatsApp Chat
                </a>
              </div>
            </div>

            {/* Social Connect Grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  platform: "Instagram",
                  handle: "@hairaura.in",
                  bg: "from-[#833ab4] via-[#fd1d1d] to-[#fcb045]",
                  icon: (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  ),
                  followers: "12.4K",
                },
                {
                  platform: "Facebook",
                  handle: "HairAura",
                  bg: "from-[#1877f2] to-[#0c5fca]",
                  icon: (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                  followers: "8.2K",
                },
                {
                  platform: "YouTube",
                  handle: "HairAura TV",
                  bg: "from-[#ff0000] to-[#cc0000]",
                  icon: (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                  followers: "3.1K",
                },
              ].map((soc) => (
                <a
                  key={soc.platform}
                  href="#"
                  className={`bg-gradient-to-br ${soc.bg} rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:-translate-y-1 transition-transform duration-200 shadow-md`}
                >
                  {soc.icon}
                  <span className="font-body font-bold text-white text-xs">
                    {soc.followers}
                  </span>
                  <span className="font-body text-white/70 text-[10px]">
                    {soc.platform}
                  </span>
                </a>
              ))}
            </div>

            {/* Email strip */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-body font-semibold text-stone-800 text-sm">
                    Email Support
                  </p>
                  <p className="font-body text-stone-400 text-xs">
                    support@hairaura.in
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@hairaura.in"
                className="btn-primary text-white px-4 py-2.5 rounded-xl font-body text-xs font-semibold flex-shrink-0"
              >
                <span>Write to Us</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0f2318] text-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h5 className="font-display text-3xl font-bold">
              Hair<em className="font-light">Aura</em>
            </h5>
            <p className="font-body text-white/50 text-sm mt-4 leading-relaxed">
              Ancient Ayurvedic wisdom meets modern hair science. Trusted by
              10,000+ happy customers across India.
            </p>
            <div className="flex gap-3 mt-6">
              {["Instagram", "Facebook", "WhatsApp"].map((soc) => (
                <a
                  key={soc}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-700 transition flex items-center justify-center"
                >
                  <span className="text-xs font-body">{soc[0]}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h6 className="font-body font-semibold text-sm tracking-wider uppercase text-white/60 mb-5">
              Products
            </h6>
            <ul className="space-y-3">
              {[
                "Brahmi Growth Elixir",
                "Neem & Bhringraj Oil",
                "Rosemary & Castor Oil",
                "All Products",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#products"
                    className="font-body text-white/50 text-sm hover:text-emerald-400 transition"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="font-body font-semibold text-sm tracking-wider uppercase text-white/60 mb-5">
              Company
            </h6>
            <ul className="space-y-3">
              {["About Us", "Our Ingredients", "Blog", "Careers"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="font-body text-white/50 text-sm hover:text-emerald-400 transition"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <h6 className="font-body font-semibold text-sm tracking-wider uppercase text-white/60 mb-5">
              Support
            </h6>
            <ul className="space-y-3">
              {[
                "Privacy Policy",
                "Terms & Conditions",
                "Return Policy",
                "Shipping Info",
                "Contact Us",
              ].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="font-body text-white/50 text-sm hover:text-emerald-400 transition"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 max-w-7xl mx-auto px-5 md:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-body text-white/30 text-xs">
            © 2026 HairAura. All rights reserved.
          </p>
          <div className="flex gap-4">
            {["💳 Razorpay", "🔒 SSL Secured", "📦 Pan India Delivery"].map(
              (badge) => (
                <span key={badge} className="font-body text-white/30 text-xs">
                  {badge}
                </span>
              ),
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
