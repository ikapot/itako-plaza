import React from 'react';

const SpectralBookCover = React.memo(function BookCover({ title, author, idx }) {
    const gradients = [
        'from-zinc-900 to-indigo-950',
        'from-zinc-900 to-red-950',
        'from-zinc-900 to-emerald-950',
        'from-zinc-900 to-amber-950',
        'from-zinc-900 to-purple-950'
    ];
    const gradient = gradients[idx % gradients.length];
    
    return (
        <div className={`shrink-0 w-28 h-40 md:w-32 md:h-48 bg-gradient-to-br ${gradient} border border-white/10 rounded-sm shadow-2xl relative overflow-hidden flex flex-col p-3 md:p-4 group-hover:scale-105 transition-transform duration-700`}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                <div className="editorial-grid w-full h-full scale-150" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="space-y-1">
                    <div className="w-4 h-0.5 bg-white/20 mb-2" />
                    <h5 className="text-[6px] md:text-[8px] font-black leading-tight text-white/90 line-clamp-4 font-oswald uppercase">
                        {title}
                    </h5>
                </div>
                <div className="text-right">
                    <span className="text-[5px] md:text-[7px] font-bold text-white/30 uppercase tracking-tighter">
                        {author?.substring(0, 15)}
                    </span>
                </div>
            </div>
            {/* Spine detail */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/40 border-r border-white/5" />
        </div>
    );
});

export default SpectralBookCover;
