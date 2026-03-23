import dotenv from 'dotenv';
import { sequelize } from '../config/database.js';
import { User } from '../models/index.js';

dotenv.config();

async function updateUserSettings() {
  try {
    console.log('🔄 Updating user settings with new default values...');

    await sequelize.authenticate();
    console.log('Database connection established');

    // Get all users
    const users = await User.findAll();
    console.log(`📊 Found ${users.length} users to update`);

    const defaultSettings = {
      // Privacy & Data
      auto_delete: false,
      profile_visibility: 'public',
      allow_data_export: true,
      // Notifications
      email_notifications: true,
      marketing_emails: false,
      push_notifications: true,
      report_digest: 'weekly',
      // App Preferences
      share_default_mode: 'normal',
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      // Security
      two_factor_auth: false
    };

    let updatedCount = 0;

    for (const user of users) {
      const currentSettings = user.settings || {};

      // Merge with default settings, preserving existing values
      const updatedSettings = {
        ...defaultSettings,
        ...currentSettings
      };

      // Check if settings actually changed
      const settingsChanged = JSON.stringify(currentSettings) !== JSON.stringify(updatedSettings);

      if (settingsChanged) {
        await user.update({ settings: updatedSettings });
        updatedCount++;
        console.log(`Updated settings for user: ${user.email}`);
      } else {
        console.log(`ℹ️  Settings already up-to-date for user: ${user.email}`);
      }
    }

    console.log(`\nUpdated ${updatedCount} users successfully!`);
    console.log('🏁 User settings update completed');

  } catch (error) {
    console.error('Failed to update user settings:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the update
updateUserSettings()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Update failed:', error);
    process.exit(1);
  });