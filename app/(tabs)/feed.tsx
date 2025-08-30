import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 160; // Approximate header height
const TAB_HEIGHT = 80; // Approximate bottom tab height
const AVAILABLE_HEIGHT = height - HEADER_HEIGHT - TAB_HEIGHT;

interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: 'nutrition' | 'workout' | 'sleep' | 'wellness';
  image: string;
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
  duration?: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  avatar: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  duration: string;
  type: string;
  trainer: string;
  creatorId: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  registrations: any[];
  participantCount: number;
  // UI-only properties
  image?: string;
  category?: string;
  isAttending?: boolean;
  title?: string;
  date?: string;
  time?: string;
  attendees?: number;
}

interface EventsResponse {
  success: boolean;
  message: string;
  data: {
    events: Event[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalEvents: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const iconProps = { size: 16, color: 'white' } as const;

  switch (category) {
    case 'nutrition':
      return <Ionicons name="nutrition" {...iconProps} />;
    case 'workout':
      return <Ionicons name="barbell" {...iconProps} />;
    case 'sleep':
      return <Ionicons name="moon" {...iconProps} />;
    default:
      return <Ionicons name="trending-up" {...iconProps} />;
  }
};

const EventCard: React.FC<{
  event: Event;
  onAttend: (id: string) => void;
}> = ({ event, onAttend }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workshop': return '#2196F3';
      case 'fitness': return '#FF5722';
      case 'nutrition': return '#4CAF50';
      case 'Yoga': return '#9C27B0';
      default: return '#9C27B0';
    }
  };

  // Get random image for static display
  const getRandomImage = () => {
    const images = [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop'
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <View style={styles.eventCard}>
      <Image source={{ uri: event.image || getRandomImage() }} style={styles.eventImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.eventImageOverlay}
      />

      <View style={[styles.eventCategoryBadge, { backgroundColor: getCategoryColor(event.type || event.category || 'workshop') }]}>
        <Text style={styles.eventCategoryText}>{event.type || 'Workshop'}</Text>
      </View>

      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.name || event.title}</Text>
        <Text style={styles.eventDescription}>{event.description}</Text>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailItem}>
            <Ionicons name="calendar" size={16} color="#7C8DB0" />
            <Text style={styles.eventDetailText}>
              {event.date || formatDate(event.eventDate)}
            </Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="time" size={16} color="#7C8DB0" />
            <Text style={styles.eventDetailText}>
              {event.time || formatTime(event.eventDate)}
            </Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="location" size={16} color="#7C8DB0" />
            <Text style={styles.eventDetailText}>{event.location}</Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="person" size={16} color="#7C8DB0" />
            <Text style={styles.eventDetailText}>Trainer: {event.trainer}</Text>
          </View>
        </View>

