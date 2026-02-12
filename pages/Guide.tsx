import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Moon, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Guide: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white pb-20">
      {/* Header */}
      <div className="bg-dark-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Store</span>
          </Link>
          <span className="font-bold tracking-widest uppercase text-xs text-cannabis-500">The Concierge Series</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto drop-shadow-2xl">
            <img src="/logo.png" alt="Billionaire Level" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            The Art of Elevation
          </h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            A gentleman's guide to consuming cannabis with intent, style, and responsibility.
          </p>
        </div>

        {/* Section 1: Edibles */}
        <section className="bg-dark-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Moon className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">01</span>
              Edibles: The Slow Burn
            </h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                <strong className="text-white">Start Low, Go Slow.</strong> Unlike inhalation, edibles are processed by the liver, creating a more potent and longer-lasting effect (11-hydroxy-THC).
              </p>
              <ul className="space-y-2 border-l-2 border-purple-500/30 pl-4 my-4">
                <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> <strong>Onset:</strong> 30 minutes to 2 hours.</li>
                <li className="flex items-center gap-2"><div className="w-4 h-4 flex items-center justify-center"><div className="w-3 h-3 border-2 border-purple-400 rounded-full" /></div> <strong>Duration:</strong> 4 to 8 hours.</li>
              </ul>
              <p className="text-sm bg-dark-950/50 p-4 rounded-xl border border-gray-700">
                <span className="text-purple-400 font-bold">Pro Tip:</span> Do not re-dose within the first 90 minutes, even if you "don't feel anything yet." Patience is the ultimate luxury.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Inhalation */}
        <section className="bg-dark-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm">02</span>
              Flower & Vapes
            </h2>
             <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                The classic method. Effects are almost immediate, allowing for easier titration of your experience.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-dark-800 p-4 rounded-xl">
                    <h3 className="font-bold text-white mb-1">Indica</h3>
                    <p className="text-sm">"In-da-couch". Best for relaxation, sleep, and unwinding after a high-stakes day.</p>
                </div>
                <div className="bg-dark-800 p-4 rounded-xl">
                    <h3 className="font-bold text-white mb-1">Sativa</h3>
                    <p className="text-sm">Cerebral and uplifting. Ideal for creative endeavors and social gatherings.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Storage */}
        <section className="bg-dark-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm">03</span>
              Preserving Quality
            </h2>
             <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Terpenes are volatile. To maintain the "Billionaire Level" quality of your purchase, storage is key.
              </p>
              <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Keep away from direct sunlight (UV degrades THC).</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Store in a cool, dark place (60-70°F).</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Use air-tight glass jars to maintain humidity.</span>
                  </div>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center pt-8">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Ascend?</h3>
            <Link to="/">
                <Button size="lg" className="px-12">Shop Collection</Button>
            </Link>
        </div>
      </div>
    </div>
  );
};