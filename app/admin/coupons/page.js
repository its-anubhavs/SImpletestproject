"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function Coupons() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCoupons = async () => {
    const snap = await getDocs(collection(db, "coupons"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setCoupons(list);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const createCoupon = async () => {
    if (!code || !discount) return alert("Fill all fields");

    setLoading(true);

    await addDoc(collection(db, "coupons"), {
      code: code.toUpperCase(),
      discount: Number(discount),
      active: true,
    });

    setCode("");
    setDiscount("");
    await fetchCoupons();
    setLoading(false);

    alert("✅ Coupon created");
  };

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    await deleteDoc(doc(db, "coupons", id));
    await fetchCoupons();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md border border-gray-100 p-6">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Coupons
          </h2>
          <p className="text-xs text-gray-700 mt-1">
            Create & manage discount coupons
          </p>
        </div>

        {/* Create Coupon */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-gray-700">
          <input
            placeholder="Coupon Code"
            className="border border-gray-400 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <input
            placeholder="Discount %"
            type="number"
            className="border border-gray-400 text-gray-800 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>

        <button
          onClick={createCoupon}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60 mb-6"
        >
          {loading ? "Creating..." : "Create Coupon"}
        </button>

        {/* Coupons List */}
        <div className="space-y-3">
          {coupons.length === 0 ? (
            <p className="text-sm text-gray-700 text-center">
              No coupons created yet
            </p>
          ) : (
            coupons.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {c.code}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {c.discount}% off
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </span>

                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}