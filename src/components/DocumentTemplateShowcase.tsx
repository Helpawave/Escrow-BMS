import React, { useState } from "react";
import { 
  Quote, 
  QrCode, 
  Receipt, 
  Truck, 
  ClipboardCheck, 
  Check, 
  Maximize2,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const DocumentTemplateShowcase: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return (
    <section className="w-full py-10 sm:py-14 bg-[#FAF7F2] dark:bg-slate-950/60 border-y border-stone-200/70 dark:border-slate-800/60 overflow-hidden">
      
      {/* Top Metrics Row matching Gimbooks reference */}
      <div className="w-full max-w-lg mx-auto px-4 mb-8 sm:mb-12 text-center">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-12 sm:gap-y-8">
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">40 Lakh+</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Downloads</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">1 Crores+</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Invoices Made</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">5000+</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">GST Return</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">7 Lakh+</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">E-way Bills Generated</p>
          </div>
        </div>
      </div>

      {/* 5-Document Panoramic Showcase matching Gimbooks: All 5 visible together without any horizontal scroll */}
      <div className="w-full max-w-[1100px] mx-auto px-1 sm:px-4 md:px-6">
        <div className="w-full flex items-end justify-center gap-1 sm:gap-2.5 md:gap-4 lg:gap-6">
          
          {/* ========================================================= */}
          {/* 1. QUOTATIONS (Far Left)                                  */}
          {/* ========================================================= */}
          <div 
            onClick={() => setSelectedDoc("quotations")}
            className="w-[16%] max-w-[70px] sm:max-w-[155px] md:max-w-[190px] lg:max-w-[215px] flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 select-none shrink-0 sm:shrink"
          >
            {/* Floating Top Badge */}
            <div className="w-5 h-5 sm:w-8 sm:h-8 md:w-11 md:h-11 rounded sm:rounded-xl md:rounded-2xl bg-[#1E293B] text-white flex items-center justify-center shadow-sm sm:shadow-md ring-1 sm:ring-2 md:ring-4 ring-white dark:ring-slate-900 -mb-2.5 sm:-mb-4 md:-mb-5 z-20 transition-transform duration-300 group-hover:scale-110">
              <Quote className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-current" />
            </div>

            {/* Document Card */}
            <div className="w-full bg-white text-slate-900 rounded sm:rounded-xl md:rounded-2xl p-1 sm:p-2 md:p-3 shadow-md sm:shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-200/90 aspect-[1/1.42] flex flex-col justify-between overflow-hidden relative">
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hidden sm:block">
                <Maximize2 className="w-3 h-3" />
              </div>

              {/* Quotation Header */}
              <div>
                <div className="flex items-start justify-between border-b border-slate-100 pb-0.5 sm:pb-1 mb-0.5 sm:mb-1">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded bg-amber-500 text-white flex items-center justify-center font-black text-[5px] sm:text-[8px]">
                      E
                    </div>
                    <div>
                      <p className="font-extrabold text-[4.5px] sm:text-[7.5px] text-slate-800 leading-tight">AGRAWAL</p>
                      <p className="text-[3.5px] sm:text-[6px] text-slate-400 hidden sm:block">Surat</p>
                    </div>
                  </div>
                  <span className="text-[4px] sm:text-[6.5px] font-black uppercase text-amber-700 bg-amber-50 px-0.5 sm:px-1 py-0.2 rounded">
                    QUOTE
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-0.5 text-[4px] sm:text-[6px] bg-slate-50 p-0.5 sm:p-1 rounded mb-0.5 sm:mb-1">
                  <div>
                    <span className="text-slate-400 block text-[3.5px] sm:text-[5px]">Quote:</span>
                    <span className="font-bold text-slate-700">#QT-88</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[3.5px] sm:text-[5px]">Valid:</span>
                    <span className="font-bold text-slate-700">30 Sep</span>
                  </div>
                </div>

                {/* Table representation */}
                <div className="border border-slate-100 rounded overflow-hidden text-[3.5px] sm:text-[6px]">
                  <div className="grid grid-cols-12 bg-slate-100/90 font-bold p-0.5 text-slate-600">
                    <span className="col-span-7 truncate">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Amt</span>
                  </div>
                  <div className="grid grid-cols-12 p-0.5 border-b border-slate-50 text-slate-700">
                    <span className="col-span-7 truncate">Fabric</span>
                    <span className="col-span-2 text-center">50m</span>
                    <span className="col-span-3 text-right font-semibold">22k</span>
                  </div>
                  <div className="grid grid-cols-12 p-0.5 text-slate-700">
                    <span className="col-span-7 truncate">Silk</span>
                    <span className="col-span-2 text-center">20p</span>
                    <span className="col-span-3 text-right font-semibold">36k</span>
                  </div>
                </div>
              </div>

              {/* Bottom Totals */}
              <div className="pt-0.5 sm:pt-1 border-t border-slate-100 text-[4px] sm:text-[6px]">
                <div className="flex justify-between items-center bg-amber-50 border border-amber-200/80 p-0.5 rounded font-black text-[4.5px] sm:text-[7.5px] text-amber-900">
                  <span>Total:</span>
                  <span>₹1,02,070</span>
                </div>
              </div>
            </div>

            {/* Label Underneath */}
            <span className="font-bold sm:font-black text-slate-800 dark:text-slate-200 text-[7px] sm:text-xs md:text-sm lg:text-base mt-1 sm:mt-2.5 text-center tracking-tight truncate w-full">
              Quotations
            </span>
          </div>

          {/* ========================================================= */}
          {/* 2. E-INVOICES (Left-Center)                                */}
          {/* ========================================================= */}
          <div 
            onClick={() => setSelectedDoc("einvoices")}
            className="w-[17%] max-w-[76px] sm:max-w-[168px] md:max-w-[200px] lg:max-w-[225px] flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 select-none shrink-0 sm:shrink"
          >
            {/* Floating Top Badge */}
            <div className="w-5 h-5 sm:w-8 sm:h-8 md:w-11 md:h-11 rounded sm:rounded-xl md:rounded-2xl bg-[#E75A4D] text-white flex items-center justify-center shadow-sm sm:shadow-md ring-1 sm:ring-2 md:ring-4 ring-white dark:ring-slate-900 -mb-2.5 sm:-mb-4 md:-mb-5 z-20 transition-transform duration-300 group-hover:scale-110">
              <QrCode className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>

            {/* Document Card */}
            <div className="w-full bg-white text-slate-900 rounded sm:rounded-xl md:rounded-2xl p-1 sm:p-2 md:p-3 shadow-md sm:shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-200/90 aspect-[1/1.42] flex flex-col justify-between overflow-hidden relative">
              <div>
                {/* E-Invoice Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-0.5 sm:pb-1 mb-0.5 sm:mb-1">
                  <div>
                    <p className="font-black text-[4.5px] sm:text-[8px] text-slate-900 leading-tight">AGRAWAL</p>
                    <span className="inline-block text-[4px] sm:text-[6px] font-extrabold uppercase bg-rose-50 text-rose-600 px-0.5 py-0.2 rounded mt-0.5">
                      e-INV
                    </span>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-6 sm:h-6 bg-slate-900 p-0.5 rounded flex items-center justify-center shrink-0">
                    <QrCode className="w-full h-full text-white" />
                  </div>
                </div>

                {/* IRN */}
                <div className="bg-slate-50 p-0.5 rounded text-[3.5px] sm:text-[5.5px] text-slate-500 mb-0.5 sm:mb-1">
                  <div className="truncate"><span className="font-bold text-slate-700">IRN:</span> 84ab9c...</div>
                  <div className="hidden sm:block">15-09-2024</div>
                </div>

                {/* Items */}
                <div className="border border-slate-100 rounded text-[3.5px] sm:text-[5.5px]">
                  <div className="grid grid-cols-12 bg-blue-50 font-bold p-0.5 text-blue-900">
                    <span className="col-span-7">Item</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Amt</span>
                  </div>
                  <div className="grid grid-cols-12 p-0.5 border-b border-slate-50 text-slate-700">
                    <span className="col-span-7 truncate">Valve</span>
                    <span className="col-span-2 text-center">8</span>
                    <span className="col-span-3 text-right font-semibold">32k</span>
                  </div>
                  <div className="grid grid-cols-12 p-0.5 text-slate-700">
                    <span className="col-span-7 truncate">Flange</span>
                    <span className="col-span-2 text-center">25</span>
                    <span className="col-span-3 text-right font-semibold">14k</span>
                  </div>
                </div>
              </div>

              {/* Bottom Totals */}
              <div className="pt-0.5 sm:pt-1 border-t border-slate-100 text-[4px] sm:text-[6px]">
                <div className="flex justify-between items-center font-black text-[4.5px] sm:text-[7.5px] bg-slate-100 p-0.5 rounded text-slate-900">
                  <span>Total:</span>
                  <span>₹54,870</span>
                </div>
              </div>
            </div>

            {/* Label Underneath */}
            <span className="font-bold sm:font-black text-slate-800 dark:text-slate-200 text-[7px] sm:text-xs md:text-sm lg:text-base mt-1 sm:mt-2.5 text-center tracking-tight truncate w-full">
              e-Invoices
            </span>
          </div>

          {/* ========================================================= */}
          {/* 3. INVOICES (CENTER HERO - SMARTPHONE FRAME)               */}
          {/* ========================================================= */}
          <div 
            onClick={() => setSelectedDoc("invoices")}
            className="w-[24%] max-w-[110px] sm:max-w-[220px] md:max-w-[255px] lg:max-w-[280px] flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-2 z-10 select-none shrink-0 sm:shrink"
          >
            {/* Floating Amber Badge Above Phone */}
            <div className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md sm:rounded-xl md:rounded-2xl bg-[#F2B93B] text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/25 ring-1.5 sm:ring-2 md:ring-4 ring-white dark:ring-slate-900 -mb-3 sm:-mb-5 md:-mb-6 z-30 transition-transform duration-300 group-hover:scale-110">
              <Receipt className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 stroke-[2.2]" />
            </div>

            {/* Sleek Smartphone Mockup Chassis */}
            <div className="w-full bg-[#18181B] rounded-[14px] sm:rounded-[28px] md:rounded-[40px] p-1 sm:p-2 md:p-2.5 shadow-xl sm:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/20 relative flex flex-col aspect-[1/1.82] overflow-hidden">
              {/* Camera Notch */}
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-black rounded-full mx-auto mb-0.5 sm:mb-1 border border-zinc-800 shadow-inner z-20" />

              {/* Inner Screen Displaying Invoice */}
              <div className="w-full bg-white text-slate-900 rounded-[10px] sm:rounded-[20px] md:rounded-[32px] overflow-hidden p-1 sm:p-2 md:p-2.5 flex-1 flex flex-col justify-between shadow-inner border border-slate-100">
                <div>
                  <div className="flex items-center justify-between pb-0.5 sm:pb-1 mb-0.5 sm:mb-1 border-b border-slate-100">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded bg-amber-500 text-slate-950 flex items-center justify-center font-black text-[5px] sm:text-[8px]">
                        ₹
                      </div>
                      <div>
                        <p className="font-extrabold text-[5px] sm:text-[8px] text-slate-900 leading-tight">AGRAWAL</p>
                        <p className="text-[3.5px] sm:text-[5.5px] text-slate-400 hidden sm:block">TRADELINK</p>
                      </div>
                    </div>
                    <span className="text-[4px] sm:text-[6.5px] font-black uppercase text-blue-700 bg-blue-50 px-0.5 sm:px-1 py-0.2 rounded">
                      TAX INV
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-0.5 text-[4px] sm:text-[6px] bg-slate-50 p-0.5 sm:p-1 rounded mb-0.5 sm:mb-1">
                    <div>
                      <span className="text-slate-400 block text-[3.5px]">Inv:</span>
                      <span className="font-bold text-slate-800">#001</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[3.5px]">Date:</span>
                      <span className="font-bold text-slate-800">15 Sep</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="border border-slate-150 rounded overflow-hidden text-[3.5px] sm:text-[5.5px] mb-0.5 sm:mb-1">
                    <div className="grid grid-cols-12 bg-blue-50 font-black p-0.5 text-blue-900">
                      <span className="col-span-6">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-4 text-right">Total</span>
                    </div>
                    <div className="grid grid-cols-12 p-0.5 border-b border-slate-50 text-slate-800">
                      <span className="col-span-6 truncate font-medium">Tooling</span>
                      <span className="col-span-2 text-center">4</span>
                      <span className="col-span-4 text-right font-bold">50k</span>
                    </div>
                    <div className="grid grid-cols-12 p-0.5 border-b border-slate-50 text-slate-800">
                      <span className="col-span-6 truncate font-medium">Bearing</span>
                      <span className="col-span-2 text-center">10</span>
                      <span className="col-span-4 text-right font-bold">38k</span>
                    </div>
                    <div className="grid grid-cols-12 p-0.5 text-slate-800">
                      <span className="col-span-6 truncate font-medium">Mills</span>
                      <span className="col-span-2 text-center">25</span>
                      <span className="col-span-4 text-right font-bold">30k</span>
                    </div>
                  </div>
                </div>

                {/* Grand Total Highlight */}
                <div className="pt-0.5 text-[4px] sm:text-[6.5px]">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-0.5 sm:p-1.5 rounded flex justify-between items-center font-black">
                    <span className="text-[4.5px] sm:text-[7px] uppercase tracking-wider">Total</span>
                    <span className="text-[5.5px] sm:text-[9.5px]">₹1,39,240</span>
                  </div>

                  <div className="flex justify-between items-end mt-0.5 sm:mt-1 pt-0.5 border-t border-slate-100 text-[3.5px] sm:text-[5px]">
                    <span className="text-slate-400">HDFC</span>
                    <span className="text-blue-900 font-serif italic">A. Agrawal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prominent Golden Invoices Label Underneath */}
            <span className="text-[#E69B14] font-black text-[11px] sm:text-base md:text-lg lg:text-2xl tracking-tight mt-1 sm:mt-2.5 text-center drop-shadow-xs">
              Invoices
            </span>
          </div>

          {/* ========================================================= */}
          {/* 4. E-WAYBILLS (Right-Center)                               */}
          {/* ========================================================= */}
          <div 
            onClick={() => setSelectedDoc("ewaybills")}
            className="w-[17%] max-w-[76px] sm:max-w-[168px] md:max-w-[200px] lg:max-w-[225px] flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 select-none shrink-0 sm:shrink"
          >
            {/* Floating Top Badge */}
            <div className="w-5 h-5 sm:w-8 sm:h-8 md:w-11 md:h-11 rounded sm:rounded-xl md:rounded-2xl bg-[#2E7BE6] text-white flex items-center justify-center shadow-sm sm:shadow-md ring-1 sm:ring-2 md:ring-4 ring-white dark:ring-slate-900 -mb-2.5 sm:-mb-4 md:-mb-5 z-20 transition-transform duration-300 group-hover:scale-110">
              <Truck className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>

            {/* Document Card */}
            <div className="w-full bg-white text-slate-900 rounded sm:rounded-xl md:rounded-2xl p-1 sm:p-2 md:p-3 shadow-md sm:shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-200/90 aspect-[1/1.42] flex flex-col justify-between overflow-hidden relative">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-0.5 sm:pb-1 mb-0.5 sm:mb-1">
                  <div>
                    <span className="text-[4.5px] sm:text-[7.5px] font-black text-slate-900 uppercase tracking-tight block">
                      e-WAY
                    </span>
                    <span className="text-[3.5px] sm:text-[5.5px] font-bold text-slate-500">
                      #1810
                    </span>
                  </div>
                  <div className="w-3.5 h-3.5 sm:w-6 sm:h-6 bg-slate-900 p-0.5 rounded flex items-center justify-center shrink-0">
                    <QrCode className="w-full h-full text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="bg-slate-50 p-0.5 rounded text-[3.5px] sm:text-[5px] space-y-0.5 mb-0.5 sm:mb-1">
                  <div className="flex justify-between text-slate-700">
                    <span>Val: ₹1.39L</span>
                  </div>
                  <div className="text-slate-500 truncate">GJ-05-BX-4921</div>
                </div>
              </div>

              {/* Barcode */}
              <div className="pt-0.5 sm:pt-1 border-t border-slate-100 flex flex-col items-center justify-center">
                <div className="flex items-center gap-[0.5px] h-1.5 sm:h-2">
                  {[2,1,3,1,2,1,1,3,2,1,2,3].map((w, idx) => (
                    <div key={idx} className={`h-full bg-slate-900 ${w === 1 ? 'w-[0.8px]' : w === 2 ? 'w-[1px]' : 'w-[1.2px]'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Label Underneath */}
            <span className="font-bold sm:font-black text-slate-800 dark:text-slate-200 text-[7px] sm:text-xs md:text-sm lg:text-base mt-1 sm:mt-2.5 text-center tracking-tight truncate w-full">
              e-Waybills
            </span>
          </div>

          {/* ========================================================= */}
          {/* 5. DELIVERY CHALLANS (Far Right)                          */}
          {/* ========================================================= */}
          <div 
            onClick={() => setSelectedDoc("challans")}
            className="w-[16%] max-w-[70px] sm:max-w-[155px] md:max-w-[190px] lg:max-w-[215px] flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-1.5 select-none shrink-0 sm:shrink"
          >
            {/* Floating Top Badge */}
            <div className="w-5 h-5 sm:w-8 sm:h-8 md:w-11 md:h-11 rounded sm:rounded-xl md:rounded-2xl bg-[#0B72D9] text-white flex items-center justify-center shadow-sm sm:shadow-md ring-1 sm:ring-2 md:ring-4 ring-white dark:ring-slate-900 -mb-2.5 sm:-mb-4 md:-mb-5 z-20 transition-transform duration-300 group-hover:scale-110">
              <ClipboardCheck className="w-2.5 h-2.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </div>

            {/* Document Card */}
            <div className="w-full bg-white text-slate-900 rounded sm:rounded-xl md:rounded-2xl p-1 sm:p-2 md:p-3 shadow-md sm:shadow-[0_8px_25px_rgba(0,0,0,0.06)] border border-slate-200/90 aspect-[1/1.42] flex flex-col justify-between overflow-hidden relative">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-0.5 sm:pb-1 mb-0.5 sm:mb-1">
                  <div>
                    <p className="font-extrabold text-[4.5px] sm:text-[7.5px] text-slate-800 leading-tight">AGRAWAL</p>
                    <span className="text-[3.5px] sm:text-[5.5px] font-black uppercase text-blue-700 bg-blue-50 px-0.5 py-0.2 rounded">
                      CHALLAN
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-0.5 text-[3.5px] sm:text-[5px] bg-slate-50 p-0.5 rounded mb-0.5 sm:mb-1">
                  <div>
                    <span className="text-slate-400 block text-[3px]">DC:</span>
                    <span className="font-bold text-slate-800">#104</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[3px]">Date:</span>
                    <span className="font-bold text-slate-800">15 Sep</span>
                  </div>
                </div>

                {/* Items */}
                <div className="border border-slate-150 rounded overflow-hidden text-[3.5px] sm:text-[5px]">
                  <div className="grid grid-cols-12 bg-slate-100 font-bold p-0.5 text-slate-600">
                    <span className="col-span-8 truncate">Dispatched</span>
                    <span className="col-span-4 text-right">Qty</span>
                  </div>
                  <div className="grid grid-cols-12 p-0.5 border-b border-slate-50 text-slate-700">
                    <span className="col-span-8 truncate">Hose</span>
                    <span className="col-span-4 text-right font-semibold">12</span>
                  </div>
                  <div className="grid grid-cols-12 p-0.5 text-slate-700">
                    <span className="col-span-8 truncate">Kit</span>
                    <span className="col-span-4 text-right font-semibold">30</span>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="pt-0.5 border-t border-slate-100 text-[3.5px] sm:text-[5px]">
                <div className="flex justify-between items-end">
                  <span className="text-slate-400 uppercase text-[3px]">Stamp</span>
                  <span className="text-blue-900 font-serif italic text-[4px] sm:text-[5.5px]">Agrawal</span>
                </div>
              </div>
            </div>

            {/* Label Underneath */}
            <span className="font-bold sm:font-black text-slate-800 dark:text-slate-200 text-[7px] sm:text-xs md:text-sm lg:text-base mt-1 sm:mt-2.5 text-center tracking-tight leading-tight w-full block">
              Delivery<span className="block sm:inline sm:ml-1">Challans</span>
            </span>
          </div>

        </div>
      </div>

      {/* Pill Badge matching Gimbooks screenshot: 25+ Document Types | We Cover All Your Invoicing Needs */}
      <div className="flex justify-center mt-7 sm:mt-11 px-3">
        <div className="inline-flex items-center bg-[#F25C22] text-white rounded-full p-1 pl-1 shadow-lg shadow-orange-600/20 max-w-full">
          <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full bg-white text-slate-900 flex flex-col items-center justify-center shadow-sm shrink-0 mr-2 sm:mr-3 border border-orange-100">
            <span className="font-black text-xs sm:text-base leading-tight text-slate-900">25+</span>
            <span className="text-[5.5px] sm:text-[8px] font-bold text-slate-500 uppercase leading-tight text-center px-1">Document Types</span>
          </div>
          <span className="font-extrabold text-[11px] sm:text-sm md:text-base pr-4 sm:pr-6 whitespace-nowrap">
            We Cover All Your Invoicing Needs
          </span>
        </div>
      </div>

      {/* Full Preview Modal When Clicked */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent hideClose className="sm:max-w-xl p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border shadow-2xl">
          <div className="p-4 border-b flex items-center justify-between bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div>
                <DialogTitle className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">
                  {selectedDoc === "quotations" && "Professional Quotation Format"}
                  {selectedDoc === "einvoices" && "Government GST e-Invoice Format"}
                  {selectedDoc === "invoices" && "Standard GST Tax Invoice"}
                  {selectedDoc === "ewaybills" && "Government e-Way Bill Format"}
                  {selectedDoc === "challans" && "Official Delivery Challan Format"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Compliant with CBIC & GST Rule 46 • Print, PDF & WhatsApp Ready
                </DialogDescription>
              </div>
            </div>
            <button 
              onClick={() => setSelectedDoc(null)}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 text-sm text-slate-600 dark:text-slate-300 space-y-3">
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              EscrowBill generates fully automated, tax-compliant {selectedDoc} in 1 click:
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Auto-calculates CGST, SGST, IGST, and HSN tax breakdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dynamic UPI QR code for fast payment reconciliation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Download as PDF, print on A4/Thermal, or share directly on WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Auto-updates product stock levels & party ledger balances</span>
              </li>
            </ul>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
