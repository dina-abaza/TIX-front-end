'use client'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import ProductCard from '@/components/ProductCard'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function WishlistPage() {
  const { items, isLoading, refreshWishlist } = useWishlist()
  const { state: authState } = useAuth()

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      window.location.href = '/login?redirect=/account/wishlist'
    }
  }, [authState.isLoading, authState.isAuthenticated])

  useEffect(() => {
    refreshWishlist()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-72 rounded-xl" />)}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Heart className="w-14 h-14 mx-auto text-red-600 mb-3" />
        <h3 className="text-lg font-bold mb-2">لا توجد عناصر في المفضلة</h3>
        <p className="text-text-muted text-sm mb-4">أضف منتجات للمفضلة لتجدها هنا</p>
        <Link href="/" className="btn-primary inline-block">تصفح المنتجات</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-6 h-6 text-red-600 fill-red-600" />
        <h1 className="text-xl font-bold text-black">قائمة المفضلة</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            name={item.name}
            price={item.price}
            originalPrice={item.originalPrice}
            image={item.image}
            discount={item.discount}
          />
        ))}
      </div>
    </div>
  )
}
