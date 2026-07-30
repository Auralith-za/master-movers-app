import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PACKAGING_RATES, PRICING_CONSTANTS } from '../features/inventory/data/pricingRates';
import { getSimpleQuoteNumber } from '../utils/quoteHelpers';

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

            currentY += 30;

            // --- Site Access & Logistics Section ---
            doc.setTextColor(...slate900);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('SITE ACCESS & LOGISTICS DETAILS', 20, currentY);
            doc.line(20, currentY + 2, 190, currentY + 2);

            currentY += 8;
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);

            const getAccessSummaryString = (acc) => {
                if (!acc) return 'House (Ground Floor)';
                const parts = [];
                const type = (acc.type || 'house').toUpperCase();
                parts.push(type);
                if (acc.floorLevel > 0) parts.push(`Floor ${acc.floorLevel}`);
                parts.push(`Elevator: ${acc.elevator ? 'Yes' : 'No'}`);
                parts.push(`Stairs: ${acc.stairs ? 'Yes' : 'No'}`);
                if (acc.longCarryMeters > 0) parts.push(`Long Carry: ${acc.longCarryMeters}m`);
                if (acc.specialConditions) {
                    if (acc.specialConditions.hoisting) parts.push('Hoisting Required');
                    if (acc.specialConditions.shuttle) parts.push('Shuttle Required');
                    if (acc.specialConditions.panhandle) parts.push('Panhandle');
                }
                if (acc.notes) parts.push(`Notes: "${acc.notes}"`);
                return parts.join(' • ');
            };

            const accDetails = data.accessDetails || data.moveDetails?.accessDetails || {};
            const pickupAccessStr = getAccessSummaryString(accDetails.origin);
            const dropoffAccessStr = getAccessSummaryString(accDetails.destination);

            doc.setFont('helvetica', 'bold');
            doc.text('Pickup Access:', 20, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(pickupAccessStr, 48, currentY, { maxWidth: 142 });
            const pickupHeight = doc.getTextDimensions(pickupAccessStr, { maxWidth: 142 }).h || 5;
            currentY += Math.max(6, pickupHeight + 2);

            doc.setFont('helvetica', 'bold');
            doc.text('Dropoff Access:', 20, currentY);
            doc.setFont('helvetica', 'normal');
            doc.text(dropoffAccessStr, 48, currentY, { maxWidth: 142 });
            const dropoffHeight = doc.getTextDimensions(dropoffAccessStr, { maxWidth: 142 }).h || 5;
            currentY += Math.max(6, dropoffHeight + 2);

            const extraColls = data.extraCollections || data.moveDetails?.extraCollections || [];
            extraColls.forEach((coll, idx) => {
                if (!coll.address) return;
                const extraAccStr = getAccessSummaryString(accDetails[`extra_coll_${idx}`]);
                doc.setFont('helvetica', 'bold');
                doc.text(`Collection #${idx + 2}:`, 20, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(`${coll.address} (${extraAccStr})`, 48, currentY, { maxWidth: 142 });
                currentY += 6;
            });

            const extraDrops = data.extraDrops || data.moveDetails?.extraDrops || [];
            extraDrops.forEach((drop, idx) => {
                if (!drop.address) return;
                const extraAccStr = getAccessSummaryString(accDetails[`extra_drop_${idx}`]);
                doc.setFont('helvetica', 'bold');
                doc.text(`Drop-off #${idx + 2}:`, 20, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(`${drop.address} (${extraAccStr})`, 48, currentY, { maxWidth: 142 });
                currentY += 6;
            });

            const notes = data.generalNotes || data.notes || data.customer_comments || data.moveDetails?.generalNotes || data.moveDetails?.notes || data.quote?.general_notes || data.quote?.notes || data.quote?.customer_comments || '';
            if (notes) {
                doc.setFont('helvetica', 'bold');
                doc.text('Special Notes / Instructions:', 20, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(`"${notes}"`, 68, currentY, { maxWidth: 122 });
                const notesHeight = doc.getTextDimensions(`"${notes}"`, { maxWidth: 122 }).h || 5;
                currentY += Math.max(6, notesHeight + 2);
            }

            currentY += 8;

            // --- Inventory Table ---
            doc.setTextColor(...slate900);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('INVENTORY ITEMS', 20, currentY);
            doc.line(20, currentY + 2, 190, currentY + 2);
            
            currentY += 6;

            const parseKey = (idKey) => {
                let key = idKey
                let room = null
                if (key.includes('__room:')) {
                    const parts = key.split('__room:')
                    key = parts[0]
                    room = parts[1]
                }
                let variation = null
                if (key.includes('_')) {
                    const parts = key.split('_')
                    key = parts[0]
                    variation = parts.slice(1).join('_')
                }
                return { itemId: key, variation, room }
            }

            const groupedPdfItems = {}
            Object.entries(inventory).forEach(([idKey, qty]) => {
                if (!qty || qty <= 0) return
                const { itemId, variation, room } = parseKey(idKey)
                const item = inventoryItems.find(i => i.id === itemId)
                if (!item) return
                const categoryName = (room || item.category || 'General Furniture').toUpperCase()
                if (!groupedPdfItems[categoryName]) groupedPdfItems[categoryName] = []
                const varLabel = variation ? ` (${variation})` : ''
                groupedPdfItems[categoryName].push([`${item.name}${varLabel}`, qty])
            })

            const tableRows = []
            Object.entries(groupedPdfItems).forEach(([category, items]) => {
                tableRows.push([
                    { 
                        content: `— ${category} —`, 
                        colSpan: 2, 
                        styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [30, 41, 59], fontSize: 8.5 } 
                    }
                ])
                items.forEach(row => tableRows.push(row))
            })

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
            // Cost Summary + Payflex Banner + Terms take up ~100mm. Standard page height is 297mm.
            // If currentY is past 140mm, push Cost Summary to a clean page to prevent overlapping the footer.
            if (currentY > 140) {
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

            const { breakdown: bd } = data;
            const costs = [];

            // Transport Services line
            const displayVolume = totalVolume || bd?.totalVolume || 0;
            if (displayVolume > 0 || serviceFees > 0) {
                let transportCost = (bd?.transport || 0) + (bd?.volume || 0) + (bd?.standardInsurance || 0) + (bd?.moveProtectionCost || 0);
                const isMinQuote = data.isMinQuote || bd?.isMinQuote || (serviceFees >= PRICING_CONSTANTS.minOrder && transportCost < PRICING_CONSTANTS.minOrder);
                if (isMinQuote && !data.isNationalMove && !isSharedLoad) {
                    // For local minimum quotes, transport line reflects the minimum base rate
                    transportCost = Math.max(PRICING_CONSTANTS.minOrder, transportCost);
                }
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
                    costs.push(['Plastic Sleeves', `R ${Number(bd.plasticSleeveCost).toFixed(2)}`]);
                }
                if (bd.wrappingCost > 0) {
                    costs.push(['Specialized Furniture Wrapping', `R ${Number(bd.wrappingCost).toFixed(2)}`]);
                }
                if (bd.specialWrapping > 0) costs.push(['Special Item Wrapping / Sleeves', `R ${Number(bd.specialWrapping).toFixed(2)}`]);
                
                if (bd.extraDistance > 0 || bd.extraDistanceFees > 0) {
                    const dFee = bd.extraDistance || bd.extraDistanceFees;
                    costs.push(['Depot Distance Surcharge', `R ${Number(dFee).toFixed(2)}`]);
                }
                
                const docFee = bd.documentationFee || 0;
                if (docFee > 0) {
                    costs.push(['Documentation Fee', `R ${Number(docFee).toFixed(2)}`]);
                }

                const storageFeeCalc = Number(bd.storageCost || data.storage_cost || data.storageCost || 0) ||
                                       ((data.dropoffAddress?.toLowerCase().includes('storage') || data.storage_destination || bd.storageDestination) ? Math.max(PRICING_CONSTANTS.minStorageFee || 450, Math.round(displayVolume * 1.50 * 100)/100) : 0);
                if (storageFeeCalc > 0) {
                    costs.push([`Master Movers Storage (Monthly Fee)`, `R ${Number(storageFeeCalc).toFixed(2)}`]);
                }
            }

            // Itemize custom products explicitly if provided
            const customProductsList = data.customProducts || data.custom_products || data.quote?.custom_products || [];
            if (Array.isArray(customProductsList) && customProductsList.length > 0) {
                customProductsList.forEach(prod => {
                    if (prod.name && prod.price !== undefined) {
                        const pVal = Number(prod.price) || 0;
                        if (pVal >= 0) {
                            costs.push([prod.name, `R ${pVal.toFixed(2)}`]);
                        } else {
                            costs.push([prod.name, `-R ${Math.abs(pVal).toFixed(2)}`]);
                        }
                    }
                });
            }

            // Auto-reconcile component lines with exact subtotal
            const hasActualDiscount = (data.discount > 0) || (bd?.discount > 0) || Boolean(data.appliedCoupon) || (Number(data.discount_amount) > 0);
            const sumOfCosts = costs.reduce((acc, row) => {
                const valStr = String(row[1]).replace(/[^\d.-]/g, '');
                return acc + (parseFloat(valStr) || 0);
            }, 0);

            const diff = serviceFees - sumOfCosts;
            if (diff < -0.01 && hasActualDiscount) {
                costs.push(['Discount Applied', `-R ${Math.abs(diff).toFixed(2)}`]);
            } else if (Math.abs(diff) > 0.01 && !hasActualDiscount) {
                // If there's a breakdown discrepancy without an actual discount, adjust the Transport Services line so items equal subtotal
                const transportIdx = costs.findIndex(c => c[0] === 'Transport Services');
                if (transportIdx !== -1) {
                    const currentTrans = parseFloat(String(costs[transportIdx][1]).replace(/[^\d.-]/g, '')) || 0;
                    const adjustedTrans = Math.max(0, currentTrans + diff);
                    costs[transportIdx][1] = `R ${adjustedTrans.toFixed(2)}`;
                }
            }

            costs.push(
                ['Subtotal Excl. VAT', `R ${serviceFees.toFixed(2)}`],
                ['VAT (15%)', `R ${numVat.toFixed(2)}`],
                ['TOTAL AMOUNT DUE', `R ${numTotal.toFixed(2)}`]
            );

            autoTable(doc, {
                startY: currentY,
                head: [['Service / Item Description', 'Amount (EX-VAT)']],
                body: costs,
                theme: 'striped',
                headStyles: { fillColor: slate900, textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 8.5, cellPadding: 2.5 },
                columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 40, halign: 'right' } },
                didParseCell: (data) => {
                    if (data.row.index === costs.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [248, 250, 252];
                    }
                }
            });

            currentY = doc.lastAutoTable.finalY + 8;

            // Payflex Banner
            doc.setFillColor(238, 242, 255); // Indigo 50
            doc.roundedRect(20, currentY, 170, 8, 2, 2, 'F');
            doc.setTextColor(79, 70, 229); // Indigo 600
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.text('PAY IN 4 WITH PAYFLEX AVAILABLE (INTEREST-FREE)', 105, currentY + 5.5, { align: 'center' });

            currentY += 16;

            // Check if Terms & Conditions will overflow page 2
            if (currentY > 215) {
                doc.addPage();
                currentY = 20;
            }

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

            const hasStorageInQuote = (bd?.storageCost > 0) || !!data?.storageDestination || data?.dropoffAddress?.toLowerCase().includes('storage');

            const terms = [
                '- Full payment is required 48 hours prior to the move date to confirm booking.',
                '- We accept PayFast, Payflex (Pay in 4), and Direct Bank EFT.',
                '- Pricing provided is valid for 7 days from the date of issue and is subject to change thereafter.',
                '- Items not listed in the inventory may incur additional charges on move day.',
                '- Standard liability insurance is included. Platinum cover available on request.',
                ...(hasStorageInQuote ? ['- STORAGE NOTE: Delivery out of storage is not included in this quote.'] : [])
            ];

            terms.forEach((line, i) => {
                doc.text(line, 20, currentY + (i * 4.5));
            });

            // --- Add Footer & Page Numbers across all pages ---
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(148, 163, 184); // Slate 400
                doc.text('MasterMovers NextGen - Professional Moving & Logistics Solutions', 105, 283, { align: 'center' });
                doc.text(`MasterMovers.co.za | +27 11 493 7569 | sales1@mastermoversjhb.co.za  ·  Page ${i} of ${totalPages}`, 105, 287, { align: 'center' });
            }

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
            doc.text(`Ref: ${getSimpleQuoteNumber(quoteId)}`, 190, 24, { align: 'right' });

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
            doc.text(`Ref: ${getSimpleQuoteNumber(quoteId)}`, 190, 26, { align: 'right' });

            renderPdfContent();
        };
    });
};
