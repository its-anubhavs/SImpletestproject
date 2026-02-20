"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    const q = query(
      collection(db, "users"),
      where("email", "==", email),
      where("password", "==", password)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      alert("Wrong email or password");
      return;
    }

    // ✅ login success
    localStorage.setItem("isAdmin", "true");
    router.push("/admin");
  };

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto mt-20 space-y-4">
      <input
        placeholder="Email"
        className="border p-2 w-full"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        className="border p-2 w-full"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-black text-white w-full py-2">
        Login
      </button>
    </form>
  );
}