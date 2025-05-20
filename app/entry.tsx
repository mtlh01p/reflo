import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = '@settings:selectedRefloTheme';
const STORAGE_KEY2 = '@settings:selectedRefloLanguage';
const CHAT_STORAGE_KEY = '@chat:messages';
const LAST_OPENED_DATE_KEY = '@app:lastOpenedDate';
const EMOTION_SCORE_PREFIX = '@chat:emotionScore:';
const TOPIC_DESCRIPTION_PREFIX = '@chat:topicDescription:';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey as string;

export default function EntryScreen() {
  const [messages, setMessages] = useState<{ user: string; gpt: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const statusBarHeight = Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 50 : 0;
  const [selectedRefloTheme, setSelectedRefloTheme] = useState('');
  const [selectedRefloLanguage, setSelectedRefloLanguage] = useState('');
  const [hasSentInitialMessage, setHasSentInitialMessage] = useState(false);
  const [emotionScore, setEmotionScore] = useState<number | null>(null);
  const [topicDescription, setTopicDescription] = useState<string | null>(null);

  const getCurrentDateString = () => new Date().toDateString();
  const getEmotionScoreKeyWithDate = () => `${EMOTION_SCORE_PREFIX}${getCurrentDateString()}`;
  const getTopicDescriptionKeyWithDate = () => `${TOPIC_DESCRIPTION_PREFIX}${getCurrentDateString()}`;

  useEffect(() => {
    const loadRefloTheme = async () => {
      try {
        const storedRefloTheme = await AsyncStorage.getItem(STORAGE_KEY);
        setSelectedRefloTheme(storedRefloTheme || 'Gelap');
      } catch (error) {
        console.error('Failed to load RefloTheme:', error);
      }
    };

    const loadRefloLanguage = async () => {
      try {
        const storedRefloLanguage = await AsyncStorage.getItem(STORAGE_KEY2);
        setSelectedRefloLanguage(storedRefloLanguage || 'English');
      } catch (error) {
        console.error('Failed to load RefloLanguage:', error);
      }
    };

    const loadEmotionScoreAndTopic = async () => {
      try {
        const storedScore = await AsyncStorage.getItem(getEmotionScoreKeyWithDate());
        if (storedScore) {
          setEmotionScore(parseInt(storedScore, 10));
        }
        const storedTopic = await AsyncStorage.getItem(getTopicDescriptionKeyWithDate());
        if (storedTopic) {
          setTopicDescription(storedTopic);
        }
      } catch (error) {
        console.error('Failed to load emotion score or topic for today:', error);
      }
    };

    loadRefloTheme();
    loadRefloLanguage();
    loadEmotionScoreAndTopic();
  }, []);

  useEffect(() => {
    const loadChat = async () => {
      try {
        const storedChat = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        const lastOpenedDate = await AsyncStorage.getItem(LAST_OPENED_DATE_KEY);
        const currentDate = getCurrentDateString();

        if (lastOpenedDate !== currentDate) {
          await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
          setMessages([]);
          setHasSentInitialMessage(false);
          await AsyncStorage.setItem(LAST_OPENED_DATE_KEY, currentDate);
        } else if (storedChat) {
          setMessages(JSON.parse(storedChat));
        }
      } catch (error) {
        console.error('Failed to load chat:', error);
      }
    };

    loadChat();
  }, []);

  useEffect(() => {
    const sendInitialMessage = async () => {
      if (!hasSentInitialMessage && messages.length === 0) {
        const now = new Date();
        const hours = now.getHours();
        let initialMessage = '';
        if (hours < 12) {
          initialMessage = selectedRefloLanguage === 'English' ? 'Good morning\nAs you reflect on today, what moments come to mind?' : (selectedRefloLanguage === 'Indonesia' ? 'Selamat pagi\nSaat merenungkan diri Anda hari ini, peristiwa apa yang Anda pikirkan?' : '早上好\n当你反思今天时, 脑海中浮现出什么时刻?');
        } else if (hours < 18) {
          initialMessage = selectedRefloLanguage === 'English' ? 'Good afternoon\nAs you reflect on today, what moments come to mind?' : (selectedRefloLanguage === 'Indonesia' ? 'Selamat siang/sore\nSaat merenungkan diri Anda hari ini, peristiwa apa yang Anda pikirkan?' : '下午好\n当你反思今天时, 脑海中浮现出什么时刻?');
        } else {
          initialMessage = selectedRefloLanguage === 'English' ? 'Good evening\nAs you reflect on today, what moments come to mind?' : (selectedRefloLanguage === 'Indonesia' ? 'Selamat malam\nSaat merenungkan diri Anda hari ini, peristiwa apa yang Anda pikirkan?' : '晚上好\n当你反思今天时, 脑海中浮现出什么时刻?');
        }

        setMessages([{ user: 'Robot', gpt: initialMessage }]);
        setHasSentInitialMessage(true);
      }
    };

    sendInitialMessage();
  }, [selectedRefloLanguage, hasSentInitialMessage, messages.length]);

  useEffect(() => {
    AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

const analyzeEmotionAndTopic = async () => {
  if (messages.length > 0) {
    setLoading(true);
    try {
      const chatHistory = messages.map(msg => `${msg.user}: ${msg.gpt}`).join('\n');

      // --- Separate Emotion Analysis ---
      const emotionPrompt = `Analyze the overall emotion expressed in the following chat history. Return a single word describing the dominant emotion from the following categories: Awful, Bad, Okay, Good, Great. If the emotion is neutral or cannot be clearly categorized into these, return 'Okay'. Also, return a score for its intensity on a scale of 1 to 5 (1 being weak, 5 being strong), separated by a comma. TRY TO RETURN A VALUE CLOSER TO THE EXTREME FOR THE EMOTION CATEGORY, AND AVOID BEING TOO CLOSE TO THE MEDIAN.`;

      const emotionRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Consider a more advanced model if available
          messages: [
            { role: 'system', content: 'Analyze the emotion in the provided text and categorize it, defaulting to \'Okay\' if neutral or unclear.' },
            { role: 'user', content: emotionPrompt + '\n\n' + chatHistory },
          ],
        }),
      });

      const emotionData = await emotionRes.json();
      const emotionContent = emotionData.choices?.[0]?.message?.content?.trim();
      console.log('Raw Emotion Content:', emotionContent); // Keep this for debugging
      if (emotionContent) {
        const [dominantEmotion, intensityStr] = emotionContent.split(',').map(s => s.trim());
        const intensity = parseInt(intensityStr || '', 10);
        if (['Awful', 'Bad', 'Okay', 'Good', 'Great'].includes(dominantEmotion) && !isNaN(intensity) && intensity >= 1 && intensity <= 5) {
          // Store dominantEmotion and intensity
          console.log('Dominant Emotion:', dominantEmotion, 'Intensity:', intensity);
          await AsyncStorage.setItem(`${EMOTION_SCORE_PREFIX}${getCurrentDateString()}:emotion`, dominantEmotion);
          await AsyncStorage.setItem(`${EMOTION_SCORE_PREFIX}${getCurrentDateString()}:intensity`, intensity.toString());
        } else {
          console.error('Failed to parse emotion data:', emotionContent);
          // Optionally, you could add a fallback here to store 'Okay' if parsing fails
          // await AsyncStorage.setItem(`${EMOTION_SCORE_PREFIX}${getCurrentDateString()}:emotion`, 'Okay');
          // await AsyncStorage.setItem(`${EMOTION_SCORE_PREFIX}${getCurrentDateString()}:intensity`, '3'); // Or some default intensity
        }
      } else {
        console.error('Failed to get emotion content from OpenAI.');
      }

      // --- Separate Topic Analysis ---
      let topicPrompt = ``;
      if(selectedRefloLanguage === 'English') {
        topicPrompt = `Identify the main topics or themes discussed in the following chat history. Return a concise description of the key themes in no more than 9 words. If multiple distinct topics are present, separate them with " , ". Answer in English.`;
      }else if(selectedRefloLanguage === 'Indonesia') {
        topicPrompt = `Identifikasi topik atau tema utama yang dibicarakan dalam riwayat percakapan ini. Berikan deskripsi pendek ide pokok secara tepat hanya dalam 9 kata-kata. Jika ada beberapa topik yang berbeda, pisahkan dengan " , ". Sampaikan dalam bahasa Indonesia.`;
      }else{
        topicPrompt = `确定此对话历史中讨论的主要话题或主题。仅用 9 个字简要描述主要思想。如果有多个不同的主题，则用“ , ”分隔。用中文回答`;
      }

      const topicRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Consider a more advanced model if available
          messages: [
            { role: 'system', content: 'Identify the key topics in the provided text.' },
            { role: 'user', content: topicPrompt + '\n\n' + chatHistory },
          ],
        }),
      });

      const topicData = await topicRes.json();
      const topicDescriptionContent = topicData.choices?.[0]?.message?.content?.trim();
      if (topicDescriptionContent) {
        setTopicDescription(topicDescriptionContent);
        await AsyncStorage.setItem(getTopicDescriptionKeyWithDate(), topicDescriptionContent);
      } else {
        console.error('Failed to get topic description from OpenAI.');
      }

    } catch (error) {
      console.error('Error analyzing emotion and topic:', error);
    } finally {
      setLoading(false);
    }
  }
};

  useEffect(() => {
    return () => {
      if (!loading && messages.length > 0 && router.canGoBack()) {
        analyzeEmotionAndTopic();
      }
    };
  }, [router, messages, loading]);

  const handleSubmit = async () => {
    const userMessage = inputText.trim();
    if (!userMessage || loading) return;

    setLoading(true);
    setInputText('');

    try {
      const chatHistoryForApi = messages.map(msg => [
        { role: 'user', content: msg.user },
        { role: 'assistant', content: msg.gpt }
      ]).flat();
      chatHistoryForApi.push({ role: 'user', content: userMessage });

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'Beep boop I am a robot whose task is to deliver messages from someone chatting to you like a talking diary. Please respond appropriately like a friend and KEEP ASKING NEW QUESTIONS IN EACH OF YOUR REPLY until he/she asks you to stop, ok? Beep boop' },
            ...chatHistoryForApi,
          ],
        }),
      });

      const data = await res.json();
      const gptReply = data.choices?.[0]?.message?.content || 'Error getting response';

      setMessages((prev) => [...prev, { user: userMessage, gpt: gptReply }]);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch GPT response.');
    } finally {
      setLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  let backupColor = selectedRefloTheme === 'Gelap' ? 'white' : 'black';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AntDesign
        name="arrowleft"
        size={24}
        color={backupColor}
        style={[(selectedRefloTheme === 'Gelap' ? styles.backIconDark : styles.backIconLight), { top: statusBarHeight + 10, left: 20, zIndex: 100 }]}
        onPress={() => router.back()}
      />

      <KeyboardAvoidingView
        style={selectedRefloTheme === 'Gelap' ? styles.wrapperDark : styles.wrapperLight}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.messageContainer}
          contentContainerStyle={{ paddingBottom: 20, paddingTop: statusBarHeight + 50 }}
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <ThemedText type="title" style={selectedRefloTheme === 'Gelap' ? styles.titleDark : styles.titleLight}>{selectedRefloLanguage === 'English' ? 'Journal' : (selectedRefloLanguage === 'Indonesia' ? 'Jurnal' : '杂志')}</ThemedText>
          {messages.map((msg, index) => (
            <View key={index} style={{ marginBottom: 10 }}>
              {msg.user === 'Robot' ? (
                <View style={[styles.bubble, (selectedRefloTheme === 'Gelap' ? styles.gptBubbleDark : styles.gptBubbleLight)]}>
                  <Text style={selectedRefloTheme === 'Gelap' ? styles.bubbleTextDark : styles.bubbleTextLight}>{msg.gpt}</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.bubble, (selectedRefloTheme === 'Gelap' ? styles.userBubbleDark : styles.userBubbleLight)]}>
                    <Text style={selectedRefloTheme === 'Gelap' ? styles.bubbleTextDark : styles.bubbleTextLight}>{msg.user}</Text>
                  </View>
                  <View style={[styles.bubble, (selectedRefloTheme === 'Gelap' ? styles.gptBubbleDark : styles.gptBubbleLight)]}>
                    <Text style={selectedRefloTheme === 'Gelap' ? styles.bubbleTextDark : styles.bubbleTextLight}>{msg.gpt}</Text>
                  </View>
                </>
              )}
            </View>
          ))}
          {loading && (
            <View style={[styles.bubble, (selectedRefloTheme === 'Gelap' ? styles.gptBubbleDark : styles.gptBubbleLight)]}>
              <ActivityIndicator color={backupColor} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={selectedRefloTheme === 'Gelap' ? styles.inputDark : styles.inputLight}
            value={inputText}
            onChangeText={setInputText}
            placeholder={selectedRefloLanguage === 'English' ? 'Write your response' : (selectedRefloLanguage === 'Indonesia' ? 'Tulis pesan Anda' : '输入您的消息')}
            placeholderTextColor="#aaa"
            multiline
          />
          <TouchableOpacity onPress={handleSubmit} style={selectedRefloTheme === 'Gelap' ? styles.sendButtonDark : styles.sendButtonLight}>
            <IconSymbol size={20} name="paperplane.fill" color={backupColor} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  wrapperDark: {
    flex: 1,
    backgroundColor: 'black',
  },
  wrapperLight: {
    flex: 1,
    backgroundColor: 'white',
  },
  titleDark: {
    color: 'white',
    margin: 10,
    marginBottom: 30,
    fontSize: 40,
  },
  titleLight: {
    color: 'black',
    margin: 10,
    marginBottom: 30,
    fontSize: 40,
  },
  messageContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginLeft: 5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12,
  },
  inputDark: {
    flex: 1,
    maxHeight: 40,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
  },
  inputLight: {
    flex: 1,
    maxHeight: 40,
    color: 'black',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
  },
  sendButtonDark: {
    marginLeft: 10,
    backgroundColor: '#333',
    width: 40,
    height: 40,
    padding: 10,
    borderRadius: 20,
  },
  sendButtonLight: {
    marginLeft: 10,
    backgroundColor: '#ccc',
    width: 40,
    height: 40,
    padding: 10,
    borderRadius: 20,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  userBubbleDark: {
    backgroundColor:'#234f4a',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
    marginBottom: 10,
  },
  userBubbleLight: {
    backgroundColor: '#c2fff8',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
    marginBottom: 10,
  },
  gptBubbleDark: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  gptBubbleLight: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  bubbleTextDark: {
    color: 'white',
    fontSize: 16,
  },
  bubbleTextLight: {
    color: 'black',
    fontSize: 16,
  },
  backIconDark: {
    position: 'absolute',
    marginBottom: 5,
    padding: 8,
    backgroundColor: 'black',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIconLight: {
    position: 'absolute',
    marginBottom: 5,
    padding: 8,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});