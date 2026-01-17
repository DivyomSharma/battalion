
// GENERATED SYMMETRIC MAP DATA
// Center Octagon (Zone 8) + 8 Surrounding Pentagons (Zones 0-7)

// Logic:
// Center: (50, 50)
// Octagon Radius: 15
// Surrounding Zones start at 16, extent to 48 (giving 2px padding from 50 edge)
// Angles: 8 zones * 45 deg.

// HELPER: Rotate point
const rotate = (x: number, y: number, cx: number, cy: number, angleDeg: number) => {
    const rad = angleDeg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = x - cx;
    const dy = y - cy;
    return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
    };
};

// HELPER: Generate Polygon Path
// Octagon: 8 points.
// Pentagon: 5 points.

// -- GEOMETRY --
// Center Octagon (Zone 8)
// Points: 8 points at Radius 15. Rotation offset 22.5 deg to have flat sides for neighbors?
// No, if neighbors are at 0, 45, 90... we want Flat Side facing them?
// If neighbor is at 0 deg (Right), Octagon needs a flat vertical side there?
// Octagon vertices should be at 22.5, 67.5, etc. so the EDGE is at 0, 45.
// Edge midpoint at 0 deg: Radius = 15 * cos(22.5) ~ 13.8.
// Perfect.
const OCTAGON_PATH = (() => {
    let d = "";
    for (let i = 0; i < 8; i++) {
        const angle = 22.5 + i * 45;
        const rad = angle * Math.PI / 180;
        const x = 50 + 15 * Math.cos(rad);
        const y = 50 + 15 * Math.sin(rad);
        d += (i === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2) + " ";
    }
    return d + "Z";
})();

// Surrounding Pentagons
// ID Mapping based on user preference (0=TopLeft, 1=Top...?)
// Let's assume standard compass:
// 1: Top (270)
// 2: TopRight (315)
// 3: Right (0)
// ...
// Shape:
// Inner Edge matches Octagon edge.
// Outer Edge: Pointed? "Pentagon".
// Points:
// 1, 2: Shared with Octagon (or slightly offset gap).
// 3, 5: Side extension.
// 4: Tip.
// Let's define one template pointing RIGHT (0 deg) and rotate it.
// Octagon Edge at 0 deg is vertical-ish from (50+15*cos(-22.5), ...) to (50+15*cos(22.5), ...).
// Vertices at +/- 22.5 deg, R=15.
// P1: (50 + 15*cos(-22.5), 50 + 15*sin(-22.5))
// P2: (50 + 15*cos(22.5), 50 + 15*sin(22.5))
// P3: Extend P2 out. R=45, angle=15?
// P4: Tip. R=48, angle=0.
// P5: Extend P1 out.
const generatePentagonPath = (rotationDeg: number) => {
    // Template for 0 deg (Right)
    const rInner = 16; // Slight gap from 15
    const rOuterSide = 40;
    const rOuterTip = 45;
    const angleInner = 22.5;
    const angleOuter = 18; // Narrower tip? Or 22.5 for distinct sectors.

    const points = [
        // Inner Top
        { r: rInner, a: -angleInner },
        // Outer Top
        { r: rOuterSide, a: -angleOuter },
        // Tip
        { r: rOuterTip, a: 0 },
        // Outer Bottom
        { r: rOuterSide, a: angleOuter },
        // Inner Bottom
        { r: rInner, a: angleInner }
    ];

    let d = "";
    points.forEach((p, i) => {
        // Convert polar to cartesian
        const aRad = p.a * Math.PI / 180;
        const x = 50 + p.r * Math.cos(aRad);
        const y = 50 + p.r * Math.sin(aRad);

        // Rotate
        const rot = rotate(x, y, 50, 50, rotationDeg);
        d += (i === 0 ? "M " : "L ") + rot.x.toFixed(2) + " " + rot.y.toFixed(2) + " ";
    });
    return d + "Z";
};

// -- SLOTS --
// Center (9): Ring 8 + Center
const slots8 = [
    { x: 50, y: 50 },
    ...Array.from({ length: 8 }).map((_, i) => {
        const a = i * 45;
        const r = 8;
        return {
            x: 50 + r * Math.cos(a * Math.PI / 180),
            y: 50 + r * Math.sin(a * Math.PI / 180)
        };
    })
];

