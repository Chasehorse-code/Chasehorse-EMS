import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ChaseHorse</Text>
      <Text>Mobile foundation</Text>
      <Text style={styles.note}>Authentication and task workflows are not implemented.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  note: { color: "#555", marginTop: 16, textAlign: "center" },
});

