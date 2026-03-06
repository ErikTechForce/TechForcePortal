import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import './Page.css';
import './Contract.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface ContractFormData {
  businessName: string;
  serviceAddress: string;
  cityStateZip: string;
  locationContactNamePhone: string;
  locationContactEmail: string;
  authorizedPersonName: string;
  authorizedPersonTitle: string;
  authorizedPersonEmail: string;
  authorizedPersonPhone: string;
  effectiveDate: string;
  termStartDate: string;
  implementationCost?: string;
  shippingFee?: string;
  qtyTimEBot?: string;
  qtyTimECharger?: string;
  qtyBaseMetalMonthly?: string;
  qtyInsulatedFoodTransportMonthly?: string;
  qtyWheeledBinMonthly?: string;
  qtyUniversalPlatformMonthly?: string;
  qtyDoorOpenersMonthly?: string;
  qtyNeuralTechBrainMonthly?: string;
  qtyElevatorHardwareMonthly?: string;
  qtyLuggageCartMonthly?: string;
  monthlyRoboticServiceCost?: string;
  qtyConcessionBinTall?: string;
  qtyStackingChairCart?: string;
  qtyCargoCart?: string;
  qtyHousekeepingCart?: string;
  qtyBIME?: string;
  qtyMobileBIME?: string;
  qtyBaseMetalOneTime?: string;
  qtyInsulatedFoodTransportOneTime?: string;
  qtyWheeledBinOneTime?: string;
  qtyUniversalPlatformOneTime?: string;
  qtyPlasticBags?: string;
  qtyDoorOpenerHardwareOneTime?: string;
  qtyHandheldTablet?: string;
  additionalAccessoriesCost?: string;
  totalMonthlyCost?: string;
  implementationCostDue?: string;
  techForceSignature?: string;
  scopeText?: string;
  qtyBinsTrial?: string;
  qtyBasesTrial?: string;
}

type Placement = { x: number; y: number; fontSize?: number; width?: number; height?: number; pageIndex?: number };

/** Convert number to spelled-out word for contract (0–99). */
function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return '';
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o ? '-' + ones[o] : '');
}

const SPELLED_OUT_OFFSET = 15;

