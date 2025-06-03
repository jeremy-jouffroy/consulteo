/**
 * Consulteo DataLayer Script - Enhanced E-commerce Version
 * Version: 2.0.0
 * 
 * Ce script doit être inclus dans le <head> de chaque page :
 * <script src="consulteo-datalayer.js"></script>
 */

(function() {
    'use strict';

    // Initialize dataLayer if not exists
    window.dataLayer = window.dataLayer || [];

    // Currency constant
    const CURRENCY = 'EUR';

    /**
     * Hash email using SHA-256 or fallback method
     * @param {string} email - Email to hash
     * @returns {Promise<string|null>} Hashed email or null
     */
    async function hashEmail(email) {
        if (!email) return null;
        
        try {
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
        
        // Fallback simple hash function
        let hash = 0;
        const email_lower = email.toLowerCase().trim();
        for (let i = 0; i < email_lower.length; i++) {
            const char = email_lower.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
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
        
        if (fileName === 'index.html' || fileName === '' || path === '/' || path === '/index.html') {
            return {
                page_name: 'homepage',
                page_category: 'home'
            };
        }
        
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
        
        if (fileName === 'checkout.html') {
            return {
                page_name: 'checkout',
                page_category: 'checkout'
            };
        }
        
        if (fileName === 'account.html') {
            return {
                page_name: 'account',
                page_category: 'account'
            };
        }
        
        if (fileName === 'confirmation.html') {
            return {
                page_name: 'purchase confirmation',
                page_category: 'account'
            };
        }
        
        if (fileName.includes('-product-page.html')) {
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
        
        return {
            page_name: fileName.replace('.html', '') || 'unknown',
            page_category: 'other'
        };
    }

    /**
     * Get cart data from localStorage
     * @returns {Array} Cart items
     */
    function getCartData() {
        try {
            return JSON.parse(localStorage.getItem('consulteo-cart') || '[]');
        } catch (error) {
            console.warn('Error reading cart data:', error);
            return [];
        }
    }

    /**
     * Format item data for ecommerce tracking
     * @param {Object} item - Item object
     * @param {number} index - Item index for list position
     * @returns {Object} Formatted item
     */
    function formatItem(item, index = 0) {
        return {
            item_id: item.sku || item.ean,
            item_name: item.name,
            item_category: item.category || 'Consultant',
            item_variant: item.title,
            price: item.price,
            currency: CURRENCY,
            quantity: item.quantity || 1,
            index: index + 1
        };
    }

    /**
     * Get current product data from page content
     * @returns {Object|null} Product data or null
     */
    function getCurrentProductData() {
        const pageInfo = getPageInfo();
        if (pageInfo.page_category !== 'PDP') return null;
        
        // Try to get product data from global product variable (if exists)
        if (window.product) {
            return window.product;
        }
        
        // Fallback: extract from page content
        const fileName = window.location.pathname.split('/').pop();
        if (fileName.includes('-product-page.html')) {
            const consultantName = fileName
                .replace('-product-page.html', '')
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            // Extract price from page if possible
            const priceElement = document.querySelector('.price');
            const price = priceElement ? parseFloat(priceElement.textContent.replace(/[€,\s]/g, '')) : 0;
            
            return {
                name: consultantName,
                title: 'Consultant',
                category: 'Consultant',
                price: price,
                ean: 'unknown',
                sku: 'unknown'
            };
        }
        
        return null;
    }

    /**
     * Push base page data to dataLayer
     */
    async function pushPageDataLayer() {
        try {
            const userData = getUserData();
            const pageInfo = getPageInfo();
            const hashedEmail = userData.email ? await hashEmail(userData.email) : null;
            
            const baseDataLayer = {
                event: 'page_data_ready',
                country: 'fr',
                language: 'fr-fr',
                page_name: pageInfo.page_name,
                page_category: pageInfo.page_category,
                user_logged_in: userData.isLoggedIn,
                email: hashedEmail
            };
            
            window.dataLayer.push(baseDataLayer);
            console.log('Consulteo DataLayer - Page Data:', baseDataLayer);
            
            // Auto-trigger ecommerce events based on page type
            setTimeout(() => {
                autoTriggerEcommerceEvents(pageInfo);
            }, 100);
            
        } catch (error) {
            console.error('Error pushing base dataLayer:', error);
        }
    }

    /**
     * Auto-trigger ecommerce events based on page type
     * @param {Object} pageInfo - Page information
     */
    function autoTriggerEcommerceEvents(pageInfo) {
        switch (pageInfo.page_category) {
            case 'home':
                pushViewItemList('homepage');
                break;
            case 'PLP':
                const category = pageInfo.page_name.replace('category ', '');
                pushViewItemList(category);
                break;
            case 'PDP':
                pushViewItem();
                break;
            case 'checkout':
                pushBeginCheckout();
                break;
            case 'account':
                if (pageInfo.page_name === 'purchase confirmation') {
                    pushPurchase();
                }
                break;
        }
    }

    /**
     * Push view_item_list event (Homepage & Category pages)
     * @param {string} listName - Name of the list being viewed
     */
    function pushViewItemList(listName) {
        try {
            const items = [];
            
            // Get items based on page type
            if (listName === 'homepage') {
                // Featured consultants on homepage
                const productCards = document.querySelectorAll('.product-card');
                productCards.forEach((card, index) => {
                    const name = card.querySelector('.product-title')?.textContent;
                    const category = card.querySelector('.product-category')?.textContent;
                    const priceText = card.querySelector('.product-price')?.textContent;
                    const price = priceText ? parseFloat(priceText.replace(/[€/day,\s]/g, '')) : 0;
                    
                    if (name) {
                        items.push({
                            item_id: `featured-${index + 1}`,
                            item_name: name,
                            item_category: category || 'Consultant',
                            item_variant: category,
                            price: price,
                            currency: CURRENCY,
                            index: index + 1
                        });
                    }
                });
            } else {
                // Category page items - will be populated when category data is available
                items.push({
                    item_id: 'category-placeholder',
                    item_name: `${listName} consultants`,
                    item_category: listName,
                    item_variant: 'Category List',
                    price: 0,
                    currency: CURRENCY,
                    index: 1
                });
            }
            
            const dataLayerObject = {
                event: 'view_item_list',
                ecommerce: {
                    currency: CURRENCY,
                    value: items.reduce((sum, item) => sum + item.price, 0),
                    items: items
                },
                list_name: listName
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - View Item List:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing view_item_list:', error);
        }
    }

    /**
     * Push view_item event (Product pages)
     */
    function pushViewItem() {
        try {
            const productData = getCurrentProductData();
            if (!productData) return;
            
            const item = formatItem(productData);
            
            const dataLayerObject = {
                event: 'view_item',
                ecommerce: {
                    currency: CURRENCY,
                    value: item.price,
                    items: [item]
                }
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - View Item:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing view_item:', error);
        }
    }

    /**
     * Push select_item event (When product is clicked)
     * @param {Object} itemData - Item data
     * @param {string} listName - List where item was selected
     */
    function pushSelectItem(itemData, listName = 'product_list') {
        try {
            const item = formatItem(itemData);
            
            const dataLayerObject = {
                event: 'select_item',
                ecommerce: {
                    currency: CURRENCY,
                    value: item.price,
                    items: [item]
                },
                list_name: listName
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - Select Item:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing select_item:', error);
        }
    }

    /**
     * Push add_to_cart event
     * @param {Object} itemData - Item data
     */
    function pushAddToCart(itemData) {
        try {
            const item = formatItem(itemData);
            
            const dataLayerObject = {
                event: 'add_to_cart',
                ecommerce: {
                    currency: CURRENCY,
                    value: item.price * item.quantity,
                    items: [item]
                }
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - Add to Cart:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing add_to_cart:', error);
        }
    }

    /**
     * Push view_cart event
     */
    function pushViewCart() {
        try {
            const cartItems = getCartData();
            const items = cartItems.map((item, index) => formatItem(item, index));
            const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const dataLayerObject = {
                event: 'view_cart',
                ecommerce: {
                    currency: CURRENCY,
                    value: totalValue,
                    items: items
                }
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - View Cart:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing view_cart:', error);
        }
    }

    /**
     * Push begin_checkout event
     */
    function pushBeginCheckout() {
        try {
            const cartItems = getCartData();
            const items = cartItems.map((item, index) => formatItem(item, index));
            const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const dataLayerObject = {
                event: 'begin_checkout',
                ecommerce: {
                    currency: CURRENCY,
                    value: totalValue,
                    items: items
                }
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - Begin Checkout:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing begin_checkout:', error);
        }
    }

    /**
     * Push purchase event
     */
    function pushPurchase() {
        try {
            const orderData = JSON.parse(localStorage.getItem('consulteo-order') || '{}');
            
            if (!orderData.orderNumber) return;
            
            const items = orderData.items ? orderData.items.map((item, index) => formatItem(item, index)) : [];
            
            const dataLayerObject = {
                event: 'purchase',
                ecommerce: {
                    transaction_id: orderData.orderNumber.toString(),
                    value: orderData.total || 0,
                    currency: CURRENCY,
                    items: items
                }
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - Purchase:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing purchase:', error);
        }
    }

    /**
     * Push sign_up event
     * @param {Object} userData - User data
     */
    function pushSignUp(userData) {
        try {
            const dataLayerObject = {
                event: 'sign_up',
                method: 'email'
            };
            
            window.dataLayer.push(dataLayerObject);
            console.log('Consulteo DataLayer - Sign Up:', dataLayerObject);
            
        } catch (error) {
            console.error('Error pushing sign_up:', error);
        }
    }

    /**
     * Initialize dataLayer push when DOM is ready
     */
    function initDataLayer() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', pushPageDataLayer);
        } else {
            pushPageDataLayer();
        }
    }

    /**
     * Auto-bind cart link clicks
     */
    function bindCartLinks() {
        document.addEventListener('click', function(e) {
            const cartLink = e.target.closest('a[href*="checkout.html"]');
            if (cartLink) {
                pushViewCart();
            }
        });
    }

    // Auto-initialize when script loads
    initDataLayer();
    
    // Bind cart links when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindCartLinks);
    } else {
        bindCartLinks();
    }

    // Expose functions globally
    window.ConsulteoDataLayer = {
        // Base functions
        push: pushPageDataLayer,
        getUserData: getUserData,
        getPageInfo: getPageInfo,
        hashEmail: hashEmail,
        
        // E-commerce tracking functions
        viewItemList: pushViewItemList,
        viewItem: pushViewItem,
        selectItem: pushSelectItem,
        addToCart: pushAddToCart,
        viewCart: pushViewCart,
        beginCheckout: pushBeginCheckout,
        purchase: pushPurchase,
        signUp: pushSignUp,
        
        // Utility functions
        getCurrentProduct: getCurrentProductData,
        getCart: getCartData,
        formatItem: formatItem
    };

})();