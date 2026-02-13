# 🍿 Watchlist+

**Platform independent content tracking for people who actually finish what they start.**

- [🍿 Watchlist+](#-watchlist)
  - [The Story](#the-story)
  - [Why This Exists](#why-this-exists)
    - [The Platform Problem](#the-platform-problem)
    - [The Memory Problem](#the-memory-problem)
    - [The Sharing Problem](#the-sharing-problem)
  - [Features](#features)
    - [📋 Watchlist Management](#-watchlist-management)
    - [🤝 Collaboration](#-collaboration)
    - [🔒 Design Philosophy](#-design-philosophy)
    - [✨ User Experience](#-user-experience)
  - [Technical Highlights](#technical-highlights)
    - [🔐 Security](#-security)
    - [♿ Accessibility](#-accessibility)
    - [🏗️ Architecture](#️-architecture)
    - [🎨 Design System](#-design-system)
  - [Getting Started](#getting-started)
    - [Finding Poster URLs](#finding-poster-urls)
  - [Current Status](#current-status)
  - [Future Considerations](#future-considerations)
  - [Tech Stack](#tech-stack)
  - [Browser Support](#browser-support)

## The Story

It started with a simple question: _"Should we watch the MCU movies in chronological order?"_

My girlfriend and I decided yes. Someone needed to track what we'd watched and what came next. That someone was me. Armed with a notes app and good intentions, I quickly realized this was going to be... tedious.

But here's the thing, we don't just watch everything on one platform. Netflix today, Disney+ tomorrow, maybe a Blu-ray if we're feeling retro. **Where we watch doesn't matter. What matters is remembering what we've watched.**

That's when Watchlist+ was born: a dead simple tracker that doesn't care whether you're streaming, downloading, or dusting off a DVD player.

## Why This Exists

### The Platform Problem

Modern content is scattered. You might start a show on one service, continue it on another, or watch a movie series across three different platforms. Traditional watchlists lock you into one ecosystem. Watchlist+ doesn't.

### The Memory Problem

I'm a chronic deleter. Notes get cleaned up. Apps get uninstalled. Files disappear during hard drive migrations. Then, 10 years later, I'm staring at a movie thinking _"Did I watch this? I think I did... maybe?"_

**Watchlist+ is a source of truth.** Once you add something and mark it watched, that record stays. No deleting movies. No editing titles. No unmarking things as watched. If you logged it, you watched it. Period.

### The Sharing Problem

Initial release was great for personal tracking, but manual entry for a 30+ movie franchise? Painful. Especially when two people need the same list.

Enter the sharing feature: export your watchlist as JSON, send it to anyone, they import it instantly. Fresh state, ready to track together. No accounts. No cloud sync. Just copy, paste, done.

## Features

### 📋 Watchlist Management

- **Create unlimited watchlists** for different series, genres, or projects
- **Add movies with posters** (just paste a poster URL and title)
- **Track your progress** with visual watched/unwatched badges
- **Leave reviews** on anything you've watched (or plan to watch)

### 🤝 Collaboration

- **Share watchlists** via simple JSON export (copies to clipboard)
- **Import shared watchlists** from friends or your other devices
- **Smart import handling**: automatically renames duplicates and resets progress for a fresh start

### 🔒 Design Philosophy

- **No delete functionality**: Once added, it's permanent. This is intentional. You're building a history.
- **No editing core content**: Movie titles and posters can't be changed after creation. Prevents accidental mutations.
- **One way watched status**: Can't unmark as watched. If you logged it, it happened.
- **Reviews are flexible**: Your thoughts can change, edit reviews anytime.
- **Optional confirmations**: Toggle confirmation dialogs for actions in settings if you prefer faster interactions.

This might seem limiting, but it's liberating. You're not managing a todo list. You're curating a record of what you've experienced.

### ✨ User Experience

- **Empty state guidance** when you're just starting out
- **Visual poster display** for quick recognition
- **Accessible keyboard navigation** (Escape to close dialogs, proper focus management)
- **Touch friendly interface** with proper tap target sizing (primarily designed for mobile PWA usage)
- **Dark theme** designed for cozy movie night browsing
- **Mobile-first design** optimized for cellphone use (works on desktop but cards may stretch wider than ideal)

## Technical Highlights

Built with intentionality and care for the details:

### 🔐 Security

- **XSS protection**: All user inputs are sanitized
- **URL validation**: Only HTTP/HTTPS poster URLs allowed (prevents protocol injection)
- **Safe data handling**: Validation on imports, error boundaries on storage operations

### ♿ Accessibility

- **Full keyboard navigation** with focus management
- **ARIA attributes** for screen readers
- **Semantic HTML** throughout
- **Minimum 44×44px touch targets** for interactive elements
- **Respects reduced motion preferences**

### 🏗️ Architecture

- **Client side only**: No servers, no tracking, no accounts
- **localStorage persistence**: Your data lives in your browser
- **Event delegation** for efficient dynamic content
- **Reactive rendering** from a single source of truth
- **Modern web standards**: Native dialog elements, Clipboard API, `crypto.randomUUID`

### 🎨 Design System

- **CSS custom properties** for consistent theming
- **Design tokens** for spacing, colors, and typography
- **Mobile first responsive design** with a focus on PWA functionality
- **Component based CSS architecture**

## Getting Started

1. **Open [Watchlist+](https://madebytheo.github.io/WatchlistPlus/)** in any modern browser (Chrome, Firefox, Safari, Edge)
2. **Create your first watchlist** by clicking the **+** button
3. **Add movies** by clicking into a watchlist and hitting "Add movie"
   - Find poster URLs on sites like TMDB, IMDb, or movie databases
   - Add the title and paste the image URL
4. **Mark movies as watched** as you complete them
5. **Leave reviews** to remember your thoughts
6. **Share your watchlist** using the share button (copies JSON to clipboard)
7. **Import shared lists** using the import button in settings
8. **Customize settings** including toggling confirmation dialogs

### Finding Poster URLs

Right click any movie poster on the web → "Copy Image Address" → Paste into Watchlist+

## Current Status

**Version:** 1.2.9 _(Considered feature-complete)_

Watchlist+ has reached a stable state where it accomplishes everything it was designed to do. The app is being used daily in its primary use case: as a PWA on mobile devices for tracking shared watchlists between two people.

**What works great:**

- Core watchlist functionality is solid
- Mobile PWA experience is smooth
- Sharing and importing works flawlessly
- Data persistence is reliable
- Review system provides the intended value

**Known limitations:**

- Desktop experience is functional but cards stretch wider than ideal
- No native mobile app features (push notifications, etc.)
- Manual poster URL entry (intentional for simplicity)

**This project demonstrates:**

- Sometimes "good enough" is better than an unshipped "perfect" app
- Focused scope leads to finished projects
- Building for your actual use case produces better tools

## Future Considerations

If long-term usage proves the concept valuable, potential evolution paths include:

- **Native mobile app**: Converting to Vue + Capacitor or React Native for dedicated iOS/Android apps
- **Desktop refinement**: Constraining card width for better large-screen experience
- **Automatic poster fetching**: Integration with TMDB API for easier content addition

However, the current web-based PWA accomplishes the goal and ships value today. Further development will only be considered if real-world usage demands it.

## Tech Stack

- **Vanilla JavaScript** (no frameworks, no build step)
- **Modern CSS** (custom properties, grid, flexbox)
- **HTML5** (semantic, accessible)
- **localStorage** for persistence
- **Ionicons** for iconography
- **Outfit typeface** (locally hosted)

## Browser Support

Works in all modern browsers supporting:

- Native `<dialog>` element
- `crypto.randomUUID()`
- localStorage
- CSS Grid & Flexbox
- Clipboard API

Basically, anything from ~2022 onwards.

---

_Built by [@madebytheo](https://github.com/madebytheo) as a practical solution to a real problem. Sometimes the best code is the code that ships._
