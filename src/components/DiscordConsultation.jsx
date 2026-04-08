import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ExternalLink, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const DiscordConsultation = () => {
    const channelId = "1491025756468543539";
    const inviteUrl = `https://discord.com/channels/1491025756468543539`; // Placeholder or deep link

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#f15a24] to-[#fdb913] rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-12 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <MessageSquare size={160} className="text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f15a24]/10 border border-[#f15a24]/20 text-[#f15a24] text-[10px] font-black tracking-widest uppercase font-oswald">
                            <Sparkles size={12} />
                            Spiritual Concierge Active
                        </div>
                        
                        <h2 className="text-4xl md:text-6xl font-black font-oswald text-white leading-tight uppercase tracking-tighter">
                            DISCORD <br/>
                            <span className="text-[#f15a24]">相談窓口</span>
                        </h2>
                        
                        <p className="text-sm md:text-lg text-white/60 font-serif italic max-w-2xl leading-relaxed">
                            「Itako Plaza」の深淵なるロジックや、自動売買システムの健全性を司るコンサルタントAIが、Discordにてあなたの問いを待っています。
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                            <div className="w-10 h-10 rounded-2xl bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2]">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest font-oswald">認証・安全</h3>
                            <p className="text-[11px] text-white/40 leading-relaxed">
                                楽天証券の2段階認証（2FA）など、重要な通知や手動介入の窓口として機能します。
                            </p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Zap size={20} />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest font-oswald">クオンツ分析</h3>
                            <p className="text-[11px] text-white/40 leading-relaxed">
                                バックテスト結果の解釈や、ATRエグジット戦略の微調整についてAIに相談可能です。
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 relative z-10">
                        <a 
                            href={inviteUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-10 py-5 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-full font-black text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-3 transition-all shadow-[0_20px_40px_-10px_rgba(88,101,242,0.3)] group"
                        >
                            <MessageSquare size={18} />
                            Discord へ入室する
                            <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                        </a >
                        
                        <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            {channelId ? `CHANNEL_ID: ${channelId}` : 'PORTAL_STANDBY'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'BOT_NAME', value: 'Itako Consult AI' },
                    { label: 'PROTOCOL', value: 'OpenRouter / Gemini' },
                    { label: 'STATUS', value: 'SYNCING' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-[32px] bg-black/40 border border-white/5 flex flex-col items-center text-center">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">{stat.label}</span>
                        <span className="text-xs font-bold text-white tracking-widest uppercase font-oswald">{stat.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiscordConsultation;
