# Aurea SMS Calendar

## Overview
An Expo React Native app that extracts calendar events from SMS messages using AI and adds them directly to Google Calendar. Supports both automated webhook-based SMS forwarding and manual paste input.

## Architecture
- **Frontend**: Expo Router (file-based tab routing), React Native
- **Backend**: Express server on port 5000
- **AI**: OpenAI via Replit AI Integrations (no API key needed) for SMS parsing
- **Calendar**: Google Calendar API via Replit Integration (OAuth)
- **Storage**: AsyncStorage for local event history
- **SMS Ingestion**: Webhook endpoint + authenticated gateway for SMS forwarding
- **GitHub**: Repository at hounter38/Aurea-prototype

## Navigation
Tab-based navigation using expo-router `(tabs)` directory:
- **Activity** (`app/(tabs)/index.tsx`) - Live SMS feed with auto-processing status
- **Paste** (`app/(tabs)/paste.tsx`) - Manual SMS input and event extraction
- **Calendar** (`app/(tabs)/calendar.tsx`) - Monthly calendar grid with events
- **Settings** (`app/(tabs)/settings.tsx`) - Gateway config, API keys, devices

## Key Files
- `app/(tabs)/_layout.tsx` - Tab layout with BlurView/solid backgrounds
- `app/_layout.tsx` - Root layout with providers (fonts, React Query, keyboard)
- `server/routes.ts` - API endpoints (sms-webhook, parse-sms, create-event, etc.)
- `server/gateway.ts` - Gateway routes (API key auth, device management)
- `server/google-calendar.ts` - Google Calendar client with token refresh
- `components/CalendarView.tsx` - Monthly calendar grid with event dots
- `components/GatewayDashboard.tsx` - Gateway management UI
- `components/EventCard.tsx` - Parsed event card with edit/add to calendar
- `components/SMSInput.tsx` - SMS text input component
- `components/WebhookStatus.tsx` - Webhook log item with status chips
- `components/HistoryItem.tsx` - History list item
- `lib/storage.ts` - AsyncStorage helpers for event history
- `lib/query-client.ts` - React Query client with API helpers
- `constants/colors.ts` - Theme color constants

## API Endpoints
- `POST /api/sms-webhook` - Receives forwarded SMS, auto-parses and creates calendar events
- `GET /api/webhook-logs` - Returns processing history for webhook-received SMS
- `DELETE /api/webhook-logs` - Clears webhook log history
- `POST /api/parse-sms` - Manual SMS text parsing with AI
- `POST /api/create-event` - Create Google Calendar event
- `GET /api/calendar-events` - Get calendar events for a date range
- `GET /api/calendars` - List user's Google Calendars
- `GET /api/gateway/config` - Get gateway config (API key, devices)
- `POST /api/gateway/reveal-key` - Reveal full API key
- `POST /api/gateway/regenerate-key` - Regenerate API key
- `POST /api/gateway/devices` - Register a device
- `DELETE /api/gateway/devices/:id` - Remove a device
- `POST /api/gateway/sms` - Authenticated SMS gateway endpoint (requires x-api-key header)

## SMS Gateway
Built-in SMS gateway with API key authentication. The Settings tab provides:
- API key generation and management
- Device registration for tracking SMS sources
- Gateway URL with copy-to-clipboard
- Setup guides for Tasker, MacroDroid, Zapier+Twilio, and cURL testing
- The authenticated endpoint is `/api/gateway/sms` (requires x-api-key header)
- The legacy endpoint `/api/sms-webhook` still works without authentication

## Integrations
- Replit AI Integrations (OpenAI - no API key required)
- Google Calendar (OAuth via Replit connector)
- GitHub (OAuth via Replit connector - hounter38/Aurea-prototype)

## Theme
- Dark navy background (#0B1120)
- Teal primary (#14B8A6)
- Orange accent (#F97316)
- Inter font family (400, 500, 600, 700 weights)
- Card background (#1A2538)
