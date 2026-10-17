import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

const features = [
  'Secure sign-in and profile',
  'Nearby eligible tasks',
  'Task acceptance and progress',
  'Required checklists and evidence upload',
  'Operations approval status',
  'Wallet ledger and transaction history'
];

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ExpoStatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>CHASEHORSE FIELD APP</Text>
        <Text style={styles.title}>Work, tracked clearly.</Text>
        <Text style={styles.subtitle}>A mobile foundation for field teams. Live authentication and task APIs are not connected yet.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Planned workspace</Text>
          {features.map((item) => (
            <View key={item} style={styles.row}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.item}>{item}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.notice}>Next integration: Supabase Auth with secure session storage, then the authenticated Spring Boot API.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8fb' },
  content: { padding: 24, paddingTop: 52, gap: 18 },
  eyebrow: { color: '#3265c8', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#13213a', fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { color: '#53627a', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 15, borderWidth: 1, borderColor: '#e1e7f0' },
  cardTitle: { color: '#17243a', fontSize: 18, fontWeight: '700', marginBottom: 2 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { color: '#3265c8', fontSize: 20, lineHeight: 22 },
  item: { color: '#344258', fontSize: 15, flex: 1, lineHeight: 22 },
  notice: { color: '#59677b', fontSize: 13, lineHeight: 19 }
});