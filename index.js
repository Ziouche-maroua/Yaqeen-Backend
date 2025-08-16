require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes - Load them safely with error handling
const routesToLoad = [
  { path: '/api/auth', file: './routes/auth', name: 'Auth' },
  { path: '/api/families', file: './routes/families', name: 'Families' },
  { path: '/api/donations', file: './routes/donations', name: 'Donations' },
  { path: '/api/donors', file: './routes/donors', name: 'Donors' },
  { path: '/api/needs', file: './routes/needs', name: 'Needs' }
];

routesToLoad.forEach(route => {
  try {
    const routeHandler = require(route.file);
    app.use(route.path, routeHandler);
    console.log(`✅ ${route.name} routes loaded`);
  } catch (error) {
    console.log(`❌ ${route.name} routes error:`, error.message);
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Basic stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [families, donations, needs] = await Promise.all([
      prisma.family.count({ where: { isActive: true } }),
      prisma.externalDonation.count({ where: { isVerified: true } }),
      prisma.familyNeed.count({ where: { isFulfilled: false } })
    ]);

    const totalDonationAmount = await prisma.externalDonation.aggregate({
      where: { isVerified: true },
      _sum: { amount: true }
    });

    res.json({
      families: {
        total: families,
        verified: await prisma.family.count({ 
          where: { verificationStatus: 'VERIFIED' }
        })
      },
      donations: {
        count: donations,
        totalAmount: totalDonationAmount._sum.amount || 0
      },
      needs: {
        active: needs,
        fulfilled: await prisma.familyNeed.count({ 
          where: { isFulfilled: true }
        })
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Simple 404 handler - no wildcard
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Yaqeen API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
});

module.exports = app;