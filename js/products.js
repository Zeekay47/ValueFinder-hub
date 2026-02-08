// Products Data Structure
class ProductManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products') || '[]');
        this.categories = JSON.parse(localStorage.getItem('categories') || '[]');
    }
    
    // Get all products
    getAllProducts() {
        return this.products;
    }
    
    // Get products by category
    getProductsByCategory(categoryId, limit = null) {
        let filtered = this.products.filter(p => p.category === categoryId);
        if (limit) {
            filtered = filtered.slice(0, limit);
        }
        return filtered;
    }
    
    // Get trending products (based on views/clicks)
    getTrendingProducts(limit = 8) {
        return [...this.products]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit);
    }
    
    // Get recently reviewed products
    getRecentlyReviewed(limit = 4) {
        return [...this.products]
            .sort((a, b) => new Date(b.reviewDate || b.createdAt) - new Date(a.reviewDate || a.createdAt))
            .slice(0, limit);
    }
    
    // Get product by ID
    getProductById(id) {
        return this.products.find(p => p.id == id);
    }
    
    // Search products
    searchProducts(query, category = null) {
        const searchTerms = query.toLowerCase().split(' ');
        
        return this.products.filter(product => {
            // Check category filter
            if (category && product.category !== category) return false;
            
            // Build search string
            const searchString = [
                product.name,
                product.brand,
                product.category,
                product.description,
                ...(product.features || [])
            ].join(' ').toLowerCase();
            
            // Check all search terms
            return searchTerms.every(term => searchString.includes(term));
        });
    }
    
    // Filter products with multiple criteria
    filterProducts(filters) {
        return this.products.filter(product => {
            // Category filter
            if (filters.category && product.category !== filters.category) return false;
            
            // Price range filter
            const bestPrice = this.getBestProductPrice(product);
            if (filters.minPrice && bestPrice < filters.minPrice) return false;
            if (filters.maxPrice && bestPrice > filters.maxPrice) return false;
            
            // Rating filter
            if (filters.minRating && product.rating < filters.minRating) return false;
            
            // Brand filter
            if (filters.brands && filters.brands.length > 0) {
                if (!filters.brands.includes(product.brand)) return false;
            }
            
            // Retailer filter
            if (filters.retailers && filters.retailers.length > 0) {
                const hasRetailer = product.retailers.some(r => 
                    filters.retailers.includes(r.name.toLowerCase())
                );
                if (!hasRetailer) return false;
            }
            
            return true;
        });
    }
    
    // Get best price for product
    getBestProductPrice(product) {
        if (!product.retailers || product.retailers.length === 0) return 0;
        
        const prices = product.retailers
            .filter(r => r.price > 0)
            .map(r => r.price);
        
        return prices.length > 0 ? Math.min(...prices) : 0;
    }
    
    // Increment product views
    incrementViews(productId) {
        const product = this.getProductById(productId);
        if (product) {
            product.views = (product.views || 0) + 1;
            this.saveProducts();
        }
    }
    
    // Save products to localStorage
    saveProducts() {
        localStorage.setItem('products', JSON.stringify(this.products));
    }
    
    // Add new product (admin function)
    addProduct(productData) {
        const newProduct = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            views: 0,
            ...productData
        };
        
        this.products.push(newProduct);
        this.saveProducts();
        return newProduct;
    }
    
    // Update product
    updateProduct(id, updates) {
        const index = this.products.findIndex(p => p.id == id);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            this.saveProducts();
            return true;
        }
        return false;
    }
    
    // Get all unique brands
    getAllBrands(category = null) {
        let filteredProducts = this.products;
        if (category) {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }
        
        const brands = [...new Set(filteredProducts.map(p => p.brand).filter(Boolean))];
        return brands.sort();
    }
    
    // Get all unique retailers
    getAllRetailers() {
        const retailers = new Set();
        this.products.forEach(product => {
            if (product.retailers) {
                product.retailers.forEach(r => retailers.add(r.name));
            }
        });
        return Array.from(retailers).sort();
    }
}

// Initialize product manager
const productManager = new ProductManager();

