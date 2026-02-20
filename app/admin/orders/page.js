"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const q = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setOrders(
        snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 flex justify-center">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Orders
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Latest orders appear first
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center">
            No orders found
          </p>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm p-5"
              >
                {/* Top Row */}
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="text-sm font-medium text-gray-800">
                      {order.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-emerald-700">
                      ₹{order.total}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Payment</p>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full ${
                        order.paymentMethod === "ONLINE"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.paymentMethod}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Address */}
                {order.address && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Shipping Address
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.address.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.address.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.address.line1}, {order.address.city},{" "}
                      {order.address.state} – {order.address.pincode}
                    </p>
                  </div>
                )}

                {/* Cart Items */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Items
                  </p>
                  <div className="space-y-2">
                    {order.cart?.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm border-b border-gray-100 pb-1"
                      >
                        <span className="text-gray-700">
                          {item.name} × {item.qty}
                        </span>
                        <span className="text-gray-500">
                          ₹{item.price * item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}