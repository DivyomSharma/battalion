
'use client';

import React from 'react';

interface SectorProps {
    id: string;
    path: string;
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    onClick?: () => void;
    isHighlighted?: boolean;
}

export default function Sector({
    id,
    path,
    fill,
    stroke,
    strokeWidth,
    opacity,
    onClick,
    isHighlighted
}: SectorProps) {
    return (
        <path
            id={id}
            d={path}
            fill={fill}
            fillOpacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
            onClick={onClick}
            className="transition-all duration-300 ease-out cursor-pointer"
            style={{
                vectorEffect: 'non-scaling-stroke',
                filter: isHighlighted ? 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.6))' : 'none'
            }}
        />
    );
}
