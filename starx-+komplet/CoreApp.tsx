import React, { useState, useEffect, useRef } from 'react';
import { 
  QuoteData, Product, Client, Supplier, QuoteTemplate, ContractTemplate, 
  AppSettings, QuoteCategory, LiftLayoutData, QuoteItem, RailType, DocumentType, CabinClass 
} from './types';
import { 
  Archive, X, Search, FileInput, FileCheck, Sliders, ArrowRightLeft, 
  Box, Settings, Calculator, Building, Upload, Users, LayoutTemplate, 
  Save, LogOut, ArrowRight, CheckCircle, Printer, Mail, Edit, PlusCircle, GripVertical, FileText, Percent, TrendingUp, Trash2, Coins, Euro, Info, DoorOpen, Zap, ShieldCheck, Ruler, Maximize, RefreshCw, Copy, Tag, Activity, Cpu
} from 'lucide-react';
import { ProductDatabaseModal } from './components/ProductDatabaseModal';
import { CatalogManagerModal } from './components/CatalogManagerModal';
import { ClientDatabaseModal } from './components/ClientDatabaseModal';
import { SupplierDatabaseModal } from './components/SupplierDatabaseModal';
import { TemplateDatabaseModal } from './components/TemplateDatabaseModal';
import { ContractRepositoryModal } from './components/ContractRepositoryModal';
import { SettingsModal } from './components/SettingsModal';
import { EmailModal } from './components/EmailModal';
import { MaterialCalculatorModal, MaterialWizardData } from './components/MaterialCalculatorModal';
import { CategoryTable } from './components/CategoryTable';
import { RichTextEditor } from './components/RichTextEditor';
import { TechSpecTable } from './components/TechSpecTable';
// LiftLayoutSketch is now used inside TechSpecTable, but we might keep import if used elsewhere
import { LiftLayoutSketch } from './components/LiftLayoutSketch';
import { StandaloneRichTextEditor } from './components/StandaloneRichTextEditor';
import { generateSuggestion } from './services/geminiService';
import { LoginGate } from './components/LoginGate';

// Constants
const APP_VERSION = "4.9.46 (Fix: Build & Duplicates)";

// INITIAL MASTER CATEGORIES - Default structure for new quotes
const DEFAULT_CATEGORIES_LIST = [
    'Dvere', 
    'Kabína a rám', 
    'Pohon', 
    'Vodítka a kotvenie', 
    'Obmedzovač', 
    'Elektro', 
    'Rozvádzač a riadenie', 
    'Montáž', 
    'Doprava', 
    'Balné',
    'Ostatné'
];

const DEFAULT_CABIN_CLASSES: CabinClass[] = [
    { id: 'fun', name: 'FUN', description: 'Laminát / RAL (Ekonomická)' },
    { id: 'sky', name: 'SKY', description: 'Prémiové materiály / Sklo' },
    { id: 'nerez', name: 'NEREZ', description: 'Celonerezové prevedenie' }
];

const DEFAULT_LAYOUT: LiftLayoutData = {
  liftType: 'passenger', driveType: 'traction', ratedLoad: 630, numberOfPersons: 8, ratedSpeed: 1.0, powerSupply: '400V / 50Hz',
  shaftWidth: 1600, shaftDepth: 1800, cabinWidth: 1100, cabinDepth: 1400, cabinHeight: 2100, doorWidth: 800, doorOffsetL: 0,
  pitDepth: 1100, headroomHeight: 3400, travelHeight: 15000,
  doorType: 'central', doorOperation: 'automatic', counterWeightPosition: 'back', machineRoomPosition: 'head',
  gapLeft: 270, gapRight: 80, gapFront: 210, gapRear: 50, notes: '',
  numberOfStops: 5, numberOfEntrances: 5, startStation: 0,
  tractionMedium: 'ctp', numberOfRopes: 5, frameType: 'central',
  hasExternalShaft: false,
  bracketType: 'combined',
  guideTypeCar: 'T89', guideTypeCwt: 'T50',
  guideRailLength: 5000,
  doorOpeningWidth: 1060, doorOpeningHeight: 2060,
  LDO: 270, RDO: 270, 
  suspensionType: '2:1',
  cabinClass: 'FUN',
  entrances: 'A', // Default to Front
  isThroughCar: false
};

const SHAFT_TEMPLATE: QuoteItem[] = [
    { id: 'sh1', description: 'Oceľová konštrukcia šachty (Jäklový profil zváraný, lakovaný)', unit: 'kg', quantity: 1500, unitPrice: 3.5, purchasePrice: 2.5, vatRate: 23 },
    { id: 'sh2', description: 'Opláštenie šachty (Bezpečnostné sklo / Sadrokartón)', unit: 'm2', quantity: 45, unitPrice: 85, purchasePrice: 60, vatRate: 23 },
    { id: 'sh3', description: 'Kotviaci materiál a spojovací materiál konštrukcie', unit: 'kpl', quantity: 1, unitPrice: 250, purchasePrice: 150, vatRate: 23 },
];

const SHAFT_DETAILS_HTML = `
<h3>Technická špecifikácia Oceľovej Konštrukcie (OK)</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
    <tbody>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; font-weight: bold; width: 40%;">Typ Konštrukcie</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Zváraná / Montovaná (Jäkl profil)</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; font-weight: bold;">Rozmery Profilov</td>
            <td style="border: 1px solid #ddd; padding: 8px;">100x100x4 mm (resp. podľa statiky)</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; font-weight: bold;">Povrchová úprava</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Prášková farba (Komaxit) - RAL podľa výberu</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; font-weight: bold;">Opláštenie</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Bezpečnostné sklo (VSG 4.4.2) / Číre</td>
        </tr>
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px; background-color: #f3f4f6; font-weight: bold;">Kotvenie</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Chemické kotvy do venca (Hilti/Fischer)</td>
        </tr>
    </tbody>
</table>
<p><em>Poznámka: Statický posudok je súčasťou dodávky.</em></p>
`;

const DEFAULT_CONTRACT_TEXT = `
<h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">ZMLUVA O DIELO č. [CISLO_DOKLADU]</h1>
<p style="text-align: center; font-style: italic;">uzavretá podľa § 536 a nasl. zákona č. 513/1991 Zb. Obchodný zákonník v znení neskorších predpisov</p>
<hr style="margin: 20px 0;">

<h3>I. Zmluvné strany</h3>
<table style="width: 100%; margin-bottom: 20px;">
<tr>
<td style="width: 50%; vertical-align: top; padding-right: 20px;">
    <strong>1.1 Zhotoviteľ:</strong><br>
    [NAZOV_DODAVATELA]<br>
    [DETAILY_DODAVATELA]<br>
    (ďalej len "Zhotoviteľ")
</td>
<td style="width: 50%; vertical-align: top;">
    <strong>1.2 Objednávateľ:</strong><br>
    [NAZOV_KLIENTA]<br>
    [DETAILY_KLIENTA]<br>
    (ďalej len "Objednávateľ")
</td>
</tr>
</table>

<h3>II. Predmet zmluvy</h3>
<p>2.1. Zhotoviteľ sa zaväzuje pre Objednávateľa vykonať dielo: <strong>Dodávka a montáž výťahového zariadenia</strong> podľa technickej špecifikácie, ktorá tvorí neoddeliteľnú Prílohu č. 1 tejto zmluvy.</p>
<p>2.2. Miesto plnenia: Podľa zadania Objednávateľa (adresa stavby).</p>
<p>2.3. Objednávateľ sa zaväzuje dielo prevziať a zaplatiť dohodnutú cenu podľa článku III.</p>

<h3>III. Cena diela a platobné podmienky</h3>
<p>3.1. Cena za zhotovenie diela je stanovená dohodou zmluvných strán v zmysle zákona o cenách č. 18/1996 Z.z. ako cena pevná a konečná.</p>
<p><strong>Celková cena diela: [CENA_CELKOM] s DPH</strong></p>
<p>3.2. Objednávateľ uhradí cenu diela na základe vystavených faktúr nasledovne:</p>
<ul>
    <li><strong>1. Zálohová platba (60%):</strong> Splatná pri podpise zmluvy. Slúži na objednanie materiálu.</li>
    <li><strong>2. Platba pred dodaním (30%):</strong> Splatná pred expedíciou technológie na stavbu.</li>
    <li><strong>3. Konečná platba (10%):</strong> Splatná po odovzdaní diela a vykonaní úradnej skúšky.</li>
</ul>

<h3>IV. Termín plnenia</h3>
<p>4.1. Zhotoviteľ dodá technológiu do <strong>8-10 týždňov</strong> od podpisu zmluvy, uhradenia prvej zálohovej platby a finálneho zamerania šachty.</p>
<p>4.2. Montážne práce budú realizované v trvaní cca <strong>15-20 pracovných dní</strong> od nástupu na montáž, za predpokladu stavebnej pripravenosti šachty.</p>

<h3>V. Súčinnosť a stavebná pripravenosť</h3>
<p>5.1. Objednávateľ zabezpečí na svoje náklady:</p>
<ul>
    <li>Stavebne pripravenú šachtu (omietnutú/vybielenú, bez prachu).</li>
    <li>Prívod elektrickej energie (400V/230V) do strojovne/rozvádzača.</li>
    <li>Montážny hák v strope šachty (nosnosť min. 1500 kg).</li>
    <li>Uzamykateľný sklad pre materiál v blízkosti šachty.</li>
</ul>

<h3>VI. Záruka a servis</h3>
<p>6.1. Zhotoviteľ poskytuje na dielo záruku v trvaní <strong>24 mesiacov</strong>. Záručná doba začína plynúť dňom odovzdania diela.</p>
<p>6.2. Podmienkou platnosti záruky je vykonávanie pravidelného odborného servisu Zhotoviteľom v zmysle platných noriem STN.</p>

<h3>VII. Záverečné ustanovenia</h3>
<p>7.1. Táto zmluva nadobúda platnosť a účinnosť dňom podpisu oboma zmluvnými stranami.</p>
<p>7.2. Zmluva je vyhotovená v dvoch rovnopisoch, z ktorých každá strana obdrží jeden.</p>

<br><br>
<table style="width: 100%; margin-top: 40px;">
<tr>
<td style="width: 50%; text-align: center;">
    .............................................<br>
    <strong>Za Zhotoviteľa</strong><br>
    <span style="font-size: 10px;">(Podpis a pečiatka)</span>
</td>
<td style="width: 50%; text-align: center;">
    .............................................<br>
    <strong>Za Objednávateľa</strong><br>
    <span style="font-size: 10px;">(Podpis a pečiatka)</span>
</td>
</tr>
</table>
`;

const DEFAULT_TERMS_HTML = `
<p><strong>1. Platnosť cenovej ponuky:</strong> 30 dní odo dňa vystavenia.</p>
<p><strong>2. Dodacie podmienky:</strong></p>
<ul style="margin-bottom: 8px;">
    <li>Dodacia lehota technológie: <strong>8-12 týždňov</strong> od podpisu zmluvy a uhradenia zálohy.</li>
    <li>Montážne práce: cca <strong>15-20 pracovných dní</strong> (závisí od počtu staníc a typu).</li>
    <li>Miesto dodania: Stavba (podľa dispozícií objednávateľa).</li>
</ul>
<p><strong>3. Platobné podmienky:</strong></p>
<ul style="margin-bottom: 8px;">
    <li>60% zálohová platba pri objednaní diela.</li>
    <li>30% platba pred expedíciou materiálu na stavbu.</li>
    <li>10% konečná platba po odovzdaní diela a vykonaní úradnej skúšky.</li>
</ul>
<p><strong>4. Stavebná pripravenosť (Zabezpečuje objednávateľ):</strong></p>
<ul style="margin-bottom: 8px;">
    <li>Stavebne pripravená šachta (omietnutá, vybielená) podľa výkresovej dokumentácie.</li>
    <li>Prívod elektrickej energie (400V / 230V) v mieste rozvádzača/strojovne.</li>
    <li>Osvetlenie šachty a prístupových ciest.</li>
    <li>Montážny hák v strope šachty (nosnosť min. 1500 kg).</li>
    <li>Uzamykateľný sklad pre materiál v blízkosti šachty (cca 15-20 m²).</li>
</ul>
<p><strong>5. Záruka:</strong> 24 mesiacov na technológiu a montážne práce (pri dodržaní servisných podmienok).</p>
<p><em>V cene nie sú zahrnuté stavebné úpravy, murárske práce ani likvidácia pôvodného výťahu, pokiaľ nie je v položkách uvedené inak.</em></p>
`;

const railTypes: RailType[] = ['T45', 'T50', 'T70', 'T75', 'T82', 'T89', 'T90', 'T114', 'T125', 'T127'];

