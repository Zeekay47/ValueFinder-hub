// Products Management with SEO Optimization
class ProductManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products') || '[]');
        this.categories = JSON.parse(localStorage.getItem('categories') || '[]');
        this.retailers = JSON.parse(localStorage.getItem('retailers') || '[]');
    }
    
    // Generate product schema for SEO
    generateProductSchema(product) {
        if (!product) return null;
        
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
            "offers": offers.length > 0 ? offers : undefined,
            "category": product.category,
            "sku": product.id,
            "mpn": product.id
        };
    }
    
    // Generate category schema
    generateCategorySchema(category) {
        return {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${category.name} - Product Comparisons`,
            "description": category.description || `Compare ${category.name} products from multiple retailers`,
            "url": `https://valuefinderhub.com/category.html?cat=${category.id}`
        };
    }
    
    // Generate breadcrumb schema
    generateBreadcrumbSchema(items) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": item.name,
                "item": item.url
            }))
        };
    }
    
    // Generate FAQ schema
    generateFAQSchema(faqs) {
        return {
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
    }
    
    // Get products for sitemap
    getProductsForSitemap() {
        return this.products.map(product => ({
            url: `https://valuefinderhub.com/product-detail.html?id=${product.id}`,
            lastmod: product.updatedAt || product.createdAt || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.8
        }));
    }
    
    // Get categories for sitemap
    getCategoriesForSitemap() {
        return this.categories.map(category => ({
            url: `https://valuefinderhub.com/category.html?cat=${category.id}`,
            lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.7
        }));
    }
    
    // Get similar products (for SEO internal linking)
    getSimilarProducts(productId, limit = 4) {
        const product = this.getProductById(productId);
        if (!product) return [];
        
        return this.products
            .filter(p => 
                p.id !== productId && 
                (p.category === product.category || p.brand === product.brand)
            )
            .sort((a, b) => {
                // Prioritize same brand and category
                let scoreA = 0;
                let scoreB = 0;
                
                if (a.category === product.category) scoreA += 2;
                if (a.brand === product.brand) scoreA += 1;
                if (b.category === product.category) scoreB += 2;
                if (b.brand === product.brand) scoreB += 1;
                
                return scoreB - scoreA;
            })
            .slice(0, limit);
    }
    
    // Get related categories (for SEO)
    getRelatedCategories(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return [];
        
        // Find categories that are often browsed together
        const relatedMap = {
            'electronics': ['home-kitchen', 'office-supplies'],
            'home-kitchen': ['electronics', 'tools'],
            'health-fitness': ['sports', 'fashion'],
            'fashion': ['beauty', 'health-fitness'],
            'beauty': ['fashion', 'health-fitness'],
            'automotive': ['tools', 'sports']
        };
        
        const relatedIds = relatedMap[categoryId] || [];
        return this.categories.filter(c => relatedIds.includes(c.id));
    }
    
    // Update meta tags for product page
    updateProductMetaTags(product) {
        if (typeof document === 'undefined') return;
        
        // Update title
        document.title = `${product.name} - Price Comparison & Reviews | ValueFinder Hub`;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 
                `Compare prices for ${product.name} from Amazon, Walmart, Target and more. Read reviews, see specs, and find the best deal. Starting at $${this.getBestProductPrice(product)}.`
            );
        }
        
        // Update canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute('href', `https://valuefinderhub.com/product-detail.html?id=${product.id}`);
        }
        
        // Update Open Graph
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDescription = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const ogUrl = document.querySelector('meta[property="og:url"]');
        
        if (ogTitle) ogTitle.setAttribute('content', `${product.name} - ValueFinder Hub`);
        if (ogDescription) ogDescription.setAttribute('content', 
            `Compare prices and read reviews for ${product.name}. Find the best deal from multiple retailers.`
        );
        if (ogImage) ogImage.setAttribute('content', product.image);
        if (ogUrl) ogUrl.setAttribute('content', `https://valuefinderhub.com/product-detail.html?id=${product.id}`);
        
        // Update Twitter Cards
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        const twitterDescription = document.querySelector('meta[name="twitter:description"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        
        if (twitterTitle) twitterTitle.setAttribute('content', `${product.name} - ValueFinder Hub`);
        if (twitterDescription) twitterDescription.setAttribute('content',
            `Price comparison for ${product.name}. Find the best deal!`
        );
        if (twitterImage) twitterImage.setAttribute('content', product.image);
    }
    
    // Generate product URLs for SEO (clean URLs)
    generateProductUrl(product) {
        // Create SEO-friendly slug
        const slug = product.name
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        
        return `/product/${slug}-${product.id}.html`;
    }
    
    // Generate structured data for product listings
    generateProductListSchema(products, pageTitle) {
        return {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": pageTitle,
            "description": `Product comparisons for ${pageTitle}`,
            "numberOfItems": products.length,
            "itemListElement": products.map((product, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "Product",
                    "name": product.name,
                    "url": `https://valuefinderhub.com/product-detail.html?id=${product.id}`,
                    "image": product.image,
                    "offers": {
                        "@type": "AggregateOffer",
                        "lowPrice": this.getBestProductPrice(product),
                        "highPrice": Math.max(...(product.retailers || []).map(r => r.price).filter(p => p > 0)),
                        "priceCurrency": "USD",
                        "offerCount": product.retailers?.length || 0
                    }
                }
            }))
        };
    }
}

