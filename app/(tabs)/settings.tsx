import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = '@settings:selectedRefloTheme';
const STORAGE_KEY2 = '@settings:selectedRefloLanguage';

const RadioChecklist = ({ items, label, onSelect, selectedItem, type, selectedRefloTheme, selectedRefloLanguage }) => {
  return (
    <View>
      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={styles.item}
          onPress={() => onSelect(item)}
        >
          <View style={styles.radiocontainer}>
            <View style={styles.radio}>
              {selectedItem === item && (
                <View style={selectedRefloTheme === 'Gelap' ? styles.radioInnerDark : styles.radioInnerLight} />
              )}
            </View>
              <Text style={selectedRefloTheme === 'Gelap' ? styles.optionTextDark : styles.optionTextLight}>
                {type === 'theme'
                  ? selectedRefloLanguage === 'Indonesia'
                    ? item === 'Gelap' ? 'Gelap' : 'Terang'
                    : selectedRefloLanguage === '中文'
                      ? item === 'Gelap' ? '深色' : '浅色'
                      : item === 'Gelap' ? 'Dark' : 'Light'
                  : item}
              </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SettingsScreen() {
  const [currentDate, setCurrentDate] = useState('');
  const [selectedRefloTheme, setSelectedRefloTheme] = useState('');
  const [selectedRefloLanguage, setSelectedRefloLanguage] = useState('');
    const statusBarHeight = Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 50 : 0;
  const RefloThemeOptions = ['Gelap', 'Terang'];
    const router = useRouter();
  const RefloLanguageOptions = ['English', 'Indonesia', '中文'];

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const formattedDate = now.toLocaleString('id-ID', options);
    setCurrentDate(formattedDate);

    const loadRefloTheme = async () => {
      try {
        const storedRefloTheme = await AsyncStorage.getItem(STORAGE_KEY);
        setSelectedRefloTheme(storedRefloTheme || RefloThemeOptions[0]);
      } catch (error) {
        console.error('Failed to load Reflo Theme:', error);
      }
    };

    const loadRefloLanguage = async () => {
      try {
        const storedRefloLanguage = await AsyncStorage.getItem(STORAGE_KEY2);
        setSelectedRefloLanguage(storedRefloLanguage || RefloLanguageOptions[0]);
      } catch (error) {
        console.error('Failed to load Reflo Language:', error);
      }
    };

    loadRefloTheme();
    loadRefloLanguage();
  }, []);

  const handleRefloThemeSelect = async (refloTheme: string) => {
    setSelectedRefloTheme(refloTheme);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, refloTheme);
    } catch (error) {
      console.error('Failed to save refloTheme:', error);
    }
  };

  const handleRefloLanguageSelect = async (language: string) => {
    setSelectedRefloLanguage(language);
    try {
      await AsyncStorage.setItem(STORAGE_KEY2, language);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  };
  let backupColor = '';
  if (selectedRefloTheme === 'Gelap') {
    backupColor = 'white';
  } else {
    backupColor = 'black';
  }

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
    <ScrollView style={[selectedRefloTheme === 'Gelap' ? styles.mainContainerDark : styles.mainContainerLight, {paddingTop: statusBarHeight + 50}]} contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={selectedRefloTheme === 'Gelap' ? styles.titleTextDark : styles.titleTextLight}>{selectedRefloLanguage === 'English' ? 'Settings' : (selectedRefloLanguage === 'Indonesia' ? 'Pengaturan' : '设置')}</ThemedText>
      </ThemedView>
      <ThemedText> </ThemedText>
      <ThemedView style={styles.stepContainer}>
        <View style={selectedRefloTheme === 'Gelap' ? styles.boxDark : styles.boxLight}> 
          <Text style={[selectedRefloTheme === 'Gelap' ? styles.subtitleDark : styles.subtitleLight, { marginTop: 0 }]}>{selectedRefloLanguage === 'English' ? 'System Theme' : (selectedRefloLanguage === 'Indonesia' ? 'Tema Sistem' : '颜色主题')}</Text>
          <RadioChecklist
            items={RefloThemeOptions}
            label="Pilih Tema"
            onSelect={handleRefloThemeSelect}
            selectedItem={selectedRefloTheme}
            type="theme"
            selectedRefloTheme={selectedRefloTheme}
            selectedRefloLanguage={selectedRefloLanguage}
          />
        </View>
        <View style={selectedRefloTheme === 'Gelap' ? styles.boxDark : styles.boxLight}>
          <Text style={[selectedRefloTheme === 'Gelap' ? styles.subtitleDark : styles.subtitleLight, { marginTop: 0 }]}>
            {selectedRefloLanguage === 'Indonesia' ? 'Bahasa Sistem' : selectedRefloLanguage === '中文' ? '系统语言' : 'System Language'}
          </Text>
            <RadioChecklist
              items={RefloLanguageOptions}
              label="Pilih Bahasa"
              onSelect={handleRefloLanguageSelect}
              selectedItem={selectedRefloLanguage}
              type="language"
              selectedRefloTheme={selectedRefloTheme}
              selectedRefloLanguage={selectedRefloLanguage}
            />
        </View>
      </ThemedView>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  boxDark: {
    borderRadius: 8,
    backgroundColor: '#262626',
    padding: 15,
    marginBottom: 20,
  },
  boxLight: {
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 20,
  },
  radiocontainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextDark: {
    color: 'white',
  },
  titleTextLight: {
    color: 'black',
  },
  subtitleDark: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitleLight: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  mainContainerDark: {
    flexGrow: 1, 
    padding: 32, 
    backgroundColor: 'black',
  },
  mainContainerLight: {
    flexGrow: 1, 
    padding: 32, 
    backgroundColor: 'white',
  },
  item: {
    padding: 8,
  },
  optionTextDark: {
    fontSize: 16,
    color: '#fff',
  },
  optionTextLight: {
    fontSize: 16,
    color: '#000',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  radioInnerLight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'black',
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