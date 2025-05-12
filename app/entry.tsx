import AntDesign from '@expo/vector-icons/AntDesign';
import Constants from 'expo-constants';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey as string;

export default function EntryScreen() {
  const [messages, setMessages] = useState([{ user: '', gpt: '', loading: false }]);
  const router = useRouter();
  const statusBarHeight = Platform.OS === 'ios' ? 20 : Platform.OS === 'android' ? 50 : 0;

  const handleSubmit = async (index) => {
    const userMessage = messages[index].user.trim();
    if (!userMessage) return;

    const newMessages = [...messages];
    newMessages[index].loading = true;
    setMessages(newMessages);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'I am going to tell you my day. Act like a listening friend. Respond appropriately.' },
          { role: 'user', content: userMessage },
        ],
}),

      });
      const data = await res.json();
      const gptReply = data.choices?.[0]?.message?.content || 'Error getting response';

      newMessages[index] = {
        user: userMessage,
        gpt: gptReply,
        loading: false,
      };

      setMessages([...newMessages, { user: '', gpt: '', loading: false }]);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch GPT response.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AntDesign
        name="arrowleft"
        size={24}
        color="white"
        style={[styles.backIcon, { top: statusBarHeight + 10, left: 20, zIndex: 100 }]}
        onPress={() => router.back()}
      />
      <ScrollView contentContainerStyle={[styles.container, { marginTop: statusBarHeight + 50}]}>
        {messages.map((msg, index) => (
          <View key={index} style={{ marginBottom: 30, width: '100%' }}>
            <TextInput
              style={[styles.textBox, { backgroundColor: 'black' }]}
              multiline
              editable={!msg.gpt && !msg.loading}
              value={msg.user}
              onChangeText={(text) => {
                const updated = [...messages];
                updated[index].user = text;
                setMessages(updated);
              }}
              placeholder="Type here"
              placeholderTextColor="#888"
            />
            {msg.gpt ? (
              <>
                <Text style={styles.title}>{msg.gpt}</Text>
              </>
            ) : (
              <View style={{ marginTop: 10 }}>
                {msg.loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <TouchableOpacity onPress={() => handleSubmit(index)} style={styles.button}><Text style={styles.buttonText}>Kirim</Text></TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'black',
  },
  button: {
    width: '100%',
    backgroundColor: '#242424',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  gptText: {
    color: 'white',
    fontSize: 16,
    marginTop: 5,
    padding: 10,
    borderRadius: 8,
    textAlign: 'justify',
  },
  textBox: {
    height: 120,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    color: 'white',
    fontSize: 16,
    padding: 10,
    textAlignVertical: 'top',
  },
  backIcon: {
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
});
