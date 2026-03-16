import React from 'react';
import { LiftLayoutData } from '../types';
import { Eye, EyeOff, PenTool } from 'lucide-react';

interface LiftLayoutSketchProps {
  data: LiftLayoutData;
  onChange?: (field: keyof LiftLayoutData, value: any) => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// Helper Components
const GuideT: React.FC<{x:number, y:number, rotation:number, color?:string}> = ({ x, y, rotation, color = "#000" }) => (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
        <rect x="-8" y="-2" width="16" height="4" fill={color} />
        <rect x="-2" y="-2" width="4" height="12" fill={color} />
    </g>
);

const DimLine = ({ x1, y1, x2, y2, text, offset = 30, color = "#000", fontSize = 12, isInside = false }: any) => {
    const dx = x2 - x1; const dy = y2 - y1; const len = Math.sqrt(dx*dx + dy*dy);
    if(len === 0) return null;
    const ux = -dy / len; const uy = dx / len;
    const nx1 = x1 + ux * offset; const ny1 = y1 + uy * offset;
    const nx2 = x2 + ux * offset; const ny2 = y2 + uy * offset;
    const mx = (nx1 + nx2) / 2; const my = (ny1 + ny2) / 2;
    return (
      <g>
        <line x1={x1} y1={y1} x2={nx1} y2={ny1} stroke={color} strokeWidth="0.5" opacity="0.3" />
        <line x1={x2} y1={y2} x2={nx2} y2={ny2} stroke={color} strokeWidth="0.5" opacity="0.3" />
        <line x1={nx1} y1={ny1} x2={nx2} y2={ny2} stroke={color} strokeWidth="1" />
        <circle cx={nx1} cy={ny1} r={2} fill={color} />
        <circle cx={nx2} cy={ny2} r={2} fill={color} />
        {!isInside && <rect x={mx - (String(text).length * 3.5)} y={my - 7} width={String(text).length * 7} height={14} fill="white" fillOpacity="0.8" rx={2} />}
        <text x={mx} y={my} dy={4} textAnchor="middle" fill={color} fontSize={fontSize} fontWeight="bold">{text}</text>
      </g>
    );
};

export const LiftLayoutSketch: React.FC<LiftLayoutSketchProps> = ({ 
  data,
  onChange,
  isVisible = true,
  onToggleVisibility
}) => {
  if (!isVisible) {
      return (
          <div className="mb-8 no-print p-4 border border-dashed border-gray-300 rounded bg-gray-50 text-gray-400 flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                 <PenTool size={18}/>
                 <span className="text-sm font-bold uppercase">Nákres (Skrytý)</span>
              </div>
              {onToggleVisibility && <button onClick={onToggleVisibility} className="hover:text-blue-600"><Eye size={20}/></button>}
          </div>
      );
  }

  // Visual Config
  const svgSize = 420; const center = svgSize / 2;
  const VISUAL_SHAFT_SIZE = 300;
  const VISUAL_CABIN_WIDTH = 180;
  const VISUAL_CABIN_DEPTH = 200;
  
  // --- ASYMMETRY CALCULATION (LDO/RDO) ---
  let horizontalShift = 0;
  if (data.LDO !== undefined && data.doorOpeningWidth && data.shaftWidth > 0) {
      const realShaftCenter = data.shaftWidth / 2;
      const realCabinCenter = data.LDO + (data.doorOpeningWidth / 2);
      const shiftMm = realCabinCenter - realShaftCenter;
      const scale = VISUAL_SHAFT_SIZE / data.shaftWidth;
      horizontalShift = shiftMm * scale;
      
      const maxShift = (VISUAL_SHAFT_SIZE - VISUAL_CABIN_WIDTH) / 2 - 10;
      if (horizontalShift > maxShift) horizontalShift = maxShift;
      if (horizontalShift < -maxShift) horizontalShift = -maxShift;
  }

  const shaftX = center - (VISUAL_SHAFT_SIZE / 2); 
  const shaftY = center - (VISUAL_SHAFT_SIZE / 2);
  const cabinX = center - (VISUAL_CABIN_WIDTH / 2) + horizontalShift; 
  const cabinY = center - (VISUAL_CABIN_DEPTH / 2);
  const activeCenter = center + horizontalShift;

  const inputCwtW = (data.cwtWidth || 120) / 6; const inputCwtL = (data.cwtDepth || 650) / 6;
  let cwtX = 0, cwtY = 0, cwtW = 0, cwtH = 0;
  if (data.counterWeightPosition === 'back') { cwtW = inputCwtL; cwtH = inputCwtW; cwtX = center - (cwtW / 2); cwtY = shaftY + 15; } 
  else if (data.counterWeightPosition === 'left') { cwtW = inputCwtW; cwtH = inputCwtL; cwtX = shaftX + 15; cwtY = center - (cwtH / 2); } 
  else if (data.counterWeightPosition === 'right') { cwtW = inputCwtW; cwtH = inputCwtL; cwtX = shaftX + VISUAL_SHAFT_SIZE - 15 - cwtW; cwtY = center - (cwtH / 2); }

  const renderRails = () => {
    const railColor = "#555";
    const carRails = [];
    const cwtRails = [];

    // Car Rails
    if (data.frameType === 'backpack') {
        // Backpack: Rails at Rear (Top of visual)
        const railSpacing = VISUAL_CABIN_WIDTH * 0.6; 
        const rx1 = cabinX + (VISUAL_CABIN_WIDTH - railSpacing) / 2;
        const rx2 = cabinX + (VISUAL_CABIN_WIDTH + railSpacing) / 2;
        const ry = cabinY - 12; 

        // Stem pointing Down (0)
        carRails.push(<GuideT key="cr1" x={rx1} y={ry} rotation={0} color={railColor} />);
        carRails.push(<GuideT key="cr2" x={rx2} y={ry} rotation={0} color={railColor} />);
    } else {
        // Central: Rails at Left/Right of cabin
        const ry = cabinY + VISUAL_CABIN_DEPTH / 2;
        const rxLeft = cabinX - 12;
        const rxRight = cabinX + VISUAL_CABIN_WIDTH + 12;

        // Left Rail: Stem points Right (-90)
        carRails.push(<GuideT key="cr1" x={rxLeft} y={ry} rotation={-90} color={railColor} />);
        // Right Rail: Stem points Left (90)
        carRails.push(<GuideT key="cr2" x={rxRight} y={ry} rotation={90} color={railColor} />);
    }

    // CWT Rails
    if (data.counterWeightPosition === 'back') {
        // CWT is horizontal at Top
        const ry = cwtY + cwtH / 2;
        const rxLeft = cwtX - 10;
        const rxRight = cwtX + cwtW + 10;

        // Left: Stem points Right (-90)
        cwtRails.push(<GuideT key="cwr1" x={rxLeft} y={ry} rotation={-90} color={railColor} />);
        // Right: Stem points Left (90)
        cwtRails.push(<GuideT key="cwr2" x={rxRight} y={ry} rotation={90} color={railColor} />);
    } else if (data.counterWeightPosition === 'left' || data.counterWeightPosition === 'right') {
        // CWT is vertical at Side
        const rx = cwtX + cwtW / 2;
        const ryTop = cwtY - 10;
        const ryBottom = cwtY + cwtH + 10;

        // Top: Stem points Down (0)
        cwtRails.push(<GuideT key="cwr1" x={rx} y={ryTop} rotation={0} color={railColor} />);
        // Bottom: Stem points Up (180)
        cwtRails.push(<GuideT key="cwr2" x={rx} y={ryBottom} rotation={180} color={railColor} />);
    }

    return (
        <g>
            {carRails}
            {cwtRails}
        </g>
    );
  };

  // DOOR RENDERING HELPERS
  const renderDoor = (side: 'A' | 'B' | 'C') => {
      let yPosShaft = 0, yPosCabin = 0, rot = 0, cx = 0, cy = 0;
      let label = side;
      let isSide = false;

      if (side === 'A') { // Front
          yPosShaft = shaftY + VISUAL_SHAFT_SIZE;
          yPosCabin = cabinY + VISUAL_CABIN_DEPTH;
          cx = activeCenter;
          cy = yPosShaft + 25;
      } else if (side === 'B') { // Rear (180)
          yPosShaft = shaftY;
          yPosCabin = cabinY;
          cx = activeCenter;
          cy = yPosShaft - 15;
          rot = 180;
      } else if (side === 'C') { // Side (90)
          isSide = true;
          const onRight = data.counterWeightPosition !== 'right'; // If CWT right, C is left
          const xPosShaft = onRight ? shaftX + VISUAL_SHAFT_SIZE : shaftX;
          const xPosCabin = onRight ? cabinX + VISUAL_CABIN_WIDTH : cabinX;
          
          return (
              <g key="door-C">
                  {/* Thresholds */}
                  <line x1={xPosShaft} y1={center - 40} x2={xPosShaft} y2={center + 40} stroke="white" strokeWidth={6} />
                  <line x1={xPosCabin} y1={center - 30} x2={xPosCabin} y2={center + 30} stroke="#0284c7" strokeWidth={3} />
                  {/* Label */}
                  <text x={onRight ? xPosShaft + 20 : xPosShaft - 20} y={center} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#000">C</text>
              </g>
          );
      }

      if (!isSide) {
          const vDoorW = 140; 
          const doorStart = activeCenter - (vDoorW / 2);
          
          return (
              <g key={`door-${side}`}>
                  {/* Shaft Threshold */}
                  <line x1={shaftX + 60} y1={yPosShaft} x2={shaftX + VISUAL_SHAFT_SIZE - 60} y2={yPosShaft} stroke="white" strokeWidth={6} />
                  {/* Cabin Threshold */}
                  <line x1={cabinX} y1={yPosCabin} x2={cabinX + VISUAL_CABIN_WIDTH} y2={yPosCabin} stroke="#0284c7" strokeWidth={3} />
                  
                  {/* DOOR MECHANISMS */}
                  {data.doorType === 'bus' ? (
                      // BUS: Zig-Zag Folding Line
                      <path 
                        d={`M ${doorStart},${yPosCabin} L ${doorStart+35},${yPosCabin - (side==='B'?-10:10)} L ${doorStart+70},${yPosCabin} L ${doorStart+105},${yPosCabin - (side==='B'?-10:10)} L ${doorStart+140},${yPosCabin}`} 
                        fill="none" 
                        stroke="#0284c7" 
                        strokeWidth="2" 
                      />
                  ) : data.doorType === 'telescopic' ? (
                      // TELESCOPIC: 2 Panels Stacked on LEFT (Assuming Left Opening for visual)
                      <g transform={`translate(${doorStart}, ${yPosShaft + (side==='B'?10:-10)})`}>
                          {/* Panel 1 (Fixed/Slow) */}
                          <rect x={0} y={side==='B' ? -6 : 2} width={70} height={4} fill="#888" stroke="black" strokeWidth="0.5"/>
                          {/* Panel 2 (Fast) */}
                          <rect x={20} y={side==='B' ? -2 : -2} width={70} height={4} fill="#666" stroke="black" strokeWidth="0.5"/>
                          {/* Arrow */}
                          <path d={`M 80,${side==='B'?-4:4} L 100,${side==='B'?-4:4} L 95,${side==='B'?-8:8}`} fill="none" stroke="black" strokeWidth="1"/>
                      </g>
                  ) : (
                      // CENTRAL: 2 Panels on sides
                      <g transform={`translate(${cx}, ${yPosShaft + (side==='B'?10:-10)})`}>
                          <line x1={0} y1={0} x2={-70} y2={0} stroke="#ccc" strokeWidth="1" strokeDasharray="2" />
                          <line x1={0} y1={0} x2={70} y2={0} stroke="#ccc" strokeWidth="1" strokeDasharray="2" />
                          
                          {/* Left Panel */}
                          <rect x={-70} y={-2} width={20} height={4} fill="#666" stroke="black" strokeWidth="0.5"/>
                          {/* Right Panel */}
                          <rect x={50} y={-2} width={20} height={4} fill="#666" stroke="black" strokeWidth="0.5"/>
                          
                          {/* Arrows */}
                          <path d={`M -10,0 L -20,0 M 10,0 L 20,0`} fill="none" stroke="black" strokeWidth="1" markerEnd="url(#arrow)"/>
                      </g>
                  )}
                  <text x={cx} y={cy} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#000">{label}</text>
              </g>
          );
      }
      return null;
  };

  return (
       <div className="w-full h-full flex flex-col items-center justify-center relative bg-white">
            <div className="absolute top-2 right-2 z-10 no-print flex gap-2">
                {onToggleVisibility && <button onClick={onToggleVisibility} className="p-1 rounded text-gray-400 hover:text-black hover:bg-gray-100 bg-white/50"><EyeOff size={16} /></button>}
           </div>
           
           {/* SVG fills the container completely now */}
           <svg 
                viewBox={`0 0 ${svgSize} ${svgSize}`} 
                className="w-full h-full p-2" 
                preserveAspectRatio="xMidYMid meet"
           >
                <defs>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#000000" strokeWidth="1" opacity="0.1"/></pattern>
                    <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#000" /></marker>
                </defs>
                
                {/* Background & Shaft */}
                <rect x={shaftX} y={shaftY} width={VISUAL_SHAFT_SIZE} height={VISUAL_SHAFT_SIZE} fill="url(#hatch)" stroke="black" strokeWidth="4" />
                <rect x={shaftX-5} y={shaftY-5} width={VISUAL_SHAFT_SIZE+10} height={VISUAL_SHAFT_SIZE+10} fill="none" stroke="black" strokeWidth="0.5" />
                
                {horizontalShift !== 0 && (
                    <line x1={center} y1={shaftY} x2={center} y2={shaftY + VISUAL_SHAFT_SIZE} stroke="red" strokeWidth="0.5" strokeDasharray="4" opacity="0.5" />
                )}

                {/* Cabin & CWT */}
                <rect x={cabinX} y={cabinY} width={VISUAL_CABIN_WIDTH} height={VISUAL_CABIN_DEPTH} fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
                <rect x={cwtX} y={cwtY} width={cwtW} height={cwtH} fill="#ef4444" stroke="#7f1d1d" strokeWidth="1" />
                
                {renderRails()}
                
                {/* DOORS */}
                {renderDoor('A')}
                {data.entrances === 'AB' && renderDoor('B')}
                {data.entrances === 'AC' && renderDoor('C')}
                
                {/* Dimensions */}
                <DimLine x1={shaftX} y1={shaftY} x2={shaftX+VISUAL_SHAFT_SIZE} y2={shaftY} text={`Š ${data.shaftWidth}`} offset={-30} />
                <DimLine x1={shaftX} y1={shaftY} x2={shaftX} y2={shaftY+VISUAL_SHAFT_SIZE} text={`H ${data.shaftDepth}`} offset={-30} />
                <DimLine x1={cabinX} y1={cabinY} x2={cabinX+VISUAL_CABIN_WIDTH} y2={cabinY} text={`Kabína ${Math.round(data.cabinWidth)}`} offset={20} color="#0284c7" isInside />
                <DimLine x1={cabinX+VISUAL_CABIN_WIDTH} y1={cabinY} x2={cabinX+VISUAL_CABIN_WIDTH} y2={cabinY+VISUAL_CABIN_DEPTH} text={`${Math.round(data.cabinDepth)}`} offset={-20} color="#0284c7" isInside />
                <DimLine x1={shaftX + 60} y1={shaftY + VISUAL_SHAFT_SIZE} x2={shaftX + VISUAL_SHAFT_SIZE - 60} y2={shaftY + VISUAL_SHAFT_SIZE} text={`PL ${Math.round(data.doorWidth)}`} offset={35} />
                
                {horizontalShift !== 0 && (
                    <>
                        <text x={shaftX + 10} y={shaftY + VISUAL_SHAFT_SIZE - 10} fontSize="9" fill="gray">LDO: {data.LDO}</text>
                        <text x={shaftX + VISUAL_SHAFT_SIZE - 50} y={shaftY + VISUAL_SHAFT_SIZE - 10} fontSize="9" fill="gray">RDO: {data.RDO}</text>
                    </>
                )}
           </svg>
           {data.stationLabels && <div className="absolute bottom-0 w-full text-center py-1 bg-white/90 border-t border-gray-100"><span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide mr-1">Stanice:</span><span className="text-[9px] font-bold text-black break-words whitespace-normal leading-tight">{data.stationLabels}</span></div>}
      </div>
  );
};