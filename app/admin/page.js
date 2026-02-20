"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) {
      router.push("/login");
    }
  }, []);

  return (
    <div className="min-h-screen p-10 text-black bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/admin/products" className="bg-white p-6 rounded shadow">
          ➕ Add Product
        </Link>

        <Link href="/admin/coupons" className="bg-white p-6 rounded shadow">
          🎟 Manage Coupons
        </Link>

        <Link href="/admin/orders" className="bg-white p-6 rounded shadow">
          📦 View Orders
        </Link>
      </div>
    </div>
  );
}