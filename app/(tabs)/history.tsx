import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun.', 'Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.'],
  today: 'Today',
};

LocaleConfig.locales['id'] = {
  monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
  dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  today: 'Hari Ini',
};

LocaleConfig.locales['zh-cn'] = { // Example for Chinese
  monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
  dayNamesShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  today: '今天',
};

const STORAGE_KEY = '@settings:selectedRefloTheme';
const STORAGE_KEY2 = '@settings:selectedRefloLanguage';
const EMOTION_SCORE_PREFIX = '@chat:emotionScore:';
const TOPIC_DESCRIPTION_PREFIX = '@chat:topicDescription:';

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('en-CA', options);
};

const getEmotionColor = (emotion: string | null): string => {
  if (!emotion) return 'transparent';
  switch (emotion.toLowerCase()) {
    case 'awful': return 'red';
    case 'bad': return 'pink';
    case 'okay': return 'lightblue';
    case 'good': return 'lightgreen';
    case 'great': return 'green';
    default: return 'transparent';
  }
};

const useLoadSettings = () => {
  const [selectedRefloTheme, setSelectedRefloTheme] = useState('');
  const [selectedRefloLanguage, setSelectedRefloLanguage] = useState('');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedRefloTheme = await AsyncStorage.getItem(STORAGE_KEY);
        setSelectedRefloTheme(storedRefloTheme || 'Gelap');
      } catch (error) {
        console.error('Failed to load Reflo Theme:', error);
      }
    };

    const loadLanguage = async () => {
      try {
        const storedRefloLanguage = await AsyncStorage.getItem(STORAGE_KEY2);
        setSelectedRefloLanguage(storedRefloLanguage || 'English');
      } catch (error) {
        console.error('Failed to load Reflo Language:', error);
      }
    };

    loadTheme();
    loadLanguage();
  }, []);

  return { selectedRefloTheme, selectedRefloLanguage };
};

