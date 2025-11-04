"use client"

import Image from "next/image"

interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  image_url?: string
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-200 ease-in-out flex flex-col">
      <div className="relative w-full h-48">
        <Image
          src={product.image_url || "/placeholder.png"}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-gray-800 truncate" title={product.name}>
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        <div className="mt-auto pt-2">
          <p className="text-lg font-bold text-indigo-600">
            ₹{product.price.toLocaleString("en-IN")}
          </p>
          <button className="mt-2 w-full bg-indigo-500 text-white text-sm font-medium py-2 rounded-md hover:bg-indigo-600 transition-colors duration-200">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}