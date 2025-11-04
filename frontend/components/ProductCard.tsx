"use client"

import Image from "next/image"
import { ShoppingCart, Star } from "lucide-react"

// Defines the structure of a product object, matching the backend's data model
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url?: string; // URL for the product image, optional
}

// Defines the props expected by the ProductCard component
interface ProductCardProps {
  product: Product; // The product data to display
}

// ProductCard component: Renders a single product item in a card layout
export default function ProductCard({ product }: ProductCardProps) {
  
  // Placeholder function for "Add to Cart" button click
  const handleAddToCart = () => {
    // In a real application, this would dispatch an action to update cart state
    // or make an API call to add the item to a server-side cart.
    alert(`Added ${product.name} to cart! (Demo action)`);
  };

  // Placeholder function for "Buy Now" button click
  const handleBuyNow = () => {
    // In a real application, this would likely redirect to a checkout page
    // or initiate a purchase flow.
    alert(`Proceeding to checkout for ${product.name}. (Demo action)`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden group">
      <div className="relative aspect-w-4 aspect-h-3 sm:aspect-h-3 bg-gray-100 overflow-hidden">
        <Image
          src={product.image_url || `https://placehold.co/600x400/e2e8f0/94a3b8?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
          <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full ml-2 whitespace-nowrap mt-0.5">
            {product.category}
          </span>
        </div>

        <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2 flex-grow">{product.description}</p>

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {/* Static star rating for demonstration */}
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${i < 4 ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-300"}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400 ml-1.5">(120 reviews)</span> {/* Placeholder review count */}
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xl sm:text-2xl font-bold text-indigo-700">₹{product.price.toLocaleString()}</span>
          {/* Example of showing a discounted price, can be removed if not needed */}
          <span className="text-xs text-gray-400 line-through">₹{Math.round(product.price * 1.2).toLocaleString()}</span>
        </div>
        
        {/* Action buttons container, pushed to the bottom of the card */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-all duration-150 ease-in-out text-xs sm:text-sm font-semibold flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-150 ease-in-out text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
