import React from 'react';

function catmullRom2bezier(points) {
    // points: [{x,y}, ...]
    const d = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const bp1x = p1.x + (p2.x - p0.x) / 6;
        const bp1y = p1.y + (p2.y - p0.y) / 6;
        const bp2x = p2.x - (p3.x - p1.x) / 6;
        const bp2y = p2.y - (p3.y - p1.y) / 6;

        d.push(`C ${bp1x} ${bp1y}, ${bp2x} ${bp2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(' ');
}

export default function Sparkline({ data = [], width = 180, height = 48, stroke = '#06b6d4' }) {
    if (!data || data.length === 0) return <svg width={width} height={height}></svg>;

    const padding = 6;
    const w = Math.max(40, width);
    const h = Math.max(24, height);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const len = data.length;
    const step = (w - padding * 2) / Math.max(1, len - 1);

    const points = data.map((d, i) => {
        const x = padding + i * step;
        const y = max === min ? h / 2 : padding + ((max - d) / (max - min)) * (h - padding * 2);
        return { x, y };
    });

    const start = `M ${points[0].x} ${points[0].y}`;
    const cmds = catmullRom2bezier(points);
    const d = `${start} ${cmds}`;

    // area path (down to bottom)
    const areaD = `${start} ${cmds} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline">
            <defs>
                <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#sparkGrad)" />
            <path d={d} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
