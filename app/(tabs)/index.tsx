import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

interface DailyStats {
  id: string;
  userId: string;
  date: string;
  steps: number;
  activeCalories: number;
  heartRateAvg: number;
  sleepHours: number;
  weightKg: number;
  activitiesCount: number;
  totalActivityDuration: number;
  totalCaloriesFromActivities: number;
  bmi: number;
  bmiCategory: {
    category: string;
    good: boolean;
  };
  createdAt: string;
}

interface Activity {
  id: string;
  userId: string;
  activityName: string;
  duration: number;
  caloriesBurnt: number;
  suggestions: string;
  date: string;
  createdAt: string;
}

interface MealPlan {
  id: string;
  userId: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  totalCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
}

interface MealResponse {
  success: boolean;
  message: string;
  data: {
    mealPlan: MealPlan;
    suggestions: string;
    nextMealRecommendation: string;
  };
}

interface ActivityResponse {
  success: boolean;
  message: string;
  data: {
    activity: Activity;
    calorieBurnt: number;
    suggestions: string;
  };
}

interface ActivitiesResponse {
  success: boolean;
  message: string;
  data: {
    activities: Activity[];
    summary: {
      totalActivities: number;
      totalCaloriesBurnt: number;
      averageCaloriesPerActivity: number;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalActivities: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  progress?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon, color, progress }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
    <View style={styles.metricContent}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
    {progress !== undefined && (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    )}
  </View>
);

export default function DashboardScreen() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('User');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Workout state
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [completedWorkout, setCompletedWorkout] = useState<Activity | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Meal state
  const [mealModalVisible, setMealModalVisible] = useState(false);
  const [mealForm, setMealForm] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    snacks: ''
  });
  const [mealLoading, setMealLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [showMealResultModal, setShowMealResultModal] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState({
    suggestions: '',
    nextMealRecommendation: ''
  });

  const router = useRouter();

  const fetchDailyStats = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/dashboard/getdailystats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Daily stats data:', data);
        if (data.success && data.data) {
          setDailyStats(data.data);
        }
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        console.warn('Failed to fetch daily stats');
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserName = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await fetch('https://bitnbuild-brown.vercel.app/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.user) {
            setUserName(data.data.user.name.split(' ')[0] || 'User');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/stats/activities', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ActivitiesResponse = await response.json();
        console.log('Activities data:', data);
        if (data.success && data.data && data.data.activities) {
          setActivities(data.data.activities);
        }
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        console.warn('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyStats();
    fetchUserName();
    fetchActivities();
  }, []);

  // Timer effect for workout
  useEffect(() => {
    let interval: any;
    if (isWorkoutActive && workoutStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive, workoutStartTime]);

  // Workout functions
  const handleStartWorkout = () => {
    setWorkoutModalVisible(true);
  };

  const startWorkoutTimer = () => {
    if (workoutName.trim()) {
      setWorkoutStartTime(new Date());
      setIsWorkoutActive(true);
      setElapsedTime(0);
      setWorkoutModalVisible(false);
    } else {
      Alert.alert('Error', 'Please enter a workout name');
    }
  };

  const stopWorkout = async () => {
    if (!workoutStartTime) return;

    const duration = Math.floor(elapsedTime / 60); // Convert to minutes

    setWorkoutLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/stats/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity: workoutName.toLowerCase(),
          minutes: duration,
        }),
      });

      if (response.ok) {
        const data: ActivityResponse = await response.json();
        console.log('Workout logged:', data);

        // Create activity object from response data
        const activityData: Activity = {
          id: Date.now().toString(), // Temporary ID since API doesn't return it
          userId: '',
          activityName: workoutName.toLowerCase(),
          duration: duration,
          caloriesBurnt: data.data.calorieBurnt || 0,
          suggestions: data.data.suggestions || '',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        setCompletedWorkout(activityData);
        setShowResultModal(true);

        // Reset workout state
        setIsWorkoutActive(false);
        setWorkoutStartTime(null);
        setElapsedTime(0);
        setWorkoutName('');

        // Refresh daily stats and activities
        fetchDailyStats();
        fetchActivities();
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to log workout');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setWorkoutLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Meal functions
  const handleLogMeal = () => {
    setMealModalVisible(true);
  };

  const submitMealPlan = async () => {
    if (!mealForm.breakfast.trim() && !mealForm.lunch.trim() && !mealForm.dinner.trim()) {
      Alert.alert('Error', 'Please add at least one meal');
      return;
    }

    setMealLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const mealData = {
        breakfast: mealForm.breakfast.trim(),
        lunch: mealForm.lunch.trim(),
        dinner: mealForm.dinner.trim(),
        ...(mealForm.snacks.trim() && { snacks: mealForm.snacks.trim() })
      };

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/stats/meal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealData),
      });

      if (response.ok) {
        const data: MealResponse = await response.json();
        console.log('Meal logged:', data);
        setMealPlan(data.data.mealPlan);
        setMealSuggestions({
          suggestions: data.data.suggestions,
          nextMealRecommendation: data.data.nextMealRecommendation
        });
        setShowMealResultModal(true);
        setMealModalVisible(false);

        // Reset form
        setMealForm({
          breakfast: '',
          lunch: '',
          dinner: '',
          snacks: ''
        });

        // Refresh daily stats
        fetchDailyStats();
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to log meal plan');
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setMealLoading(false);
    }
  };

  // Calculate progress percentages
  const getStepsProgress = (steps: number) => Math.min((steps / 10000) * 100, 100);
  const getSleepProgress = (hours: number) => Math.min((hours / 8) * 100, 100);
  const getCaloriesProgress = (calories: number) => Math.min((calories / 2000) * 100, 100);

  // Get activity icon based on activity name
  const getActivityIcon = (activityName: string) => {
    const activity = activityName.toLowerCase();
    switch (activity) {
      case 'running':
      case 'jogging':
        return 'walk';
      case 'cycling':
      case 'biking':
        return 'bicycle';
      case 'swimming':
        return 'water';
      case 'weightlifting':
      case 'gym':
        return 'barbell';
      case 'yoga':
        return 'body';
      case 'pushups':
      case 'push-ups':
        return 'fitness';
      case 'football':
      case 'soccer':
        return 'football';
      case 'basketball':
        return 'basketball';
      case 'tennis':
        return 'tennisball';
      default:
        return 'fitness';
    }
  };

  const metrics = [
    {
      title: 'Heart Rate',
      value: dailyStats?.heartRateAvg?.toString() || '0',
      unit: 'bpm',
      icon: <Ionicons name="heart" size={20} color="#E91E63" />,
      color: '#E91E63',
    },
    {
      title: 'Daily Steps',
      value: dailyStats?.steps?.toLocaleString() || '0',
      unit: 'steps',
      icon: <Ionicons name="walk" size={20} color="#4CAF50" />,
      color: '#4CAF50',
      progress: dailyStats ? getStepsProgress(dailyStats.steps) : 0,
    },
    {
      title: 'Active Calories',
      value: dailyStats?.activeCalories?.toString() || '0',
      unit: 'kcal',
      icon: <Ionicons name="flame" size={20} color="#FF9800" />,
      color: '#FF9800',
      progress: dailyStats ? getCaloriesProgress(dailyStats.activeCalories) : 0,
    },
    {
      title: 'Sleep',
      value: dailyStats?.sleepHours?.toFixed(1) || '0.0',
      unit: 'hours',
      icon: <Ionicons name="moon" size={20} color="#9C27B0" />,
      color: '#9C27B0',
      progress: dailyStats ? getSleepProgress(dailyStats.sleepHours) : 0,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.greeting}>Greetings!</Text>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {dailyStats?.activeCalories?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.summaryLabel}>Calories Burnt       </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {dailyStats?.bmi?.toFixed(1) || '0.0'}
                </Text>
                <Text style={styles.summaryLabel}>
                  BMI     ({dailyStats?.bmiCategory?.category || 'Unknown'})
                </Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Overview</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </View>

            {/* Additional Stats Section */}
            {dailyStats && (
              <View style={styles.additionalStats}>
                <Text style={styles.sectionTitle}>Additional Stats</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
                      <Ionicons name="body" size={20} color="#2196F3" />
                    </View>
                    <Text style={styles.statValue}>{dailyStats.weightKg} kg</Text>
                    <Text style={styles.statLabel}>Weight</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#FF980020' }]}>
                      <Ionicons name="fitness" size={20} color="#FF9800" />
                    </View>
                    <Text style={styles.statValue}>{dailyStats.activitiesCount}</Text>
                    <Text style={styles.statLabel}>Activities</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#9C27B020' }]}>
                      <Ionicons name="time" size={20} color="#9C27B0" />
                    </View>
                    <Text style={styles.statValue}>{Math.round(dailyStats.totalActivityDuration)} min</Text>
                    <Text style={styles.statLabel}>Duration</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.quickActions}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={handleLogMeal}>
                  <Ionicons name="restaurant" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Log Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2196F3' }]} onPress={handleStartWorkout}>
                  <Ionicons name="fitness" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Start Workout</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Health Summary</Text>
              <View style={styles.progressChart}>
                <View style={styles.chartContainer}>
                  <Ionicons
                    name={dailyStats?.bmiCategory?.good ? "checkmark-circle" : "warning"}
                    size={48}
                    color={dailyStats?.bmiCategory?.good ? "#4CAF50" : "#FF9800"}
                  />
                  <Text style={styles.chartTitle}>
                    {dailyStats?.bmiCategory?.good ? "Healthy BMI!" : "Monitor BMI"}
                  </Text>
                  <Text style={styles.chartSubtitle}>
                    Your BMI is {dailyStats?.bmi?.toFixed(1)} ({dailyStats?.bmiCategory?.category})
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily Progress Section */}
            <View style={styles.dailyProgressSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Daily Progress</Text>
                <TouchableOpacity>

                </TouchableOpacity>
              </View>

              {activitiesLoading ? (
                <View style={styles.progressChart}>
                  <Text style={styles.loadingText}>Loading activities...</Text>
                </View>
              ) : activities.length > 0 ? (
                <View style={styles.activitiesContainer}>
                  {activities.slice(0, 3).map((activity, index) => (
                    <View key={activity.id} style={styles.activityCard}>
                      <View style={styles.activityHeader}>
                        <View style={styles.activityIconContainer}>
                          <Ionicons
                            name={getActivityIcon(activity.activityName)}
                            size={24}
                            color="#2196F3"
                          />
                        </View>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityName}>
                            {activity.activityName.charAt(0).toUpperCase() + activity.activityName.slice(1)}
                          </Text>
                          <Text style={styles.activityDate}>
                            {new Date(activity.date).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.activityStats}>
                          <Text style={styles.activityDuration}>{activity.duration} min</Text>
                          <Text style={styles.activityCalories}>{activity.caloriesBurnt} cal</Text>
                        </View>
                      </View>

                      {activity.suggestions && (
                        <View style={styles.activityTip}>
                          <Ionicons name="bulb" size={16} color="#61fe06ff" />
                          <Text style={styles.activityTipText} numberOfLines={50}>
                            {activity.suggestions.length > 380
                              ? activity.suggestions
                              : activity.suggestions
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}

                  {activities.length > 3 && (
                    <TouchableOpacity style={styles.showMoreButton}>
                      <Text style={styles.showMoreText}>
                        +{activities.length - 3} more activities
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#2196F3" />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.progressChart}>
                  <View style={styles.chartContainer}>
                    <Ionicons name="fitness" size={48} color="#E8EBF0" />
                    <Text style={styles.chartTitle}>No Activities Yet</Text>
                    <Text style={styles.chartSubtitle}>
                      Start your first workout to track your progress!
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </>
      )}

      {/* Workout Timer Overlay */}
      {isWorkoutActive && (
        <View style={styles.timerOverlay}>
          <LinearGradient
            colors={['#2196F3', '#1976D2']}
            style={styles.timerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.timerContent}>
              <Ionicons name="fitness" size={32} color="white" />
              <Text style={styles.timerWorkoutName}>{workoutName}</Text>
              <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>
              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopWorkout}
                disabled={workoutLoading}
              >
                {workoutLoading ? (
                  <Text style={styles.stopButtonText}>Saving...</Text>
                ) : (
                  <>
                    <Ionicons name="stop" size={20} color="white" />
                    <Text style={styles.stopButtonText}>Stop Workout</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Workout Name Modal */}
      <Modal
        visible={workoutModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setWorkoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setWorkoutModalVisible(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Start Workout</Text>
            <TouchableOpacity onPress={startWorkoutTimer}>
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.workoutIconContainer}>
              <Ionicons name="fitness" size={64} color="#2196F3" />
            </View>

            <Text style={styles.inputLabel}>Workout Name</Text>
            <TextInput
              style={styles.workoutInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="e.g., Running, Cycling, Push-ups"
              placeholderTextColor="#7C8DB0"
              autoFocus
            />

            <Text style={styles.workoutNote}>
              Enter the type of workout you're about to start. The timer will begin once you tap "Start".
            </Text>
          </View>
        </View>
      </Modal>

      {/* Workout Results Modal */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View />
            <Text style={styles.modalTitle}>Workout Complete!</Text>
            <TouchableOpacity onPress={() => setShowResultModal(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          {completedWorkout && (
            <ScrollView style={styles.resultsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.celebrationIcon}>
                <Ionicons name="trophy" size={64} color="#4CAF50" />
              </View>

              <Text style={styles.congratsText}>Great Job!</Text>
              <Text style={styles.workoutSummary}>
                You completed your {completedWorkout.activityName} workout
              </Text>

              <View style={styles.resultsStats}>
                <View style={styles.resultStat}>
                  <Ionicons name="time" size={24} color="#2196F3" />
                  <Text style={styles.resultStatValue}>{completedWorkout.duration} min</Text>
                  <Text style={styles.resultStatLabel}>Duration</Text>
                </View>
                <View style={styles.resultStat}>
                  <Ionicons name="flame" size={24} color="#FF9800" />
                  <Text style={styles.resultStatValue}>{completedWorkout.caloriesBurnt}</Text>
                  <Text style={styles.resultStatLabel}>Calories</Text>
                </View>
              </View>

              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>💡 Health Tips</Text>
                <Text style={styles.suggestionsText}>{completedWorkout.suggestions}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Meal Plan Modal */}
      <Modal
        visible={mealModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMealModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMealModalVisible(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log Meals</Text>
            <TouchableOpacity onPress={submitMealPlan} disabled={mealLoading}>
              <Text style={[styles.startButtonText, mealLoading && styles.disabledText]}>
                {mealLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner} showsVerticalScrollIndicator={false}>
            <View style={styles.workoutIconContainer}>
              <Ionicons name="restaurant" size={64} color="#4CAF50" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>🌅 Breakfast</Text>
              <TextInput
                style={styles.workoutInput}
                value={mealForm.breakfast}
                onChangeText={(text) => setMealForm({ ...mealForm, breakfast: text })}
                placeholder="e.g., Oatmeal with fruits, Eggs and toast"
                placeholderTextColor="#7C8DB0"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>☀️ Lunch</Text>
              <TextInput
                style={styles.workoutInput}
                value={mealForm.lunch}
                onChangeText={(text) => setMealForm({ ...mealForm, lunch: text })}
                placeholder="e.g., Salad, Rice and curry, Sandwich"
                placeholderTextColor="#7C8DB0"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>🌙 Dinner</Text>
              <TextInput
                style={styles.workoutInput}
                value={mealForm.dinner}
                onChangeText={(text) => setMealForm({ ...mealForm, dinner: text })}
                placeholder="e.g., Grilled chicken, Pasta, Soup"
                placeholderTextColor="#7C8DB0"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>🍎 Snacks (Optional)</Text>
              <TextInput
                style={styles.workoutInput}
                value={mealForm.snacks}
                onChangeText={(text) => setMealForm({ ...mealForm, snacks: text })}
                placeholder="e.g., Fruits, Nuts, Yogurt"
                placeholderTextColor="#7C8DB0"
                multiline
              />
            </View>

            <Text style={styles.workoutNote}>
              Log your meals to get personalized nutrition insights and recommendations.
            </Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Meal Results Modal */}
      <Modal
        visible={showMealResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealResultModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View />
            <Text style={styles.modalTitle}>Meal Analysis</Text>
            <TouchableOpacity onPress={() => setShowMealResultModal(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          {mealPlan && (
            <ScrollView style={styles.resultsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.celebrationIcon}>
                <Ionicons name="nutrition" size={64} color="#4CAF50" />
              </View>

              <Text style={styles.congratsText}>Meals Logged!</Text>
              <Text style={styles.workoutSummary}>
                Your daily nutrition has been analyzed
              </Text>

              {/* Nutrition Stats */}
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionCard}>
                  <Ionicons name="flame" size={24} color="#FF9800" />
                  <Text style={styles.nutritionValue}>{mealPlan.totalCalories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                <View style={styles.nutritionCard}>
                  <Ionicons name="fitness" size={24} color="#E91E63" />
                  <Text style={styles.nutritionValue}>{mealPlan.proteinGrams}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
                <View style={styles.nutritionCard}>
                  <Ionicons name="leaf" size={24} color="#4CAF50" />
                  <Text style={styles.nutritionValue}>{mealPlan.carbsGrams}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.nutritionCard}>
                  <Ionicons name="water" size={24} color="#2196F3" />
                  <Text style={styles.nutritionValue}>{mealPlan.fatsGrams}g</Text>
                  <Text style={styles.nutritionLabel}>Fats</Text>
                </View>
              </View>

              {/* Meals Summary */}
              <View style={styles.mealsContainer}>
                <Text style={styles.mealsTitle}>📋 Today's Meals</Text>

                {mealPlan.breakfast && (
                  <View style={styles.mealItem}>
                    <Text style={styles.mealTime}>🌅 Breakfast</Text>
                    <Text style={styles.mealDescription}>{mealPlan.breakfast}</Text>
                  </View>
                )}

                {mealPlan.lunch && (
                  <View style={styles.mealItem}>
                    <Text style={styles.mealTime}>☀️ Lunch</Text>
                    <Text style={styles.mealDescription}>{mealPlan.lunch}</Text>
                  </View>
                )}

                {mealPlan.dinner && (
                  <View style={styles.mealItem}>
                    <Text style={styles.mealTime}>🌙 Dinner</Text>
                    <Text style={styles.mealDescription}>{mealPlan.dinner}</Text>
                  </View>
                )}

                {mealPlan.snacks && (
                  <View style={styles.mealItem}>
                    <Text style={styles.mealTime}>🍎 Snacks</Text>
                    <Text style={styles.mealDescription}>{mealPlan.snacks}</Text>
                  </View>
                )}
              </View>

              {/* AI Suggestions */}
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>🤖 AI Analysis</Text>
                <Text style={styles.suggestionsText}>{mealSuggestions.suggestions}</Text>
              </View>

              {/* Next Meal Recommendation */}
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>🍽️ Next Meal Suggestion</Text>
                <Text style={styles.recommendationText}>{mealSuggestions.nextMealRecommendation}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (width - 50) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 12,
    color: '#7C8DB0',
    fontWeight: '500',
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  metricUnit: {
    fontSize: 12,
    color: '#7C8DB0',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E8EBF0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#7C8DB0',
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressChart: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#7C8DB0',
    marginTop: 4,
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
  additionalStats: {
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7C8DB0',
    textAlign: 'center',
  },
  // Workout Timer Styles
  timerOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timerContainer: {
    padding: 20,
  },
  timerContent: {
    alignItems: 'center',
  },
  timerWorkoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 12,
    fontFamily: 'monospace',
  },
  stopButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stopButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
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
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalContentInner: {
    alignItems: 'center',
  },
  workoutIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  workoutInput: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 16,
  },
  workoutNote: {
    fontSize: 14,
    color: '#7C8DB0',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Results Modal Styles
  resultsContent: {
    flex: 1,
    padding: 20,
  },
  celebrationIcon: {
    alignItems: 'center',
    marginVertical: 20,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  workoutSummary: {
    fontSize: 16,
    color: '#7C8DB0',
    textAlign: 'center',
    marginBottom: 30,
    textTransform: 'capitalize',
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  resultStat: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginVertical: 8,
  },
  resultStatLabel: {
    fontSize: 12,
    color: '#7C8DB0',
    textAlign: 'center',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  suggestionsText: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 20,
  },
  // Daily Progress Styles
  dailyProgressSection: {
    marginBottom: 20,
  },
  activitiesContainer: {
    marginTop: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
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
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#7C8DB0',
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 2,
  },
  activityCalories: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  activityTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8ffe3ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  activityTipText: {
    fontSize: 12,
    color: '#51e600ff',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginRight: 4,
  },
  // Meal Modal Styles
  formGroup: {
    marginBottom: 20,
  },
  disabledText: {
    color: '#7C8DB0',
  },
  // Meal Results Styles
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
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
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginVertical: 8,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#7C8DB0',
    textAlign: 'center',
  },
  mealsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  mealItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  recommendationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#388E3C',
    lineHeight: 20,
  },
});