// Page 1 height = 792 pt (letter). Y from bottom: higher = higher on page. Right column for all fill-in values.
// Line spacing ~16pt. Effective date top-right; then client block; then financial; then Qty numbers in same column.
const TEXT_PLACEMENTS: Record<string, Placement> = {
  effectiveDate: { x: 498, y: 670, fontSize: 10 },
  businessName: { x: 268, y: 636, fontSize: 10 },
  serviceAddress: { x: 268, y: 611, fontSize: 10 },
  cityStateZip: { x: 268, y: 585, fontSize: 10 },
  locationContactNamePhone: { x: 268, y: 560, fontSize: 10 },
  locationContactEmail: { x: 268, y: 537, fontSize: 10 },
  // Billing (under location, above authorized)
  billingEntity: { x: 268, y: 517, fontSize: 10 },
  billingCityStateZip: { x: 268, y: 495, fontSize: 10 },
  billingContactNamePhone: { x: 268, y: 472, fontSize: 10 },
  billingContactEmail: { x: 268, y: 447, fontSize: 10 },
  authorizedPersonName: { x: 268, y: 422, fontSize: 10 },
  authorizedPersonTitle: { x: 268, y: 401, fontSize: 10 },
  authorizedPersonEmail: { x: 268, y: 378, fontSize: 10 },
  authorizedPersonPhone: { x: 268, y: 354, fontSize: 10 },
  termStartDate: { x: 268, y: 276, fontSize: 10 },
  implementationCost: { x: 268, y: 253, fontSize: 10 },
  shippingFee: { x: 268, y: 232, fontSize: 10 },
  qtyTimEBot: { x: 289, y: 212, fontSize: 10 },
  qtyTimECharger: { x: 289, y: 193, fontSize: 10 },
  qtyBaseMetalMonthly: { x: 289, y: 176, fontSize: 10 },
  qtyInsulatedFoodTransportMonthly: { x: 289, y: 159, fontSize: 10 },
  qtyWheeledBinMonthly: { x: 289, y: 143, fontSize: 10 },
  qtyUniversalPlatformMonthly: { x: 289, y: 125, fontSize: 10 },
  qtyDoorOpenersMonthly: { x: 289, y: 107, fontSize: 10 },
  qtyNeuralTechBrainMonthly: { x: 289, y: 89, fontSize: 10 },
  qtyElevatorHardwareMonthly: { x: 289, y: 72, fontSize: 10 },
  qtyLuggageCartMonthly: { x: 289, y: 54, fontSize: 10 },
  clientSignature: { x: 330, y: 590, width: 180, height: 54 },
  // Page 2 – same right-column x=398, y stepped to match form lines
  qtyConcessionBinTall: { x: 289, y: 745, fontSize: 10, pageIndex: 1 },
  qtyStackingChairCart: { x: 289, y: 727, fontSize: 10, pageIndex: 1 },
  qtyCargoCart: { x: 289, y: 712, fontSize: 10, pageIndex: 1 },
  qtyHousekeepingCart: { x: 289, y: 697, fontSize: 10, pageIndex: 1 },
  qtyBIME: { x: 289, y: 681, fontSize: 10, pageIndex: 1 },
  qtyMobileBIME: { x: 289, y: 652, fontSize: 10, pageIndex: 1 },
  monthlyRoboticServiceCost: { x: 281, y: 627, fontSize: 10, pageIndex: 1 },
  qtyBaseMetalOneTime: { x: 289, y: 605, fontSize: 10, pageIndex: 1 },
  qtyInsulatedFoodTransportOneTime: { x: 289, y: 587, fontSize: 10, pageIndex: 1 },
  qtyWheeledBinOneTime: { x: 289, y: 570, fontSize: 10, pageIndex: 1 },
  qtyUniversalPlatformOneTime: { x: 289, y: 553, fontSize: 10, pageIndex: 1 },
  qtyPlasticBags: { x: 289, y: 534, fontSize: 10, pageIndex: 1 },
  qtyDoorOpenerHardwareOneTime: { x: 289, y: 517, fontSize: 10, pageIndex: 1 },
  qtyHandheldTablet: { x: 289, y: 499, fontSize: 10, pageIndex: 1 },
  additionalAccessoriesCost: { x: 281, y: 456, fontSize: 10, pageIndex: 1 },
  implementationCostPage2: { x: 281, y: 429, fontSize: 10, pageIndex: 1 },
  totalMonthlyCost: { x: 281, y: 391, fontSize: 10, pageIndex: 1 },
  implementationCostDue: { x: 281, y: 314, fontSize: 10, pageIndex: 1 },
  techforceSignature: { x: 100, y: 105, width: 180, height: 54, pageIndex: 4 },
  /** Client signature on page 5, right side */
  clientSignatureLastPage: { x: 340, y: 105, width: 180, height: 54, pageIndex: 4 },
};

/** Trial agreement: same coordinates as OrderDetail (generated contract) so client-signed PDF matches. */
const TRIAL_TEXT_PLACEMENTS: Record<string, Placement> = {
  effectiveDate: { x: 498, y: 615, fontSize: 10 },
  businessName: { x: 213, y: 560, fontSize: 10 },
  serviceAddress: { x: 213, y: 527, fontSize: 10 },
  cityStateZip: { x: 213, y: 502, fontSize: 10 },
  locationContactNamePhone: { x: 213, y: 472, fontSize: 10 },
  locationContactEmail: { x: 213, y: 441, fontSize: 10 },
  authorizedPersonName: { x: 213, y: 407, fontSize: 10 },
  authorizedPersonTitle: { x: 213, y: 378, fontSize: 10 },
  authorizedPersonEmail: { x: 213, y: 350, fontSize: 10 },
  authorizedPersonPhone: { x: 213, y: 305, fontSize: 10 },
  qtyTimEBot: { x: 317, y: 681, fontSize: 10, pageIndex: 1 },
  qtyBinsTrial: { x: 480, y: 681, fontSize: 10, pageIndex: 1 },
  qtyBasesTrial: { x: 135, y: 666, fontSize: 10, pageIndex: 1 },
  qtyBIME: { x: 404, y: 666, fontSize: 10, pageIndex: 1 },
  scopeText: { x: 100, y: 580, fontSize: 9, pageIndex: 1 },
  techforceSignature: { x: 110, y: 360, width: 180, height: 54, pageIndex: 5 },
  clientSignatureLastPage: { x: 340, y: 360, width: 180, height: 54, pageIndex: 5 },
};

