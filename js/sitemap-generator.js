// Dynamic Sitemap Generator
class SitemapGenerator {
    constructor() {
        this.baseUrl = 'https://valuefinderhub.com';
        this.priorityDefaults = {
            homepage: 1.0,
            mainPages: 0.9,
            categoryPages: 0.8,
            productPages: 0.7,
            blogPages: 0.6,
            staticPages: 0.5
        };
    }
    
    generateSitemap() {
        const sitemap = this.generateSitemapXML();
        return sitemap;
    }
    
    generateSitemapXML() {
        const urls = this.getAllURLs();
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
        xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
        xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;
        
        urls.forEach(url => {
            xml += this.generateURLNode(url);
        });
        
        xml += `</urlset>`;
        return xml;
    }
    
    generateURLNode(urlData) {
        return `    <url>
        <loc>${this.escapeXML(urlData.loc)}</loc>
        ${urlData.lastmod ? `<lastmod>${urlData.lastmod}</lastmod>\n        ` : ''}
        <changefreq>${urlData.changefreq || 'weekly'}</changefreq>
        <priority>${urlData.priority || '0.5'}</priority>
    </url>\n`;
    }
    
    getAllURLs() {
        const urls = [];
        
        // Homepage
        urls.push({
            loc: this.baseUrl + '/',
            changefreq: 'daily',
            priority: this.priorityDefaults.homepage,
            lastmod: this.getTodayDate()
        });
        
        // Main Pages
        const mainPages = [
            'products.html',
            'blog.html',
            'buying-guides.html',
            'about.html',
            'contact.html',
            'how-it-works.html',
            'affiliate-disclosure.html',
            'privacy-policy.html',
            'terms.html'
        ];
        
        mainPages.forEach(page => {
            urls.push({
                loc: this.baseUrl + '/' + page,
                changefreq: 'weekly',
                priority: this.priorityDefaults.mainPages,
                lastmod: this.getTodayDate()
            });
        });
        
        // Category Pages
        const categories = this.getCategories();
        categories.forEach(category => {
            urls.push({
                loc: `${this.baseUrl}/category.html?cat=${category.id}`,
                changefreq: 'weekly',
                priority: this.priorityDefaults.categoryPages,
                lastmod: category.lastmod || this.getTodayDate()
            });
        });
        
        // Product Pages
        const products = this.getProducts();
        products.forEach(product => {
            urls.push({
                loc: `${this.baseUrl}/product-detail.html?id=${product.id}`,
                changefreq: 'weekly',
                priority: this.priorityDefaults.productPages,
                lastmod: product.lastmod || product.createdAt || this.getTodayDate()
            });
        });
        
        // Blog/Guide Pages
        const guides = this.getGuides();
        guides.forEach(guide => {
            urls.push({
                loc: `${this.baseUrl}/guide-detail.html?id=${guide.id}`,
                changefreq: 'monthly',
                priority: this.priorityDefaults.blogPages,
                lastmod: guide.lastmod || guide.publishedDate || this.getTodayDate()
            });
        });
        
        return urls;
    }
    
    getCategories() {
        try {
            const categories = JSON.parse(localStorage.getItem('categories') || '[]');
            return categories.map(cat => ({
                id: cat.id,
                lastmod: cat.updatedAt || cat.createdAt
            }));
        } catch (e) {
            console.error('Error loading categories:', e);
            return [];
        }
    }
    
    getProducts() {
        try {
            const products = JSON.parse(localStorage.getItem('products') || '[]');
            return products.map(product => ({
                id: product.id,
                lastmod: product.updatedAt || product.createdAt,
                createdAt: product.createdAt
            }));
        } catch (e) {
            console.error('Error loading products:', e);
            return [];
        }
    }
    
