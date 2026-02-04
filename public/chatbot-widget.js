(function() {
  'use strict';
  
  // Configuration - UPDATE THIS WITH YOUR DEPLOYED URL
  // For local testing, use: 'http://localhost:3000/widget'
  // For production, use: 'https://your-domain.vercel.app/widget'
  const WIDGET_URL = window.location.origin + '/widget'; // Auto-detect current domain
  const BUTTON_SIZE = 60;
  const WINDOW_WIDTH = 380;
  const WINDOW_HEIGHT = 600;
  
  // Prevent duplicate initialization
  if (window.RCChatbotLoaded) {
    return;
  }
  window.RCChatbotLoaded = true;
  
  // Create floating button
  const createButton = () => {
    const button = document.createElement('div');
    button.id = 'rc-chatbot-button';
    button.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
      </svg>
    `;
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: ${BUTTON_SIZE}px;
      height: ${BUTTON_SIZE}px;
      background: linear-gradient(135deg, #dc2626 0%, #533483 100%);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.5)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.4)';
    });
    
    return button;
  };
  
  // Create chat window
  const createWindow = () => {
    const chatWindow = document.createElement('div');
    chatWindow.id = 'rc-chatbot-window';
    
    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    
    chatWindow.style.cssText = `
      position: fixed;
      bottom: ${isMobile ? '0' : '90px'};
      right: ${isMobile ? '0' : '20px'};
      width: ${isMobile ? '100vw' : WINDOW_WIDTH + 'px'};
      height: ${isMobile ? '100vh' : WINDOW_HEIGHT + 'px'};
      background: #ffffff;
      border-radius: ${isMobile ? '0' : '12px'};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(83, 52, 131, 0.1);
    `;
    
    // Handle window resize
    const handleResize = () => {
      const isMobileNow = window.innerWidth <= 768;
      chatWindow.style.bottom = isMobileNow ? '0' : '90px';
      chatWindow.style.right = isMobileNow ? '0' : '20px';
      chatWindow.style.width = isMobileNow ? '100vw' : WINDOW_WIDTH + 'px';
      chatWindow.style.height = isMobileNow ? '100vh' : WINDOW_HEIGHT + 'px';
      chatWindow.style.borderRadius = isMobileNow ? '0' : '12px';
    };
    
    window.addEventListener('resize', handleResize);
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = WIDGET_URL;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
    iframe.setAttribute('allow', 'microphone');
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      background: rgba(0, 0, 0, 0.1);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 24px;
      line-height: 1;
      color: #1a202c;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(0, 0, 0, 0.2)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'rgba(0, 0, 0, 0.1)';
    });
    
    closeButton.addEventListener('click', () => {
      chatWindow.style.display = 'none';
    });
    
    chatWindow.appendChild(closeButton);
    chatWindow.appendChild(iframe);
    
    return chatWindow;
  };
  
  // Initialize widget
  const init = () => {
    if (document.getElementById('rc-chatbot-button')) {
      return;
    }
    
    const button = createButton();
    const chatWindow = createWindow();
    
    document.body.appendChild(button);
    document.body.appendChild(chatWindow);
    
    // Toggle window
    button.addEventListener('click', () => {
      const isVisible = chatWindow.style.display === 'flex';
      chatWindow.style.display = isVisible ? 'none' : 'flex';
      
      if (!isVisible) {
        setTimeout(() => {
          const iframe = chatWindow.querySelector('iframe');
          if (iframe) {
            iframe.focus();
          }
        }, 100);
      }
    });
    
    // Close on outside click (optional - only for desktop)
    if (window.innerWidth > 768) {
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!chatWindow.contains(target) && !button.contains(target) && chatWindow.style.display === 'flex') {
          chatWindow.style.display = 'none';
        }
      });
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
