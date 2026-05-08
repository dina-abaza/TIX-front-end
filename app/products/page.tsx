"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ChevronDown,
  Grid3X3,
  List,
  Filter,
  X,
  Search,
  RotateCcw
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/utils/helpers";
import type { CategoryNavItem } from "@/utils/Types/navigation";
import type { ProductCardProps } from "@/utils/Types/products";

// Compact Checkbox Component
const Checkbox = ({ checked, onCheckedChange, id }: { checked: boolean, onCheckedChange: () => void, id?: string }) => (
  <div
    onClick={onCheckedChange}
    className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all ${checked ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300 hover:border-red-600'
      }`}
  >
    {checked && <div className="w-2 h-2 bg-white rounded-full" />}
  </div>
);

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("q");

  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [categories, setCategories] = useState<CategoryNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [minPrice, setMinPrice] = useState<string>("0");
  const [maxPrice, setMaxPrice] = useState<string>("50000");
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get("/categories");
        if (res.data.status) {
          setCategories(
            Array.isArray(res.data.data)
              ? res.data.data.map((cat: any) => ({
                id: String(cat.id),
                name: typeof cat.name === "object" ? cat.name?.ar || cat.name?.en || "" : cat.name,
                slug: String(cat.id),
              }))
              : [],
          );
        }
      } catch { }
    }
    fetchCategories();
  }, []);

  // Debounce price changes to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = parseInt(minPrice);
      const max = parseInt(maxPrice);
      setPriceRange([isNaN(min) ? 0 : min, isNaN(max) ? 50000 : max]);
    }, 500);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  // Fetch Products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let url = "/products?limit=40";
        if (selectedCategory) url += `&category_id=${selectedCategory}`;
        if (searchParam) url += `&search=${encodeURIComponent(searchParam)}`;

        const minP = priceRange[0];
        const maxP = priceRange[1];

        if (minP > 0) url += `&min_price=${minP}`;
        if (maxP < 50000) url += `&max_price=${maxP}`;

        if (sortBy === "price_low") url += "&sort=price&direction=asc";
        if (sortBy === "price_high") url += "&sort=price&direction=desc";
        if (sortBy === "rating") url += "&sort=rating&direction=desc";

        const res = await api.get(url);
        if (res.data.status) {
          const data = Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || [];
          
          let mapped = data.map((p: any): ProductCardProps => ({
            id: String(p.id),
            name: p.name,
            price: p.price_after || p.price,
            originalPrice: p.price_before,
            image: p.images?.[0] || p.image || "/pl1.jpg",
            discount: p.discount || 0,
            rating: p.reviews?.average_rating || 0,
            reviewsCount: p.reviews?.count || 0,
          }));

          // Client-side filtering as a fallback
          mapped = mapped.filter((p: any) => p.price >= minP && p.price <= maxP);

          if (selectedRatings.length > 0) {
            mapped = mapped.filter((p: any) => selectedRatings.some(r => p.rating >= r));
          }

          setProducts(mapped);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory, sortBy, searchParam, priceRange, selectedRatings]);

  const handleRatingChange = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
    // Close filter on mobile to show results
    if (window.innerWidth < 1024) {
      setFiltersOpen(false);
    }
  };

  const resetFilters = () => {
    setMinPrice("0");
    setMaxPrice("50000");
    setPriceRange([0, 50000]);
    setSelectedRatings([]);
    setSelectedCategory("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]" dir="rtl">
      <main className="flex-1 pt-16 md:pt-0">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/" className="hover:text-red-600">الرئيسية</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">المنتجات</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {searchParam ? `نتائج البحث عن: "${searchParam}"` : "تسوق جميع المنتجات"}
            </h1>
            <p className="text-gray-500 mt-1">
              {products.length} منتج متاح
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar Filters */}
            <aside className={`lg:w-72 flex-shrink-0 ${filtersOpen ? 'fixed inset-0 z-[1100] bg-white p-4 pt-24 sm:p-6 sm:pt-28 overflow-y-auto lg:static lg:bg-transparent lg:p-0' : 'hidden lg:block'}`}>
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="flex items-center justify-between mb-4 lg:mb-0">
                  <h3 className="font-bold text-lg">تصفية النتائج</h3>
                  <button onClick={() => setFiltersOpen(false)} className="lg:hidden p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="font-bold text-sm mb-4">الأقسام</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCategory("");
                        setFiltersOpen(false);
                      }}
                      className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-all ${!selectedCategory ? "bg-gray-100 text-black font-bold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      الكل
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(String(cat.id));
                          if (window.innerWidth < 1024) setFiltersOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 text-sm rounded-lg transition-all ${selectedCategory === String(cat.id) ? "bg-gray-100 text-black font-bold" : "text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="font-bold text-sm mb-4">نطاق السعر</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 block mb-1">من</label>
                        <Input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="h-9 text-sm focus-visible:ring-black focus-visible:border-black"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 block mb-1">إلى</label>
                        <Input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="h-9 text-sm focus-visible:ring-black focus-visible:border-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ratings */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h4 className="font-bold text-sm mb-4">التقييم</h4>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                        <Checkbox
                          checked={selectedRatings.includes(rating)}
                          onCheckedChange={() => handleRatingChange(rating)}
                        />
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 group-hover:text-gray-900 transition-colors">فما فوق</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reset Button */}
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 h-11 rounded-xl"
                >
                  <RotateCcw className="w-4 h-4 ml-2" />
                  إعادة تعيين الفلاتر
                </Button>
              </div>
            </aside>

            {/* Products Main Section */}
            <div className="flex-1">
              {/* Sort & View Options Bar */}
              <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                  <span className="text-sm text-gray-500 hidden sm:inline">الترتيب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm font-semibold border-none bg-transparent focus:ring-0 cursor-pointer outline-none w-full sm:w-auto"
                  >
                    <option value="newest">الأحدث أولاً</option>
                    <option value="price_low">السعر: من الأقل</option>
                    <option value="price_high">السعر: من الأعلى</option>
                    <option value="rating">الأعلى تقييماً</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 sm:border-r sm:pr-4 sm:mr-2">
                  <button
                    onClick={() => setViewType('grid')}
                    className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewType('list')}
                    className={`p-2 rounded-lg transition-all ${viewType === 'list' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setFiltersOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className={`grid ${viewType === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className={`bg-white rounded-xl border border-gray-200 p-4 animate-pulse ${viewType === 'list' ? 'flex gap-4' : ''}`}>
                      <div className={`${viewType === 'list' ? 'w-48 h-40' : 'w-full aspect-[4/5] lg:aspect-square'} bg-gray-100 rounded-lg`} />
                      <div className="flex-1 mt-4">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                /* Products Grid/List */
                <div className={`grid ${viewType === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-3 sm:gap-4`}>
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className={`group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 relative flex flex-col h-full ${viewType === 'list' ? 'sm:flex-row sm:items-center gap-4 sm:gap-6' : ''
                        }`}
                    >
                      {/* Image */}
                      <div className={`relative overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center ${viewType === 'list' ? 'w-48 h-48 sm:w-60 sm:h-60' : 'w-full aspect-[4/5] lg:aspect-square'}`}>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain transition-transform duration-500"
                        />
                        {(product.discount ?? 0) > 0 && (
                          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg z-10">
                            {product.discount}%-
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col group-hover:bg-black/[0.02] transition-colors duration-300">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-800 line-clamp-2 mb-2 transition-colors h-10 overflow-hidden">
                            {t(product.name)}
                          </h3>
                          <div className="flex items-center gap-1 mb-3">
                            <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < Math.round(product.rating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                            <span className="text-[10px] text-gray-400">({product.reviewsCount})</span>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900">{product.price.toLocaleString("ar-EG")} ج.م</span>
                            {(product.originalPrice ?? 0) > product.price && (
                              <span className="text-sm text-gray-400 line-through">
                                {(product.originalPrice ?? 0).toLocaleString("ar-EG")}
                              </span>
                            )}
                          </div>
                          <Button className="w-full mt-3 bg-gray-900 text-white hover:bg-black rounded-lg h-9 text-xs transition-colors">
                            عرض التفاصيل
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">عذراً، لم نجد أي منتجات</h3>
                  <p className="text-gray-500 mb-8">حاول تغيير الفلاتر أو البحث عن شيء آخر</p>
                  <Button onClick={resetFilters} className="bg-red-600 text-white hover:bg-red-700">
                    إعادة تعيين كافة الفلاتر
                  </Button>
                </div>
              )}

              {/* Pagination Placeholder (matches style) */}
              {products.length > 0 && !loading && (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-10 sm:mt-12 pb-8 sm:pb-10">
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50">
                    <ChevronDown className="w-5 h-5 rotate-90" />
                  </button>
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-200">1</button>
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 font-bold hover:bg-gray-50">2</button>
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 font-bold hover:bg-gray-50">3</button>
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                    <ChevronDown className="w-5 h-5 -rotate-90" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-96 bg-gray-100 rounded-3xl" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
