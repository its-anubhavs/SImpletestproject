"use client";

import { useState, useRef } from "react";
import { db, storage } from "@/src/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function AddProduct() {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    price: "",
    mrp: "",
    size: "",
    rating: "4.9",
    reviews: "0",
    tag: "",
    benefits: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.title || !form.price || !form.mrp || !form.size) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      let imageUrl = "";

      // ✅ IMAGE UPLOAD
      if (imageFile) {
        const imageRef = ref(
          storage,
          `products/${Date.now()}-${imageFile.name}`,
        );

        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // ✅ SAVE PRODUCT
      await addDoc(collection(db, "products"), {
        title: form.title,
        price: Number(form.price),
        mrp: Number(form.mrp),
        size: form.size,
        rating: Number(form.rating),
        reviews: Number(form.reviews),
        tag: form.tag,
        benefits: form.benefits
          ? form.benefits.split(",").map((b) => b.trim())
          : [],
        imageUrl,
        createdAt: serverTimestamp(),
      });

      alert("✅ Product added successfully");

      // RESET
      setForm({
        title: "",
        price: "",
        mrp: "",
        size: "",
        rating: "4.9",
        reviews: "0",
        tag: "",
        benefits: "",
      });
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("❌ Image upload or product save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
    <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border border-gray-100 p-6">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Add Product
        </h2>
        <p className="text-gray-400 text-xs mt-1">
          Add a new product to your store
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">

        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Product Title
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          />
        </div>

        {/* Size + Tag */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Size
            </label>
            <input
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Tag
            </label>
            <select
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            >
              <option value="">None</option>
              <option value="Bestseller">Bestseller</option>
              <option value="New">New</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Price + MRP */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Price
            </label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              MRP
            </label>
            <input
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>
        </div>

        {/* Rating + Reviews */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Rating
            </label>
            <input
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Reviews
            </label>
            <input
              value={form.reviews}
              onChange={(e) => setForm({ ...form, reviews: e.target.value })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
            />
          </div>
        </div>

        {/* Benefits */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Benefits
          </label>
          <input
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
            placeholder="Comma separated"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none"
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Product Image
          </label>
          <label className="flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-4 cursor-pointer hover:border-emerald-400 transition text-sm text-gray-500">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImageFile(e.target.files[0])}
            />
            <span>⬆</span>
            <span className="truncate max-w-[200px]">
              {imageFile ? imageFile.name : "Upload image"}
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Add Product"}
        </button>

      </div>
    </div>
  </div>
);
}
