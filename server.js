/* ==========================================================================
   ZARIA FULL-STACK ARCHITECTURE - BACKEND CORE (FROM A TO Z)
   ========================================================================== */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const brevo = require('@getbrevo/brevo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Flat-Structure Security Lock
app.use((req, res, next) => {
    const blockedFiles = ['.env', 'package.json', 'server.js'];
    if (blockedFiles.some(file => req.url.includes(file))) {
        return res.status(403).json({ error: "Access Forbidden" });
    }
    next();
});

app.use(express.static(__dirname));

/* ==========================================================================
   1B. BREVO API ENGINE (replaces Nodemailer SMTP transporter)
   ========================================================================== */
// NOTE: @getbrevo/brevo v6+ rewrote the SDK. There is no more
// `new brevo.TransactionalEmailsApi()` / `new brevo.SendSmtpEmail()`.
// The client is now `new brevo.BrevoClient({ apiKey })`, and emails are sent
// via `client.transactionalEmails.sendTransacEmail({ ...plain object... })`.
const brevoClient = new brevo.BrevoClient({ apiKey: process.env.BREVO_API_KEY });

async function sendBrevoEmail(to, subject, html) {
    return brevoClient.transactionalEmails.sendTransacEmail({
        sender: { name: "ZARIA", email: "aad5db001@smtp-brevo.com" },
        to: [{ email: to }],
        subject,
        htmlContent: html
    });
}

/* ==========================================================================
   2. DATABASE SCHEMA REGISTRATION
   ========================================================================== */

// Auth Curation User Profile Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateCreated: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Concierge Contact Inquiries Schema
const InquirySchema = new mongoose.Schema({
    clientName: String,
    clientEmail: String,
    inquiryType: String,
    message: String,
    dateSubmitted: { type: Date, default: Date.now }
});
const Inquiry = mongoose.model('Inquiry', InquirySchema);

// Master Inventory Product Catalog Schema
const ProductSchema = new mongoose.Schema({
    id: Number,
    title: String,
    meta: String,
    price: Number,
    img: String
});
const Product = mongoose.model('Product', ProductSchema);

// Persistent Curation Wishlist Schema
const WishlistSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    productIds: [Number]
});
const Wishlist = mongoose.model('Wishlist', WishlistSchema);

// Production Order Transaction Ledger Schema
const OrderSchema = new mongoose.Schema({
    orderId: String,
    clientName: String,
    clientEmail: String,
    clientPhone: String,
    clientAddress: String,
    itemsSummary: String,
    items: Array,
    totalAmount: Number,
    paymentMethod: { type: String, default: 'COD' },
    deliveryStatus: { type: String, default: 'Processing' },
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

/* ==========================================================================
   3. MONGODB DATABASE CORE ENGINE & SEEDER
   ========================================================================== */
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('⚡ MongoDB Secured: ZARIA Core Online');

        // AUTO-SEEDER: Injects the 4 primary digital suites into the cloud cluster if empty
        const count = await Product.countDocuments();
        if (count === 0) {
            console.log('Injecting Master Inventory into Database...');
            await Product.insertMany([
                { id: 1, title: "The Crimson Velvet Suite", meta: "Suite 01 // Crimson", price: 240, img: "assets/zaria-box.png" },
                { id: 2, title: "The Reserve Gold Suite", meta: "Suite 02 // Gold", price: 310, img: "assets/zaria-box1.png" },
                { id: 3, title: "The Midnight Obsidian Suite", meta: "Suite 03 // Obsidian", price: 280, img: "assets/zaria-box2.png" },
                { id: 4, title: "The Alabaster Silk Suite", meta: "Suite 04 // Silk", price: 350, img: "assets/zaria-box3.png" }
            ]);
            console.log('✅ Inventory Seeded Successfully.');
        }
    })
    .catch(err => console.log('Database Connection Error:', err));

/* ==========================================================================
   4. SYSTEM CORE API ROUTING
   ========================================================================== */

// AUTH GATE: Register Profile Route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ success: false, error: "Profile trace already registered." });

        const newUser = new User({ name, email, password });
        await newUser.save();
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// AUTH GATE: Access Verification Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ success: false, error: "Invalid credential parameters verification." });

        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// GET CHANNEL: Fetch entire inventory collection portfolio for the client view
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inventory portfolio." });
    }
});

