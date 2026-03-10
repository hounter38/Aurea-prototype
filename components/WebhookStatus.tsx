import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface WebhookLogEntry {
  id: string;
  from: string;
  smsText: string;
  receivedAt: string;
  status: "processing" | "success" | "no_events" | "error";
  events: any[];
  summary: string;
  error?: string;
  googleLinks: string[];
}

interface WebhookLogItemProps {
  log: WebhookLogEntry;
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const statusConfig = {
  processing: {
    icon: "hourglass-outline" as const,
    color: Colors.warning,
    bg: Colors.warningBg,
    label: "Processing",
  },
  success: {
    icon: "checkmark-circle" as const,
    color: Colors.success,
    bg: Colors.successBg,
    label: "Added",
  },
  no_events: {
    icon: "remove-circle-outline" as const,
    color: Colors.textMuted,
    bg: Colors.textMuted + "15",
    label: "No events",
  },
  error: {
    icon: "alert-circle" as const,
    color: Colors.error,
    bg: Colors.errorBg,
    label: "Error",
  },
};

export default function WebhookLogItem({ log }: WebhookLogItemProps) {
  const config = statusConfig[log.status];

  const handleOpenLink = (link: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(link);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={13} color={config.color} />
          <Text style={[styles.statusLabel, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
        <Text style={styles.time}>
          {formatDate(log.receivedAt)} {formatTime(log.receivedAt)}
        </Text>
      </View>

      <View style={styles.messageSection}>
        <Text style={styles.sender} numberOfLines={1}>
          {log.from}
        </Text>
        <Text style={styles.smsPreview} numberOfLines={2}>
          {log.smsText}
        </Text>
      </View>

      {log.status === "success" && log.events.length > 0 && (
        <View style={styles.eventsCreated}>
          {log.events.map((event: any, i: number) => (
            <Pressable
              key={i}
              style={styles.createdEvent}
              onPress={() =>
                log.googleLinks[i] && handleOpenLink(log.googleLinks[i])
              }
            >
              <Ionicons name="calendar" size={14} color={Colors.success} />
              <Text style={styles.createdEventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              {log.googleLinks[i] && (
                <Ionicons
                  name="open-outline"
                  size={13}
                  color={Colors.textMuted}
                />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {log.status === "no_events" && log.summary ? (
        <Text style={styles.noEventsSummary}>{log.summary}</Text>
      ) : null}

      {log.status === "error" && log.error ? (
        <Text style={styles.errorText}>{log.error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  messageSection: {
    gap: 3,
  },
  sender: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  smsPreview: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  eventsCreated: {
    gap: 6,
  },
  createdEvent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.successBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createdEventTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  noEventsSummary: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.error,
  },
});
