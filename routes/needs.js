// routes/needs.js 
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdminOrFamily } = require('../middleware/auth');
const prisma = new PrismaClient();

// GET /api/needs - Get all needs with filters
router.get('/', async (req, res) => {
  try {
    const { category, priority, region, fulfilled = 'false', page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const where = {
      isFulfilled: fulfilled === 'true',
      ...(category && { category }),
      ...(priority && { priority }),
      ...(region && {
        family: { region }
      })
    };

    const needs = await prisma.familyNeed.findMany({
      where,
      include: {
        family: {
          select: {
            familyCode: true,
            region: true,
            verificationStatus: true,
            priorityLevel: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const total = await prisma.familyNeed.count({ where });

    res.json({
      needs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching needs:', error);
    res.status(500).json({ error: 'Failed to fetch needs' });
  }
});

// POST /api/needs - Add family need
router.post('/', authenticateToken, requireAdminOrFamily, async (req, res) => {
  try {
    const {
      familyCode,
      category,
      title,
      description,
      estimatedCost,
      priority = 'MEDIUM'
    } = req.body;

    const need = await prisma.familyNeed.create({
      data: {
        familyCode,
        category,
        title,
        description,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        priority
      },
      include: {
        family: {
          select: {
            familyCode: true,
            region: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Need added successfully',
      need
    });
  } catch (error) {
    console.error('Error adding need:', error);
    res.status(500).json({ error: 'Failed to add need' });
  }
});

// PUT /api/needs/:id/fulfill - Mark need as fulfilled
router.put('/:id/fulfill', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const need = await prisma.familyNeed.update({
      where: { id },
      data: { isFulfilled: true },
      include: {
        family: {
          select: {
            familyCode: true,
            region: true
          }
        }
      }
    });

    res.json({
      message: 'Need marked as fulfilled',
      need
    });
  } catch (error) {
    console.error('Error fulfilling need:', error);
    res.status(500).json({ error: 'Failed to fulfill need' });
  }
});

module.exports = router;