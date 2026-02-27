"use client";

import { useState, useRef } from "react";
import { db } from "@/src/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "rishikesh");
    formData.append("folder", "products");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dk7ixmotz/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error("Cloudinary upload failed");
    }

    return data.secure_url;
  };


  const submit = async () => {
    if (!form.title || !form.price || !form.mrp || !form.size) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      let imageUrl = "";

      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

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

      alert(" Product added successfully");

      // RESET FORM
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
      alert("❌ Product add failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Add Product
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Add a new product to your store
          </p>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <input
            placeholder="Product Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          {/* Size & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Size"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm"
            />

            <select
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">None</option>
              <option value="Bestseller">Bestseller</option>
              <option value="New">New</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          {/* Price & MRP */}
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm"
            />
            <input
              placeholder="MRP"
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              className="border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Benefits */}
          <input
            placeholder="Benefits (comma separated)"
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
            className="border rounded-md px-3 py-2 text-sm"
          />

          {/* Image */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-md"
          >
            {loading ? "Uploading..." : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}