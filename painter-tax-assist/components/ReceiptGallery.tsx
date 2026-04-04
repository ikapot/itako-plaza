'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { generateEnboCSV, downloadShiftJISCSV } from '../lib/csv-exporter';

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  createdTime: string;
}

export default function ReceiptGallery() {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFiles();
    }
  }, [status]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drive/list');
      if (!res.ok) throw new Error('Google Drive からの取得に失敗しました');
      const data = await res.json();
      setFiles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [confirmedItems, setConfirmedItems] = useState<any[]>([]);

  const handleAnalyze = async (fileId: string) => {
    setAnalyzingId(fileId);
    setError(null);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      if (!res.ok) throw new Error('AI解析に失敗しました');
      const data = await res.json();
      setAnalysisResult({ ...data, fileId });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  const confirmItem = () => {
    if (analysisResult) {
       setConfirmedItems(prev => [...prev, analysisResult]);
       setAnalysisResult(null);
    }
  };

  const handleExport = () => {
    if (confirmedItems.length === 0) return;
    const csv = generateEnboCSV(confirmedItems);
    downloadShiftJISCSV(csv, `enbo_receipts_${new Date().toISOString().slice(0,10)}.csv`);
  };

  if (status === 'unauthenticated') {
    return (
      <div className="p-12 text-center border-2 border-dashed border-[#EAE1D1] rounded-sm bg-white/50 backdrop-blur-sm">
        <p className="text-[#A68966] font-medium mb-4 font-serif text-lg">画家の青色申告を開始するにはログインしてください</p>
        <button 
          onClick={() => window.location.href = '/api/auth/signin'}
          className="px-6 py-3 bg-[#2D2926] text-white rounded-sm hover:scale-105 transition-all shadow-xl"
        >
          Google アカウントで接続する
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Export Header in Dashboard would be better, but we can put it here or as a floating action */}
      {confirmedItems.length > 0 && (
         <div className="flex items-center justify-between p-4 bg-[#2D2926] text-white rounded-sm shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[#A68966] flex items-center justify-center font-bold text-xs">{confirmedItems.length}</div>
               <span className="text-sm font-medium">件の仕訳が確定済みです</span>
            </div>
            <button 
              onClick={handleExport}
              className="px-6 py-2 bg-white text-[#2D2926] text-xs font-bold rounded-sm shadow-md flex items-center gap-2 hover:bg-[#FDFCFB]"
            >
              <Download className="w-4 h-4" /> 円簿会計用 CSV (SJIS) を書き出す
            </button>
         </div>
      )}

      {/* Analysis Result Modal / Expanded View */}
      {analysisResult && (
        <div className="p-8 bg-white ring-1 ring-[#A68966] rounded-sm shadow-2xl space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between border-b border-[#EAE1D1] pb-4">
            <h3 className="text-xl font-serif text-[#A68966]">Gemini Analysis Results</h3>
            <button onClick={() => setAnalysisResult(null)} className="text-sm opacity-30 hover:opacity-100">閉じる</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Shop / Issuer</label>
                  <p className="text-lg font-medium border-b border-[#EAE1D1] py-1">{analysisResult.shop}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-40">Date</label>
                    <p className="text-md border-b border-[#EAE1D1] py-1">{analysisResult.date}</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-40">Total Amount</label>
                    <p className="text-md font-bold border-b border-[#EAE1D1] py-1">¥{analysisResult.totalAmount?.toLocaleString()}</p>
                  </div>
               </div>
            </div>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold text-[#A68966]">Accounting Category</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-3 py-1 bg-[#A68966] text-white text-xs font-bold rounded-full uppercase">{analysisResult.category}</span>
                    <span className="text-[10px] opacity-40">画家向け自動仕訳</span>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Description</label>
                  <p className="text-sm italic border-b border-[#EAE1D1] py-1">{analysisResult.description}</p>
               </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-4">
             <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 border border-[#EAE1D1] text-xs hover:bg-[#FDFCFB]">修正する</button>
             <button onClick={confirmItem} className="px-6 py-2 bg-[#A68966] text-white text-xs font-bold shadow-lg hover:bg-[#8F7657]">この仕訳を確定する</button>
          </div>
        </div>
      )}

      {/* 確定済みアイテムのプレビュー一覧 */}
      {confirmedItems.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 border-b border-[#EAE1D1] pb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-serif">Confirmed Journal Entries</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#EAE1D1] text-[10px] uppercase tracking-widest opacity-40">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Shop / Description</th>
                  <th className="py-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {confirmedItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#F5F1EA] hover:bg-white/50 transition-colors">
                    <td className="py-3 px-2 font-mono text-[11px]">{item.date}</td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 bg-[#A68966]/10 text-[#A68966] text-[10px] font-bold rounded-sm uppercase">{item.category}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="font-medium text-[#2D2926]">{item.shop}</div>
                      <div className="text-[10px] opacity-40 truncate max-w-[200px]">{item.description}</div>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-[#A68966]">¥{item.totalAmount?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-12">
        <h2 className="text-2xl font-serif text-[#2D2926]">Unprocessed Receipts</h2>
        <button 
          onClick={fetchFiles}
          disabled={loading}
          className="text-sm text-[#A68966] hover:underline disabled:opacity-50"
        >
          {loading ? '読み込み中...' : '最新を読み込む'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#A68966]" />
          <p className="text-sm opacity-50">アトリエの棚を整理中...</p>
        </div>
      )}

      {!loading && files.length === 0 && (
          <div className="p-20 text-center border border-[#EAE1D1] rounded-sm bg-white/40">
             <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p className="opacity-40">Google Drive の &apos;Receipts&apos; フォルダにレシートがありません。</p>
             <p className="text-[10px] mt-2 opacity-30">フォルダ名が大文字の &apos;Receipts&apos; であることを確認してください。</p>
          </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 rounded-sm mb-6">
           <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="group relative bg-white border border-[#EAE1D1] p-3 rounded-sm hover:border-[#A68966] hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden"
            onClick={() => !analyzingId && handleAnalyze(file.id)}
          >
            <div className="aspect-[3/4] bg-[#FDFCFB] border border-[#EAE1D1] mb-3 flex items-center justify-center overflow-hidden">
               {file.thumbnailLink ? (
                 <img 
                    src={file.thumbnailLink.replace('=s220', '=s800')} 
                    alt={file.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" 
                 />
               ) : (
                 <ImageIcon className="w-8 h-8 opacity-5 text-[#A68966]" />
               )}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-medium truncate opacity-80">{file.name}</p>
              <p className="text-[10px] opacity-40">{new Date(file.createdTime).toLocaleDateString()}</p>
            </div>

            {/* Gemini Analysis Button overlay */}
            <div className={`absolute inset-0 bg-[#A68966]/90 flex flex-col items-center justify-center transition-all duration-300 ${analyzingId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
               {analyzingId === file.id ? (
                 <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span className="text-[10px] text-white font-bold tracking-tighter">Gemini 鑑定中...</span>
                 </div>
               ) : (
                 <>
                   <div className="px-4 py-2 bg-white text-[#2D2926] text-xs font-bold rounded-sm shadow-lg mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                     Gemini で仕訳する
                   </div>
                   <span className="text-[9px] text-white/70">画家の経費として画像解析</span>
                 </>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
