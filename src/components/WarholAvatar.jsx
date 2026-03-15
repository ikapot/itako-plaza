import React from 'react';

const WarholAvatar = ({ src, colorClass = "bg-itako-clay", size = "w-12 h-12", isSelected = false, isPreStyled = false }) => (
    <div className={`${size} rounded-full overflow-hidden relative flex-shrink-0 border border-white/5 bg-zinc-900 ${!isSelected && 'grayscale brightness-50'}`}>
        {/* Screen Print Layer 1: Earth Background (Skip if pre-styled) */}
        {!isPreStyled ? <div className={`absolute inset-0 ${colorClass} opacity-80`} /> : null}

        {/* Screen Print Layer 2: Portrait */}
        <img
            src={src}
            alt="portrait"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${isSelected ? 'scale-110' : 'scale-100'} ${isPreStyled ? 'mix-blend-normal' : 'grayscale contrast-[3] brightness-[1.2] mix-blend-multiply'}`}
        />

        {/* Screen Print Layer 3: Texture Overlay */}
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none" />

        {/* Selection Border Glow */}
        {isSelected ? <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-pulse" /> : null}
    </div>
);

export default WarholAvatar;
