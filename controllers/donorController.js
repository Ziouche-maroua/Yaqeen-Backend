// controllers/donorController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/donors - Get all donors (Admin only)
const getAllDonors = async (req, res) => {
  try {
    const { country, region, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(country && { country }),
      ...(region && { preferredRegions: { has: region } })
    };

    const donors = await prisma.donor.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true
          }
        },
        donations: {
          where: { isVerified: true },
          select: {
            amount: true,
            currency: true,
            donationDate: true,
            family: {
              select: {
                familyCode: true,
                region: true
              }
            }
          }
        },
        _count: {
          select: {
            donations: true,
            checkedNeeds: true
          }
        }
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { joinedAt: 'desc' }
    });

    const total = await prisma.donor.count({ where });

    res.json({
      donors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
};

// GET /api/donors/:id - Get single donor
const getDonorById = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            isActive: true,
            createdAt: true
          }
        },
        donations: {
          include: {
            family: {
              select: {
                familyCode: true,
                region: true,
                verificationStatus: true
              }
            }
          },
          orderBy: { donationDate: 'desc' }
        },
        checkedNeeds: {
          include: {
            family: {
              select: {
                familyCode: true,
                region: true
              }
            }
          }
        }
      }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    // Calculate donation statistics
    const totalDonated = donor.donations
      .filter(d => d.isVerified)
      .reduce((sum, d) => sum + d.amount, 0);

    const donationStats = {
      totalAmount: totalDonated,
      totalCount: donor.donations.filter(d => d.isVerified).length,
      pendingCount: donor.donations.filter(d => !d.isVerified).length,
      familiesSupported: [...new Set(donor.donations.map(d => d.familyCode))].length
    };

    res.json({
      ...donor,
      stats: donationStats
    });
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ error: 'Failed to fetch donor details' });
  }
};

// PUT /api/donors/profile - Update donor profile (Donor only)
const updateDonorProfile = async (req, res) => {
  try {
    const { name, country, preferredRegions, favoriteFamilies } = req.body;
    const userId = req.user.userId;

    // Find donor by userId
    const donor = await prisma.donor.findFirst({
      where: { userId }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const updatedDonor = await prisma.donor.update({
      where: { id: donor.id },
      data: {
        ...(name && { name }),
        ...(country && { country }),
        ...(preferredRegions && { preferredRegions }),
        ...(favoriteFamilies && { favoriteFamilies })
      },
      include: {
        user: {
          select: {
            email: true,
            isActive: true
          }
        }
      }
    });

    res.json({
      message: 'Profile updated successfully',
      donor: updatedDonor
    });
  } catch (error) {
    console.error('Error updating donor profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// POST /api/donors/favorites/:familyCode - Add family to favorites
const addFavoriteFamily = async (req, res) => {
  try {
    const { familyCode } = req.params;
    const userId = req.user.userId;

    // Find donor
    const donor = await prisma.donor.findFirst({
      where: { userId }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    // Check if family exists
    const family = await prisma.family.findUnique({
      where: { familyCode }
    });

    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Add to favorites if not already there
    const currentFavorites = donor.favoriteFamilies || [];
    if (!currentFavorites.includes(familyCode)) {
      await prisma.donor.update({
        where: { id: donor.id },
        data: {
          favoriteFamilies: [...currentFavorites, familyCode]
        }
      });
    }

    res.json({
      message: 'Family added to favorites',
      familyCode,
      totalFavorites: currentFavorites.length + 1
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite family' });
  }
};

// DELETE /api/donors/favorites/:familyCode - Remove family from favorites
const removeFavoriteFamily = async (req, res) => {
  try {
    const { familyCode } = req.params;
    const userId = req.user.userId;

    const donor = await prisma.donor.findFirst({
      where: { userId }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const currentFavorites = donor.favoriteFamilies || [];
    const updatedFavorites = currentFavorites.filter(code => code !== familyCode);

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        favoriteFamilies: updatedFavorites
      }
    });

    res.json({
      message: 'Family removed from favorites',
      familyCode,
      totalFavorites: updatedFavorites.length
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite family' });
  }
};

// GET /api/donors/favorites - Get donor's favorite families
const getFavoriteFamilies = async (req, res) => {
  try {
    const userId = req.user.userId;

    const donor = await prisma.donor.findFirst({
      where: { userId }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    const favoriteFamilies = await prisma.family.findMany({
      where: {
        familyCode: { in: donor.favoriteFamilies || [] },
        isActive: true
      },
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
            currency: true
          }
        }
      }
    });

    res.json({
      favorites: favoriteFamilies,
      count: favoriteFamilies.length
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorite families' });
  }
};

// GET /api/donors/dashboard - Get donor dashboard data
const getDonorDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const donor = await prisma.donor.findFirst({
      where: { userId },
      include: {
        donations: {
          where: { isVerified: true },
          include: {
            family: {
              select: {
                familyCode: true,
                region: true
              }
            }
          },
          orderBy: { donationDate: 'desc' },
          take: 5
        }
      }
    });

    if (!donor) {
      return res.status(404).json({ error: 'Donor profile not found' });
    }

    // Get families in preferred regions
    const suggestedFamilies = await prisma.family.findMany({
      where: {
        region: { in: donor.preferredRegions },
        verificationStatus: 'VERIFIED',
        isActive: true
      },
      include: {
        needs: {
          where: { isFulfilled: false },
          select: {
            category: true,
            priority: true
          }
        }
      },
      take: 10,
      orderBy: { priorityLevel: 'desc' }
    });

    // Calculate stats
    const totalDonated = donor.donations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueFamilies = [...new Set(donor.donations.map(d => d.familyCode))];

    res.json({
      profile: {
        name: donor.name,
        country: donor.country,
        preferredRegions: donor.preferredRegions,
        joinedAt: donor.joinedAt
      },
      stats: {
        totalDonated,
        donationCount: donor.donations.length,
        familiesSupported: uniqueFamilies.length,
        favoritesCount: donor.favoriteFamilies?.length || 0
      },
      recentDonations: donor.donations,
      suggestedFamilies
    });
  } catch (error) {
    console.error('Error fetching donor dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

module.exports = {
  getAllDonors,
  getDonorById,
  updateDonorProfile,
  addFavoriteFamily,
  removeFavoriteFamily,
  getFavoriteFamilies,
  getDonorDashboard
};