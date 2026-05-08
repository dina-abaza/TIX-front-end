"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { formatCurrency } from "@/utils/helpers";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { state: authState } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  useEffect(() => {
    if (!orderId || !authState.isAuthenticated) return;
    async function fetchOrder() {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.status) setOrder(res.data.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId, authState.isAuthenticated]);

  if (loading) return <div className="skeleton h-60 rounded-xl" />;

  if (!order) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg font-bold">الطلب غير موجود</p>
      </div>
    );
  }

  const items = order.items || order.products || [];

  return (
    <div className="space-y-4">
      <Link
        href="/account/orders"
        className="text-sm text-black hover:underline flex items-center gap-1"
      >
        <ArrowRight className="w-4 h-4" />
        العودة للطلبات
      </Link>
      <div className="card p-5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-black" />
          تفاصيل الطلب #{order.id}
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <span className="text-text-muted">الحالة:</span>{" "}
            <span className="font-medium">{order.status}</span>
          </div>
          <div>
            <span className="text-text-muted">الإجمالي:</span>{" "}
            <span className="font-bold text-black">{formatCurrency(order.total || 0)}</span>
          </div>
          <div>
            <span className="text-text-muted">التاريخ:</span>{" "}
            <span>{new Date(order.created_at).toLocaleDateString("ar-EG")}</span>
          </div>
        </div>
        {items.length > 0 && (
          <div className="border-t border-divider pt-4 space-y-3">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <Image
                  src={item.image || item.product?.image || "/pl1.jpg"}
                  alt=""
                  width={50}
                  height={50}
                  className="rounded-lg object-cover w-12 h-12 bg-surface-2"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product_name || item.product?.name}
                  </p>
                  <p className="text-xs text-text-muted">الكمية: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-black">
                  {formatCurrency(item.price || 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
