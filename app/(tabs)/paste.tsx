import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import SMSInput from "@/components/SMSInput";
import EventCard, { type ParsedEvent } from "@/components/EventCard";
import HistoryItem from "@/components/HistoryItem";
import {
  getSavedEvents,
  saveEvent,
  deleteEvent,
  type SavedEvent,
} from "@/lib/storage";
import { apiRequest } from "@/lib/query-client";

type ViewMode = "input" | "results";

export default function PasteTab() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const [summary, setSummary] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [currentSmsText, setCurrentSmsText] = useState("");
  const [history, setHistory] = useState<SavedEvent[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const loadHistory = useCallback(async () => {
    const events = await getSavedEvents();
    setHistory(events);
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleParseSMS = async (text: string) => {
    setIsParsing(true);
    setParseError(null);
    setCurrentSmsText(text);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await apiRequest("POST", "/api/parse-sms", {
        smsText: text,
        timezone,
      });
      const data = await res.json();

      if (data.events && data.events.length > 0) {
        setParsedEvents(data.events);
        setSummary(data.summary || "");
        setConfidence(data.confidence || 0);
        setAddedIndices(new Set());
        setViewMode("results");
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        setParseError(data.summary || "No events found in this message.");
      }
    } catch {
      setParseError("Failed to parse SMS. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddToCalendar = async (event: ParsedEvent, index: number) => {
    setAddingIndex(index);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await apiRequest("POST", "/api/create-event", {
        ...event,
        timezone,
      });
      const data = await res.json();

      if (data.success) {
        setAddedIndices((prev) => new Set(prev).add(index));

        const savedEvent: SavedEvent = {
          id:
            Date.now().toString() +
            Math.random().toString(36).substr(2, 9),
          ...event,
          googleEventId: data.eventId,
          googleLink: data.htmlLink,
          createdAt: new Date().toISOString(),
          smsText: currentSmsText,
        };
        await saveEvent(savedEvent);
        await loadHistory();

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setAddingIndex(null);
    }
  };

  const handleEditEvent = (event: ParsedEvent, index: number) => {
    const updated = [...parsedEvents];
    updated[index] = event;
    setParsedEvents(updated);
  };

  const handleDeleteHistory = async (id: string) => {
    await deleteEvent(id);
    await loadHistory();
  };

  const handleBack = () => {
    setViewMode("input");
    setParsedEvents([]);
    setSummary("");
    setConfidence(0);
    setParseError(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        {viewMode === "results" ? (
          <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTitle}>
          {viewMode === "results" ? "Results" : "Paste SMS"}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {viewMode === "input" ? (
          <>
            <Text style={styles.subtitle}>
              Paste a text message and AI will extract event details for Google
              Calendar
            </Text>

            <SMSInput onSubmit={handleParseSMS} isLoading={isParsing} />

            {parseError && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={styles.errorCard}
              >
                <Ionicons
                  name="information-circle"
                  size={18}
                  color={Colors.warning}
                />
                <Text style={styles.errorText}>{parseError}</Text>
              </Animated.View>
            )}

            {history.length > 0 && (
              <Animated.View entering={FadeIn.duration(300)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent</Text>
                  <Text style={styles.sectionCount}>{history.length}</Text>
                </View>
                <View style={styles.historyList}>
                  {history.slice(0, 10).map((item) => (
                    <HistoryItem
                      key={item.id}
                      event={item}
                      onDelete={handleDeleteHistory}
                    />
                  ))}
                </View>
              </Animated.View>
            )}

            {history.length === 0 && !isParsing && !parseError && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="document-text-outline"
                    size={28}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>No events yet</Text>
                <Text style={styles.emptySubtitle}>
                  Paste an SMS above to extract calendar events
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.resultsSummary}
            >
              <View style={styles.confidenceRow}>
                <View
                  style={[
                    styles.confidenceBadge,
                    confidence >= 0.7
                      ? styles.confidenceHigh
                      : confidence >= 0.4
                      ? styles.confidenceMedium
                      : styles.confidenceLow,
                  ]}
                >
                  <Text style={styles.confidenceText}>
                    {Math.round(confidence * 100)}%
                  </Text>
                </View>
                <Text style={styles.eventCount}>
                  {parsedEvents.length} event
                  {parsedEvents.length !== 1 ? "s" : ""} found
                </Text>
              </View>
              {summary ? (
                <Text style={styles.summaryText}>{summary}</Text>
              ) : null}
            </Animated.View>

            <View style={styles.eventsList}>
              {parsedEvents.map((event, index) => (
                <Animated.View
                  key={index}
                  entering={SlideInUp.delay(index * 100).duration(400)}
                >
                  <EventCard
                    event={event}
                    onAddToCalendar={(e) => handleAddToCalendar(e, index)}
                    isAdding={addingIndex === index}
                    added={addedIndices.has(index)}
                    onEdit={(e) => handleEditEvent(e, index)}
                  />
                </Animated.View>
              ))}
            </View>

            {parsedEvents.length > 1 &&
              !parsedEvents.every((_, i) => addedIndices.has(i)) && (
                <Pressable
                  onPress={async () => {
                    for (let i = 0; i < parsedEvents.length; i++) {
                      if (!addedIndices.has(i)) {
                        await handleAddToCalendar(parsedEvents[i], i);
                      }
                    }
                  }}
                  style={({ pressed }) => [
                    styles.addAllButton,
                    pressed && styles.addAllButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="checkmark-done"
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.addAllText}>Add All to Calendar</Text>
                </Pressable>
              )}

            {parsedEvents.every((_, i) => addedIndices.has(i)) && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.doneButton,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </Animated.View>
            )}
          </>
        )}
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 100,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.warning,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  historyList: {
    gap: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  resultsSummary: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceHigh: {
    backgroundColor: Colors.successBg,
  },
  confidenceMedium: {
    backgroundColor: Colors.warningBg,
  },
  confidenceLow: {
    backgroundColor: Colors.errorBg,
  },
  confidenceText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  eventCount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  eventsList: {
    gap: 12,
  },
  addAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  addAllButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  addAllText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});
