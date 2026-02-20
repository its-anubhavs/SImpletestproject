"use client";
import { useState, useEffect } from "react";
import Script from "next/script";
import { db } from "@/src/lib/firebase";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const validateAddress = () => {
    const newErrors = {};

    if (!address.name.trim()) newErrors.name = "Name is required";
    if (!address.phone.trim() || address.phone.length < 10)
      newErrors.phone = "Valid phone number required";
    if (!address.line1.trim()) newErrors.line1 = "Address is required";
    if (!address.city.trim()) newErrors.city = "City is required";
    if (!address.state.trim()) newErrors.state = "State is required";
    if (!address.pincode.trim() || address.pincode.length < 6)
      newErrors.pincode = "Valid pincode required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("razorpay");

  // ✅ SAFE browser-only code
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");

    const storedTotal =
      Number(localStorage.getItem("checkoutTotal")) ||
      storedCart.reduce((s, i) => s + i.price * i.qty, 0);

    setCart(storedCart);
    setTotal(storedTotal);
  }, []);

  const placeCODOrder = async () => {
    const docRef = await addDoc(collection(db, "orders"), {
      address,
      cart,
      total,
      paymentMethod: "COD",
      status: "pending",
      createdAt: Timestamp.now(),
    });

    setOrderDetails({
      id: docRef.id,
      payment: "Cash on Delivery",
    });

    setOrderSuccess(true);

    setTimeout(() => {
      localStorage.removeItem("cart");
      localStorage.removeItem("checkoutTotal");
      router.push("/");
    }, 6000);
  };

 const payWithRazorpay = async () => {
  try {
    const res = await fetch("/api/razorpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: total }),
    });

    if (!res.ok) {
      throw new Error("Failed to create Razorpay order");
    }

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: order.amount,
      currency: "INR",
      name: "HairAura",
      description: "HairAura Order",
      order_id: order.id,

      handler: async function (response) {
        const docRef = await addDoc(collection(db, "orders"), {
          address,
          cart,
          total,
          paymentMethod: "ONLINE",
          razorpay: response,
          status: "paid",
          createdAt: Timestamp.now(),
        });

        setOrderDetails({
          id: docRef.id,
          payment: "Online Payment",
        });

        setOrderSuccess(true);

        setTimeout(() => {
          localStorage.removeItem("cart");
          localStorage.removeItem("checkoutTotal");
          router.push("/");
        }, 6000);
      },

      theme: {
        color: "#047857", // emerald-700
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    alert("Payment failed. Please try again.");
  }
};

  // ✅ STEP-4: SUCCESS SCREEN
  if (orderSuccess && orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] px-4">
        <div className="bg-white max-w-xl w-full rounded-3xl shadow-xl p-8 text-center">
          {/* SUCCESS ICON */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-stone-800">
            Order Placed Successfully 🎉
          </h2>

          <p className="text-sm text-stone-600 mt-2">
            Thank you for shopping with HairAura
          </p>

          {/* ORDER DETAILS */}
          <div className="mt-6 bg-stone-50 text-gray-700 rounded-2xl p-4 text-left text-sm">
            <p>
              <span className="font-semibold">Order ID:</span> {orderDetails.id}
            </p>
            <p>
              <span className="font-semibold">Payment:</span>{" "}
              {orderDetails.payment}
            </p>
            <p>
              <span className="font-semibold">Total:</span> ₹{total}
            </p>
          </div>

          {/* SHIPPING */}
          <div className="mt-4 text-left text-sm">
            <p className="font-semibold text-gray-800 mb-1">Shipping Address</p>
            <p className="text-stone-600">
              {address.name}, {address.phone}
              <br />
              {address.line1}, {address.city}
              <br />
              {address.state} – {address.pincode}
            </p>
          </div>

          {/* ITEMS */}
          <div className="mt-4 text-left text-sm">
            <p className="font-semibold text-gray-600 mb-1">Items</p>
            {cart.map((item) => (
              <p key={item.id} className="text-stone-600">
                {item.name} × {item.qty}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10">
          {/* LEFT – ADDRESS */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold mb-6 text-stone-800">
              Shipping Address
            </h2>

            <div className="grid gap-4">
              {[
                { key: "name", label: "Full Name" },
                { key: "phone", label: "Phone Number" },
                { key: "line1", label: "Address Line" },
                { key: "city", label: "City" },
                { key: "state", label: "State" },
                { key: "pincode", label: "Pincode" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {f.label}
                  </label>

                  <input
                    value={address[f.key]}
                    onChange={(e) =>
                      setAddress({ ...address, [f.key]: e.target.value })
                    }
                    placeholder={f.label}
                    className={`
      w-full border rounded-xl px-4 py-3 text-sm outline-none transition
      ${
        errors[f.key]
          ? "border-red-500 bg-red-50 focus:ring-red-400/30"
          : "border-stone-300 text-stone-800 placeholder-stone-400 focus:bg-emerald-50/40 focus:border-emerald-600 focus:ring-emerald-500/30"
      }
      focus:ring-2
    `}
                  />

                  {errors[f.key] && (
                    <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT – ORDER SUMMARY */}
          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6 text-stone-800">
              Order Summary
            </h2>

            {/* ITEMS */}
            <div className="space-y-4 flex-1 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-stone-800 text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-stone-500">Qty: {item.qty}</p>
                  </div>
                  <p className="font-semibold text-emerald-700">
                    ₹{item.price * item.qty}
                  </p>
                </div>
              ))}
            </div>

            {/* PAYMENT */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-stone-700 mb-3">
                Payment Method
              </p>

              <div className="space-y-4">
                {/* RAZORPAY */}
                <label
                  className={`
      flex items-center gap-4
      border rounded-2xl p-4 cursor-pointer
      transition-all
      ${
        paymentMethod === "razorpay"
          ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
          : "border-stone-300 hover:border-emerald-400 bg-white"
      }
    `}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-800">
                      Online Payment
                    </span>
                    <span className="text-xs text-stone-500">
                      Pay securely via Razorpay (UPI, Cards, Netbanking)
                    </span>
                  </div>
                </label>

                {/* COD */}
                <label
                  className={`
      flex items-center gap-4
      border rounded-2xl p-4 cursor-pointer
      transition-all
      ${
        paymentMethod === "cod"
          ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20"
          : "border-stone-300 hover:border-emerald-400 bg-white"
      }
    `}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-emerald-600 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-800">
                      Cash on Delivery
                    </span>
                    <span className="text-xs text-stone-500">
                      Pay when your order is delivered
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* TOTAL */}
            <div className="border-t mt-6 pt-4 flex justify-between text-lg font-semibold">
              <span className="text-black">Total</span>
              <span className="text-emerald-700">₹{total}</span>
            </div>

            <button
              onClick={() => {
                if (!validateAddress()) return;

                paymentMethod === "cod" ? placeCODOrder() : payWithRazorpay();
              }}
              className="mt-6 bg-emerald-700 hover:bg-emerald-800 transition text-white py-4 rounded-2xl font-semibold text-sm shadow-lg"
            >
              {paymentMethod === "cod"
                ? "Place Order (COD)"
                : "Pay Securely ₹" + total}
            </button>

            <p className="text-xs text-stone-600 text-center mt-4">
              100% Secure Payments · SSL Encrypted · Trusted by 10,000+
              customers
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
