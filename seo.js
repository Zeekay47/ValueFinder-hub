// SEO Optimization Utilities
class SEOOptimizer {
    constructor() {
        this.baseUrl = 'https://valuefinderhub.com';
        this.siteName = 'ValueFinder Hub';
    }
    
    // Generate meta tags for any page
    generateMetaTags(pageData) {
        const tags = {};
        
        // Basic meta tags
        tags.title = pageData.title || `${this.siteName} - Compare Prices & Find Best Deals`;
        tags.description = pageData.description || 'Unbiased product comparisons and deals from trusted retailers.';
        
        // Open Graph tags
        tags.og = {
            title: pageData.ogTitle || tags.title,
            description: pageData.ogDescription || tags.description,
            image: pageData.ogImage || `${this.baseUrl}/images/og-images/default-og.jpg`,
            url: pageData.url || this.baseUrl,
            type: pageData.type || 'website',
            site_name: this.siteName
        };
        
        // Twitter Card tags
        tags.twitter = {
            card: 'summary_large_image',
            title: pageData.twitterTitle || tags.og.title,
            description: pageData.twitterDescription || tags.og.description,
            image: pageData.twitterImage || tags.og.image,
            site: '@ValueFinderHub'
        };
        
        // Canonical URL
        tags.canonical = pageData.canonical || pageData.url || this.baseUrl;
        
        // Robots meta
        tags.robots = pageData.robots || 'index, follow';
        
        return tags;
    }
    
    // Apply meta tags to document
    applyMetaTags(pageData) {
        const tags = this.generateMetaTags(pageData);
        
        // Update title
        document.title = tags.title;
        
        // Update meta description
        this.updateOrCreateMeta('description', tags.description);
        
        // Update robots
        this.updateOrCreateMeta('robots', tags.robots);
        
        // Update Open Graph tags
        this.updateOrCreateMeta('property', 'og:title', tags.og.title);
        this.updateOrCreateMeta('property', 'og:description', tags.og.description);
        this.updateOrCreateMeta('property', 'og:image', tags.og.image);
        this.updateOrCreateMeta('property', 'og:url', tags.og.url);
        this.updateOrCreateMeta('property', 'og:type', tags.og.type);
        this.updateOrCreateMeta('property', 'og:site_name', tags.og.site_name);
        
        // Update Twitter Card tags
        this.updateOrCreateMeta('name', 'twitter:card', tags.twitter.card);
        this.updateOrCreateMeta('name', 'twitter:title', tags.twitter.title);
        this.updateOrCreateMeta('name', 'twitter:description', tags.twitter.description);
        this.updateOrCreateMeta('name', 'twitter:image', tags.twitter.image);
        this.updateOrCreateMeta('name', 'twitter:site', tags.twitter.site);
        
        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = tags.canonical;
        
        // Add structured data if provided
        if (pageData.structuredData) {
            this.addStructuredData(pageData.structuredData);
        }
    }
    
    updateOrCreateMeta(attr, name, content) {
        let meta;
        
        if (attr === 'name') {
            meta = document.querySelector(`meta[name="${name}"]`);
        } else if (attr === 'property') {
            meta = document.querySelector(`meta[property="${name}"]`);
        } else {
            meta = document.querySelector(`meta[${attr}]`);
        }
        
        if (!meta) {
            meta = document.createElement('meta');
            if (attr === 'name') {
                meta.name = name;
            } else if (attr === 'property') {
                meta.setAttribute('property', name);
            }
            document.head.appendChild(meta);
        }
        
        meta.content = content;
    }
    
    addStructuredData(data) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        script.id = 'structured-data';
        
        // Remove existing structured data
        const existing = document.getElementById('structured-data');
        if (existing) existing.remove();
        
