import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PACKAGING_RATES } from '../features/inventory/data/pricingRates';

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
            inventoryItems = [],
            isSharedLoad = false,
            shouldSave = true,
            totalVolume = 0,
            st7Boxes = 0,
            linenBoxes = 0
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
            const numVat = Number(vat) || (numTotal - numTotal / 1.15);
            
            const serviceFees = numSubTotal || (numTotal / 1.15);
            const discountAmount = 0; // discount is already baked in to subTotal

            const { breakdown: bd, boxQty } = data;
            const costs = [];

            // Transport Services line
            const displayVolume = totalVolume || bd?.totalVolume || 0;
            if (displayVolume > 0) {
                const transportCost = (bd?.transport || 0) + (bd?.volume || 0);
                costs.push(['Transport Services', `R ${Number(transportCost).toFixed(2)}`]);
            }

            if (bd) {
                if (bd.shuttleCost > 0) costs.push(['Shuttle Vehicle', `R ${Number(bd.shuttleCost).toFixed(2)}`]);
                if (bd.longCarryCost > 0) costs.push(['Long Carry', `R ${Number(bd.longCarryCost).toFixed(2)}`]);
                if (bd.access > 0) costs.push(['Access Fees (Stairs/Elevator/Hoisting)', `R ${Number(bd.access).toFixed(2)}`]);
                if (bd.crew > 0) costs.push(['Additional Crew', `R ${Number(bd.crew).toFixed(2)}`]);
                if (bd.packaging > 0) {
                    const numSt7 = st7Boxes || data.st7Boxes || 0;
                    const numLinen = linenBoxes || data.linenBoxes || 0;
                    const labels = [];
                    if (numSt7 > 0) labels.push(`${numSt7} x R${(data.packagingOption === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.st7 : PACKAGING_RATES.boxesAndPacking.st7).toFixed(0)}`);
                    if (numLinen > 0) labels.push(`${numLinen} x R${(data.packagingOption === 'boxes_only' ? PACKAGING_RATES.sendMeBoxesOnly.linen : PACKAGING_RATES.boxesAndPacking.linen).toFixed(0)}`);
                    const boxText = labels.length > 0 ? `Box Supplies (${labels.join(', ')})` : 'Box Supplies';
                    costs.push([boxText, `R ${Number(bd.packaging).toFixed(2)}`]);
                }
                if (bd.plasticSleeveCost > 0) {
                    const sleevesQty = bd.plasticSleeveCount || Math.round(bd.plasticSleeveCost / 55);
                    costs.push([`Plastic Sleeves (${sleevesQty} qty x R55)`, `R ${Number(bd.plasticSleeveCost).toFixed(2)}`]);
                }
                if (bd.wrappingCost > 0) {
                    const volText = bd.wrappingVolume > 0 ? ` (${Number(bd.wrappingVolume).toFixed(2)} ft³ x R5.90)` : '';
                    costs.push([`Specialized Wrapping${volText}`, `R ${Number(bd.wrappingCost).toFixed(2)}`]);
                }
                if (bd.specialWrapping > 0) costs.push(['Special Item Wrapping / Sleeves', `R ${Number(bd.specialWrapping).toFixed(2)}`]);
                // Move Protection — always shown as a separate service line
                const protection = bd.standardInsurance || 0;
                if (protection > 0) {
                    const protectionLabel = 'Transport Services / Move Protection';
                    costs.push([protectionLabel, `R ${Number(protection).toFixed(2)}`]);
                }
            }

            costs.push(
                ['Service Fees (Excl. VAT)', `R ${serviceFees.toFixed(2)}`],
                ['Subtotal Excl. VAT', `R ${serviceFees.toFixed(2)}`],
                ['VAT (15%)', `R ${numVat.toFixed(2)}`],
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