        <View style={styles.eventActions}>
          <Text style={styles.attendeesText}>
            {event.attendees || event.participantCount} attending
          </Text>
          <TouchableOpacity
            style={[styles.attendButton, event.isAttending && styles.attendingButton]}
            onPress={() => onAttend(event.id)}
          >
            <Text style={[styles.attendButtonText, event.isAttending && styles.attendingButtonText]}>
              {event.isAttending ? 'Registered' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TikTokTipCard: React.FC<{
  tip: HealthTip;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onComment: (id: string) => void;
}> = ({ tip, onLike, onBookmark, onComment }) => {
  return (
    <View style={styles.tikTokCard}>
      <Image source={{ uri: tip.image }} style={styles.tikTokImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.tikTokOverlay}
      />

      <View style={styles.tikTokContent}>
        <Text style={styles.tikTokTitle}>{tip.title}</Text>
        <Text style={styles.tikTokDescription}>{tip.description}</Text>

        {/* <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tip.category) }]}>
          <CategoryIcon category={tip.category} />
          <Text style={styles.categoryText}>{tip.category}</Text>
        </View> */}
      </View>

      <View style={styles.tikTokActions}>
        <TouchableOpacity
          style={styles.tikTokActionButton}
          onPress={() => onLike(tip.id)}
        >
          <Ionicons
            size={28}
            name={tip.isLiked ? 'heart' : 'heart-outline'}
            color={tip.isLiked ? '#E91E63' : 'white'}
          />
          <Text style={styles.tikTokActionText}>{tip.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tikTokActionButton}
          onPress={() => onComment(tip.id)}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="white" />
          <Text style={styles.tikTokActionText}>{tip.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tikTokActionButton}
          onPress={() => onBookmark(tip.id)}
        >
          <Ionicons
            size={28}
            name={tip.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            color={tip.isBookmarked ? '#FF9800' : 'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tikTokActionButton}>
          <Ionicons name="share-social" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HealthTipCard: React.FC<{
  tip: HealthTip;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
}> = ({ tip, onLike, onBookmark }) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return '#4CAF50';
      case 'workout': return '#FF5722';
      case 'sleep': return '#9C27B0';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.tipCard}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: tip.image }} style={styles.tipImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />

        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tip.category) }]}>
          <CategoryIcon category={tip.category} />
          <Text style={styles.categoryText}>{tip.category}</Text>
        </View>

        {tip.duration && (
          <View style={styles.durationBadge}>
            <Ionicons name="play" size={12} color="white" />
            <Text style={styles.durationText}>{tip.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipDescription}>{tip.description}</Text>

        <View style={styles.tipActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(tip.id)}
          >
            <Ionicons
              size={20}
              name={tip.isLiked ? 'heart' : 'heart-outline'}
              color={tip.isLiked ? '#E91E63' : '#7C8DB0'}
            />
            <Text style={[styles.actionText, tip.isLiked && styles.likedText]}>
              {tip.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social" size={20} color="#7C8DB0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onBookmark(tip.id)}
          >
            <Ionicons
              size={20}
              name={tip.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              color={tip.isBookmarked ? '#FF9800' : '#7C8DB0'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'nutrition': return '#4CAF50';
    case 'workout': return '#FF5722';
    case 'sleep': return '#9C27B0';
    default: return '#2196F3';
  }
};

const CommentsModal: React.FC<{
  visible: boolean;
  tip: HealthTip | null;
  onClose: () => void;
  onAddComment: (tipId: string, comment: string) => void;
}> = ({ visible, tip, onClose, onAddComment }) => {
  const [newComment, setNewComment] = useState<string>('');

  const handleAddComment = () => {
    if (newComment.trim() && tip) {
      onAddComment(tip.id, newComment.trim());
      setNewComment('');
    }
  };

  if (!tip) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#2C3E50" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={tip.comments}
          keyExtractor={(item) => item.id}
          style={styles.commentsList}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentUser}>{item.user}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
                <Text style={styles.commentTime}>{item.timestamp}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.commentInput}>
          <TextInput
            style={styles.commentTextInput}
            placeholder="Add a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Ionicons name="send" size={20} color={newComment.trim() ? '#4CAF50' : '#7C8DB0'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'events' | 'tips'>('events');
  const [commentsModalVisible, setCommentsModalVisible] = useState<boolean>(false);
  const [selectedTip, setSelectedTip] = useState<HealthTip | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Static images array for random assignment
  const staticImages = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
    'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop'
  ];

  const fetchEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/events/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: EventsResponse = await response.json();
        console.log('Events data:', data);
        if (data.success && data.data && data.data.events) {
          // Add UI properties to events
          const eventsWithUI = data.data.events.map((event, index) => ({
            ...event,
            image: staticImages[index % staticImages.length],
            isAttending: event.registrations.some((reg: any) => reg.userId === token), // Check if user is registered
          }));
          setEvents(eventsWithUI);
        }
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        console.warn('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const event = events.find(e => e.id === eventId);
      const endpoint = event?.isAttending ? 'unregister' : 'register';
      const method = event?.isAttending ? 'DELETE' : 'POST';

      const response = await fetch(`https://bitnbuild-brown.vercel.app/api/events/${eventId}/${endpoint}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setEvents(prev => prev.map(e =>
          e.id === eventId
            ? {
              ...e,
              isAttending: !e.isAttending,
              participantCount: e.isAttending ? e.participantCount - 1 : e.participantCount + 1,
              attendees: e.isAttending ? (e.attendees || 0) - 1 : (e.attendees || 0) + 1
            }
            : e
        ));

        Alert.alert(
          'Success',
          event?.isAttending ? 'Unregistered from event' : 'Registered for event'
        );
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to update registration');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const [tips, setTips] = useState<HealthTip[]>([
    {
      id: '1',
      title: '5 Superfoods for Energy',
      description: 'Discover natural foods that boost your energy levels throughout the day without the crash.',
      category: 'nutrition',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=600&fit=crop',
      likes: 234,
      isLiked: false,
      isBookmarked: false,
      duration: '2 min',
      comments: [
        {
          id: '1',
          user: 'Sarah M.',
          text: 'This is so helpful! I\'ve been looking for natural energy boosters.',
          timestamp: '2h ago',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        },
        {
          id: '2',
          user: 'Mike R.',
          text: 'Great tips! Already added spinach to my morning smoothie.',
          timestamp: '4h ago',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        },
      ],
    },
    {
      id: '2',
      title: '10-Minute Morning Workout',
      description: 'Start your day with this energizing routine that requires no equipment.',
      category: 'workout',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop',
      likes: 456,
      isLiked: true,
      isBookmarked: true,
      duration: '10 min',
      comments: [
        {
          id: '3',
          user: 'Emma L.',
          text: 'Perfect for busy mornings! Love this routine.',
          timestamp: '1h ago',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        },
      ],
    },
    {
      id: '3',
      title: 'Better Sleep in 7 Days',
      description: 'Simple habits that will transform your sleep quality and help you wake up refreshed.',
      category: 'sleep',
      image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=600&fit=crop',
      likes: 189,
      isLiked: false,
      isBookmarked: false,
      duration: '3 min',
      comments: [],
    },
    {
      id: '4',
      title: 'Hydration Hacks',
      description: 'Creative ways to drink more water and stay hydrated throughout your busy day.',
      category: 'wellness',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=600&fit=crop',
      likes: 312,
      isLiked: false,
      isBookmarked: false,
      duration: '1 min',
      comments: [
        {
          id: '4',
          user: 'Alex K.',
          text: 'The fruit infusion idea is genius!',
          timestamp: '3h ago',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        },
      ],
    },
    {
      id: '5',
      title: 'Protein Power Bowl',
      description: 'Build the perfect post-workout meal with these protein-packed ingredients.',
      category: 'nutrition',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=600&fit=crop',
      likes: 278,
      isLiked: false,
      isBookmarked: true,
      duration: '4 min',
      comments: [
        {
          id: '5',
          user: 'Lisa P.',
          text: 'Made this yesterday - so delicious and filling!',
          timestamp: '5h ago',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face',
        },
        {
          id: '6',
          user: 'Tom W.',
          text: 'What\'s the best protein powder to use?',
          timestamp: '6h ago',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face',
        },
      ],
    },
  ]);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const flatListRef = useRef<FlatList>(null);

  const categories = [
    { id: 'all', name: 'All', color: '#2196F3' },
    { id: 'nutrition', name: 'Nutrition', color: '#4CAF50' },
    { id: 'workout', name: 'Workout', color: '#FF5722' },
    { id: 'sleep', name: 'Sleep', color: '#9C27B0' },
    { id: 'wellness', name: 'Wellness', color: '#FF9800' },
  ];

  const handleLike = (id: string) => {
    setTips(prev => prev.map(tip =>
      tip.id === id
        ? {
          ...tip,
          isLiked: !tip.isLiked,
          likes: tip.isLiked ? tip.likes - 1 : tip.likes + 1
        }
        : tip
    ));
  };

  const handleBookmark = (id: string) => {
    setTips(prev => prev.map(tip =>
      tip.id === id ? { ...tip, isBookmarked: !tip.isBookmarked } : tip
    ));
  };

  const handleAttend = (id: string) => {
    handleRegisterEvent(id);
  };

  const handleComment = (id: string) => {
    const tip = tips.find(t => t.id === id);
    if (tip) {
      setSelectedTip(tip);
      setCommentsModalVisible(true);
    }
  };

  const handleAddComment = (tipId: string, commentText: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      user: 'You',
      text: commentText,
      timestamp: 'now',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face',
    };

    setTips(prev => prev.map(tip =>
      tip.id === tipId
        ? { ...tip, comments: [...tip.comments, newComment] }
        : tip
    ));

    if (selectedTip && selectedTip.id === tipId) {
      setSelectedTip(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
    }
  };

  const filteredTips = activeCategory === 'all'
    ? tips
    : tips.filter(tip => tip.category === activeCategory);

  const renderTikTokTip = ({ item }: { item: HealthTip }) => (
    <TikTokTipCard
      tip={item}
      onLike={handleLike}
      onBookmark={handleBookmark}
      onComment={handleComment}
    />
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#9C27B0', '#7B1FA2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Health Feed</Text>
        <Text style={styles.headerSubtitle}>Events & AI-powered tips</Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tips' && styles.activeTab]}
            onPress={() => setActiveTab('tips')}
          >
            <Text style={[styles.tabText, activeTab === 'tips' && styles.activeTabText]}>AI Tips</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'events' ? (
        <ScrollView
          style={styles.feedContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onAttend={handleAttend}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar" size={64} color="#E8EBF0" />
              <Text style={styles.emptyTitle}>No Events Available</Text>
              <Text style={styles.emptySubtitle}>Check back later for upcoming fitness events</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.tikTokContainer}>
          <FlatList
            ref={flatListRef}
            data={filteredTips}
            renderItem={renderTikTokTip}
            keyExtractor={(item) => item.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={AVAILABLE_HEIGHT}
            snapToAlignment="start"
            decelerationRate="fast"
            style={styles.tikTokFlatList}
            getItemLayout={(data, index) => ({
              length: AVAILABLE_HEIGHT,
              offset: AVAILABLE_HEIGHT * index,
              index,
            })}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesOverlay}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButtonOverlay,
                  { backgroundColor: activeCategory === category.id ? category.color : 'rgba(255,255,255,0.2)' }
                ]}
                onPress={() => setActiveCategory(category.id)}
              >
                <Text style={[
                  styles.categoryButtonTextOverlay,
                  { color: 'white' }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <CommentsModal
        visible={commentsModalVisible}
        tip={selectedTip}
        onClose={() => {
          setCommentsModalVisible(false);
          setSelectedTip(null);
        }}
        onAddComment={handleAddComment}
      />
    </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  categoriesContainer: {
    marginVertical: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8EBF0',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  feedContainer: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  tipImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  durationBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  tipContent: {
    padding: 20,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 20,
    marginBottom: 16,
  },
  tipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#7C8DB0',
    marginLeft: 4,
    fontWeight: '600',
  },
  likedText: {
    color: '#E91E63',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#9C27B0',
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  eventImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  eventCategoryBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  eventCategoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 20,
    marginBottom: 16,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#7C8DB0',
    marginLeft: 8,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: 14,
    color: '#7C8DB0',
    fontWeight: '600',
  },
  attendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  attendingButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  attendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  attendingButtonText: {
    color: '#4CAF50',
  },
  tikTokContainer: {
    flex: 1,
    position: 'relative',
  },
  tikTokFlatList: {
    flex: 1,
  },
  tikTokCard: {
    width: width,
    height: AVAILABLE_HEIGHT,
    position: 'relative',
  },
  tikTokImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tikTokOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  tikTokContent: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 80,
  },
  tikTokTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tikTokDescription: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
    marginBottom: 12,
  },
  tikTokActions: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'center',
  },
  tikTokActionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tikTokActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  categoriesOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
  },
  categoryButtonOverlay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 12,
    marginLeft: 12,
  },
  categoryButtonTextOverlay: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  commentsList: {
    flex: 1,
    padding: 20,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#7C8DB0',
    lineHeight: 18,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8EBF0',
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});