import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportPatientToPDF(elementId: string, patientName: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KMS_Digital_${patientName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Failed to export PDF', error);
  }
}
