/**
 * Consulteo DataLayer Script
 * Version: 1.0.0
 * 
 * Ce script doit être inclus dans le <head> de chaque page :
 * <script src="consulteo-datalayer.js"></script>
 */

(function() {
    'use strict';

    // Initialize dataLayer if not exists
    window.dataLayer = window.dataLayer || [];

    /**
     * Hash email using SHA-256 or fallback method
     * @param {string} email - Email to hash
     * @returns {Promise<string|null>} Hashed email or null
     */
    async function hashEmail(email) {
        if (!email) return null;
        
        try {
            // Use Web Crypto API if available (modern browsers)
            if (window.crypto && window.crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(email.toLowerCase().trim());
                const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (error) {
            console.warn('Crypto API not available, using fallback hash');
        }
        
        // Fallback simple hash function for older browsers
        let hash = 0;
        const email_lower = email.toLowerCase().trim();
        for (let i = 0; i < email_lower.length; i++) {
            const char = email_lower.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Get user login status and email from localStorage
     * @returns {Object} User data object
     */
    function getUserData() {
        try {
            const userData = localStorage.getItem('consulteo-user');
            if (userData) {
                const user = JSON.parse(userData);
                return {
                    isLoggedIn: true,
                    email: user.email || null
                };
            }
        } catch (error) {
            console.warn('Error reading user data:', error);
        }
        
        return {
            isLoggedIn: false,
            email: null
        };
    }

    /**
     * Get page information based on current URL and page content
     * @returns {Object} Page info object with page_name and page_category
     */
    function getPageInfo() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.html';
        
        // Homepage
        if (fileName === 'index.html' || fileName === '' || path === '/' || path === '/index.html') {
            return {
                page_name: 'homepage',
                page_category: 'home'
            };
        }
        
        // Category pages (PLP - Product Listing Pages)
        const categoryPages = {
            'managers.html': 'managers',
            'leads.html': 'leads', 
            'consultants.html': 'consultants',
            'interns.html': 'interns'
        };
        
        if (categoryPages[fileName]) {
            return {
                page_name: `category ${categoryPages[fileName]}`,
                page_category: 'PLP'
            };
        }
        
        // Checkout page
        if (fileName === 'checkout.html') {
            return {
                page_name: 'checkout',
                page_category: 'checkout'
            };
        }
        
        // Account page
        if (fileName === 'account.html') {
            return {
                page_name: 'account',
                page_category: 'account'
            };
        }
        
        // Confirmation page
        if (fileName === 'confirmation.html') {
            return {
                page_name: 'purchase confirmation',
                page_category: 'account'
            };
        }
        
        // Product pages (PDP - Product Detail Pages)
        // Any page ending with -product-page.html
        if (fileName.includes('-product-page.html')) {
            // Extract consultant name from filename
            // Example: marie-dubois-product-page.html -> Marie Dubois
            const consultantName = fileName
                .replace('-product-page.html', '')
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
                
            return {
                page_name: `product ${consultantName}`,
                page_category: 'PDP'
            };
        }
        
        // Default fallback for unknown pages
        return {
            page_name: fileName.replace('.html', '') || 'unknown',
            page_category: 'other'
        };
    }

    /**
     * Main function to collect data and push to dataLayer
     */
    async function pushPageDataLayer() {
        try {
            const userData = getUserData();
            const pageInfo = getPageInfo();
            const hashedEmail = userData.email ? await hashEmail(userData.email) : null;
            
            const dataLayerObject = {
                event: 'page_data_ready',
                country: 'fr',
                language: 'fr-fr',
                page_name: pageInfo.page_name,
                page_category: pageInfo.page_category,
                user_logged_in: userData.isLoggedIn,
                email: hashedEmail
            };
            
            // Push to dataLayer
            window.dataLayer.push(dataLayerObject);
            
            // Console log for debugging (remove in production)
            if (console && console.log) {
                console.log('Consulteo DataLayer pushed:', dataLayerObject);
            }
            
        } catch (error) {
            console.error('Error pushing to dataLayer:', error);
        }
    }

    /**
     * Initialize dataLayer push when DOM is ready
     */
    function initDataLayer() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', pushPageDataLayer);
        } else {
            // DOM is already ready
            pushPageDataLayer();
        }
    }

    // Auto-initialize when script loads
    initDataLayer();

    // Expose function globally for manual triggering if needed
    window.ConsulteoDataLayer = {
        push: pushPageDataLayer,
        getUserData: getUserData,
        getPageInfo: getPageInfo,
        hashEmail: hashEmail
    };

})();