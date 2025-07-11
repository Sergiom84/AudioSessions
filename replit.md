# Replit.md

## Overview

This repository contains an interactive audio sessions archive website inspired by Lusion.co's design aesthetic. The site features four distinct music genre sections (House, Techno, Progressive, Remember) with a dark, technological interface and interactive elements. Built with pure HTML and CSS, it showcases audio collections from Archive.org in a modern, dynamic interface.

## User Preferences

Preferred communication style: Simple, everyday language.
Design inspiration: Lusion.co (anti-minimalist, interactive, technological aesthetic)
Color scheme: Dark theme with neon accent colors (green, pink, blue, orange)

## System Architecture

### Frontend Architecture
- **Static Website**: Pure HTML5 and CSS3 implementation
- **No Framework Dependencies**: Vanilla web technologies for maximum simplicity and performance
- **Responsive Design**: Mobile-first approach using CSS media queries
- **Progressive Enhancement**: Graceful degradation for audio elements with fallback links

### Design System
- **CSS Custom Properties**: Centralized design tokens for colors, spacing, and dimensions
- **Component-Based CSS**: Modular styling approach with reusable session card components
- **Accessibility-First**: Semantic HTML with ARIA labels and screen reader support

## Key Components

### 1. Audio Session Cards
- **Purpose**: Display individual audio sessions with embedded players
- **Structure**: Article elements containing titles and audio controls
- **Functionality**: HTML5 audio elements with Archive.org source URLs
- **Fallback**: Direct download links for unsupported browsers

### 2. Interactive Navigation System
- **Three-Level Navigation**: Main page → Genre pages → Individual session player
- **Visual Effects**: Scroll-triggered animations, parallax particles, and progress indicators
- **Genre Sections**: House, Techno, Progressive, and Remember with unique visual styles
- **Session Integration**: Real sessions from Archive.org with complete metadata

### 3. Responsive Layout System
- **Container**: Centered layout with maximum width constraints
- **Grid System**: Flexible session card arrangement
- **Spacing**: Consistent spacing using CSS custom properties

### 4. Visual Design Elements
- **Lusion.co Inspired**: Anti-minimalist design with interactive technological elements
- **Background Effects**: Floating particles, scroll progress bars, and dynamic gradients
- **Card Interactions**: Hover effects with overlay transitions
- **SVG Graphics**: Custom session artwork with thematic visual representations
- **Typography**: System font stack for optimal performance

## Data Flow

### Content Management
1. **Static Content**: Audio sessions are configured in JavaScript data structures
2. **External Hosting**: Audio files hosted on Archive.org
3. **Direct Linking**: Direct MP3 links from Archive.org servers
4. **No Backend**: Pure client-side rendering with URL parameters for session routing

### Current Sessions
- **First Date Vol. II**: Progressive house session with 20-track tracklist (64:59 duration)
  - Location: House section as Progressive House
  - Archive.org URL: https://archive.org/details/first-date-vol.-ii
  - Custom sunset road trip themed SVG artwork
  - Complete metadata and tracklist integration

### Adding New Sessions
1. Add session data to the sessionData object in player.html
2. Create session card in appropriate genre page (house.html, progressive.html, etc.)
3. Design custom SVG artwork for session visual identity
4. Ensure Archive.org URL is accessible and properly formatted
5. Test navigation flow and audio playback functionality

## External Dependencies

### Archive.org Integration
- **Purpose**: Audio file hosting and delivery
- **Implementation**: Direct linking to Archive.org download URLs
- **Format Support**: MP3 audio format
- **Fallback Strategy**: Download links for accessibility

### Browser Dependencies
- **HTML5 Audio**: Modern browser audio element support
- **CSS Grid/Flexbox**: Modern layout capabilities
- **Custom Properties**: CSS variable support

## Deployment Strategy

### Static Hosting
- **Target**: Any static file hosting service (GitHub Pages, Netlify, Vercel)
- **Requirements**: Basic HTTP server capability
- **Files**: Only index.html and style.css need to be served
- **No Build Process**: Direct deployment of source files

### Performance Considerations
- **Audio Loading**: `preload="none"` for faster initial page load
- **No External CSS**: Inline styles reduce HTTP requests
- **Minimal Resources**: Lightweight codebase for fast loading

### Maintenance Strategy
- **Simple Updates**: Add new sessions by copying HTML template blocks
- **Version Control**: Standard Git workflow for content updates
- **Archive.org Dependency**: Monitor external audio file availability

### Scalability Notes
- **Content Growth**: Linear scaling by adding more session cards
- **Performance**: May require pagination for large numbers of sessions
- **Accessibility**: Maintain semantic structure as content grows