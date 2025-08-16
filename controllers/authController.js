const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRES = '7d';

// POST /api/auth/register - Register new user
const register = async (req, res) => {
  try {
    const { email, password, role, name, country, preferredRegions } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role.toUpperCase() // FAMILY, DONOR, ADMIN
      }
    });

    // Create role-specific profile
    let profile = null;
    if (role.toUpperCase() === 'DONOR') {
      profile = await prisma.donor.create({
        data: {
          name,
          country: country || 'Unknown',
          preferredRegions: preferredRegions || [],
          userId: user.id
        }
      });
    } else if (role.toUpperCase() === 'ADMIN') {
      // Check if it's first admin (this for now)
      const adminCount = await prisma.admin.count();
      const permissions = adminCount === 0 ? ['SUPER_ADMIN'] : ['BASIC_ADMIN'];
      
      profile = await prisma.admin.create({
        data: {
          email: user.email,
          password: hashedPassword,
          name,
          permissions
        }
      });
    } else if (role.toUpperCase() === 'FAMILY') {
      const { familyCode, region, realName, exactLocation, story } = req.body;
      
      if (!familyCode || !region || !realName || !exactLocation || !story) {
        return res.status(400).json({ 
          error: 'Family registration requires: familyCode, region, realName, exactLocation, story' 
        });
      }

      // Check if family code already exists
      const existingFamily = await prisma.family.findUnique({
        where: { familyCode }
      });

      if (existingFamily) {
        return res.status(400).json({ error: 'Family code already exists' });
      }

      profile = await prisma.family.create({
        data: {
          familyCode,
          region,
          priorityLevel: 'MEDIUM',
          verificationStatus: 'PENDING',
          userId: user.id,
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
          secureData: {
            select: {
              id: true,
              realName: true
            }
          }
        }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// POST /api/auth/login - Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        donors: true,
        families: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === 'DONOR') {
      profile = await prisma.donor.findFirst({
        where: { userId: user.id }
      });
    } else if (user.role === 'ADMIN') {
      profile = await prisma.admin.findUnique({
        where: { email: user.email }
      });
    } else if (user.role === 'FAMILY') {
      profile = await prisma.family.findFirst({
        where: { userId: user.id },
        select: {
          familyCode: true,
          region: true,
          verificationStatus: true,
          priorityLevel: true
        }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        profileId: profile?.id
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// GET /api/auth/me - Get current user info
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get role-specific profile
    let profile = null;
    if (user.role === 'DONOR') {
      profile = await prisma.donor.findFirst({
        where: { userId: user.id }
      });
    } else if (user.role === 'ADMIN') {
      profile = await prisma.admin.findUnique({
        where: { email: user.email }
      });
    } else if (user.role === 'FAMILY') {
      profile = await prisma.family.findFirst({
        where: { userId: user.id }
      });
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
