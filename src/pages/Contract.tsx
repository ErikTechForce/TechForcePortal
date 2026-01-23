import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import './Page.css';
import './Contract.css';

const Contract: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [signature, setSignature] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfUrl = '/trialAgreementLocation.pdf';
  
  // Signature placement coordinates (matching OrderDetail.tsx)
  const SIGNATURE_PLACEMENT = { x: 330, y: 590, width: 180, height: 54 };

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
      
      // Fetch the PDF template
      const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      
      // Get pages (signature is typically on the last page)
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      
      // Get page dimensions for reference
      const pageSize = lastPage.getSize();
      console.log(`Page dimensions: ${pageSize.width} × ${pageSize.height} points`);
      
      // Convert data URL to image bytes
      const imageBytes = await fetch(signatureImage).then(res => res.arrayBuffer());
      const signaturePdfImage = await pdfDoc.embedPng(imageBytes);
      
      // Place signature on the last page
      lastPage.drawImage(signaturePdfImage, {
        x: SIGNATURE_PLACEMENT.x,
        y: SIGNATURE_PLACEMENT.y,
        width: SIGNATURE_PLACEMENT.width,
        height: SIGNATURE_PLACEMENT.height,
      });
      
      console.log(`✓ Placed signature at (${SIGNATURE_PLACEMENT.x}, ${SIGNATURE_PLACEMENT.y})`);
      
      // Generate PDF bytes
      const pdfBytes = await pdfDoc.save();
      
      // Create blob URL
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
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

  const handleSubmit = () => {
    if (signature) {
      // In a real app, this would submit the signed contract to the backend
      console.log('Contract submitted with signature:', contractId);
      alert('Contract has been submitted successfully!');
    } else {
      alert('Please sign the contract before submitting.');
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

  return (
    <div className="page-container">
      <div className="contract-page">
        <div className="contract-header">
          <h1 className="contract-title">TechForce Robotics - Trial Agreement</h1>
          <p className="contract-subtitle">Please review the contract below and sign to proceed</p>
        </div>

        {/* PDF Viewer Section */}
        <div className="pdf-viewer-section">
          {isGeneratingPdf && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <p>Generating PDF with your signature...</p>
            </div>
          )}
          {!isGeneratingPdf && (
            <>
              <div className="pdf-container">
                <iframe
                  src={signedPdfUrl || pdfUrl}
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
                      href={signedPdfUrl || pdfUrl} 
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
                    href={pdfUrl} 
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
            disabled={!signature}
          >
            Submit Signed Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contract;
