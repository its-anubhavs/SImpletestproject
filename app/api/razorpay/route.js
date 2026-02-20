// app/api/razorpay/route.js
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  const { amount } = await req.json(); // amount in RUPEES

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // ✅ ONLY HERE multiply
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  });

  return NextResponse.json(order);
}