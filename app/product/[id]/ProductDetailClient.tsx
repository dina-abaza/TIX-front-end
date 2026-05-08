"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Heart,
  Star,
  ChevronDown,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Package,
  Headphones,
  Clock,
  CreditCard,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency, calculateDiscount, t } from "@/utils/helpers";
import ProductCard from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product, VariantGroup, VariantItem } from "@/utils/Types/common";

export default function ProductDetailClient({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<VariantGroup | null>(null);
  const [selectedItem, setSelectedItem] = useState<VariantItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<any[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { state: authState } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${productId}`);
      if (response.data.status) {
        const p = response.data.data;
        console.log(p);
        setProduct(p);
        if (p.groups?.length > 0) {
          setSelectedGroup(p.groups[0]);
          setSelectedItem(p.groups[0].items?.[0] || null);
        }
        fetchRelated(p.category_id || p.category?.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطأ في تحميل المنتج");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async (categoryId?: number) => {
    try {
      const params = categoryId ? `?category_id=${categoryId}&limit=8` : "?limit=8";
      const res = await api.get(`/products${params}`);
      if (res.data.status) {
        const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || [];
        const mapped = data
          .filter((p: any) => String(p.id) !== productId)
          .map((p: any) => ({
            id: String(p.id),
            name: p.name,
            price: p.price_after || p.price,
            originalPrice: p.price_before,
            image: p.images?.[0] || p.image || "/pl1.jpg",
            discount: p.discount || 0,
            rating: p.reviews?.average_rating || 0,
            reviewsCount: p.reviews?.count || 0,
          }));
        setRelatedProducts(mapped.slice(0, 8));
        setComplementaryProducts(mapped.slice(0, 5));
      }
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [productId]);

  const handleAddToCart = async () => {
    /*
    if (!authState.isAuthenticated) {
      toast.info("سجّل الدخول أولاً");
      return;
    }
    */
    try {
      setAddingToCart(true);
      await addToCart(product!.id, quantity, selectedItem?.id || null);
      toast.success("تمت الإضافة للسلة");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "خطأ في الإضافة");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    /*
    if (!authState.isAuthenticated) {
      toast.info("سجّل الدخول أولاً");
      return;
    }
    */
    try {
      await toggleWishlist(product!.id);
      fetchProduct();
    } catch {
      toast.error("خطأ");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authState.isAuthenticated) {
      toast.info("سجّل الدخول أولاً لإضافة تقييم");
      return;
    }
    try {
      setReviewSubmitting(true);
      await api.post(`/products/${productId}/reviews`, {
        rating: reviewRating,
        review: reviewText,
      });
      toast.success("تم حفظ تقييمك");
      setReviewText("");
      fetchProduct();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "تعذّر إرسال التقييم");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const toggleAccordion = (section: string) => {
    setExpandedAccordion(expandedAccordion === section ? null : section);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse" dir="rtl">
        <div className="h-4 bg-gray-200 w-48 mb-6 ml-auto"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[500px] bg-gray-100 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded"></div>
            <div className="h-6 bg-gray-100 w-1/2 rounded"></div>
            <div className="h-10 bg-gray-100 w-1/3 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const currentPrice = selectedItem?.price_after || product.price_after || product.price;
  const originalPrice = selectedItem?.price_before || product.price_before || 0;
  const discountPct = calculateDiscount(originalPrice, currentPrice);
  const images = product.images?.length > 0 ? product.images : ["/pl1.jpg"];
  const rawFeatures = product.features?.length > 0 ? product.features : (product.prod_features || []);
  const featuresList = Array.isArray(rawFeatures) 
    ? rawFeatures.filter(Boolean).map((f: any) => (typeof f === 'string' ? t(f) : t(f.feature || ""))) 
    : [];
  const faqs = Array.isArray(product.faqs) && product.faqs.length > 0 ? product.faqs : (product.qas || []);
  const inStock = product.in_stock !== false && product.quantity !== 0;

  const reviewsObj = typeof product.reviews === "object" && !Array.isArray(product.reviews) ? product.reviews : null;
  const reviewCount = reviewsObj?.count ?? (typeof product.reviews === "number" ? product.reviews : 0);
  const reviewsList = reviewsObj?.data ?? (Array.isArray(product.reviews) ? product.reviews : []);
  const avgRating = reviewsObj?.average_rating != null ? Number(reviewsObj.average_rating) : 0;

  const wishlisted = product.is_fav || isInWishlist(product.id);

  return (
    <div className="flex flex-col min-h-screen bg-white" dir="rtl">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 justify-end">
            <Link href="/" className="hover:text-gray-900">الرئيسية</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link href="/products" className="hover:text-gray-900">{t(product.category.name)}</Link>
                <span>/</span>
              </>
            )}
            <span>{t(product.name)}</span>
          </div>

          {/* Store Info */}
          <div className="mb-2 text-sm text-gray-500 flex items-center gap-1 justify-end">
            <span>يُباع بواسطة:</span>
            <span className="text-red-600 hover:underline font-semibold cursor-pointer">
              {product.vendor?.store_name ? t(product.vendor.store_name) : "متجر TIX"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column - Image Gallery */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="bg-gray-50 rounded-lg overflow-hidden mb-4 flex-shrink-0">
                <div className="w-full aspect-[4/5] lg:aspect-square flex items-center justify-center relative">
                  <Image
                    src={images[selectedImageIdx]}
                    alt={t(product.name)}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 flex-shrink-0">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`border-2 rounded-lg overflow-hidden transition-all aspect-square relative ${
                      selectedImageIdx === idx ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-contain" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div>
              <h1 className="text-2xl font-bold mb-1">{t(product.name)}</h1>

              {/* Brand Display */}
              {product.brand && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500">العلامة التجارية: </span>
                  <span className="text-sm font-bold text-red-600">{product.brand}</span>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
                <Link href="#reviews" className="text-red-600 hover:underline text-sm">
                  ({reviewCount.toLocaleString('ar-EG')} تقييم)
                </Link>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold">{currentPrice.toLocaleString("ar-EG")} ج.م</span>
                {originalPrice > currentPrice && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{originalPrice.toLocaleString("ar-EG")} ج.م</span>
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-bold">-{discountPct}%</span>
                  </>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {t(product.short_description)}
                </p>
              )}

              {/* Stock Status */}
              <div className="mb-6">
                {inStock ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    متوفر في المخزون
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    غير متوفر
                  </div>
                )}
              </div>

              {/* Variants */}
              {product.groups && product.groups.length > 0 && (
                <div className="space-y-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">اللون:</label>
                    <div className="flex gap-3">
                      {product.groups.map((group: VariantGroup, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedGroup(group);
                            setSelectedItem(group.items?.[0] || null);
                          }}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            selectedGroup?.value === group.value ? 'border-black' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: group.meta?.code || "#ddd" }}
                          title={group.value}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedGroup && selectedGroup.items.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold mb-2">الحجم / النوع:</label>
                      <div className="flex gap-2">
                        {selectedGroup.items.map((item: VariantItem) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`px-4 py-2 border-2 rounded font-semibold transition-all ${
                              selectedItem?.id === item.id
                                ? 'bg-black text-white border-black'
                                : 'bg-white border-gray-300 hover:border-black'
                            }`}
                          >
                            {Object.entries(item.attrs).map(([k, v]) => (
                              <span key={k}>{t(v)}</span>
                            ))}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">الكمية:</label>
                <div className="flex items-center gap-2 border border-gray-300 rounded w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 mb-6">
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !inStock}
                  className="w-full bg-black text-white hover:bg-gray-800 h-12 font-bold text-base rounded-lg"
                >
                  {addingToCart ? "جاري الإضافة..." : "اشتري الآن"}
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !inStock}
                  className="w-full bg-white text-black border-2 border-black hover:bg-gray-50 h-12 font-bold text-base rounded-lg flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  أضف للسلة
                </Button>
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-red-600 text-red-600' : 'text-red-600'}`} />
                <span className="text-sm font-semibold">{wishlisted ? 'مضاف للمفضلة' : 'أضف للمفضلة'}</span>
              </button>

              {/* Trust Badges */}
              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold text-sm mb-4">معلومات التوصيل والدفع</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">شحن سريع</p>
                      <p className="text-xs text-gray-500">توصيل خلال 2-5 أيام</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">دفع آمن</p>
                      <p className="text-xs text-gray-500">معاملتك آمنة 100%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">إرجاع سهل</p>
                      <p className="text-xs text-gray-500">خلال 14 يوم</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">طرق الدفع</p>
                      <p className="text-xs text-gray-500">فيزا | محفظة | نقدي</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Highlights & Accordions Wrapper */}
          <div className="max-w-4xl">
            {/* Highlights Section */}
            {(featuresList.length > 0 || product.short_description) && (
              <div className="mb-12 bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-bold mb-4">المميزات الرئيسية</h2>
                {featuresList.length > 0 && (
                  <ul className="space-y-3">
                    {featuresList.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Accordion Sections */}
            <div className="space-y-4 mb-20">
              {/* Description Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleAccordion('description')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-lg">وصف المنتج</h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedAccordion === 'description' ? 'rotate-180' : ''}`} />
                </button>
                {expandedAccordion === 'description' && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {t(product.long_description || product.short_description || "")}
                    </p>
                  </div>
                )}
              </div>

              {/* Reviews Accordion */}
              <div className="border border-gray-200 rounded-lg overflow-hidden" id="reviews">
                <button
                  onClick={() => toggleAccordion('reviews')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    التعليقات والمراجعات ({reviewCount})
                  </h3>
                  <ChevronDown className={`w-5 h-5 transition-transform ${expandedAccordion === 'reviews' ? 'rotate-180' : ''}`} />
                </button>
                {expandedAccordion === 'reviews' && (
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="space-y-6">
                      {reviewsList.map((review: any) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm">{review.user_name || "مستخدم"}</p>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{review.review}</p>
                        </div>
                      ))}

                      <div className="mt-8 p-4 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-bold text-sm mb-4">أضف تقييمك</h4>
                        {authState.isAuthenticated ? (
                          <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setReviewRating(n)} onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}>
                                  <Star className={`w-6 h-6 ${n <= (hoverRating || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="اكتب تعليقك هنا..."
                              className="w-full border border-gray-200 rounded p-3 text-sm min-h-[100px] outline-none focus:border-black"
                            />
                            <Button type="submit" disabled={reviewSubmitting} className="bg-black text-white px-6 py-2 rounded font-bold">
                              {reviewSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
                            </Button>
                          </form>
                        ) : (
                          <p className="text-sm text-gray-500 text-center">يرجى تسجيل الدخول لإضافة تقييم.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Q&A Accordion */}
              {faqs.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion('qa')}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      الأسئلة والأجوبة
                    </h3>
                    <ChevronDown className={`w-5 h-5 transition-transform ${expandedAccordion === 'qa' ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedAccordion === 'qa' && (
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 space-y-4">
                      {faqs.map((faq: any, idx: number) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <p className="font-semibold text-sm mb-2">س: {t(faq.question)}</p>
                          <p className="text-sm text-gray-700">ج: {t(faq.answer)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Complementary Products */}
          {complementaryProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">اشتري معاها في سلة وحدة ووفر</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {complementaryProducts.map((prod) => (
                  <Link key={prod.id} href={`/product/${prod.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                      <div className="relative w-full h-32">
                        <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold line-clamp-2 mb-2">{t(prod.name)}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(prod.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500">({prod.reviewsCount})</span>
                        </div>
                        <p className="text-base font-bold">{prod.price.toLocaleString("ar-EG")} ج.م</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Similar Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">شاهد ايضا هذا قد يعجبك</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedProducts.map((prod) => (
                  <Link key={prod.id} href={`/product/${prod.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-gray-200">
                      <div className="relative w-full h-40">
                        <Image src={prod.image} alt={prod.name} fill className="object-cover" />
                        {prod.discount > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                            -{prod.discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-semibold line-clamp-2 mb-2">{t(prod.name)}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.round(prod.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500">({prod.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold">{prod.price.toLocaleString("ar-EG")} ج.م</p>
                          {prod.originalPrice > prod.price && (
                            <p className="text-xs text-gray-400 line-through">
                              {prod.originalPrice.toLocaleString("ar-EG")} ج.م
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
