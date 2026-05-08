import type { Metadata } from "next";
import HeroBanner from "@/components/HeroBanner";
import CategoryBar from "@/components/CategoryBar";
import FlashDeals from "@/components/FlashDeals";
import BrandLogos from "@/components/BrandLogos";
import ProductCard from "@/components/ProductCard";
import Features from "@/components/Features";
import Link from "next/link";
import type { CategoryNavItem } from "@/utils/Types/navigation";
import type { ProductCardProps } from "@/utils/Types/products";

export const metadata: Metadata = {
  title: "TIX - تسوق أفضل المنتجات بأفضل الأسعار",
  description: "منصة TIX للتجارة الإلكترونية في مصر - ملابس، إلكترونيات، مستحضرات تجميل",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin.tix-eg.com";

async function fetchProducts(): Promise<ProductCardProps[]> {
  try {
    const res = await fetch(`${API_URL}/api/products?limit=10`, {
      next: { revalidate: 600 },
      headers: { "Accept-Language": "ar", Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.data) ? data.data : data.data?.data || [];
    return products.map(
      (p: any): ProductCardProps => ({
        id: String(p.id),
        name: p.name,
        price: p.price_after || p.price,
        originalPrice: p.price_before,
        image: p.images?.[0] || "/pl1.jpg",
        rating: p.reviews?.average_rating || 0,
        reviewsCount: p.reviews?.count || 0,
        discount: p.discount || 0,
      }),
    );
  } catch {
    return [];
  }
}

async function fetchCategoryProducts(
  categoryId: string | number,
  limit: number = 5,
): Promise<ProductCardProps[]> {
  try {
    const res = await fetch(`${API_URL}/api/products?category_id=${categoryId}&limit=${limit}`, {
      next: { revalidate: 600 },
      headers: { "Accept-Language": "ar", Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.data) ? data.data : data.data?.data || [];
    return products.map(
      (p: any): ProductCardProps => ({
        id: String(p.id),
        name: p.name,
        price: p.price_after || p.price,
        originalPrice: p.price_before,
        image: p.images?.[0] || "/pl1.jpg",
        rating: p.reviews?.average_rating || 0,
        reviewsCount: p.reviews?.count || 0,
        discount: p.discount || 0,
      }),
    );
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<CategoryNavItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`, {
      next: { revalidate: 600 },
      headers: { "Accept-Language": "ar", Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data)
      ? data.data.slice(0, 4).map((cat: any) => ({
          id: String(cat.id),
          name: typeof cat.name === "object" ? cat.name?.ar || cat.name?.en || "" : cat.name,
          slug: String(cat.id),
        }))
      : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);

  // Fetch products for each category showcase
  const categoryShowcases = await Promise.all(
    categories.map(async (cat) => ({
      id: cat.id,
      name: cat.name,
      products: await fetchCategoryProducts(cat.id, 5),
    })),
  );

  return (
    <div className="min-h-screen bg-white">
      {/* 1) Hero */}
      <HeroBanner />

      {/* 2) Category Nav */}
      <CategoryBar />

      {/* 3) Flash Deals */}
      <FlashDeals />

      {/* 4) Latest Products */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">أحدث المنتجات</h2>
          <Link
            href="/products"
            className="text-red-600 font-bold hover:underline"
          >
            عرض الكل ←
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* 5) Category Showcases */}
      {categoryShowcases
        .filter((c) => c.products.length > 0)
        .map((cat) => (
          <section
            key={cat.id}
            className="container mx-auto px-4 py-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{cat.name}</h2>
              <Link
                href={`/products?category=${cat.id}`}
                className="text-red-600 font-bold hover:underline"
              >
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {cat.products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </section>
        ))}

      {/* 6) Brand Logos */}
      <BrandLogos />

      {/* 7) Features */}
      <Features />
    </div>
  );
}
