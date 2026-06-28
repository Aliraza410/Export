import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const app = express();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/uploads/:filename', async (req, res) => {
  try {
    const file = await prisma.uploadedFile.findUnique({
      where: { filename: req.params.filename }
    });
    if (!file) {
      const localPath = path.join('uploads', req.params.filename);
      if (fs.existsSync(localPath)) return res.sendFile(path.resolve(localPath));
      return res.status(404).send('File not found');
    }
    
    if (file.mimetype) {
      res.setHeader('Content-Type', file.mimetype);
    } else {
      const ext = path.extname(file.filename).toLowerCase();
      if (ext === '.pdf') res.setHeader('Content-Type', 'application/pdf');
      else if (ext === '.png') res.setHeader('Content-Type', 'image/png');
      else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
      else if (ext === '.doc' || ext === '.docx') res.setHeader('Content-Type', 'application/msword');
    }
    
    res.send(file.data);
  } catch (error) {
    res.status(500).send('Error retrieving file');
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only Images (JPG/PNG) and Documents (PDF/DOC) are allowed'));
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-123';

// -----------------------------------------
// Auth Routes
// -----------------------------------------
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, company } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, company }
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const profilePic = payload.picture;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user for google auth
      // generating a random password since password is required by schema
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await prisma.user.create({
        data: {
          name: name,
          email: email,
          password: hashedPassword,
          company: "",
          profilePic: profilePic
        }
      });
    }

    const jwtToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token: jwtToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, profilePic: user.profilePic } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid Google Token' });
  }
});

// Middleware to protect routes (needs to be defined before we use it in /auth/me, but wait, authMiddleware is defined BELOW this! I need to put /auth/me below authMiddleware!)

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true, company: true, profilePic: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------
// User Settings Routes
// -----------------------------------------
app.put('/api/user/profile', authMiddleware, upload.single('profilePic'), async (req, res) => {
  try {
    const { name } = req.body;
    let updateData = { name };
    if (req.file) {
      updateData.profilePic = `/uploads/${req.file.filename}`;
      const fileData = fs.readFileSync(req.file.path);
      await prisma.uploadedFile.create({
        data: { filename: req.file.filename, data: fileData, mimetype: req.file.mimetype }
      });
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, company: true, profilePic: true }
    });
    res.json(updatedUser);
  } catch (err) {
    console.error("Profile update error", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.get('/api/user/export-data', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        documents: true,
        exportRequests: true,
        registrations: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Remove password hash from export
    const { password, ...safeUserData } = user;
    res.json(safeUserData);
  } catch (err) {
    console.error("Export data error", err);
    res.status(500).json({ error: "Failed to export data" });
  }
});

