import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router'; // Import useFocusEffect
import React, { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
  today: 'Today',
};
LocaleConfig.defaultLocale = 'en';

const STORAGE_KEY = '@settings:selectedRefloTheme';
const STORAGE_KEY2 = '@settings:selectedRefloLanguage';
const EMOTION_SCORE_PREFIX = '@chat:emotionScore:';

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('en-CA', options);
};

const getEmotionColor = (score: number | null): string => {
  if (score === null) return 'white';
  if (score <= 20) return 'red';
  if (score <= 40) return 'pink';
  if (score <= 60) return 'lightblue';
  if (score <= 80) return 'lightgreen';
  return 'green'; // Great is green
};

export default function HistoryScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedRefloTheme, setSelectedRefloTheme] = useState('');
  const [selectedRefloLanguage, setSelectedRefloLanguage] = useState('');
  const statusBarHeight = Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 50 : 0;
  const router = useRouter();

  useEffect(() => {
    const loadRefloTheme = async () => {
      try {
        const storedRefloTheme = await AsyncStorage.getItem(STORAGE_KEY);
        setSelectedRefloTheme(storedRefloTheme || 'Gelap');
      } catch (error) {
        console.error('Failed to load Reflo Theme:', error);
      }
    };

    const loadRefloLanguage = async () => {
      try {
        const storedRefloLanguage = await AsyncStorage.getItem(STORAGE_KEY2);
        setSelectedRefloLanguage(storedRefloLanguage || 'English');
      } catch (error) {
        console.error('Failed to load Reflo Language:', error);
      }
    };

    loadRefloTheme();
    loadRefloLanguage();
  }, []);

  // Use useFocusEffect to reload data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadDailyEmotions = async () => {
        try {
          const keys = await AsyncStorage.getAllKeys();
          const emotionKeys = keys.filter((key) =>
            key.startsWith(EMOTION_SCORE_PREFIX)
          );
          const emotionsMap: { [date: string]: number } = {};

          for (const key of emotionKeys) {
            const storedScore = await AsyncStorage.getItem(key);
            if (storedScore) {
              const dateString = key.replace(EMOTION_SCORE_PREFIX, '');
              const score = parseInt(storedScore, 10);
              if (!isNaN(score)) {
                emotionsMap[formatDate(dateString)] = score;
              }
            }
          }

          const today = new Date();
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(today.getMonth() - 2);

          const generatedMarkedDates: {
            [key: string]: { customTextStyle: { color: string } };
          } = {};
          const currentDate = new Date(twoMonthsAgo);

          while (currentDate <= today) {
            const formattedCurrentDate = formatDate(currentDate.toDateString());
            const score = emotionsMap[formattedCurrentDate];
            generatedMarkedDates[formattedCurrentDate] = {
              customTextStyle: { color: getEmotionColor(score) },
            };
            currentDate.setDate(currentDate.getDate() + 1);
          }
          setMarkedDates(generatedMarkedDates);
        } catch (error) {
          console.error('Failed to load daily emotions:', error);
        }
      };

      loadDailyEmotions();
    }, [])
  );

  let backupColor = selectedRefloTheme === 'Gelap' ? 'white' : 'black';
  const isDarkMode = selectedRefloTheme === 'Gelap';

  let EnglishGreet = '';
  let IndonesianGreet = '';
  let ChineseGreet = '';
  const now = new Date();
  if(now.getHours() < 12) {
    EnglishGreet = 'Good morning, ';
    IndonesianGreet = 'Selamat pagi, ';
    ChineseGreet = '早上好, ';
  }else if(now.getHours() < 18) {
    EnglishGreet = 'Good afternoon, ';
    IndonesianGreet = 'Selamat siang, ';
    ChineseGreet = '下午好, ';
  }else{
    EnglishGreet = 'Good evening, ';
    IndonesianGreet = 'Selamat malam, ';
    ChineseGreet = '晚上好, ';
  }

  let UserName = "Tester";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AntDesign
        name="arrowleft"
        size={24}
        color={backupColor}
        style={[
          isDarkMode ? styles.backIconDark : styles.backIconLight,
          { top: statusBarHeight + 10, left: 20, zIndex: 100 },
        ]}
        onPress={() => router.back()}
      />
      <ScrollView
        style={[
          isDarkMode ? styles.mainContainerDark : styles.mainContainerLight,
          { paddingTop: statusBarHeight + 50 },
        ]}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <ThemedView
          style={[styles.titleContainer, { backgroundColor: 'transparent' }]}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 100, height: 100 }}
          />
          <View style={{ flexDirection: 'column', backgroundColor: 'transparent' }}>
            <ThemedText
              type="title"
              style={isDarkMode ? styles.titleTextDark : styles.titleTextLight}
            >
              {selectedRefloLanguage === 'English' ? EnglishGreet : (selectedRefloLanguage === 'Indonesia' ? IndonesianGreet : ChineseGreet)}
            </ThemedText>
            <ThemedText
              type="title"
              style={isDarkMode ? styles.titleTextDark : styles.titleTextLight}
            >
              {UserName}!
            </ThemedText>
          </View>
        </ThemedView>
        <View style={{ backgroundColor: 'transparent' }}>
        <Calendar
          style={[styles.calendar, { backgroundColor: isDarkMode ? 'black' : 'white' }]}
          theme={{
            textMonthFontSize: 18,
            textMonthFontWeight: 'bold',
            monthTextColor: isDarkMode ? '#ffffff' : '#000000',
            arrowColor: backupColor,
            textDayHeaderFontSize: 14,
            textDayHeaderFontWeight: 'bold',
            dayTextColor: isDarkMode ? '#ffffff' : '#000000',
            textDayFontSize: 16,
            textDayFontWeight: 'bold',
            todayTextColor: '#a7f3d0',
            selectedDayBackgroundColor: isDarkMode ? '#333333' : '#e0e0e0',
            selectedDayTextColor: isDarkMode ? '#ffffff' : '#000000',
            textDisabledColor: '#808080',
          }}
          markedDates={markedDates}
          markingType="custom"
          dayComponent={({ date, state }) => {
            const textColor =
              markedDates[date.dateString]?.customTextStyle?.color ||
              (isDarkMode ? 'white' : 'black');

            return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: textColor }}>{date.day}</Text>
              </View>
            );
          }}
        />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainerDark: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'black',
  },
  mainContainerLight: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
    backgroundColor: 'transparent',
  },
  titleTextDark: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleTextLight: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  historyContainer: {
    gap: 15,
    backgroundColor: 'transparent',
  },
  emotionItemDark: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
  },
  emotionItemLight: {
    backgroundColor: 'transparent',
    padding: 15,
    borderRadius: 8,
  },
  dateTextDark: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  dateTextLight: {
    color: 'black',
    fontSize: 16,
    marginBottom: 5,
  },
  scoreTextDark: {
    color: '#a7f3d0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreTextLight: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noHistoryTextDark: {
    color: '#717171',
    fontSize: 16,
  },
  noHistoryTextLight: {
    color: '#a3a3a3',
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
  calendar: {
    borderRadius: 10,
  },
});