// --- SAFE ID GENERATOR ---
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- EN 81-20 HELPER (STRICT TABLE) ---
// UPDATED: Now supports variable height for accurate wall area calculation
const calculateEn8120 = (width: number, depth: number, height: number = 2100) => {
    const area = (width * depth) / 1000000;
    const perimeter = (width + depth) * 2;
    const wallArea = (perimeter * height) / 1000000;
    
    // EN 81-20 Table 6 (Strict Lookup)
    // Mapujeme MAXIMÁLNU plochu pre danú nosnosť.
    const standards = [
        { maxArea: 0.37, load: 100, persons: 1 },
        { maxArea: 0.58, load: 180, persons: 2 },
        { maxArea: 0.70, load: 225, persons: 3 },
        { maxArea: 0.90, load: 300, persons: 4 },
        { maxArea: 1.10, load: 375, persons: 5 },
        { maxArea: 1.17, load: 400, persons: 5 },
        { maxArea: 1.30, load: 450, persons: 6 },
        { maxArea: 1.45, load: 525, persons: 7 },
        { maxArea: 1.60, load: 600, persons: 8 },
        { maxArea: 1.66, load: 630, persons: 8 },
        { maxArea: 1.75, load: 675, persons: 9 },
        { maxArea: 1.90, load: 750, persons: 10 },
        { maxArea: 2.00, load: 800, persons: 10 },
        { maxArea: 2.05, load: 825, persons: 11 },
        { maxArea: 2.20, load: 900, persons: 12 },
        { maxArea: 2.35, load: 975, persons: 13 },
        { maxArea: 2.40, load: 1000, persons: 13 },
        { maxArea: 2.50, load: 1050, persons: 14 },
        { maxArea: 2.65, load: 1125, persons: 15 },
        { maxArea: 2.80, load: 1200, persons: 16 },
        { maxArea: 2.90, load: 1250, persons: 16 },
        { maxArea: 2.95, load: 1275, persons: 17 },
        { maxArea: 3.10, load: 1350, persons: 18 },
        { maxArea: 3.25, load: 1425, persons: 19 },
        { maxArea: 3.40, load: 1500, persons: 20 },
        { maxArea: 3.56, load: 1600, persons: 21 },
        { maxArea: 4.20, load: 2000, persons: 26 }
    ];

    // Find first standard where current area fits (Minimum Rated Load for Area)
    let result = standards.find(s => area <= s.maxArea);

    let suggestedLoad = 0;
    let persons = 0;

    if (result) {
        suggestedLoad = result.load;
        persons = result.persons;
    } else {
        // Fallback for huge lifts > 2000kg
        // EN 81-20: For each 100kg over 2000kg, add 0.16 m2
        // Load = 2000 + ((Area - 4.20) / 0.16) * 100
        const extraArea = area - 4.20;
        const extraLoadSteps = Math.ceil(extraArea / 0.16);
        suggestedLoad = 2000 + (extraLoadSteps * 100);
        persons = Math.round(suggestedLoad / 75);
    }

    return { area, wallArea, suggestedLoad, persons };
};

