"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, Tag, Package, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartSummary } from "@/utils/Types/common";

export default function CartPage() {
  const { state, removeFromCart, updateQuantity, refreshCart } = useCart();
  const { state: authState } = useAuth();
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      window.location.href = "/login?redirect=/cart";
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const res = await api.get("/summary");
      if (res.data.status && res.data.data) {
        setSummary(res.data.data);
      }
    } catch {
      // Silent
    }
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      refreshCart();
      fetchSummary();
    }
  }, [authState.isAuthenticated]);

  const handleRemove = async (id: number | string) => {
    await removeFromCart(id);
    toast.success("تم الحذف من السلة");
    fetchSummary();
  };

  const handleUpdateQty = async (id: number | string, newQty: number) => {
    await updateQuantity(id, newQty);
    fetchSummary();
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplying(true);
    setCouponError("");
    try {
      const formData = new FormData();
      formData.append("coupon", couponCode.trim().toUpperCase());
      const res = await api.post("/summary", formData);
      if (res.data.status || res.data.success) {
        setSummary(res.data.data);
        toast.success(res.data.message || "تم تطبيق الكوبون");
      } else {
        setCouponError(res.data.message || "كوبون غير صالح");
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.message || "حدث خطأ");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!summary?.coupon?.code) return;
    setIsApplying(true);
    try {
      const res = await api.delete("/coupon", { data: { coupon: summary.coupon.code } });
      if (res.data.status || res.data.success) {
        setCouponCode("");
        fetchSummary();
        toast.success("تم حذف الكوبون");
      }
    } catch {
      toast.error("خطأ في حذف الكوبون");
    } finally {
      setIsApplying(false);
    }
  };

  if (authState.isLoading || state.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          سلتك ({state.items.length} منتج)
        </h1>

        <AnimatePresence mode="wait">
          {state.items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">سلتك فارغة</h2>
              <p className="text-gray-500 mb-6">لم تقم بإضافة أي منتجات لسلتك بعد</p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90 text-white px-8 h-11 rounded-lg">
                  استكشف المتجر
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {state.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4 transition-all hover:shadow-md"
                  >
                    <Link href={`/product/${item.productId}`} className="flex-shrink-0">
                      <Image
                        src={item.image || "/pl1.jpg"}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="w-24 h-24 object-cover rounded-lg bg-gray-50"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <Link href={`/product/${item.productId}`}>
                          <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        {item.selections && item.selections.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.selections.map((s, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                              >
                                {s.variant}: {s.value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm font-bold text-gray-900 mt-1">
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="mr-auto text-red-500 hover:text-red-600 transition-colors p-1"
                          aria-label="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="font-bold text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">ملخص الطلب</h2>

                  {/* Pricing Details */}
                  {summary && (
                    <div className="space-y-4 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">السعر الفرعي</span>
                        <span className="font-bold text-gray-900">{formatCurrency(summary.subtotal)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">التوصيل</span>
                        <span className="font-bold text-gray-900">
                          {summary.shipping_zone?.price === 0 ? 'مجاني' : formatCurrency(summary.shipping_zone?.price || 0)}
                        </span>
                      </div>

                      {summary.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>الخصم</span>
                          <span className="font-bold">-{formatCurrency(summary.discount)}</span>
                        </div>
                      )}

                      {/* Coupon Section */}
                      <div className="flex gap-2 pt-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="رمز الخصم"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              setCouponError("");
                            }}
                            className="text-sm h-10 pr-3"
                          />
                          {couponCode && (
                            <button
                              onClick={() => {
                                setCouponCode("");
                                setCouponError("");
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={isApplying || !couponCode.trim()}
                          className="h-10 px-4 font-bold border-gray-200"
                        >
                          {isApplying ? "..." : "تطبيق"}
                        </Button>
                      </div>
                      {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}

                      <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-4 mt-2 text-gray-900">
                        <span>الإجمالي</span>
                        <span className="text-gray-900">{formatCurrency(summary.total)}</span>
                      </div>
                    </div>
                  )}

                  <Link href="/checkout" className="block pt-2">
                    <Button className="w-full h-11 bg-black hover:bg-gray-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
                      المتابعة للدفع
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
