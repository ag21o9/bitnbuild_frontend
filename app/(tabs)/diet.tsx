import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

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

interface MealPlansResponse {
  success: boolean;
  message: string;
  data: {
    mealPlans: MealPlan[];
    total: number;
  };
}

interface SingleMealResponse {
  success: boolean;
  message: string;
  data: {
    mealPlan: MealPlan;
  };
}

interface WeightGoalSuggestions {
  userProfile: {
    currentWeight: number;
    targetWeight: number;
    weightToChange: number;
    goalType: string;
    currentBMI: number;
    targetBMI: number;
  };
  suggestions: {
    suggestedMealPlan: string;
    suggestedExercise: string;
    toAvoid: string;
  };
}

interface WeightGoalResponse {
  success: boolean;
  message: string;
  data: WeightGoalSuggestions;
}

const MacroCard: React.FC<{
  icon: string;
  label: string;
  value: number;
  unit: string;
  color: string;
}> = ({ icon, label, value, unit, color }) => (
  <View style={styles.macroCard}>
    <View style={[styles.macroIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text style={styles.macroValue}>{value}{unit}</Text>
    <Text style={styles.macroLabel}>{label}</Text>
  </View>
);

const MealCard: React.FC<{
  title: string;
  content: string;
  icon: string;
  time: string;
}> = ({ title, content, icon, time }) => (
  <View style={styles.mealCard}>
    <View style={styles.mealHeader}>
      <View style={styles.mealTitleContainer}>
        <View style={styles.mealIconContainer}>
          <Text style={styles.mealEmoji}>{icon}</Text>
        </View>
        <View>
          <Text style={styles.mealTitle}>{title}</Text>
          <Text style={styles.mealTime}>{time}</Text>
        </View>
      </View>
    </View>
    <Text style={styles.mealContent}>{content || 'No meal planned'}</Text>
  </View>
);

export default function DietScreen() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [currentMeal, setCurrentMeal] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showWeightGoalModal, setShowWeightGoalModal] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [weightGoalSuggestions, setWeightGoalSuggestions] = useState<WeightGoalSuggestions | null>(null);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [loadingWeightGoal, setLoadingWeightGoal] = useState(false);
  const router = useRouter();

  const fetchMealPlans = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/stats/meals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: MealPlansResponse = await response.json();
        console.log('Meal plans:', data);
        if (data.success && data.data && data.data.mealPlans) {
          setMealPlans(data.data.mealPlans);
          // Set current meal to today's meal if available
          const today = new Date().toISOString().split('T')[0];
          const todayMeal = data.data.mealPlans.find(meal =>
            meal.date.split('T')[0] === today
          );
          if (todayMeal) {
            setCurrentMeal(todayMeal);
          }
        }
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        console.warn('Failed to fetch meal plans');
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      Alert.alert('Error', 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchMealByDate = async (date: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`https://bitnbuild-brown.vercel.app/api/stats/meals/${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: SingleMealResponse = await response.json();
        console.log('Meal for date:', data);
        if (data.success && data.data && data.data.mealPlan) {
          setCurrentMeal(data.data.mealPlan);
          setShowDetailsModal(true);
        }
      } else if (response.status === 404) {
        Alert.alert('No Meal Plan', `No meal plan found for ${date}`);
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to fetch meal plan for selected date');
      }
    } catch (error) {
      console.error('Error fetching meal by date:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMealPlans();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRelativeDateText = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const setWeightGoal = async () => {
    if (!targetWeight || isNaN(Number(targetWeight))) {
      Alert.alert('Invalid Input', 'Please enter a valid target weight');
      return;
    }

    setLoadingWeightGoal(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/stats/weight-goal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetWeight: Number(targetWeight),
        }),
      });

      if (response.ok) {
        const data: WeightGoalResponse = await response.json();
        console.log('Weight goal suggestions:', data);
        if (data.success && data.data) {
          setWeightGoalSuggestions(data.data);
          setShowWeightGoalModal(false);
          setShowSuggestionsModal(true);
          setTargetWeight('');
        }
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to get weight goal suggestions');
      }
    } catch (error) {
      console.error('Error setting weight goal:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoadingWeightGoal(false);
    }
  };

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const todaysMeal = currentMeal;
  const totalCalories = todaysMeal?.totalCalories || 0;
  const protein = todaysMeal?.proteinGrams || 0;
  const carbs = todaysMeal?.carbsGrams || 0;
  const fats = todaysMeal?.fatsGrams || 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading meal plans...</Text>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Diet & Nutrition</Text>
                <Text style={styles.headerSubtitle}>
                  {todaysMeal ? formatDate(todaysMeal.date) : "No meal plan for today"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.weightGoalButton}
                onPress={() => setShowWeightGoalModal(true)}
              >
                <Ionicons name="fitness" size={20} color="white" />
                <Text style={styles.weightGoalButtonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>

            {/* Today's Summary */}
            {todaysMeal && (
              <View style={styles.summaryCard}>
                <View style={styles.caloriesSummary}>
                  <Text style={styles.caloriesNumber}>{totalCalories}</Text>
                  <Text style={styles.caloriesLabel}>Total Calories   </Text>
                </View>
              </View>
            )}
          </LinearGradient>

          <View style={styles.content}>
            {/* Macros Overview */}
            {todaysMeal && (
              <View style={styles.macrosSection}>
                <Text style={styles.sectionTitle}>Macronutrients</Text>
                <View style={styles.macrosGrid}>
                  <MacroCard
                    icon="flame"
                    label="Calories"
                    value={totalCalories}
                    unit=""
                    color="#FF9800"
                  />
                  <MacroCard
                    icon="fitness"
                    label="Protein"
                    value={protein}
                    unit="g"
                    color="#E91E63"
                  />
                  <MacroCard
                    icon="leaf"
                    label="Carbs"
                    value={carbs}
                    unit="g"
                    color="#4CAF50"
                  />
                  <MacroCard
                    icon="water"
                    label="Fats"
                    value={fats}
                    unit="g"
                    color="#2196F3"
                  />
                </View>
              </View>
            )}

            {/* Today's Meals */}
            {todaysMeal ? (
              <View style={styles.mealsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Today's Meals</Text>
                  <TouchableOpacity onPress={() => setShowDetailsModal(true)}>
                    <Text style={styles.viewAllText}>View Details</Text>
                  </TouchableOpacity>
                </View>

                <MealCard
                  title="Breakfast"
                  content={todaysMeal.breakfast}
                  icon="🌅"
                  time="8:00 AM"
                />
                <MealCard
                  title="Lunch"
                  content={todaysMeal.lunch}
                  icon="☀️"
                  time="1:00 PM"
                />
                <MealCard
                  title="Dinner"
                  content={todaysMeal.dinner}
                  icon="🌙"
                  time="7:00 PM"
                />
                {todaysMeal.snacks && (
                  <MealCard
                    title="Snacks"
                    content={todaysMeal.snacks}
                    icon="🍎"
                    time="Anytime"
                  />
                )}
              </View>
            ) : (
              <View style={styles.noMealsContainer}>
                <Ionicons name="restaurant" size={64} color="#E8EBF0" />
                <Text style={styles.noMealsTitle}>No Meal Plan Today</Text>
                <Text style={styles.noMealsSubtitle}>
                  Log your meals in the dashboard to see your nutrition plan here
                </Text>
                <TouchableOpacity
                  style={styles.addMealButton}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addMealButtonText}>Log Meals</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Meal History */}
            {mealPlans.length > 1 && (
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>Meal History</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mealPlans
                    .filter(meal => meal.id !== todaysMeal?.id)
                    .slice(0, 7)
                    .map((meal) => (
                      <TouchableOpacity
                        key={meal.id}
                        style={styles.historyCard}
                        onPress={() => fetchMealByDate(meal.date.split('T')[0])}
                      >
                        <Text style={styles.historyDate}>
                          {getRelativeDateText(meal.date)}
                        </Text>
                        <Text style={styles.historyCalories}>
                          {meal.totalCalories} cal
                        </Text>
                        <View style={styles.historyMacros}>
                          <Text style={styles.historyMacro}>P: {meal.proteinGrams}g</Text>
                          <Text style={styles.historyMacro}>C: {meal.carbsGrams}g</Text>
                          <Text style={styles.historyMacro}>F: {meal.fatsGrams}g</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Ionicons name="add" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Log New Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => router.push('/(tabs)/chat')}
                >
                  <Ionicons name="chatbubble" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Ask AI</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Meal Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View />
            <Text style={styles.modalTitle}>
              {currentMeal ? formatDate(currentMeal.date) : 'Meal Details'}
            </Text>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          {currentMeal && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Nutrition Overview */}
              <View style={styles.nutritionOverview}>
                <Text style={styles.nutritionTitle}>Nutrition Overview</Text>
                <View style={styles.nutritionStats}>
                  <View style={styles.nutritionStat}>
                    <Ionicons name="flame" size={32} color="#FF9800" />
                    <Text style={styles.nutritionValue}>{currentMeal.totalCalories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={styles.nutritionStat}>
                    <Ionicons name="fitness" size={32} color="#E91E63" />
                    <Text style={styles.nutritionValue}>{currentMeal.proteinGrams}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionStat}>
                    <Ionicons name="leaf" size={32} color="#4CAF50" />
                    <Text style={styles.nutritionValue}>{currentMeal.carbsGrams}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionStat}>
                    <Ionicons name="water" size={32} color="#2196F3" />
                    <Text style={styles.nutritionValue}>{currentMeal.fatsGrams}g</Text>
                    <Text style={styles.nutritionLabel}>Fats</Text>
                  </View>
                </View>
              </View>

              {/* Meal Details */}
              <View style={styles.mealDetailsSection}>
                <Text style={styles.mealDetailsTitle}>Meal Plan</Text>

                <View style={styles.mealDetailCard}>
                  <Text style={styles.mealDetailTitle}>🌅 Breakfast</Text>
                  <Text style={styles.mealDetailContent}>
                    {currentMeal.breakfast || 'No breakfast planned'}
                  </Text>
                </View>

                <View style={styles.mealDetailCard}>
                  <Text style={styles.mealDetailTitle}>☀️ Lunch</Text>
                  <Text style={styles.mealDetailContent}>
                    {currentMeal.lunch || 'No lunch planned'}
                  </Text>
                </View>

                <View style={styles.mealDetailCard}>
                  <Text style={styles.mealDetailTitle}>🌙 Dinner</Text>
                  <Text style={styles.mealDetailContent}>
                    {currentMeal.dinner || 'No dinner planned'}
                  </Text>
                </View>

                {currentMeal.snacks && (
                  <View style={styles.mealDetailCard}>
                    <Text style={styles.mealDetailTitle}>🍎 Snacks</Text>
                    <Text style={styles.mealDetailContent}>{currentMeal.snacks}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Weight Goal Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWeightGoalModal}
        onRequestClose={() => setShowWeightGoalModal(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            style={styles.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowWeightGoalModal(false)}
          />
          <View style={styles.bottomSheetContainer}>
            {/* Handle Bar */}
            <View style={styles.bottomSheetHandle} />

            {/* Content */}
            <View style={styles.bottomSheetContent}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Set Weight Goal</Text>
                <Text style={styles.bottomSheetSubtitle}>
                  Enter your target weight to get personalized meal plans and exercise recommendations
                </Text>
              </View>

              <View style={styles.weightGoalForm}>
                <Text style={styles.inputLabel}>Target Weight</Text>
                <View style={styles.weightInputWrapper}>
                  <TextInput
                    style={styles.weightInputField}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    placeholder="65"
                    keyboardType="numeric"
                    placeholderTextColor="#A0AEC0"
                  />
                  <View style={styles.unitContainer}>
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>

                <Text style={styles.helperText}>
                  💡 We'll provide personalized suggestions based on your goal
                </Text>
              </View>

              <View style={styles.bottomSheetActions}>
                <TouchableOpacity
                  style={styles.bottomSheetCancelButton}
                  onPress={() => setShowWeightGoalModal(false)}
                >
                  <Text style={styles.bottomSheetCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.bottomSheetSubmitButton, loadingWeightGoal && styles.disabledButton]}
                  onPress={setWeightGoal}
                  disabled={loadingWeightGoal || !targetWeight}
                >
                  <LinearGradient
                    colors={loadingWeightGoal ? ['#A0AEC0', '#A0AEC0'] : ['#9C27B0', '#7B1FA2']}
                    style={styles.bottomSheetSubmitGradient}
                  >
                    {loadingWeightGoal ? (
                      <View style={styles.loadingContent}>
                        <Ionicons name="refresh" size={20} color="white" />
                        <Text style={styles.bottomSheetSubmitText}>Getting Suggestions...</Text>
                      </View>
                    ) : (
                      <View style={styles.submitContent}>
                        <Text style={styles.bottomSheetSubmitText}>Get Personalized Plan</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weight Goal Suggestions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSuggestionsModal}
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.suggestionsModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Personalized Plan</Text>
              <TouchableOpacity onPress={() => setShowSuggestionsModal(false)}>
                <Ionicons name="close" size={24} color="#7C8DB0" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.suggestionsContent} showsVerticalScrollIndicator={false}>
              {weightGoalSuggestions && (
                <>
                  {/* User Profile Section */}
                  <View style={styles.profileSection}>
                    <Text style={styles.sectionTitle}>Your Goal Overview</Text>
                    <View style={styles.goalCard}>
                      <View style={styles.goalRow}>
                        <Text style={styles.goalLabel}>Current Weight:</Text>
                        <Text style={styles.goalValue}>{weightGoalSuggestions.userProfile.currentWeight} kg</Text>
                      </View>
                      <View style={styles.goalRow}>
                        <Text style={styles.goalLabel}>Target Weight:</Text>
                        <Text style={styles.goalValue}>{weightGoalSuggestions.userProfile.targetWeight} kg</Text>
                      </View>
                      <View style={styles.goalRow}>
                        <Text style={styles.goalLabel}>Weight Change:</Text>
                        <Text style={[styles.goalValue, { color: weightGoalSuggestions.userProfile.weightToChange < 0 ? '#4CAF50' : '#FF9800' }]}>
                          {weightGoalSuggestions.userProfile.weightToChange > 0 ? '+' : ''}{weightGoalSuggestions.userProfile.weightToChange} kg
                        </Text>
                      </View>
                      <View style={styles.goalRow}>
                        <Text style={styles.goalLabel}>Goal Type:</Text>
                        <Text style={styles.goalValue}>{weightGoalSuggestions.userProfile.goalType}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Meal Plan Suggestions */}
                  <View style={styles.suggestionSection}>
                    <View style={styles.suggestionHeader}>
                      <Ionicons name="restaurant" size={20} color="#FF9800" />
                      <Text style={styles.suggestionTitle}>Recommended Meal Plan</Text>
                    </View>
                    <Text style={styles.suggestionContent}>{weightGoalSuggestions.suggestions.suggestedMealPlan}</Text>
                  </View>

                  {/* Exercise Suggestions */}
                  <View style={styles.suggestionSection}>
                    <View style={styles.suggestionHeader}>
                      <Ionicons name="fitness" size={20} color="#4CAF50" />
                      <Text style={styles.suggestionTitle}>Exercise Recommendations</Text>
                    </View>
                    <Text style={styles.suggestionContent}>{weightGoalSuggestions.suggestions.suggestedExercise}</Text>
                  </View>

                  {/* Foods to Avoid */}
                  <View style={styles.suggestionSection}>
                    <View style={styles.suggestionHeader}>
                      <Ionicons name="warning" size={20} color="#F44336" />
                      <Text style={styles.suggestionTitle}>Foods & Habits to Avoid</Text>
                    </View>
                    <Text style={styles.suggestionContent}>{weightGoalSuggestions.suggestions.toAvoid}</Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
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
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  caloriesSummary: {
    alignItems: 'center',
  },
  caloriesNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  caloriesLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
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
  viewAllText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  macrosSection: {
    marginBottom: 30,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  macroCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 50) / 2,
    marginBottom: 12,
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
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#7C8DB0',
    textAlign: 'center',
  },
  mealsSection: {
    marginBottom: 30,
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealEmoji: {
    fontSize: 18,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  mealTime: {
    fontSize: 12,
    color: '#7C8DB0',
    marginTop: 2,
  },
  mealContent: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  noMealsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noMealsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  noMealsSubtitle: {
    fontSize: 14,
    color: '#7C8DB0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addMealButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addMealButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  historySection: {
    marginBottom: 30,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  historyCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 8,
  },
  historyMacros: {
    alignItems: 'center',
  },
  historyMacro: {
    fontSize: 10,
    color: '#7C8DB0',
    marginBottom: 2,
  },
  actionsSection: {
    marginBottom: 20,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  nutritionOverview: {
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
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  nutritionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionStat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
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
  mealDetailsSection: {
    marginBottom: 20,
  },
  mealDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  mealDetailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  mealDetailContent: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  weightGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  weightGoalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  suggestionsModalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area for home indicator
    maxHeight: '80%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  bottomSheetHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomSheetSubtitle: {
    fontSize: 16,
    color: '#7C8DB0',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  weightGoalForm: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  weightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8EBF0',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  weightInputField: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    paddingVertical: 18,
  },
  unitContainer: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#7C8DB0',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bottomSheetCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E8EBF0',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  bottomSheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C8DB0',
  },
  bottomSheetSubmitButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bottomSheetSubmitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  weightGoalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  weightGoalInput: {
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContent: {
    padding: 20,
  },
  profileSection: {
    marginBottom: 24,
  },
  goalCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 14,
    color: '#7C8DB0',
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  suggestionSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  suggestionContent: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 22,
  },
});