app.delete('/api/user/account', authMiddleware, async (req, res) => {
  try {
    // Delete all related records first
    await prisma.document.deleteMany({ where: { userId: req.user.id } });
    await prisma.exportRequest.deleteMany({ where: { userId: req.user.id } });
    await prisma.registrationProgress.deleteMany({ where: { userId: req.user.id } });

    // Finally delete user
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Account deletion error", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});



// -----------------------------------------
// Documents Routes
// -----------------------------------------

app.get('/api/documents/template/:name', (req, res) => {
  try {
    const docName = req.params.name;
    const doc = new PDFDocument({ margin: 50 });

    const cleanName = docName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanName}.pdf"`);

    doc.pipe(res);

    if (docName === 'PI Template') {
      const darkBlue = '#1A2942';
      const textDark = '#0A1628';
      const textGray = '#475569';
      const border = '#E2E8F0';

      // Prevent page from being added automatically to avoid footer issues
      doc.options.bufferPages = true;

      // Header
      doc.fillColor(darkBlue).rect(0, 40, 612, 60).fill();
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('EXPORTEASE', 40, 50);
      doc.fontSize(10).font('Helvetica').text('GLOBAL TRADE & EXPORT SOLUTIONS', 40, 75, { color: '#CBD5E1' });

      doc.fontSize(16).font('Helvetica-Bold').text('PROFORMA INVOICE', 350, 50, { width: 220, align: 'right' });
      doc.fontSize(8).font('Helvetica').text('For customs & export reference only\nNot a demand for payment', 350, 68, { width: 220, align: 'right' });

      // Meta Info
      let y = 120;
      doc.rect(40, y, 532, 40).stroke(border);
      doc.moveTo(180, y).lineTo(180, y + 40).stroke(border);
      doc.moveTo(350, y).lineTo(350, y + 40).stroke(border);
      doc.moveTo(480, y).lineTo(480, y + 40).stroke(border);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('PROFORMA NO.', 45, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text('PI-2026-0001', 45, y + 20);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('DATE OF ISSUE', 185, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text('26 June 2026', 185, y + 20);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('VALIDITY', 355, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text('30 days from issue', 355, y + 20);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('CURRENCY', 485, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text('PKR', 485, y + 20);

      // Parties
      y += 60;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('PARTIES TO THE TRANSACTION', 40, y);
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 30;
      doc.fontSize(9).font('Helvetica-Bold').text('EXPORTER / SELLER', 40, y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textDark).text('ExportEase Pvt. Ltd.', 40, y + 15);
      doc.fontSize(9).font('Helvetica').fillColor(textGray).text('Plot 14, Sector A, Industrial Trade Zone\nLahore, Punjab, Pakistan\nPhone: +92 300 1234567   Email: trade@exportease.com\nWebsite: www.exportease.com\nTax / NTN: 1234567-8   |   STRN: 03-00-1234-567-89', 40, y + 30, { lineGap: 4 });

      doc.moveTo(306, y).lineTo(306, y + 80).strokeColor(border).stroke();

      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('CONSIGNEE / BUYER', 320, y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textDark).text('[Buyer Company Name]', 320, y + 15);
      doc.fontSize(9).font('Helvetica').fillColor(textGray).text('[Street Address, City]\n[State / Province, ZIP]   [Country]\nPhone: [+_ ___ _______]   Email: [buyer@email.com]\nBuyer Reference / PO No.: [PO-XXXXX]', 320, y + 30, { lineGap: 4 });

      // Shipment Details
      y += 120;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('SHIPMENT & TRADE DETAILS', 40, y);
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 25;
      const w = 177;
      doc.rect(40, y, 532, 105).stroke(border);
      doc.moveTo(40, y + 35).lineTo(572, y + 35).stroke(border);
      doc.moveTo(40, y + 70).lineTo(572, y + 70).stroke(border);
      doc.moveTo(40 + w, y).lineTo(40 + w, y + 105).stroke(border);
      doc.moveTo(40 + w * 2, y).lineTo(40 + w * 2, y + 105).stroke(border);

      const drawCell = (title, val, cx, cy) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text(title, cx + 5, cy + 5, { lineBreak: false });
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(val, cx + 5, cy + 18, { lineBreak: false });
      };

      drawCell('COUNTRY OF ORIGIN', 'Pakistan', 40, y);
      drawCell('COUNTRY OF FINAL DESTINATION', '[Destination Country]', 40 + w, y);
      drawCell('PORT OF LOADING', '[Port of Loading]', 40 + w * 2, y);
      drawCell('PORT OF DISCHARGE', '[Port of Discharge]', 40, y + 35);
      drawCell('MODE OF SHIPMENT', '[Sea / Air / Land]', 40 + w, y + 35);
      drawCell('INCOTERMS', '[FOB / CIF / EXW] â€” [Port]', 40 + w * 2, y + 35);
      drawCell('PAYMENT TERMS', '[e.g., 30% Advance, 70% on B/L]', 40, y + 70);
      drawCell('MODE OF PAYMENT', '[T/T / L/C / D/P]', 40 + w, y + 70);
      drawCell('ESTIMATED SHIPMENT DATE', '[DD Month YYYY]', 40 + w * 2, y + 70);

      // Goods
      y += 120;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('DESCRIPTION OF GOODS', 40, y, { lineBreak: false });
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 25;
      doc.fillColor(darkBlue).rect(40, y, 532, 20).fill();
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
      doc.text('S.No.', 45, y + 6, { lineBreak: false });
      doc.text('Description of Goods', 85, y + 6, { lineBreak: false });
      doc.text('Quantity', 260, y + 6, { width: 60, align: 'center', lineBreak: false });
      doc.text('Unit Price', 330, y + 6, { width: 70, align: 'center', lineBreak: false });
      doc.text('HS Code / Unit', 410, y + 6, { width: 80, align: 'center', lineBreak: false });
      doc.text('Amount (PKR)', 490, y + 6, { width: 75, align: 'right', lineBreak: false });

      const rowH = 30;
      doc.fillColor(textDark).fontSize(9).font('Helvetica');
      doc.text('1', 45, y + 25 + 6);
      doc.text('[Product description â€” e.g., Cotton Bed\nLinen Set, 100% Cotton, White]', 85, y + 25 + 2);
      doc.text('500 Pcs', 260, y + 25 + 6, { width: 60, align: 'center' });
      doc.text('PKR 2,400', 330, y + 25 + 6, { width: 70, align: 'center' });
      doc.text('5208.21 / Set', 410, y + 25 + 6, { width: 80, align: 'center' });
      doc.font('Helvetica-Bold').text('PKR 1,200,000', 490, y + 25 + 6, { width: 75, align: 'right' });

      doc.font('Helvetica').text('2', 45, y + 25 + rowH + 6);
      doc.text('[Product description]', 85, y + 25 + rowH + 6);
      doc.text('[Qty]', 260, y + 25 + rowH + 6, { width: 60, align: 'center' });
      doc.text('[Unit Price]', 330, y + 25 + rowH + 6, { width: 70, align: 'center' });
      doc.text('[HS Code]', 410, y + 25 + rowH + 6, { width: 80, align: 'center' });
      doc.text('[Amount]', 490, y + 25 + rowH + 6, { width: 75, align: 'right' });

      doc.text('3', 45, y + 25 + rowH * 2 + 6);
      doc.text('[Product description]', 85, y + 25 + rowH * 2 + 6);
      doc.text('[Qty]', 260, y + 25 + rowH * 2 + 6, { width: 60, align: 'center' });
      doc.text('[Unit Price]', 330, y + 25 + rowH * 2 + 6, { width: 70, align: 'center' });
      doc.text('[HS Code]', 410, y + 25 + rowH * 2 + 6, { width: 80, align: 'center' });
      doc.text('[Amount]', 490, y + 25 + rowH * 2 + 6, { width: 75, align: 'right' });

      // Totals Box
      y += 120;
      doc.rect(40, y, 532, 60).stroke(border);
      doc.moveTo(40, y + 20).lineTo(572, y + 20).stroke(border);
      doc.moveTo(40, y + 40).lineTo(572, y + 40).stroke(border);

      doc.fontSize(9).font('Helvetica').fillColor(textGray);
      doc.text('Subtotal', 45, y + 6, { width: 440, align: 'right' });
      doc.text('Freight Charges (Estimated)', 45, y + 26, { width: 440, align: 'right' });
      doc.text('Insurance (Estimated)', 45, y + 46, { width: 440, align: 'right' });

      doc.fillColor(textDark);
      doc.text('PKR 1,200,000', 490, y + 6, { width: 75, align: 'right' });
      doc.text('PKR [____]', 490, y + 26, { width: 75, align: 'right' });
      doc.text('PKR [____]', 490, y + 46, { width: 75, align: 'right' });

      doc.rect(40, y + 60, 532, 25).fillAndStroke('#F8FAFC', darkBlue);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue);
      doc.text('Total Proforma Value', 45, y + 68, { width: 440, align: 'right' });
      doc.text('PKR [Total Amount]', 490, y + 68, { width: 75, align: 'right' });

      // Banking Details
      y += 105;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('BANKING DETAILS FOR REMITTANCE', 40, y);
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 25;
      doc.rect(40, y, 532, 50).stroke(border);
      doc.moveTo(40, y + 25).lineTo(572, y + 25).stroke(border);
      const bw = 177;
      doc.moveTo(40 + bw, y).lineTo(40 + bw, y + 50).stroke(border);
      doc.moveTo(40 + bw * 2, y).lineTo(40 + bw * 2, y + 50).stroke(border);

      drawCell('BANK NAME', '[Bank Name]', 40, y);
      drawCell('ACCOUNT TITLE', 'ExportEase Pvt. Ltd.', 40 + bw, y);
      drawCell('ACCOUNT NO. / IBAN', '[IBAN / Account No.]', 40 + bw * 2, y);
      drawCell('SWIFT / BIC CODE', '[SWIFT CODE]', 40, y + 25);
      drawCell('BRANCH ADDRESS', '[Branch Address]', 40 + bw, y + 25);
      drawCell('CURRENCY', 'PKR', 40 + bw * 2, y + 25);

      // Footer for first page
      doc.moveTo(40, 720).lineTo(572, 720).stroke(border);
      doc.fontSize(8).font('Helvetica').fillColor(textGray);
      doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 730, { lineBreak: false });
      doc.text('Generated 26 June 2026', 450, 730, { width: 122, align: 'right', lineBreak: false });

      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('TERMS & DECLARATION', 40, 40);
      doc.moveTo(40, 56).lineTo(572, 56).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      doc.fontSize(9).font('Helvetica').fillColor(textDark);
      doc.list([
        'This Proforma Invoice is issued solely to facilitate the buyer\'s import formalities, application for letter of credit, or advance payment arrangement, and does not constitute a tax invoice or a demand for payment.',
        'Prices quoted are valid for the period stated above and are subject to change in the event of fluctuation in raw material costs, freight rates, or currency exchange rates.',
        'Goods will be shipped only after receipt of payment / confirmed Letter of Credit as per the payment terms specified above.',
        'Delivery timelines are estimates and may vary depending on production schedules, customs clearance, and carrier availability.',
        'All disputes are subject to the jurisdiction of the courts at Lahore, Pakistan.'
      ], 50, 70, { lineGap: 6, bulletRadius: 2 });

      doc.moveDown(2);
      doc.font('Helvetica-Oblique').fillColor(textGray).text('We hereby certify that this Proforma Invoice is true and correct, and that the goods described above will be exported in accordance with the terms stated herein.', 40, doc.y, { width: 532, lineGap: 2 });

      doc.moveDown(2);
      const sigY = doc.y;
      doc.rect(40, sigY, 532, 100).stroke(border);
      doc.moveTo(306, sigY).lineTo(306, sigY + 100).stroke(border);

      doc.fontSize(8).font('Helvetica').text('Buyer\'s Acceptance & Signature', 45, sigY + 5);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('Authorized Signatory â€” ExportEase Pvt. Ltd.', 311, sigY + 25, { width: 256, align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor(textDark);
      doc.text('Name: ______________________', 311, sigY + 45, { width: 256, align: 'right' });
      doc.text('Designation: ________________', 311, sigY + 65, { width: 256, align: 'right' });
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(textGray).text('Company Seal / Stamp', 311, sigY + 85, { width: 256, align: 'right' });

      // Draw footer on second page (currently on it)
      doc.moveTo(40, 720).lineTo(572, 720).stroke(border);
      doc.fontSize(8).font('Helvetica').fillColor(textGray);
      doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 730, { lineBreak: false });
      doc.text('Generated 26 June 2026', 450, 730, { width: 122, align: 'right', lineBreak: false });
    } else {
      // Simple modern layout for a placeholder template
      doc.fillColor('#1E6FD9').rect(0, 0, 650, 100).fill();
      doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('TEMPLATE DOCUMENT', 50, 40);

      doc.moveDown(4);
      doc.fillColor('#0A1628').fontSize(24).font('Helvetica-Bold').text(docName, { align: 'center' });

      doc.moveDown(2);
      doc.fillColor('#475569').fontSize(12).font('Helvetica').text(`This is an official placeholder template for the ${docName}.`, { align: 'center' });

      doc.moveDown(2);
      doc.rect(50, doc.y, 500, 100).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#64748B').fontSize(10).text(
        'In a production environment, this file would contain the exact standardized form fields, structural formatting, and legal disclaimers required by the relevant authorities (e.g., FBR, Customs, SECP, Chamber of Commerce).',
        70, doc.y - 80, { width: 460, align: 'center' }
      );
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/documents/generate', authMiddleware, async (req, res) => {
  try {
    const settings = getEstimatorSettings();
    const { type, buyerName, buyerAddress, portOfLoading, portOfDischarge, hsCode, description, quantity, unitPrice, paymentTerms, totalPackages, netWeight, grossWeight, contractValue, incoterms, deliveryDate, governingLaw, packageType, dimensions, shippingMark, customFields } = req.body;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${(type || 'Document').replace(/\s+/g, '_')}_${uniqueSuffix}.pdf`;
    const filePath = path.join('uploads', filename);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const docType = (type || 'Document').toUpperCase();
    const theme = settings.documentThemes?.[type] || { layoutPattern: 'modern', primaryColor: '#1A2942' };
    const primaryColor = theme.primaryColor || '#1E6FD9';
    const textColor = '#333333';
    const lightGray = '#E5E7EB';

    const renderCustomFields = (doc, currentY) => {
      const docCustomFieldsConfig = settings.documentCustomFields?.[type] || [];
      const activeFields = docCustomFieldsConfig.filter(f => customFields && customFields[f.name] !== undefined && customFields[f.name] !== "");
      
      if (activeFields.length === 0) return currentY;
      
      let yPos = currentY + 10;
      if (yPos > 650) { doc.addPage(); yPos = 50; }
      
      const darkBlue = '#1A2942';
      const textDark = '#0A1628';
      const textGray = '#475569';
      const border = '#CBD5E1';
      
      if (type === 'Packing List' || type === 'Proforma Invoice' || type === 'Export Contract') {
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('ADDITIONAL DETAILS', 40, yPos);
        doc.moveTo(40, yPos + 15).lineTo(572, yPos + 15).strokeColor(darkBlue).lineWidth(1.5).stroke();
        yPos += 22;
      } else {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text('ADDITIONAL DETAILS', 40, yPos);
        yPos += 15;
      }
      
      let col = 0;
      activeFields.forEach((fieldConfig) => {
        const isTextarea = fieldConfig.type === 'textarea';
        const val = String(customFields[fieldConfig.name]);
        const neededHeight = isTextarea ? doc.heightOfString(val, { width: 510 }) + 30 : 40;
        
        if (yPos + neededHeight > 750) {
          doc.addPage();
          yPos = 50;
        }

        if (isTextarea) {
          if (col === 1) { yPos += 40; col = 0; }
          doc.rect(40, yPos, 532, neededHeight).strokeColor(border).lineWidth(1).stroke();
          doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text(fieldConfig.label.toUpperCase(), 45, yPos + 6);
          doc.fontSize(10).font('Helvetica').fillColor(textDark).text(val, 45, yPos + 20, { width: 510 });
          yPos += neededHeight;
        } else {
          if (col === 0) {
            doc.rect(40, yPos, 532, 40).strokeColor(border).lineWidth(1).stroke();
            doc.moveTo(306, yPos).lineTo(306, yPos + 40).strokeColor(border).stroke();
            doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text(fieldConfig.label.toUpperCase(), 45, yPos + 6);
            doc.fontSize(10).font('Helvetica').fillColor(textDark).text(val, 45, yPos + 20, { width: 250, height: 16, ellipsis: true });
            col = 1;
          } else {
            doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text(fieldConfig.label.toUpperCase(), 311, yPos + 6);
            doc.fontSize(10).font('Helvetica').fillColor(textDark).text(val, 311, yPos + 20, { width: 250, height: 16, ellipsis: true });
            col = 0;
            yPos += 40;
          }
        }
      });
      
      if (col === 1) {
        yPos += 40;
      }
      
      return yPos + 10;
    };

    const replaceVars = (str) => {
      if (!str) return '';
      return str
        .replace(/{description}/g, description || 'Export Goods')
        .replace(/{contractValue}/g, Number(contractValue || '0.00').toLocaleString('en-US'))
        .replace(/{incoterms}/g, incoterms || 'FOB')
        .replace(/{deliveryDate}/g, deliveryDate || 'TBD')
        .replace(/{governingLaw}/g, governingLaw || 'Pakistan')
        .replace(/{buyerName}/g, buyerName || 'Buyer Name');
    };

    const drawGenericClause = (num, title, text, yPos, color1, color2) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      if (title) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor(color1).text(`${num}.   ${title}. `, 40, yPos, { continued: true });
      }
      doc.font('Helvetica').fillColor(color2).text(text, { width: 532, align: 'justify' });
      return doc.y;
    };

    // --- COMMON HEADER ---
    if (type !== 'Proforma Invoice' && type !== 'Commercial Invoice' && type !== 'Export Contract' && type !== 'Packing List') {
      doc.fillColor(primaryColor).rect(50, 45, 40, 40).fill();
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('E', 62, 53);
      doc.fillColor(primaryColor).fontSize(20).text('ExportEase', 100, 55);
      doc.fillColor(textColor).fontSize(22).font('Helvetica-Bold').text(docType, { align: 'right' }, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Document ID: DOC-${uniqueSuffix.toString().slice(-6)}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(3);
    }

    const yAddresses = doc.y;

    if (type === 'Export Contract') {
      const darkBlue = theme.primaryColor || '#1A2942';
      const textDark = '#0A1628';
      const textGray = '#475569';
      const border = '#CBD5E1';

      const execDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      // Top Header
      doc.fillColor(darkBlue).fontSize(22).font('Helvetica-Bold').text('EXPORTEASE', 40, 50);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text('GLOBAL TRADE & EXPORT SOLUTIONS', 40, 75);
      doc.fontSize(9).font('Helvetica').fillColor(textGray).text('Plot 14, Sector A, Industrial Trade Zone, Lahore, Punjab, Pakistan', 40, 88);

      doc.fontSize(16).font('Helvetica-Bold').fillColor(darkBlue).text('EXPORT CONTRACT', 350, 50, { width: 220, align: 'right' });
      doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text('Sale of Goods Agreement', 350, 70, { width: 220, align: 'right' });

      // Meta Info Bar
      let y = 115;
      doc.rect(40, y, 532, 35).fill('#F1F5F9');
      doc.lineWidth(1);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('CONTRACT NO.', 45, y + 6);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text(`EC-2026-${uniqueSuffix.toString().slice(-4)}`, 45, y + 18);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('DATE OF EXECUTION', 311, y + 6);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text(execDate, 311, y + 18);

      // Preamble
      y += 50;
      doc.fontSize(10).font('Helvetica').fillColor(textDark);
      doc.text(`This Export Contract (the "Contract") is made and entered into on ${execDate}, by and between:`, 40, y);

      y += 15;
      doc.font('Helvetica-Bold').text('(1) ExportEase Pvt. Ltd.', 40, y, { continued: true });
      doc.font('Helvetica').text(', a company incorporated under the laws of Pakistan, having its registered office at Plot 14, Sector A, Industrial Trade Zone, Lahore, Punjab, Pakistan (the "Seller", or "Exporter"); and');

      y += 25;
      doc.font('Helvetica-Bold').text(`(2) ${buyerName || 'Buyer Name'}`, 40, y, { continued: true });
      doc.font('Helvetica').text(`, having its registered address at ${(buyerAddress || 'Address').replace(/\n/g, ', ')} (the "Buyer", or "Importer").`);

      y += 15;
      doc.text('The Seller and the Buyer are individually referred to as a "Party" and collectively as the "Parties".', 40, y);

      // Clauses
      y += 20;
      const defaultClauses = settings.documentTemplates?.exportContract?.clauses || [];
      let nextY = y + 10;

      defaultClauses.forEach((clause, index) => {
        nextY = drawGenericClause(index + 1, clause.title, replaceVars(clause.text), nextY + 10, darkBlue, textDark);
      });

      nextY = renderCustomFields(doc, nextY);

      // Signatures
      y = nextY + 30;
      doc.moveTo(40, y).lineTo(572, y).strokeColor(border).lineWidth(1).stroke();

      y += 10;
      doc.fontSize(9).font('Helvetica-Bold').fillColor(textDark).text('For and on behalf of the Seller', 40, y);
      doc.font('Helvetica').text('ExportEase Pvt. Ltd.', 40, y + 15);
      doc.text('Name: ___________________________', 40, y + 30);
      doc.text('Designation: _____________________', 40, y + 45);

      doc.font('Helvetica-Bold').text('For and on behalf of the Buyer', 320, y);
      doc.font('Helvetica').text(buyerName || 'Buyer Name', 320, y + 15);
      doc.text('Name: ___________________________', 320, y + 30);
      doc.text('Designation: _____________________', 320, y + 45);

      // Footer
      doc.moveTo(40, 720).lineTo(572, 720).strokeColor(border).lineWidth(1).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(textGray);
      doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 730, { align: 'center' });

    } else if (type === 'Packing List') {
      const darkBlue = theme.primaryColor || '#1A2942';
      const textDark = '#0A1628';
      const textGray = '#475569';
      const border = '#CBD5E1';
      const issueDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      // Top Header
      doc.fillColor(darkBlue).fontSize(22).font('Helvetica-Bold').text('EXPORTEASE', 40, 50);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text('GLOBAL TRADE & EXPORT SOLUTIONS', 40, 75);
      doc.fontSize(9).font('Helvetica').fillColor(textGray).text('Plot 14, Sector A, Industrial Trade Zone, Lahore, Punjab, Pakistan', 40, 88);
      doc.text('Phone: +92 300 1234567   |   Email: trade@exportease.com   |   www.exportease.com', 40, 100);

      doc.fontSize(16).font('Helvetica-Bold').fillColor(darkBlue).text('PACKING LIST', 350, 50, { width: 220, align: 'right' });
      doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text('Shipment Packing Detail', 350, 70, { width: 220, align: 'right' });

      // Meta Bar
      let y = 130;
      doc.rect(40, y, 532, 35).fill('#F1F5F9');

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PACKING LIST NO.', 45, y + 6);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text(`PL-2026-${uniqueSuffix.toString().slice(-4)}`, 45, y + 18);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('DATE OF ISSUE', 311, y + 6);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text(issueDate, 311, y + 18);

      // Buyer Details
      y += 50;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('BUYER / CLIENT DETAILS', 40, y);
      doc.moveTo(40, y + 15).lineTo(572, y + 15).strokeColor(darkBlue).lineWidth(1.5).stroke();

      y += 22;
      doc.rect(40, y, 532, 40).strokeColor(border).lineWidth(1).stroke();
      doc.moveTo(306, y).lineTo(306, y + 40).strokeColor(border).stroke();

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('BUYER / CLIENT NAME', 45, y + 6);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text(buyerName || 'Client Name', 45, y + 18);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('CLIENT ADDRESS', 311, y + 6);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text((buyerAddress || 'Address').replace(/\n/g, ', '), 311, y + 18);

      // Port Details
      y += 60;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('PORT DETAILS', 40, y);
      doc.moveTo(40, y + 15).lineTo(572, y + 15).strokeColor(darkBlue).lineWidth(1.5).stroke();

      y += 22;
      doc.rect(40, y, 532, 40).strokeColor(border).lineWidth(1).stroke();
      doc.moveTo(306, y).lineTo(306, y + 40).strokeColor(border).stroke();

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PORT OF LOADING', 45, y + 6);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text(portOfLoading || 'N/A', 45, y + 18);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PORT OF DISCHARGE', 311, y + 6);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text(portOfDischarge || 'N/A', 311, y + 18);

      // Packing Details Table
      y += 60;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('PACKING DETAILS', 40, y);
      doc.moveTo(40, y + 15).lineTo(572, y + 15).strokeColor(darkBlue).lineWidth(1.5).stroke();

      y += 22;
      doc.fillColor(darkBlue).rect(40, y, 532, 35).fill();

      // Draw vertical lines for header
      const cols = [40, 145, 235, 295, 420, 480, 540, 572];
      cols.forEach(x => { doc.moveTo(x, y).lineTo(x, y + 35).strokeColor(border).lineWidth(0.5).stroke(); });

      // Header Text
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
      doc.text('Product Description', 40, y + 12, { width: 105, align: 'center' });
      doc.text('Package Type', 145, y + 12, { width: 90, align: 'center' });
      doc.text('Total Pkgs.', 235, y + 12, { width: 60, align: 'center' });
      doc.text('Dimensions (LÃ—WÃ—H,\ncm)', 295, y + 6, { width: 125, align: 'center' });
      doc.text('HS Code', 420, y + 12, { width: 60, align: 'center' });
      doc.text('Net Wt. (kg)', 480, y + 12, { width: 60, align: 'center' });
      doc.text('Gross Wt. (kg)', 540, y + 12, { width: 32, align: 'center' }); // Tightly squeezed to fit

      y += 35;

      // Data Row
      const rowHeight = 35;
      doc.rect(40, y, 532, rowHeight).strokeColor(border).stroke();
      cols.forEach(x => { doc.moveTo(x, y).lineTo(x, y + rowHeight).strokeColor(border).stroke(); });

      doc.fillColor(textDark).fontSize(9).font('Helvetica');
      doc.text(description || 'Export Goods', 45, y + 12, { width: 95, align: 'center' });
      doc.text(packageType || 'Cartons', 145, y + 12, { width: 90, align: 'center' });
      doc.text(totalPackages || '1', 235, y + 12, { width: 60, align: 'center' });
      doc.text(dimensions || 'N/A', 295, y + 12, { width: 125, align: 'center' });
      doc.text(hsCode || 'N/A', 420, y + 12, { width: 60, align: 'center' });
      doc.text(netWeight || '0', 480, y + 12, { width: 60, align: 'center' });
      doc.text(grossWeight || '0', 540, y + 12, { width: 32, align: 'center' });

      y += rowHeight;

      // Totals Row
      doc.rect(40, y, 532, 25).fill('#F8FAFC');
      doc.rect(40, y, 532, 25).strokeColor(border).stroke();
      [40, 235, 295, 480, 540, 572].forEach(x => { doc.moveTo(x, y).lineTo(x, y + 25).strokeColor(border).stroke(); });

      doc.fillColor(textDark).fontSize(9).font('Helvetica-Bold').text('TOTAL', 40, y + 8, { width: 185, align: 'right' });
      doc.text(totalPackages || '1', 235, y + 8, { width: 60, align: 'center' });
      doc.text(netWeight || '0', 480, y + 8, { width: 60, align: 'center' });
      doc.text(grossWeight || '0', 540, y + 8, { width: 32, align: 'center' });

      y += 25;

      // Shipping Mark Box
      doc.rect(40, y, 532, 40).strokeColor(border).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PACKAGE MARKING / SHIPPING MARK', 45, y + 6);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text(shippingMark || 'N/A', 45, y + 18);

      // Certification Footer
      y = renderCustomFields(doc, y + 45);
      y += 20;
      const plClauses = settings.documentTemplates?.packingList?.clauses || [];
      if (plClauses.length > 0) {
        let nextY = y;
        plClauses.forEach((clause, index) => {
          nextY = drawGenericClause(index + 1, clause.title, replaceVars(clause.text), nextY + 10, primaryColor, textDark);
        });
        y = nextY;
      } else {
        const plDec = settings.documentTemplates?.packingList?.footerNotes || 'We hereby certify that the above particulars are true and correct, and that the goods have been packed as described.';
        doc.fontSize(9).font('Helvetica-Oblique').fillColor(textDark).text(plDec, 40, y);
      }

      y += 30;
      doc.moveTo(40, y).lineTo(572, y).strokeColor(border).lineWidth(1).stroke();

      y += 8;
      doc.fontSize(8).font('Helvetica').fillColor(textDark).text('Authorized Signatory â€” ExportEase Pvt. Ltd.', 40, y);
      doc.fillColor('#94A3B8').font('Helvetica-Oblique').text('Company Seal / Stamp', 350, y, { width: 220, align: 'center' });

      // Page Footer
      doc.fontSize(8).font('Helvetica').fillColor(textGray);
      doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 750, { align: 'center' });

    } else if (type === 'Proforma Invoice') {
      const darkBlue = theme.primaryColor || '#1A2942';
      const textDark = '#0A1628';
      const textGray = '#475569';
      const border = '#E2E8F0';

      doc.options.bufferPages = true;

      // Header
      doc.fillColor(darkBlue).rect(0, 40, 612, 60).fill();
      doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('EXPORTEASE', 40, 50);
      doc.fontSize(10).font('Helvetica').text('GLOBAL TRADE & EXPORT SOLUTIONS', 40, 75, { color: '#CBD5E1' });

      doc.fontSize(16).font('Helvetica-Bold').text('PROFORMA INVOICE', 350, 50, { width: 220, align: 'right' });
      doc.fontSize(8).font('Helvetica').text('For customs & export reference only\nNot a demand for payment', 350, 68, { width: 220, align: 'right' });

      // Meta Info
      let y = 120;
      doc.rect(40, y, 532, 40).stroke(border);
      doc.moveTo(180, y).lineTo(180, y + 40).stroke(border);
      doc.moveTo(350, y).lineTo(350, y + 40).stroke(border);
      doc.moveTo(480, y).lineTo(480, y + 40).stroke(border);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('PROFORMA NO.', 45, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text(`PI-2026-${uniqueSuffix.toString().slice(-4)}`, 45, y + 20);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('DATE OF ISSUE', 185, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text(new Date().toLocaleDateString(), 185, y + 20);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('VALIDITY', 355, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text('30 days from issue', 355, y + 20);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(darkBlue).text('CURRENCY', 485, y + 5);
      doc.fontSize(10).font('Helvetica').fillColor(textDark).text('PKR', 485, y + 20);

      // Parties
      y += 60;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('PARTIES TO THE TRANSACTION', 40, y);
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 30;
      doc.fontSize(9).font('Helvetica-Bold').text('EXPORTER / SELLER', 40, y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textDark).text('ExportEase Pvt. Ltd.', 40, y + 15);
      doc.fontSize(9).font('Helvetica').fillColor(textGray).text('Plot 14, Sector A, Industrial Trade Zone\nLahore, Punjab, Pakistan\nPhone: +92 300 1234567   Email: trade@exportease.com\nWebsite: www.exportease.com\nTax / NTN: 1234567-8   |   STRN: 03-00-1234-567-89', 40, y + 30, { lineGap: 4 });

      doc.moveTo(306, y).lineTo(306, y + 80).strokeColor(border).stroke();

      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('CONSIGNEE / BUYER', 320, y);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(textDark).text(buyerName || 'Valued Client', 320, y + 15);
      doc.fontSize(9).font('Helvetica').fillColor(textGray).text(`${buyerAddress || 'Address not provided'}\nBuyer Reference / PO No.: Pending`, 320, y + 30, { lineGap: 4 });

      // Shipment Details
      y += 100;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('SHIPMENT & TRADE DETAILS', 40, y);
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 25;
      const w = 177;
      doc.rect(40, y, 532, 105).stroke(border);
      doc.moveTo(40, y + 35).lineTo(572, y + 35).stroke(border);
      doc.moveTo(40, y + 70).lineTo(572, y + 70).stroke(border);
      doc.moveTo(40 + w, y).lineTo(40 + w, y + 105).stroke(border);
      doc.moveTo(40 + w * 2, y).lineTo(40 + w * 2, y + 105).stroke(border);

      const drawCell = (title, val, cx, cy) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text(title, cx + 5, cy + 5, { lineBreak: false });
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(val, cx + 5, cy + 18, { lineBreak: false });
      };

      drawCell('COUNTRY OF ORIGIN', 'Pakistan', 40, y);
      drawCell('COUNTRY OF FINAL DESTINATION', portOfDischarge ? portOfDischarge.split(',').pop().trim() : 'N/A', 40 + w, y);
      drawCell('PORT OF LOADING', portOfLoading || 'N/A', 40 + w * 2, y);
      drawCell('PORT OF DISCHARGE', portOfDischarge || 'N/A', 40, y + 35);
      drawCell('MODE OF SHIPMENT', 'Sea / Air', 40 + w, y + 35);
      drawCell('INCOTERMS', incoterms || 'FOB', 40 + w * 2, y + 35);
      drawCell('PAYMENT TERMS', paymentTerms || 'N/A', 40, y + 70);
      drawCell('MODE OF PAYMENT', 'T/T / L/C', 40 + w, y + 70);
      drawCell('ESTIMATED SHIPMENT DATE', deliveryDate || 'TBD', 40 + w * 2, y + 70);

      // Goods
      y += 125;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('DESCRIPTION OF GOODS', 40, y, { lineBreak: false });
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 25;
      doc.fillColor(darkBlue).rect(40, y, 532, 20).fill();
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
      doc.text('S.No.', 45, y + 6, { lineBreak: false });
      doc.text('Description of Goods', 85, y + 6, { lineBreak: false });
      doc.text('Quantity', 260, y + 6, { width: 60, align: 'center', lineBreak: false });
      doc.text('Unit Price', 330, y + 6, { width: 70, align: 'center', lineBreak: false });
      doc.text('HS Code / Unit', 410, y + 6, { width: 80, align: 'center', lineBreak: false });
      doc.text('Amount (PKR)', 490, y + 6, { width: 75, align: 'right', lineBreak: false });

      const rowH = 30;
      doc.fillColor(textDark).fontSize(9).font('Helvetica');
      const amt = (parseFloat(quantity || 1) * parseFloat(unitPrice || 0)).toFixed(2);

      doc.text('1', 45, y + 25 + 6);
      doc.text(description || 'Standard Export Goods', 85, y + 25 + 2);
      doc.text(quantity || '1', 260, y + 25 + 6, { width: 60, align: 'center' });
      doc.text(`Rs. ${Number(parseFloat(unitPrice || 0).toFixed(2)).toLocaleString('en-US')}`, 330, y + 25 + 6, { width: 70, align: 'center' });
      doc.text(hsCode || 'N/A', 410, y + 25 + 6, { width: 80, align: 'center' });
      doc.font('Helvetica-Bold').text(`Rs. ${Number(amt).toLocaleString('en-US')}`, 490, y + 25 + 6, { width: 75, align: 'right' });

      // Totals Box
      y += 60;
      doc.rect(40, y, 532, 60).stroke(border);
      doc.moveTo(40, y + 20).lineTo(572, y + 20).stroke(border);
      doc.moveTo(40, y + 40).lineTo(572, y + 40).stroke(border);

      doc.fontSize(9).font('Helvetica').fillColor(textGray);
      doc.text('Subtotal', 45, y + 6, { width: 440, align: 'right' });
      doc.text('Freight Charges (Estimated)', 45, y + 26, { width: 440, align: 'right' });
      doc.text('Insurance (Estimated)', 45, y + 46, { width: 440, align: 'right' });

      doc.fillColor(textDark);
      doc.text(`Rs. ${Number(amt).toLocaleString('en-US')}`, 490, y + 6, { width: 75, align: 'right' });
      doc.text('Rs. 0.00', 490, y + 26, { width: 75, align: 'right' });
      doc.text('Rs. 0.00', 490, y + 46, { width: 75, align: 'right' });

      doc.rect(40, y + 60, 532, 25).fillAndStroke('#F8FAFC', darkBlue);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue);
      doc.text('Total Proforma Value', 45, y + 68, { width: 440, align: 'right' });
      doc.text(`Rs. ${Number(amt).toLocaleString('en-US')}`, 490, y + 68, { width: 75, align: 'right' });

      // Banking Details
      y += 105;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('BANKING DETAILS FOR REMITTANCE', 40, y);
      doc.moveTo(40, y + 16).lineTo(572, y + 16).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      y += 25;
      doc.rect(40, y, 532, 50).stroke(border);
      doc.moveTo(40, y + 25).lineTo(572, y + 25).stroke(border);
      const bw = 177;
      doc.moveTo(40 + bw, y).lineTo(40 + bw, y + 50).stroke(border);
      doc.moveTo(40 + bw * 2, y).lineTo(40 + bw * 2, y + 50).stroke(border);

      drawCell('BANK NAME', 'State Bank of Pakistan', 40, y);
      drawCell('ACCOUNT TITLE', 'ExportEase Pvt. Ltd.', 40 + bw, y);
      drawCell('ACCOUNT NO. / IBAN', 'PK34 SBPK 0000 1234 5678', 40 + bw * 2, y);
      drawCell('SWIFT / BIC CODE', 'SBPKPKKA', 40, y + 25);
      drawCell('BRANCH ADDRESS', 'Main Branch, Karachi', 40 + bw, y + 25);
      drawCell('CURRENCY', 'PKR', 40 + bw * 2, y + 25);

      y = renderCustomFields(doc, y + 55);

      // Footer for first page
      doc.moveTo(40, 720).lineTo(572, 720).stroke(border);
      doc.fontSize(8).font('Helvetica').fillColor(textGray);
      doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 730, { lineBreak: false });
      doc.text(`Generated ${new Date().toLocaleDateString()}`, 450, 730, { width: 122, align: 'right', lineBreak: false });

      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('TERMS & DECLARATION', 40, 40);
      doc.moveTo(40, 56).lineTo(572, 56).strokeColor(darkBlue).lineWidth(2).stroke();
      doc.lineWidth(1);

      doc.fontSize(9).font('Helvetica').fillColor(textDark);
      doc.list([
        'This Proforma Invoice is issued solely to facilitate the buyer\'s import formalities, application for letter of credit, or advance payment arrangement, and does not constitute a tax invoice or a demand for payment.',
        'Prices quoted are valid for the period stated above and are subject to change in the event of fluctuation in raw material costs, freight rates, or currency exchange rates.',
        'Goods will be shipped only after receipt of payment / confirmed Letter of Credit as per the payment terms specified above.',
        'Delivery timelines are estimates and may vary depending on production schedules, customs clearance, and carrier availability.',
        'All disputes are subject to the jurisdiction of the courts at Lahore, Pakistan.'
      ], 50, 70, { lineGap: 6, bulletRadius: 2 });

      doc.moveDown(2);
      const piClauses = settings.documentTemplates?.proformaInvoice?.clauses || [];
      if (piClauses.length > 0) {
        let nextY = doc.y;
        piClauses.forEach((clause, index) => {
          nextY = drawGenericClause(index + 1, clause.title, replaceVars(clause.text), nextY + 10, primaryColor, textGray);
        });
        doc.y = nextY;
      } else {
        const piDec = settings.documentTemplates?.proformaInvoice?.declaration || 'We hereby certify that this Proforma Invoice is true and correct, and that the goods described above will be exported in accordance with the terms stated herein.';
        doc.font('Helvetica-Oblique').fillColor(textGray).text(piDec, 40, doc.y, { width: 532, lineGap: 2 });
      }

      doc.moveDown(2);
      const sigY = doc.y;
      doc.rect(40, sigY, 532, 100).stroke(border);
      doc.moveTo(306, sigY).lineTo(306, sigY + 100).stroke(border);

      doc.fontSize(8).font('Helvetica').text('Buyer\'s Acceptance & Signature', 45, sigY + 5);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(darkBlue).text('Authorized Signatory â€” ExportEase Pvt. Ltd.', 311, sigY + 25, { width: 256, align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor(textDark);
      doc.text('Name: ______________________', 311, sigY + 45, { width: 256, align: 'right' });
      doc.text('Designation: ________________', 311, sigY + 65, { width: 256, align: 'right' });
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(textGray).text('Company Seal / Stamp', 311, sigY + 85, { width: 256, align: 'right' });

      // Draw footer on second page
      doc.moveTo(40, 720).lineTo(572, 720).stroke(border);
      doc.fontSize(8).font('Helvetica').fillColor(textGray);
      doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 730, { lineBreak: false });
      doc.text(`Generated ${new Date().toLocaleDateString()}`, 450, 730, { width: 122, align: 'right', lineBreak: false });
    } else {
      // Commercial Invoice Default (using requested template)
      const darkBlue = theme.primaryColor || '#1A2942';
      const textDark = '#0A1628';
      const textGray = '#475569';
      const border = '#CBD5E1';
      const layoutPattern = theme.layoutPattern || 'modern';

      const amount = (parseFloat(quantity || 1) * parseFloat(unitPrice || 0)).toFixed(2);

      doc.options.bufferPages = true;

      if (layoutPattern === 'classic') {
        doc.fontSize(22).font('Helvetica-Bold').fillColor(darkBlue).text('COMMERCIAL INVOICE', 0, 50, { align: 'center' });
        doc.moveTo(200, 75).lineTo(412, 75).strokeColor(darkBlue).lineWidth(2).stroke();
        doc.lineWidth(1);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(textDark).text('EXPORTEASE', 0, 85, { align: 'center' });
        doc.fontSize(9).font('Helvetica').fillColor(textGray).text('Plot 14, Sector A, Industrial Trade Zone, Lahore, Pakistan', 0, 100, { align: 'center' });

        let y = 140;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text('Invoice No: ', 40, y, { continued: true }).fillColor(textDark).text(`CI-2026-${uniqueSuffix.toString().slice(-4)}`);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text('Date: ', 400, y, { continued: true }).fillColor(textDark).text(new Date().toLocaleDateString());

        y += 30;
        doc.moveTo(40, y).lineTo(572, y).strokeColor(border).stroke();
        y += 15;
        
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('BUYER DETAILS', 40, y);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('PORT DETAILS', 300, y);
        y += 20;
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(`Name: ${buyerName || 'N/A'}`, 40, y);
        doc.text(`Loading: ${portOfLoading || 'N/A'}`, 300, y);
        y += 15;
        doc.text(`Address: ${(buyerAddress || 'N/A').replace(/\n/g, ', ')}`, 40, y, { width: 200 });
        doc.text(`Discharge: ${portOfDischarge || 'N/A'}`, 300, y);

        y += 50;
        doc.moveTo(40, y).lineTo(572, y).strokeColor(border).stroke();
        y += 15;

        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('GOODS & CHARGES', 40, y);
        y += 20;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray);
        doc.text('Description', 40, y, { width: 220 });
        doc.text('HS Code', 260, y);
        doc.text('Qty', 330, y);
        doc.text('Price', 400, y);
        doc.text('Amount', 490, y, { width: 80, align: 'right' });
        y += 15;
        doc.moveTo(40, y).lineTo(572, y).strokeColor(border).stroke();
        y += 10;
        
        doc.fontSize(10).font('Helvetica').fillColor(textDark);
        doc.text(description || 'N/A', 40, y, { width: 220 });
        doc.text(hsCode || 'N/A', 260, y);
        doc.text(quantity || '1', 330, y);
        doc.text(Number(parseFloat(unitPrice || 0).toFixed(2)).toLocaleString('en-US'), 400, y);
        doc.text(Number(amount).toLocaleString('en-US'), 490, y, { width: 80, align: 'right' });
        y += 30;
        doc.moveTo(330, y).lineTo(572, y).strokeColor(border).stroke();
        y += 10;
        doc.font('Helvetica-Bold').text('Total Amount (PKR):', 330, y);
        doc.text(Number(amount).toLocaleString('en-US'), 490, y, { width: 80, align: 'right' });

        y += 50;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkBlue).text('PAYMENT TERMS', 40, y);
        y += 15;
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(paymentTerms || 'N/A', 40, y);

        y = renderCustomFields(doc, y + 30);
        
        y += 30;
        const ciClauses = settings.documentTemplates?.commercialInvoice?.clauses || [];
        if (ciClauses.length > 0) {
          let nextY = y;
          ciClauses.forEach((clause, index) => {
            nextY = drawGenericClause(index + 1, clause.title, replaceVars(clause.text), nextY + 10, primaryColor, textGray);
          });
          y = nextY;
        } else {
          const ciDec = settings.documentTemplates?.proformaInvoice?.declaration || 'We hereby certify that this Commercial Invoice is true and correct.';
          doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text(ciDec, 40, y, { width: 532, align: 'center' });
        }

        y += 50;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text('Authorized Signature', 400, y, { align: 'center', width: 150 });
        doc.moveTo(400, y - 5).lineTo(550, y - 5).strokeColor(textDark).stroke();

        doc.fontSize(8).font('Helvetica').fillColor(textGray).text('ExportEase Pvt. Ltd.', 0, 730, { align: 'center' });
      } else if (layoutPattern === 'minimal') {
        let y = 50;
        doc.fontSize(28).font('Helvetica-Bold').fillColor(textDark).text('INVOICE', 40, y);
        doc.fontSize(10).font('Helvetica').fillColor(textGray).text(`CI-2026-${uniqueSuffix.toString().slice(-4)} | ${new Date().toLocaleDateString()}`, 40, y + 35);
        
        doc.fontSize(14).font('Helvetica-Bold').fillColor(darkBlue).text('EXPORTEASE', 400, y, { align: 'right', width: 172 });
        doc.fontSize(9).font('Helvetica').fillColor(textGray).text('trade@exportease.com', 400, y + 20, { align: 'right', width: 172 });

        y += 80;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text('BILLED TO', 40, y);
        doc.fontSize(11).font('Helvetica').fillColor(textDark).text(buyerName || 'N/A', 40, y + 15);
        doc.fontSize(9).fillColor(textGray).text((buyerAddress || 'N/A').replace(/\n/g, ', '), 40, y + 30, { width: 200 });

        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text('SHIPPING', 300, y);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(`From: ${portOfLoading || 'N/A'}`, 300, y + 15);
        doc.text(`To: ${portOfDischarge || 'N/A'}`, 300, y + 30);

        y += 80;
        doc.moveTo(40, y).lineTo(572, y).strokeColor(lightGray).lineWidth(1).stroke();
        y += 20;

        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray);
        doc.text('DESCRIPTION', 40, y);
        doc.text('AMOUNT', 490, y, { width: 80, align: 'right' });
        
        y += 20;
        doc.fontSize(11).font('Helvetica').fillColor(textDark).text(description || 'N/A', 40, y);
        doc.text(Number(amount).toLocaleString('en-US'), 490, y, { width: 80, align: 'right' });

        y += 20;
        doc.fontSize(9).fillColor(textGray).text(`Qty: ${quantity || '1'} x Rs. ${unitPrice || '0'} (HS: ${hsCode || 'N/A'})`, 40, y);

        y += 40;
        doc.moveTo(350, y).lineTo(572, y).strokeColor(lightGray).stroke();
        y += 15;
        doc.fontSize(12).font('Helvetica-Bold').fillColor(darkBlue).text('TOTAL DUE', 350, y);
        doc.text(`PKR ${Number(amount).toLocaleString('en-US')}`, 450, y, { width: 122, align: 'right' });

        y += 60;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text('PAYMENT TERMS', 40, y);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(paymentTerms || 'N/A', 40, y + 15);

        y = renderCustomFields(doc, y + 40);

        y += 50;
        doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text('Thank you for your business.', 40, y);
      } else {
        // Modern logic (current)
        doc.fillColor(darkBlue).fontSize(22).font('Helvetica-Bold').text('EXPORTEASE', 40, 50);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text('GLOBAL TRADE & EXPORT SOLUTIONS', 40, 75);
        doc.fontSize(9).font('Helvetica').fillColor(textGray).text('Plot 14, Sector A, Industrial Trade Zone, Lahore, Punjab, Pakistan\nPhone: +92 300 1234567   |   Email: trade@exportease.com   |   www.exportease.com', 40, 88, { lineGap: 2 });

        doc.fontSize(16).font('Helvetica-Bold').fillColor(darkBlue).text('COMMERCIAL INVOICE', 350, 50, { width: 220, align: 'right' });
        doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text('Tax / Payment Document', 350, 70, { width: 220, align: 'right' });

        // Meta Info Bar
        let y = 130;
        doc.rect(40, y, 532, 35).fill('#F1F5F9');
        doc.moveTo(306, y).lineTo(306, y + 35).strokeColor('white').lineWidth(2).stroke();
        doc.lineWidth(1);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('INVOICE NO.', 45, y + 6);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text(`CI-2026-${uniqueSuffix.toString().slice(-4)}`, 45, y + 18);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('DATE OF ISSUE', 311, y + 6);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(textDark).text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), 311, y + 18);

        // Helper function for sections
        const drawSectionTitle = (title, yPos) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(darkBlue).text(title, 40, yPos);
        };

        // BUYER / CLIENT DETAILS
        y += 60;
        drawSectionTitle('BUYER / CLIENT DETAILS', y);
        y += 15;
        doc.rect(40, y, 532, 45).strokeColor(border).stroke();
        doc.moveTo(306, y).lineTo(306, y + 45).strokeColor(border).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('BUYER / CLIENT NAME', 45, y + 6);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(buyerName || 'N/A', 45, y + 20);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('CLIENT ADDRESS', 311, y + 6);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text((buyerAddress || 'N/A').replace(/\n/g, ', '), 311, y + 20, { width: 250, height: 20, ellipsis: true });

        // PORT DETAILS
        y += 65;
        drawSectionTitle('PORT DETAILS', y);
        y += 15;
        doc.rect(40, y, 532, 40).strokeColor(border).stroke();
        doc.moveTo(306, y).lineTo(306, y + 40).strokeColor(border).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PORT OF LOADING', 45, y + 6);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(portOfLoading || 'N/A', 45, y + 20);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PORT OF DISCHARGE', 311, y + 6);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(portOfDischarge || 'N/A', 311, y + 20);

        // GOODS DETAILS
        y += 60;
        drawSectionTitle('GOODS DETAILS', y);
        y += 15;
        doc.rect(40, y, 532, 20).fillColor(darkBlue).fill();

        doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
        doc.text('Product Description', 45, y + 6, { width: 205, align: 'center' });
        doc.text('HS Code', 250, y + 6, { width: 80, align: 'center' });
        doc.text('Quantity', 330, y + 6, { width: 70, align: 'center' });
        doc.text('Unit Price (PKR)', 400, y + 6, { width: 85, align: 'center' });
        doc.text('Amount (PKR)', 485, y + 6, { width: 85, align: 'center' });

        // Draw grid lines for table
        const tH = 25; // row height
        doc.rect(40, y + 20, 532, tH).strokeColor(border).stroke();
        doc.rect(40, y + 20 + tH, 532, tH).strokeColor(border).stroke();

        doc.lineWidth(1);
        const xs = [250, 330, 400, 485];
        // Header dividers
        xs.forEach(xPos => {
          doc.moveTo(xPos, y).lineTo(xPos, y + 20).strokeColor('white').stroke();
          doc.moveTo(xPos, y + 20).lineTo(xPos, y + 20 + tH).strokeColor(border).stroke();
        });

        // Total row verticals: 400, 485
        doc.moveTo(400, y + 20 + tH).lineTo(400, y + 20 + tH * 2).strokeColor(border).stroke();
        doc.moveTo(485, y + 20 + tH).lineTo(485, y + 20 + tH * 2).strokeColor(border).stroke();

        // Data
        doc.fillColor(textDark).fontSize(10).font('Helvetica');
        doc.text(description || 'N/A', 45, y + 26, { width: 200, align: 'left' });
        doc.text(hsCode || 'N/A', 250, y + 26, { width: 80, align: 'center' });
        doc.text(quantity || '1', 330, y + 26, { width: 70, align: 'center' });
        doc.text(Number(parseFloat(unitPrice || 0).toFixed(2)).toLocaleString('en-US'), 400, y + 26, { width: 85, align: 'center' });
        doc.text(Number(amount).toLocaleString('en-US'), 485, y + 26, { width: 80, align: 'right' });

        // Total
        doc.font('Helvetica-Bold').text('Total Amount', 40, y + 20 + tH + 6, { width: 350, align: 'right' });
        doc.text(Number(amount).toLocaleString('en-US') + ' PKR', 485, y + 20 + tH + 6, { width: 80, align: 'right' });

        // PAYMENT TERMS
        y += 90;
        drawSectionTitle('PAYMENT TERMS', y);
        y += 15;
        doc.rect(40, y, 532, 40).strokeColor(border).stroke();
        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text('PAYMENT TERMS', 45, y + 6);
        doc.fontSize(10).font('Helvetica').fillColor(textDark).text(paymentTerms || 'N/A', 45, y + 20);

        // Declaration
        y = renderCustomFields(doc, y + 45);
        y += 20;
        const ciClauses = settings.documentTemplates?.commercialInvoice?.clauses || [];
        if (ciClauses.length > 0) {
          let nextY = y;
          ciClauses.forEach((clause, index) => {
            nextY = drawGenericClause(index + 1, clause.title, replaceVars(clause.text), nextY + 10, primaryColor, textGray);
          });
          y = nextY;
        } else {
          const ciDec = settings.documentTemplates?.proformaInvoice?.declaration || 'We hereby certify that this Commercial Invoice is true and correct, and that the goods described above have been exported\nin accordance with the terms stated herein.';
          doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text(ciDec, 40, y, { lineGap: 2 });
        }

        // Signatures
        y += 40;
        doc.fontSize(9).font('Helvetica').fillColor(textDark).text("Buyer's Acknowledgement", 40, y);
        doc.text('Name: ___________________________', 40, y + 20);
        doc.text('Designation: _____________________', 40, y + 35);

        doc.fontSize(9).font('Helvetica').text('Authorized Signatory — ExportEase Pvt. Ltd.', 320, y);
        doc.fontSize(9).font('Helvetica-Oblique').fillColor(textGray).text('Company Seal / Stamp', 320, y + 15);

        // Footer
        doc.moveTo(40, 720).lineTo(572, 720).strokeColor(border).lineWidth(1).stroke();
        doc.fontSize(8).font('Helvetica').fillColor(textGray);
        doc.text('ExportEase Pvt. Ltd.   |   www.exportease.com   |   trade@exportease.com', 40, 730, { align: 'center' });
      }
    }

    doc.end();

    writeStream.on('finish', async () => {
      try {
        const stats = fs.statSync(filePath);
        const sizeInKb = (stats.size / 1024).toFixed(1);

        const fileData = fs.readFileSync(filePath);
        await prisma.uploadedFile.create({
          data: { filename, data: fileData, mimetype: 'application/pdf' }
        });

        const newDoc = await prisma.document.create({
          data: {
            userId: req.user.id,
            title: `${type} for ${buyerName || 'Client'}`,
            type: type || 'Generated',
            status: 'Generated',
            fileUrl: `/uploads/${filename}`,
            size: `${sizeInKb} KB`
          }
        });
        res.json(newDoc);
      } catch (dbError) {
        res.status(500).json({ error: dbError.message });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileData = fs.readFileSync(file.path);
    await prisma.uploadedFile.create({
      data: { filename: file.filename, data: fileData, mimetype: file.mimetype }
    });

    const newDoc = await prisma.document.create({
      data: {
        userId: req.user.id,
        title: file.originalname,
        type: 'Uploaded File',
        status: 'Uploaded',
        fileUrl: `/uploads/${file.filename}`,
        size: `${(file.size / 1024).toFixed(1)} KB`
      }
    });

    res.json(newDoc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------
// Admin Routes
// -----------------------------------------
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/requests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await prisma.exportRequest.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (error) {
    console.error("Document generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await prisma.document.findUnique({
      where: { id }
    });

    if (!doc || doc.userId !== req.user.id) {
      return res.status(404).json({ error: 'Document not found or unauthorized' });
    }

    await prisma.document.delete({
      where: { id }
    });

    if (doc.fileUrl) {
      const filePath = path.join(process.cwd(), doc.fileUrl);
      import('fs').then(fs => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: error.message });
  }
});


// -----------------------------------------
// Registration Routes
// -----------------------------------------
app.get('/api/registrations', authMiddleware, async (req, res) => {
  try {
    const regs = await prisma.registrationProgress.findMany({
      where: { userId: req.user.id }
    });
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/registrations', authMiddleware, async (req, res) => {
  try {
    const { type, steps, status } = req.body;

    const reg = await prisma.registrationProgress.upsert({
      where: {
        userId_type: {
          userId: req.user.id,
          type: type
        }
      },
      update: {
        steps,
        status
      },
      create: {
        userId: req.user.id,
        type,
        steps,
        status
      }
    });
    res.json(reg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/registrations/upload', authMiddleware, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error("Multer Error:", err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { type, stepId } = req.body;
      console.log("Upload payload:", { type, stepId, file: req.file });

      if (!req.file) return res.status(400).json({ error: 'No file provided' });

      const fileUrl = `/uploads/${req.file.filename}`;
      const fileData = fs.readFileSync(req.file.path);
      await prisma.uploadedFile.create({
        data: { filename: req.file.filename, data: fileData, mimetype: req.file.mimetype }
      });

      let reg = await prisma.registrationProgress.findUnique({
        where: { userId_type: { userId: req.user.id, type: type } }
      });

      let steps = reg?.steps ? (typeof reg.steps === 'string' ? JSON.parse(reg.steps) : reg.steps) : {};
      steps[stepId] = { completed: true, fileUrl: fileUrl };

      reg = await prisma.registrationProgress.upsert({
        where: { userId_type: { userId: req.user.id, type: type } },
        update: { steps, status: "In Progress" },
        create: { userId: req.user.id, type, steps, status: "In Progress" }
      });

      res.json(reg);
    } catch (error) {
      console.error("DB/Server Error during upload:", error);
      res.status(500).json({ error: error.message });
    }
  });
});




const getEstimatorSettings = () => {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'settings.json'), 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      insuranceRate: 0.015,
      baseDocCost: 25000,
      foodDocCostExtra: 12000,
      medicalDocCostExtra: 18000,
      defaultTariff: 0.06
    };
  }
};

const calculateExportCosts = (product, qty, destination, shipping) => {
  const destKey = (destination || '').toLowerCase();
  const prodKey = (product || '').toLowerCase();

  const freightRates = {
    sea: { uae: 45, saudi: 50, uk: 70, germany: 75, usa: 110, china: 35 },
    air: { uae: 500, saudi: 550, uk: 850, germany: 900, usa: 1200, china: 600 }
  };

  const productValues = {
    rice: 350, textile: 1500, spices: 800,
    leather: 3500, sports: 2500, surgical: 4500,
    electronics: 5000, furniture: 800, machinery: 3000, cosmetics: 2000, software: 0, plastic: 400
  };

  const tariffs = {
    uae: 0.05, saudi: 0.05, uk: 0.08, germany: 0.08, usa: 0.06, china: 0.04
  };

  let exactDest = Object.keys(tariffs).find(k => destKey.includes(k));

  const ratePerKg = exactDest ? freightRates[shipping || 'sea'][exactDest] : (shipping === 'air' ? 750 : 85);
  const valuePerKg = Object.keys(productValues).find(k => prodKey.includes(k)) ? productValues[Object.keys(productValues).find(k => prodKey.includes(k))] : 1000;

  const settings = getEstimatorSettings();
  const tariffRate = exactDest ? tariffs[exactDest] : settings.defaultTariff;

  const freightCost = ratePerKg * (qty || 1);
  const cargoValue = valuePerKg * (qty || 1);

  const insuranceCost = cargoValue * settings.insuranceRate;
  const cifValue = cargoValue + freightCost + insuranceCost;
  const customsCost = cifValue * tariffRate;

  let docCost = settings.baseDocCost;
  if (prodKey.includes('rice') || prodKey.includes('spice') || prodKey.includes('food') || prodKey.includes('fruit')) docCost += settings.foodDocCostExtra;
  if (prodKey.includes('surgical') || prodKey.includes('medical') || prodKey.includes('health')) docCost += settings.medicalDocCostExtra;

  const costs = {
    freight: Math.round(freightCost),
    customs: Math.round(customsCost),
    documentation: Math.round(docCost),
    insurance: Math.round(insuranceCost)
  };

  const total = costs.freight + costs.customs + costs.documentation + costs.insurance;

  const tips = [];
  if (shipping === 'air' && qty > 500) {
    tips.push(`Switching to sea freight could save you up to PKR ${Math.round((750 - 85) * qty).toLocaleString()} on this volume.`);
  }
  if (docCost > settings.baseDocCost) {
    tips.push("Your product requires special clearance certificates. Start compliance checks 48h early.");
  }
  if (tariffRate > 0.05) {
    tips.push(`Tariffs for ${destination || 'this region'} are relatively high. Check for preferential trade agreements.`);
  }

  return { costs, total, cargoValue, tips };
};

app.post('/api/estimator/calculate', authMiddleware, (req, res) => {
  try {
    const { product, qty, destination, shipping } = req.body;
    const result = calculateExportCosts(product, qty, destination, shipping);

    // Simulate slight network delay for realism
    setTimeout(() => {
      res.json(result);
    }, 800);
  } catch (err) {
    console.error("Estimator error", err);
    res.status(500).json({ error: "Calculation failed" });
  }
});

// --- EXPORT REQUESTS (MANAGEMENT) ---
app.post('/api/exports', authMiddleware, async (req, res) => {
  try {
    const { product, qty, destination, shipping, totalCost } = req.body;
    const newRequest = await prisma.exportRequest.create({
      data: {
        userId: req.user.id,
        type: "Shipment",
        status: "Pending",
        product,
        qty: parseInt(qty) || 0,
        destination,
        shipping,
        totalCost: parseFloat(totalCost) || 0
      }
    });
    res.json(newRequest);
  } catch (err) {
    console.error("Failed to create export request", err);
    res.status(500).json({ error: "Failed to create export request" });
  }
});

app.get('/api/exports', authMiddleware, async (req, res) => {
  try {
    const exports = await prisma.exportRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(exports);
  } catch (err) {
    console.error("Failed to fetch all exports", err);
    res.status(500).json({ error: "Failed to fetch exports" });
  }
});

app.get('/api/exports/active', authMiddleware, async (req, res) => {
  try {
    const activeRequest = await prisma.exportRequest.findFirst({
      where: {
        userId: req.user.id,
        status: { in: ["Active", "Pending"] }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(activeRequest || null);
  } catch (err) {
    console.error("Failed to fetch active export", err);
    res.status(500).json({ error: "Failed to fetch active export" });
  }
});

// Admin endpoints
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { documents: true } }
      },
      orderBy: { joinedAt: 'desc' }
    });
    res.json(users);
  } catch (err) {
    console.error("Failed to fetch admin users", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get('/api/admin/exports', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const requests = await prisma.exportRequest.findMany({
      include: { user: { select: { name: true, company: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  } catch (err) {
    console.error("Failed to fetch admin exports", err);
    res.status(500).json({ error: "Failed to fetch exports" });
  }
});

app.put('/api/admin/exports/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    const { status } = req.body;
    const { id } = req.params;

    const updated = await prisma.exportRequest.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (err) {
    console.error("Failed to update status", err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// --- PROGRESS / GUIDANCE ---
app.get('/api/progress/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    let progress = await prisma.registrationProgress.findUnique({
      where: { userId_type: { userId: req.user.id, type } }
    });

    if (!progress) {
      progress = await prisma.registrationProgress.create({
        data: {
          userId: req.user.id,
          type,
          steps: {}
        }
      });
    }
    res.json(progress);
  } catch (err) {
    console.error("Progress fetch error", err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

app.post('/api/progress/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { steps } = req.body;

    const progress = await prisma.registrationProgress.upsert({
      where: { userId_type: { userId: req.user.id, type } },
      update: { steps, updatedAt: new Date() },
      create: { userId: req.user.id, type, steps }
    });

    res.json(progress);
  } catch (err) {
    console.error("Progress update error", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [activeExports, documentsReady, allExports, recentDocs, progress] = await Promise.all([
      prisma.exportRequest.count({ where: { userId, status: { in: ["Active", "Pending"] } } }),
      prisma.document.count({ where: { userId, status: { in: ["Ready", "Completed", "Done", "Generated", "Uploaded"] } } }),
      prisma.exportRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
      prisma.registrationProgress.findUnique({ where: { userId_type: { userId, type: 'guidance' } } })
    ]);

    const exportValue = allExports.reduce((sum, exp) => sum + (exp.totalCost || 0), 0);
    const activeExportDetails = allExports.find(exp => exp.status === "Active" || exp.status === "Pending") || null;

    let activeExportCosts = null;
    if (activeExportDetails) {
      const calcResult = calculateExportCosts(activeExportDetails.product, activeExportDetails.qty, activeExportDetails.destination, activeExportDetails.shipping);
      activeExportCosts = calcResult.costs;
      // Overwrite the database totalCost if they differ, or just use the calculated one
      activeExportDetails.totalCost = calcResult.total;
    }

    const recentCalculations = allExports.slice(0, 3).map(exp => {
      const calcResult = calculateExportCosts(exp.product, exp.qty, exp.destination, exp.shipping);
      return {
        id: exp.id,
        product: exp.product,
        destination: exp.destination,
        date: exp.createdAt,
        total: calcResult.total
      };
    });

    const uniqueCountries = [...new Set(allExports.map(exp => exp.destination).filter(Boolean))];
    const countriesReached = uniqueCountries.length;
    const pendingDocs = await prisma.document.count({ where: { userId, status: "Pending" } });
    const draftDocs = await prisma.document.count({ where: { userId, status: "Draft" } });
    const totalEstimates = allExports.length;

    // Calculate last 30 days activity with product details
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        count: 0,
        products: [],
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    allExports.forEach(exp => {
      const expDate = new Date(exp.createdAt);
      const diffTime = Math.abs(today - expDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        const dayData = last30Days[29 - diffDays];
        dayData.count += 1;
        if (exp.product) {
          if (!dayData.products.includes(exp.product)) {
            dayData.products.push(exp.product);
          }
        }
      }
    });

    // Calculate dynamic chart data (last 12 months estimated values)
    const chartData = new Array(12).fill(0);
    const now = new Date();
    allExports.forEach(exp => {
      let cost = exp.totalCost || 0;
      if (!cost) {
        cost = calculateExportCosts(exp.product, exp.qty, exp.destination, exp.shipping).total;
      }
      const expDate = new Date(exp.createdAt);
      const monthsDiff = (now.getFullYear() - expDate.getFullYear()) * 12 + (now.getMonth() - expDate.getMonth());
      if (monthsDiff >= 0 && monthsDiff < 12) {
        const index = 11 - monthsDiff;
        chartData[index] += cost;
      }
    });
    // Ensure the chart isn't empty flatlines if no data
    if (chartData.every(v => v === 0)) {
      chartData.fill(10); // visual dummy baseline
    }

    const latestEstimate = allExports[0] || null;
    let latestEstimateCosts = null;
    if (latestEstimate) {
      latestEstimateCosts = calculateExportCosts(latestEstimate.product, latestEstimate.qty, latestEstimate.destination, latestEstimate.shipping).costs;
    }

    res.json({
      activeExports,
      documentsReady,
      pendingDocs,
      draftDocs,
      totalEstimates,
      exportValue: `PKR ${exportValue.toLocaleString()}`,
      countriesReached,
      uniqueCountriesPreview: uniqueCountries.slice(0, 3).join(', '),
      recentDocs,
      progress: progress ? progress.steps : {},
      activeExportDetails,
      activeExportCosts,
      recentCalculations,
      chartData,
      latestEstimateCosts,
      last30DaysActivity: last30Days
    });
  } catch (err) {
    console.error("Dashboard stats error", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// --- INSIGHTS ---
app.get('/api/insights/countries', authMiddleware, async (req, res) => {
  try {
    const rcResponse = await fetch("https://api.sampleapis.com/countries/countries");
    const rcData = await rcResponse.json();

    const wbResponse = await fetch("https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=400&mrnev=1");
    const wbData = await wbResponse.json();

    const gdpData = wbData[1] || [];
    const gdpMap = {};
    gdpData.forEach(item => {
      if (item.country && item.country.id) {
        gdpMap[item.country.id] = item.value;
      }
    });

    const mapped = rcData.filter(c => c.name && c.abbreviation).map(c => {
      const countryCode = c.abbreviation;
      const gdpValue = gdpMap[countryCode];

      const seed = c.name.length + ((c.population || 0) % 100);
      const colorCode = seed % 4 === 0 ? "#10B981" : seed % 4 === 1 ? "#1E6FD9" : seed % 4 === 2 ? "#8B5CF6" : "#F59E0B";

      let formattedValue = "N/A";
      if (gdpValue) {
        if (gdpValue >= 1e12) formattedValue = `$${(gdpValue / 1e12).toFixed(2)} Trillion`;
        else if (gdpValue >= 1e9) formattedValue = `$${(gdpValue / 1e9).toFixed(2)} Billion`;
        else formattedValue = `$${(gdpValue / 1e6).toFixed(2)} Million`;
      } else {
        formattedValue = `PKR ${((seed % 50) / 10 + 1).toFixed(1)}M`;
      }

      const catSeed = seed % 3;
      const category = catSeed === 0 ? "Textiles, Rice" : catSeed === 1 ? "Surgical, Leather" : "General, Sports Goods";

      const flagUrl = countryCode && countryCode.length === 2
        ? `https://flagcdn.com/${countryCode.toLowerCase()}.svg`
        : "ðŸŒ";

      return {
        flag: flagUrl,
        name: c.name,
        demand: 50 + (seed % 50),
        growth: `+${(seed % 25) + 1}%`,
        category: category,
        value: formattedValue,
        color: colorCode,
        trend: Array.from({ length: 8 }, (_, i) => 40 + ((seed * (i + 1)) % 50))
      };
    });

    mapped.sort((a, b) => b.demand - a.demand);
    res.json(mapped);

  } catch (error) {
    console.error("Failed to fetch country insights", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/progress/:type', authMiddleware, async (req, res) => {
  try {
    const { type } = req.params;
    const { steps } = req.body;

    const progress = await prisma.registrationProgress.upsert({
      where: { userId_type: { userId: req.user.id, type } },
      update: { steps, updatedAt: new Date() },
      create: { userId: req.user.id, type, steps }
    });

    res.json(progress);
  } catch (err) {
    console.error("Progress update error", err);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// --- DASHBOARD ---
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [activeExports, documentsReady, allExports, recentDocs, progress] = await Promise.all([
      prisma.exportRequest.count({ where: { userId, status: { in: ["Active", "Pending"] } } }),
      prisma.document.count({ where: { userId, status: { in: ["Ready", "Completed", "Done", "Generated", "Uploaded"] } } }),
      prisma.exportRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
      prisma.registrationProgress.findUnique({ where: { userId_type: { userId, type: 'guidance' } } })
    ]);

    const exportValue = allExports.reduce((sum, exp) => sum + (exp.totalCost || 0), 0);
    const activeExportDetails = allExports.find(exp => exp.status === "Active" || exp.status === "Pending") || null;

    let activeExportCosts = null;
    if (activeExportDetails) {
      const calcResult = calculateExportCosts(activeExportDetails.product, activeExportDetails.qty, activeExportDetails.destination, activeExportDetails.shipping);
      activeExportCosts = calcResult.costs;
      // Overwrite the database totalCost if they differ, or just use the calculated one
      activeExportDetails.totalCost = calcResult.total;
    }

    const recentCalculations = allExports.slice(0, 3).map(exp => {
      const calcResult = calculateExportCosts(exp.product, exp.qty, exp.destination, exp.shipping);
      return {
        id: exp.id,
        product: exp.product,
        destination: exp.destination,
        date: exp.createdAt,
        total: calcResult.total
      };
    });

    const uniqueCountries = [...new Set(allExports.map(exp => exp.destination).filter(Boolean))];
    const countriesReached = uniqueCountries.length;
    const pendingDocs = await prisma.document.count({ where: { userId, status: "Pending" } });
    const draftDocs = await prisma.document.count({ where: { userId, status: "Draft" } });
    const totalEstimates = allExports.length;

    // Calculate last 30 days activity with product details
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        count: 0,
        products: [],
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    allExports.forEach(exp => {
      const expDate = new Date(exp.createdAt);
      const diffTime = Math.abs(today - expDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 30) {
        const dayData = last30Days[29 - diffDays];
        dayData.count += 1;
        if (exp.product) {
          if (!dayData.products.includes(exp.product)) {
            dayData.products.push(exp.product);
          }
        }
      }
    });

    // Calculate dynamic chart data (last 12 months estimated values)
    const chartData = new Array(12).fill(0);
    const now = new Date();
    allExports.forEach(exp => {
      let cost = exp.totalCost || 0;
      if (!cost) {
        cost = calculateExportCosts(exp.product, exp.qty, exp.destination, exp.shipping).total;
      }
      const expDate = new Date(exp.createdAt);
      const monthsDiff = (now.getFullYear() - expDate.getFullYear()) * 12 + (now.getMonth() - expDate.getMonth());
      if (monthsDiff >= 0 && monthsDiff < 12) {
        const index = 11 - monthsDiff;
        chartData[index] += cost;
      }
    });
    // Ensure the chart isn't empty flatlines if no data
    if (chartData.every(v => v === 0)) {
      chartData.fill(10); // visual dummy baseline
    }

    const latestEstimate = allExports[0] || null;
    let latestEstimateCosts = null;
    if (latestEstimate) {
      latestEstimateCosts = calculateExportCosts(latestEstimate.product, latestEstimate.qty, latestEstimate.destination, latestEstimate.shipping).costs;
    }

    res.json({
      activeExports,
      documentsReady,
      pendingDocs,
      draftDocs,
      totalEstimates,
      exportValue: `PKR ${exportValue.toLocaleString()}`,
      countriesReached,
      uniqueCountriesPreview: uniqueCountries.slice(0, 3).join(', '),
      recentDocs,
      progress: progress ? progress.steps : {},
      activeExportDetails,
      activeExportCosts,
      recentCalculations,
      chartData,
      latestEstimateCosts,
      last30DaysActivity: last30Days
    });
  } catch (err) {
    console.error("Dashboard stats error", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// -----------------------------------------
// Admin Routes
// -----------------------------------------
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const adminUsers = await prisma.user.count({ where: { role: 'admin' } });
    const docsGenerated = await prisma.document.count();
    const companiesRegistered = await prisma.user.count({ where: { company: { not: null } } });

    const allUsers = await prisma.user.findMany({ select: { joinedAt: true } });
    const allDocs = await prisma.document.findMany({ select: { createdAt: true } });

    const userGrowth = new Array(12).fill(0);
    allUsers.forEach(u => {
      if (u.joinedAt) userGrowth[new Date(u.joinedAt).getMonth()]++;
    });

    const docGen = new Array(12).fill(0);
    allDocs.forEach(d => {
      if (d.createdAt) docGen[new Date(d.createdAt).getMonth()]++;
    });

    res.json({
      totalUsers,
      adminUsers,
      docsGenerated,
      companiesRegistered,
      chartData: {
        userGrowth,
        docGen
      }
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        joinedAt: true,
        role: true,
        profilePic: true,
        _count: {
          select: { documents: true }
        },
        registrations: {
          where: { type: 'guidance' },
          select: { steps: true }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    const formattedUsers = users.map(user => {
      let phase = "Phase 1: Setup";
      if (user.registrations && user.registrations.length > 0 && user.registrations[0].steps) {
        const steps = user.registrations[0].steps;
        const done = Object.values(steps).filter(Boolean).length;
        if (done >= 20) phase = "Phase 5: Clearance";
        else if (done >= 15) phase = "Phase 4: Shipping";
        else if (done >= 10) phase = "Phase 3: Financials";
        else if (done >= 5) phase = "Phase 2: Buyers";
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || "N/A",
        role: user.role,
        profilePic: user.profilePic,
        phase,
        docs: user._count.documents,
        status: user.role === 'admin' ? 'Admin' : 'Active',
        color: user.role === 'admin' ? 'purple' : 'green',
        createdAt: user.joinedAt
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, password, company, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, company, role: role || 'user' }
    });

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, company: user.company });
  } catch (error) {
    console.error("Admin user create error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: "Invalid user ID" });

    const { name, company, role } = req.body;

    // Basic validation
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (company !== undefined) updateData.company = company;
    if (role !== undefined) {
      if (role !== 'user' && role !== 'admin') return res.status(400).json({ error: "Invalid role" });
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        role: true,
      }
    });

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Admin user update error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const settings = getEstimatorSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.get('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const settings = getEstimatorSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put('/api/admin/settings', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const newSettings = req.body;
    fs.writeFileSync(path.join(process.cwd(), 'settings.json'), JSON.stringify(newSettings, null, 2));
    res.json({ message: "Settings updated successfully", settings: newSettings });
  } catch (error) {
    console.error("Failed to update settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// --- INSIGHTS ---
app.get('/api/insights/countries', authMiddleware, async (req, res) => {
  try {
    const rcResponse = await fetch("https://api.sampleapis.com/countries/countries");
    const rcData = await rcResponse.json();

    const wbResponse = await fetch("https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=400&mrnev=1");
    const wbData = await wbResponse.json();

    const gdpData = wbData[1] || [];
    const gdpMap = {};
    gdpData.forEach(item => {
      if (item.country && item.country.id) {
        gdpMap[item.country.id] = item.value;
      }
    });

    const mapped = rcData.filter(c => c.name && c.abbreviation).map(c => {
      const countryCode = c.abbreviation;
      const gdpValue = gdpMap[countryCode];

      const seed = c.name.length + ((c.population || 0) % 100);
      const colorCode = seed % 4 === 0 ? "#10B981" : seed % 4 === 1 ? "#1E6FD9" : seed % 4 === 2 ? "#8B5CF6" : "#F59E0B";

      let formattedValue = "N/A";
      if (gdpValue) {
        if (gdpValue >= 1e12) formattedValue = `$${(gdpValue / 1e12).toFixed(2)} Trillion`;
        else if (gdpValue >= 1e9) formattedValue = `$${(gdpValue / 1e9).toFixed(2)} Billion`;
        else formattedValue = `$${(gdpValue / 1e6).toFixed(2)} Million`;
      } else {
        formattedValue = `PKR ${((seed % 50) / 10 + 1).toFixed(1)}M`;
      }

      const catSeed = seed % 3;
      const category = catSeed === 0 ? "Textiles, Rice" : catSeed === 1 ? "Surgical, Leather" : "General, Sports Goods";

      const flagUrl = countryCode && countryCode.length === 2
        ? `https://flagcdn.com/${countryCode.toLowerCase()}.svg`
        : "🌎";

      return {
        flag: flagUrl,
        name: c.name,
        demand: 50 + (seed % 50),
        growth: `+${(seed % 25) + 1}%`,
        category: category,
        value: formattedValue,
        color: colorCode,
        trend: Array.from({ length: 8 }, (_, i) => 40 + ((seed * (i + 1)) % 50))
      };
    });

    mapped.sort((a, b) => b.demand - a.demand);
    res.json(mapped);

  } catch (error) {
    console.error("Failed to fetch country insights", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
