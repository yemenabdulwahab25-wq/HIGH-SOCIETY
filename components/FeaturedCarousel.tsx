
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';
import { Product } from '../types';
import { getCategoryColor } from '../pages/Storefront';

interface FeaturedCarouselProps {
  products: Product[];
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (products.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide(); // Swipe Left
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevSlide(); // Swipe Right
    }
  };

  if (products.length === 0) return null;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-3xl bg-dark-900 border border-gray-800 shadow-2xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex transition-transform duration-700 ease-in-out h-[400px] md:h-[350px]"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-full h-full relative flex-shrink-0">
             {/* Background Blur Effect */}
             <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                 <img src={product.imageUrl} className="w-full h-full object-cover blur-2xl scale-110" />
                 <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-900/50 to-transparent"></div>
             </div>

             <div className="relative z-10 flex flex-col md:flex-row items-center h-full p-6 md:p-12 gap-8">
                {/* Product Image */}
                <div className="w-1/2 md:w-1/3 h-48 md:h-full flex items-center justify-center relative">
                    <img 
                        src={product.imageUrl} 
                        alt={product.flavor} 
                        className="max-h-full max-w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-105 duration-500" 
                    />
                    {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/70 text-red-500 font-bold px-4 py-2 rounded-xl border border-red-500/50 uppercase tracking-widest -rotate-12">
                                Sold Out
                            </span>
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                            <Star className="w-3 h-3 fill-gold-400" /> Featured
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getCategoryColor(product.category)}`}>
                            {product.category}
                        </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                        {product.flavor}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base font-light max-w-lg mx-auto md:mx-0 line-clamp-2">
                        {product.description || "Experience premium quality with this top-shelf selection."}
                    </p>

                    <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                        <span className="text-2xl font-bold text-white">${product.weights[0].price}</span>
                        <Link to={`/product/${product.id}`}>
                            <button className="bg-cannabis-600 hover:bg-cannabis-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-cannabis-500/20 flex items-center gap-2">
                                Shop Now <ChevronRight className="w-4 h-4" />
                            </button>
                        </Link>
                    </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {products.length > 1 && (
        <>
            <button 
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 backdrop-blur-md text-white p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </>
      )}

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentIndex === idx 
              ? 'bg-gold-500 w-6' 
              : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
