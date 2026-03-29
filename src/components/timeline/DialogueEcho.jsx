import React, { useMemo } from 'react';

const MemoizedEchoItem = React.memo(function EchoItem({ e }) {
    return (
        <div
            className="absolute text-[8px] md:text-[10px] font-serif italic tracking-widest whitespace-nowrap pr-2 echo-item"
            style={{ 
                left: `${e.x}%`, 
                top: `${e.y}%`, 
                color: '#b45309',
                '--echo-duration': `${e.duration}s`,
                '--echo-delay': `${e.delay}s`
            }}
        >
            {e.text}
        </div>
    );
});

const DialogueEcho = React.memo(function DialogueEcho({ messages, accentColor }) {
    const echos = useMemo(() => {
        return messages.slice(0, -1).slice(-10).map((m, i) => ({
            id: i,
            text: m.content.slice(0, 40) + (m.content.length > 40 ? '...' : ''),
            x: 10 + Math.random() * 80,
            y: 20 + Math.random() * 60,
            duration: 20 + Math.random() * 40,
            delay: Math.random() * 10,
        }));
    }, [messages]);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
            {echos.map(function renderEcho(e) {
                return <MemoizedEchoItem key={e.id} e={e} accentColor={accentColor} />;
            })}
        </div>
    );
});

export default DialogueEcho;
