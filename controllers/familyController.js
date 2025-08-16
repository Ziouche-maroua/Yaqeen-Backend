// controllers/familyController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/families - Get all families (public data only)
const getAllFamilies = async (req, res) => {
  try {
    const { region, verificationStatus, priorityLevel, page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const where = {
      isActive: true,
      ...(region && { region }),
      ...(verificationStatus && { verificationStatus }),
      ...(priorityLevel && { priorityLevel })
    };

    const families = await prisma.family.findMany({
      where,
      include: {
        needs: {
          where: { isFulfilled: false },
          select: {
            id: true,
            category: true,
            title: true,
            priority: true,
            estimatedCost: true
          }
        },
        externalDonations: {
          where: { isVerified: true },
          select: {
            amount: true,
            currency: true,
            donationDate: true
          }
        },
        _count: {
          select: {
            needs: true,
            externalDonations: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: [
        { priorityLevel: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const total = await prisma.family.count({ where });

    res.json({
      families,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching families:', error);
    res.status(500).json({ error: 'Failed to fetch families' });
  }
};

// GET /api/families/:familyCode - Get single family
const getFamilyByCode = async (req, res) => {
  try {
    const { familyCode } = req.params;
    
    const family = await prisma.family.findUnique({
      where: { familyCode },
      include: {
        needs: {
          select: {
            id: true,
            category: true,
            title: true,
            description: true,
            estimatedCost: true,
            priority: true,
            isFulfilled: true,
            createdAt: true
          }
        },
        externalDonations: {
          where: { isVerified: true },
          select: {
            platform: true,
            donorName: true,
            amount: true,
            currency: true,
            donationDate: true
          },
          orderBy: { donationDate: 'desc' }
        }
      }
    });

    if (!family || !family.isActive) {
      return res.status(404).json({ error: 'Family not found' });
    }

    res.json(family);
  } catch (error) {
    console.error('Error fetching family:', error);
    res.status(500).json({ error: 'Failed to fetch family details' });
  }
};

// POST /api/families - Create new family (requires auth)
const createFamily = async (req, res) => {
  try {
    const { 
      familyCode, 
      region, 
      priorityLevel, 
      userId,
      // Secure data
      realName,
      exactLocation,
      story
    } = req.body;

    // Check if family code already exists
    const existingFamily = await prisma.family.findUnique({
      where: { familyCode }
    });

    if (existingFamily) {
      return res.status(400).json({ error: 'Family code already exists' });
    }

    // Create family with secure data
    const family = await prisma.family.create({
      data: {
        familyCode,
        region,
        priorityLevel: priorityLevel || 'MEDIUM',
        verificationStatus: 'PENDING',
        userId,
        secureData: {
          create: {
            realName,
            exactLocation,
            story,
            encryptedData: JSON.stringify({ realName, exactLocation, story })
          }
        }
      },
      include: {
        secureData: true
      }
    });

    res.status(201).json({ 
      message: 'Family created successfully',
      familyCode: family.familyCode 
    });
  } catch (error) {
    console.error('Error creating family:', error);
    res.status(500).json({ error: 'Failed to create family' });
  }
};

// PUT /api/families/:familyCode/verify - Admin verify family
const verifyFamily = async (req, res) => {
  try {
    const { familyCode } = req.params;
    const { adminId, status } = req.body; // status: VERIFIED or REJECTED

    const family = await prisma.family.update({
      where: { familyCode },
      data: {
        verificationStatus: status,
        verifiedByAdminId: adminId,
        secureData: {
          update: {
            verifiedBy: adminId,
            verifiedAt: new Date()
          }
        }
      }
    });

    res.json({ 
      message: `Family ${status.toLowerCase()} successfully`,
      family: { familyCode: family.familyCode, status: family.verificationStatus }
    });
  } catch (error) {
    console.error('Error verifying family:', error);
    res.status(500).json({ error: 'Failed to verify family' });
  }
};

// GET /api/families/:familyCode/secure - Admin access secure data
const getSecureFamilyData = async (req, res) => {
  try {
    const { familyCode } = req.params;
    const { adminId } = req.query;

    // Verify admin permissions here (add your auth middleware)
    
    const secureData = await prisma.secureFamilyData.findUnique({
      where: { familyCode },
      include: {
        family: {
          select: {
            familyCode: true,
            region: true,
            verificationStatus: true,
            priorityLevel: true
          }
        }
      }
    });

    if (!secureData) {
      return res.status(404).json({ error: 'Secure data not found' });
    }

    res.json(secureData);
  } catch (error) {
    console.error('Error fetching secure data:', error);
    res.status(500).json({ error: 'Failed to fetch secure data' });
  }
};

module.exports = {
  getAllFamilies,
  getFamilyByCode,
  createFamily,
  verifyFamily,
  getSecureFamilyData
};