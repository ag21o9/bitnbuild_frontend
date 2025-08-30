import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface FormData {
  name: string;
  email: string;
  password: string;
  age: string;
  height: string;
  currentWeight: string;
  gender: 'male' | 'female' | '';
  healthGoal: 'weight_loss' | 'muscle_gain' | 'maintenance' | '';
  targetWeight: string;
  deadline: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';
}

const InputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  secureTextEntry?: boolean;
}> = ({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', secureTextEntry = false }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <View style={styles.inputIcon}>
        {icon}
      </View>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7C8DB0"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
      />
    </View>
  </View>
);

const SelectButton: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.selectButton, selected && styles.selectedButton]}
    onPress={onPress}
  >
    <Text style={[styles.selectButtonText, selected && styles.selectedButtonText]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function OnboardingScreen() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    age: '',
    height: '',
    currentWeight: '',
    gender: '',
    healthGoal: '',
    targetWeight: '',
    deadline: '',
    activityLevel: '',
  });

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof FormData)[] = [
      'name', 'email', 'password', 'age', 'height', 'currentWeight',
      'gender', 'healthGoal', 'activityLevel'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        Alert.alert('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (formData.healthGoal !== 'maintenance' && !formData.targetWeight) {
      Alert.alert('Error', 'Please enter your target weight');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // Map form data to API format
        const apiData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: parseInt(formData.age),
          heightCm: parseInt(formData.height),
          currentWeightKg: parseInt(formData.currentWeight),
          gender: formData.gender.toUpperCase(),
          healthGoal: formData.healthGoal.toUpperCase(),
          targetWeightKg: formData.targetWeight ? parseInt(formData.targetWeight) : parseInt(formData.currentWeight),
          targetDeadline: "2025-12-31T00:00:00.000Z", // Default deadline
          activityLevel: formData.activityLevel.toUpperCase()
        };

        const response = await fetch('https://bitnbuild-brown.vercel.app/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        const data = await response.json();

        console.log('Registration response:', data);

        if (data.success) {
          // Store auth token and user data
          await AsyncStorage.setItem('authToken', data.data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));

          console.log('Auth Token:', data.data.token);
          console.log('User Data:', data.data.user);

          Alert.alert(
            'Welcome to FitSync!',
            'Your profile has been created successfully. Let\'s start your health journey!',
            [
              {
                text: 'Get Started',
                onPress: () => router.replace('/(tabs)'),
              },
            ]
          );
        } else {
          Alert.alert('Registration Failed', data.message || 'Please try again');
        }
      } catch (error) {
        console.error('Registration error:', error);
        Alert.alert('Error', 'Failed to create account. Please check your connection and try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Welcome to FitSync</Text>
        <Text style={styles.headerSubtitle}>Let's create your personalized health profile</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account?     </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InputField
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            placeholder="Enter your full name"
            icon={<Ionicons name="person" size={20} color="#7C8DB0" />}
          />

          <InputField
            label="Email Address"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            placeholder="Enter your email"
            icon={<Ionicons name="mail" size={20} color="#7C8DB0" />}
            keyboardType="email-address"
          />

          <InputField
            label="Password"
            value={formData.password}
            onChangeText={(text) => updateFormData('password', text)}
            placeholder="Create a password"
            icon={<Ionicons name="lock-closed" size={20} color="#7C8DB0" />}
            secureTextEntry
          />

          <InputField
            label="Age"
            value={formData.age}
            onChangeText={(text) => updateFormData('age', text)}
            placeholder="Enter your age"
            icon={<Ionicons name="calendar" size={20} color="#7C8DB0" />}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Details</Text>

          <InputField
            label="Height (cm)"
            value={formData.height}
            onChangeText={(text) => updateFormData('height', text)}
            placeholder="Enter your height in cm"
            icon={<Ionicons name="resize" size={20} color="#7C8DB0" />}
            keyboardType="numeric"
          />

          <InputField
            label="Current Weight (kg)"
            value={formData.currentWeight}
            onChangeText={(text) => updateFormData('currentWeight', text)}
            placeholder="Enter your current weight"
            icon={<Ionicons name="fitness" size={20} color="#7C8DB0" />}
            keyboardType="numeric"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.buttonRow}>
              <SelectButton
                label="Male"
                selected={formData.gender === 'male'}
                onPress={() => updateFormData('gender', 'male')}
              />
              <SelectButton
                label="Female"
                selected={formData.gender === 'female'}
                onPress={() => updateFormData('gender', 'female')}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Goals</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Primary Goal</Text>
            <View style={styles.buttonColumn}>
              <SelectButton
                label="Weight Loss"
                selected={formData.healthGoal === 'weight_loss'}
                onPress={() => updateFormData('healthGoal', 'WEIGHT_LOSS')}
              />
              <SelectButton
                label="Muscle Gain"
                selected={formData.healthGoal === 'muscle_gain'}
                onPress={() => updateFormData('healthGoal', 'WEIGHT_GAIN')}
              />
              <SelectButton
                label="Maintenance"
                selected={formData.healthGoal === 'maintenance'}
                onPress={() => updateFormData('healthGoal', 'MAINTENANCE')}
              />
            </View>
          </View>

          {formData.healthGoal !== 'maintenance' && (
            <InputField
              label="Target Weight (kg)"
              value={formData.targetWeight}
              onChangeText={(text) => updateFormData('targetWeight', text)}
              placeholder="Enter your target weight"
              icon={<Ionicons name="flag" size={20} color="#7C8DB0" />}
              keyboardType="numeric"
            />
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <View style={styles.buttonColumn}>
              <SelectButton
                label="Sedentary (Little to no exercise)"
                selected={formData.activityLevel === 'sedentary'}
                onPress={() => updateFormData('activityLevel', 'sedentary')}
              />
              <SelectButton
                label="Light (1-3 days/week)"
                selected={formData.activityLevel === 'light'}
                onPress={() => updateFormData('activityLevel', 'light')}
              />
              <SelectButton
                label="Moderate (3-5 days/week)"
                selected={formData.activityLevel === 'moderate'}
                onPress={() => updateFormData('activityLevel', 'moderate')}
              />
              <SelectButton
                label="Active (6-7 days/week)"
                selected={formData.activityLevel === 'active'}
                onPress={() => updateFormData('activityLevel', 'active')}
              />
              <SelectButton
                label="Very Active (2x/day or intense)"
                selected={formData.activityLevel === 'very_active'}
                onPress={() => updateFormData('activityLevel', 'very_active')}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitButtonText}>Create My Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    padding: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    paddingVertical: 16,
    paddingRight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonColumn: {
    gap: 12,
  },
  selectButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C8DB0',
    textAlign: 'center',
  },
  selectedButtonText: {
    color: 'white',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#7C8DB0',
  },
  loginLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});