"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CreditCard,
  Truck,
  ShoppingBag,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/utils/helpers";
import type { ShippingCity, PaymentMethod, CartSummary } from "@/utils/Types/common";

export default function CheckoutPage() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const { refreshCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<string | number>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ address: "", phone: "", order_note: "" });

  // City dropdown
  const [cities, setCities] = useState<ShippingCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<ShippingCity | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const cityRef = useRef<HTMLDivElement>(null);

  // Summary & payment methods
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Auth redirect
  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      window.location.href = "/login?redirect=/checkout";
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  // Fetch initial data
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const fetchData = async () => {
      try {
        const [summaryRes, pmRes, citiesRes] = await Promise.all([
          api.get("/summary"),
          api.get("/payment-methods"),
          api.get("/shipping/cities"),
        ]);

        if (summaryRes.data.status) setSummary(summaryRes.data.data);
        if (pmRes.data.status && Array.isArray(pmRes.data.data)) {
          setPaymentMethods(pmRes.data.data);
          if (pmRes.data.data.length > 0) setPaymentMethod(pmRes.data.data[0].id);
        }
        if (citiesRes.data.status) {
          setCities(Array.isArray(citiesRes.data.data) ? citiesRes.data.data : []);
        }
      } catch {
        toast.error("خطأ في تحميل البيانات");
      }
    };
    fetchData();
  }, [authState.isAuthenticated]);

  // Click outside to close city dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCitySelect = async (city: ShippingCity) => {
    setSelectedCity(city);
    setCityOpen(false);
    setCitySearch("");
    try {
      const fd = new FormData();
      fd.append("vsoft_city_id", String(city.id));
      const res = await api.post("/summary", fd);
      if (res.data.status) setSummary(res.data.data);
    } catch {
      toast.error("خطأ في تطبيق منطقة الشحن");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedCity) {
      toast.error("اختر المدينة");
      return;
    }
    if (formData.phone.length < 10) {
      toast.error("رقم هاتف غير صحيح");
      return;
    }
    if (formData.address.trim().length < 8) {
      toast.error("العنوان يجب أن يكون 8 أحرف على الأقل");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Contact info
      await api.post("/contact", {
        address: formData.address,
        phone: formData.phone,
        order_note: formData.order_note,
      });

      // Step 2: Checkout
      const fd = new FormData();
      fd.append("payment_method_id", String(paymentMethod));
      const checkoutRes = await api.post("/checkout", fd);

      if (checkoutRes.data.status) {
        const { redirect_url } = checkoutRes.data.data || {};
        await refreshCart();

        if (redirect_url && redirect_url.trim()) {
          // Payment gateway redirect
          window.location.href = redirect_url;
        } else {
          // Cash on delivery
          toast.success("تم الطلب بنجاح!");
          setTimeout(() => router.push("/account/orders"), 1500);
        }
      } else {
        toast.error(checkoutRes.data.message || "خطأ في إتمام الطلب");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "حدث خطأ في إتمام الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );

  if (authState.isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      <h1 className="text-xl md:text-2xl font-bold mb-6">إتمام الشراء</h1>

      {/* Steps */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
        {[
          { icon: ShoppingBag, label: "السلة", done: true },
          { icon: MapPin, label: "الشحن", done: true },
          { icon: CreditCard, label: "الدفع", done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                step.done ? "bg-black/10 text-black" : "bg-surface-2 text-text-muted"
              }`}
            >
              {step.done ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <step.icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping */}
            <div className="card p-5">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-black" />
                معلومات الشحن
              </h3>

              {/* City Dropdown */}
              <div className="mb-4" ref={cityRef}>
                <label className="text-sm font-medium mb-1.5 block">المدينة *</label>
                <button
                  type="button"
                  className="input-field flex items-center justify-between !py-3"
                  onClick={() => setCityOpen(!cityOpen)}
                >
                  <span className={selectedCity ? "text-text" : "text-text-faint"}>
                    {selectedCity ? selectedCity.name : "اختر المدينة"}
                  </span>
                  {cityOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {cityOpen && (
                  <div className="mt-1 bg-surface border border-border rounded-xl shadow-card-hover max-h-52 overflow-hidden z-20 relative">
                    <div className="p-2 border-b border-divider">
                      <div className="relative">
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="ابحث عن المدينة..."
                          className="input-field !py-2 pr-3 pl-8 text-sm"
                          autoFocus
                        />
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city.id}
                          type="button"
                          className={`w-full text-right px-4 py-2.5 text-sm hover:bg-surface-2 transition-colors flex justify-between ${
                            selectedCity?.id === city.id ? "bg-gray-100 text-black font-bold" : ""
                          }`}
                          onClick={() => handleCitySelect(city)}
                        >
                          <span>{city.name}</span>
                          <span className="text-text-muted">{formatCurrency(city.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">العنوان *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="العنوان بالتفصيل (8 أحرف على الأقل)"
                  className="input-field"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-1.5 block">رقم الهاتف *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="رقم الهاتف (أرقام فقط)"
                  className="input-field"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">ملاحظات (اختياري)</label>
                <textarea
                  name="order_note"
                  value={formData.order_note}
                  onChange={handleInputChange}
                  placeholder="أي ملاحظات خاصة بالطلب..."
                  className="input-field !py-2"
                  rows={3}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="card p-5">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-black" />
                طريقة الدفع
              </h3>
              <div className="space-y-2.5">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? "border-black bg-gray-50"
                        : "border-border hover:border-text-faint"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="w-4 h-4 text-black accent-black"
                    />
                    <div>
                      <p className="text-sm font-medium">{method.name}</p>
                      {method.description && (
                        <p className="text-xs text-text-muted mt-0.5">{method.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full !py-4 text-base"
              disabled={
                isSubmitting ||
                !selectedCity ||
                !paymentMethod ||
                !formData.address.trim() ||
                !formData.phone.trim()
              }
            >
              {isSubmitting ? "جاري المعالجة..." : "تأكيد الطلب"}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-black" />
              ملخص الطلب
            </h3>

            {summary && (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">المجموع الفرعي</span>
                  <span>{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">الشحن</span>
                  <span>
                    {summary.shipping_zone ? formatCurrency(summary.shipping_zone.price) : "—"}
                  </span>
                </div>
                {summary.shipping_zone?.name && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">المنطقة</span>
                    <span>{summary.shipping_zone.name}</span>
                  </div>
                )}
                {summary.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">الخصم</span>
                    <span className="text-success">-{formatCurrency(summary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-3 border-t border-divider">
                  <span>الإجمالي</span>
                  <span className="text-black">{formatCurrency(summary.total)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-text-muted text-xs mt-4 p-3 bg-surface-2 rounded-xl">
              <Truck className="w-4 h-4 text-black flex-shrink-0" />
              <span>التوصيل خلال 2-5 أيام عمل</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
