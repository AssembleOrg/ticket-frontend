import { jsPDF } from "jspdf";

interface ReceiptPdfData {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  clientName: string;
  items: {
    quantity: number;
    code: string;
    description: string;
    unitPrice: number;
    taxPercent: number;
    discountPercent: number;
  }[];
  subtotal: number;
  discounts: number;
  taxTotal: number;
  totalPaid: number;
}

function formatCurrency(n: number): string {
  return `$ ${new Intl.NumberFormat("es-AR").format(n)}`;
}

async function loadTrimmedImageDataUrl(
  src: string,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Unable to load image: ${src}`);
  }
  const blob = await response.blob();

  const imageUrl = URL.createObjectURL(blob);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to decode image: ${src}`));
    img.src = imageUrl;
  });

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) {
    URL.revokeObjectURL(imageUrl);
    throw new Error("Could not get source canvas context");
  }
  sourceCtx.drawImage(image, 0, 0);

  URL.revokeObjectURL(imageUrl);

  const { data, width, height } = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;

  // Trim white/transparent margins so logos with big white padding render at usable size.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      const isVisiblePixel = a > 10 && (r < 245 || g < 245 || b < 245);
      if (!isVisiblePixel) continue;
      hasContent = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!hasContent) {
    return {
      dataUrl: sourceCanvas.toDataURL("image/png"),
      width: sourceCanvas.width,
      height: sourceCanvas.height,
    };
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = cropWidth;
  targetCanvas.height = cropHeight;
  const targetCtx = targetCanvas.getContext("2d");
  if (!targetCtx) {
    throw new Error("Could not get target canvas context");
  }
  targetCtx.drawImage(sourceCanvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return {
    dataUrl: targetCanvas.toDataURL("image/png"),
    width: cropWidth,
    height: cropHeight,
  };
}

export async function exportReceiptToPdf(
  _elementId: string,
  fileName: string,
  data?: ReceiptPdfData,
): Promise<void> {
  if (!data) throw new Error("Receipt data is required");

  const doc = new jsPDF("p", "mm", "a4");
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const brandColor: [number, number, number] = [0, 142, 61];
  const darkColor: [number, number, number] = [28, 28, 28];
  const grayColor: [number, number, number] = [105, 105, 105];
  const lightGray: [number, number, number] = [223, 223, 223];

  y = 18;
  const headerTop = y;
  let logoBottomY = headerTop + 16;

  // ── Company logo (fallback to text) ──
  try {
    const logo = await loadTrimmedImageDataUrl("/images/logo.jpg");
    const maxLogoWidth = 56;
    const maxLogoHeight = 20;
    const ratio = logo.width / logo.height;
    const widthBasedHeight = maxLogoWidth / ratio;
    const logoWidth = widthBasedHeight <= maxLogoHeight ? maxLogoWidth : maxLogoHeight * ratio;
    const logoHeight = widthBasedHeight <= maxLogoHeight ? widthBasedHeight : maxLogoHeight;
    doc.addImage(logo.dataUrl, "PNG", margin, headerTop - 4, logoWidth, logoHeight, undefined, "FAST");
    logoBottomY = headerTop - 4 + logoHeight;
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...darkColor);
    doc.text(data.companyName, margin, headerTop + 4);
    logoBottomY = headerTop + 6;
  }

  // ── Header right block ──
  doc.setFont("times", "italic");
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text("Comprobante de Pago", pageWidth - margin, headerTop + 2, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(data.receiptNumber, pageWidth - margin, headerTop + 8, { align: "right" });

  // ── Company details ──
  y = logoBottomY + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  if (data.companyAddress) {
    doc.text(data.companyAddress, margin, y);
    y += 4;
  }
  if (data.companyPhone) {
    doc.text(`Tel.: ${data.companyPhone}`, margin, y);
    y += 4;
  }

  y += 6;

  // ── Separator line ──
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ── Info row ──
  const boxWidth = contentWidth / 3;
  const boxes = [
    { label: "FECHA DE PAGO", value: data.paymentDate },
    { label: "MÉTODO DE PAGO", value: data.paymentMethod },
    { label: "CLIENTE", value: data.clientName },
  ];

  boxes.forEach((box, i) => {
    const x = margin + i * boxWidth;

  doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
  doc.setTextColor(...grayColor);
    doc.text(box.label, x, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...darkColor);
    doc.text(box.value || "—", x, y + 7);
  });

  y += 16;

  // ── Separator ──
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ── Items table header ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);

  const colX = {
    qty: margin + 1,
    code: margin + 14,
    desc: margin + 29,
    price: margin + 122,
    iva: margin + 145,
    total: pageWidth - margin - 1,
  };

  doc.text("CANT.", colX.qty, y);
  doc.text("CÓDIGO", colX.code, y);
  doc.text("DESCRIPCIÓN", colX.desc, y);
  doc.text("P. UNIT.", colX.price, y);
  doc.text("IVA", colX.iva, y);
  doc.text("TOTAL", colX.total, y, { align: "right" });

  y += 3;
  doc.setDrawColor(...darkColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Items rows ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  for (const item of data.items) {
    const lineTotal = item.quantity * item.unitPrice;
    const lineDiscount = lineTotal * (item.discountPercent / 100);
    const lineTax = (lineTotal - lineDiscount) * (item.taxPercent / 100);
    const itemTotal = lineTotal - lineDiscount + lineTax;

    doc.setTextColor(...darkColor);
    doc.text(String(item.quantity), colX.qty, y);

    if (item.code) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(item.code, colX.code, y);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...darkColor);

    // Description with word wrap
    const descLines = doc.splitTextToSize(item.description || "—", 86);
    doc.text(descLines, colX.desc, y);

    doc.setTextColor(...grayColor);
    doc.text(formatCurrency(item.unitPrice), colX.price, y);
    doc.text(`${item.taxPercent}%`, colX.iva, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkColor);
    doc.text(formatCurrency(itemTotal), colX.total, y, { align: "right" });

    const lineHeight = Math.max(descLines.length * 4.8, 7);
    y += lineHeight + 4;

    doc.setDrawColor(233, 233, 233);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  }

  y += 8;

  // ── Separator before totals ──
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ── Totals (right-aligned, no colored box) ──
  const totalsX = pageWidth - margin - 60;
  const valuesX = pageWidth - margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(data.subtotal), valuesX, y, { align: "right" });
  y += 6;

  if (data.discounts > 0) {
    doc.setTextColor(...grayColor);
    doc.text("Descuentos", totalsX, y);
    doc.setTextColor(200, 50, 50);
    doc.text(`-${formatCurrency(data.discounts)}`, valuesX, y, { align: "right" });
    y += 6;
  }

  if (data.taxTotal > 0) {
    doc.setTextColor(...grayColor);
    doc.text("IVA", totalsX, y);
    doc.setTextColor(...darkColor);
    doc.text(formatCurrency(data.taxTotal), valuesX, y, { align: "right" });
    y += 6;
  }

  y += 4;

  // Total box
  const boxX = totalsX - 4;
  const boxW = valuesX - totalsX + 8;
  doc.setDrawColor(...brandColor);
  doc.setLineWidth(0.8);
  doc.rect(boxX, y - 1, boxW, 12, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...brandColor);
  doc.text("Total Pagado", totalsX, y + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...brandColor);
  doc.text(formatCurrency(data.totalPaid), valuesX, y + 7, { align: "right" });

  y += 20;

  // ── Footer ──
  const footerY = Math.max(y, pageHeight - 24);
  doc.setDrawColor(...lightGray);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  y = footerY + 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("Generado electronicamente por TicketOps", margin, y);
  doc.text(`Emitido: ${new Date().toLocaleDateString("es-AR")}`, pageWidth - margin, y, { align: "right" });

  // ── Save ──
  doc.save(`${fileName}.pdf`);
}