        document.head.appendChild(script);
    }
    
    // Generate breadcrumb navigation for SEO
    generateBreadcrumbs(items) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
            }))
        };
        
        this.addStructuredData(schema);
        
        // Also generate HTML breadcrumbs
        return this.generateBreadcrumbHTML(items);
    }
    
    generateBreadcrumbHTML(items) {
        return `
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    ${items.map((item, index) => `
                        <li class="breadcrumb-item ${index === items.length - 1 ? 'active' : ''}">
                            ${index === items.length - 1 ? item.name : `<a href="${item.url}">${item.name}</a>`}
                        </li>
                    `).join('')}
                </ol>
            </nav>
        `;
    }
    
    // Generate FAQ schema
    generateFAQSchema(faqs) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
        
        this.addStructuredData(schema);
        
        // Also generate HTML for FAQs
        return this.generateFAQHTML(faqs);
    }
    
    generateFAQHTML(faqs) {
        return `
            <div class="faq-section">
                <h2>Frequently Asked Questions</h2>
                <div class="accordion" id="faqAccordion">
                    ${faqs.map((faq, index) => `
                        <div class="accordion-item">
                            <h3 class="accordion-header">
                                <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" 
                                        type="button" 
                                        data-bs-toggle="collapse" 
                                        data-bs-target="#faq${index}">
                                    ${faq.question}
                                </button>
                            </h3>
                            <div id="faq${index}" 
                                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                                 data-bs-parent="#faqAccordion">
                                <div class="accordion-body">
                                    ${faq.answer}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Optimize images for SEO
    optimizeImage(img, options = {}) {
        const defaults = {
            alt: '',
            width: null,
            height: null,
            loading: 'lazy',
            fetchpriority: 'auto'
        };
        
        const config = { ...defaults, ...options };
        
        img.alt = config.alt;
        img.loading = config.loading;
        img.fetchpriority = config.fetchpriority;
        
        if (config.width) img.width = config.width;
        if (config.height) img.height = config.height;
        
        return img;
    }
    
    // Generate meta tags for product pages
    generateProductMetaTags(product) {
        const bestPrice = getBestProductPrice(product);
        
        return {
            title: `${product.name} - Price Comparison & Reviews | ${this.siteName}`,
            description: `Compare prices for ${product.name} from Amazon, Walmart, Target and more. Read reviews, see specs, and find the best deal. Starting at $${bestPrice}.`,
            ogTitle: `${product.name} - ${this.siteName}`,
            ogDescription: `Compare prices and read reviews for ${product.name}. Find the best deal from multiple retailers.`,
            ogImage: product.image,
            url: `${this.baseUrl}/product-detail.html?id=${product.id}`,
            type: 'product',
            structuredData: this.generateProductStructuredData(product)
        };
    }
    
    generateProductStructuredData(product) {
        const offers = (product.retailers || []).map(retailer => ({
            "@type": "Offer",
            "url": retailer.affiliateUrl,
            "priceCurrency": "USD",
            "price": retailer.price,
            "priceValidUntil": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "availability": retailer.inStock ? 
                "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": retailer.name
            }
        }));
        
        return {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "image": [product.image, ...(product.additionalImages || [])],
            "description": product.description?.substring(0, 200),
            "brand": {
                "@type": "Brand",
                "name": product.brand
            },
            "review": (product.reviews || []).slice(0, 5).map(review => ({
                "@type": "Review",
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": review.rating,
                    "bestRating": "5"
                },
                "author": {
                    "@type": "Person",
                    "name": review.author
                },
                "reviewBody": review.content,
                "datePublished": review.date
            })),
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": product.rating,
                "reviewCount": product.reviewCount || (product.reviews || []).length
            },
            "offers": offers.length > 0 ? offers : undefined
        };
    }
    
    // Generate sitemap URLs
    generateSitemapUrls() {
        const urls = [];
        
        // Static pages
        urls.push({
            url: this.baseUrl + '/',
            priority: 1.0,
            changefreq: 'daily'
        });
        
        urls.push({
            url: this.baseUrl + '/products.html',
            priority: 0.9,
            changefreq: 'daily'
        });
        
        urls.push({
            url: this.baseUrl + '/buying-guides.html',
            priority: 0.8,
            changefreq: 'weekly'
        });
        
        urls.push({
            url: this.baseUrl + '/about.html',
            priority: 0.7,
            changefreq: 'monthly'
        });
        
        // Add categories
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        categories.forEach(category => {
            urls.push({
                url: `${this.baseUrl}/category.html?cat=${category.id}`,
                priority: 0.8,
                changefreq: 'weekly'
            });
        });
        
        // Add products
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        products.forEach(product => {
            urls.push({
                url: `${this.baseUrl}/product-detail.html?id=${product.id}`,
                priority: 0.7,
                changefreq: 'weekly',
                lastmod: product.updatedAt || product.createdAt
            });
        });
        
        return urls;
    }
    
    // Generate robots.txt content
    generateRobotsTxt() {
        return `# Robots.txt for ${this.siteName}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/

Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay (requests per second)
Crawl-delay: 2

# Directives for specific bots
User-agent: Googlebot
Allow: /
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /admin/

User-agent: Slurp
Allow: /
Disallow: /admin/`;
    }
}

