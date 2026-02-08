// Affiliate Link Management System
class AffiliateManager {
    constructor() {
        this.affiliateNetworks = {
            amazon: {
                name: 'Amazon',
                baseUrl: 'https://www.amazon.com/dp/',
                tagParam: 'tag',
                tag: 'valuefinderhub-20', // Replace with your actual tag
                cookieDuration: 24 // hours
            },
            walmart: {
                name: 'Walmart',
                baseUrl: 'https://www.walmart.com/ip/',
                trackingId: 'valuefinderhub', // Replace with your actual tracking ID
                cookieDuration: 7 // days
            },
            target: {
                name: 'Target',
                baseUrl: 'https://www.target.com/p/',
                affiliateId: 'valuefinderhub', // Replace with your actual ID
                cookieDuration: 7 // days
            },
            bestbuy: {
                name: 'Best Buy',
                baseUrl: 'https://www.bestbuy.com/site/',
                affiliateId: 'valuefinderhub', // Replace with your actual ID
                cookieDuration: 7 // days
            },
            ebay: {
                name: 'eBay',
                baseUrl: 'https://www.ebay.com/itm/',
                affiliateId: 'valuefinderhub', // Replace with your actual ID
                cookieDuration: 24 // hours
            }
        };
        
        this.clicksKey = 'affiliate_clicks';
        this.conversionsKey = 'affiliate_conversions';
        this.init();
    }
    
    init() {
        // Load tracking data
        this.clicks = this.getClicks();
        this.conversions = this.getConversions();
        
        // Process any pending conversions from URL parameters
        this.processConversionFromURL();
        
        // Initialize link cloaking
        this.initLinkCloaking();
    }
    
    // Link Generation
    generateAffiliateLink(productId, retailer, productData = null) {
        const network = this.affiliateNetworks[retailer.toLowerCase()];
        if (!network) return null;
        
        let affiliateUrl = '';
        
        // In a real implementation, you would generate proper affiliate URLs
        // For this demo, we'll create placeholder URLs
        switch(retailer.toLowerCase()) {
            case 'amazon':
                affiliateUrl = `${network.baseUrl}${productId}?${network.tagParam}=${network.tag}`;
                break;
            case 'walmart':
                affiliateUrl = `${network.baseUrl}${productId}?affiliate=${network.trackingId}`;
                break;
            case 'target':
                affiliateUrl = `${network.baseUrl}${productId}?affiliate=${network.affiliateId}`;
                break;
            case 'bestbuy':
                affiliateUrl = `${network.baseUrl}${productId}?affiliate=${network.affiliateId}`;
                break;
            case 'ebay':
                affiliateUrl = `${network.baseUrl}${productId}?affiliate=${network.affiliateId}`;
                break;
            default:
                // For other retailers, return a generic link
                affiliateUrl = `https://${retailer.toLowerCase()}.com/product/${productId}`;
        }
        
        // Create cloaked URL
        const cloakedUrl = this.createCloakedUrl(affiliateUrl, productId, retailer, productData);
        
        return {
            original: affiliateUrl,
            cloaked: cloakedUrl,
            network: network
        };
    }
    
    // Link Cloaking
    createCloakedUrl(originalUrl, productId, retailer, productData = null) {
        // Generate a unique ID for this click
        const clickId = this.generateClickId();
        
        // Store click data
        this.trackClick(clickId, {
            originalUrl,
            productId,
            retailer,
            productName: productData?.name || 'Unknown Product',
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent
        });
        
        // Create cloaked URL
        const baseUrl = window.location.origin;
        return `${baseUrl}/redirect.html?click=${clickId}`;
    }
    
