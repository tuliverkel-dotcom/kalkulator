
import React from 'react';
import { LiftLayoutData } from '../types';
import { Eye, ClipboardList, AlertTriangle, Settings, ShieldCheck, Zap } from 'lucide-react';
import { LiftLayoutSketch } from './LiftLayoutSketch';

interface TechSpecTableProps {
  data: LiftLayoutData;
  isVisible: boolean;
  onToggleVisibility: () => void;
  embedded?: boolean;
}

export const TechSpecTable: React.FC<TechSpecTableProps> = ({
  data,
  isVisible,
  onToggleVisibility,
  embedded = false
}) => {
  
  const getLiftTypeLabel = (val: string) => {
      const map: Record<string, string> = { 
          'passenger': 'Osobný výťah', 
          'freight': 'Nákladný výťah', 
          'home': 'Domáci výťah', 
          'hospital': 'Lôžkový výťah',
          'invalid': 'Invalidný (EN81-70)'
      };
      return map[val] || val;
  };
  const getDriveLabel = (val: string) => {
      const map: Record<string, string> = { 'traction': 'Trakčný', 'hydraulic': 'Hydraulický', 'mrl': 'MRL (Bez strojovne)', 'drum': 'Bubnový' };
      return map[val] || val;
  };
  const getDoorLabel = (val?: string) => {
      const map: Record<string, string> = { 'central': 'Automatické Centrálne', 'telescopic': 'Automatické Teleskopické', 'bus': 'Ručné + BUS (Sklápacie)' };
      return map[val || 'central'] || val;
  };
  
  const getTractionLabel = (val?: string) => {
      if (val === 'belts') return 'Pásy (Certifikované)';
      if (val === 'ctp') return 'CTP Laná (Plast)';
      return 'Oceľové laná';
  };
  
  const getSafetyMeasures = () => {
      const measures = [];
      if (data.pitDepth < 1100 || data.headroomHeight < 3400) {
          measures.push("Znížená hlava/priehlbeň (EN 81-21)");
      }
      if (data.liftType === 'invalid') {
          measures.push("Výbava invalid (EN 81-70)");
      }
      return measures;
  };

  const getEntrancesLabel = () => {
      const e = data.entrances || 'A';
      if (e === 'AB') return 'A+B (Prechodný 180°)';
      if (e === 'AC') return 'A+C (Prechodný 90°)';
      return 'A (Nepriechodný)';
  };

  const safetyMeasures = getSafetyMeasures();
  
  // Calculate Entrances correctly
  const numEntrances = data.numberOfEntrances || data.numberOfStops;
  
  // Calculate Wall Area for display
  const cabinHeight = data.cabinHeight || 2100;
  const wallArea = ((data.cabinWidth + data.cabinDepth) * 2 * cabinHeight / 1000000).toFixed(2);

  if (!isVisible) {
      return (
          <div className="mb-8 no-print p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-400 flex justify-between items-center hover:bg-gray-100 transition cursor-pointer" onClick={onToggleVisibility}>
              <span className="flex items-center gap-2 font-bold uppercase text-sm"><ClipboardList size={18}/> Technická špecifikácia (Skrytá)</span>
              <Eye size={20}/>
          </div>
      );
  }

  // Optimized Single Column Row - Compact Print Version (py-2 -> py-1)
  const DataRow = ({ label, value, subValue, highlight = false, isLast = false }: any) => (
      <div className={`flex items-baseline justify-between px-4 py-1 border-b border-gray-200 ${highlight ? 'bg-gray-50/80' : ''} ${isLast ? 'border-b-0' : ''}`}>
          <div className="w-1/3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{label}</span>
          </div>
          <div className="w-2/3 text-right">
              <div className="text-[13px] font-bold text-gray-900 leading-tight">{value}</div>
              {subValue && <div className="text-[10px] text-gray-500 font-medium mt-0.5">{subValue}</div>}
          </div>
      </div>
  );

  const Content = (
      <div className="bg-white flex flex-row items-stretch border-b border-gray-200">
          
          {/* LEFT COLUMN: SPECS (50%) - Determines Height */}
          <div className="w-1/2 flex flex-col border-r-2 border-gray-100">
              {/* Header */}
              <div className="px-4 py-2 border-b-2 border-gray-800 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-gray-900 text-white p-1 rounded">
                            <Settings size={14} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Technické Parametre</h3>
                    </div>
                    {!embedded && (
                      <button onClick={onToggleVisibility} className="text-gray-300 hover:text-blue-600 transition no-print">
                          <Eye size={16} />
                      </button>
                    )}
                  </div>
              </div>

              {/* Data Rows - Single Stack */}
              <div className="flex-col justify-start">
                  <DataRow label="Zariadenie" value={getLiftTypeLabel(data.liftType)} subValue={`Pohon: ${getDriveLabel(data.driveType)}`} highlight/>
                  <DataRow label="Nosnosť / Osoby" value={`${data.ratedLoad} kg`} subValue={`${data.numberOfPersons} osôb (podľa EN 81-20)`} />
                  <DataRow label="Kabína" value={data.cabinClass || 'FUN'} subValue="Povrch: Podľa vzorkovníka" highlight/>
                  
                  {/* UPDATED: Added Wall Area to SubValue */}
                  <DataRow label="Rozmery Kabíny" value={`${Math.round(data.cabinWidth)} x ${Math.round(data.cabinDepth)} mm`} subValue={`Výška: ${cabinHeight} mm (Steny: ${wallArea} m²)`} />
                  
                  <DataRow label="Dvere / Vstupy" value={getEntrancesLabel()} subValue={`${getDoorLabel(data.doorType)} (${data.doorWidth}x${data.doorOpeningHeight})`} highlight/>
                  <DataRow label="Rozmery Šachty" value={`${data.shaftWidth} x ${data.shaftDepth} mm`} subValue={`Hlava: ${data.headroomHeight} / Priehlbeň: ${data.pitDepth}`} />
                  
                  {/* UPDATED: Using correct numEntrances variable */}
                  <DataRow label="Zdvih / Stanice" value={`${(data.travelHeight/1000).toFixed(2)} m`} subValue={`${data.numberOfStops} Staníc / ${numEntrances} Nástupíšť`} highlight/>
                  
                  <DataRow label="Pohon / Riadenie" value="VVVF + CANopen 417" subValue={`Rýchlosť: ${data.ratedSpeed} m/s`} />
                  <DataRow label="Strojovňa" value={data.machineRoomPosition === 'head' ? 'Bez strojovne (MRL)' : 'Strojovňa'} subValue={`Napájanie: ${data.powerSupply}`} highlight/>
                  <DataRow label="Nosné prostriedky" value={getTractionLabel(data.tractionMedium)} subValue={`Lanovanie: ${data.suspensionType}`} isLast={true} />
              </div>

              {/* Footer (Notes/Safety) - Clean bottom block */}
              <div className="border-t-2 border-gray-800 bg-gray-50 p-2 mt-auto">
                  {safetyMeasures.length > 0 ? (
                      <div className="space-y-1">
                          {safetyMeasures.map((m, i) => (
                              <div key={i} className="flex items-start gap-2 text-[9px] font-bold text-red-700 uppercase">
                                  <AlertTriangle size={12} className="shrink-0 mt-0.5"/> <span>{m}</span>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-[9px] text-gray-400 uppercase font-bold flex items-center gap-2">
                          <ShieldCheck size={12}/> Plne v súlade s STN EN 81-20/50
                      </div>
                  )}
                  {data.notes && <div className="mt-1 text-[9px] italic text-gray-600 border-t border-gray-200 pt-1 leading-tight">{data.notes}</div>}
              </div>
          </div>

          {/* RIGHT COLUMN: SKETCH (50%) - Fits height of text automatically due to flex stretch */}
          <div className="w-1/2 bg-white flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[9px] font-bold uppercase px-2 py-1 z-10 rounded-bl border-b border-l border-gray-200">
                  Pôdorys
              </div>
              
              {/* Sketch Container - H-FULL to fill the flex container height determined by the text column */}
              <div className="flex-1 flex items-center justify-center p-0 h-full w-full">
                  <LiftLayoutSketch data={data} isVisible={true} />
              </div>
          </div>
      </div>
  );

  if (embedded) return <div className="border-2 border-gray-800 rounded-xl overflow-hidden shadow-sm bg-white">{Content}</div>;

  return (
    <div className="mb-8 break-inside-avoid border-2 border-gray-800 rounded-xl overflow-hidden shadow-md bg-white">
        {Content}
    </div>
  );
};