// POST CHANNEL: Transmit client concierge messaging form submissions
app.post('/api/contact', async (req, res) => {
    try {
        const newInquiry = new Inquiry(req.body);
        await newInquiry.save();
        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// POST CHANNEL: Persistent synchronization layer for user wishlist states
app.post('/api/wishlist', async (req, res) => {
    try {
        const { userId, productId, action } = req.body;
        let list = await Wishlist.findOne({ userId });

        if (action === 'get') {
            return res.json({ success: true, list: list ? list.productIds : [] });
        }

        if (!list) list = new Wishlist({ userId, productIds: [] });

        if (action === 'add') {
            if (!list.productIds.includes(productId)) list.productIds.push(productId);
        } else if (action === 'remove') {
            list.productIds = list.productIds.filter(id => id !== productId);
        }

        await list.save();
        res.json({ success: true, list: list.productIds });
    } catch (error) {
        res.status(500).json({ success: false, error: "Wishlist syncing channel error." });
    }
});

// POST CHANNEL: Permanent storage and tracking of secure transaction documents + Email Automation
app.post('/api/orders', async (req, res) => {
    try {
        const generatedOrderId = 'ZARIA-' + Date.now();

        const order = new Order({
            orderId: generatedOrderId,
            ...req.body
        });
        await order.save();

        // Build the two notification emails
        const clientEmailHtmlContent = `
            <div style="font-family:'Georgia',serif; background-color:#0b0204; color:#ffffff; padding:40px; max-width:600px; margin:0 auto; border:1px solid #c9a054;">
                <h1 style="color:#c9a054; text-align:center; font-weight:300; letter-spacing:4px;">ZARIA</h1>
                <p style="font-size:16px; line-height:1.6; color:#a38f95; text-align:center;">Your selection portfolio order has been securely logged into our vault systems.</p>
                <hr style="border-color:#2d0c17; margin:30px 0;"/>
                <h3 style="color:#c9a054; text-transform:uppercase; letter-spacing:1px;">Order Confirmation</h3>
                <p style="margin:6px 0;"><strong>Tracking Identifier:</strong> ${generatedOrderId}</p>
                <p style="margin:6px 0;"><strong>Total Valuation Settlement:</strong> $${order.totalAmount}.00 USD via COD</p>
                <p style="margin:6px 0;"><strong>Physical Destination Address:</strong> ${order.clientAddress}</p>
                <hr style="border-color:#2d0c17; margin:30px 0;"/>
                <p style="font-size:12px; text-align:center; color:#a38f95;">ZARIA Curated Portfolio Systems Terminal // Secure Transaction Dispatch</p>
            </div>
        `;

        const merchantNotificationHtmlContent = `
            <div style="font-family:monospace; background-color:#120409; color:#ffffff; padding:30px; border-left:4px solid #c9a054;">
                <h2 style="color:#c9a054; margin-top:0;">🚨 NEW LUXURY ORDER INCOMING</h2>
                <p><strong>Order Reference Key:</strong> ${generatedOrderId}</p>
                <p><strong>Parsed Target Summary:</strong></p>
                <blockquote style="background:rgba(255,255,255,0.03); padding:15px; margin:10px 0; border:1px solid rgba(255,255,255,0.08);">
                    ${order.itemsSummary}
                </blockquote>
                <p><strong>Fulfillment Actions Required:</strong> Deploy couriers inside the system application dashboard interface panel immediately.</p>
            </div>
        `;

        // Fire both emails via the Brevo API (non-blocking — order confirmation to the client
        // doesn't wait on email delivery, so a slow/failed send never blocks the response)
        sendBrevoEmail(order.clientEmail, `ZARIA Registry Secured // Order Reference ${generatedOrderId}`, clientEmailHtmlContent)
            .catch(err => console.error("Client email error:", err.message));
        sendBrevoEmail(process.env.MERCHANT_NOTIFY_EMAIL, `🚨 System Order Dispatch Alert [${generatedOrderId}]`, merchantNotificationHtmlContent)
            .catch(err => console.error("Merchant alert error:", err.message));

        res.status(201).json({ success: true, orderId: order.orderId });
    } catch (e) {
        console.error("Order Error:", e);
        res.status(500).json({ success: false, error: "Order execution failed." });
    }
});

/* ==========================================================================
   5. ADMINISTRATIVE CORE LOGISTICS API ENDPOINTS (For Flutter App)
   ========================================================================== */

app.post('/api/admin/products', async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ date: -1 });
        res.json(orders);
    } catch (e) { res.status(500).json({ error: "Access Denied" }); }
});

app.put('/api/admin/orders/status', async (req, res) => {
    try {
        const { id, status } = req.body;
        await Order.findByIdAndUpdate(id, { $set: { deliveryStatus: status } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

/* ==========================================================================
   6. ENGINE ACTIVATION
   ========================================================================== */
app.listen(PORT, () => {
    console.log(`🚀 ZARIA Server running on port ${PORT}`);
});