// Outer Zones: Varying capacity.
// Strategy: Radial Rows.
// Row 1 (Inner): R ~ 22. Width matches inner edge.
// Row 2 (Mid): R ~ 30.
// Row 3 (Outer): R ~ 38.
// Template for 0 deg:
const generateSlotsForCap = (cap: number, rot: number) => {
    const slots: { x: number; y: number }[] = [];
    // Distribution configs
    let config: number[] = [];
    if (cap === 11) config = [3, 4, 4]; // R22(3), R30(4), R38(4)
    if (cap === 17) config = [4, 6, 7];
    if (cap === 21) config = [5, 7, 9];

    // Radius for rows
    const radii = [22, 30, 38];
    const spreadAngles = [30, 36, 40]; // Degrees spread

    let currentIdx = 0;
    config.forEach((count, rowIndex) => {
        const r = radii[rowIndex];
        const spread = spreadAngles[rowIndex];
        // Distribute `count` points between -spread/2 and +spread/2
        const step = count > 1 ? spread / (count - 1) : 0;
        const start = -spread / 2;

        for (let i = 0; i < count; i++) {
            const a = count > 1 ? start + i * step : 0;
            const aRad = a * Math.PI / 180;
            const x = 50 + r * Math.cos(aRad);
            const y = 50 + r * Math.sin(aRad);
            const p = rotate(x, y, 50, 50, rot);
            slots.push(p);
        }
    });
    return slots;
};

// USER MAPPING:
// 1: Top (270) -> Cap 11
// 2: TopRight (315) -> Cap 11
// 0: TopLeft (225) -> Cap 17
// ... derived from my previous knowledge of capacities:
// 8 (Blue/Center): 9
// 6 (Red/Left): 21
// 7 (Green/Right): 21
// 0 (TopLeft): 17
// 1 (Top): 11
// 2 (TopRight): 11
// 3 (BotRight): 17 (Mirrored 0)
// 4 (Bot): 11 (Mirrored 1)
// 5 (BotLeft): 11 (Mirrored 2? Wait. 5 was mirrored 0? No, 5 is BotLeft. 3 is BotRight.)
// Let's stick to the visual map:
// 0(TL), 1(T), 2(TR)
// 6(L),  8(C), 7(R)
// 5(BL), 4(B), 3(BR)
// Angles:
// 1: -90 (270)
// 2: -45 (315)
// 7: 0
// 3: 45
// 4: 90
// 5: 135
// 6: 180
// 0: 225
// Capacities:
// 1: 11
// 2: 11
// 7: 21
// 3: 17
// 4: 11
// 5: 11
// 6: 21
// 0: 17
// Wait, 5 was 11 in previous file. 0 was 17. 3 was 17.
// Let's verify symmetries. 6 & 7 are flanks (21). 1 & 4 are Top/Bot (11). 0 & 3 are diagonals (17?). 2 & 5 are diagonals (11?).
// Yes, that creates symmetry.
// 6(21) -- 7(21)
// 1(11) -- 4(11)
// 0(17) -- 3(17)
// 2(11) -- 5(11)

const SLOT_LAYOUTS_GENERATED: Record<string, { x: number; y: number }[]> = {
    'zone_8': slots8,
    'zone_1': generateSlotsForCap(11, 270),
    'zone_2': generateSlotsForCap(11, 315),
    'zone_7': generateSlotsForCap(21, 0),
    'zone_3': generateSlotsForCap(17, 45),
    'zone_4': generateSlotsForCap(11, 90),
    'zone_5': generateSlotsForCap(11, 135),
    'zone_6': generateSlotsForCap(21, 180),
    'zone_0': generateSlotsForCap(17, 225),
};

// EXPORT TO TS
export const ZONE_PATHS_GENERATED: Record<string, string> = {
    'zone_8': OCTAGON_PATH,
    'zone_1': generatePentagonPath(270),
    'zone_2': generatePentagonPath(315),
    'zone_7': generatePentagonPath(0),
    'zone_3': generatePentagonPath(45),
    'zone_4': generatePentagonPath(90),
    'zone_5': generatePentagonPath(135),
    'zone_6': generatePentagonPath(180),
    'zone_0': generatePentagonPath(225),
};

export const SLOT_LAYOUTS = SLOT_LAYOUTS_GENERATED;