// Initialize SEO on page load
function initSEO() {
    const seo = new SEOOptimizer();
    window.seo = seo;
    
    // Apply basic SEO optimizations
    applyBasicSEO();
    
    // Generate and update sitemap periodically
    if (window.location.pathname.includes('admin')) {
        generateSitemap();
    }
}

function applyBasicSEO() {
    // Add missing alt attributes to images
    document.querySelectorAll('img:not([alt])').forEach(img => {
        if (!img.alt) {
            const altText = img.getAttribute('title') || 
                           img.closest('.card')?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent ||
                           'Product image';
            img.alt = altText.substring(0, 125);
        }
    });
    
    // Add nofollow to external affiliate links
    document.querySelectorAll('a[href*="amazon"], a[href*="walmart"], a[href*="target"]').forEach(link => {
        if (!link.href.includes(window.location.hostname)) {
            link.rel = (link.rel ? link.rel + ' ' : '') + 'nofollow noopener';
            link.target = '_blank';
        }
    });
    
    // Add structured data for website
    addWebsiteStructuredData();
    
    // Optimize heading hierarchy
    optimizeHeadingHierarchy();
}

function addWebsiteStructuredData() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "ValueFinder Hub",
        "url": "https://valuefinderhub.com/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://valuefinderhub.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        },
        "description": "Unbiased product comparisons and price tracking across multiple retailers",
        "publisher": {
            "@type": "Organization",
            "name": "ValueFinder Hub",
            "logo": {
                "@type": "ImageObject",
                "url": "https://valuefinderhub.com/images/logos/logo.png",
                "width": 200,
                "height": 60
            },
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "contact@valuefinderhub.com",
                "url": "https://valuefinderhub.com/contact.html"
            }
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

function optimizeHeadingHierarchy() {
    // Ensure proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        
        if (index === 0 && level !== 1) {
            // First heading should be h1
            const h1 = document.createElement('h1');
            h1.innerHTML = heading.innerHTML;
            h1.className = heading.className;
            heading.parentNode.replaceChild(h1, heading);
            lastLevel = 1;
        } else if (level > lastLevel + 1) {
            // Skip too many levels
            const newLevel = lastLevel + 1;
            const newTag = `H${newLevel}`;
            const newHeading = document.createElement(newTag);
            newHeading.innerHTML = heading.innerHTML;
            newHeading.className = heading.className;
            heading.parentNode.replaceChild(newHeading, heading);
            lastLevel = newLevel;
        } else {
            lastLevel = level;
        }
    });
}

function generateSitemap() {
    const seo = new SEOOptimizer();
    const urls = seo.generateSitemapUrls();
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.map(url => `
    <url>
        <loc>${url.url}</loc>
        ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
        <changefreq>${url.changefreq}</changefreq>
        <priority>${url.priority}</priority>
    </url>
    `).join('')}
</urlset>`;
    
    // Create a blob and download link
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    link.textContent = 'Download Sitemap';
    link.className = 'btn btn-primary';
    
    // Add to admin panel if exists
    const adminContent = document.getElementById('adminContent');
    if (adminContent) {
        adminContent.appendChild(link);
    }
}

// Initialize SEO when DOM is loaded
document.addEventListener('DOMContentLoaded', initSEO);
