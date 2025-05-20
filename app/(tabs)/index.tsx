import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Octicons from '@expo/vector-icons/Octicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STORAGE_KEY = '@settings:selectedRefloTheme';
const STORAGE_KEY2 = '@settings:selectedRefloLanguage';

export default function HomeScreen() {
  const router = useRouter();
  const addJournal = () => {
    router.push('/entry');
  }
  const toSettings = () => {
    router.push('/settings');
  }
  const toHistory = () => {
    router.push('/history');
  }
  const now = new Date();
  const hours = now.getHours();
  const [selectedRefloTheme, setSelectedRefloTheme] = useState('');
  const [selectedRefloLanguage, setSelectedRefloLanguage] = useState('');

    useEffect(() => {
    const loadRefloTheme = async () => {
      try {
        const storedRefloTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedRefloTheme) {
          setSelectedRefloTheme(storedRefloTheme);
        } else {
          setSelectedRefloTheme('Gelap');
        }
      } catch (error) {
        console.error('Failed to load RefloTheme in HomeScreen:', error);
      }
    };

    loadRefloTheme();
  }, [])

    useEffect(() => {
    const loadRefloLanguage = async () => {
      try {
        const storedRefloLanguage = await AsyncStorage.getItem(STORAGE_KEY2);
        if (storedRefloLanguage) {
          setSelectedRefloLanguage(storedRefloLanguage);
        } else {
          setSelectedRefloLanguage('Gelap');
        }
      } catch (error) {
        console.error('Failed to load RefloLanguage in HomeScreen:', error);
      }
    };

    loadRefloLanguage();
  }, [])

  const backgroundImage = hours < 12 ? require('@/components/images/morningbg.jpg') : (hours < 18 ? require('@/components/images/afternoonbg.jpg') : require('@/components/images/eveningbg.jpg'));
  
  return (
    <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
    >
    <ScrollView style={styles.mainContainer} contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={hours < 18 ? styles.titleTextLight : styles.titleTextDark}>reflo</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="title" style={[(hours < 18 ? styles.titleTextLight : styles.titleTextDark), {fontSize: 35}]}>{selectedRefloLanguage === 'English' ? 'What made you feel grateful today?' : (selectedRefloLanguage === 'Indonesia' ? 'Apa yang membuat Anda bersyukur hari ini?' : '今天什么让你感到感恩?')}</ThemedText>
        <TouchableOpacity style={selectedRefloTheme === 'Gelap' ? styles.buttonDark : styles.buttonLight} onPress={addJournal}><Text style={selectedRefloTheme === 'Gelap' ? styles.buttonTextDark : styles.buttonTextLight }>{selectedRefloLanguage === 'English' ? 'Start Journaling' : (selectedRefloLanguage === 'Indonesia' ? 'Tulis Jurnal' : '开始写日记')}</Text></TouchableOpacity>
        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <TouchableOpacity style={[styles.smallbuttonDark, {backgroundColor:'transparent', width:'50%'}]} onPress={toSettings}>
          <FontAwesome5 name="cog" size={24} color={hours < 18 ? 'black' : 'white'} />
          <Text style={[styles.smallbuttonTextDark, {color: hours < 18 ? 'black' : 'white', fontSize: 18}]}>
            {selectedRefloLanguage === 'English' ? 'Settings' : (selectedRefloLanguage === 'Indonesia' ? 'Pengaturan' : '设置')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallbuttonDark, {backgroundColor:'transparent', width:'50%'}]} onPress={toHistory}>
          <Octicons name="graph" size={24} color={hours < 18 ? 'black' : 'white'} />
          <Text style={[styles.smallbuttonTextDark, {color: hours < 18 ? 'black' : 'white', fontSize: 18}]}>
            {selectedRefloLanguage === 'English' ? 'Insights' : (selectedRefloLanguage === 'Indonesia' ? 'Sekilas' : '关于你')}
          </Text>
        </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  titleTextDark: {
    color: 'white',
    fontSize: 40,
  },
  titleTextLight: {
    color: 'black',
    fontSize: 40,
  },
  mainContainer: {
    flexGrow: 1, 
    padding: 32, 
    paddingTop: 60,
  },
  background: {
    flex: 1,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 5,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  buttonDark: {
    width: '100%',
    backgroundColor: '#242424',
    padding: 15,
    borderRadius: 18,
    marginTop: 20,
  },
  smallbuttonDark: {
    width: '100%',
    backgroundColor: '#242424',
    padding: 10,
    borderRadius: 18,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonLight: {
    width: '100%',
    backgroundColor: '#e0e0e0',
    padding: 15,
    borderRadius: 18,
    marginTop: 20,
  },
  smallbuttonLight: {
    width: '100%',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 18,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonTextDark: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 25,
  }, 
  smallbuttonTextDark: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
  buttonTextLight: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 25,
  },
  smallbuttonTextLight: {
    color: 'black',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
