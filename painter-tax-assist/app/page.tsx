import React from 'react';
import { Camera, Download, FolderGit2, AlertCircle, CheckCircle2 } from 'lucide-react';
import ReceiptGallery from '../components/ReceiptGallery';

export default function PainterTaxDashboard() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2926] selection:bg-[#EAE1D1]">
      {/* Header: Atelier Style */}
      <header className="border-b border-[#EAE1D1] bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#A68966] to-[#2D2926] rounded-sm flex items-center justify-center shadow-lg">
              <Camera className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-medium tracking-tight">Painter&apos;s Blue Tax Assist</h1>
          </div>
          <div className="flex items-center gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-[#2D2926] text-white rounded-sm hover:bg-black transition-all shadow-md group">
               <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
               <span className="text-sm font-medium">CSV書き出し (弥生/円簿)</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar: Project Info */}
        <aside className="w-full md:w-64 space-y-8">
           <section className="p-6 bg-white border border-[#EAE1D1] rounded-sm shadow-sm space-y-4">
             <h2 className="text-xs uppercase tracking-widest text-[#A68966] font-bold">Original Folder</h2>
             <div className="flex items-center gap-3 p-3 bg-[#FDFCFB] border border-[#EAE1D1] rounded-sm text-sm">
                <FolderGit2 className="w-4 h-4 text-[#A68966]" />
                <span className="truncate opacity-70">Tax_Receipts_2024</span>
             </div>
             <p className="text-[11px] leading-relaxed opacity-50">
               Google Drive の特定フォルダを常時監視中。スマホで撮影して放り込むだけで、Gemini が即座に画家の眼で仕訳を行います。
             </p>
           </section>

           <section className="space-y-3">
             <h2 className="text-xs uppercase tracking-widest text-[#A68966] font-bold">Status Overview</h2>
             <div className="space-y-2">
                <div className="flex items-center justify-between text-sm p-2 hover:bg-white rounded-sm transition-colors cursor-pointer group">
                  <span className="opacity-60 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 確定済み
                  </span>
                  <span className="font-medium">12件</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-white ring-1 ring-[#A68966]/20 rounded-sm cursor-pointer">
                  <span className="opacity-80 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#A68966]" /> 未確認 (Gemini解析済)
                  </span>
                  <span className="font-bold">5件</span>
                </div>
             </div>
           </section>
        </aside>

        {/* Main Content: Receipt Feed */}
        <section className="flex-1 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-serif">Receipt Inventory</h2>
            <p className="text-sm opacity-50 underline decoration-dotted cursor-help">全 20 件の証憑</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <ReceiptGallery />
          </div>
        </section>
      </main>

      {/* Background Decor (Painter's Canvas vibe) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1] overflow-hidden">
         <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-radial from-[#A68966] to-transparent" />
         <div className="absolute bottom-0 right-0 w-full h-full editorial-grid opacity-20" />
      </div>
    </div>
  );
}
