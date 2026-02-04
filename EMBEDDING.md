# Embedding the RapidClaims Chatbot Widget

This guide explains how to embed the RapidClaims chatbot widget on any website.

## Overview

The chatbot is available in two forms:
- **Full Page**: Visit `https://chatbot-rc.vercel.app/` for the complete chatbot experience
- **Widget**: Visit `https://hbmp-survey-manager.vercel.app/` for the embeddable version

## Quick Embed

Add this script tag to your website's HTML (before the closing `</body>` tag):

```html
<script src="https://your-domain.com/chatbot-widget.js"></script>
```

Replace `your-domain.com` with your actual deployment URL (e.g., `your-app.vercel.app`).

## How It Works

1. The script creates a floating chat button in the bottom-right corner
2. When clicked, it opens a chat window with the RapidClaims chatbot
3. The chat window is responsive and adapts to mobile devices
4. Users can interact with the chatbot, ask questions, and book meetings

## Configuration

The widget script automatically detects the current domain. If you need to customize it, edit `public/chatbot-widget.js` and modify these variables:

```javascript
const WIDGET_URL = window.location.origin + '/widget'; // Auto-detects domain
const BUTTON_SIZE = 60;        // Size of floating button (px)
const WINDOW_WIDTH = 380;      // Chat window width (px)
const WINDOW_HEIGHT = 600;     // Chat window height (px)
```

## Mobile Responsive

The widget automatically adjusts on mobile devices:
- On screens ≤ 768px, the chat window becomes full-screen
- The floating button remains accessible
- Touch-friendly interface

## Customization

### Changing Button Position

Edit `public/chatbot-widget.js` and modify the button styles:

```javascript
button.style.cssText = `
  position: fixed;
  bottom: 20px;    // Change vertical position
  right: 20px;      // Change horizontal position
  // ... other styles
`;
```

### Changing Colors

The button uses RapidClaims brand colors. To change them:

```javascript
background: linear-gradient(135deg, #dc2626 0%, #533483 100%);
```

Replace `#dc2626` (red) and `#533483` (purple) with your preferred colors.

## Testing Locally

1. Start your development server: `npm run dev`
2. The widget will be available at `http://localhost:3000/widget`
3. Test the embed script by creating a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Widget</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>Scroll down to see the chatbot button in the bottom-right corner.</p>
    
    <!-- Embed the widget -->
    <script src="http://localhost:3000/chatbot-widget.js"></script>
</body>
</html>
```

## Deployment

1. Deploy your Next.js app to Vercel/Netlify
2. The widget will be available at `https://your-domain.com/widget`
3. The embed script will be at `https://your-domain.com/chatbot-widget.js`
4. Share the embed script URL with website owners

## Features

- ✅ Full chatbot functionality (RAG, booking, etc.)
- ✅ Responsive design (mobile & desktop)
- ✅ Easy to embed (single script tag)
- ✅ No conflicts with existing website styles
- ✅ Auto-detects domain for easy deployment

## Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify the script URL is correct
3. Ensure the `/widget` route is accessible
4. Check for JavaScript errors on the host page

### Styling Conflicts

The widget uses isolated styles and should not conflict with your website. If you encounter issues:

1. Check z-index values (button: 9999, window: 10000)
2. Verify no CSS conflicts with `.rc-chatbot-button` or `.rc-chatbot-window`
3. Test in an incognito window to rule out extension conflicts

### CORS Issues

If embedding from a different domain, ensure:
- Your Next.js app allows iframe embedding
- CORS headers are properly configured
- The widget route is publicly accessible

## Support

For issues or questions, check:
- Main README.md for general setup
- Widget route: `/widget`
- Embed script: `/chatbot-widget.js`
