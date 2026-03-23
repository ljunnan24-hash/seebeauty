import express from 'express';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, bio, website, location, birthDate, profile, settings } = req.body;

    const updates = {};

    // Handle basic profile fields
    if (firstName !== undefined || lastName !== undefined || bio !== undefined ||
        website !== undefined || location !== undefined || birthDate !== undefined) {
      const currentProfile = req.user.profile || {};
      updates.profile = {
        ...currentProfile,
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(location !== undefined && { location }),
        ...(birthDate !== undefined && { birthDate })
      };
    }

    // Handle custom profile object
    if (profile) {
      updates.profile = { ...(req.user.profile || {}), ...profile };
    }

    // Handle settings with comprehensive defaults
    if (settings) {
      const defaultSettings = {
        auto_delete: false,
        email_notifications: true,
        marketing_emails: false,
        push_notifications: true,
        report_digest: 'weekly',
        share_default_mode: 'normal',
        theme: 'system',
        profile_visibility: 'public',
        allow_data_export: true
      };
      updates.settings = { ...defaultSettings, ...req.user.settings, ...settings };
    }

    await req.user.update(updates);

    res.json({ user: req.user.toJSON() });
  } catch (error) {
    next(error);
  }
});

// Update user password
router.patch('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Verify current password
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Update password
    await req.user.update({ password_hash: newPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Export user data
router.get('/me/export', authenticate, async (req, res, next) => {
  try {
    // Get user data
    const userData = {
      user: req.user.toJSON(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Add related data (reports, etc.) - you can expand this
    // const reports = await ScoreReport.findAll({ where: { user_id: req.user.id } });
    // userData.reports = reports;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="seebeauty-data-export.json"');
    res.json(userData);
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/me', authenticate, async (req, res, next) => {
  try {
    // In a production app, you might want to:
    // 1. Delete associated data (reports, images, etc.)
    // 2. Log the deletion for audit purposes
    // 3. Send a confirmation email

    await req.user.destroy();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;