export default function HistoryScreen() {
  const [markedDates, setMarkedDates] = useState({});
  const { selectedRefloTheme, selectedRefloLanguage } = useLoadSettings();
  const statusBarHeight = Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 50 : 0;
  const router = useRouter();
  const [selectedDateDescription, setSelectedDateDescription] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(formatDate(new Date().toDateString()));

  const formatDateForDisplay = useCallback((dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString(selectedRefloLanguage === 'Indonesia' ? 'id-ID' : (selectedRefloLanguage === 'English' ? 'en-GB' : 'zh-CN'), options);
  }, [selectedRefloLanguage]);

  useEffect(() => {
    LocaleConfig.defaultLocale = selectedRefloLanguage === 'Indonesia' ? 'id' : (selectedRefloLanguage === 'Chinese' ? 'zh-cn' : 'en');
  }, [selectedRefloLanguage]);

  const loadDailyEmotionsAndDescriptions = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const emotionKeys = keys.filter((key) => key.startsWith(EMOTION_SCORE_PREFIX) && key.endsWith(':emotion'));
      const descriptionsMap: { [date: string]: string } = {};
      const emotionsMap: { [date: string]: string } = {};
      const newMarkedDates: { [key: string]: { customTextStyle: { backgroundColor: string } } } = {};

      for (const key of emotionKeys) {
        const storedEmotion = await AsyncStorage.getItem(key);
        if (storedEmotion) {
          const dateString = key.replace(EMOTION_SCORE_PREFIX, '').replace(':emotion', '');
          emotionsMap[formatDate(dateString)] = storedEmotion;
          const color = getEmotionColor(storedEmotion);
          if (color !== 'transparent') {
            newMarkedDates[formatDate(dateString)] = { customTextStyle: { backgroundColor: color } };
          }
        }
      }

      const descriptionKeys = keys.filter((key) => key.startsWith(TOPIC_DESCRIPTION_PREFIX));
      for (const key of descriptionKeys) {
        const storedDescription = await AsyncStorage.getItem(key);
        if (storedDescription) {
          const dateString = key.replace(TOPIC_DESCRIPTION_PREFIX, '');
          descriptionsMap[formatDate(dateString)] = storedDescription;
        }
      }

      setMarkedDates(newMarkedDates);

      // Load today's summary by default
      const todayDescriptionKey = `${TOPIC_DESCRIPTION_PREFIX}${new Date().toDateString()}`;
      const storedTodayDescription = await AsyncStorage.getItem(todayDescriptionKey);
      setSelectedDateDescription(storedTodayDescription || null);
    } catch (error) {
      console.error('Failed to load daily emotions and descriptions:', error);
    }
  }, [selectedRefloLanguage]);

  useFocusEffect(
    useCallback(() => {
      loadDailyEmotionsAndDescriptions();
    }, [loadDailyEmotionsAndDescriptions])
  );

  const handleDayPress = useCallback(async (day) => {
    const formattedDate = formatDate(day.dateString);
    setCurrentDate(formattedDate);
    const descriptionKey = `${TOPIC_DESCRIPTION_PREFIX}${new Date(day.dateString).toDateString()}`;
    try {
      const storedDescription = await AsyncStorage.getItem(descriptionKey);
      setSelectedDateDescription(storedDescription || null);
    } catch (error) {
      console.error('Failed to load description for selected date:', error);
      setSelectedDateDescription(null);
    }
  }, []);

  let backupColor = selectedRefloTheme === 'Gelap' ? 'white' : 'black';
  const isDarkMode = selectedRefloTheme === 'Gelap';
  const defaultTextColor = isDarkMode ? 'white' : 'black';

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
        <ThemedView style={[styles.titleContainer, { backgroundColor: 'transparent' }]}>
          <Image source={require('@/assets/images/icon.png')} style={{ width: 100, height: 100 }} />
          <View style={{ flexDirection: 'column', backgroundColor: 'transparent' }}>
            <ThemedText type="title" style={isDarkMode ? styles.titleTextDark : styles.titleTextLight}>
              Emotion Calendar
            </ThemedText>
          </View>
        </ThemedView>
        <View style={{ backgroundColor: 'transparent' }}>
          <Calendar
            style={[styles.calendar, { backgroundColor: isDarkMode ? 'black' : 'white' }]}
            theme={{
              calendarBackground: isDarkMode ? 'black' : 'white', // Add this line
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
            onDayPress={handleDayPress}
            dayComponent={({ date, state }) => {
              const backgroundColor = markedDates[date.dateString]?.customTextStyle?.backgroundColor || 'transparent';
              let textColor = defaultTextColor;

              const today = new Date();
              const isToday =
                date.year === today.getFullYear() &&
                date.month === today.getMonth() + 1 &&
                date.day === today.getDate();

              if (isToday && !markedDates[date.dateString]?.customTextStyle?.backgroundColor) {
                textColor = '#a7f3d0';
              }

              return (
                <TouchableOpacity style={styles.dayContainer} onPress={() => handleDayPress(date)}>
                  {backgroundColor !== 'transparent' && (
                    <View style={[styles.dateCircle, { backgroundColor: backgroundColor }]} />
                  )}
                  <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 16 }}>{date.day}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={[styles.descriptionContainer, { backgroundColor: selectedRefloTheme === 'Gelap' ? '#1a1a1a' : '#e0e0e0' }]}>
          <ThemedText style={isDarkMode ? styles.descriptionTitleDark : styles.descriptionTitleLight}>
            {formatDateForDisplay(currentDate)}
          </ThemedText>
          {selectedDateDescription ? (
            <ThemedText style={isDarkMode ? styles.descriptionTextDark : styles.descriptionTextLight}>
              {selectedDateDescription}
            </ThemedText>
          ) : (
            <ThemedText style={isDarkMode ? styles.noDataTextDark : styles.noDataTextLight}>
              {selectedRefloLanguage === 'English' ? 'No summary for this day' : (selectedRefloLanguage === 'Indonesia' ? 'Tidak ada ringkasan untuk hari ini' : '今日没有总结')}
            </ThemedText>
          )}
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
  dayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  descriptionContainer: {
    marginTop: 20,
    padding: 20,
    alignItems: 'center',
    borderRadius: 8,
  },
  descriptionTitleDark: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionTitleLight: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionTextDark: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  descriptionTextLight: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
  },
  noDataTextDark: {
    color: '#717171',
    fontSize: 16,
    textAlign: 'center',
  },
  noDataTextLight: {
    color: '#a3a3a3',
    fontSize: 16,
    textAlign: 'center',
  },
});