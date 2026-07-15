import { fmt } from '../utils/helpers';

// Deterministic transport-arrangement choice a vendor makes at quotation time.
// Used identically when seeding a quotation and the PO generated from it, so they always agree
// (mirrors: vendor picks Vendor/Warehouse on the quotation -> warehouse accepts -> PO inherits it).
export function transportPlan(i) {
  const transporters = ['GATI Logistics', 'Blue Dart Express', 'DHL Supply Chain', 'Delhivery', 'TCI Freight', 'Safexpress'];
  const drivers = ['Ramesh Yadav', 'Suresh Patil', 'Manoj Kumar', 'Vijay Singh', 'Anil Sharma', 'Prakash Rao'];
  const arrangement = i % 2 === 0 ? 'vendor' : 'warehouse';
  return {
    transportArrangement: arrangement,
    freightDetails: arrangement === 'vendor' ? {
      transporterName: transporters[i % transporters.length],
      driverName: drivers[i % drivers.length],
      driverContact: `+91 ${97000 + i * 53} ${20000 + i * 149}`,
      estimatedFreightAmount: 2000 + i * 350,
      vehicleType: ['Mini Truck', '10 Ft Truck', 'Container Truck'][i % 3],
      remarks: 'Freight arranged and billed by vendor; settled via the Payments > Freight ledger.',
    } : null,
  };
}

/* ============================================================
   DUMMY DATA SEED
   ============================================================ */
