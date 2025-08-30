import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;

interface LoginData {
  email: string;
  password: string;
}

const InputField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
}> = ({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', secureTextEntry = false }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, value && styles.inputWrapperFocused]}>
      <View style={styles.inputIcon}>
        {icon}
      </View>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0AEC0"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  </View>
);

export default function LoginScreen() {
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateLoginData = (key: keyof LoginData, value: string) => {
    setLoginData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = (): boolean => {
    if (!loginData.email || !loginData.password) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (loginData.password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('https://bitnbuild-brown.vercel.app/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store auth token and user data
        await AsyncStorage.setItem('authToken', data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));

        console.log('Auth Token:', data.data.token);
        console.log('User Data:', data.data.user);

        Alert.alert(
          '🎉 Welcome Back!',
          `Great to see you again, ${data.data.user.name}!\nReady to continue your nutrition journey?`,
          [
            {
              text: 'Let\'s Go!',
              onPress: () => router.replace('/(tabs)'),
              style: 'default',
            },
          ]
        );
      } else {
        Alert.alert('🔐 Login Failed', data.message || 'Please check your credentials and try again');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('🌐 Connection Error', 'Unable to connect. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToSignup = () => {
    router.push('/onboarding');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2D5016" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section with Gradient */}
          <LinearGradient
            colors={['#2D5016', '#4A7C59', '#5D8A66']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              {/* App Logo/Icon */}
              <View style={styles.logoContainer}>
                <View style={styles.logoBackground}>
                  <Ionicons name="nutrition" size={isTablet ? 48 : 40} color="#FFFFFF" />
                </View>
                <View style={styles.logoAccent1} />
                <View style={styles.logoAccent2} />
              </View>

              {/* Welcome Text */}
              <Text style={styles.headerTitle}>Welcome Back!</Text>
              <Text style={styles.headerSubtitle}>
                Continue your healthy journey with personalized nutrition insights
              </Text>

              {/* Decorative Elements */}
              <View style={styles.headerDecorations}>
                <Ionicons name="leaf" size={16} color="rgba(255,255,255,0.6)" />
                <View style={styles.decorativeDot} />
                <Ionicons name="fitness" size={16} color="rgba(255,255,255,0.6)" />
                <View style={styles.decorativeDot} />
                <Ionicons name="heart" size={16} color="rgba(255,255,255,0.6)" />
              </View>
            </View>
          </LinearGradient>

          {/* Main Content */}
          <View style={styles.content}>
            <View style={styles.formCard}>
              {/* Login Form */}
              <View style={styles.form}>
                <Text style={styles.formTitle}>Sign In</Text>
                <Text style={styles.formSubtitle}>Enter your credentials to access your account</Text>

                <InputField
                  label="Email Address"
                  value={loginData.email}
                  onChangeText={(text) => updateLoginData('email', text)}
                  placeholder="your.email@example.com"
                  icon={<Ionicons name="mail-outline" size={20} color={loginData.email ? "#4A7C59" : "#A0AEC0"} />}
                  keyboardType="email-address"
                />

                <View style={styles.passwordContainer}>
                  <InputField
                    label="Password"
                    value={loginData.password}
                    onChangeText={(text) => updateLoginData('password', text)}
                    placeholder="Enter your secure password"
                    icon={<Ionicons name="lock-closed-outline" size={20} color={loginData.password ? "#4A7C59" : "#A0AEC0"} />}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#A0AEC0"
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, { opacity: isLoading ? 0.8 : 1 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={isLoading ? ['#A0AEC0', '#A0AEC0'] : ['#4A7C59', '#2D5016']}
                    style={styles.loginGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.loginButtonContent}>
                      {isLoading && (
                        <View style={styles.loadingSpinner}>
                          <Ionicons name="refresh" size={20} color="white" />
                        </View>
                      )}
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </Text>
                      {!isLoading && (
                        <Ionicons name="arrow-forward" size={20} color="white" />
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>



                {/* Sign Up Link */}
                <View style={styles.signupSection}>
                  <Text style={styles.signupText}>New to our community?     </Text>
                  <TouchableOpacity onPress={goToSignup} activeOpacity={0.7}>
                    <Text style={styles.signupLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bottom Decoration */}
            <View style={styles.bottomDecoration}>
              <Ionicons name="leaf-outline" size={24} color="#E2E8F0" />
              <Text style={styles.bottomText}>Nourish • Track • Thrive</Text>
              <Ionicons name="leaf-outline" size={24} color="#E2E8F0" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    minHeight: SCREEN_HEIGHT * 0.35,
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  logoBackground: {
    width: isTablet ? 80 : 70,
    height: isTablet ? 80 : 70,
    borderRadius: isTablet ? 40 : 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoAccent1: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBD38D',
    opacity: 0.8,
  },
  logoAccent2: {
    position: 'absolute',
    bottom: -6,
    left: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#68D391',
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: isTablet ? 36 : 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: isTablet ? 18 : 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerDecorations: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  decorativeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: isTablet ? 40 : 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: isTablet ? 480 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    transition: 'all 0.2s ease',
  },
  inputWrapperFocused: {
    borderColor: '#4A7C59',
    shadowOpacity: 0.1,
  },
  inputIcon: {
    padding: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 16,
    paddingRight: 16,
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 38,
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 32,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4A7C59',
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4A7C59',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingSpinner: {
    transform: [{ rotate: '45deg' }],
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  signupText: {
    fontSize: 16,
    color: '#718096',
  },
  signupLink: {
    fontSize: 16,
    color: '#4A7C59',
    fontWeight: '700',
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  bottomText: {
    fontSize: 14,
    color: '#CBD5E0',
    fontWeight: '500',
    letterSpacing: 1,
  },
});