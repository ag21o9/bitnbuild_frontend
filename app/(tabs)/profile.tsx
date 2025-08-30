import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      {icon}
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

interface MenuItemProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  showArrow = true,
  rightElement
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <View style={styles.menuIcon}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {rightElement || (showArrow && <Text style={styles.menuArrow}>›</Text>)}
  </TouchableOpacity>
);

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  currentWeightKg?: number;
  targetWeightKg?: number;
  healthGoal?: string;
  activityLevel?: string;
  profileImage?: string | null;
  targetDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
  phone?: string; // Optional field for editing
  goals?: string[];
  stats?: {
    currentStreak: number;
    goalsAchieved: number;
    totalGoals: number;
    weightProgress: number;
    activeDays: number;
  };
}

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    weight: '',
    height: '',
    age: '',
  });
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },

      });
      console.log('Auth token:', token);

      if (response.ok) {
        const data = await response.json();
        console.log('User profile data:', data);
        // Extract user data from nested response structure
        if (data.success && data.data && data.data.user) {
          setUserProfile(data.data.user);
        } else {
          console.warn('Unexpected API response structure:', data);
          setUserProfile(data); // Fallback to original structure
        }
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to fetch profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const userStats = [
    {
      title: 'Current Weight',
      value: userProfile?.currentWeightKg?.toString() || '0',
      subtitle: 'kg',
      icon: <Ionicons name="scale" size={20} color="#FF9800" />,
      color: '#FF9800',
    },
    {
      title: 'Target Weight',
      value: userProfile?.targetWeightKg?.toString() || '0',
      subtitle: 'kg',
      icon: <Ionicons name="flag" size={20} color="#4CAF50" />,
      color: '#4CAF50',
    },
    {
      title: 'Height',
      value: userProfile?.heightCm?.toString() || '0',
      subtitle: 'cm',
      icon: <Ionicons name="resize" size={20} color="#2196F3" />,
      color: '#2196F3',
    },
    {
      title: 'Health Goal',
      value: userProfile?.healthGoal?.replace('_', ' ') || 'Not Set',
      subtitle: 'target',
      icon: <Ionicons name="heart" size={20} color="#E91E63" />,
      color: '#E91E63',
    },
  ];

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        weight: userProfile.currentWeightKg?.toString() || '',
        height: userProfile.heightCm?.toString() || '',
        age: userProfile.age?.toString() || '',
      });
      setEditModalVisible(true);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    setEditLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
      };

      // Only include optional fields if they have values
      if (editForm.phone.trim()) updateData.phone = editForm.phone;
      if (editForm.weight.trim()) updateData.currentWeightKg = parseFloat(editForm.weight);
      if (editForm.height.trim()) updateData.heightCm = parseFloat(editForm.height);
      if (editForm.age.trim()) updateData.age = parseInt(editForm.age);

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        console.log('Profile updated:', updatedData);
        // Handle nested response structure for update as well
        if (updatedData.success && updatedData.data && updatedData.data.user) {
          setUserProfile(updatedData.data.user);
        } else {
          setUserProfile(updatedData);
        }
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings page coming soon!');
  };

  const handleGoals = () => {
    Alert.alert('Goals', 'Goals management coming soon!');
  };

  const handleAchievements = () => {
    Alert.alert('Achievements', 'Achievements page coming soon!');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Privacy settings coming soon!');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'Help center coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('authToken');
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={['#6A1B9A', '#4A148C']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="white" />
                </View>
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                  <Ionicons name="create" size={16} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{userProfile?.name || 'Loading...'}</Text>
              <Text style={styles.userEmail}>{userProfile?.email || 'Loading...'}</Text>
              <View style={styles.userGoal}>
                <Text style={styles.goalText}>
                  {userProfile?.healthGoal ? userProfile.healthGoal.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 'No goals set yet'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Your Progress</Text>
              <View style={styles.statsGrid}>
                {userStats.map((stat, index) => (
                  <StatCard key={index} {...stat} />
                ))}
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Account</Text>
              <View style={styles.menuContainer}>
                {/* <MenuItem
                  title="Goals & Targets"
                  subtitle="Manage your health goals"
                  icon={<Ionicons name="flag" size={20} color="#4CAF50" />}
                  onPress={handleGoals}
                />
                <MenuItem
                  title="Achievements"
                  subtitle="View your milestones"
                  icon={<Ionicons name="trophy" size={20} color="#FF9800" />}
                  onPress={handleAchievements}
                /> */}
                <MenuItem
                  title="Notifications"
                  subtitle="Manage your alerts"
                  icon={<Ionicons name="notifications" size={20} color="#2196F3" />}
                  onPress={() => { }}
                  showArrow={false}
                  rightElement={
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={setNotificationsEnabled}
                      trackColor={{ false: '#E8EBF0', true: '#4CAF50' }}
                      thumbColor={notificationsEnabled ? 'white' : '#7C8DB0'}
                    />
                  }
                />
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.menuContainer}>
                <MenuItem
                  title="App Settings"
                  subtitle="Preferences and customization"
                  icon={<Ionicons name="settings" size={20} color="#7C8DB0" />}
                  onPress={handleSettings}
                />
                <MenuItem
                  title="Privacy & Security"
                  subtitle="Manage your data and privacy"
                  icon={<Ionicons name="shield-checkmark" size={20} color="#7C8DB0" />}
                  onPress={handlePrivacy}
                />
                <MenuItem
                  title="Help & Support"
                  subtitle="Get help and contact us"
                  icon={<Ionicons name="help-circle" size={20} color="#7C8DB0" />}
                  onPress={handleHelp}
                />
              </View>
            </View>

            <View style={styles.menuSection}>
              <View style={styles.menuContainer}>
                <MenuItem
                  title="Logout"
                  icon={<Ionicons name="log-out" size={20} color="#E91E63" />}
                  onPress={handleLogout}
                  showArrow={false}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={editLoading}
              style={[styles.saveButton, editLoading && styles.saveButtonDisabled]}
            >
              <Text style={[styles.saveButtonText, editLoading && styles.saveButtonTextDisabled]}>
                {editLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor="#7C8DB0"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Enter your email"
                placeholderTextColor="#7C8DB0"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor="#7C8DB0"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.weight}
                  onChangeText={(text) => setEditForm({ ...editForm, weight: text })}
                  placeholder="0"
                  placeholderTextColor="#7C8DB0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.formLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.height}
                  onChangeText={(text) => setEditForm({ ...editForm, height: text })}
                  placeholder="0"
                  placeholderTextColor="#7C8DB0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Age</Text>
              <TextInput
                style={styles.formInput}
                value={editForm.age}
                onChangeText={(text) => setEditForm({ ...editForm, age: text })}
                placeholder="Enter your age"
                placeholderTextColor="#7C8DB0"
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.formNote}>* Required fields</Text>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  userGoal: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  goalText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  statsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statContent: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#7C8DB0',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#7C8DB0',
  },
  menuArrow: {
    fontSize: 20,
    color: '#7C8DB0',
    fontWeight: '300',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#7C8DB0',
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#6A1B9A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E8EBF0',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButtonTextDisabled: {
    color: '#7C8DB0',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  formNote: {
    fontSize: 12,
    color: '#7C8DB0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});