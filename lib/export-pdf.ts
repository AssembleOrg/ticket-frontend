import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export async function exportReceiptToPdf(
  elementId: string,
  fileName: string,
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error("Element not found");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#111117",
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 10;
  const contentWidth = pdfWidth - margin * 2;
  const contentHeight = (imgHeight * contentWidth) / imgWidth;

  const orientation = contentHeight > pdfHeight - margin * 2 ? "p" : "p";
  const pdf = new jsPDF(orientation, "mm", "a4");

  pdf.addImage(imgData, "PNG", margin, margin, contentWidth, contentHeight);
  pdf.save(`${fileName}.pdf`);
}
