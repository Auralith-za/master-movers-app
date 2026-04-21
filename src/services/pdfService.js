import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Service to generate professional PDF quotes for MasterMovers
 */
export const generateProfessionalQuote = (data) => {
    const {
        quoteId,
        clientName,
        clientEmail,
        clientPhone,
        pickupAddress,
        dropoffAddress,
        moveDate,
        inventory = {},
        breakdown = {},
        total,
        vat,
        subTotal,
        inventoryItems = [], // The raw catalog for lookups
        isSharedLoad = false
    } = data;

    const doc = new jsPDF();
    const primaryColor = [227, 24, 55]; // MasterMovers Crimson
    const secondaryColor = [51, 65, 85]; // Slate 700

    // --- Header Section ---
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MASTER MOVERS', 20, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('NEXTGEN RELOCATION SERVICES', 20, 28);

    doc.setFontSize(14);
    doc.text('OFFICIAL QUOTE', 150, 22);
    doc.setFontSize(10);
    doc.text(`Ref: ${quoteId ? quoteId.toString().substring(0, 8).toUpperCase() : 'MM-' + Math.floor(Math.random() * 10000)}`, 150, 30);

    // --- Client & Move Info ---
    let currentY = 55;

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT DETAILS', 20, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('MOVE INFORMATION', 110, currentY);

    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Client Column
    doc.text(`Name: ${clientName || 'N/A'}`, 20, currentY);
    doc.text(`Phone: ${clientPhone || 'N/A'}`, 20, currentY + 6);
    doc.text(`Email: ${clientEmail || 'N/A'}`, 20, currentY + 12);

    // Move Column
    doc.text(`Move Date: ${moveDate || 'N/A'}`, 110, currentY);
    doc.text(`From: ${pickupAddress || 'N/A'}`, 110, currentY + 6, { maxWidth: 80 });
    doc.text(`To: ${dropoffAddress || 'N/A'}`, 110, currentY + 18, { maxWidth: 80 });

    currentY += 35;

    // --- Inventory Table ---
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVENTORY SUMMARY', 20, currentY);
    currentY += 5;

    const tableRows = Object.entries(inventory).map(([idKey, qty]) => {
        const [id, variation] = idKey.split('_');
        const item = inventoryItems.find(i => i.id === id);
        if (!item) return null;

        const varLabel = variation ? ` (${variation})` : '';

        return [
            `${item.name}${varLabel}`,
            qty
        ];
    }).filter(Boolean);

    autoTable(doc, {
        startY: currentY,
        head: [['Item Name', 'Quantity']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // --- Costs Section ---
    if (currentY > 230) {
        doc.addPage();
        currentY = 20;
    }

    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COST BREAKDOWN', 20, currentY);
    currentY += 8;

    const costs = [
        ['Subtotal Excl. VAT', `R ${subTotal?.toFixed(2) || '0.00'}`],
        ['VAT (15%)', `R ${vat?.toFixed(2) || '0.00'}`],
        ['TOTAL AMOUNT DUE', `R ${total?.toFixed(2) || '0.00'}`]
    ];

    autoTable(doc, {
        startY: currentY,
        body: costs,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: 'normal', halign: 'left' },
            1: { fontStyle: 'bold', halign: 'right' }
        },
        margin: { left: 120, right: 20 }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // payflex badge mention
    doc.setFillColor(...primaryColor);
    doc.rect(120, currentY, 70, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('PAY IN 4 WITH PAYFLEX AVAILABLE', 155, currentY + 6, { align: 'center' });

    currentY += 20;

    // --- Terms & Payment ---
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT & TERMS', 20, currentY);

    currentY += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    const terms = [
        '- Full payment is required 48 hours prior to the move date to confirm booking.',
        '- We accept PayFast, Payflex (Pay in 4), and Direct EFT.',
        '- Items not listed in the inventory may incur additional charges on move day.',
        '- Standard liability insurance is included. Platinum cover available on request.'
    ];

    terms.forEach((line, i) => {
        doc.text(line, 20, currentY + (i * 5));
    });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('MasterMovers NextGen - Professional Moving & Logistics', 105, 285, { align: 'center' });
    doc.text('MasterMovers.co.za | +27 11 000 0000 | info@mastermovers.co.za', 105, 290, { align: 'center' });

    doc.save(`MasterMovers_Quote_${quoteId || 'New'}.pdf`);
};
