// controllers/donationController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/donations - Add external donation
const addExternalDonation = async (req, res) => {
  try {
    const { 
      familyCode,
      platform,
      externalLink,
      donorName,
      amount,
      currency = 'USD',
      donationDate,
      donorId // optional if donor is registered
    } = req.body;

    // Verify family exists
    const family = await prisma.family.findUnique({
      where: { familyCode }
    });

    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    const donation = await prisma.externalDonation.create({
      data: {
        familyCode,
        platform,
        externalLink,
        donorName,
        amount: parseFloat(amount),
        currency,
        donationDate: new Date(donationDate),
        donorId,
        isVerified: false // Admin needs to verify
      }
    });

    res.status(201).json({
      message: 'Donation added successfully',
      donation: {
        id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        platform: donation.platform
      }
    });
  } catch (error) {
    console.error('Error adding donation:', error);
    res.status(500).json({ error: 'Failed to add donation' });
  }
};

// GET /api/donations/family/:familyCode - Get family donations
const getFamilyDonations = async (req, res) => {
  try {
    const { familyCode } = req.params;
    const { verified = 'true' } = req.query;

    const donations = await prisma.externalDonation.findMany({
      where: {
        familyCode,
        ...(verified === 'true' && { isVerified: true })
      },
      select: {
        id: true,
        platform: true,
        donorName: true,
        amount: true,
        currency: true,
        donationDate: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { donationDate: 'desc' }
    });

    // Calculate total donations
    const totalAmount = donations
      .filter(d => d.isVerified)
      .reduce((sum, d) => sum + d.amount, 0);

    res.json({
      donations,
      summary: {
        total: totalAmount,
        currency: donations[0]?.currency || 'USD',
        count: donations.filter(d => d.isVerified).length,
        pending: donations.filter(d => !d.isVerified).length
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
};

// PUT /api/donations/:id/verify -> Admin verify donation
const verifyDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, isVerified } = req.body;

    const donation = await prisma.externalDonation.update({
      where: { id },
      data: { isVerified },
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
      message: `Donation ${isVerified ? 'verified' : 'rejected'} successfully`,
      donation: {
        id: donation.id,
        familyCode: donation.familyCode,
        amount: donation.amount,
        isVerified: donation.isVerified
      }
    });
  } catch (error) {
    console.error('Error verifying donation:', error);
    res.status(500).json({ error: 'Failed to verify donation' });
  }
};

// GET /api/donations/stats - Get donation statistics
const getDonationStats = async (req, res) => {
  try {
    const { region, timeframe = '30' } = req.query;
    
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(timeframe));

    const baseWhere = {
      isVerified: true,
      donationDate: { gte: dateFilter },
      ...(region && {
        family: { region }
      })
    };

    const [totalDonations, donationsByPlatform, recentDonations] = await Promise.all([
      // Total amount and count
      prisma.externalDonation.aggregate({
        where: baseWhere,
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // Group by platform
      prisma.externalDonation.groupBy({
        by: ['platform'],
        where: baseWhere,
        _sum: { amount: true },
        _count: { id: true }
      }),
      
      // Recent donations
      prisma.externalDonation.findMany({
        where: baseWhere,
        select: {
          donorName: true,
          amount: true,
          currency: true,
          platform: true,
          donationDate: true,
          family: {
            select: {
              familyCode: true,
              region: true
            }
          }
        },
        orderBy: { donationDate: 'desc' },
        take: 10
      })
    ]);

    res.json({
      summary: {
        totalAmount: totalDonations._sum.amount || 0,
        totalCount: totalDonations._count,
        timeframe: `${timeframe} days`
      },
      byPlatform: donationsByPlatform.map(p => ({
        platform: p.platform,
        amount: p._sum.amount,
        count: p._count.id
      })),
      recent: recentDonations
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch donation statistics' });
  }
};

module.exports = {
  addExternalDonation,
  getFamilyDonations,
  verifyDonation,
  getDonationStats
};