import React from 'react';
import { Music } from 'lucide-react';

/**
 * ミュージアム/ライブラリで見つかるメディアアーティファクト。
 * 検索クエリに基づき、関連する落語、音楽、映像の手がかりを返します。
 */
export const getMediaArtifacts = (query) => {
    const q = query.toLowerCase();
    
    // 落語関連
    if (q.includes('落語') || q.includes('古典') || q.includes('志ん生') || q.includes('文楽') || q.includes('円生')) {
        return [
            { 
                title: '古今亭志ん生：黄金餅', 
                type: 'rakugo', 
                url: 'https://www.youtube.com/results?search_query=古今亭志ん生+黄金餅', 
                icon: <Music className="text-orange-400" /> 
            },
            { 
                title: '五代目古今亭志ん生 名演集', 
                type: 'rakugo', 
                url: 'https://www.youtube.com/results?search_query=古今亭志ん生+名演集', 
                icon: <Music className="text-orange-400" /> 
            }
        ];
    }
    
    // 音楽（クラシック）関連
    if (q.includes('クラッシク') || q.includes('ベートーヴェン') || q.includes('ショパン') || q.includes('音楽')) {
        return [
            { 
                title: 'Beethoven: Symphony No. 9', 
                type: 'music', 
                url: 'https://www.youtube.com/results?search_query=Beethoven+Symphony+9', 
                icon: <Music className="text-blue-400" /> 
            },
            { 
                title: 'Chopin: Nocturnes', 
                type: 'music', 
                url: 'https://www.youtube.com/results?search_query=Chopin+Nocturnes', 
                icon: <Music className="text-purple-400" /> 
            }
        ];
    }
    
    return [];
};