export const App: React.FC = () => {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('auth'));
  
  // State
  const [data, setData] = useState<QuoteData>({
    id: generateId(), number: 'CP_SK_001_24_BA', type: 'quote', title: 'Cenová Ponuka - Výťah',
    date: new Date().toISOString().split('T')[0], validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    clientReference: '', // Initial empty reference
    supplier: { name: 'Moja Firma s.r.o.', details: 'IČO: 12345678, DPH: SK12345678' },
    client: { name: '', details: '' },
    layout: { ...DEFAULT_LAYOUT },
    categories: [], // Initialized in useEffect to respect settings
    terms: DEFAULT_TERMS_HTML,
    currency: '€',
    globalMargin: 15,
    shaftMargin: 20,
    vatRate: 23, 
    hideItemPrices: true, 
    showTechSpecs: true, 
    contractBody: DEFAULT_CONTRACT_TEXT
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [contractTemplates, setContractTemplates] = useState<ContractTemplate[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ nextCpSequence: 1, nextObjSequence: 1, nextPlSequence: 1 });
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);
  
  // Available Categories
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES_LIST);
  
  // CABIN CLASSES
  const [cabinClasses, setCabinClasses] = useState<CabinClass[]>(DEFAULT_CABIN_CLASSES);

  // Admin Edit State
  const [isNumberEditable, setIsNumberEditable] = useState(false);

  // UI State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isContractRepoOpen, setIsContractRepoOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  
  const [showArchive, setShowArchive] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  
  const [templateModalMode, setTemplateModalMode] = useState<'select' | 'save'>('select');
  const [templateContext, setTemplateContext] = useState<'lift' | 'shaft'>('lift');
  
  const [emailModalProps, setEmailModalProps] = useState({ to: '', subject: '', message: '' });
  
  const [calcSuccess, setCalcSuccess] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<string | false>(false);
  const [showLayout, setShowLayout] = useState(true);
  const [hasShaft, setHasShaft] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // DRAG AND DROP STATE
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);

  const printContentRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // Derived state
  const isContractMode = data.type === 'contract';
  const isOrderMode = data.type === 'order';
  const relatedDoc = savedQuotes.find(q => q.id === data.relatedDocId); // LINKING VISUALIZATION
  
  // Helper for Area Calculation Display - PASS DYNAMIC HEIGHT
  const currentAreaInfo = calculateEn8120(data.layout?.cabinWidth || 0, data.layout?.cabinDepth || 0, data.layout?.cabinHeight || 2100);

  // --- DYNAMIC TITLE UPDATE ---
  useEffect(() => {
      document.title = `${data.number} ${data.clientReference ? `- ${data.clientReference}` : ''} | SmartQuote`;
  }, [data.number, data.clientReference]);

  // ... (REST OF useEffects and handlers same as before) ...
  useEffect(() => {
      const storedQuotes = localStorage.getItem('smartquote_archive');
      if (storedQuotes) {
          try {
              const parsed = JSON.parse(storedQuotes);
              // DEDUPLICATE ON LOAD
              const uniqueQuotes = Array.from(new Map(parsed.map((item: QuoteData) => [item.id, item])).values());
              setSavedQuotes(uniqueQuotes);
          } catch (e) { console.error("Failed to load archive", e); }
      }
      
      const storedSettings = localStorage.getItem('smartquote_settings');
      let loadedSettings: AppSettings = { nextCpSequence: 1, nextObjSequence: 1, nextPlSequence: 1 };
      
      if (storedSettings) {
          try {
              const parsedSettings = JSON.parse(storedSettings);
              setSettings(parsedSettings);
              loadedSettings = parsedSettings;
              
              // FIX: IMMEDIATELY UPDATE NUMBER IF IT IS THE DEFAULT PLACEHOLDER
              if (data.number === 'CP_SK_001_24_BA' && data.type === 'quote') {
                  const year = new Date().getFullYear().toString().slice(-2);
                  const seq = parsedSettings.nextCpSequence || 1;
                  const numStr = seq.toString().padStart(3, '0');
                  const newNum = `CP_SK_${numStr}_${year}_BA`;
                  setData(prev => ({...prev, number: newNum}));
              }

          } catch (e) { console.error("Failed to load settings", e); }
      }
      
      // Initialize categories with defaults IF empty (first load)
      if (data.categories.length === 0) {
          const initCats: QuoteCategory[] = DEFAULT_CATEGORIES_LIST.map(name => ({
                id: generateId(),
                type: 'items',
                name: name,
                items: [],
                isExpanded: true,
                section: 'lift',
                textContent: loadedSettings.defaultCategoryTexts?.[name] || undefined // Inject default text
          }));
          setData(prev => ({...prev, categories: initCats}));
      }
      
      const storedProducts = localStorage.getItem('smartquote_products');
      let loadedProducts: Product[] = [];
      if (storedProducts) {
          try {
              loadedProducts = JSON.parse(storedProducts);
              setProducts(loadedProducts);
          } catch (e) { console.error("Failed to load products", e); }
      }
      
      // FIX: LOAD CLIENTS AND SUPPLIERS FROM STORAGE
      const storedClients = localStorage.getItem('smartquote_clients');
      if (storedClients) {
          try {
              setClients(JSON.parse(storedClients));
          } catch (e) { console.error("Failed to load clients", e); }
      }

      const storedSuppliers = localStorage.getItem('smartquote_suppliers');
      if (storedSuppliers) {
          try {
              setSuppliers(JSON.parse(storedSuppliers));
          } catch (e) { console.error("Failed to load suppliers", e); }
      }
      
      const storedCategories = localStorage.getItem('smartquote_categories');
      if (storedCategories) {
          try {
              let savedCats = JSON.parse(storedCategories);
              const productCategories = new Set(loadedProducts.map(p => p.category));
              const mergedCategories = new Set([...DEFAULT_CATEGORIES_LIST, ...savedCats, ...productCategories]);
              setAvailableCategories(Array.from(mergedCategories));
          } catch (e) { console.error("Failed to load categories", e); }
      } else {
          const productCategories = new Set(loadedProducts.map(p => p.category));
          const mergedCategories = new Set([...DEFAULT_CATEGORIES_LIST, ...productCategories]);
          setAvailableCategories(Array.from(mergedCategories));
      }
      
      const storedCabinClasses = localStorage.getItem('smartquote_cabin_classes');
      if (storedCabinClasses) {
          try {
              setCabinClasses(JSON.parse(storedCabinClasses));
          } catch (e) { console.error("Failed to load cabin classes", e); }
      }

      const storedTemplates = localStorage.getItem('smartquote_templates');
      if (storedTemplates) {
          try {
              setTemplates(JSON.parse(storedTemplates));
          } catch (e) { console.error("Failed to load templates", e); }
      }

      const storedContractTemplates = localStorage.getItem('smartquote_contract_templates');
      if (storedContractTemplates) {
          try {
              setContractTemplates(JSON.parse(storedContractTemplates));
          } catch (e) { console.error("Failed to load contract templates", e); }
      }
  }, []);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_archive', JSON.stringify(savedQuotes)); } 
      catch(e) { console.error("Storage full", e); alert("POZOR: Pamäť prehliadača je plná! Doklad sa nepodarilo uložiť do lokálnej pamäte. Odporúčame vykonať Zálohu (Export) a prečistiť staré doklady."); } 
  }, [savedQuotes]);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_settings', JSON.stringify(settings)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť nastavenia! Pamäť je plná."); } 
  }, [settings]);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_products', JSON.stringify(products)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť produkty! Pamäť je plná."); } 
  }, [products]);
  
  // FIX: SAVE CLIENTS AND SUPPLIERS TO STORAGE
  useEffect(() => { 
      try { localStorage.setItem('smartquote_clients', JSON.stringify(clients)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť klientov! Pamäť je plná."); } 
  }, [clients]);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_suppliers', JSON.stringify(suppliers)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť dodávateľov! Pamäť je plná."); } 
  }, [suppliers]);
  
  useEffect(() => { 
      try { localStorage.setItem('smartquote_categories', JSON.stringify(availableCategories)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť kategórie! Pamäť je plná."); } 
  }, [availableCategories]);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_cabin_classes', JSON.stringify(cabinClasses)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť triedy kabín! Pamäť je plná."); } 
  }, [cabinClasses]);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_templates', JSON.stringify(templates)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť šablóny! Pamäť je plná."); } 
  }, [templates]);

  useEffect(() => { 
      try { localStorage.setItem('smartquote_contract_templates', JSON.stringify(contractTemplates)); } 
      catch(e) { console.error(e); alert("CHYBA: Nepodarilo sa uložiť šablóny zmlúv! Pamäť je plná."); } 
  }, [contractTemplates]);

  // --- HELPER: Identify Work Categories ---
  const isWorkCategory = (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes('montáž') || lower.includes('doprava') || lower.includes('inštalácia') || lower.includes('demontáž') || lower.includes('skúšky') || lower.includes('revízia') || lower.includes('projekt') || lower.includes('zaškolenie');
  };

  const calculateTotals = () => {
      let totalSelling = 0; let totalPurchase = 0; 
      let liftCost = 0; let liftSale = 0; 
      let shaftCost = 0; let shaftSale = 0;
      let workCost = 0; let workSale = 0;

      data.categories.forEach(cat => {
          if (cat.isHidden) return;
          
          const isWork = isWorkCategory(cat.name);
          const margin = isWork ? (data.workMargin ?? 0) : (cat.section === 'shaft' ? data.shaftMargin : data.globalMargin);

          cat.items.forEach(item => {
              const itemTotalCost = item.quantity * item.unitPrice; 
              const itemTotalSale = itemTotalCost * (1 + margin / 100);
              
              if (isWork) {
                  workCost += itemTotalCost; workSale += itemTotalSale;
              } else if (cat.section === 'shaft') { 
                  shaftCost += itemTotalCost; shaftSale += itemTotalSale; 
              } else { 
                  liftCost += itemTotalCost; liftSale += itemTotalSale; 
              }
          });
      });
      
      totalPurchase = liftCost + shaftCost + workCost; 
      totalSelling = liftSale + shaftSale + workSale;
      const vatRate = data.vatRate ?? 23; 
      
      return { 
          totalPurchase, totalSelling, 
          liftCost, liftSale, liftProfit: liftSale - liftCost, 
          shaftCost, shaftSale, shaftProfit: shaftSale - shaftCost, 
          workCost, workSale, workProfit: workSale - workCost,
          vat: totalSelling * (vatRate / 100), 
          gross: totalSelling * (1 + vatRate / 100) 
      };
  };
  const totals = calculateTotals();

  const handleLogin = () => { sessionStorage.setItem('auth', 'true'); setIsAuthenticated(true); };
  const handleLogout = () => { sessionStorage.removeItem('auth'); setIsAuthenticated(false); }

  useEffect(() => {
      if (data.layout && (!data.layout.stationLabels || data.layout.stationLabels.length === 0)) {
          const stops = data.layout.numberOfStops || 2;
          const start = data.layout.startStation || 0;
          const labels = Array.from({length: stops}, (_, i) => i + start).join(',');
          handleLayoutChange('stationLabels', labels);
      }
  }, [data.layout?.numberOfStops, data.layout?.startStation]);

  useEffect(() => {
      const year = new Date().getFullYear().toString().slice(-2);
      if (!data.number.includes(year)) {
          if (data.categories.length === 0 && data.type === 'quote') {
              const num = generateDocNumber('quote');
              setData(prev => ({...prev, number: num}));
          }
      }
  }, []);

  const handleAddCategory = (name: string) => { 
      if (name && !availableCategories.includes(name)) { 
          setAvailableCategories([...availableCategories, name]); 
      } 
  };
  const handleDeleteCategory = (name: string) => { setAvailableCategories(availableCategories.filter(c => c !== name)); };
  const handleAddCabinClass = (cc: CabinClass) => setCabinClasses([...cabinClasses, cc]);
  const handleDeleteCabinClass = (id: string) => setCabinClasses(cabinClasses.filter(c => c.id !== id));
  const handleUpdateCabinClass = (updatedClass: CabinClass) => { setCabinClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c)); };

  const getRailTypesForLoad = (load: number): { car: RailType, cwt: RailType } => {
      let carRail: RailType = 'T70'; let cwtRail: RailType = 'T50';
      if (load < 450) { carRail = 'T70'; cwtRail = 'T50'; }
      else if (load >= 450 && load < 630) { carRail = 'T75'; cwtRail = 'T50'; }
      else if (load >= 630 && load < 1000) { carRail = 'T89'; cwtRail = 'T50'; }
      // Extended T90 range to include 1275kg as requested to avoid T125
      else if (load >= 1000 && load <= 1275) { carRail = 'T90'; cwtRail = 'T70'; }
      else if (load > 1275) { carRail = 'T125'; cwtRail = 'T90'; }
      return { car: carRail, cwt: cwtRail };
  };

  const handleLayoutChange = (field: keyof LiftLayoutData, value: any) => {
      setData(prev => {
          const newData = { ...prev, layout: { ...prev.layout!, [field]: value } };
          if (field === 'entrances') { newData.layout.isThroughCar = (value === 'AB' || value === 'AC'); }
          if (field === 'shaftWidth' || field === 'doorOpeningWidth') {
              const sw = field === 'shaftWidth' ? value : prev.layout?.shaftWidth || 0;
              const doW = field === 'doorOpeningWidth' ? value : prev.layout?.doorOpeningWidth || 0;
              if (sw > 0 && doW > 0 && sw > doW) {
                  const remainder = sw - doW;
                  const half = Math.floor(remainder / 2);
                  newData.layout.LDO = half;
                  newData.layout.RDO = remainder - half;
              }
          }
          else if (field === 'LDO') {
              const sw = prev.layout?.shaftWidth || 0;
              const doW = prev.layout?.doorOpeningWidth || 0;
              const newLDO = value;
              if (sw > 0 && doW > 0) { newData.layout.RDO = Math.max(0, sw - doW - newLDO); }
          }
          else if (field === 'RDO') {
              const sw = prev.layout?.shaftWidth || 0;
              const doW = prev.layout?.doorOpeningWidth || 0;
              const newRDO = value;
              if (sw > 0 && doW > 0) { newData.layout.LDO = Math.max(0, sw - doW - newRDO); }
          }
          if (field === 'cabinWidth' || field === 'cabinDepth') {
               const width = field === 'cabinWidth' ? value : prev.layout?.cabinWidth || 0;
               const depth = field === 'cabinDepth' ? value : prev.layout?.cabinDepth || 0;
               // DO NOT SWITCH RAILS AUTOMATICALLY HERE!
          }
          if (field === 'ratedLoad') {
              // DO NOT SWITCH RAILS AUTOMATICALLY HERE!
          }
          if (field === 'numberOfStops' || field === 'startStation') {
              const stops = field === 'numberOfStops' ? value : prev.layout?.numberOfStops || 2;
              const start = field === 'startStation' ? value : prev.layout?.startStation || 0;
              const labels = Array.from({length: stops}, (_, i) => i + start).join(',');
              newData.layout!.stationLabels = labels;
              
              // IF ENTRANCE IS A (Not through), sync entrances with stops
              if (newData.layout.entrances === 'A') {
                  newData.layout.numberOfEntrances = stops;
              }
          }
          // IF SWITCHING TO 'A', force sync
          if (field === 'entrances' && value === 'A') {
              newData.layout.numberOfEntrances = newData.layout.numberOfStops;
          }
          
          return newData;
      });
  };
  
  const handleToggleExternalShaft = (checked: boolean) => {
      handleLayoutChange('hasExternalShaft', checked);
      if (checked) {
          const exists = data.categories.find(c => c.name === 'Oceľová konštrukcia');
          if (!exists) { addCategory('items', 'Oceľová konštrukcia', SHAFT_TEMPLATE, 'shaft', SHAFT_DETAILS_HTML); }
      }
  };

  // --- NEW: FORCE RECALC FUNCTION ---
  const handleRecalculateLoad = () => {
      if (!data.layout) return;
      // Get current dimensions
      const { cabinWidth, cabinDepth } = data.layout;
      
      // Calculate
      const { suggestedLoad, persons } = calculateEn8120(cabinWidth, cabinDepth);
      
      // Update
      setData(prev => ({ 
          ...prev, 
          layout: { 
              ...prev.layout!, 
              ratedLoad: suggestedLoad,       
              numberOfPersons: persons        
          } 
      }));
      alert(`Prepočítané pre plochu ${((cabinWidth*cabinDepth)/1000000).toFixed(2)} m²:\nNosnosť: ${suggestedLoad} kg\nOsoby: ${persons}`);
  };

  const handleAddProduct = (p: Product) => { setProducts(prev => { const newProducts = [...prev, p]; if (!availableCategories.includes(p.category)) { setAvailableCategories(prevCats => [...prevCats, p.category]); } return newProducts; }); };
  const handleUpdateProduct = (p: Product) => { setProducts(prev => prev.map(prod => prod.id === p.id ? p : prod)); };
  const handleDeleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));
  
  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const imported: any = JSON.parse(e.target?.result as string);
              if (imported.products) setProducts(imported.products);
              if (imported.clients) setClients(imported.clients);
              if (imported.suppliers) setSuppliers(imported.suppliers);
              if (imported.templates) setTemplates(imported.templates);
              if (imported.settings) setSettings(imported.settings);
              if (imported.savedQuotes) {
                  const uniqueImported = Array.from(new Map(imported.savedQuotes.map((q: QuoteData) => [q.id, q])).values());
                  setSavedQuotes(uniqueImported);
              }
              if (imported.contractTemplates) setContractTemplates(imported.contractTemplates);
              if (imported.customCategories && Array.isArray(imported.customCategories)) {
                  const importedCats = imported.customCategories as string[];
                  const mergedCats = Array.from(new Set<string>([...DEFAULT_CATEGORIES_LIST, ...importedCats]));
                  setAvailableCategories(mergedCats);
              } else if (imported.products && Array.isArray(imported.products)) {
                  const productsList = imported.products as any[];
                  const prodCats = productsList.map((p: any) => p.category);
                  const mergedCats = Array.from(new Set<string>([...DEFAULT_CATEGORIES_LIST, ...prodCats]));
                  setAvailableCategories(mergedCats);
              }
              if (imported.cabinClasses) setCabinClasses(imported.cabinClasses);
              if (imported.data) setData(imported.data);
              alert("Dáta boli úspešne obnovené.");
          } catch (err) { console.error(err); alert("Chyba pri importe súboru."); }
      };
      reader.readAsText(file);
  };
  
  const handleImportCatalog = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const importedProducts = (JSON.parse(e.target?.result as string) as any) as any[];
              if (Array.isArray(importedProducts)) {
                  const newProductMap = new Map(products.map(p => [p.id, p]));
                  importedProducts.forEach((p: any) => newProductMap.set(p.id, p));
                  const finalProducts = Array.from(newProductMap.values());
                  setProducts(finalProducts);
                  const newCats = new Set(availableCategories);
                  finalProducts.forEach((p: any) => newCats.add(p.category));
                  setAvailableCategories(Array.from(newCats));
                  alert(`Katalóg úspešne aktualizovaný (${importedProducts.length} produktov).`);
              } else { alert("Chybný formát súboru."); }
          } catch (err) { console.error(err); alert("Chyba pri čítaní súboru."); }
      };
      reader.readAsText(file);
  };

  const handleSelectProduct = (p: Product) => { setIsProductModalOpen(false); };

  const handleMaterialWizardInsert = (wData: MaterialWizardData) => {
      setData(prev => {
          const newData = { 
              ...prev, 
              wizardData: wData // SAVE WIZARD STATE HERE
          };
          const activeCategoryNames = new Set(wData.categoryOrder);
          if (wData.includeAssembly) activeCategoryNames.add('Montáž'); else activeCategoryNames.delete('Montáž');
          if (wData.includeTransport) activeCategoryNames.add('Doprava'); else activeCategoryNames.delete('Doprava');
          if (wData.includePackaging) activeCategoryNames.add('Balné'); else activeCategoryNames.delete('Balné');
          newData.categories = newData.categories.filter(c => {
              if (c.type === 'text') return true;
              if (c.name === 'Oceľová konštrukcia' && newData.layout?.hasExternalShaft) return true;
              return activeCategoryNames.has(c.name);
          });
          newData.categories.forEach(c => { if (activeCategoryNames.has(c.name) && c.type === 'items') { c.items = []; } });
          activeCategoryNames.forEach(catName => {
               if (!catName) return;
               let cat = newData.categories.find(c => c.name === catName);
               if (!cat) {
                   // Create new category if not exists
                   cat = { 
                       id: generateId(), 
                       name: catName, 
                       type: 'items', 
                       items: [], 
                       isExpanded: true, 
                       section: catName === 'Oceľová konštrukcia' ? 'shaft' : 'lift',
                       // INJECT DEFAULT TEXT FROM SETTINGS IF AVAILABLE
                       textContent: settings.defaultCategoryTexts?.[catName]
                   };
                   newData.categories.push(cat);
               }
          });
          const findCat = (namePart: string) => newData.categories.find(c => c.name === namePart);
          wData.items.forEach(bomItem => {
              if (!activeCategoryNames.has(bomItem.category)) return;
              const category = findCat(bomItem.category);
              if (category) {
                  const product = bomItem.productId ? products.find(p => p.id === bomItem.productId) : null;
                  if (product && product.type === 'composite') {
                      if (product.displayMode === 'single_line') {
                          category.items.push({ id: generateId(), description: product.name, unit: product.unit, quantity: bomItem.quantity, unitPrice: product.price, purchasePrice: 0, vatRate: 23 });
                      } else {
                          if (product.subProducts && product.subProducts.length > 0) {
                              product.subProducts.forEach(sub => {
                                  const subP = products.find(p => p.id === sub.productId);
                                  if (subP) { category.items.push({ id: generateId(), description: subP.name, unit: subP.unit, quantity: bomItem.quantity * sub.quantity, unitPrice: subP.price, purchasePrice: 0, vatRate: 23 }); }
                              });
                          } else {
                              category.items.push({ id: generateId(), description: product.name, unit: product.unit, quantity: bomItem.quantity, unitPrice: product.price, purchasePrice: 0, vatRate: 23 });
                          }
                      }
                  } else {
                      category.items.push({ id: generateId(), description: bomItem.description, unit: bomItem.unit, quantity: bomItem.quantity, unitPrice: bomItem.price || 0, purchasePrice: 0, vatRate: 23 });
                  }
              }
          });
          if (wData.includeAssembly) { const cat = findCat('Montáž'); if (cat && cat.items.length === 0) { cat.items.push({ id: generateId(), description: 'Montáž výťahovej technológie', unit: 'kpl', quantity: 1, unitPrice: 1500, purchasePrice: 0, vatRate: 23 }); } }
          
          // USE CUSTOM PRICES FOR TRANSPORT AND PACKAGING
          if (wData.includeTransport) { 
              const cat = findCat('Doprava'); 
              if (cat && cat.items.length === 0) { 
                  cat.items.push({ id: generateId(), description: 'Doprava materiálu na stavbu', unit: 'kpl', quantity: 1, unitPrice: wData.transportPrice || 200, purchasePrice: 0, vatRate: 23 }); 
              } 
          }
          if (wData.includePackaging) { 
              const cat = findCat('Balné'); 
              if (cat && cat.items.length === 0) { 
                  cat.items.push({ id: generateId(), description: 'Balné a manipulácia', unit: 'kpl', quantity: 1, unitPrice: wData.packagingPrice || 50, purchasePrice: 0, vatRate: 23 }); 
              } 
          }
          return newData;
      });
  };

  const handleLoadTemplate = (template: QuoteTemplate) => {
      setData(prev => ({ ...prev, categories: [...prev.categories, ...template.data.categories.map(c => ({...c, id: generateId(), items: c.items.map(i => ({...i, id: generateId()}))}))] }));
      setIsTemplateModalOpen(false);
  };
  const handleSaveTemplate = (name: string, type: 'lift' | 'shaft') => {
      const newTemplate: QuoteTemplate = { id: generateId(), name, type, data: { categories: data.categories.filter(c => c.section === type), layout: data.layout, margin: type === 'shaft' ? data.shaftMargin : data.globalMargin } };
      setTemplates([...templates, newTemplate]);
  };
  const handleDeleteTemplate = (id: string) => setTemplates(templates.filter(t => t.id !== id));
  const handleSelectContractTemplate = (content: string) => { setData(prev => ({ ...prev, contractBody: content })); setIsContractRepoOpen(false); };
  const handleSaveContractTemplate = (name: string) => { setContractTemplates([...contractTemplates, { id: generateId(), name, content: data.contractBody || '' }]); };
  const handleDeleteContractTemplate = (id: string) => setContractTemplates(contractTemplates.filter(t => t.id !== id));
  const handleSaveSettings = (newSettings: AppSettings) => setSettings(newSettings);
  
  const handleExportData = () => {
      const blob = new Blob([JSON.stringify({ data, products, clients, suppliers, templates, settings, savedQuotes, contractTemplates, customCategories: availableCategories, cabinClasses: cabinClasses }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `smartquote-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
  };
  
  const handleFactoryReset = () => {
      setProducts([]); setClients([]); setSuppliers([]); setTemplates([]); setSavedQuotes([]); setAvailableCategories(DEFAULT_CATEGORIES_LIST); setCabinClasses(DEFAULT_CABIN_CLASSES); setSettings({ nextCpSequence: 1, nextObjSequence: 1, nextPlSequence: 1 }); setData({...data, id: generateId(), categories: []}); localStorage.clear(); window.location.reload();
  };

  const handleSendEmail = (to: string, subject: string, message: string) => { window.open(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`); setIsEmailModalOpen(false); };
  
  const openEmailModal = () => { 
      setEmailModalProps({ 
          to: data.client.email || '', 
          subject: `${data.number} - ${data.title}`, 
          message: `Vážený obchodný partner,\n\nv nadväznosti na Váš dopyt Vám v prílohe zasielame cenovú ponuku č. ${data.number}.\nProjekt: ${data.clientReference || 'Neuvedený'}\n\nVeríme, že naša ponuka splní Vaše očakávan a tešíme sa na prípadnú spoluprácu.\n\nV prípade akýchkoľvek otázok nás neváhajte kontaktovať.\n\nS úctou,\n\n${data.supplier.name}\n${data.supplier.email || ''}\n${data.supplier.phone || ''}` 
      }); 
      setIsEmailModalOpen(true); 
  };

  const generateDocNumber = (type: 'quote' | 'order' | 'contract') => {
      const year = new Date().getFullYear().toString().slice(-2);
      let seq = 1; let prefix = 'CP';
      if (type === 'quote') { seq = settings.nextCpSequence; prefix = 'CP'; }
      if (type === 'order') { seq = settings.nextObjSequence; prefix = 'OBJ'; }
      if (type === 'contract') { seq = settings.nextPlSequence; prefix = 'PL'; }
      const numStr = seq.toString().padStart(3, '0');
      return `${prefix}_SK_${numStr}_${year}_BA`;
  };

  const handleUnlockNumber = () => { const code = prompt("Zadajte admin kód pre úpravu čísla:"); if (code === '123') { setIsNumberEditable(true); } else if (code !== null) { alert("Nesprávny kód"); } };

  const handleSaveCurrentQuote = () => {
      const now = Date.now();
      const quoteToSave = { ...data, lastUpdated: now };
      
      // CHECK FOR DUPLICATE NUMBER (Collision Check)
      const existingWithSameNumber = savedQuotes.find(q => q.number === data.number && q.id !== data.id);
      
      if (existingWithSameNumber) {
          if (!window.confirm(`POZOR: Doklad s číslom ${data.number} už v archíve existuje (pod iným ID)! Chcete ho prepísať?`)) {
              return; // Cancel save
          }
          // Remove the old one to avoid duplicates
          const filtered = savedQuotes.filter(q => q.id !== existingWithSameNumber.id);
          const newArchive = filtered.map(q => q.id === data.id ? quoteToSave : q);
          // If current wasn't in list, append it
          if (!newArchive.find(q => q.id === data.id)) newArchive.push(quoteToSave);
          
          setSavedQuotes(newArchive);
          alert(`Doklad ${data.number} bol aktualizovaný (prepísaný).`);
          return;
      }

      // Standard Save
      // REMOVE ALL EXISTING ENTRIES WITH SAME ID TO PREVENT DUPLICATES
      const filteredQuotes = savedQuotes.filter(q => q.id !== data.id);
      const newSavedQuotes = [...filteredQuotes, quoteToSave];
      setSavedQuotes(newSavedQuotes);
      alert(`Doklad ${data.number} bol uložený do Archívu.`);
  };

  // --- NEW FEATURE: DUPLICATE QUOTE (Revised) ---
  const handleDuplicateQuote = () => {
      // 1. Calculate suggested next number based on settings
      const suggestedNum = generateDocNumber('quote');

      // 2. Ask user (Allow override)
      const userNum = window.prompt(
          `Vytvoriť kópiu dokladu?\n\nSystém navrhuje číslo: ${suggestedNum}\nMôžete ho prepísať nižšie:`,
          suggestedNum
      );

      if (!userNum) return; // Cancelled

      // 3. Logic to update sequence based on user input
      // Try to extract the sequence number from the user string (assuming format CP_SK_XXX_...)
      const match = userNum.match(/_(\d{3})_/); // Looks for 3 digits between underscores
      if (match && match[1]) {
          const newSeq = parseInt(match[1], 10);
          // Update settings so next time it starts from userNum + 1
          if (!isNaN(newSeq) && newSeq >= settings.nextCpSequence) {
               setSettings(prev => ({...prev, nextCpSequence: newSeq + 1}));
          }
      } else {
          // Fallback if format is weird, just increment existing
           setSettings(prev => ({...prev, nextCpSequence: prev.nextCpSequence + 1}));
      }

      // 4. Create the new state
      const newId = generateId();
      const newData: QuoteData = {
          ...data,
          id: newId,
          number: userNum, // Use user input
          date: new Date().toISOString().split('T')[0],
          title: `${data.title} (Kópia)`,
          validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          relatedDocId: undefined, // Break relation to previous docs (it's a new independent quote)
          categories: data.categories.map(c => ({
              ...c, 
              id: generateId(), 
              items: c.items.map(i => ({...i, id: generateId()})) // Deep copy items with new IDs
          })),
          wizardData: data.wizardData // PRESERVE WIZARD DATA IN COPY
      };

      // 5. AUTO-SAVE TO ARCHIVE IMMEDIATELY
      // This prevents the issue where the number increments but the file is missing from archive
      setSavedQuotes(prev => [...prev, { ...newData, lastUpdated: Date.now() }]);
      
      setData(newData);
      setCalcSuccess(null);
      
      alert(`Kópia ${userNum} bola vytvorená a uložená do archívu.`);
  };

  const handleNewQuote = () => {
      if (data.categories.length > 0) { if (window.confirm("Chcete uložiť aktuálne rozpracovanú ponuku do Archívu?")) { handleSaveCurrentQuote(); } }
      if (window.confirm("Naozaj chcete vytvoriť novú prázdnu ponuku?")) {
          const newId = generateId();
          const newNum = generateDocNumber('quote');
          setSettings(prev => ({...prev, nextCpSequence: prev.nextCpSequence + 1}));
          
          // Re-initialize categories based on DEFAULTS and SETTINGS
          const initCats: QuoteCategory[] = DEFAULT_CATEGORIES_LIST.map(name => ({
                id: generateId(),
                type: 'items',
                name: name,
                items: [],
                isExpanded: true,
                section: 'lift',
                textContent: settings.defaultCategoryTexts?.[name] || undefined // Inject default text
          }));

          setData({
            id: newId, number: newNum, type: 'quote', title: 'Cenová Ponuka - Výťah', date: new Date().toISOString().split('T')[0], validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            supplier: data.supplier, client: { name: '', details: '' }, layout: { ...DEFAULT_LAYOUT },
            categories: initCats, // Use re-initialized categories with texts
            terms: DEFAULT_TERMS_HTML, currency: '€', globalMargin: 15, shaftMargin: 20, vatRate: 23, hideItemPrices: true, showTechSpecs: true, contractBody: DEFAULT_CONTRACT_TEXT
          });
          setCalcSuccess(null); setHasShaft(false);
      }
  };

  // --- SMART DELETE (ROLLBACK) ---
  const handleDeleteQuote = (id: string) => { 
      const quoteToDelete = savedQuotes.find(q => q.id === id);
      if (!quoteToDelete) return;

      if (window.confirm(`Naozaj chcete vymazať doklad ${quoteToDelete.number} z archívu?`)) { 
          const newArchive = savedQuotes.filter(q => q.id !== id);
          setSavedQuotes(newArchive);
          
          // ROLLBACK LOGIC
          // Check if we deleted the *last* generated number. If so, decrement the counter.
          // Parse the number we just deleted
          const match = quoteToDelete.number.match(/_(\d{3})_/); 
          if (match && match[1]) {
              const deletedSeq = parseInt(match[1], 10);
              // If the deleted number corresponds to (CurrentSequence - 1), it means it was the last one.
              // Example: Next is 010. We delete 009. We should roll back to 009.
              if (deletedSeq === settings.nextCpSequence - 1) {
                  setSettings(prev => ({...prev, nextCpSequence: deletedSeq}));
                  // alert(`Počítadlo bolo vrátené späť na číslo ${deletedSeq}.`);
              }
          }
      } 
  };
  
  const loadFromStorage = (q: QuoteData) => { setData(q); setShowArchive(false); };

  const createRelatedOrder = (q: QuoteData) => {
      const newNum = generateDocNumber('order'); const newId = generateId();
      const orderDoc: QuoteData = { ...q, id: newId, relatedDocId: q.id, number: newNum, type: 'order', title: `Objednávka k ${q.number}`, date: new Date().toISOString().split('T')[0], };
      setSavedQuotes(prev => [...prev, orderDoc]); setSettings(prev => ({...prev, nextObjSequence: prev.nextObjSequence + 1}));
      setData(orderDoc); setShowArchive(false); alert(`Vytvorená Objednávka: ${newNum}`);
  };

  const createRelatedContract = (q: QuoteData) => {
      const newNum = generateDocNumber('contract'); const newId = generateId();
      let contractBody = contractTemplates.length > 0 ? contractTemplates[0].content : DEFAULT_CONTRACT_TEXT;
      contractBody = contractBody.replace('[CISLO_DOKLADU]', newNum).replace('[NAZOV_DODAVATELA]', q.supplier.name).replace('[DETAILY_DODAVATELA]', q.supplier.details.replace(/\n/g, '<br>')).replace('[NAZOV_KLIENTA]', q.client.name).replace('[DETAILY_KLIENTA]', q.client.details.replace(/\n/g, '<br>'));
      const totals = calculateTotals(); 
      contractBody = contractBody.replace('[CENA_CELKOM]', totals.gross.toLocaleString('sk-SK', {minimumFractionDigits: 2}) + ' ' + q.currency);
      const contractDoc: QuoteData = { ...q, id: newId, relatedDocId: q.id, number: newNum, type: 'contract', title: `Zmluva o dielo č. ${newNum}`, date: new Date().toISOString().split('T')[0], contractBody: contractBody };
      setSavedQuotes(prev => [...prev, contractDoc]); setSettings(prev => ({...prev, nextPlSequence: prev.nextPlSequence + 1}));
      setData(contractDoc); setShowArchive(false); alert(`Vytvorená Zmluva: ${newNum}`);
  };

  const handleNavigateToRelated = (targetType: DocumentType) => {
      let targetDoc: QuoteData | undefined;
      if (data.type === 'quote' && targetType === 'order') { targetDoc = savedQuotes.find(q => q.type === 'order' && q.relatedDocId === data.id); } 
      else if (data.type === 'order') { if (targetType === 'quote') { targetDoc = savedQuotes.find(q => q.id === data.relatedDocId); } else if (targetType === 'contract') { targetDoc = savedQuotes.find(q => q.type === 'contract' && q.relatedDocId === data.id); } } 
      else if (data.type === 'contract') { if (targetType === 'order') { targetDoc = savedQuotes.find(q => q.id === data.relatedDocId); } }
      if (targetDoc) { loadFromStorage(targetDoc); } else { alert("Súvisiaci doklad sa nenašiel v archíve."); }
  };

  const handleCalculateDim = (std: string) => {
      if (!data.layout) return;
      const { shaftWidth, shaftDepth, gapLeft, gapRight, gapFront, gapRear, frameType, guideTypeCar } = data.layout;
      
      const getRailDepth = (type?: string) => {
          if (!type) return 80;
          if (type.includes('T45')) return 45;
          if (type.includes('T50')) return 50;
          if (type.includes('T70')) return 70;
          if (type.includes('T75')) return 75;
          if (type.includes('T82')) return 82;
          if (type.includes('T89')) return 89;
          if (type.includes('T90')) return 90;
          if (type.includes('T114')) return 114;
          if (type.includes('T125')) return 125;
          if (type.includes('T127')) return 127;
          return 85; // Generic Fallback
      };
      
      const railDepth = getRailDepth(guideTypeCar);
      
      // FORMULA UPDATE
      // WIDTH = ShaftW - Left - Right - (Wall 40 * 2) - (Rails * 2 if Central)
      const wallThicknessWidth = 40;
      let newWidth = shaftWidth - gapLeft - gapRight - (2 * wallThicknessWidth);
      if (frameType === 'central') { newWidth = newWidth - (2 * railDepth); }
      
      // DEPTH = ShaftD - Front - Rear - (Wall 30 * 2)
      const wallThicknessDepth = 30;
      let newDepth = shaftDepth - gapFront - gapRear - (2 * wallThicknessDepth);
      
      // REMOVED 10mm ROUNDING FLOOR LOGIC
      newWidth = Math.round(newWidth);
      newDepth = Math.round(newDepth);

      // IMMEDIATE LOAD CALCULATION & STATE UPDATE
      const { suggestedLoad, persons } = calculateEn8120(newWidth, newDepth);
      
      // Use functional update to ensure no stale state issues
      setData(prev => ({ 
          ...prev, 
          layout: { 
              ...prev.layout!, 
              cabinWidth: newWidth, 
              cabinDepth: newDepth,
              ratedLoad: suggestedLoad,       
              numberOfPersons: persons        
          } 
      }));
      
      setCalcSuccess(std); 
      setTimeout(() => setCalcSuccess(null), 2000);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onload = (ev) => setData({...data, logoUrl: ev.target?.result as string}); reader.readAsDataURL(file); } };
  const toggleTechSpecs = () => setData(prev => ({...prev, showTechSpecs: !prev.showTechSpecs}));
  const toggleShaft = () => setHasShaft(!hasShaft);
  const formatCurrency = (val: number) => { return val.toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + data.currency; };
  const addCategory = (type: 'items'|'text', name?: string, items?: QuoteItem[], section: 'lift'|'shaft' = 'lift', textContent?: string) => {
      // Use default text from settings if available and textContent is not provided
      const defaultText = name ? settings.defaultCategoryTexts?.[name] : undefined;
      const finalContent = textContent || (type === 'items' && defaultText ? defaultText : (type === 'text' ? '<p>Sem napíšte text...</p>' : undefined));

      setData(prev => ({ ...prev, categories: [...prev.categories, { id: generateId(), type, name: name || (type === 'text' ? 'Textová sekcia' : 'Nová kategória'), items: items ? items.map(i => ({...i, id: generateId()})) : [], isExpanded: true, section, textContent: finalContent }] }));
  };
  const handleAddItem = (catId: string, isSurcharge = false) => {
      setData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === catId ? { ...c, items: [...c.items, { id: generateId(), description: isSurcharge ? 'Príplatok / Príslušenstvo' : 'Nová položka', unit: 'ks', quantity: 1, unitPrice: 0, purchasePrice: 0, vatRate: 23, isSurcharge }] } : c) }));
  };
  const handleOpenCatalog = (catId: string, itemId?: string) => { setIsProductModalOpen(true); };
  const handleAiSuggest = async (catId: string, catName: string) => {
      setIsAiLoading(catId); const suggestions = await generateSuggestion(catName, 'category_items');
      if (suggestions) { const items = suggestions.split(',').map(s => ({ id: generateId(), description: s.trim(), unit: 'ks', quantity: 1, unitPrice: 0, purchasePrice: 0, vatRate: 23 })); setData(prev => ({ ...prev, categories: prev.categories.map(c => c.id === catId ? {...c, items: [...c.items, ...items]} : c) })); }
      setIsAiLoading(false);
  };
  const moveCategory = (id: string, dir: 'up' | 'down') => {
      const idx = data.categories.findIndex(c => c.id === id); if (idx === -1) return; if (dir === 'up' && idx === 0) return; if (dir === 'down' && idx === data.categories.length - 1) return;
      const newCats = [...data.categories]; const targetIdx = dir === 'up' ? idx - 1 : idx + 1; [newCats[idx], newCats[targetIdx]] = [newCats[targetIdx], newCats[idx]];
      setData(prev => ({ ...prev, categories: newCats }));
  };
  
  const onDragStartCat = (e: React.DragEvent, id: string) => { setDraggedCatId(id); e.dataTransfer.effectAllowed = 'move'; e.currentTarget.classList.add('opacity-50'); };
  const onDragEndCat = (e: React.DragEvent, id?: string) => { setDraggedCatId(null); e.currentTarget.classList.remove('opacity-50'); };
  const onDragOverCat = (e: React.DragEvent, targetId: string) => { e.preventDefault(); if (!draggedCatId || draggedCatId === targetId) return; const items = data.categories; const draggedIndex = items.findIndex(i => i.id === draggedCatId); const targetIndex = items.findIndex(i => i.id === targetId); if (draggedIndex === -1 || targetIndex === -1) return; const newItems = [...items]; const [reorderedItem] = newItems.splice(draggedIndex, 1); newItems.splice(targetIndex, 0, reorderedItem); setData(prev => ({...prev, categories: newItems})); };
  const handleAiCategoryItems = (catId: string, name: string) => handleAiSuggest(catId, name);

  if (!isAuthenticated) { return <LoginGate onLogin={handleLogin} />; }

  // CALCULATE RECOMMENDED RAILS ONCE FOR RENDER
  const recommendedRails = getRailTypesForLoad(data.layout?.ratedLoad || 630);

  return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans print:bg-white print:p-0">
      <style>{`
        @media print {
            body, #root, .print-container { overflow: visible !important; height: auto !important; margin: 0 !important; }
            .pageNumber::after {
                counter-increment: page;
                content: counter(page); 
            }
        }
      `}</style>
      
      {/* ... TOOLBAR ... */}
      <div className="no-print mb-6">
        <div className="flex flex-col xl:flex-row justify-between items-center mb-4 gap-4">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 self-start xl:self-center"><Calculator className="text-blue-600"/> SmartQuote SK <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">v{APP_VERSION}</span></h1>
            <div className="flex flex-wrap gap-2 items-center justify-end w-full xl:w-auto">
                <button onClick={() => window.print()} className="px-3 py-2 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow text-sm whitespace-nowrap" title="Tlačiť alebo Uložiť ako PDF"><Printer size={16}/> Tlačiť / PDF</button>
                <button onClick={openEmailModal} className="px-3 py-2 h-9 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center gap-2 shadow text-sm whitespace-nowrap" title="Odoslať PDF E-mailom"><Mail size={16}/> Odoslať</button>
                <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                <button onClick={handleDuplicateQuote} className="px-3 py-2 h-9 bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold rounded flex items-center gap-2 border border-orange-300 text-sm whitespace-nowrap" title="Uložiť ako kópiu s novým číslom"><Copy size={16}/> Uložiť ako Kópiu</button>
                <button onClick={handleNewQuote} className="px-3 py-2 h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow text-sm border border-blue-800 whitespace-nowrap" title="Nová prázdna ponuka"><PlusCircle size={16}/> Nová CP</button>
                <button onClick={() => setIsCatalogOpen(true)} className="px-3 py-2 h-9 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded flex items-center gap-2 border border-purple-300 text-sm whitespace-nowrap"><Settings size={16}/> Katalóg</button>
                <button onClick={handleSaveCurrentQuote} className="px-3 py-2 h-9 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded flex items-center gap-2 border border-green-300 text-sm whitespace-nowrap" title="Uložiť zmeny"><Save size={16}/> Uložiť</button>
                <button onClick={() => setShowArchive(true)} className="px-3 py-2 h-9 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold flex items-center gap-2 text-sm whitespace-nowrap"><Archive size={16}/> Archív</button>
                <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 h-9 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"><Settings size={18}/></button>
                <label className="flex items-center gap-2 ml-2 cursor-pointer bg-white border px-3 py-1 rounded-full shadow-sm hover:bg-gray-50 h-9 whitespace-nowrap"><input type="checkbox" checked={data.hideItemPrices} onChange={e => setData({...data, hideItemPrices: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500"/><span className="text-xs font-bold text-gray-600">Skryť ceny (Tlač)</span></label>
                <button onClick={handleLogout} className="ml-2 p-2 h-9 bg-red-100 hover:bg-red-200 text-red-700 rounded-full" title="Odhlásiť"><LogOut size={16}/></button>
            </div>
        </div>
        {/* ... STATUS BAR ... */}
        <div className="bg-white p-2 rounded-lg border border-blue-200 shadow-sm flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-4 min-w-max">
                 <button onClick={() => handleNavigateToRelated('quote')} disabled={data.type === 'quote'} className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 transition ${data.type === 'quote' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400 cursor-default' : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-700'}`}>1. Cenová Ponuka {data.type !== 'quote' && <CheckCircle size={12}/>}</button>
                 <ArrowRight size={16} className="text-gray-300"/>
                 <button onClick={() => handleNavigateToRelated('order')} disabled={data.type === 'order'} className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 transition ${data.type === 'order' ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-400 cursor-default' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-700'}`}>2. Objednávka {data.type !== 'order' && savedQuotes.some(q => q.type === 'order' && q.relatedDocId === (data.type==='quote'?data.id:data.relatedDocId)) && <CheckCircle size={12}/>}</button>
                 <ArrowRight size={16} className="text-gray-300"/>
                 <button onClick={() => handleNavigateToRelated('contract')} disabled={data.type === 'contract'} className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 transition ${data.type === 'contract' ? 'bg-green-100 text-green-800 ring-2 ring-green-400 cursor-default' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-700'}`}>3. Zmluva</button>
            </div>
            <div className="flex gap-2 ml-4">{data.type === 'quote' && (<button onClick={() => createRelatedOrder(data)} className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-bold flex items-center gap-2 shadow whitespace-nowrap"><FileInput size={14}/> Vytvoriť Objednávku</button>)}{data.type === 'order' && (<button onClick={() => createRelatedContract(data)} className="px-4 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded text-sm font-bold flex items-center gap-2 shadow whitespace-nowrap"><FileCheck size={14}/> Vytvoriť Zmluva</button>)}</div>
        </div>
      </div>
      
      {/* ... MODALS ... */}
      <ProductDatabaseModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSelectProduct={handleSelectProduct} products={products} onAddProduct={handleAddProduct} onDeleteProduct={handleDeleteProduct} layout={data.layout} />
      <CatalogManagerModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} customCategories={availableCategories} onAddCategory={handleAddCategory} onDeleteCategory={handleDeleteCategory} onImportCatalog={handleImportCatalog} cabinClasses={cabinClasses} onAddCabinClass={handleAddCabinClass} onUpdateCabinClass={handleUpdateCabinClass} onDeleteCabinClass={handleDeleteCabinClass} />
      <ClientDatabaseModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} onSelectClient={c => setData({...data, client: {name: c.name, details: c.details, email: c.email, phone: c.phone}})} clients={clients} onAddClient={c => setClients([...clients, c])} onDeleteClient={id => setClients(clients.filter(c => c.id !== id))} />
      <SupplierDatabaseModal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} onSelectSupplier={s => setData({...data, supplier: {name: s.name, details: s.details, email: s.email, phone: s.phone}, logoUrl: s.logoUrl})} suppliers={suppliers} onAddSupplier={s => setSuppliers([...suppliers, s])} onDeleteSupplier={id => setSuppliers(suppliers.filter(s => s.id !== id))} />
      <TemplateDatabaseModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} mode={templateModalMode} templateType={templateContext} templates={templates} onSelectTemplate={handleLoadTemplate} onSaveTemplate={handleSaveTemplate} onDeleteTemplate={handleDeleteTemplate} />
      <ContractRepositoryModal isOpen={isContractRepoOpen} onClose={() => setIsContractRepoOpen(false)} templates={contractTemplates} onSelectTemplate={handleSelectContractTemplate} onSaveCurrent={handleSaveContractTemplate} onDeleteTemplate={handleDeleteContractTemplate} />
      <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
          settings={settings} 
          onSaveSettings={handleSaveSettings} 
          onExportData={handleExportData} 
          onImportData={handleImportData} 
          onFactoryReset={handleFactoryReset} 
          appVersion={APP_VERSION}
          availableCategories={availableCategories} 
      />
      <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} onSend={handleSendEmail} defaultTo={emailModalProps.to} defaultSubject={emailModalProps.subject} defaultMessage={emailModalProps.message} />
      <MaterialCalculatorModal 
          key={data.id} // FORCE REMOUNT WHEN QUOTE CHANGES
          isOpen={isMaterialModalOpen} 
          onClose={() => setIsMaterialModalOpen(false)} 
          layout={data.layout || DEFAULT_LAYOUT} 
          onInsert={handleMaterialWizardInsert} 
          products={products} 
          customCategories={availableCategories} 
          onAddCategory={handleAddCategory} 
          cabinClasses={cabinClasses}
          initialState={data.wizardData} 
      />
      {showArchive && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 no-print">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl"><h2 className="text-xl font-bold flex items-center gap-2"><Archive className="text-blue-600"/> Archív Dokladov</h2><button onClick={() => setShowArchive(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20}/></button></div>
                  <div className="p-4 border-b bg-white"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Hľadať podľa čísla dokladu alebo mena klienta..." value={archiveSearch} onChange={(e) => setArchiveSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div></div>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                      {savedQuotes.filter(q => q.number.toLowerCase().includes(archiveSearch.toLowerCase()) || q.client.name.toLowerCase().includes(archiveSearch.toLowerCase()) || q.clientReference?.toLowerCase().includes(archiveSearch.toLowerCase())).map(q => {
                          
                          const total = q.categories.reduce((acc, cat) => {
                              if (cat.isHidden) return acc;
                              const margin = cat.section === 'shaft' ? q.shaftMargin : q.globalMargin;
                              const catTotal = cat.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity * (1 + margin / 100)), 0);
                              return acc + catTotal;
                          }, 0);

                          const stops = q.layout?.numberOfStops || 0;
                          const entrances = q.layout?.numberOfEntrances || stops;
                          const typeChar = q.layout?.entrances === 'AB' ? 'P' : (q.layout?.entrances === 'AC' ? 'U' : 'N');
                          const tag = `${stops}/${entrances}${typeChar}`;

                          return (
                          <div key={q.id} className="p-4 bg-white border border-gray-200 rounded-lg mb-2 flex justify-between items-center shadow-sm hover:border-blue-300 transition-all">
                              <div>
                                  <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                      {q.number} 
                                      <span className={`text-xs px-2 py-0.5 rounded uppercase ${q.type==='quote'?'bg-yellow-100 text-yellow-800':q.type==='order'?'bg-blue-100 text-blue-800':'bg-green-100 text-green-800'}`}>{q.type === 'quote' ? 'Ponuka' : q.type === 'order' ? 'Objednávka' : 'Zmluva'}</span>
                                  </div>
                                  <div className="text-sm text-gray-600 font-medium">{q.client.name || 'Bez klienta'}</div>
                                  {q.clientReference && (
                                      <div className="text-xs font-bold text-blue-600 mt-0.5 flex items-center gap-1">
                                          <Building size={10}/> {q.clientReference}
                                      </div>
                                  )}
                                  
                                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                                      <div className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded flex items-center gap-1" title="Konfigurácia (Stanice/Nástupištia Typ)">
                                          <Tag size={10}/> {tag}
                                      </div>
                                      <div className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                                          Cena: {total.toLocaleString('sk-SK', {maximumFractionDigits: 0})} {q.currency}
                                      </div>
                                  </div>

                                  <div className="text-xs text-gray-400 mt-1">Zo dňa: {q.date}</div>
                              </div>
                              <div className="flex gap-2"><button onClick={() => loadFromStorage(q)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-sm">Otvoriť</button>{q.type === 'quote' && (<button onClick={() => createRelatedOrder(q)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-sm border border-blue-200 flex items-center gap-1"><FileInput size={14}/> Obj.</button>)}{q.type === 'order' && (<button onClick={() => createRelatedContract(q)} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded text-sm border border-green-200 flex items-center gap-1"><FileCheck size={14}/> Zmluva</button>)}<button onClick={() => handleDeleteQuote(q.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm border border-red-200" title="Vymazať z archívu"><Trash2 size={16}/></button></div>
                          </div>
                      )})}
                      {savedQuotes.length === 0 && <div className="text-center text-gray-400 py-8 italic">Žiadne uložené doklady.</div>}
                  </div>
              </div>
          </div>
      )}

      {/* --- CONFIG PANEL --- */}
      <div className="max-w-[210mm] mx-auto mb-8 p-6 bg-amber-50 rounded-xl border border-amber-200 shadow-sm text-sm no-print">
             {/* 1. ROW: BASICS */}
             <div className="grid grid-cols-12 gap-4 mb-4 pb-4 border-b border-amber-200">
                {/* ... (Existing Basics inputs) ... */}
                <div className="col-span-12 font-bold text-amber-900 uppercase flex items-center gap-2 mb-1"><Sliders size={16}/> Základné Parametre</div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Typ výťahu</label><select value={data.layout?.liftType} onChange={e => handleLayoutChange('liftType', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 bg-white font-bold"><option value="passenger">Osobný</option><option value="freight">Nákladný</option><option value="home">Domáci</option><option value="invalid">Invalidný (EN 81-70)</option></select></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Nosnosť (kg)</label><input type="number" value={data.layout?.ratedLoad} onChange={e => handleLayoutChange('ratedLoad', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white"/></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Osoby</label><input type="number" value={data.layout?.numberOfPersons} onChange={e => handleLayoutChange('numberOfPersons', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white"/></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Rýchlosť (m/s)</label><input type="number" step="0.1" value={data.layout?.ratedSpeed} onChange={e => handleLayoutChange('ratedSpeed', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white"/></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Stanice / Štart</label><div className="flex gap-1"><input type="number" value={data.layout?.numberOfStops} onChange={e => handleLayoutChange('numberOfStops', +e.target.value)} className="w-2/3 h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white" title="Počet staníc"/><input type="number" value={data.layout?.startStation ?? 0} onChange={e => handleLayoutChange('startStation', +e.target.value)} className="w-1/3 h-10 border border-gray-300 rounded px-1 text-center font-bold text-sm bg-gray-50" title="Východzia stanica (napr. -1)"/></div></div>
                 <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Napájanie</label><input type="text" value={data.layout?.powerSupply} onChange={e => handleLayoutChange('powerSupply', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold bg-white text-blue-700"/></div>
             </div>
             
             {/* 2. ROW: SHAFT */}
             <div className="grid grid-cols-12 gap-4 mb-4 pb-4 border-b border-amber-200">
                {/* ... (Existing Shaft inputs) ... */}
                <div className="col-span-12 font-bold text-amber-900 uppercase flex items-center gap-2 mb-1"><ArrowRightLeft size={16}/> Šachta & Rozmery</div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Šírka Šachty</label><input type="number" value={data.layout?.shaftWidth} onChange={e => handleLayoutChange('shaftWidth', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-xl bg-white"/></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Hĺbka Šachty</label><input type="number" value={data.layout?.shaftDepth} onChange={e => handleLayoutChange('shaftDepth', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-xl bg-white"/></div>
                 <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Hlava (HQ)</label><input type="number" value={data.layout?.headroomHeight} onChange={e => handleLayoutChange('headroomHeight', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white"/></div>
                 <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Priehlbeň (HS)</label><input type="number" value={data.layout?.pitDepth} onChange={e => handleLayoutChange('pitDepth', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white"/></div>
                 <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Zdvih (mm)</label><input type="number" value={data.layout?.travelHeight} onChange={e => handleLayoutChange('travelHeight', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-medium bg-white"/></div>
                 
                 <div className="col-span-2 flex items-center pt-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                         <input type="checkbox" checked={data.layout?.hasExternalShaft} onChange={e => handleToggleExternalShaft(e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500"/>
                         <span className="text-[10px] font-bold text-amber-800 uppercase leading-tight">Vonkajšia oceľová konštrukcia</span>
                     </label>
                 </div>

                <div className="col-span-12 mt-2 bg-white/50 p-2 rounded border border-amber-100 flex items-center gap-4">
                     <span className="text-xs font-bold uppercase text-amber-800 w-24">Medzery (mm):</span>
                     <div className="flex gap-2 flex-1">
                        <div className="flex-1"><label className="text-[9px] text-gray-500 block text-center">Ľavá</label><input type="number" value={data.layout?.gapLeft} onChange={e => handleLayoutChange('gapLeft', +e.target.value)} className="w-full h-8 border border-gray-200 bg-white rounded text-center text-sm font-bold"/></div>
                        <div className="flex-1"><label className="text-[9px] text-gray-500 block text-center">Pravá</label><input type="number" value={data.layout?.gapRight} onChange={e => handleLayoutChange('gapRight', +e.target.value)} className="w-full h-8 border border-gray-200 bg-white rounded text-center text-sm font-bold"/></div>
                        <div className="flex-1"><label className="text-[9px] text-gray-500 block text-center">Predná</label><input type="number" value={data.layout?.gapFront} onChange={e => handleLayoutChange('gapFront', +e.target.value)} className="w-full h-8 border border-gray-200 bg-white rounded text-center text-sm font-bold"/></div>
                        <div className="flex-1"><label className="text-[9px] text-gray-500 block text-center">Zadná</label><input type="number" value={data.layout?.gapRear} onChange={e => handleLayoutChange('gapRear', +e.target.value)} className="w-full h-8 border border-gray-200 bg-white rounded text-center text-sm font-bold"/></div>
                     </div>
                </div>
             </div>
             
             {/* 3. ROW: CABIN & DOORS */}
             <div className="grid grid-cols-12 gap-6 mb-4 pb-4 border-b border-amber-200">
                {/* ... (Existing Cabin inputs) ... */}
                <div className="col-span-12 font-bold text-blue-900 uppercase flex items-center gap-2 mb-1"><Box size={16}/> Kabína a Dvere</div>
                
                <div className="col-span-4 grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div className="col-span-2 text-xs font-bold text-blue-800 uppercase border-b border-blue-200 pb-1 mb-1 flex justify-between items-center">
                        <span>Rozmery Kabíny</span>
                        <div className="flex items-center gap-1 text-[9px] text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200" title="Vypočítaná plocha podlahy">
                            <Ruler size={10}/> {currentAreaInfo.area.toFixed(2)} m²
                        </div>
                    </div>
                    <div><label className="text-[9px] uppercase font-bold text-blue-800 block mb-1">Šírka (mm)</label><input type="number" value={data.layout?.cabinWidth} onChange={e => handleLayoutChange('cabinWidth', +e.target.value)} className="w-full h-10 border border-blue-300 rounded px-2 text-center font-bold text-xl bg-white text-blue-900"/></div>
                    <div><label className="text-[9px] uppercase font-bold text-blue-800 block mb-1">Hĺbka (mm)</label><input type="number" value={data.layout?.cabinDepth} onChange={e => handleLayoutChange('cabinDepth', +e.target.value)} className="w-full h-10 border border-blue-300 rounded px-2 text-center font-bold text-xl bg-white text-blue-900"/></div>
                    
                    <div className="col-span-2">
                        <label className="text-[9px] uppercase font-bold text-blue-800 block mb-1">Výška Kabíny (mm)</label>
                        <input type="number" value={data.layout?.cabinHeight || 2100} onChange={e => handleLayoutChange('cabinHeight', +e.target.value)} className="w-full h-8 border border-blue-300 rounded px-2 text-center font-bold text-base bg-white text-blue-900"/>
                    </div>

                    <div className="col-span-2">
                        <label className="text-[9px] uppercase font-bold text-blue-800 block mb-1">Trieda Kabíny</label>
                        <select value={data.layout?.cabinClass || 'FUN'} onChange={e => handleLayoutChange('cabinClass', e.target.value)} className="w-full h-8 text-xs font-bold border border-blue-300 rounded px-2 bg-white text-blue-900">
                            {cabinClasses.map(cc => (
                                <option key={cc.id} value={cc.name}>
                                    {cc.name} ({cc.description})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2 flex gap-2 mt-1">
                        <button onClick={() => handleCalculateDim('81-20')} className={`flex-1 h-8 border text-[10px] rounded font-bold transition flex items-center justify-center ${calcSuccess === '81-20' ? 'bg-green-500 text-white border-green-600' : 'bg-white border-blue-300 text-blue-700 hover:bg-blue-50'}`}>Auto 81-20</button>
                        <button onClick={() => handleCalculateDim('81-21')} className={`flex-1 h-8 border text-[10px] rounded font-bold transition flex items-center justify-center ${calcSuccess === '81-21' ? 'bg-green-500 text-white border-green-600' : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'}`}>Auto 81-21</button>
                    </div>
                    <div className="col-span-2 mt-1">
                        <button onClick={handleRecalculateLoad} className="w-full h-8 bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded font-bold text-[10px] flex items-center justify-center gap-2 transition" title="Prepočítať nosnosť podľa zadanej plochy">
                            <RefreshCw size={12}/> Prepočítať Nosnosť
                        </button>
                    </div>
                    <div className="col-span-2 text-[9px] text-blue-700 leading-tight bg-blue-100 p-1.5 rounded flex flex-col gap-1 mt-1">
                        <div className="flex justify-between font-bold">
                            <span>EN81-20: {currentAreaInfo.persons} osôb</span>
                            <span>Min. {currentAreaInfo.suggestedLoad} kg</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-500 font-medium border-t border-blue-200 pt-1">
                            <Maximize size={10}/> Steny: <strong>{currentAreaInfo.wallArea.toFixed(2)} m²</strong>
                        </div>
                    </div>
                </div>

                <div className="col-span-4 grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="col-span-2 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 pb-1 mb-1">Dvere Technológia</div>
                    
                    <div className="col-span-2"><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Šírka Dverí (PL)</label><input type="number" value={data.layout?.doorWidth} onChange={e => handleLayoutChange('doorWidth', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-center font-bold text-lg bg-white"/></div>
                    
                    <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Ovládanie</label><select value={data.layout?.doorOperation} onChange={e => handleLayoutChange('doorOperation', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-xs font-bold bg-white"><option value="automatic">Automatické</option><option value="manual">Manuálne</option></select></div>
                    <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Typ</label><select value={data.layout?.doorType} onChange={e => handleLayoutChange('doorType', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-xs font-bold bg-white"><option value="central">Centrál</option><option value="telescopic">Teleskop</option><option value="bus">BUS</option></select></div>
                    
                    <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Odolnosť</label><select value={data.layout?.doorFireRating || 'EW60'} onChange={e => handleLayoutChange('doorFireRating', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-1 text-xs font-bold bg-white"><option value="None">Bez</option><option value="EW60">EW60</option><option value="EI60">EI60</option><option value="EI120">EI120</option></select></div>
                    <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Povrch</label><select value={data.layout?.doorFinish || 'RAL 7032'} onChange={e => handleLayoutChange('doorFinish', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-1 text-xs font-bold bg-white"><option value="RAL 7032">RAL</option><option value="Nerez Brus">Brus</option><option value="Nerez Lesk">Lesk</option><option value="Skinplate">Skin</option></select></div>
                </div>

                <div className="col-span-4 grid grid-cols-2 gap-3 p-3 bg-yellow-50/50 rounded-lg border border-yellow-200">
                    <div className="col-span-2 text-xs font-bold text-yellow-800 uppercase border-b border-yellow-200 pb-1 mb-1">Stavebné Údaje</div>
                    
                    <div><label className="text-[9px] uppercase font-bold text-blue-600 block mb-1">DO (Šírka)</label><input type="number" value={data.layout?.doorOpeningWidth} onChange={e => handleLayoutChange('doorOpeningWidth', +e.target.value)} className="w-full h-10 border border-blue-200 rounded px-1 text-center font-bold text-lg bg-white"/></div>
                    <div><label className="text-[9px] uppercase font-bold text-blue-600 block mb-1">VDO (Výška)</label><input type="number" value={data.layout?.doorOpeningHeight} onChange={e => handleLayoutChange('doorOpeningHeight', +e.target.value)} className="w-full h-10 border border-blue-200 rounded px-1 text-center font-bold text-lg bg-white"/></div>

                    <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1" title="Ostrenie vľavo">LDO (mm)</label><input type="number" value={data.layout?.LDO} onChange={e => handleLayoutChange('LDO', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-1 text-center font-bold text-lg bg-white"/></div>
                    <div><label className="text-[9px] uppercase font-bold text-gray-500 block mb-1" title="Ostrenie vpravo">RDO (mm)</label><input type="number" value={data.layout?.RDO} onChange={e => handleLayoutChange('RDO', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-1 text-center font-bold text-lg bg-white"/></div>
                </div>
             </div>

             {/* 4. ROW: TECHNOLOGY (RESTORED FULLY) */}
             <div className="grid grid-cols-12 gap-4">
                {/* ... (Existing Tech inputs) ... */}
                <div className="col-span-12 font-bold text-amber-900 uppercase flex items-center gap-2 mb-1"><Settings size={16}/> Technológia</div>
                
                <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Vstupy / Nástupištia</label>
                    <div className="flex gap-1">
                        <select 
                            value={data.layout?.entrances || 'A'} 
                            onChange={e => handleLayoutChange('entrances', e.target.value)} 
                            className={`h-10 border border-gray-300 rounded px-2 text-xs font-bold bg-white text-green-700 ${data.layout?.entrances !== 'A' ? 'w-2/3' : 'w-full'}`}
                        >
                            <option value="A">A (Nepriechodný)</option>
                            <option value="AB">A+B (180°)</option>
                            <option value="AC">A+C (90°)</option>
                        </select>
                        {data.layout?.entrances !== 'A' && (
                            <input 
                                type="number" 
                                value={data.layout?.numberOfEntrances || data.layout?.numberOfStops} 
                                onChange={e => handleLayoutChange('numberOfEntrances', +e.target.value)} 
                                className="w-1/3 h-10 border border-blue-300 rounded px-1 text-center font-bold text-sm bg-blue-50 text-blue-800"
                                title="Počet nástupíšť"
                            />
                        )}
                    </div>
                </div>

                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Typ Pohonu</label>
                    <select value={data.layout?.driveType || 'traction'} onChange={e => handleLayoutChange('driveType', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-xs font-bold bg-white">
                        <option value="traction">Trakčný (Lanový)</option>
                        <option value="hydraulic">Hydraulický</option>
                        <option value="drum">Bubnový</option>
                        <option value="mrl">MRL (Bez strojovne)</option>
                    </select>
                </div>

                {/* MODIFIED: Split input for Ropes */}
                <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Nosné prostr. / Počet</label>
                    <div className="flex gap-1">
                        <select value={data.layout?.tractionMedium || 'ctp'} onChange={e => handleLayoutChange('tractionMedium', e.target.value)} className="w-2/3 h-10 border border-gray-300 rounded px-2 text-xs font-bold bg-white">
                            <option value="ropes">Laná</option>
                            <option value="belts">Pásy</option>
                            <option value="ctp">CTP</option>
                        </select>
                        <input 
                            type="number" 
                            value={data.layout?.numberOfRopes ?? 5} 
                            onChange={e => handleLayoutChange('numberOfRopes', +e.target.value)} 
                            className="w-1/3 h-10 border border-blue-300 rounded px-1 text-center font-bold text-sm bg-blue-50 text-blue-800"
                            title="Počet lán/pásov"
                        />
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Vodidlá Kabína</label>
                    <select value={data.layout?.guideTypeCar} onChange={e => handleLayoutChange('guideTypeCar', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white">{railTypes.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    {data.layout?.guideTypeCar !== recommendedRails.car && (
                        <button 
                            onClick={() => handleLayoutChange('guideTypeCar', recommendedRails.car)}
                            className="text-[9px] text-orange-600 font-bold mt-1 flex items-center gap-1 hover:text-orange-800 hover:bg-orange-50 rounded px-1 w-full"
                            title="Kliknutím aplikujete odporúčané vodítko"
                        >
                            <Info size={10}/> Odporúčané: {recommendedRails.car}
                        </button>
                    )}
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Vodidlá CWT</label>
                    <select value={data.layout?.guideTypeCwt} onChange={e => handleLayoutChange('guideTypeCwt', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white">{railTypes.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    {data.layout?.guideTypeCwt !== recommendedRails.cwt && (
                        <button 
                            onClick={() => handleLayoutChange('guideTypeCwt', recommendedRails.cwt)}
                            className="text-[9px] text-orange-600 font-bold mt-1 flex items-center gap-1 hover:text-orange-800 hover:bg-orange-50 rounded px-1 w-full"
                            title="Kliknutím aplikujete odporúčané vodítko"
                        >
                            <Info size={10}/> Odporúčané: {recommendedRails.cwt}
                        </button>
                    )}
                </div>
                
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Typ Konzol</label>
                    <select value={data.layout?.bracketType || 'standard'} onChange={e => handleLayoutChange('bracketType', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white text-blue-700">
                        <option value="standard">Štandard (2x Hlavná)</option>
                        <option value="combined">Kombinované (BUS + Hlavná)</option>
                    </select>
                </div>

                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Dĺžka Vodidla</label>
                    <select value={data.layout?.guideRailLength || 5000} onChange={e => handleLayoutChange('guideRailLength', +e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white">
                        <option value={5000}>5000 mm</option>
                        <option value={2500}>2500 mm</option>
                    </select>
                </div>

                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Rám (Záves)</label><select value={data.layout?.frameType} onChange={e => handleLayoutChange('frameType', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white"><option value="central">Centrálny (Záves)</option><option value="backpack">Ruksak (Backpack)</option></select></div>

                <div className="col-span-2 flex items-end">
                     {/* UPDATED BUTTON STYLE: Visual checkmark if wizard data exists */}
                     <button 
                        onClick={() => setIsMaterialModalOpen(true)} 
                        className={`w-full h-10 bg-gradient-to-r font-bold rounded shadow flex items-center justify-center gap-2 text-xs transition-all ${
                            data.wizardData 
                            ? 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                            : 'from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white'
                        }`}
                        title="Otvoriť sprievodcu materiálom (Kalkulačka)"
                     >
                        {data.wizardData ? <CheckCircle size={16}/> : <Calculator size={14}/>} 
                        {data.wizardData ? 'Upraviť Materiál' : 'Materiálový Sprievodca'}
                     </button>
                </div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Strojovňa</label><select value={data.layout?.machineRoomPosition} onChange={e => handleLayoutChange('machineRoomPosition', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white"><option value="head">MRL (V šachte)</option><option value="above">Hore</option><option value="cabinet">Skrinka</option></select></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Protiváha</label><select value={data.layout?.counterWeightPosition} onChange={e => handleLayoutChange('counterWeightPosition', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white"><option value="back">Vzadu</option><option value="left">Vľavo</option><option value="right">Vpravo</option></select></div>
                <div className="col-span-2"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Lanovanie</label><select value={data.layout?.suspensionType} onChange={e => handleLayoutChange('suspensionType', e.target.value)} className="w-full h-10 border border-gray-300 rounded px-2 text-sm font-bold bg-white"><option value="1:1">1:1</option><option value="2:1">2:1</option><option value="4:1">4:1</option></select></div>
             </div>
      </div>

      {/* ... REST OF THE COMPONENT (Print Layout, etc.) ... */}
      <div ref={printContentRef} className={`max-w-[210mm] mx-auto bg-white shadow-2xl border border-gray-200 min-h-[297mm] p-[10mm] print:shadow-none print:p-0 print:w-full print:max-w-none print:border-none print:bg-white text-gray-900 print:text-black ${isPreviewMode ? 'scale-[0.8] origin-top mb-10' : ''}`}>
        <div className="print-container">
            {/* ... print header ... */}
            {/* COMPACT PRINT HEADER: Reduced margin-bottom */}
            <div className="mb-8 print:mb-4 print-header print-break-inside-avoid">
                <div className="flex justify-between items-start mb-6 print:mb-2">
                    <div className="w-2/3">
                        <textarea ref={titleInputRef} value={data.title} onChange={e => setData({...data, title: e.target.value})} className="text-4xl font-bold w-full border-none resize-none overflow-hidden bg-transparent text-black mb-1 p-0 leading-tight uppercase whitespace-normal h-auto min-h-[3rem]" placeholder="Názov Dokladu" rows={2}/>
                        {isNumberEditable ? (
                            <input 
                                value={data.number} 
                                onChange={e => setData({...data, number: e.target.value})} 
                                onBlur={() => setIsNumberEditable(false)}
                                className="text-lg text-gray-500 font-medium border-b border-blue-500 outline-none w-full max-w-sm"
                                autoFocus
                            />
                        ) : (
                            <div className="text-lg text-gray-500 font-medium flex items-center gap-2 group">
                                {data.number}
                                <button onClick={handleUnlockNumber} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition no-print" title="Upraviť číslo (Admin)">
                                    <Edit size={14}/>
                                </button>
                            </div>
                        )}
                        {/* VISUAL LINKING INDICATOR IN PRINT */}
                        {data.type !== 'quote' && relatedDoc && (
                            <div className="text-xs text-gray-500 mt-1 font-mono">
                                Ref: {relatedDoc.number}
                            </div>
                        )}
                    </div>
                    <div className="text-right w-1/3">
                         <div className="text-xs text-gray-400 uppercase font-bold mb-1">{data.number}</div>
                         <div className="bg-white border border-gray-100 rounded p-2 inline-block shadow-sm print:border-none print:shadow-none print:p-0">
                            <div className="flex justify-end gap-3 text-xs mb-1"><span className="text-gray-500 font-bold uppercase pt-0.5">Dátum</span><input type="date" value={data.date} onChange={e => setData({...data, date:e.target.value})} className="text-right bg-transparent font-medium w-24 p-0 border-none"/></div>
                             <div className="flex justify-end gap-3 text-xs"><span className="text-gray-500 font-bold uppercase pt-0.5">Platnosť</span><input type="date" value={data.validUntil} onChange={e => setData({...data, validUntil:e.target.value})} className="text-right bg-transparent font-medium w-24 p-0 border-none"/></div>
                         </div>
                     </div>
                </div>

                {/* NEW: Project Reference Row (Moved out of Client column) */}
                <div className="mb-6 bg-blue-50 print:bg-transparent border-l-4 border-blue-600 print:border-black p-3 print:p-0 print:pl-3">
                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1 no-print">Referencia / Projekt:</label>
                    <label className="text-[10px] uppercase font-bold text-gray-400 hidden print:block mb-1">Názov Projektu / Stavby:</label>
                    <input 
                        value={data.clientReference || ''} 
                        onChange={e => setData({...data, clientReference: e.target.value})}
                        className="text-lg font-bold w-full bg-transparent text-blue-900 print:text-black placeholder-gray-300 print:placeholder-transparent uppercase"
                        placeholder="Názov projektu / Adresa stavby"
                    />
                </div>

                {/* COMPACT PRINT HEADER GRID: Reduced padding py-6 -> print:py-4, gap-8 -> print:gap-4 */}
                <div className="grid grid-cols-2 gap-8 print:gap-4 items-start border-t border-b border-gray-100 py-6 print:py-4 print:border-none">
                    <div className="flex flex-col">
                         <div className="flex items-center gap-2 mb-2 pb-1"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dodávateľ</h3>{!isContractMode && (<button onClick={() => setIsSupplierModalOpen(true)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded no-print" title="Vybrať z databázy"><Building size={12}/></button>)}</div>
                        <div className="flex items-start gap-4">
                             <div className="w-[80px] flex justify-center items-center shrink-0">
                                {data.logoUrl ? (<img src={data.logoUrl} alt="Logo" className="max-w-full max-h-[80px] object-contain" />) : !isContractMode ? (<label className="cursor-pointer text-gray-400 border border-dashed border-gray-300 p-2 rounded no-print w-full h-16 flex items-center justify-center text-xs"><Upload size={14} /> Logo<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" /></label>) : null}
                             </div>
                             <div className="flex-1 w-full min-w-0">
                                <textarea 
                                    value={data.supplier.name} 
                                    onChange={e => setData({...data, supplier:{...data.supplier, name:e.target.value}})} 
                                    className="font-bold text-sm w-full bg-transparent mb-1 text-gray-900 print:text-black p-0 uppercase resize-none overflow-hidden h-auto min-h-[3.5rem] whitespace-pre-wrap break-words"
                                    placeholder="Názov Dodávateľa"
                                    rows={1}
                                    onInput={(e) => {
                                        e.currentTarget.style.height = 'auto';
                                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                    }}
                                />
                                <textarea value={data.supplier.details} onChange={e => setData({...data, supplier:{...data.supplier, details:e.target.value}})} className="w-full text-xs text-gray-600 resize-none bg-transparent print:text-black p-0 leading-relaxed" rows={5}/>
                             </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2 pb-1"><h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Klient / Odberateľ</h3>{!isContractMode && (<button onClick={() => setIsClientModalOpen(true)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded no-print" title="Vybrať z databázy"><Users size={12}/></button>)}</div>
                        <div className="pl-4 border-l-2 border-gray-100 print:border-black">
                            <textarea 
                                value={data.client.name} 
                                onChange={e => setData({...data,client:{...data.client, name:e.target.value}})} 
                                className="font-bold text-sm w-full bg-transparent mb-1 text-gray-900 print:text-black p-0 uppercase resize-none overflow-hidden h-auto whitespace-pre-wrap break-words" 
                                placeholder="Meno Klienta"
                                rows={1}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                            />
                            <textarea value={data.client.details} onChange={e => setData({...data, client:{...data.client, details:e.target.value}})} className="w-full text-xs text-gray-600 resize-none bg-transparent print:text-black p-0 leading-relaxed" rows={5} placeholder="Adresa a detaily..."/>
                        </div>
                    </div>
                </div>
            </div>

            {isContractMode && (
                <div className="mb-12">
                    <StandaloneRichTextEditor key={data.id} content={data.contractBody || ''} onChange={val => setData({...data, contractBody: val})} placeholder="Text zmluvy..." />
                </div>
            )}

            {/* TECH SPEC TABLE - ALWAYS VISIBLE */}
            <div className="mb-8 break-inside-avoid">
                {data.showTechSpecs !== false && (
                    <TechSpecTable 
                        data={data.layout || DEFAULT_LAYOUT} 
                        isVisible={true} 
                        onToggleVisibility={toggleTechSpecs} 
                        embedded={true} 
                    />
                )}
            </div>

            <div className="print-break-before"></div>
            
            {isContractMode && <h3 className="font-bold text-lg mb-4 text-center uppercase tracking-widest border-b pb-2">Príloha č. 1: Položkovitý Rozpočet / Špecifikácia</h3>}

            <div className="space-y-4">
                {/* REMOVED: Empty Check Div. Categories are always rendered if present in data.categories */}
                {data.categories.map(cat => (
                    <CategoryTable 
                        key={cat.id}
                        category={cat}
                        currency={data.currency}
                        globalMargin={cat.section === 'shaft' ? data.shaftMargin : data.globalMargin}
                        onUpdateCategory={(id, f, v) => setData(prev => ({...prev, categories: prev.categories.map(c => c.id === id ? {...c, [f]: v} : c)}))}
                        onDeleteCategory={(id) => setData(prev => ({...prev, categories: prev.categories.filter(c => c.id !== id)}))}
                        onAddItem={handleAddItem}
                        onUpdateItem={(cid, iid, f, v) => setData(prev => ({...prev, categories: prev.categories.map(c => c.id === cid ? {...c, items: c.items.map(i => i.id === iid ? {...i, [f]: v} : i)} : c)}))}
                        onDeleteItem={(cid, iid) => setData(prev => ({...prev, categories: prev.categories.map(c => c.id === cid ? {...c, items: c.items.filter(i => i.id !== iid)} : c)}))}
                        onAiSuggest={handleAiCategoryItems}
                        onOpenCatalog={handleOpenCatalog}
                        onMoveCategory={moveCategory}
                        isAiLoading={isAiLoading === cat.id}
                        draggable={true}
                        onDragStart={onDragStartCat}
                        onDragOver={onDragOverCat}
                        onDragEnd={onDragEndCat}
                        hidePrices={data.hideItemPrices || isContractMode}
                        readOnly={data.type !== 'quote'}
                    />
                ))}
                
                {!isContractMode && (
                <div className="no-print mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 bg-gray-50 text-gray-500 hover:bg-gray-100 transition">
                    <span className="text-sm font-bold uppercase mb-2">Pridať novú sekciu</span>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button onClick={() => addCategory('items', 'Nová Kategória')} className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-bold hover:border-blue-500 hover:text-blue-600 shadow-sm flex items-center gap-1 transition"><PlusCircle size={14}/> Prázdna Kategória</button>
                        <button onClick={() => addCategory('text', 'Textová Sekcia')} className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm font-bold hover:border-purple-500 hover:text-purple-600 shadow-sm flex items-center gap-1 transition"><FileText size={14}/> Text / Obrázok</button>
                    </div>
                </div>
                )}
            </div>

            {/* Totals Section */}
            <div className="mt-12 pt-4 border-t-2 border-gray-800 flex justify-end break-inside-avoid">
                {/* ... (Existing totals logic) ... */}
                <div className="w-full max-w-md">
                    <div className="flex justify-between mb-2 text-sm text-gray-500 no-print">
                        <span>Náklady (Bez DPH):</span>
                        <span>{formatCurrency(totals.totalPurchase)}</span>
                    </div>
                    {/* COMPACT TOTALS FOR PRINT: Added print:p-2 print:mb-2 */}
                    <div className="no-print mb-6 print:hidden bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Ekonomika projektu</h3>
                        </div>

                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 w-1/4">Kategória</th>
                                        <th className="px-6 py-3 text-right">Nákup (Bez DPH)</th>
                                        <th className="px-6 py-3 text-center w-32">Marža (%)</th>
                                        <th className="px-6 py-3 text-right text-green-600">Zisk</th>
                                        <th className="px-6 py-3 text-right">Predaj (Bez DPH)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {/* LIFT ROW */}
                                    <tr className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                                                    <Cpu size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">Výťah</div>
                                                    <div className="text-xs text-gray-500">Technológia</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">
                                            {totals.liftCost.toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    value={data.globalMargin} 
                                                    onChange={e => setData({...data, globalMargin: +e.target.value})}
                                                    className="w-20 text-center font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-md py-1 focus:ring-2 focus:ring-blue-400 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 bg-green-50/30">
                                            +{totals.liftProfit.toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {(totals.liftCost + totals.liftProfit).toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                    </tr>

                                    {/* SHAFT ROW */}
                                    <tr className="hover:bg-orange-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
                                                    <Building size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">Šachta</div>
                                                    <div className="text-xs text-gray-500">Materiál</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">
                                            {totals.shaftCost.toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    value={data.shaftMargin} 
                                                    onChange={e => setData({...data, shaftMargin: +e.target.value})}
                                                    className="w-20 text-center font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-md py-1 focus:ring-2 focus:ring-orange-400 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 bg-green-50/30">
                                            +{totals.shaftProfit.toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {(totals.shaftCost + totals.shaftProfit).toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                    </tr>

                                    {/* WORK ROW */}
                                    <tr className="hover:bg-green-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                                                    <Users size={18} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">Práca / Služby</div>
                                                    <div className="text-xs text-gray-500">Montáž, Doprava, Iné</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-600">
                                            {totals.workCost.toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="number" 
                                                    value={data.workMargin ?? 0} 
                                                    onChange={e => setData({...data, workMargin: +e.target.value})}
                                                    className="w-20 text-center font-bold text-green-600 bg-green-50 border border-green-200 rounded-md py-1 focus:ring-2 focus:ring-green-400 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600 bg-green-50/30">
                                            +{totals.workProfit.toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            {(totals.workCost + totals.workProfit).toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                     <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                                                        <div className="bg-purple-100 p-1 rounded text-purple-600"><Zap size={14} /></div>
                                                        <span className="text-xs font-bold text-gray-600 uppercase">DPH Sadzba:</span>
                                                        <input 
                                                            type="number" 
                                                            value={data.vatRate ?? 23} 
                                                            onChange={e => setData({...data, vatRate: +e.target.value})}
                                                            className="w-12 text-center font-bold text-purple-600 bg-transparent outline-none border-b border-purple-200 focus:border-purple-500"
                                                        />
                                                        <span className="text-xs font-bold text-gray-400">%</span>
                                                     </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 uppercase font-bold">Celkový Zisk Projektu</div>
                                                    <div className="text-lg font-bold text-green-600">
                                                        +{(totals.liftProfit + totals.shaftProfit + totals.workProfit).toLocaleString('sk-SK', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>


                    <div className="flex justify-between text-2xl font-bold text-gray-900 mb-1">
                        <span>Cena Celkom:</span>
                        <span>{formatCurrency(totals.totalSelling)}</span>
                    </div>
                    <div className="text-right text-xs text-gray-500 mb-2">bez DPH</div>
                    
                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
                        <span>DPH ({data.vatRate ?? 23}%):</span>
                        <span>{formatCurrency(totals.vat)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-black mt-2 bg-gray-100 p-2 rounded">
                        <span>Spolu s DPH:</span>
                        <span>{formatCurrency(totals.gross)}</span>
                    </div>
                </div>
            </div>

            {!isContractMode && (
                <div className="mt-12 break-inside-avoid">
                    <h3 className="font-bold uppercase text-sm mb-2 text-gray-800">Obchodné podmienky & Záruka</h3>
                    <StandaloneRichTextEditor 
                        content={data.terms} 
                        onChange={val => setData({...data, terms: val})} 
                        className="min-h-[200px] print:min-h-0 print:h-auto" 
                        stickyToolbar={false} 
                        minimalPadding={true} 
                    />
                </div>
            )}

            {/* UPDATED SIGNATURE BLOCK: Cleaned up structure and removed styling that looked like a 'dark box' */}
            {data.type !== 'quote' && (
                <div className="mt-16 grid grid-cols-2 gap-16 break-inside-avoid">
                    <div>
                        <div className="border-b border-gray-800 mb-2 h-16"></div>
                        <div className="text-center text-xs font-bold uppercase text-gray-600">Dátum a Podpis (Objednávateľ)</div>
                    </div>
                    <div>
                        <div className="border-b border-gray-800 mb-2 h-16"></div>
                        <div className="text-center text-xs font-bold uppercase text-gray-600">Dátum a Podpis (Dodávateľ)</div>
                    </div>
                </div>
            )}

        </div>
      </div>
      
      <div className="print-footer">
          <div>{data.number} | {data.title}</div>
          <div>Strana <span className="pageNumber"></span></div>
          <div>SmartQuote SK</div>
      </div>
    </div>
  );
};