    getGuides() {
        try {
            const guides = JSON.parse(localStorage.getItem('guides') || '[]');
            return guides.map(guide => ({
                id: guide.id,
                lastmod: guide.updatedDate || guide.publishedDate,
                publishedDate: guide.publishedDate
            }));
        } catch (e) {
            console.error('Error loading guides:', e);
            return [];
        }
    }
    
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }
    
    escapeXML(text) {
        return text.replace(/[<>&'"]/g, function(c) {
            switch(c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case "'": return '&apos;';
                case '"': return '&quot;';
            }
        });
    }
    
    // Generate robots.txt
    generateRobotsTxt() {
        return `# robots.txt for ${this.baseUrl}
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /private/
Disallow: /tmp/

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 2

# Specific bot directives
User-agent: Googlebot
Allow: /
Disallow: /admin/

User-agent: Googlebot-Image
Allow: /images/
Disallow: /admin/

User-agent: Bingbot
Allow: /
Disallow: /admin/

User-agent: YandexBot
Allow: /
Disallow: /admin/

User-agent: Applebot
Allow: /
Disallow: /admin/`;
    }
    
    // Update sitemap in real-time when products are added
    updateSitemapOnProductAdd(product) {
        // This would typically be called when a product is added via admin
        console.log('Product added, sitemap should be updated:', product);
        // In a real implementation, you would regenerate the sitemap
    }
    
    // Generate sitemap index for large sites
    generateSitemapIndex(sitemapUrls) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        sitemapUrls.forEach(url => {
            xml += `    <sitemap>
        <loc>${this.escapeXML(url.loc)}</loc>
        ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    </sitemap>\n`;
        });
        
        xml += `</sitemapindex>`;
        return xml;
    }
    
    // Generate news sitemap for time-sensitive content
    generateNewsSitemap() {
        const recentProducts = this.getRecentProducts(1000); // Last 1000 products
        const recentGuides = this.getRecentGuides(1000); // Last 1000 guides
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
        xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
        xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
        xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\n`;
        xml += `        http://www.google.com/schemas/sitemap-news/0.9\n`;
        xml += `        http://www.google.com/schemas/sitemap-news/0.9/sitemap-news.xsd">\n\n`;
        
        // Add recent guides
        recentGuides.forEach(guide => {
            xml += this.generateNewsURLNode(guide);
        });
        
        xml += `</urlset>`;
        return xml;
    }
    
    generateNewsURLNode(item) {
        const publicationDate = item.publishedDate || item.createdAt || this.getTodayDate();
        
        return `    <url>
        <loc>${this.escapeXML(`${this.baseUrl}/guide-detail.html?id=${item.id}`)}</loc>
        <news:news>
            <news:publication>
                <news:name>ValueFinder Hub</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${publicationDate}</news:publication_date>
            <news:title>${this.escapeXML(item.title)}</news:title>
        </news:news>
    </url>\n`;
    }
    
    getRecentProducts(limit) {
        const products = this.getProducts();
        return products
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }
    
    getRecentGuides(limit) {
        const guides = this.getGuides();
        return guides
            .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
            .slice(0, limit);
    }
    
    // Generate image sitemap
    generateImageSitemap() {
        const products = this.getProducts();
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n`;
        xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
        xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
        xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd\n`;
        xml += `        http://www.google.com/schemas/sitemap-image/1.1\n`;
        xml += `        http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">\n\n`;
        
        products.forEach(product => {
            xml += this.generateImageURLNode(product);
        });
        
        xml += `</urlset>`;
        return xml;
    }
    
    generateImageURLNode(product) {
        // This would need actual product data with images
        const productUrl = `${this.baseUrl}/product-detail.html?id=${product.id}`;
        
        return `    <url>
        <loc>${this.escapeXML(productUrl)}</loc>
        <image:image>
            <image:loc>${this.escapeXML(product.imageUrl || '')}</image:loc>
            <image:title>${this.escapeXML(product.name || '')}</image:title>
            <image:caption>${this.escapeXML(product.description || '').substring(0, 200)}</image:caption>
        </image:image>
    </url>\n`;
    }
    
    // Save sitemap to file (client-side download)
    saveSitemapToFile(xmlContent, filename = 'sitemap.xml') {
        const blob = new Blob([xmlContent], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Generate and display sitemap in admin panel
    generateSitemapForAdmin() {
        const sitemap = this.generateSitemap();
        const robots = this.generateRobotsTxt();
        
        return {
            sitemap: sitemap,
            robots: robots,
            stats: {
                totalURLs: this.getAllURLs().length,
                categories: this.getCategories().length,
                products: this.getProducts().length,
                guides: this.getGuides().length,
                generated: new Date().toISOString()
            }
        };
    }
}

// Global sitemap generator instance
const sitemapGenerator = new SitemapGenerator();

// Admin function to generate sitemap
function generateSitemap() {
    const result = sitemapGenerator.generateSitemapForAdmin();
    
    // Display in admin panel
    const adminContent = document.getElementById('adminContent');
    if (adminContent) {
        adminContent.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Sitemap Generator</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <div class="fs-2 fw-bold">${result.stats.totalURLs}</div>
                                    <div class="text-muted">Total URLs</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <div class="fs-2 fw-bold">${result.stats.products}</div>
                                    <div class="text-muted">Products</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <div class="fs-2 fw-bold">${result.stats.categories}</div>
                                    <div class="text-muted">Categories</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card border-0 bg-light">
                                <div class="card-body text-center">
                                    <div class="fs-2 fw-bold">${result.stats.guides}</div>
                                    <div class="text-muted">Guides</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <h6>Sitemap XML</h6>
                        <textarea class="form-control font-monospace small" rows="10" readonly>${result.sitemap}</textarea>
                    </div>
                    
                    <div class="mb-4">
                        <h6>Robots.txt</h6>
                        <textarea class="form-control font-monospace small" rows="5" readonly>${result.robots}</textarea>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary" onclick="downloadSitemap()">
                            <i class="bi bi-download me-2"></i>Download Sitemap
                        </button>
                        <button class="btn btn-outline-primary" onclick="downloadRobots()">
                            <i class="bi bi-download me-2"></i>Download Robots.txt
                        </button>
                        <button class="btn btn-outline-secondary" onclick="copySitemap()">
                            <i class="bi bi-clipboard me-2"></i>Copy Sitemap
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    return result;
}

function downloadSitemap() {
    const result = sitemapGenerator.generateSitemapForAdmin();
    sitemapGenerator.saveSitemapToFile(result.sitemap, 'sitemap.xml');
}

function downloadRobots() {
    const result = sitemapGenerator.generateSitemapForAdmin();
    const blob = new Blob([result.robots], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function copySitemap() {
    const result = sitemapGenerator.generateSitemapForAdmin();
    navigator.clipboard.writeText(result.sitemap)
        .then(() => {
            alert('Sitemap copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
        });
}

// Auto-generate sitemap on product changes (in admin)
if (typeof ProductManager !== 'undefined') {
    const originalAddProduct = ProductManager.prototype.addProduct;
    ProductManager.prototype.addProduct = function(productData) {
        const result = originalAddProduct.call(this, productData);
        sitemapGenerator.updateSitemapOnProductAdd(result);
        return result;
    };
}