const Contract: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const contractType = (searchParams.get('type') === 'service' ? 'service' : 'trial') as 'service' | 'trial';
  const pdfUrl = contractType === 'service' ? '/agreementLocation.pdf' : '/trialAgreementLocation.pdf';

  const [formData, setFormData] = useState<ContractFormData | null>(null);
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [fillError, setFillError] = useState<string | null>(null);
  const [billingEntity, setBillingEntity] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [billingContactName, setBillingContactName] = useState('');
  const [billingContactPhone, setBillingContactPhone] = useState('');
  const [billingContactEmail, setBillingContactEmail] = useState('');
  const [contractStatus, setContractStatus] = useState<'pending' | 'signed' | null>(null);
  const [contractStatusLoading, setContractStatusLoading] = useState(true);

  const CLIENT_SIGNATURE_PLACEMENT = TEXT_PLACEMENTS.clientSignatureLastPage as { x: number; y: number; width?: number; height?: number };

  // Parse form data from URL hash (set by Order Detail when generating the link)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const decoded = decodeURIComponent(escape(atob(hash)));
      const data = JSON.parse(decoded) as ContractFormData;
      setFormData(data);
    } catch {
      setFillError('Invalid contract data in link.');
    }
  }, []);

  // Check if contract was already submitted (signed) — show thank-you instead of form
  useEffect(() => {
    if (!contractId) {
      setContractStatusLoading(false);
      setContractStatus('pending');
      return;
    }
    let cancelled = false;
    fetch(`${API_BASE}/api/contracts/status/${encodeURIComponent(contractId)}`)
      .then((res) => (res.ok ? res.json() : { status: 'pending' }))
      .then((data: { status?: string }) => {
        if (!cancelled) {
          setContractStatus((data.status === 'signed' ? 'signed' : 'pending') as 'pending' | 'signed');
        }
      })
      .catch(() => {
        if (!cancelled) setContractStatus('pending');
      })
      .finally(() => {
        if (!cancelled) setContractStatusLoading(false);
      });
    return () => { cancelled = true; };
  }, [contractId]);

  // Load template PDF and fill with form data when formData is available
  useEffect(() => {
    if (!formData) return;
    const run = async () => {
      try {
        const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const placements = contractType === 'trial' ? TRIAL_TEXT_PLACEMENTS : TEXT_PLACEMENTS;

        const placeText = (key: string, value: string | undefined) => {
          const placement = placements[key];
          if (!placement || !('fontSize' in placement)) return;
          const text = String(value ?? '').trim();
          if (!text) return;
          const pageIndex = placement.pageIndex ?? 0;
          const page = pages[pageIndex] ?? firstPage;
          page.drawText(text, {
            x: placement.x,
            y: placement.y,
            size: placement.fontSize ?? 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        };

        const placeQuantityWithSpelledOut = (key: string, value: string | undefined) => {
          const placement = placements[key];
          if (!placement || !('fontSize' in placement)) return;
          const text = String(value ?? '').trim();
          if (!text) return;
          const pageIndex = placement.pageIndex ?? 0;
          const page = pages[pageIndex] ?? firstPage;
          page.drawText(text, {
            x: placement.x,
            y: placement.y,
            size: placement.fontSize ?? 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          const num = parseInt(text, 10);
          if (!Number.isNaN(num)) {
            const word = numberToWords(num);
            if (word) {
              page.drawText(word, {
                x: placement.x + SPELLED_OUT_OFFSET,
                y: placement.y,
                size: placement.fontSize ?? 10,
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
            }
          }
        };

        if (contractType === 'trial') {
          placeText('effectiveDate', formData.effectiveDate);
          placeText('businessName', formData.businessName);
          placeText('serviceAddress', formData.serviceAddress);
          placeText('cityStateZip', formData.cityStateZip);
          placeText('locationContactNamePhone', formData.locationContactNamePhone);
          placeText('locationContactEmail', formData.locationContactEmail);
          placeText('authorizedPersonName', formData.authorizedPersonName);
          placeText('authorizedPersonTitle', formData.authorizedPersonTitle);
          placeText('authorizedPersonEmail', formData.authorizedPersonEmail);
          placeText('authorizedPersonPhone', formData.authorizedPersonPhone);
          placeQuantityWithSpelledOut('qtyTimEBot', formData.qtyTimEBot);
          placeQuantityWithSpelledOut('qtyBinsTrial', formData.qtyBinsTrial);
          placeQuantityWithSpelledOut('qtyBasesTrial', formData.qtyBasesTrial);
          placeQuantityWithSpelledOut('qtyBIME', formData.qtyBIME);
          if (formData.scopeText) {
            const scopePlacement = TRIAL_TEXT_PLACEMENTS.scopeText;
            if (scopePlacement && scopePlacement.fontSize) {
              const lines = formData.scopeText.split(/\r?\n/).filter(Boolean);
              const lineHeight = (scopePlacement.fontSize ?? 9) + 2;
              const page = pages[scopePlacement.pageIndex ?? 0] ?? firstPage;
              let y = scopePlacement.y;
              for (const line of lines.slice(0, 20)) {
                if (y < 50) break;
                page.drawText(line.slice(0, 80), {
                  x: scopePlacement.x,
                  y,
                  size: scopePlacement.fontSize ?? 9,
                  font: helveticaFont,
                  color: rgb(0, 0, 0),
                });
                y -= lineHeight;
              }
            }
          }
        } else {
          placeText('effectiveDate', formData.effectiveDate);
          placeText('businessName', formData.businessName);
          placeText('serviceAddress', formData.serviceAddress);
          placeText('cityStateZip', formData.cityStateZip);
          placeText('locationContactNamePhone', formData.locationContactNamePhone);
          placeText('locationContactEmail', formData.locationContactEmail);
          placeText('authorizedPersonName', formData.authorizedPersonName);
          placeText('authorizedPersonTitle', formData.authorizedPersonTitle);
          placeText('authorizedPersonEmail', formData.authorizedPersonEmail);
          placeText('authorizedPersonPhone', formData.authorizedPersonPhone);
          placeText('termStartDate', formData.termStartDate);
          placeText('implementationCost', formData.implementationCost);
          placeText('shippingFee', formData.shippingFee);
          placeText('qtyTimEBot', formData.qtyTimEBot);
          placeText('qtyTimECharger', formData.qtyTimECharger);
          placeText('qtyBaseMetalMonthly', formData.qtyBaseMetalMonthly);
          placeText('qtyInsulatedFoodTransportMonthly', formData.qtyInsulatedFoodTransportMonthly);
          placeText('qtyWheeledBinMonthly', formData.qtyWheeledBinMonthly);
          placeText('qtyUniversalPlatformMonthly', formData.qtyUniversalPlatformMonthly);
          placeText('qtyDoorOpenersMonthly', formData.qtyDoorOpenersMonthly);
          placeText('qtyNeuralTechBrainMonthly', formData.qtyNeuralTechBrainMonthly);
          placeText('qtyElevatorHardwareMonthly', formData.qtyElevatorHardwareMonthly);
          placeText('qtyLuggageCartMonthly', formData.qtyLuggageCartMonthly);
          placeText('qtyConcessionBinTall', formData.qtyConcessionBinTall);
          placeText('qtyStackingChairCart', formData.qtyStackingChairCart);
          placeText('qtyCargoCart', formData.qtyCargoCart);
          placeText('qtyHousekeepingCart', formData.qtyHousekeepingCart);
          placeText('qtyBIME', formData.qtyBIME);
          placeText('qtyMobileBIME', formData.qtyMobileBIME);
          placeText('monthlyRoboticServiceCost', formData.monthlyRoboticServiceCost);
          placeText('qtyBaseMetalOneTime', formData.qtyBaseMetalOneTime);
          placeText('qtyInsulatedFoodTransportOneTime', formData.qtyInsulatedFoodTransportOneTime);
          placeText('qtyWheeledBinOneTime', formData.qtyWheeledBinOneTime);
          placeText('qtyUniversalPlatformOneTime', formData.qtyUniversalPlatformOneTime);
          placeText('qtyPlasticBags', formData.qtyPlasticBags);
          placeText('qtyDoorOpenerHardwareOneTime', formData.qtyDoorOpenerHardwareOneTime);
          placeText('qtyHandheldTablet', formData.qtyHandheldTablet);
          placeText('additionalAccessoriesCost', formData.additionalAccessoriesCost);
          placeText('implementationCostPage2', formData.implementationCost);
          placeText('totalMonthlyCost', formData.totalMonthlyCost);
          placeText('implementationCostDue', formData.implementationCostDue);
        }

        if (formData.techForceSignature) {
          const lastPage = pages[pages.length - 1];
          const placement = (contractType === 'trial' ? TRIAL_TEXT_PLACEMENTS : TEXT_PLACEMENTS).techforceSignature as { x: number; y: number; width?: number; height?: number; pageIndex?: number } | undefined;
          if (lastPage && placement && placement.width) {
            const imageBytes = await fetch(formData.techForceSignature).then((r) => r.arrayBuffer());
            const img = await pdfDoc.embedPng(imageBytes);
            const sigPage = placement.pageIndex !== undefined ? pages[placement.pageIndex] : lastPage;
            if (sigPage) sigPage.drawImage(img, { x: placement.x, y: placement.y, width: placement.width ?? 180, height: placement.height ?? 54 });
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blobUrl = URL.createObjectURL(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));
        setFilledPdfUrl(blobUrl);
        setFillError(null);
      } catch (err) {
        console.error('Error filling PDF:', err);
        setFillError('Could not load or fill the contract PDF.');
      }
    };
    run();
  }, [formData, pdfUrl, contractType]);

  useEffect(() => {
    return () => {
      if (filledPdfUrl && filledPdfUrl.startsWith('blob:')) URL.revokeObjectURL(filledPdfUrl);
    };
  }, [filledPdfUrl]);

  // Signature pad handlers
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const generatePdfWithSignature = async (signatureImage: string) => {
    try {
      setIsGeneratingPdf(true);
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const lastPage = pages[pages.length - 1];
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const placements = contractType === 'trial' ? TRIAL_TEXT_PLACEMENTS : TEXT_PLACEMENTS;
      const clientSigPlacement = (contractType === 'trial' ? TRIAL_TEXT_PLACEMENTS : TEXT_PLACEMENTS).clientSignatureLastPage as { x: number; y: number; width?: number; height?: number; pageIndex?: number };

      if (formData) {
        const placeText = (key: string, value: string | undefined) => {
          const placement = placements[key];
          if (!placement || !('fontSize' in placement)) return;
          const text = String(value ?? '').trim();
          if (!text) return;
          const pageIndex = placement.pageIndex ?? 0;
          const page = pages[pageIndex] ?? firstPage;
          page.drawText(text, {
            x: placement.x,
            y: placement.y,
            size: placement.fontSize ?? 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        };
        const placeQuantityWithSpelledOut = (key: string, value: string | undefined) => {
          const placement = placements[key];
          if (!placement || !('fontSize' in placement)) return;
          const text = String(value ?? '').trim();
          if (!text) return;
          const pageIndex = placement.pageIndex ?? 0;
          const page = pages[pageIndex] ?? firstPage;
          page.drawText(text, {
            x: placement.x,
            y: placement.y,
            size: placement.fontSize ?? 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          const num = parseInt(text, 10);
          if (!Number.isNaN(num)) {
            const word = numberToWords(num);
            if (word) {
              page.drawText(word, {
                x: placement.x + SPELLED_OUT_OFFSET,
                y: placement.y,
                size: placement.fontSize ?? 10,
                font: helveticaFont,
                color: rgb(0, 0, 0),
              });
            }
          }
        };
        if (contractType === 'trial') {
          placeText('effectiveDate', formData.effectiveDate);
          placeText('businessName', formData.businessName);
          placeText('serviceAddress', formData.serviceAddress);
          placeText('cityStateZip', formData.cityStateZip);
          placeText('locationContactNamePhone', formData.locationContactNamePhone);
          placeText('locationContactEmail', formData.locationContactEmail);
          placeText('authorizedPersonName', formData.authorizedPersonName);
          placeText('authorizedPersonTitle', formData.authorizedPersonTitle);
          placeText('authorizedPersonEmail', formData.authorizedPersonEmail);
          placeText('authorizedPersonPhone', formData.authorizedPersonPhone);
          placeQuantityWithSpelledOut('qtyTimEBot', formData.qtyTimEBot);
          placeQuantityWithSpelledOut('qtyBinsTrial', formData.qtyBinsTrial);
          placeQuantityWithSpelledOut('qtyBasesTrial', formData.qtyBasesTrial);
          placeQuantityWithSpelledOut('qtyBIME', formData.qtyBIME);
          if (formData.scopeText) {
            const scopePlacement = TRIAL_TEXT_PLACEMENTS.scopeText;
            if (scopePlacement && scopePlacement.fontSize) {
              const lines = formData.scopeText.split(/\r?\n/).filter(Boolean);
              const lineHeight = (scopePlacement.fontSize ?? 9) + 2;
              const page = pages[scopePlacement.pageIndex ?? 0] ?? firstPage;
              let y = scopePlacement.y;
              for (const line of lines.slice(0, 20)) {
                if (y < 50) break;
                page.drawText(line.slice(0, 80), { x: scopePlacement.x, y, size: scopePlacement.fontSize ?? 9, font: helveticaFont, color: rgb(0, 0, 0) });
                y -= lineHeight;
              }
            }
          }
        } else {
          placeText('effectiveDate', formData.effectiveDate);
          placeText('businessName', formData.businessName);
          placeText('serviceAddress', formData.serviceAddress);
          placeText('cityStateZip', formData.cityStateZip);
          placeText('locationContactNamePhone', formData.locationContactNamePhone);
          placeText('locationContactEmail', formData.locationContactEmail);
          placeText('billingEntity', billingEntity);
          const billingCityStateZipLine = [billingAddress, [billingCity, [billingState, billingZip].filter(Boolean).join(' ')].filter(Boolean).join(', ')].filter(Boolean).join(', ');
          placeText('billingCityStateZip', billingCityStateZipLine);
          placeText('billingContactNamePhone', `${billingContactName} ${billingContactPhone}`.trim());
          placeText('billingContactEmail', billingContactEmail);
          placeText('authorizedPersonName', formData.authorizedPersonName);
          placeText('authorizedPersonTitle', formData.authorizedPersonTitle);
          placeText('authorizedPersonEmail', formData.authorizedPersonEmail);
          placeText('authorizedPersonPhone', formData.authorizedPersonPhone);
          placeText('termStartDate', formData.termStartDate);
          placeText('implementationCost', formData.implementationCost);
          placeText('shippingFee', formData.shippingFee);
          placeText('qtyTimEBot', formData.qtyTimEBot);
          placeText('qtyTimECharger', formData.qtyTimECharger);
          placeText('qtyBaseMetalMonthly', formData.qtyBaseMetalMonthly);
          placeText('qtyInsulatedFoodTransportMonthly', formData.qtyInsulatedFoodTransportMonthly);
          placeText('qtyWheeledBinMonthly', formData.qtyWheeledBinMonthly);
          placeText('qtyUniversalPlatformMonthly', formData.qtyUniversalPlatformMonthly);
          placeText('qtyDoorOpenersMonthly', formData.qtyDoorOpenersMonthly);
          placeText('qtyNeuralTechBrainMonthly', formData.qtyNeuralTechBrainMonthly);
          placeText('qtyElevatorHardwareMonthly', formData.qtyElevatorHardwareMonthly);
          placeText('qtyLuggageCartMonthly', formData.qtyLuggageCartMonthly);
          placeText('qtyConcessionBinTall', formData.qtyConcessionBinTall);
          placeText('qtyStackingChairCart', formData.qtyStackingChairCart);
          placeText('qtyCargoCart', formData.qtyCargoCart);
          placeText('qtyHousekeepingCart', formData.qtyHousekeepingCart);
          placeText('qtyBIME', formData.qtyBIME);
          placeText('qtyMobileBIME', formData.qtyMobileBIME);
          placeText('monthlyRoboticServiceCost', formData.monthlyRoboticServiceCost);
          placeText('qtyBaseMetalOneTime', formData.qtyBaseMetalOneTime);
          placeText('qtyInsulatedFoodTransportOneTime', formData.qtyInsulatedFoodTransportOneTime);
          placeText('qtyWheeledBinOneTime', formData.qtyWheeledBinOneTime);
          placeText('qtyUniversalPlatformOneTime', formData.qtyUniversalPlatformOneTime);
          placeText('qtyPlasticBags', formData.qtyPlasticBags);
          placeText('qtyDoorOpenerHardwareOneTime', formData.qtyDoorOpenerHardwareOneTime);
          placeText('qtyHandheldTablet', formData.qtyHandheldTablet);
          placeText('additionalAccessoriesCost', formData.additionalAccessoriesCost);
          placeText('implementationCostPage2', formData.implementationCost);
          placeText('totalMonthlyCost', formData.totalMonthlyCost);
          placeText('implementationCostDue', formData.implementationCostDue);
        }
      }

      if (formData?.techForceSignature) {
        const placement = placements.techforceSignature as { x: number; y: number; width?: number; height?: number; pageIndex?: number } | undefined;
        if (placement && placement.width) {
          const techForceImageBytes = await fetch(formData.techForceSignature).then((r) => r.arrayBuffer());
          const techForceImg = await pdfDoc.embedPng(techForceImageBytes);
          const sigPage = placement.pageIndex !== undefined ? pages[placement.pageIndex] : lastPage;
          if (sigPage) sigPage.drawImage(techForceImg, { x: placement.x, y: placement.y, width: placement.width ?? 180, height: placement.height ?? 54 });
        }
      }

      const imageBytes = await fetch(signatureImage).then(res => res.arrayBuffer());
      const signaturePdfImage = await pdfDoc.embedPng(imageBytes);
      const sigPageIndex = clientSigPlacement.pageIndex !== undefined ? clientSigPlacement.pageIndex : pages.length - 1;
      const sigPage = pages[sigPageIndex] ?? lastPage;
      if (sigPage) sigPage.drawImage(signaturePdfImage, {
        x: clientSigPlacement.x,
        y: clientSigPlacement.y,
        width: clientSigPlacement.width ?? 180,
        height: clientSigPlacement.height ?? 54,
      });

      const pdfBytes = await pdfDoc.save();
      const url = URL.createObjectURL(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }));
      setIsGeneratingPdf(false);
      return url;
    } catch (error) {
      console.error('Error generating PDF with signature:', error);
      setIsGeneratingPdf(false);
      return null;
    }
  };

  const saveSignature = async () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png');
    setSignature(dataURL);
    
    // Generate PDF with signature
    const signedPdf = await generatePdfWithSignature(dataURL);
    if (signedPdf) {
      // Clean up previous blob URL if it exists
      if (signedPdfUrl && signedPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(signedPdfUrl);
      }
      setSignedPdfUrl(signedPdf);
      alert('Signature saved! A new PDF with your signature has been generated.');
    } else {
      alert('Signature saved, but there was an error generating the PDF. Please try again.');
    }
  };
  
  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (signedPdfUrl && signedPdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(signedPdfUrl);
      }
    };
  }, [signedPdfUrl]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!signature) {
      alert('Please sign the contract before submitting.');
      return;
    }
    if (!contractId) {
      alert('Invalid contract link.');
      return;
    }
    setIsSubmitting(true);
    try {
      let pdfUrlToSend = signedPdfUrl;
      if (!pdfUrlToSend) {
        const url = await generatePdfWithSignature(signature);
        if (url) {
          pdfUrlToSend = url;
          if (signedPdfUrl && signedPdfUrl.startsWith('blob:')) URL.revokeObjectURL(signedPdfUrl);
          setSignedPdfUrl(url);
        }
      }
      if (!pdfUrlToSend) {
        alert('Could not generate the signed PDF. Please try again.');
        setIsSubmitting(false);
        return;
      }
      const res = await fetch(pdfUrlToSend);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const patchRes = await fetch(`${API_BASE}/api/contracts/${encodeURIComponent(contractId)}/signed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_signed: base64,
          billingEntity: billingEntity?.trim() || undefined,
          billingAddress: billingAddress?.trim() || undefined,
          billingCity: billingCity?.trim() || undefined,
          billingState: billingState?.trim() || undefined,
          billingZip: billingZip?.trim() || undefined,
        }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        alert(err.error || 'Failed to save signed contract.');
        setIsSubmitting(false);
        return;
      }
      setContractStatus('signed');
    } catch (err) {
      console.error('Submit signed contract:', err);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const displayPdfUrl = signedPdfUrl || filledPdfUrl || pdfUrl;
  const contractTitle = contractType === 'service'
    ? 'TechForce Robotics - Robot Service Agreement'
    : 'TechForce Robotics - Robot TRIAL Agreement';

  const isSubmitted = contractStatus === 'signed';

  return (
    <div className="page-container">
      <div className="contract-page">
        {contractStatusLoading ? (
          <div className="contract-thanks-section">
            <p className="contract-thanks-loading">Loading…</p>
          </div>
        ) : isSubmitted ? (
          <div className="contract-thanks-section">
            <h1 className="contract-thanks-title">Thank you</h1>
            <p className="contract-thanks-message">Thanks for submitting the information needed. Your contract has been received.</p>
          </div>
        ) : (
          <>
        <div className="contract-header">
          <h1 className="contract-title">{contractTitle}</h1>
          <p className="contract-subtitle">Please review the contract below and sign to proceed</p>
        </div>

        {/* PDF Viewer Section */}
        <div className="pdf-viewer-section">
          {fillError && (
            <div className="contract-fill-error" role="alert">
              {fillError}
            </div>
          )}
          {window.location.hash && !formData && !fillError && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Loading contract…
            </p>
          )}
          {isGeneratingPdf && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>Generating PDF with your signature...</p>
            </div>
          )}
          {!isGeneratingPdf && !fillError && (formData || !window.location.hash) && (
            <>
              <div className="pdf-container">
                <iframe
                  src={displayPdfUrl}
                  className="pdf-iframe"
                  title="Contract PDF"
                  onError={(e) => {
                    console.error('PDF load error:', e);
                    setPdfError(true);
                  }}
                />
                {pdfError && (
                  <div className="pdf-fallback">
                    <p>Unable to display PDF inline. Please use the link below to view the contract.</p>
                    <a 
                      href={displayPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="pdf-download-link"
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                )}
              </div>
              <div className="pdf-alternative-link">
                {signedPdfUrl && (
                  <>
                    <a 
                      href={signedPdfUrl} 
                      download={`Signed-Contract-${contractId}.pdf`}
                      className="pdf-download-link"
                      style={{ marginRight: '0.5rem' }}
                    >
                      📥 Download Signed PDF
                    </a>
                    <a 
                      href={signedPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="pdf-download-link"
                    >
                      📄 View Signed PDF
                    </a>
                  </>
                )}
                {!signedPdfUrl && (
                  <a 
                    href={displayPdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="pdf-download-link"
                  >
                    📄 Open PDF in new tab
                  </a>
                )}
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                  {signedPdfUrl 
                    ? 'Your signature has been added to the PDF. Download or view the signed version above.'
                    : 'If the PDF doesn\'t display above, click the link to view it in a new tab'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Billing Information (service agreement only; trial link only asks for signature) */}
        {contractType !== 'trial' && (
        <div className="contract-billing-section">
          <h2 className="contract-billing-title">Billing Information</h2>
          <p className="contract-billing-description">Please provide billing details. This information will appear on the contract PDF when you submit.</p>
          <div className="contract-billing-grid">
            <div className="contract-form-group">
              <label className="form-label">Billing Entity</label>
              <input
                type="text"
                className="form-input"
                value={billingEntity}
                onChange={(e) => setBillingEntity(e.target.value)}
                placeholder="Company or entity name"
              />
            </div>
            <div className="contract-form-group contract-form-group-full">
              <label className="form-label">Billing Address</label>
              <input
                type="text"
                className="form-input"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>
            <div className="contract-form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-input"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="contract-form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                className="form-input"
                value={billingState}
                onChange={(e) => setBillingState(e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="contract-form-group">
              <label className="form-label">Zip</label>
              <input
                type="text"
                className="form-input"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
                placeholder="Zip"
              />
            </div>
            <div className="contract-form-group">
              <label className="form-label">Billing Contact Name</label>
              <input
                type="text"
                className="form-input"
                value={billingContactName}
                onChange={(e) => setBillingContactName(e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="contract-form-group">
              <label className="form-label">Billing Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                value={billingContactPhone}
                onChange={(e) => setBillingContactPhone(e.target.value.replace(/[^\d\s\-().+]/g, ''))}
                placeholder="Phone number"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div className="contract-form-group contract-form-group-full">
              <label className="form-label">Billing Contact Email</label>
              <input
                type="email"
                className="form-input"
                value={billingContactEmail}
                onChange={(e) => setBillingContactEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>
        </div>
        )}

        {/* Signature Section */}
        <div className="signature-section">
          <h2 className="signature-section-title">Sign Contract</h2>
          <div className="signature-pad-container">
            <canvas
              ref={signatureCanvasRef}
              className="signature-canvas"
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="signature-actions">
              <button
                type="button"
                className="clear-signature-button"
                onClick={clearSignature}
              >
                Clear
              </button>
              <button
                type="button"
                className="save-signature-button"
                onClick={saveSignature}
              >
                Save Signature
              </button>
            </div>
            {signature && (
              <div className="signature-preview">
                <p className="signature-saved-message">✓ Signature saved</p>
                <img src={signature} alt="Saved signature" className="signature-image" />
              </div>
            )}
          </div>
        </div>

        {/* Submit Section */}
        <div className="contract-submit-section">
          <button
            type="button"
            className="submit-contract-button"
            onClick={handleSubmit}
            disabled={!signature || isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Signed Contract'}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Contract;
