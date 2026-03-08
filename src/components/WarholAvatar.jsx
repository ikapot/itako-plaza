import React from 'react';

const WarholAvatar = ({ src, colorClass = "bg-itako-clay", size = "w-12 h-12", isSelected = false }) => (
    <div className={`${size} rounded-full overflow-hidden relative flex-shrink-0 border border-white/5 bg-zinc-900 ${!isSelected && 'grayscale brightness-50'}`}>
        {/* Screen Print Layer 1: Earth Background */}
        <div className={`absolute inset-0 ${colorClass} opacity-80`} />

        {/* Screen Print Layer 2: High Contrast Portrait */}
        <img
            src={src}
            alt="portrait"
            className={`absolute inset-0 w-full h-full object-cover grayscale contrast-[3] brightness-[1.2] mix-blend-multiply transition-all duration-500 ease-out ${isSelected ? 'scale-110' : 'scale-100'}`}
        />

        {/* Screen Print Layer 3: Texture Overlay */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />

        {/* Selection Border Glow */}
        {isSelected && <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-pulse" />}
    </div>
);

export default WarholAvatar;
