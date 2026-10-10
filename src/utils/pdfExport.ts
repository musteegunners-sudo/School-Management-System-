import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  elementId: string;
  fileName?: string;
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Exports any DOM element to a professional high-DPI A4 PDF document.
 */
export async function exportElementToPdf({
  elementId,
  fileName = 'ReportCard.pdf',
  onProgress,
}: PdfExportOptions): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found in document.`);
  }

  if (onProgress) onProgress(20, 'Preparing document...');

  // Capture element using html2canvas with 2x retina scale for crisp vector-like text
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  if (onProgress) onProgress(60, 'Rendering high-resolution PDF...');

  const imgData = canvas.toDataURL('image/png', 1.0);

  // A4 paper dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Handle multi-page if report card overflows A4 bounds
  while (heightLeft > 5) {
    position = -(imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  if (onProgress) onProgress(90, 'Finalizing download...');

  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(safeFileName);

  if (onProgress) onProgress(100, 'Complete');
}
