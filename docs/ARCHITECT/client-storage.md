# Client Storage

> See also: ARCHITECTURE.md — "Architecture Patterns > Image Storage", "Browser Storage", "Key Features Implementation > 1. Image Upload"

## Overview

Stage is a fully client-side editor with no server-side persistence for user designs. All uploaded images, design state, and export preferences are stored in the browser using a combination of IndexedDB (for drafts with embedded image data) and localStorage (for small images and preferences). This means users own their data entirely, but designs do not survive browser data clears.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary draft persistence | **IndexedDB** via `draft-storage.ts` | Can store large blobs (images as base64) without hitting localStorage's ~5 MB quota |
| Image blob storage | **localStorage with base64** (capped at 500 KB per image) | Simple key-value access; images over 500 KB use ephemeral blob URLs only |
| Export preferences | **localStorage** via `export-storage.ts` | Small JSON payload; no need for IndexedDB overhead |
| Canvas object state | **localStorage** keys `canvas-objects`, `canvas-background-prefs` | Fast synchronous reads on page load for restoring editor state |
| Autosave mechanism | **Debounced (1 s) effect** in `useAutosaveDraft` hook | Balances responsiveness with write frequency; skips saves when state fingerprint is unchanged |
| Blob URL lifecycle | **Created on upload, converted to base64 before draft save** | Blob URLs are session-scoped and cannot survive page reload, so base64 encoding is required for persistence |
| Server-side persistence | **None** | Keeps the app zero-auth and zero-backend for user data; simplifies deployment |

## Key Files

| File | Purpose |
|------|---------|
| `lib/draft-storage.ts` | IndexedDB CRUD for draft state, connection pooling, auto-cleanup, migration from localStorage |
| `lib/image-storage.ts` | localStorage utility for small image blobs (base64, 500 KB cap) |
| `lib/export-storage.ts` | localStorage utility for export preferences (format, quality, scale) |
| `hooks/useAutosaveDraft.ts` | React hook that debounce-saves both Zustand stores to IndexedDB on every state change |

## Data Flow

### Draft Autosave (write path)

```
State change in useImageStore / useEditorStore
  |
  v
useAutosaveDraft effect fires (debounced 1 s)
  |
  v
Fingerprint current state (JSON snapshot of key fields)
  |-- unchanged --> skip save
  |-- changed ----v
                  |
  Convert blob URLs to base64 (screenshot, background, custom overlays)
  |
  v
saveDraft(editorState, imageState) --> IndexedDB "drafts" store (key: "screenshotstudio-draft")
```

### Draft Restore (read path)

```
Page mount (useAutosaveDraft effect)
  |
  v
migrateFromLocalStorage()  -- one-time migration of old "stage-draft" key
  |
  v
autoCleanIndexedDB()  -- remove drafts older than 7 days, corrupted data, or over 50 MB
  |
  v
getDraft() from IndexedDB
  |-- null --> fresh editor state
  |-- found --> restore imageStore first (uploadedImageUrl), then editorStore fields
```

### Image Upload Storage

```
User uploads file
  |
  v
Create blob URL for immediate canvas display
  |
  v
saveImageBlob() in image-storage.ts
  |-- blob > 500 KB --> skip localStorage, only ephemeral blob URL
  |-- blob <= 500 KB --> store base64 in localStorage keyed by "screenshotstudio-img-{id}"
```

## IndexedDB Schema

**Database:** `screenshotstudio-db` (version 1)

| Store | Key | Value |
|-------|-----|-------|
| `drafts` | `"screenshotstudio-draft"` (single record) | `{ id, editorState, imageState, timestamp }` |

The connection uses a singleton pool (`getDB()`) that reuses the open connection and automatically reopens on unexpected close.

## Storage Limits & Cleanup

| Mechanism | Trigger | Action |
|-----------|---------|--------|
| Draft age | Draft older than 7 days | Delete draft |
| Storage quota | Usage > 50 MB or > 80% of browser quota | Clear all drafts |
| Data integrity | Missing required fields, invalid timestamp, malformed base64 | Delete corrupted draft |
| `beforeunload` guard | Page close while `isSaving === true` | Browser confirmation dialog |

## Trade-offs & Alternatives Considered

| Alternative | Why not chosen |
|-------------|---------------|
| Server-side storage (Supabase, S3) | Adds auth requirement and backend complexity; Stage targets anonymous, instant-use workflow |
| IndexedDB for everything (including small prefs) | Overkill for a few KB of JSON; localStorage is simpler and synchronous |
| Service Worker cache | Good for assets but not designed for structured user data with partial updates |
| Blob URLs without base64 conversion | Blob URLs are revoked on page reload; base64 is required for cross-session persistence |
| Storing full-resolution images in IndexedDB | Risks hitting browser storage quotas quickly; the 500 KB localStorage cap and base64-in-draft approach is a pragmatic middle ground |
