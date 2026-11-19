import { safelyToLocaleDate } from '@/utils/dateUtils';
import { toast } from 'sonner';

// Safe currency formatter avoiding UTF-8 symbol corruption in jsPDF core fonts
export const fmtRs = (val: number | null | undefined, decimals: boolean = false): string => {
  const num = Number(val) || 0;
  if (num === 0) return decimals ? 'Rs. 0.00' : 'Rs. 0';
  return (
    'Rs. ' +
    (decimals
      ? num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : Math.round(num).toLocaleString('en-IN'))
  );
};

// Unified Executive Corporate Header for jsPDF reports
export const drawReportHeader = (
  doc: any,
  title: string,
  subtitle: string,
  period: string,
  pageWidth: number,
  compName: string,
  compGstin: string,
  accentColor: [number, number, number] = [99, 102, 241]
) => {
  doc.setFillColor(15, 23, 42); // Navy/Slate-900
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 36, pageWidth, 1.5, 'F');

  // Left Header Details
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont(undefined, 'bold');
  doc.text(title.toUpperCase(), 14, 15);

  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle, 14, 23);
  doc.text(`Taxpayer Entity: ${compName}  |  GSTIN: ${compGstin}`, 14, 30);

  // Right Header Meta Details
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(248, 250, 252);
  doc.text(`Period: ${period}`, pageWidth - 14, 18, { align: 'right' });
  doc.setFont(undefined, 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Report Generated: ${safelyToLocaleDate(new Date())}`, pageWidth - 14, 26, { align: 'right' });
};

// Unified Multi-Page Footer for jsPDF reports
export const drawReportFooter = (
  doc: any,
  pageWidth: number,
  pageHeight: number,
  reportTitle: string,
  compName: string,
  compGstin: string
) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    doc.setFontSize(7.5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`ESCROW BILL BMS • ${compName} (${compGstin}) • ${reportTitle}`, 14, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
  }
};

export const outputPdf = (
  doc: any,
  filename: string,
  isPrint: boolean = false,
  successMsg: string = 'PDF downloaded successfully.'
) => {
  if (isPrint) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      toast.info('Print Report', { description: 'Opening clean print preview document...' });
    } else {
      doc.save(filename);
      toast.info('Document Saved', {
        description: 'Pop-up was blocked by browser. Report PDF has been downloaded for printing.',
      });
    }
  } else {
    doc.save(filename);
    toast.success('Success', { description: successMsg });
  }
};

