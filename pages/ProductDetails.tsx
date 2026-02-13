
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Share2, ShieldCheck, Zap, Cloud, Sparkles, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import { storage } from '../services/storage';
import { Product, Review } from '../types';
import { Button } from '../components/ui/Button';
import { getCategoryColor } from './Storefront';

interface ProductDetailsProps {
  addToCart: (product: Product, weightIdx: number, quantity: number) => void;
}

// Basic Blacklist Filter
const PROFANITY_BLOCKLIST = [
    'shit', 'fuck', 'bitch', 'ass', 'bastard', 'damn', 'hell', 'crap', 
    'piss', 'dick', 'cock', 'pussy', 'slut', 'whore', 'nigger', 'faggot', 
    'cunt', 'retard', 'spic', 'kike', 'chink'
];

export const ProductDetails: React.FC<ProductDetailsProps> = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedWeightIdx, setSelectedWeightIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // Review State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState<{name: string, rating: number, comment: string}>({ name: '', rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const products = storage.getProducts();
    const found = products.find(p => p.id === id);
    if (found) {
        setProduct(found);
        setSelectedWeightIdx(0); // Reset selection on product change
        setQuantity(1);

        // Load Reviews
        const productReviews = storage.getReviews(found.id);
        setReviews(productReviews);

        // SEO: Update Browser Title
        if (found.seo?.title) {
            document.title = found.seo.title;
        } else {
            document.title = `${found.flavor} by ${found.brand} | Billionaire Level`;
        }

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', found.seo?.description || found.description);

        // RECOMMENDATION ENGINE
        const others = products.filter(p => p.id !== found.id && p.isPublished && p.productType === found.productType);
        const scored = others.map(p => {
            let score = 0;
            if (p.category === found.category) score += 4;
            if (p.brand === found.brand) score += 3;
            if (found.productType === 'Cannabis' && found.thcPercentage && p.thcPercentage) {
                if (Math.abs(found.thcPercentage - p.thcPercentage) <= 5) score += 2;
            }
            if (found.strain && p.strain === found.strain) score += 1;
            return { product: p, score };
        });
        scored.sort((a, b) => b.score - a.score);
        setRelatedProducts(scored.slice(0, 3).map(s => s.product));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
        document.title = "Billionaire Level";
    };
  }, [id]);

  // Inject JSON-LD Schema Markup
  useEffect(() => {
    if (!product) return;

    const aggregateRating = reviews.length > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
        "reviewCount": reviews.length
    } : undefined;

    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.flavor,
        "image": product.imageUrl,
        "description": product.description,
        "brand": {
            "@type": "Brand",
            "name": product.brand
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "USD",
            "price": product.weights[0]?.price,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        },
        ...(aggregateRating && { aggregateRating }),
        ...(reviews.length > 0 && {
            "review": reviews.map(r => ({
                "@type": "Review",
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": r.rating,
                    "bestRating": "5"
                },
                "author": {
                    "@type": "Person",
                    "name": r.userName
                },
                "datePublished": new Date(r.timestamp).toISOString().split('T')[0],
                "reviewBody": r.comment
            }))
        })
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
        document.head.removeChild(script);
    };
  }, [product, reviews]);

  const validateContent = (text: string): boolean => {
      const lower = text.toLowerCase();
      // Use word boundaries to avoid false positives (e.g. "classic" containing "ass")
      return PROFANITY_BLOCKLIST.some(word => {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          return regex.test(lower);
      });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
      e.preventDefault();
      setReviewError('');
      
      if (!product || !newReview.name || !newReview.comment) return;

      // Check profanity
      const combinedText = `${newReview.name} ${newReview.comment}`;
      if (validateContent(combinedText)) {
          setReviewError("We keep things classy here. Please remove offensive language.");
          return;
      }

      setIsSubmittingReview(true);

      const review: Review = {
          id: Math.random().toString(36).substr(2, 9),
          productId: product.id,
          userName: newReview.name,
          rating: newReview.rating,
          comment: newReview.comment,
          timestamp: Date.now()
      };

      storage.addReview(review);
      
      // Update local state instantly
      setReviews(prev => [review, ...prev]);
      setNewReview({ name: '', rating: 5, comment: '' });
      setIsSubmittingReview(false);
  };

  if (!product) return <div className="p-20 text-center text-gray-500 animate-pulse">Loading Luxury Experience...</div>;

  const currentVariant = product.weights[selectedWeightIdx];
  const currentPrice = currentVariant.price;
  const currentStock = currentVariant.stock || 0;
  const isVariantOutOfStock = currentStock === 0;

  const handleAdd = () => {
    if (isVariantOutOfStock) return;
    addToCart(product, selectedWeightIdx, quantity);
    navigate('/cart');
  };

  // Calculate Average Rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white transition-colors group">
            <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center mr-2 group-hover:bg-dark-700">
                <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Back</span>
        </button>
        <button className="text-gray-400 hover:text-gold-400 transition-colors">
            <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Image Section */}
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cannabis-500/5 to-gold-500/5 rounded-3xl blur-2xl"></div>
            <div className="bg-dark-900/50 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden aspect-square relative z-10 flex items-center justify-center p-8">
                <img src={product.imageUrl} alt={product.flavor} className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                
                {product.stock === 0 && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                         <span className="border-2 border-red-500 text-red-500 text-xl font-bold px-6 py-2 rounded-xl uppercase tracking-widest transform -rotate-12 bg-black/50">Sold Out</span>
                     </div>
                )}
            </div>
        </div>

        {/* Details Section */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                 <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border ${getCategoryColor(product.category)}`}>
                    {product.category}
                 </span>
                 <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
                 <h2 className="text-gold-500 font-bold text-sm tracking-widest uppercase">{product.brand}</h2>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{product.flavor}</h1>
            
            <div className="flex flex-wrap gap-3 mb-4">
               {product.productType === 'Vape' ? (
                   <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-900/30 text-blue-300 border border-blue-500/30 flex items-center gap-2">
                       <Cloud className="w-3 h-3" />
                       {product.puffCount} Puffs
                   </span>
               ) : (
                   <>
                       <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${
                          product.strain === 'Indica' ? 'bg-purple-900/30 text-purple-300 border-purple-500/30' :
                          product.strain === 'Sativa' ? 'bg-orange-900/30 text-orange-300 border-orange-500/30' :
                          'bg-emerald-900/30 text-emerald-300 border-emerald-500/30'
                       }`}>
                          <Zap className="w-3 h-3" />
                          {product.strain}
                       </span>
                       <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-dark-800 text-cannabis-400 border border-cannabis-500/20 flex items-center gap-2">
                          <ShieldCheck className="w-3 h-3" />
                          {product.thcPercentage}% THC
                       </span>
                   </>
               )}
            </div>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-2 text-sm">
                <div className="flex">
                    {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${averageRating && parseFloat(averageRating) >= star ? 'fill-gold-400 text-gold-400' : 'text-gray-600'}`} />
                    ))}
                </div>
                {reviews.length > 0 ? (
                    <span className="text-gray-400">{averageRating} ({reviews.length} reviews)</span>
                ) : (
                    <span className="text-gray-500 italic">No reviews yet</span>
                )}
            </div>
          </div>

          <div className="bg-dark-900/50 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Experience</h3>
              <p className="text-gray-300 leading-relaxed text-lg font-light">
                {product.description}
              </p>
          </div>

          {/* Weight Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Tier</label>
            <div className="grid grid-cols-3 gap-3">
              {product.weights.map((w, idx) => {
                const stock = w.stock || 0;
                const isSelected = selectedWeightIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedWeightIdx(idx)}
                    disabled={stock === 0}
                    className={`relative border rounded-xl p-4 text-center transition-all duration-300 ${
                      isSelected
                      ? 'border-gold-500 bg-gold-500/10 text-white shadow-[0_0_15px_rgba(251,191,36,0.15)] scale-105 z-10'
                      : stock === 0 
                        ? 'border-gray-800 bg-dark-900/50 text-gray-600 cursor-not-allowed opacity-60'
                        : 'border-gray-700 bg-dark-800 text-gray-400 hover:border-gray-500 hover:bg-dark-700'
                    }`}
                  >
                    <div className={`font-bold text-lg ${isSelected ? 'text-gold-400' : ''}`}>{w.label}</div>
                    <div className="text-sm opacity-80">${w.price}</div>
                    
                    {isSelected && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_8px_#fbbf24]"></div>
                    )}

                    {stock === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-black px-1">Sold Out</span>
                        </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-6 border-t border-gray-800">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-6 bg-dark-900 rounded-xl p-2 border border-gray-800">
                 <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                    disabled={isVariantOutOfStock}
                 >
                    <Minus className="w-4 h-4 text-gray-400" />
                 </button>
                 <span className="font-bold text-xl text-white w-6 text-center">{quantity}</span>
                 <button 
                    onClick={() => setQuantity(Math.min(quantity + 1, currentStock))} 
                    className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                    disabled={isVariantOutOfStock || quantity >= currentStock}
                 >
                    <Plus className="w-4 h-4 text-gray-400" />
                 </button>
               </div>
               <div className="text-right">
                 <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Price</div>
                 <div className="text-3xl font-bold text-white tracking-tight">${currentPrice * quantity}</div>
               </div>
             </div>
            
             <Button 
                fullWidth 
                size="lg" 
                onClick={handleAdd} 
                disabled={isVariantOutOfStock}
                className={`py-4 text-lg font-bold tracking-wide shadow-lg transition-all hover:scale-[1.02] ${isVariantOutOfStock ? 'opacity-50' : 'hover:shadow-cannabis-500/20'}`}
             >
               {isVariantOutOfStock ? 'Currently Unavailable' : 'Add to Stash'}
             </Button>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div className="mt-16 pt-12 border-t border-gray-800/50">
          <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                   <MessageSquare className="w-5 h-5 text-cannabis-500" /> Verified Feedback
               </h3>
               {averageRating && (
                   <div className="flex items-center gap-2 text-gold-400 font-bold bg-dark-900 px-4 py-2 rounded-xl border border-gray-800">
                       <Star className="w-5 h-5 fill-gold-400" /> {averageRating} / 5.0
                   </div>
               )}
          </div>

          <div className="grid md:grid-cols-2 gap-12">
              {/* Review List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {reviews.length === 0 && (
                      <div className="text-center py-12 bg-dark-900/50 rounded-xl border border-gray-800 border-dashed">
                          <p className="text-gray-500">No reviews yet. Be the first to rate this product.</p>
                      </div>
                  )}
                  {reviews.map(r => (
                      <div key={r.id} className="bg-dark-900 p-5 rounded-xl border border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-white">{r.userName}</span>
                              <div className="flex text-gold-400">
                                  {[1,2,3,4,5].map(s => (
                                      <Star key={s} className={`w-3 h-3 ${r.rating >= s ? 'fill-gold-400' : 'text-gray-700 fill-gray-700'}`} />
                                  ))}
                              </div>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed mb-2">"{r.comment}"</p>
                          <p className="text-xs text-gray-600">{new Date(r.timestamp).toLocaleDateString()}</p>
                      </div>
                  ))}
              </div>

              {/* Add Review Form */}
              <div className="bg-dark-900 rounded-2xl p-6 border border-gray-800 h-fit sticky top-24">
                  <h4 className="text-lg font-bold text-white mb-4">Leave a Review</h4>
                  
                  {reviewError && (
                      <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
                          <AlertTriangle className="w-4 h-4" /> {reviewError}
                      </div>
                  )}

                  <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Your Name</label>
                          <input 
                              required
                              type="text" 
                              className="w-full bg-dark-800 border border-gray-700 rounded-lg p-3 text-white focus:border-cannabis-500 outline-none"
                              placeholder="John Doe"
                              value={newReview.name}
                              onChange={e => setNewReview({...newReview, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Rating</label>
                          <div className="flex gap-2">
                              {[1,2,3,4,5].map(star => (
                                  <button
                                      key={star}
                                      type="button"
                                      onClick={() => setNewReview({...newReview, rating: star})}
                                      className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                      <Star className={`w-8 h-8 ${newReview.rating >= star ? 'fill-gold-400 text-gold-400' : 'text-gray-700'}`} />
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 block mb-1">Comment</label>
                          <textarea 
                              required
                              className="w-full bg-dark-800 border border-gray-700 rounded-lg p-3 text-white focus:border-cannabis-500 outline-none h-24 resize-none"
                              placeholder="Tell us about the flavor and effects..."
                              value={newReview.comment}
                              onChange={e => setNewReview({...newReview, comment: e.target.value})}
                          />
                      </div>
                      <Button fullWidth disabled={isSubmittingReview}>
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                          Reviews are public and help others make informed choices.
                      </p>
                  </form>
              </div>
          </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-800/50">
               <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-gold-400" /> You May Also Like
                   </h3>
                   <div className="hidden md:block h-px flex-1 bg-gray-800 ml-6"></div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   {relatedProducts.map(p => (
                       <Link 
                           to={`/product/${p.id}`} 
                           key={p.id} 
                           className="group bg-dark-900 rounded-2xl p-4 border border-gray-800 hover:border-gold-500/30 transition-all hover:-translate-y-1 hover:shadow-xl"
                        >
                           <div className="aspect-square bg-dark-950 rounded-xl mb-4 p-4 relative overflow-hidden flex items-center justify-center">
                               <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors z-10"></div>
                               <img src={p.imageUrl} alt={p.flavor} className="w-full h-full object-contain mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                               
                               {/* Badge overlay */}
                               <div className="absolute top-2 left-2 z-20">
                                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(p.category)}`}>
                                       {p.category}
                                   </span>
                               </div>
                           </div>

                           <div>
                               <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between">
                                   <span>{p.brand}</span>
                                   {p.productType === 'Cannabis' && p.thcPercentage && (
                                       <span className="text-cannabis-400">{p.thcPercentage}% THC</span>
                                   )}
                               </div>
                               <h4 className="font-bold text-white text-base mb-2 truncate group-hover:text-gold-400 transition-colors">{p.flavor}</h4>
                               
                               <div className="flex items-center justify-between border-t border-gray-800 pt-3 mt-3">
                                   <div className="text-sm font-bold text-gray-200">${p.weights[0].price}</div>
                                   <div className="w-6 h-6 rounded-full bg-dark-800 flex items-center justify-center group-hover:bg-cannabis-500 group-hover:text-white transition-colors">
                                       <Plus className="w-3 h-3" />
                                   </div>
                               </div>
                           </div>
                       </Link>
                   ))}
               </div>
          </div>
      )}
    </div>
  );
};