export const SEED = {

  vendors: [
    {
      id: 'V001', email: 'admin@vendor.com', password: '123456', approved: true,
      company: {
        name: 'Apex Fabrics & Textiles Pvt Ltd', legalName: 'Apex Fabrics & Textiles Private Limited',
        businessType: 'Manufacturer', gst: '27AABCA1234A1Z5', pan: 'AABCA1234A',
        cin: 'U17299MH2015PTC265474', yearEstd: '2015', website: 'www.apexfabrics.com',
        annualTurnover: '₹ 25 Crores', employees: '320', description: 'Leading manufacturer and exporter of woven & knitted fabrics, trims, and garment packaging solutions for the apparel industry.',
        categories: ['Manufacturer', 'Wholesaler'],
      },
      contact: { person: 'Rajesh Kumar', designation: 'Managing Director', email: 'admin@vendor.com', mobile: '+91 98765 43210', office: '+91 22 4567 8900' },
      address: { country: 'India', state: 'Maharashtra', city: 'Mumbai', address: 'Plot No. 45, Textile Industrial Zone, Dharavi, Mumbai', postal: '400017' },
      bank: { name: 'HDFC Bank', holder: 'Apex Fabrics & Textiles Pvt Ltd', account: '50200012345678', ifsc: 'HDFC0001234', branch: 'Dharavi, Mumbai' },
      compliance: { gstCert: true, pan: true, businessLicense: true, msme: true, iso: true, cheque: true },
      registeredOn: '2024-01-10', status: 'Active', rating: 4.5,
    },
  ],

  rfqs: (() => {
    const titles = [
      "Men's Round Neck T-Shirt - S/M/L/XL - 100% Cotton 180 GSM",
      "Women's Slim Fit Denim Jeans - Waist 28 to 36",
      "Boys School Uniform Shirt - Sizes 24 to 34 - White Oxford",
      "Ladies Formal Straight Trousers - XS to XXL - Poly-Viscose",
      "Men's Polo T-Shirt - S/M/L/XL/XXL - Pique Knit",
      "Kids Hooded Sweatshirt - Age 4 to 14 Yrs - Fleece 320 GSM",
      "Men's 6-Pocket Cargo Pants - Waist 30 to 40",
      "Ladies Printed Cotton Kurti - Sizes XS to XXL",
      "Men's Woven Check Boxer Shorts - S/M/L/XL",
      "School Dry-Fit Sports T-Shirt - Sizes 24 to 34",
      "Women's Salwar Suit Set - S to XL - Cotton Slub",
      "Men's Full Sleeve Formal Shirt - 38 to 44 Chest - Giza Cotton",
      "Unisex Terry Fleece Track Pants - S/M/L/XL/XXL",
      "Men's Denim Jacket - Chest 36 to 46 - 12 Oz Denim",
      "Ladies Georgette Blouse - Sizes 32 to 42",
      "Infant Organic Cotton Romper Set - 0 to 12 Months",
      "Men's Sports Shorts - S/M/L/XL - Mesh Lining",
      "Women's 4-Way Stretch Leggings - S/M/L/XL",
      "Men's Casual Cotton Chino - Waist 30 to 36",
      "Hi-Vis Safety Reflective Jacket - S to XXL",
    ];
    const cats = [
      "Men's Wear", "Denim", "School Uniforms", "Women's Wear", "Sportswear",
      "Kids & Infants", "Men's Wear", "Ethnic Wear", "Innerwear", "School Uniforms",
      "Ethnic Wear", "Men's Wear", "Sportswear", "Denim", "Women's Wear",
      "Kids & Infants", "Sportswear", "Women's Wear", "Men's Wear", "Workwear",
    ];
    const quantities = [5000, 2000, 3000, 1500, 4000, 2500, 1200, 3500, 10000, 5000, 800, 2000, 3000, 600, 1500, 4000, 6000, 5000, 2000, 800];
    const units = ['Pcs', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Sets', 'Pcs', 'Pcs', 'Pcs', 'Pcs', 'Sets', 'Pcs', 'Pcs', 'Pcs', 'Pcs'];
    const statuses = ['Open', 'Open', 'Open', 'Open', 'Closing Soon', 'Closing Soon', 'Closed', 'Awarded', 'Cancelled'];
    const locations = ['CW – Mumbai', 'CW – Delhi', 'CW – Bangalore', 'CW – Chennai', 'CW – Tiruppur'];
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const issue = new Date(2026, 0, i + 1);
      const closing = new Date(2026, 0, i + 15);
      const delivery = new Date(2026, 1, i + 5);
      arr.push({
        id: `RFQ-2026-${String(i + 1).padStart(3, '0')}`,
        title: titles[i],
        category: cats[i],
        issueDate: fmt(issue),
        closingDate: fmt(closing),
        requiredDeliveryDate: fmt(delivery),
        quantity: quantities[i],
        unit: units[i],
        deliveryLocation: locations[i % locations.length],
        specifications: `${titles[i]}. Size ratio: S:20% M:30% L:30% XL:15% XXL:5%. Must comply with Oeko-Tex Standard 100. All garments to be pre-washed and colour-fast to Grade 4+ on grey scale. Stitching, seam strength and GSM as per buyer spec sheet. NABL-accredited lab test report mandatory before dispatch.`,
        terms: 'Payment within 30 days of invoice. Delivery as per schedule. Vendor to bear all freight costs. Items must pass QC inspection at warehouse. No short-shipment accepted. Each carton must carry size-wise packing list.',
        estimatedBudget: (i + 1) * 95000,
        status: statuses[i % statuses.length],
        quotationSubmitted: i < 8,
        attachments: i % 3 === 0,
      });
    }
    return arr;
  })(),

  quotations: (() => {
    const statuses = ['Submitted', 'Under Evaluation', 'Approved', 'Rejected'];
    const titles = ["Men's Round Neck T-Shirt - S/M/L/XL - 100% Cotton 180 GSM", "Women's Slim Fit Denim Jeans - Waist 28 to 36", "Boys School Uniform Shirt - Sizes 24 to 34 - White Oxford", "Ladies Formal Straight Trousers - XS to XXL - Poly-Viscose", "Men's Polo T-Shirt - S/M/L/XL/XXL - Pique Knit", "Kids Hooded Sweatshirt - Age 4 to 14 Yrs - Fleece 320 GSM", "Men's 6-Pocket Cargo Pants - Waist 30 to 40", "Ladies Printed Cotton Kurti - Sizes XS to XXL", "Men's Woven Check Boxer Shorts - S/M/L/XL", "School Dry-Fit Sports T-Shirt - Sizes 24 to 34", "Women's Salwar Suit Set - S to XL - Cotton Slub", "Men's Full Sleeve Formal Shirt - 38 to 44 Chest - Giza Cotton", "Unisex Terry Fleece Track Pants - S/M/L/XL/XXL", "Men's Denim Jacket - Chest 36 to 46 - 12 Oz Denim", "Ladies Georgette Blouse - Sizes 32 to 42", "Infant Organic Cotton Romper Set - 0 to 12 Months", "Men's Sports Shorts - S/M/L/XL - Mesh Lining", "Women's 4-Way Stretch Leggings - S/M/L/XL", "Men's Casual Cotton Chino - Waist 30 to 36", "Hi-Vis Safety Reflective Jacket - S to XXL"];
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const base = (i + 1) * 78500 + 12000;
      arr.push({
        id: `QT-2026-${String(i + 1).padStart(3, '0')}`,
        rfqId: `RFQ-2026-${String(i + 1).padStart(3, '0')}`,
        rfqTitle: titles[i],
        submittedDate: fmt(new Date(2026, 0, i + 5)),
        rfqClosingDate: fmt(new Date(2026, 0, i + 15)),
        amount: base,
        gst: Math.round(base * 0.18),
        totalAmount: Math.round(base * 1.18),
        deliveryDays: [15, 21, 30, 7, 45, 10, 14, 20][i % 8],
        warranty: ['1 Year', '2 Years', '6 Months', 'No Warranty', '18 Months'][i % 5],
        paymentTerms: ['Net 30', 'Net 45', '50% Advance + 50% on Delivery', 'LC 60 Days'][i % 4],
        remarks: 'We confirm our best competitive pricing. Products conform to all specified standards.',
        // Freight/transporter details are captured later, at invoice time on the resulting PO —
        // only the arrangement choice is fixed here.
        transportArrangement: transportPlan(i).transportArrangement,
        status: statuses[i % statuses.length],
        hasPdf: i % 2 === 0,
      });
    }
    return arr;
  })(),

  purchaseOrders: (() => {
    const statuses = ['Pending', 'Accepted', 'Accepted', 'Rejected', 'Pending', 'Accepted'];
    const buyers = ['CW – Mumbai', 'CW – Delhi', 'CW – Bangalore', 'CW – Chennai'];
    const items = [
      [{ desc: 'Cotton Woven Fabric 60s x 60s – White', qty: 5000, unit: 'Mtrs', rate: 185, amount: 925000 }],
      [{ desc: 'Polyester Yarn 150D/48F – Cone', qty: 2000, unit: 'Kgs', rate: 220, amount: 440000 }],
      [{ desc: 'Reactive Black Dye – Remazol Grade', qty: 300, unit: 'Kgs', rate: 480, amount: 144000 }, { desc: 'Reactive Navy Blue Dye', qty: 200, unit: 'Kgs', rate: 510, amount: 102000 }],
      [{ desc: 'YKK Zipper #5 – Black 30cm', qty: 10000, unit: 'Pcs', rate: 18, amount: 180000 }],
      [{ desc: 'Export Cartons – 4 Ply 60x40x40cm', qty: 5000, unit: 'Pcs', rate: 72, amount: 360000 }, { desc: 'LDPE Poly Bag 12x16 inch', qty: 25000, unit: 'Pcs', rate: 6, amount: 150000 }],
      [{ desc: 'Woven Taffeta Brand Label – 2x1 inch', qty: 50000, unit: 'Pcs', rate: 3.5, amount: 175000 }],
      [{ desc: 'Interlock Knitted Fabric 180 GSM – Off White', qty: 3000, unit: 'Mtrs', rate: 210, amount: 630000 }],
      [{ desc: 'Elastic Webbing 25mm – White', qty: 10000, unit: 'Mtrs', rate: 8, amount: 80000 }, { desc: 'Elastic Webbing 38mm – Black', qty: 8000, unit: 'Mtrs', rate: 12, amount: 96000 }],
      [{ desc: 'Embroidery Thread 40/2 – Multi Colour Set 500 shades', qty: 500, unit: 'Cones', rate: 185, amount: 92500 }],
      [{ desc: 'Stretch Denim 300 GSM – Indigo Blue', qty: 4000, unit: 'Mtrs', rate: 380, amount: 1520000 }],
    ];
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const itemSet = items[i % items.length];
      const sub = itemSet.reduce((s, x) => s + x.amount, 0);
      const gst = Math.round(sub * 0.18);
      const disc = Math.round(sub * 0.02);
      arr.push({
        id: `PO-2026-${String(i + 1).padStart(3, '0')}`,
        date: fmt(new Date(2026, 0, i + 8)),
        deliveryDate: fmt(new Date(2026, 1, i + 10)),
        buyer: buyers[i % buyers.length],
        buyerContact: 'procurement@centralwarehouse.com',
        quotationId: `QT-2026-${String(i + 1).padStart(3, '0')}`,
        rfqId: `RFQ-2026-${String(i + 1).padStart(3, '0')}`,
        items: itemSet,
        subtotal: sub, gst: gst, discount: disc,
        grandTotal: sub + gst - disc,
        paymentTerms: ['Net 30', 'Net 45', 'LC 60 Days'][i % 3],
        // Inherited from the quotation the vendor submitted (same i => same QT-2026-{i+1}) —
        // decides who arranges & bears outbound freight cost.
        ...transportPlan(i),
        status: statuses[i % statuses.length],
        deliveryAddress: ['Plot 12, Textile Industrial Zone, Andheri, Mumbai 400093', 'Sector 18, Udyog Vihar, Gurgaon, Haryana 122001', 'Peenya Industrial Area, Bangalore 560058', 'Ambattur Industrial Estate, Chennai 600053'][i % 4],
        notes: 'Ensure all items are packaged securely. Attach packing list and test certificates with each shipment.',
      });
    }
    return arr;
  })(),

  deliveries: (() => {
    const statuses = ['Packed', 'Dispatched', 'In Transit', 'Delivered', 'Delivered', 'Delayed'];
    const transporters = ['GATI Logistics', 'Blue Dart Express', 'DHL Supply Chain', 'Delhivery', 'TCI Freight', 'Safexpress'];
    const drivers = ['Ramesh Yadav', 'Suresh Patil', 'Manoj Kumar', 'Vijay Singh', 'Anil Sharma', 'Prakash Rao', 'Deepak Joshi', 'Santosh Gaikwad'];
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const dispatch = new Date(2026, 0, i + 12);
      const expected = new Date(2026, 0, i + 17);
      arr.push({
        id: `SHP-2026-${String(i + 1).padStart(3, '0')}`,
        poId: `PO-2026-${String(i + 1).padStart(3, '0')}`,
        dispatchDate: fmt(dispatch),
        expectedDelivery: fmt(expected),
        transporter: transporters[i % transporters.length],
        driverName: drivers[i % drivers.length],
        driverContact: `+91 ${98000 + i * 43} ${10000 + i * 137}`,
        vehicleNo: `MH${String(i + 12).padStart(2, '0')}AB${1000 + i}`,
        trackingNo: `TRK${20260000 + i + 1}`,
        status: statuses[i % statuses.length],
        from: 'Apex Fabrics & Textiles Pvt Ltd, Mumbai',
        to: ['CW Mumbai', 'CW Delhi', 'CW Bangalore', 'CW Chennai', 'CW Hyderabad'][i % 5],
        weight: `${(i + 1) * 120} kg`,
        packages: (i % 5) + 1,
        notes: 'Keep fabric rolls dry and away from moisture. Attach packing list and NABL test reports with each shipment. Shade variation must not exceed Grade 4 on grey scale.',
      });
    }
    return arr;
  })(),

  returns: (() => {
    const reasons = [
      'Fabric shade variation beyond approved tolerance',
      'Incorrect size ratio supplied against buyer spec',
      'Stitching defect found during QC inspection',
      'Packaging damaged during transit',
      'Excess quantity supplied against PO',
      'GSM/weight mismatch from approved sample',
      'Wrong colour shipped',
      'Missing accessories/trims in consignment',
      'Buyer cancelled order after dispatch',
      'Wrong item picked by warehouse during audit',
    ];
    const itemDescs = [
      'Cotton Woven Fabric 60s x 60s – White',
      'Polyester Yarn 150D/48F – Cone',
      'Reactive Black Dye – Remazol Grade',
      'YKK Zipper #5 – Black 30cm',
      'Export Cartons – 4 Ply 60x40x40cm',
      'Woven Taffeta Brand Label – 2x1 inch',
      'Interlock Knitted Fabric 180 GSM – Off White',
      'Elastic Webbing 25mm – White',
      "Men's Round Neck T-Shirt - Cotton 180 GSM",
      'Ladies Formal Straight Trousers - Poly-Viscose',
    ];
    const units = ['Mtrs', 'Kgs', 'Kgs', 'Pcs', 'Pcs', 'Pcs', 'Mtrs', 'Mtrs', 'Pcs', 'Pcs'];
    const statuses = ['Initiated', 'Approved', 'In Transit', 'Received', 'Refunded', 'Rejected'];
    const locations = ['CW – Mumbai', 'CW – Delhi', 'CW – Bangalore', 'CW – Chennai'];
    const transporters = ['GATI Logistics', 'Blue Dart Express', 'DHL Supply Chain', 'Delhivery', 'TCI Freight', 'Safexpress'];
    const drivers = ['Ramesh Yadav', 'Suresh Patil', 'Manoj Kumar', 'Vijay Singh', 'Anil Sharma', 'Prakash Rao'];
    const arr = [];
    for (let i = 0; i < 18; i++) {
      const qty = (i % 8 + 1) * 45;
      const rate = 150 + (i % 8) * 20;
      const status = statuses[i % statuses.length];
      // A shipment only exists once the return has moved past Approved — Initiated/Approved/Rejected
      // returns never got that far. Transport is always arranged by the vendor.
      const hasShipment = ['In Transit', 'Received', 'Refunded'].includes(status);
      arr.push({
        id: `RET-2026-${String(i + 1).padStart(3, '0')}`,
        poId: `PO-2026-${String(i + 1).padStart(3, '0')}`,
        invoiceId: `INV-2026-${String(i + 1).padStart(3, '0')}`,
        itemDesc: itemDescs[i % itemDescs.length],
        quantity: qty,
        unit: units[i % units.length],
        reason: reasons[i % reasons.length],
        returnDate: fmt(new Date(2026, 1, i + 5)),
        warehouseLocation: locations[i % locations.length],
        refundAmount: qty * rate,
        status,
        remarks: 'Please arrange replacement or credit note at the earliest as per the return policy.',
        ...(hasShipment ? {
          pickupDate: fmt(new Date(2026, 1, i + 8)),
          transporter: transporters[i % transporters.length],
          driverName: drivers[i % drivers.length],
          driverContact: `+91 ${96000 + i * 61} ${30000 + i * 173}`,
          vehicleNo: `MH${String(i + 20).padStart(2, '0')}CW${2000 + i}`,
          trackingNo: `TRK${20260500 + i}`,
        } : {}),
      });
    }
    return arr;
  })(),

  invoices: (() => {
    const statuses = ['Approved', 'Payment Pending', 'Rejected'];
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const base = (i + 1) * 68000 + 15000;
      const gst = Math.round(base * 0.18);
      arr.push({
        id: `INV-2026-${String(i + 1).padStart(3, '0')}`,
        poId: `PO-2026-${String(i + 1).padStart(3, '0')}`,
        invoiceDate: fmt(new Date(2026, 0, i + 18)),
        dueDate: fmt(new Date(2026, 1, i + 17)),
        amount: base, gst: gst, totalAmount: base + gst,
        status: statuses[i % statuses.length],
        hasFile: true,
      });
    }
    return arr;
  })(),

  payments: (() => {
    const statuses = ['Paid', 'Pending', 'Overdue', 'Processing'];
    const modes = ['NEFT', 'RTGS', 'Cheque', 'IMPS'];
    const arr = [];
    for (let i = 0; i < 20; i++) {
      const base = (i + 1) * 72000 + 18000;
      const gst = Math.round(base * 0.18);
      const total = base + gst;
      const isPaid = statuses[i % statuses.length] === 'Paid';
      arr.push({
        id: `PAY-2026-${String(i + 1).padStart(3, '0')}`,
        invoiceId: `INV-2026-${String(i + 1).padStart(3, '0')}`,
        poId: `PO-2026-${String(i + 1).padStart(3, '0')}`,
        invoiceDate: fmt(new Date(2026, 0, i + 18)),
        dueDate: fmt(new Date(2026, 1, i + 17)),
        amount: total,
        status: statuses[i % statuses.length],
        paidDate: isPaid ? fmt(new Date(2026, 1, i + 10)) : '',
        paymentMode: isPaid ? modes[i % modes.length] : '',
        referenceNo: isPaid ? `UTR${20260000 + i}` : '',
      });
    }
    return arr;
  })(),

  notifications: [
    { id: 'N01', type: 'rfq', title: 'New RFQ Available', text: 'RFQ-2026-020 for RFID Hang Tags & EAS Security Tags has been published. Closing in 14 days.', time: '2 hours ago', unread: true },
    { id: 'N02', type: 'rfq', title: 'New RFQ Available', text: 'RFQ-2026-019 for Garment Hangers (Velvet & Plastic) is now open for quotation.', time: '5 hours ago', unread: true },
    { id: 'N03', type: 'quotation', title: 'Quotation Under Evaluation', text: 'Your quotation QT-2026-003 for Elastic Webbing 25mm & 38mm is under evaluation by the team.', time: '1 day ago', unread: true },
    { id: 'N04', type: 'po', title: 'Purchase Order Received', text: 'PO-2026-003 has been issued for Reactive Dyes (Black, Navy, Red). Please review and accept.', time: '2 days ago', unread: true },
    { id: 'N05', type: 'po', title: 'PO Accepted Successfully', text: 'Your acceptance of PO-2026-002 for Polyester Yarn 150D/48F has been confirmed.', time: '3 days ago', unread: false },
    { id: 'N06', type: 'delivery', title: 'Delivery Reminder', text: 'Shipment SHP-2026-001 for Cotton Woven Fabric is due for delivery tomorrow. Ensure on-time dispatch.', time: '3 days ago', unread: false },
    { id: 'N07', type: 'invoice', title: 'Invoice Approved', text: 'Invoice INV-2026-002 has been approved by the Central Warehouse procurement team.', time: '4 days ago', unread: false },
    { id: 'N08', type: 'payment', title: 'Payment Released', text: 'Payment of ₹ 2,45,680 for INV-2026-001 (Cotton Fabric) has been released via NEFT. UTR: UTR2026001.', time: '5 days ago', unread: false },
    { id: 'N09', type: 'quotation', title: 'Quotation Approved', text: 'Congratulations! Your quotation QT-2026-004 for YKK Zipper Assortment has been approved. PO to follow.', time: '6 days ago', unread: false },
    { id: 'N10', type: 'quotation', title: 'Quotation Rejected', text: 'Your quotation QT-2026-008 for Enzyme Washing Chemicals was not selected this time.', time: '7 days ago', unread: false },
    { id: 'N11', type: 'rfq', title: 'RFQ Closing Soon', text: 'RFQ-2026-006 for Stretch Denim Fabric 11 Oz closes in 2 days. Submit your quotation.', time: '8 days ago', unread: false },
    { id: 'N12', type: 'invoice', title: 'Invoice Payment Due', text: 'Invoice INV-2026-005 is due for payment on 15-Feb-2026. Please follow up with accounts.', time: '9 days ago', unread: false },
    { id: 'N13', type: 'delivery', title: 'Shipment Delivered', text: 'Shipment SHP-2026-013 (Interlock Knitted Fabric) has been marked Delivered at CW Bangalore.', time: '10 days ago', unread: false },
    { id: 'N14', type: 'po', title: 'PO Amendment', text: 'PO-2026-005 for Packaging Cartons has been amended. Delivery date extended by 7 days. Please acknowledge.', time: '11 days ago', unread: false },
    { id: 'N15', type: 'payment', title: 'Payment Processing', text: 'Payment for INV-2026-004 (Woven Brand Labels) is being processed. Expected credit in 2-3 working days.', time: '12 days ago', unread: false },
  ],

  goods: [
    { id: 'GD-001', name: 'Cotton Woven Fabric 60s x 60s – White', category: 'Fabric', unit: 'Mtrs', quantity: 5000, price: 185 },
    { id: 'GD-002', name: 'Polyester Yarn 150D/48F – Cone', category: 'Yarn', unit: 'Kgs', quantity: 2000, price: 220 },
    { id: 'GD-003', name: 'YKK Zipper #5 – Black 30cm', category: 'Trims', unit: 'Pcs', quantity: 10000, price: 18 },
    { id: 'GD-004', name: 'Elastic Webbing 25mm – White', category: 'Trims', unit: 'Mtrs', quantity: 10000, price: 8 },
    { id: 'GD-005', name: 'Export Cartons – 4 Ply 60x40x40cm', category: 'Packaging', unit: 'Pcs', quantity: 5000, price: 72 },
  ],

  catalog: [
    {
      id: 'CAT-001', vendorId: 'V001', name: "Men's Round Neck Cotton T-Shirt",
      productType: "Men's Wear", gender: 'Men', fabric: 'Cotton', colour: 'Navy Blue', size: 'M', gsm: 180,
      description: 'Basic crew neck t-shirt in 100% combed cotton, single jersey knit.',
      sku: 'SKU-A001-NV-M', createdDate: '01 Jan 2026', submittedDate: '02 Jan 2026',
      documents: [{ name: 'tech-spec-tshirt.pdf', uploadedDate: '01 Jan 2026' }],
    },
    {
      id: 'CAT-002', vendorId: 'V001', name: "Women's Slim Fit Denim Jeans",
      productType: 'Denim', gender: 'Women', fabric: 'Denim', colour: 'Indigo Blue', size: 'M', gsm: 400,
      description: 'Stretch denim slim fit jeans with 5-pocket styling.',
      sku: null, createdDate: '03 Jan 2026', submittedDate: '04 Jan 2026',
      documents: [{ name: 'denim-wash-chart.pdf', uploadedDate: '03 Jan 2026' }],
    },
    {
      id: 'CAT-003', vendorId: 'V001', name: 'Boys School Uniform Shirt',
      productType: 'School Uniforms', gender: 'Boys', fabric: 'Poly-Cotton', colour: 'White', size: 'M', gsm: 120,
      description: 'White Oxford weave school shirt, half sleeve, with chest pocket.',
      sku: null, createdDate: '04 Jan 2026', submittedDate: '05 Jan 2026',
      documents: [],
    },
    {
      id: 'CAT-004', vendorId: 'V001', name: 'Dry-Fit Sports T-Shirt',
      productType: 'Sportswear', gender: 'Unisex', fabric: 'Polyester', colour: 'Royal Blue', size: 'S', gsm: 140,
      description: 'Moisture-wicking polyester dry-fit t-shirt for school sports uniform.',
      sku: null, createdDate: '02 Jan 2026', submittedDate: '03 Jan 2026',
      documents: [{ name: 'dryfit-sample-report.pdf', uploadedDate: '02 Jan 2026' }],
    },
    {
      id: 'CAT-005', vendorId: 'V001', name: 'Kids Hooded Fleece Sweatshirt',
      productType: 'Kids & Infants', gender: 'Girls', fabric: 'Fleece', colour: 'Multicolor', size: 'S', gsm: 320,
      description: 'Fleece hooded sweatshirt with kangaroo pocket, drawstring hood.',
      sku: null, createdDate: '08 Jan 2026', submittedDate: '08 Jan 2026',
      documents: [],
    },
    {
      id: 'CAT-006', vendorId: 'V001', name: 'Ladies Printed Cotton Kurti',
      productType: 'Ethnic Wear', gender: 'Women', fabric: 'Cotton', colour: 'Multicolor', size: 'M', gsm: 150,
      description: 'Straight cut printed cotton kurti with side slits.',
      sku: null, createdDate: '08 Jan 2026', submittedDate: '09 Jan 2026',
      documents: [{ name: 'kurti-print-catalogue.pdf', uploadedDate: '08 Jan 2026' }],
    },
    {
      id: 'CAT-007', vendorId: 'V001', name: "Men's 6-Pocket Cargo Pants",
      productType: 'Workwear', gender: 'Men', fabric: 'Poly-Cotton', colour: 'Olive Green', size: 'L', gsm: 220,
      description: 'Rip-stop poly-cotton cargo pants with 6 utility pockets, reinforced knees.',
      sku: 'SKU-A002-OG-L', createdDate: '05 Jan 2026', submittedDate: '06 Jan 2026',
      documents: [{ name: 'cargo-pants-spec.pdf', uploadedDate: '05 Jan 2026' }, { name: 'size-chart.xlsx', uploadedDate: '05 Jan 2026' }],
    },
  ],
};
