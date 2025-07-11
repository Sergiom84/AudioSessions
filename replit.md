# Replit.md

## Overview

This repository contains "Mis Sesiones - Archivo de Audio", a static audio archive website that displays audio sessions stored on Archive.org. It's a simple, elegant, and responsive web application built with pure HTML and CSS, designed to showcase audio collections in a modern interface.

## User Preferences

Preferred communication style: Simple, everyday language.

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

### 2. Responsive Layout System
- **Container**: Centered layout with maximum width constraints
- **Grid System**: Flexible session card arrangement
- **Spacing**: Consistent spacing using CSS custom properties

### 3. Visual Design Elements
- **Background Pattern**: Subtle dot pattern overlay for texture
- **Gradient Header**: Linear gradient background for visual appeal
- **Card Shadows**: Layered shadows with hover effects for depth
- **Typography**: System font stack for optimal performance

## Data Flow

### Content Management
1. **Static Content**: Audio sessions are hardcoded in HTML
2. **External Hosting**: Audio files hosted on Archive.org
3. **Direct Linking**: Direct MP3 links from Archive.org servers
4. **No Backend**: Pure client-side rendering

### Adding New Sessions
1. Copy the session card HTML template
2. Update the title and audio source URL
3. Ensure Archive.org URL is accessible
4. Test audio playback functionality

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