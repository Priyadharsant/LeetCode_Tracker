import React from 'react';

export default function RadialProgress({ value = 0, size = 140, stroke = 12 }) {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="radial-progress">
            <defs>
                <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffb347" />
                    <stop offset="50%" stopColor="#ffa116" />
                    <stop offset="100%" stopColor="#e69013" />
                </linearGradient>
            </defs>
            <g transform={`translate(${size / 2}, ${size / 2})`}>
                <circle r={radius} fill="none" stroke="#3e3e3e" strokeWidth={stroke} />
                <circle
                    r={radius}
                    fill="none"
                    stroke="url(#brand-grad)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90)"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                <text x="0" y="4" textAnchor="middle" fontSize={size * 0.18} fontWeight="700" fill="#f8fafc">
                    {Math.round(value)}%
                </text>
            </g>
        </svg>
    );
}
