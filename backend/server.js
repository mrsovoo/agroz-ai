const express = require('express');
const cors = require('cors');
const { port } = require('./config');

const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/biznesgo/auth');
const productsRoutes = require('./routes/biznesgo/products');
const salesRoutes = require('./routes/biznesgo/sales');
const debtsRoutes = require('./routes/biznesgo/debts');
const dashboardRoutes = require('./routes/biznesgo/dashboard');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'BiznesGO B2B',
    active_sector: 'agro_vet',
    version: '1.0.0-agrovet'
  });
});

// B2B Agro-Vet API yo'nalishlari
app.use('/api/biznesgo/auth', authRoutes);
app.use('/api/biznesgo/products', authMiddleware, productsRoutes);
app.use('/api/biznesgo/sales', authMiddleware, salesRoutes);
app.use('/api/biznesgo/debts', authMiddleware, debtsRoutes);
app.use('/api/biznesgo/dashboard', authMiddleware, dashboardRoutes);

// Global xatoliklarni ushlash
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Ichki server xatoligi yuz berdi' });
});

app.listen(port, () => {
  console.log(`[BiznesGO B2B Agro-Vet] Server listening on port ${port}`);
});

