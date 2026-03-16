
export interface QuoteItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number; 
  purchasePrice: number;
  vatRate: number;
  isSurcharge?: boolean; // New field for indenting items
}

export interface QuoteCategory {
  id: string;
  type: 'items' | 'text';
  name: string;
  items: QuoteItem[];
  textContent?: string;
  isExpanded: boolean;
  isHidden?: boolean; // Excluded from calc AND print
  isHiddenFromPrint?: boolean; // Included in calc, HIDDEN from print
  section?: 'lift' | 'shaft';
}

export type RailType = 'T45' | 'T50' | 'T70' | 'T75' | 'T82' | 'T89' | 'T90' | 'T114' | 'T125' | 'T127';

// New Interface for Cabin Classes
export interface CabinClass {
    id: string;
    name: string;
    description: string;
    linkedProductId?: string; // ID of the Catalog Set that represents this class
}

export interface LiftLayoutData {
  liftType: 'passenger' | 'freight' | 'home' | 'hospital' | 'invalid';
  driveType: 'traction' | 'hydraulic' | 'mrl' | 'drum';
  ratedLoad: number;
  numberOfPersons: number;
  ratedSpeed: number;
  powerSupply: string;

  shaftWidth: number;
  shaftDepth: number;
  cabinWidth: number;
  cabinDepth: number;
  cabinHeight: number; // ADDED: Configurable cabin height
  doorWidth: number;
  doorOffsetL: number;
  
  // NEW FIELDS
  doorOpeningWidth?: number; // DO
  doorOpeningHeight?: number; // VDO
  LDO?: number; // Left Door Opening (ostrenie)
  RDO?: number; // Right Door Opening (ostrenie)
  
  cabinClass?: string; 
  
  pitDepth: number;
  headroomHeight: number;
  travelHeight: number;

  doorType?: 'central' | 'telescopic' | 'bus';
  doorOperation?: 'automatic' | 'manual';
  doorFireRating?: 'EW60' | 'EI60' | 'EI120' | 'None';
  doorFinish?: 'RAL 7032' | 'Nerez Brus' | 'Nerez Lesk' | 'Skinplate';
  
  // NEW: Entrances logic A, AB, AC
  entrances: 'A' | 'AB' | 'AC';
  isThroughCar?: boolean; // Kept for legacy compatibility, derived from entrances

  counterWeightPosition: 'back' | 'left' | 'right';
  machineRoomPosition?: 'head' | 'above' | 'cabinet';
  suspensionType?: '1:1' | '2:1' | '4:1';
  tractionMedium?: 'ropes' | 'belts' | 'ctp';
  numberOfRopes?: number; // NEW: Explicit number of ropes/belts
  frameType?: 'central' | 'backpack';
  
  carDBG?: number;
  cwtDBG?: number;
  cwtWidth?: number;
  cwtDepth?: number;
  guideTypeCar?: RailType;
  guideTypeCwt?: RailType;
  guideRailLength?: 2500 | 5000; 
  
  bracketType?: 'standard' | 'combined';

  gapLeft: number;
  gapRight: number;
  gapRear: number;
  gapFront: number;

  stationLabels?: string;
  numberOfStops?: number;
  numberOfEntrances?: number; // NEW: Total number of entrances (stops * doors)
  startStation?: number;
  
  hasExternalShaft?: boolean;

  notes: string;
}

export type DocumentType = 'quote' | 'order' | 'contract';

export interface QuoteData {
  id: string;
  relatedDocId?: string;
  number: string;
  type: DocumentType;
  title: string;
  logoUrl?: string;
  date: string;
  validUntil: string;
  clientReference?: string;
  supplier: {
    name: string;
    details: string;
    email?: string;
    phone?: string;
  };
  client: {
    name: string;
    details: string;
    email?: string;
    phone?: string;
  };
  layout?: LiftLayoutData;
  showTechSpecs?: boolean;
  hideItemPrices?: boolean;
  categories: QuoteCategory[];
  terms: string;
  contractBody?: string;
  currency: string;
  lastUpdated?: number;
  globalMargin: number;
  workMargin?: number; // New field for separate work margin
  shaftMargin: number;
  vatRate?: number;
  wizardData?: any; // Stores the Material Calculator state (MaterialWizardData)
  csParams?: {
    systemName?: string;
    driveType?: string;
    machineManufacturer?: string;
    powerKw?: number;
    currentA?: number;
    brakePower?: string;
    doorType?: string;
    doorManufacturer?: string;
    doorControl?: string;
    controllerType?: string;
    placement?: string;
    cabinDisplay?: string;
    stationDisplay?: string;
    lopCutout?: string;
    copCutout?: string;
    stops?: number;
    travel?: number;
    headroom?: number;
    pit?: number;
    positioning?: string;
    keepLops?: boolean;
    keepCop?: boolean;
    cabinetType?: string;
    dimensions?: string;
    ipRating?: string;
    emergencyOp?: string;
    standards?: string;
  };
}

// --- Product Configuration Interface ---
export interface ProductAttributeOption {
    label: string;
    priceDelta: number;
    value: string | number;
}

export interface ProductAttribute {
    name: string;
    options: ProductAttributeOption[];
}

export interface ProductComponent {
    productId: string;
    quantity: number;
}
// --------------------------------------------

export interface Product {
  id: string;
  category: string; 
  subcategory?: string; 
  name: string;
  manufacturer?: string; 
  supplier?: string; 
  unit: string;
  price: number;
  type?: 'simple' | 'composite';
  priceType?: 'calculated' | 'fixed'; 
  displayMode?: 'itemized' | 'single_line';
  subProducts?: ProductComponent[];
  attributes?: ProductAttribute[];
}

export interface Client {
  id: string;
  name: string;
  details: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  details: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  type: 'lift' | 'shaft';
  data: {
    categories: QuoteCategory[];
    layout?: LiftLayoutData;
    margin?: number;
  };
}

export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
}

export interface AppSettings {
  nextCpSequence: number;
  nextObjSequence: number;
  nextPlSequence: number;
  defaultCategoryTexts?: Record<string, string>; // NEW: Dictionary of default texts for categories
}

export interface BackupData {
  version: number;
  appVersion: string;
  timestamp: number;
  settings: AppSettings;
  quotes: QuoteData[];
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  templates: QuoteTemplate[];
  contractTemplates?: ContractTemplate[];
  cabinClasses?: CabinClass[]; 
  customCategories?: string[];
}