// Render product card
function renderProductCard(product) {
    const bestPrice = productManager.getBestProductPrice(product);
    const originalPrice = product.retailers?.[0]?.originalPrice || bestPrice;
    const savings = calculateSavings(originalPrice, bestPrice);
    
    return `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="card product-card h-100 border-0 shadow-sm hover-shadow">
                <div class="position-relative">
                    <a href="product-detail.html?id=${product.id}">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    </a>
                    <div class="product-badges position-absolute top-0 start-0 p-2">
                        ${product.isBestSeller ? '<span class="badge bg-warning mb-1">Best Seller</span>' : ''}
                        ${product.isNew ? '<span class="badge bg-success mb-1">New</span>' : ''}
                        ${savings && savings.percentage > 0 ? 
                            `<span class="badge bg-danger">Save ${savings.percentage}%</span>` : ''}
                    </div>
                    <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-2 rounded-circle"
                            onclick="addToComparison('${product.id}')"
                            data-bs-toggle="tooltip" title="Add to compare">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
                
                <div class="card-body d-flex flex-column">
                    <div class="mb-2">
                        <span class="badge bg-light text-dark border">${product.category}</span>
                    </div>
                    
                    <h3 class="h6 card-title">
                        <a href="product-detail.html?id=${product.id}" class="text-decoration-none text-dark">
                            ${product.name}
                        </a>
                    </h3>
                    
                    <div class="mb-2">
                        ${generateStarRating(product.rating, product.reviewCount)}
                    </div>
                    
                    <div class="mb-3">
                        <span class="text-muted small">by ${product.brand}</span>
                    </div>
                    
                    <div class="mt-auto">
                        <div class="d-flex align-items-center mb-2">
                            <span class="h5 mb-0 fw-bold text-primary">${formatCurrency(bestPrice)}</span>
                            ${originalPrice > bestPrice ? 
                                `<span class="text-muted text-decoration-line-through ms-2">${formatCurrency(originalPrice)}</span>` : ''}
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="product-detail.html?id=${product.id}" 
                               class="btn btn-primary btn-sm">
                                View Details
                            </a>
                            <button class="btn btn-outline-primary btn-sm"
                                    onclick="window.openAffiliateLink('${product.id}', 'amazon')">
                                <i class="bi bi-lightning"></i> Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render category card
function renderCategoryCard(category) {
    return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <a href="products.html?category=${category.id}" class="text-decoration-none">
                <div class="category-card card border-0 shadow-sm hover-lift h-100">
                    <div class="card-body text-center p-4">
                        <div class="category-icon mb-3">
                            <div class="icon-wrapper bg-${category.color || 'primary'}-subtle rounded-circle p-3 d-inline-flex">
                                <i class="bi bi-${category.icon || 'grid'} fs-2 text-${category.color || 'primary'}"></i>
                            </div>
                        </div>
                        <h3 class="h5 mb-2">${category.name}</h3>
                        <p class="text-muted small mb-0">${category.count || 0} products</p>
                    </div>
                </div>
            </a>
        </div>
    `;
}

// Load trending products on homepage
function loadTrendingProducts() {
    const container = document.getElementById('trendingProducts');
    if (!container) return;
    
    const products = productManager.getTrendingProducts(8);
    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}

// Load categories on homepage
function loadCategories() {
    const container = document.getElementById('categoryGrid');
    if (!container) return;
    
    const categories = productManager.categories;
    container.innerHTML = categories.map(c => renderCategoryCard(c)).join('');
}

// Load recently reviewed
function loadRecentlyReviewed() {
    const container = document.getElementById('recentlyReviewed');
    if (!container) return;
    
    const products = productManager.getRecentlyReviewed(4);
    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}

// Load products for category page
function loadCategoryProducts(categoryId) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    const products = productManager.getProductsByCategory(categoryId);
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search fs-1 text-muted mb-3"></i>
                <h3>No products found in this category</h3>
                <p class="text-muted">Check back soon or browse other categories.</p>
                <a href="products.html" class="btn btn-primary">Browse All Categories</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}

