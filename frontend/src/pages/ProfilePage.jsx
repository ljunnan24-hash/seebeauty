import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Mail, Bell, Shield, Trash2, Save, Camera, Calendar, Globe, Eye, EyeOff, Smartphone, Monitor, Moon, Sun, Palette, Download, Upload, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const mapUserToFormValues = (user) => ({
  firstName: user?.profile?.firstName ?? '',
  lastName: user?.profile?.lastName ?? '',
  bio: user?.profile?.bio ?? '',
  website: user?.profile?.website ?? '',
  location: user?.profile?.location ?? '',
  birthDate: user?.profile?.birthDate ?? '',
  autoDelete: user?.settings?.auto_delete ?? false,
  emailNotifications: user?.settings?.email_notifications ?? true,
  marketingEmails: user?.settings?.marketing_emails ?? false,
  pushNotifications: user?.settings?.push_notifications ?? true,
  reportDigest: user?.settings?.report_digest ?? 'weekly',
  shareDefaultMode: user?.settings?.share_default_mode ?? 'normal',
  allowDataExport: user?.settings?.allow_data_export ?? true,
  currentPassword: '',
  newPassword: ''
});

function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: mapUserToFormValues(user)
  });

  useEffect(() => {
    reset(mapUserToFormValues(user));
  }, [user, reset]);

  useEffect(() => {
    if (fetchCurrentUser) {
      fetchCurrentUser().catch(() => {});
    }
  }, [fetchCurrentUser]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let response;
      if (activeTab === 'profile') {
        response = await api.patch('/users/me', {
          firstName: data.firstName,
          lastName: data.lastName,
          bio: data.bio,
          website: data.website,
          location: data.location,
          birthDate: data.birthDate
        });
      } else if (activeTab === 'settings') {
        response = await api.patch('/users/me', {
          settings: {
            auto_delete: data.autoDelete,
            share_default_mode: data.shareDefaultMode,
            allow_data_export: data.allowDataExport
          }
        });
      } else if (activeTab === 'notifications') {
        response = await api.patch('/users/me', {
          settings: {
            email_notifications: data.emailNotifications,
            marketing_emails: data.marketingEmails,
            push_notifications: data.pushNotifications,
            report_digest: data.reportDigest
          }
        });
      }
      if (response?.data?.user) {
        setUser(response.data.user);
      }
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // In a real app, you would upload this to your server
    }
  };

  const handlePasswordChange = async (data) => {
    if (!data.currentPassword || !data.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password updated successfully');
      setValue('currentPassword', '');
      setValue('newPassword', '');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataExport = async () => {
    try {
      const response = await api.get('/users/me/export');
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seebeauty-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/users/me');
        logout();
        toast.success('Account deleted successfully');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Account Settings</h1>
          <p className="mt-2 text-xl text-gray-600">Manage your profile, preferences, and security</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 mb-8">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-8 border border-white/20">
            <div className="space-y-8">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar"
                    className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-600">Upload a photo to personalize your account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="pl-12 w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Bio
                </label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <Globe className="inline h-4 w-4 mr-2" />
                    Website
                  </label>
                  <input
                    {...register('website')}
                    type="url"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="https://your-website.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Location
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Birth Date
                </label>
                <input
                  {...register('birthDate')}
                  type="date"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Account Type
                  </label>
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                    {user?.plan === 'free' ? 'Free Plan' : 'Pro Plan'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Member Since
                  </label>
                  <p className="text-gray-900 font-medium">
                    {user?.createdAt && new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Password Change Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-500"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-8 border border-white/20">
            <div className="space-y-8">
              {/* Privacy & Data */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-purple-500" />
                  Privacy & Data
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('autoDelete')}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Auto-delete photos</span>
                      <p className="text-xs text-gray-500">Automatically delete uploaded photos after 30 days</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('allowDataExport')}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Allow data export</span>
                      <p className="text-xs text-gray-500">Enable the ability to download all your data</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* App Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2 text-purple-500" />
                  App Preferences
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Default Rating Mode
                    </label>
                    <select
                      {...register('shareDefaultMode')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="normal">💝 Normal Mode - Constructive feedback</option>
                      <option value="roast">🔥 Roast Mode - Entertaining critique</option>
                    </select>
                  </div>
                </div>
              </div>


              {/* Data Export */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-purple-500" />
                  Data Export
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Download all your data including profile information, photos, and reports.
                  </p>
                  <button
                    type="button"
                    onClick={handleDataExport}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                  <Trash2 className="h-5 w-5 mr-2" />
                  Danger Zone
                </h3>
                <div className="bg-red-50 rounded-xl p-6">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center px-4 py-2 border-2 border-red-300 rounded-lg text-sm font-semibold text-red-700 bg-white hover:bg-red-50 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl p-8 border border-white/20">
            <div className="space-y-8">
              {/* Email Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-purple-500" />
                  Email Notifications
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('emailNotifications')}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Report notifications</span>
                      <p className="text-xs text-gray-500">Get notified when your photo analysis is complete</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('marketingEmails')}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Marketing emails</span>
                      <p className="text-xs text-gray-500">Receive updates about new features and tips</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Report Digest Frequency
                    </label>
                    <select
                      {...register('reportDigest')}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="never">Never</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Get a summary of your recent reports</p>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-purple-500" />
                  Push Notifications
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register('pushNotifications')}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">Browser notifications</span>
                      <p className="text-xs text-gray-500">Get real-time notifications in your browser</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notification Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-purple-500" />
                  Notification Settings
                </h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-4">
                      <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Analysis Complete</h4>
                      <p className="text-xs text-gray-500">When your photo rating is ready</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <User className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Account Updates</h4>
                      <p className="text-xs text-gray-500">Security and account changes</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <Smartphone className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-semibold text-gray-900">Tips & Features</h4>
                      <p className="text-xs text-gray-500">New features and usage tips</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-3" />
                Save Changes
              </>
            )}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;