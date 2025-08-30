import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <View style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.botMessage]}>
    <View style={styles.messageHeader}>
      <View style={[styles.avatar, message.isUser ? styles.userAvatar : styles.botAvatar]}>
        {message.isUser ? (
          <Ionicons name="person" size={16} color="white" />
        ) : (
          <Ionicons name="sparkles" size={16} color="white" />
        )}
      </View>
    </View>
    <View style={[styles.messageBubble, message.isUser ? styles.userBubble : styles.botBubble]}>
      <Text style={[styles.messageText, message.isUser ? styles.userText : styles.botText]}>
        {message.text}
      </Text>
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  </View>
);

const QuickQuestion: React.FC<{ question: string; onPress: () => void }> = ({ question, onPress }) => (
  <TouchableOpacity style={styles.quickQuestion} onPress={onPress}>
    <Text style={styles.quickQuestionText}>{question}</Text>
  </TouchableOpacity>
);

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your AI fitness and nutrition assistant. I can help you with workout plans, meal planning, nutrition questions, supplement advice, and healthy lifestyle tips. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const quickQuestions = [
    "What should I eat for breakfast?     ",
    "How much protein do I need daily?     ",
    "Best foods for weight loss?        ",
    "Healthy snack ideas?    ",
    "Create a workout plan for me      ",
    "How to lose weight effectively?     ",
  ];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch('https://bitnbuild-brown.vercel.app/api/stats/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
        }),
      });

      console.log('Chat request sent:', text.trim());

      if (response.ok) {
        const data = await response.json();
        console.log('Chat response:', data);

        // Extract the full response text - handle different possible response structures
        let responseText = '';
        if (data.data?.response) {
          responseText = data.data.response;
        } else if (data.response) {
          responseText = data.response;
        } else if (data.message) {
          responseText = data.message;
        } else if (typeof data === 'string') {
          responseText = data;
        } else {
          responseText = "I'm sorry, I couldn't process your request right now. Please try again.";
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
      } else if (response.status === 401) {
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
      } else {
        const errorData = await response.json();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: errorData.message || "I'm sorry, I couldn't process your request right now. Please try again.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please check your internet connection and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Ionicons name="sparkles" size={32} color="white" />
          <Text style={styles.headerTitle}>AI Fitness Assistant</Text>
          <Text style={styles.headerSubtitle}>Ask me about fitness, nutrition & wellness</Text>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBubble}>
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
            {quickQuestions.map((question, index) => (
              <QuickQuestion
                key={index}
                question={question}
                onPress={() => handleQuickQuestion(question)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about nutrition, diet, supplements..."
          placeholderTextColor="#7C8DB0"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: inputText.trim() ? 1 : 0.5 }]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageHeader: {
    marginRight: 8,
    marginLeft: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: '#4CAF50',
  },
  botAvatar: {
    backgroundColor: '#2196F3',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#2C3E50',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginLeft: 40,
  },
  loadingText: {
    color: '#7C8DB0',
    fontStyle: 'italic',
  },
  quickQuestionsContainer: {
    marginTop: 20,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  quickQuestion: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#2196F3',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E8EBF0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    color: '#2C3E50',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});