// Render product filters
function renderProductFilters(categoryId) {
    const container = document.getElementById('filterSidebar');
    if (!container) return;
    
    const brands = productManager.getAllBrands(categoryId);
    const retailers = productManager.getAllRetailers();
    const products = productManager.getProductsByCategory(categoryId);
    
    // Get price range
    const prices = products.map(p => productManager.getBestProductPrice(p)).filter(p => p > 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    container.innerHTML = `
        <div class="filter-section mb-4">
            <h6 class="fw-bold mb-3">Price Range</h6>
            <div class="price-slider mb-3">
                <input type="range" class="form-range" id="priceMin" min="${minPrice}" max="${maxPrice}" value="${minPrice}">
                <input type="range" class="form-range" id="priceMax" min="${minPrice}" max="${maxPrice}" value="${maxPrice}">
            </div>
            <div class="d-flex justify-content-between">
                <span id="priceMinLabel">${formatCurrency(minPrice)}</span>
                <span id="priceMaxLabel">${formatCurrency(maxPrice)}</span>
            </div>
        </div>
        
        ${brands.length > 0 ? `
        <div class="filter-section mb-4">
            <h6 class="fw-bold mb-3">Brands</h6>
            <div class="brand-filters">
                ${brands.map(brand => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="brand-${brand}" value="${brand}">
                        <label class="form-check-label" for="brand-${brand}">${brand}</label>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
        
        ${retailers.length > 0 ? `
        <div class="filter-section mb-4">
            <h6 class="fw-bold mb-3">Available At</h6>
            <div class="retailer-filters">
                ${retailers.map(retailer => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="retailer-${retailer}" value="${retailer}">
                        <label class="form-check-label d-flex align-items-center">
                            ${CONFIG.retailerLogos[retailer.toLowerCase()] || ''}
                            <span class="ms-2">${retailer}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
        
        <div class="filter-section mb-4">
            <h6 class="fw-bold mb-3">Rating</h6>
            <div class="rating-filters">
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="ratingFilter" id="rating-all" value="0" checked>
                    <label class="form-check-label" for="rating-all">All Ratings</label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="ratingFilter" id="rating-4" value="4">
                    <label class="form-check-label" for="rating-4">
                        ${generateStarRating(4)} & above
                    </label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="ratingFilter" id="rating-3" value="3">
                    <label class="form-check-label" for="rating-3">
                        ${generateStarRating(3)} & above
                    </label>
                </div>
            </div>
        </div>
        
        <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="applyFilters()">Apply Filters</button>
            <button class="btn btn-outline-secondary" onclick="clearFilters()">Clear All</button>
        </div>
    `;
    
    // Initialize price slider
    initPriceSlider(minPrice, maxPrice);
}

function initPriceSlider(minPrice, maxPrice) {
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceMinLabel = document.getElementById('priceMinLabel');
    const priceMaxLabel = document.getElementById('priceMaxLabel');
    
    if (!priceMin || !priceMax) return;
    
    const updateLabels = () => {
        priceMinLabel.textContent = formatCurrency(parseInt(priceMin.value));
        priceMaxLabel.textContent = formatCurrency(parseInt(priceMax.value));
    };
    
    priceMin.addEventListener('input', updateLabels);
    priceMax.addEventListener('input', updateLabels);
    updateLabels();
}

// Apply filters
function applyFilters() {
    const category = getUrlParams().category;
    const filters = {
        category: category,
        minPrice: parseInt(document.getElementById('priceMin')?.value) || 0,
        maxPrice: parseInt(document.getElementById('priceMax')?.value) || 10000,
        minRating: parseFloat(document.querySelector('input[name="ratingFilter"]:checked')?.value) || 0
    };
    
    // Get selected brands
    const selectedBrands = Array.from(document.querySelectorAll('.brand-filters input:checked'))
        .map(cb => cb.value);
    if (selectedBrands.length > 0) {
        filters.brands = selectedBrands;
    }
    
    // Get selected retailers
    const selectedRetailers = Array.from(document.querySelectorAll('.retailer-filters input:checked'))
        .map(cb => cb.value.toLowerCase());
    if (selectedRetailers.length > 0) {
        filters.retailers = selectedRetailers;
    }
    
    // Filter products
    const filteredProducts = productManager.filterProducts(filters);
    renderFilteredProducts(filteredProducts);
}

function clearFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[type="radio"]').forEach(rb => rb.checked = rb.value === '0');
    
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    if (priceMin && priceMax) {
        priceMin.value = priceMin.min;
        priceMax.value = priceMax.max;
        priceMin.dispatchEvent(new Event('input'));
    }
    
    applyFilters();
}

function renderFilteredProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-filter-circle fs-1 text-muted mb-3"></i>
                <h3>No products match your filters</h3>
                <p class="text-muted">Try adjusting your criteria.</p>
                <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}

// Sort products
function sortProducts(sortBy) {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    const currentProducts = Array.from(container.querySelectorAll('.product-card')).map(card => {
        return card.querySelector('a[href*="id="]').href.split('id=')[1];
    });
    
    const products = currentProducts.map(id => productManager.getProductById(id));
    
    switch(sortBy) {
        case 'price-low':
            products.sort((a, b) => 
                productManager.getBestProductPrice(a) - productManager.getBestProductPrice(b)
            );
            break;
        case 'price-high':
            products.sort((a, b) => 
                productManager.getBestProductPrice(b) - productManager.getBestProductPrice(a)
            );
            break;
        case 'rating':
            products.sort((a, b) => b.rating - a.rating);
            break;
        case 'popularity':
            products.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }
    
    container.innerHTML = products.map(p => renderProductCard(p)).join('');
}