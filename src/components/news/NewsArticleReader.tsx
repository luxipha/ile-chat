import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '../ui/Typography';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { NewsArticle } from '../../types';

interface NewsArticleReaderProps {
  visible: boolean;
  article: NewsArticle | null;
  onClose: () => void;
  fullScreen?: boolean; // Option to make modal smaller
}

const NewsArticleReader: React.FC<NewsArticleReaderProps> = ({
  visible,
  article,
  onClose,
  fullScreen = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const articleUrl = article?.url;

  // Enhanced content cleaning JavaScript with specific handling for Linda Ikeji and Gistreel
  const contentCleaningScript = `
    (function() {
      console.log('Starting content cleaning for:', window.location.hostname);
      
      // Detect specific sites that need special handling
      const isGistreel = window.location.hostname.includes('gistreel.com');
      const isLindaIkeji = window.location.hostname.includes('lindaikejisblog.com');
      
      // Site-specific content preservation (only for Linda Ikeji and Gistreel)
      const preservedSelectors = [];
      const siteSpecificBlocking = [];
      
      if (isGistreel) {
        preservedSelectors.push(
          '.post-content', '.entry-content', '.article-content', '.content',
          '.post', '.article', 'main', '[class*="post"]', '[class*="article"]',
          '.single-post', '.post-body', '.entry-body'
        );
        
        siteSpecificBlocking.push(
          // Gistreel-specific unwanted elements
          '.advertisement', '.ads', '.ad-container', '.google-ads', '.adsbygoogle',
          '.social-share', '.share-buttons', '.comments', '.sidebar', '.widget',
          '.main-navigation', '.breadcrumbs', '.site-footer', '.post-tags',
          '.author-bio', '.popup', '.modal', '#secondary', '.wp-block-latest-posts',
          '.entry-meta', '.post-navigation', '.nav-links'
        );
      }
      
      if (isLindaIkeji) {
        preservedSelectors.push(
          '.post-content', '.entry-content', '.post-body', '.article-content',
          '.content', '.post', '.article', 'main'
        );
        
        siteSpecificBlocking.push(
          // Linda Ikeji-specific unwanted elements
          '.advertisement', '.ads', '.google-ads', '.adsbygoogle',
          '.social-share', '.share-buttons', '.comments', '.sidebar',
          '.widget', '.navigation', '.footer', '.related-posts'
        );
      }
      
      // Comprehensive selectors for unwanted elements
      const unwantedSelectors = [
        // NAVIGATION & HEADERS
        'header', 'nav', '.header', '.navigation', '.nav', '.navbar', '.menu',
        '.top-bar', '.site-header', '.main-header', '.primary-header',
        '[class*="header"]', '[id*="header"]', '[class*="nav"]', '[id*="nav"]',
        '.breadcrumb', '.breadcrumbs', '[class*="breadcrumb"]',
        
        // FOOTERS
        'footer', '.footer', '.site-footer', '.main-footer', '.page-footer',
        '[class*="footer"]', '[id*="footer"]',
        
        // SIDEBARS
        'aside', '.sidebar', '.side-bar', '.widget', '.widgets',
        '[class*="sidebar"]', '[id*="sidebar"]', '[class*="widget"]',
        
        // ADS - More comprehensive
        '[class*="ad-"]', '[class*="ads"]', '[class*="advertisement"]', '[class*="advert"]',
        '[id*="ad-"]', '[id*="ads"]', '[id*="advertisement"]', '[id*="advert"]',
        '.ad', '.ads', '.advertisement', '.advert', '.sponsor', '.sponsored',
        '.promo', '.promotion', '.banner', '.commercial',
        'ins.adsbygoogle', '.adsbygoogle', '.google-ads', '.adsense',
        '[class*="google-ad"]', '[class*="adsense"]', '[class*="dfp"]',
        
        // AD NETWORKS & IFRAMES
        'iframe[src*="googlesyndication"]', 'iframe[src*="doubleclick"]',
        'iframe[src*="googleadservices"]', 'iframe[src*="adsystem"]',
        'iframe[src*="outbrain"]', 'iframe[src*="taboola"]', 'iframe[src*="facebook.com/tr"]',
        'iframe[src*="amazon-adsystem"]', 'iframe[src*="criteo"]',
        
        // SOCIAL MEDIA & SHARING
        '.social', '.share', '.sharing', '.social-share', '.social-media',
        '[class*="social"]', '[class*="share"]', '[class*="sharing"]',
        '.facebook', '.twitter', '.instagram', '.whatsapp', '.telegram',
        '.social-icons', '.share-buttons', '.follow-us',
        'iframe[src*="facebook.com/plugins"]', 'iframe[src*="twitter.com"]',
        
        // COMMENTS SECTIONS
        '.comments', '.comment', '.disqus', '[class*="comment"]',
        '[id*="comment"]', '.discussion', '[class*="disqus"]',
        
        // NEWSLETTER & SUBSCRIPTIONS
        '.newsletter', '.subscribe', '.subscription', '.signup', '.sign-up',
        '[class*="newsletter"]', '[class*="subscribe"]', '[class*="signup"]',
        '.email-signup', '.mailing-list',
        
        // POPUPS & MODALS
        '.popup', '.modal', '.overlay', '.lightbox', '.dialog',
        '[class*="popup"]', '[class*="modal"]', '[class*="overlay"]',
        '.notification-bar', '.banner-notification',
        
        // COOKIE & GDPR NOTICES
        '[class*="cookie"]', '[class*="gdpr"]', '[class*="consent"]',
        '.cookie-notice', '.privacy-notice', '.gdpr-notice',
        
        // SEARCH BARS
        '.search', '.search-bar', '.search-box', '.search-form',
        '[class*="search"]', '[id*="search"]',
        
        // RELATED/RECOMMENDED CONTENT
        '.related', '.recommended', '.you-may-like', '.more-stories',
        '[class*="related"]', '[class*="recommended"]', '[class*="suggestions"]',
        '.outbrain', '.taboola', '.content-recommendation',
        
        // AUTHOR INFO (keep minimal)
        '.author-bio', '.author-info', '.byline-extended',
        
        // FLOATING ELEMENTS
        '.floating', '.sticky', '.fixed', '.float',
        '[style*="position: fixed"]', '[style*="position:fixed"]',
        '[style*="position: sticky"]', '[style*="position:sticky"]',
        
        // TAGS & CATEGORIES (often cluttered)
        '.tags', '.categories', '.tag-list', '.category-list',
        '[class*="tags"]', '[class*="categories"]',
        
        // BACK TO TOP BUTTONS
        '.back-to-top', '.scroll-to-top', '[class*="back-to-top"]'
      ];
      
      // Function to clean content - aggressive for main sources, gentle for special sites
      function cleanContent() {
        const needsSpecialHandling = isGistreel || isLindaIkeji;
        
        if (needsSpecialHandling) {
          // Gentle cleaning for Linda Ikeji and Gistreel
          // Check if any preserved content exists
          let hasPreservedContent = false;
          preservedSelectors.forEach(selector => {
            if (document.querySelector(selector)) {
              hasPreservedContent = true;
            }
          });
          
          // Only remove unwanted elements if we have preserved content
          if (hasPreservedContent) {
            unwantedSelectors.forEach(selector => {
              try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                  if (el && el.parentNode) {
                    // Don't remove if it contains preserved content
                    let shouldPreserve = false;
                    preservedSelectors.forEach(preservedSelector => {
                      if (el.querySelector(preservedSelector) || el.matches(preservedSelector)) {
                        shouldPreserve = true;
                      }
                    });
                    
                    if (!shouldPreserve) {
                      el.remove();
                    }
                  }
                });
              } catch (e) {
                // Ignore selector errors
              }
            });
          }
        } else {
          // Aggressive cleaning for Guardian, Punch, Vanguard, Daily Post
          unwantedSelectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el && el.parentNode) {
                  el.remove();
                }
              });
            } catch (e) {
              // Ignore selector errors
            }
          });
        }
        
        // Apply site-specific blocking
        siteSpecificBlocking.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el && el.parentNode) {
                el.remove();
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });
        
        // Remove all script tags (ads often load via scripts)
        document.querySelectorAll('script').forEach(script => {
          const src = script.src.toLowerCase();
          const content = script.textContent.toLowerCase();
          if (src.includes('ad') || src.includes('analytics') || 
              src.includes('tracking') || src.includes('gtm') ||
              content.includes('advertisement') || content.includes('gtag')) {
            script.remove();
          }
        });
        
        // Remove elements by text content (ads often have these words)
        const adTextPatterns = [
          /advertisement/i, /sponsored/i, /promoted/i, /ad by/i,
          /share this/i, /follow us/i, /subscribe/i, /newsletter/i
        ];
        
        document.querySelectorAll('div, span, section, p').forEach(el => {
          const text = el.textContent || '';
          if (adTextPatterns.some(pattern => pattern.test(text)) && text.trim().length < 100) {
            el.remove();
          }
        });
        
        // Clean up empty containers
        document.querySelectorAll('div, section, aside').forEach(el => {
          if (!el.textContent.trim() && !el.querySelector('img, video, audio')) {
            el.remove();
          }
        });
      }
      
      // Apply aggressive CSS to hide remaining elements
      const style = document.createElement('style');
      style.textContent = \`
        /* Hide all potential ad containers */
        *[class*="ad"]:not([class*="read"]):not([class*="head"]):not([class*="load"]) { 
          display: none !important; 
        }
        *[id*="ad"]:not([id*="read"]):not([id*="head"]):not([id*="load"]) { 
          display: none !important; 
        }
        
        /* Remove all navigation elements */
        header, nav, footer, aside, .sidebar, .menu, .navigation {
          display: none !important;
        }
        
        /* Hide social sharing */
        *[class*="social"], *[class*="share"], *[class*="follow"] {
          display: none !important;
        }
        
        /* Hide all fixed/sticky elements */
        *[style*="position: fixed"], *[style*="position: sticky"] {
          display: none !important;
        }
        
        /* Clean up the body */
        body {
          padding: 20px !important;
          margin: 0 !important;
          background: #ffffff !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          line-height: 1.6 !important;
          overflow-x: hidden !important;
        }
        
        /* Style the main content area */
        article, .article, .post, .content, .entry, main,
        [class*="article"], [class*="post"], [class*="content"] {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Style paragraphs and text */
        p {
          font-size: 16px !important;
          line-height: 1.6 !important;
          margin-bottom: 16px !important;
          color: #333 !important;
        }
        
        /* Style headlines */
        h1, h2, h3, h4, h5, h6 {
          color: #111 !important;
          margin: 20px 0 10px 0 !important;
          font-weight: 600 !important;
        }
        
        /* Style images */
        img {
          max-width: 100% !important;
          height: auto !important;
          margin: 10px 0 !important;
          border-radius: 8px !important;
        }
        
        /* Hide anything that looks like an ad by size */
        *[width="728"], *[height="90"], *[width="300"], *[height="250"],
        *[width="320"], *[height="50"], *[width="970"], *[height="90"] {
          display: none !important;
        }
        
        /* Hide iframes that are likely ads */
        iframe:not([src*="youtube"]):not([src*="vimeo"]):not([src*="instagram"]) {
          display: none !important;
        }
      \`;
      
      // Add site-specific CSS
      if (isGistreel) {
        style.textContent += \`
          /* Gistreel specific hiding */
          .wp-block-group, .wp-block-columns, .entry-footer,
          .post-navigation, .author-info, .related-posts,
          .comments-area, .comment-respond, .sidebar,
          .widget, .widget-area, #secondary, .footer-widgets,
          .site-footer, .breadcrumbs, .entry-meta,
          .post-tags, .post-categories, .share-buttons,
          .social-share, .newsletter-signup, .subscription,
          .advertisement, .ads, .google-ads, .adsbygoogle {
            display: none !important;
          }
          
          /* Clean up the main content area for Gistreel */
          .site-main, .main-content, .primary {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Style the post content specifically */
          .post-content, .entry-content, .single-post {
            padding: 20px !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
        \`;
      }
      
      if (isLindaIkeji) {
        style.textContent += \`
          /* Linda Ikeji specific hiding */
          .advertisement, .ads, .google-ads, .adsbygoogle,
          .social-share, .share-buttons, .comments, .sidebar,
          .widget, .navigation, .footer, .related-posts,
          .author-info, .tags, .categories {
            display: none !important;
          }
          
          /* Clean up the main content area */
          .post-content, .entry-content, .post-body {
            padding: 20px !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
        \`;
      }
      
      document.head.appendChild(style);
      
      // Run cleaning immediately
      cleanContent();
      
      // Monitor for new content and clean it
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
          cleanContent();
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      // Run cleaning periodically for lazy-loaded content
      setInterval(cleanContent, 1000);
      
      console.log('Content cleaning completed');
      
    })();
    true;
  `;

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
  };

  if (!articleUrl) {
    return (
      <Modal 
        visible={visible} 
        animationType="slide" 
        onRequestClose={onClose}
        presentationStyle={fullScreen ? "fullScreen" : "pageSheet"}
      >
        <SafeAreaView style={[styles.container, !fullScreen && styles.containerPartial]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color={Colors.gray700} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Typography variant="h4" style={styles.headerTitle}>
                {article?.title || 'Article'}
              </Typography>
            </View>
          </View>
          <View style={styles.errorContainer}>
            <Typography variant="body1" color="textSecondary" style={styles.noUrlMessage}>
              This article doesn't have a web link available yet.
            </Typography>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
      presentationStyle={fullScreen ? "fullScreen" : "pageSheet"}
    >
      <SafeAreaView style={[styles.container, !fullScreen && styles.containerPartial]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={24} color={Colors.gray700} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Typography variant="caption" color="textSecondary">
              {article?.source || 'Article'}
            </Typography>
            <Typography variant="h4" style={styles.headerTitle} numberOfLines={2}>
              {article?.title || 'Loading article'}
            </Typography>
          </View>
        </View>

        {hasError ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color={Colors.gray400} style={styles.errorIcon} />
            <Typography variant="h5" style={styles.errorTitle}>
              Unable to load article
            </Typography>
            <Typography variant="body2" color="textSecondary" style={styles.errorMessage}>
              The article couldn't be loaded. Please check your internet connection and try again.
            </Typography>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Typography variant="body1" color="primary" weight="semibold">
                Retry
              </Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.webViewContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <LoadingSpinner message="Loading article..." />
              </View>
            )}
            <WebView
              source={{ uri: articleUrl }}
              style={styles.webView}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              startInLoadingState={true}
              scalesPageToFit={true}
              showsVerticalScrollIndicator={false}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
              injectedJavaScript={contentCleaningScript}
              onMessage={(event) => {
                // Handle messages from injected JavaScript if needed
                console.log('WebView message:', event.nativeEvent.data);
              }}
              onShouldStartLoadWithRequest={(request) => {
                // Block known ad domains and tracking
                const blockedDomains = [
                  // Google Ads
                  'googlesyndication.com', 'doubleclick.net', 'googleadservices.com',
                  'googletag', 'adsense.com', 'google-analytics.com', 'googletagmanager.com',
                  
                  // Facebook/Meta
                  'facebook.com/tr', 'facebook.net', 'connect.facebook.net',
                  
                  // Major Ad Networks
                  'outbrain.com', 'taboola.com', 'adsystem.com', 'amazon-adsystem.com',
                  'adnxs.com', 'criteo.com', 'smartadserver.com', 'pubmatic.com',
                  'rubiconproject.com', 'openx.com', 'adsafeprotected.com',
                  
                  // Analytics & Tracking
                  'hotjar.com', 'fullstory.com', 'mixpanel.com', 'segment.com',
                  'kissmetrics.com', 'quantserve.com', 'scorecardresearch.com',
                  
                  // Nigerian/African Ad Networks
                  'adnium.com', 'ng.adnxs.com', 'ads.ng', 'nigeriads.com',
                  
                  // Social Media Trackers
                  'twitter.com/intent', 'platform.twitter.com', 'instagram.com/embed',
                  'linkedin.com/embed', 'pinterest.com/pin',
                  
                  // Other Ad/Tracking Services
                  'chartbeat.com', 'comscore.com', 'nielsen.com', 'moatads.com',
                  'adsupply.com', 'advertising.com', 'adskeeper.com',
                  'propellerads.com', 'popads.net', 'popcash.net'
                ];
                
                const url = request.url.toLowerCase();
                const shouldBlock = blockedDomains.some(domain => url.includes(domain));
                
                if (shouldBlock) {
                  console.log('Blocked ad request:', request.url);
                  return false; // Block the request
                }
                
                return true; // Allow the request
              }}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default NewsArticleReader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerPartial: {
    maxHeight: '90%',
    marginTop: 50,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerTitle: {
    lineHeight: 28,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  errorIcon: {
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
  },
  noUrlMessage: {
    textAlign: 'center',
    lineHeight: 22,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