    generateClickId() {
        return 'click_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Click Tracking
    trackClick(clickId, data) {
        this.clicks[clickId] = {
            ...data,
            clicked: true,
            converted: false,
            conversionValue: 0
        };
        
        this.saveClicks();
        
        // Set cookie for conversion tracking
        this.setConversionCookie(clickId, data.retailer);
        
        // Send to analytics (in a real implementation)
        this.sendToAnalytics('click', data);
    }
    
    trackConversion(clickId, conversionData) {
        if (this.clicks[clickId]) {
            this.clicks[clickId].converted = true;
            this.clicks[clickId].conversionValue = conversionData.value || 0;
            this.clicks[clickId].conversionDate = new Date().toISOString();
            this.clicks[clickId].conversionData = conversionData;
            
            // Add to conversions
            this.conversions.push({
                clickId,
                ...this.clicks[clickId],
                ...conversionData
            });
            
            this.saveClicks();
            this.saveConversions();
            
            // Send to analytics
            this.sendToAnalytics('conversion', {
                ...this.clicks[clickId],
                ...conversionData
            });
            
            return true;
        }
        return false;
    }
    
    // Cookie Management
    setConversionCookie(clickId, retailer) {
        const network = this.affiliateNetworks[retailer.toLowerCase()];
        if (!network) return;
        
        const expirationHours = network.cookieDuration;
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + expirationHours);
        
        const cookieValue = JSON.stringify({
            clickId,
            retailer,
            expiration: expirationDate.toISOString()
        });
        
        document.cookie = `affiliate_click=${encodeURIComponent(cookieValue)}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
    }
    
    getConversionCookie() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith('affiliate_click=')) {
                try {
                    const value = decodeURIComponent(cookie.substring('affiliate_click='.length));
                    return JSON.parse(value);
                } catch (e) {
                    console.error('Error parsing affiliate cookie:', e);
                }
            }
        }
        return null;
    }
    
    // Data Storage
    getClicks() {
        const data = localStorage.getItem(this.clicksKey);
        return data ? JSON.parse(data) : {};
    }
    
    saveClicks() {
        localStorage.setItem(this.clicksKey, JSON.stringify(this.clicks));
    }
    
    getConversions() {
        const data = localStorage.getItem(this.conversionsKey);
        return data ? JSON.parse(data) : [];
    }
    
    saveConversions() {
        localStorage.setItem(this.conversionsKey, JSON.stringify(this.conversions));
    }
    
    // Analytics
    sendToAnalytics(eventType, data) {
        // In a real implementation, you would send this to Google Analytics,
        // Facebook Pixel, or your own analytics system
        
        console.log(`[Analytics] ${eventType}:`, data);
        
        // Example: Send to Google Analytics (if configured)
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                'event_category': 'affiliate',
                'event_label': data.retailer,
                'value': data.conversionValue || 0
            });
        }
    }
    
    // Performance Reporting
    getPerformanceReport() {
        const report = {
            totalClicks: Object.keys(this.clicks).length,
            totalConversions: this.conversions.length,
            conversionRate: 0,
            totalRevenue: 0,
            byRetailer: {},
            byProduct: {},
            byDate: {}
        };
        
        // Calculate totals
        this.conversions.forEach(conversion => {
            report.totalRevenue += conversion.conversionValue || 0;
            
            // By retailer
            const retailer = conversion.retailer;
            if (!report.byRetailer[retailer]) {
                report.byRetailer[retailer] = {
                    clicks: 0,
                    conversions: 0,
                    revenue: 0
                };
            }
            report.byRetailer[retailer].conversions++;
            report.byRetailer[retailer].revenue += conversion.conversionValue || 0;
            
            // By product
            const productId = conversion.productId;
            if (!report.byProduct[productId]) {
                report.byProduct[productId] = {
                    clicks: 0,
                    conversions: 0,
                    revenue: 0,
                    productName: conversion.productName
                };
            }
            report.byProduct[productId].conversions++;
            report.byProduct[productId].revenue += conversion.conversionValue || 0;
            
            // By date
            const date = conversion.timestamp.split('T')[0];
            if (!report.byDate[date]) {
                report.byDate[date] = {
                    clicks: 0,
                    conversions: 0,
                    revenue: 0
                };
            }
            report.byDate[date].conversions++;
            report.byDate[date].revenue += conversion.conversionValue || 0;
        });
        
        // Count clicks
        Object.values(this.clicks).forEach(click => {
            const retailer = click.retailer;
            if (!report.byRetailer[retailer]) {
                report.byRetailer[retailer] = {
                    clicks: 0,
                    conversions: 0,
                    revenue: 0
                };
            }
            report.byRetailer[retailer].clicks++;
            
            const productId = click.productId;
            if (!report.byProduct[productId]) {
                report.byProduct[productId] = {
                    clicks: 0,
                    conversions: 0,
                    revenue: 0,
                    productName: click.productName
                };
            }
            report.byProduct[productId].clicks++;
            
            const date = click.timestamp.split('T')[0];
            if (!report.byDate[date]) {
                report.byDate[date] = {
                    clicks: 0,
                    conversions: 0,
                    revenue: 0
                };
            }
            report.byDate[date].clicks++;
        });
        
        // Calculate conversion rates
        report.conversionRate = report.totalClicks > 0 ? 
            (report.totalConversions / report.totalClicks * 100).toFixed(2) : 0;
        
        // Calculate retailer conversion rates
        Object.keys(report.byRetailer).forEach(retailer => {
            const data = report.byRetailer[retailer];
            data.conversionRate = data.clicks > 0 ? 
                (data.conversions / data.clicks * 100).toFixed(2) : 0;
            data.averageOrderValue = data.conversions > 0 ? 
                (data.revenue / data.conversions).toFixed(2) : 0;
        });
        
        // Calculate product conversion rates
        Object.keys(report.byProduct).forEach(productId => {
            const data = report.byProduct[productId];
            data.conversionRate = data.clicks > 0 ? 
                (data.conversions / data.clicks * 100).toFixed(2) : 0;
        });
        
        return report;
    }
    
    // Link Rotation (for multiple affiliate accounts)
    rotateAffiliateLink(productId, retailer, rotationType = 'random') {
        const network = this.affiliateNetworks[retailer.toLowerCase()];
        if (!network) return null;
        
        // In a real implementation, you might have multiple affiliate IDs
        // and rotate between them based on various strategies
        let affiliateId = network.tag || network.trackingId || network.affiliateId;
        
        if (rotationType === 'random' && Array.isArray(affiliateId)) {
            // If we have multiple IDs, pick one randomly
            affiliateId = affiliateId[Math.floor(Math.random() * affiliateId.length)];
        } else if (rotationType === 'round-robin') {
            // Round-robin rotation (you'd need to track state)
            // This is a simplified example
            if (Array.isArray(affiliateId)) {
                const rotationKey = `rotation_${retailer}`;
                let rotationIndex = parseInt(localStorage.getItem(rotationKey) || '0');
                affiliateId = affiliateId[rotationIndex];
                rotationIndex = (rotationIndex + 1) % affiliateId.length;
                localStorage.setItem(rotationKey, rotationIndex.toString());
            }
        }
        
        // Generate URL with selected affiliate ID
        return this.generateAffiliateLink(productId, retailer);
    }
    
    // Broken Link Detection
    checkLinkHealth(url) {
        // This would typically be done on the server side
        // For client-side, we can only check if the URL is valid
        try {
            new URL(url);
            return {
                valid: true,
                status: 'unknown' // Would need server-side checking
            };
        } catch (e) {
            return {
                valid: false,
                status: 'invalid_url',
                error: e.message
            };
        }
    }
    
    // Initialize link cloaking on page
    initLinkCloaking() {
        // Find all affiliate links and replace them with cloaked versions
        // This would typically be done server-side, but we can do a basic version client-side
        document.addEventListener('DOMContentLoaded', () => {
            this.processAffiliateLinks();
        });
    }
    
    processAffiliateLinks() {
        // Look for links with specific patterns
        const affiliateLinks = document.querySelectorAll('a[href*="amazon"], a[href*="walmart"], a[href*="target"]');
        
        affiliateLinks.forEach(link => {
            // Check if it's already a cloaked link
            if (link.href.includes('/redirect.html')) return;
            
            // Extract product info from data attributes
            const productId = link.dataset.productId;
            const retailer = link.dataset.retailer || this.detectRetailer(link.href);
            
            if (productId && retailer) {
                // Get product data
                const productManager = new ProductManager();
                const product = productManager.getProductById(productId);
                
                // Generate cloaked URL
                const affiliateInfo = this.generateAffiliateLink(productId, retailer, product);
                if (affiliateInfo) {
                    link.href = affiliateInfo.cloaked;
                    link.target = '_blank';
                    link.rel = 'nofollow noopener';
                    
                    // Add click tracking
                    link.addEventListener('click', (e) => {
                        this.trackOutboundClick(affiliateInfo.cloaked, retailer, productId);
                    });
                }
            }
        });
    }
    
    detectRetailer(url) {
        if (url.includes('amazon.com')) return 'amazon';
        if (url.includes('walmart.com')) return 'walmart';
        if (url.includes('target.com')) return 'target';
        if (url.includes('bestbuy.com')) return 'bestbuy';
        if (url.includes('ebay.com')) return 'ebay';
        return null;
    }
    
    trackOutboundClick(url, retailer, productId) {
        // Additional tracking for outbound clicks
        const eventData = {
            url,
            retailer,
            productId,
            timestamp: new Date().toISOString()
        };
        
        this.sendToAnalytics('outbound_click', eventData);
    }
    
    // Process conversion from URL parameters
    processConversionFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const conversionData = urlParams.get('conversion');
        
        if (conversionData) {
            try {
                const data = JSON.parse(decodeURIComponent(conversionData));
                if (data.clickId && data.value) {
                    this.trackConversion(data.clickId, data);
                }
            } catch (e) {
                console.error('Error processing conversion from URL:', e);
            }
        }
    }
    
    // Admin Functions
    clearTrackingData() {
        localStorage.removeItem(this.clicksKey);
        localStorage.removeItem(this.conversionsKey);
        this.clicks = {};
        this.conversions = [];
        
        // Clear cookies
        document.cookie = 'affiliate_click=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    
    exportData(format = 'json') {
        const data = {
            clicks: this.clicks,
            conversions: this.conversions,
            generated: new Date().toISOString()
        };
        
        if (format === 'csv') {
            // Convert to CSV (simplified)
            let csv = 'Type,Click ID,Product ID,Retailer,Product Name,Timestamp,Converted,Conversion Value\n';
            
            // Add clicks
            Object.entries(this.clicks).forEach(([clickId, click]) => {
                csv += `Click,${clickId},${click.productId},${click.retailer},"${click.productName}",${click.timestamp},${click.converted},${click.conversionValue}\n`;
            });
            
            // Add conversions
            this.conversions.forEach(conv => {
                csv += `Conversion,${conv.clickId},${conv.productId},${conv.retailer},"${conv.productName}",${conv.conversionDate},true,${conv.conversionValue}\n`;
            });
            
            return csv;
        }
        
        return JSON.stringify(data, null, 2);
    }
}

// Global affiliate manager instance
const affiliateManager = new AffiliateManager();

// Global functions for HTML onclick handlers
function openAffiliateLink(productId, retailer = 'amazon') {
    const productManager = new ProductManager();
    const product = productManager.getProductById(productId);
    
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    // Generate affiliate link
    const affiliateInfo = affiliateManager.generateAffiliateLink(productId, retailer, product);
    
    if (affiliateInfo && affiliateInfo.cloaked) {
        // Open in new window
        window.open(affiliateInfo.cloaked, '_blank', 'noopener,noreferrer');
        
        // Show notification
        showToast(`Redirecting to ${retailer}...`, 'info');
        
        return true;
    }
    
    return false;
}

function showAffiliateDisclosure() {
    const modal = new bootstrap.Modal(document.getElementById('affiliateModal'));
    modal.show();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add affiliate disclosure modal to page if not exists
    if (!document.getElementById('affiliateModal')) {
        const modalHTML = `
            <div class="modal fade" id="affiliateModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Affiliate Disclosure</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>ValueFinder Hub participates in various affiliate marketing programs. This means we may earn commissions on purchases made through our links to retailer sites.</p>
                            <p>These commissions come at <strong>no additional cost to you</strong> and help support our website.</p>
                            <p>Our affiliate relationships do not influence our product recommendations. We maintain editorial independence and provide unbiased comparisons.</p>
                            <a href="affiliate-disclosure.html" class="btn btn-outline-primary w-100 mt-3">
                                Read Full Disclosure
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // If we're on a redirect page, handle the redirect
    if (window.location.pathname.includes('redirect.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const clickId = urlParams.get('click');
        
        if (clickId && affiliateManager.clicks[clickId]) {
            const clickData = affiliateManager.clicks[clickId];
            
            // Show redirect message
            document.body.innerHTML = `
                <div class="container mt-5">
                    <div class="text-center">
                        <div class="spinner-border text-primary mb-3" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <h3>Redirecting to ${clickData.retailer}...</h3>
                        <p class="text-muted">You're being redirected to complete your purchase.</p>
                        <p class="small text-muted">If you're not redirected automatically, <a href="${clickData.originalUrl}" id="manualRedirect">click here</a>.</p>
                    </div>
                </div>
            `;
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = clickData.originalUrl;
            }, 2000);
        }
    }
});
