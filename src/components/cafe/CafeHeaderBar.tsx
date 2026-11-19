import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChefHat, SlidersHorizontal, Clock } from "lucide-react";
import { Link } from 'react-router-dom';

interface CafeHeaderBarProps {
  onSwitchToClassic?: () => void;
}

export const CafeHeaderBar: React.FC<CafeHeaderBarProps> = ({ onSwitchToClassic }) => {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl shadow-amber-600/15">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30">
          ☕
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              <span>Cafe POS Counter</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/25 border border-white/40">
                ⚡ Live Touch Billing
              </span>
            </h1>
          </div>
          <p className="text-xs text-amber-100 font-medium">
            Tap items to add • Instant mobile customer auto-match • Realtime Kitchen KOT
          </p>
        </div>
      </div>

      {/* Action Pills & Links */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-sm border border-white/20 text-xs font-mono font-bold text-white shadow-inner">
          <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>
            {currentDateTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, {currentDateTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>

        <Link
          to="/kitchen"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-xs font-bold text-white transition-all shadow-sm"
        >
          <ChefHat className="w-4 h-4 text-amber-200" />
          <span>Kitchen Display (KDS) 🍳</span>
        </Link>

        {onSwitchToClassic && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSwitchToClassic}
            className="h-8 text-xs font-bold bg-white text-amber-900 border-none hover:bg-amber-50 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-amber-700" />
            <span>Standard B2B View</span>
          </Button>
        )}
      </div>
    </div>
  );
};
