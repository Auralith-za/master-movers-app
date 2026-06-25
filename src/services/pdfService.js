import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Service to generate professional PDF quotes for MasterMovers
 */
export const generateProfessionalQuote = (data) => {
    return new Promise((resolve) => {
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
            total = 0,
            vat = 0,
            subTotal = 0,
            inventoryItems = [], // The raw catalog for lookups
            isSharedLoad = false,
            shouldSave = true
        } = data;

        const doc = new jsPDF();
        const slate900 = [15, 23, 42]; // Premium Slate
        const slate500 = [100, 116, 139]; // Muted Slate
        const borderCol = [226, 232, 240]; // Light gray border

        // Load the logo image
        const img = new Image();
        img.src = '/images/logo.png';

        const renderPdfContent = () => {
            // Draw divider line under header
            doc.setDrawColor(...borderCol);
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // --- Client & Move Info ---
            let currentY = 48;

            doc.setTextColor(...slate900);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('CLIENT DETAILS', 20, currentY);
            doc.text('MOVE DETAILS', 110, currentY);

            // Subtle header underline
            doc.line(20, currentY + 2, 80, currentY + 2);
            doc.line(110, currentY + 2, 190, currentY + 2);

            currentY += 8;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85); // Slate 700

            // Client Column
            doc.text(`Name: ${clientName || 'N/A'}`, 20, currentY);
            doc.text(`Phone: ${clientPhone || 'N/A'}`, 20, currentY + 6);
            doc.text(`Email: ${clientEmail || 'N/A'}`, 20, currentY + 12);

            // Move Column
            doc.text(`Date: ${moveDate || 'N/A'}`, 110, currentY);
            doc.text(`From: ${pickupAddress || 'N/A'}`, 110, currentY + 6, { maxWidth: 80 });
            doc.text(`To: ${dropoffAddress || 'N/A'}`, 110, currentY + 18, { maxWidth: 80 });

            currentY += 32;

            // --- Inventory Table ---
            doc.setTextColor(...slate900);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('INVENTORY ITEMS', 20, currentY);
            doc.line(20, currentY + 2, 190, currentY + 2);
            
            currentY += 6;

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
                head: [['Item Description', 'Quantity']],
                body: tableRows,
                theme: 'striped',
                headStyles: { 
                    fillColor: slate900, 
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                styles: { fontSize: 8.5, cellPadding: 3 },
                margin: { left: 20, right: 20 }
            });

            currentY = doc.lastAutoTable.finalY + 12;

            // --- Costs Section & Terms Page Control ---
            // We want both the cost summary table and the Terms & Conditions to stay on the same page.
            // Together they take up about 75-80mm. Standard page height is 297mm.
            // If we are past 180mm, push them both to a clean page.
            if (currentY > 180) {
                doc.addPage();
                currentY = 20;
            }

            doc.setTextColor(...slate900);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('COST SUMMARY', 20, currentY);
            doc.line(20, currentY + 2, 190, currentY + 2);
            
            currentY += 8;

            const numTotal = Number(total) || 0;
            const numSubTotal = Number(subTotal) || 0;
            
            const serviceFees = numSubTotal;
            const finalSubtotal = numTotal ? (numTotal / 1.15) : serviceFees;
            const discountAmount = serviceFees - finalSubtotal;

            const { breakdown, boxQty } = data;
            const costs = [];

            if (breakdown) {
                if (breakdown.shuttleCost > 0) costs.push(['Shuttle Vehicle', `R ${breakdown.shuttleCost.toFixed(2)}`]);
                if (breakdown.longCarryCost > 0) costs.push(['Long Carry', `R ${breakdown.longCarryCost.toFixed(2)}`]);
                if (breakdown.packaging > 0) {
                    const st7 = data.moveDetails?.st7Boxes || data.moveDetails?.st7_boxes || 0;
                    const linen = data.moveDetails?.linenBoxes || data.moveDetails?.linen_boxes || 0;
                    const labels = [];
                    if (st7 > 0) labels.push(`${st7} Std`);
                    if (linen > 0) labels.push(`${linen} Linen`);
                    const boxText = labels.length > 0 ? `Box Supplies (${labels.join(', ')})` : `Box Supplies`;
                    costs.push([boxText, `R ${breakdown.packaging.toFixed(2)}`]);
                }
                if (breakdown.plasticSleeveCost > 0) {
                    const sleevesQty = breakdown.plasticSleeveCount || Math.round(breakdown.plasticSleeveCost / 55);
                    costs.push([`Plastic Sleeves (${sleevesQty} qty x R55)`, `R ${breakdown.plasticSleeveCost.toFixed(2)}`]);
                }
                if (breakdown.wrappingCost > 0) {
                    const volText = breakdown.wrappingVolume > 0 ? ` (${breakdown.wrappingVolume.toFixed(2)} ft³ x R5.90)` : '';
                    costs.push([`Specialized Wrapping${volText}`, `R ${breakdown.wrappingCost.toFixed(2)}`]);
                }
            }

            costs.push(
                ['Service Fees (Excl. VAT)', `R ${serviceFees.toFixed(2)}`],
                ...(discountAmount > 0.01 ? [['Discount Applied', `- R ${discountAmount.toFixed(2)}`]] : []),
                ['Subtotal Excl. VAT', `R ${finalSubtotal.toFixed(2)}`],
                ['VAT (15%)', `R ${(numTotal - finalSubtotal).toFixed(2)}`],
                ['TOTAL AMOUNT DUE', `R ${numTotal.toFixed(2)}`]
            );

            autoTable(doc, {
                startY: currentY,
                body: costs,
                theme: 'plain',
                styles: { fontSize: 9.5, cellPadding: 2.5 },
                columnStyles: {
                    0: { fontStyle: 'normal', halign: 'left' },
                    1: { fontStyle: 'bold', halign: 'right' }
                },
                margin: { left: 110, right: 20 }
            });

            currentY = doc.lastAutoTable.finalY + 8;

            // Payflex Option
            doc.setFillColor(79, 70, 229); // Indigo
            doc.rect(110, currentY, 80, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('PAY IN 4 WITH PAYFLEX AVAILABLE (INTEREST-FREE)', 150, currentY + 5.5, { align: 'center' });

            currentY += 16;

            // --- Terms & Payment ---
            doc.setTextColor(...slate900);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('PAYMENT TERMS & CONDITIONS', 20, currentY);
            doc.line(20, currentY + 2, 190, currentY + 2);

            currentY += 8;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...slate500);

            const terms = [
                '- Full payment is required 48 hours prior to the move date to confirm booking.',
                '- We accept PayFast, Payflex (Pay in 4), and Direct Bank EFT.',
                '- Pricing provided is valid for 7 days from the date of issue and is subject to change thereafter.',
                '- Items not listed in the inventory may incur additional charges on move day.',
                '- Standard liability insurance is included. Platinum cover available on request.'
            ];

            terms.forEach((line, i) => {
                doc.text(line, 20, currentY + (i * 4.5));
            });

            // --- Footer ---
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text('MasterMovers NextGen - Professional Moving & Logistics Solutions', 105, 285, { align: 'center' });
            doc.text('MasterMovers.co.za | +27 11 493 7569 | info@mastermovers.co.za', 105, 289, { align: 'center' });

            if (shouldSave) {
                doc.save(`MasterMovers_Quote_${quoteId || 'New'}.pdf`);
            }
            resolve(doc);
        };

        img.onload = () => {
            // Draw Logo on top left in original aspect ratio
            const ratio = img.width / img.height || 1;
            const targetHeight = 12;
            const targetWidth = targetHeight * ratio;
            doc.addImage(img, 'PNG', 20, 12, targetWidth, targetHeight);

            // Draw header text on top right
            doc.setTextColor(...slate900);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('OFFICIAL QUOTE', 190, 18, { align: 'right' });
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...slate500);
            doc.text(`Ref: ${quoteId ? quoteId.toString().substring(0, 8).toUpperCase() : 'MM-' + Math.floor(Math.random() * 10000)}`, 190, 24, { align: 'right' });

            renderPdfContent();
        };

        img.onerror = () => {
            // Fallback text if logo fails to load
            doc.setTextColor(227, 24, 55); // Crimson fallback
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('MASTER MOVERS', 20, 20);

            doc.setTextColor(...slate900);
            doc.setFontSize(14);
            doc.text('OFFICIAL QUOTE', 190, 20, { align: 'right' });
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...slate500);
            doc.text(`Ref: ${quoteId ? quoteId.toString().substring(0, 8).toUpperCase() : 'MM-' + Math.floor(Math.random() * 10000)}`, 190, 26, { align: 'right' });

            renderPdfContent();
        };
    });
};
