import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import WebhookLogItem from "@/components/WebhookStatus";
import { apiRequest } from "@/lib/query-client";

export default function HomeTab() {
  const insets = useSafeAreaInsets();
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const [fetchError, setFetchError] = useState(false);

  const loadWebhookLogs = useCallback(async () => {
    try {
      const res = await apiRequest("GET", "/api/webhook-logs");
      const data = await res.json();
      setWebhookLogs(data);
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    loadWebhookLogs();
    pollRef.current = setInterval(loadWebhookLogs, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadWebhookLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWebhookLogs();
    setRefreshing(false);
  }, [loadWebhookLogs]);

  const successCount = webhookLogs.filter((l) => l.status === "success").length;
  const todayCount = webhookLogs.filter((l) => {
    try {
      return new Date(l.receivedAt).toDateString() === new Date().toDateString();
    } catch {
      return false;
    }
  }).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Activity</Text>
          <Text style={styles.headerSubtitle}>
            {todayCount > 0
              ? `${todayCount} message${todayCount !== 1 ? "s" : ""} today`
              : "Listening for messages"}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>Live</Text>
        </View>
      </View>

      {successCount > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{successCount}</Text>
            <Text style={styles.statLabel}>Events Added</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{webhookLogs.length}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {fetchError && webhookLogs.length === 0 && (
          <View style={styles.errorBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={Colors.error} />
            <Text style={styles.errorBannerText}>Connection issue</Text>
            <Pressable onPress={loadWebhookLogs} hitSlop={8}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {webhookLogs.length > 0 ? (
          <View style={styles.logsList}>
            {webhookLogs.map((log, i) => (
              <Animated.View
                key={log.id}
                entering={
                  i < 5 ? FadeInDown.delay(i * 60).duration(300) : undefined
                }
              >
                <WebhookLogItem log={log} />
              </Animated.View>
            ))}
          </View>
        ) : !fetchError ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="radio-outline"
                size={32}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>Waiting for messages</Text>
            <Text style={styles.emptySubtitle}>
              Configure your SMS gateway in Settings to start forwarding texts
              automatically
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.success,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.error,
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  logsList: {
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