// Add these SEO functions to main.js
function addProductSchemaToPage(product) {
    const productManager = new ProductManager();
    const schema = productManager.generateProductSchema(product);
    
    if (schema) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        script.id = 'product-schema';
        
        // Remove existing schema if any
        const existing = document.getElementById('product-schema');
        if (existing) existing.remove();
        
        document.head.appendChild(script);
    }
}

function addBreadcrumbSchema(items) {
    const productManager = new ProductManager();
    const schema = productManager.generateBreadcrumbSchema(items);
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    script.id = 'breadcrumb-schema';
    
    const existing = document.getElementById('breadcrumb-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);
}

function addFAQSchema(faqs) {
    const productManager = new ProductManager();
    const schema = productManager.generateFAQSchema(faqs);
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    script.id = 'faq-schema';
    
    const existing = document.getElementById('faq-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);
}

// Initialize SEO on product detail page
function initProductDetailSEO(product) {
    if (!product) return;
    
    const productManager = new ProductManager();
    
    // Update meta tags
    productManager.updateProductMetaTags(product);
    
    // Add product schema
    addProductSchemaToPage(product);
    
    // Add breadcrumb schema
    const category = productManager.categories.find(c => c.id === product.category);
    const breadcrumbItems = [
        { name: 'Home', url: 'https://valuefinderhub.com/' },
        { name: category?.name || 'Category', url: `https://valuefinderhub.com/category.html?cat=${product.category}` },
        { name: product.name, url: `https://valuefinderhub.com/product-detail.html?id=${product.id}` }
    ];
    addBreadcrumbSchema(breadcrumbItems);
    
    // Add FAQ schema for common questions
    const faqs = [
        {
            question: `What is the best price for ${product.name}?`,
            answer: `The best current price for ${product.name} is $${productManager.getBestProductPrice(product)}. Prices may vary between retailers.`
        },
        {
            question: `Where can I buy ${product.name}?`,
            answer: `${product.name} is available at ${(product.retailers || []).map(r => r.name).join(', ')} and other retailers.`
        },
        {
            question: `Is ${product.name} worth buying?`,
            answer: `Based on ${product.reviewCount || 0} reviews with an average rating of ${product.rating}/5, ${product.name} is ${product.rating >= 4 ? 'highly recommended' : product.rating >= 3 ? 'a good choice' : 'worth considering based on your needs'}.`
        }
    ];
    addFAQSchema(faqs);
}
