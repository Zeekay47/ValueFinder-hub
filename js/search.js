// Search Functionality
class SearchManager {
    constructor() {
        this.searchIndex = null;
        this.products = [];
        this.categories = [];
        this.guides = [];
        this.init();
    }
    
    async init() {
        await this.loadData();
        this.buildSearchIndex();
        this.initSearch();
    }
    
    async loadData() {
        try {
            // Load products
            const productsResponse = await fetch('data/products.json');
            this.products = await productsResponse.json();
            
            // Load categories
            const categoriesResponse = await fetch('data/categories.json');
            this.categories = await categoriesResponse.json();
            
            // Load guides
            const guidesResponse = await fetch('data/guides.json');
            this.guides = await guidesResponse.json();
            
        } catch (error) {
            console.error('Error loading search data:', error);
        }
    }
    
    buildSearchIndex() {
        // Simple search index implementation
        // In production, you might want to use a more sophisticated solution
        this.searchIndex = {
            products: this.products.map(product => ({
                id: product.id,
                type: 'product',
                title: product.name,
                description: product.description,
                category: product.category,
                brand: product.brand,
                searchText: `${product.name} ${product.brand} ${product.category} ${product.description} ${product.features?.join(' ')}`.toLowerCase()
            })),
            categories: this.categories.map(category => ({
                id: category.id,
                type: 'category',
                title: category.name,
                description: category.description,
                searchText: `${category.name} ${category.description}`.toLowerCase()
            })),
            guides: this.guides.map(guide => ({
                id: guide.id,
                type: 'guide',
                title: guide.title,
                description: guide.excerpt,
                category: guide.category,
                searchText: `${guide.title} ${guide.excerpt} ${guide.category}`.toLowerCase()
            }))
        };
    }
    
    initSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchForm = document.getElementById('searchForm');
        
        if (searchInput) {
            // Real-time search suggestions
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length >= 2) {
                    this.showSuggestions(query);
                } else {
                    this.hideSuggestions();
                }
            });
            
            // Handle form submission
            if (searchForm) {
                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                });
            }
            
            // Close suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-wrapper')) {
                    this.hideSuggestions();
                }
            });
        }
    }
    
    showSuggestions(query) {
        const results = this.search(query, 5);
        const container = document.querySelector('.search-results');
        
        if (!container || results.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        let html = '';
        
        // Group results by type
        const products = results.filter(r => r.type === 'product');
        const categories = results.filter(r => r.type === 'category');
        const guides = results.filter(r => r.type === 'guide');
        
        if (products.length > 0) {
            html += `
                <div class="dropdown-header">Products</div>
                ${products.map(item => `
                    <a class="dropdown-item" href="product-detail.html?id=${item.id}">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-box me-2 text-primary"></i>
                            <div>
                                <div class="fw-semibold">${this.highlightText(item.title, query)}</div>
                                <div class="small text-muted">${item.brand || ''}</div>
                            </div>
                        </div>
                    </a>
                `).join('')}
            `;
        }
        
        if (categories.length > 0) {
            html += `
                <div class="dropdown-header">Categories</div>
                ${categories.map(item => `
                    <a class="dropdown-item" href="category.html?cat=${item.id}">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-grid me-2 text-success"></i>
                            <div>
                                <div class="fw-semibold">${this.highlightText(item.title, query)}</div>
                            </div>
                        </div>
                    </a>
                `).join('')}
            `;
        }
        
        if (guides.length > 0) {
            html += `
                <div class="dropdown-header">Guides</div>
                ${guides.map(item => `
                    <a class="dropdown-item" href="guide-detail.html?id=${item.id}">
                        <div class="d-flex align-items-center">
                            <i class="bi bi-journal-text me-2 text-warning"></i>
                            <div>
                                <div class="fw-semibold">${this.highlightText(item.title, query)}</div>
                                <div class="small text-muted">${item.category}</div>
                            </div>
                        </div>
                    </a>
                `).join('')}
            `;
        }
        
        // Add "See all results" link
        html += `
            <div class="dropdown-divider"></div>
            <a class="dropdown-item text-center text-primary fw-semibold" 
               href="search.html?q=${encodeURIComponent(query)}">
                See all results for "${query}"
                <i class="bi bi-arrow-right ms-1"></i>
            </a>
        `;
        
        container.innerHTML = html;
        container.classList.add('show');
    }
    
    hideSuggestions() {
        const container = document.querySelector('.search-results');
        if (container) {
            container.classList.remove('show');
        }
    }
    
    search(query, limit = null) {
        if (!this.searchIndex || !query) return [];
        
        const searchTerms = query.toLowerCase().split(' ');
        let allResults = [];
        
        // Search products
        const productResults = this.searchIndex.products
            .filter(item => {
                return searchTerms.every(term => item.searchText.includes(term));
            })
            .map(item => ({ ...item, relevance: this.calculateRelevance(item, query) }));
        
        // Search categories
        const categoryResults = this.searchIndex.categories
            .filter(item => {
                return searchTerms.every(term => item.searchText.includes(term));
            })
            .map(item => ({ ...item, relevance: this.calculateRelevance(item, query) }));
        
        // Search guides
        const guideResults = this.searchIndex.guides
            .filter(item => {
                return searchTerms.every(term => item.searchText.includes(term));
            })
            .map(item => ({ ...item, relevance: this.calculateRelevance(item, query) }));
        
        // Combine and sort by relevance
        allResults = [...productResults, ...categoryResults, ...guideResults]
            .sort((a, b) => b.relevance - a.relevance);
        
        return limit ? allResults.slice(0, limit) : allResults;
    }
    
    calculateRelevance(item, query) {
        const queryTerms = query.toLowerCase().split(' ');
        let relevance = 0;
        
        // Title matches are most important
        queryTerms.forEach(term => {
            if (item.title.toLowerCase().includes(term)) {
                relevance += 10;
            }
        });
        
        // Description matches
        queryTerms.forEach(term => {
            if (item.description?.toLowerCase().includes(term)) {
                relevance += 3;
            }
        });
        
        // Category matches
        queryTerms.forEach(term => {
            if (item.category?.toLowerCase().includes(term)) {
                relevance += 5;
            }
        });
        
        // Brand matches (for products)
        queryTerms.forEach(term => {
            if (item.brand?.toLowerCase().includes(term)) {
                relevance += 4;
            }
        });
        
        return relevance;
    }
    
    highlightText(text, query) {
        if (!text || !query) return text;
        
        const terms = query.toLowerCase().split(' ');
        let highlighted = text;
        
        terms.forEach(term => {
            if (term.length >= 2) {
                const regex = new RegExp(`(${term})`, 'gi');
                highlighted = highlighted.replace(regex, '<mark>$1</mark>');
            }
        });
        
        return highlighted;
    }
    
    performSearch(query) {
        // Save search query to localStorage for analytics
        this.saveSearchHistory(query);
        
        // Redirect to search results page
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
    
    saveSearchHistory(query) {
        let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        
        // Add new query to beginning
        history.unshift({
            query: query,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 searches
        history = history.slice(0, 10);
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }
    
    getSearchHistory() {
        return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }
    
    clearSearchHistory() {
        localStorage.removeItem('searchHistory');
    }
    
    // Advanced search with filters
    advancedSearch(filters) {
        let results = [...this.products];
        
        // Apply filters
        if (filters.category) {
            results = results.filter(p => p.category === filters.category);
        }
        
        if (filters.minPrice || filters.maxPrice) {
            const productManager = new ProductManager();
            results = results.filter(p => {
                const price = productManager.getBestProductPrice(p);
                if (filters.minPrice && price < filters.minPrice) return false;
                if (filters.maxPrice && price > filters.maxPrice) return false;
                return true;
            });
        }
        
        if (filters.minRating) {
            results = results.filter(p => (p.rating || 0) >= filters.minRating);
        }
        
        if (filters.brands && filters.brands.length > 0) {
            results = results.filter(p => filters.brands.includes(p.brand));
        }
        
        if (filters.query) {
            const searchTerms = filters.query.toLowerCase().split(' ');
            results = results.filter(product => {
                const searchString = [
                    product.name,
                    product.brand,
                    product.category,
                    product.description,
                    ...(product.features || [])
                ].join(' ').toLowerCase();
                
                return searchTerms.every(term => searchString.includes(term));
            });
        }
        
        // Sort results
        if (filters.sortBy) {
            const productManager = new ProductManager();
            
            switch(filters.sortBy) {
                case 'price-low':
                    results.sort((a, b) => 
                        productManager.getBestProductPrice(a) - productManager.getBestProductPrice(b)
                    );
                    break;
                case 'price-high':
                    results.sort((a, b) => 
                        productManager.getBestProductPrice(b) - productManager.getBestProductPrice(a)
                    );
                    break;
                case 'rating':
                    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'popularity':
                    results.sort((a, b) => (b.views || 0) - (a.views || 0));
                    break;
                case 'newest':
                    results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    break;
            }
        }
        
        return results;
    }
    
    // Render search results page
    renderSearchResults(query, filters = {}) {
        const results = this.search(query);
        const container = document.getElementById('searchResults');
        
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = this.renderNoResults(query);
            return;
        }
        
        // Group results by type
        const products = results.filter(r => r.type === 'product');
        const categories = results.filter(r => r.type === 'category');
        const guides = results.filter(r => r.type === 'guide');
        
        let html = `
            <div class="search-results-header mb-4">
                <h1 class="h3 fw-bold">Search Results for "${query}"</h1>
                <p class="text-muted">Found ${results.length} results</p>
            </div>
        `;
        
        // Products section
        if (products.length > 0) {
            html += `
                <section class="mb-5">
                    <h2 class="h4 fw-bold mb-3">
                        <i class="bi bi-box text-primary me-2"></i>
                        Products (${products.length})
                    </h2>
                    <div class="row g-4">
                        ${products.map(item => {
                            const product = this.products.find(p => p.id === item.id);
                            if (!product) return '';
                            
                            const productManager = new ProductManager();
                            const bestPrice = productManager.getBestProductPrice(product);
                            
                            return `
                                <div class="col-md-3 col-sm-6">
                                    <div class="card product-card h-100">
                                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                                        <div class="card-body">
                                            <h3 class="h6 card-title">
                                                <a href="product-detail.html?id=${product.id}" class="text-decoration-none">
                                                    ${this.highlightText(product.name, query)}
                                                </a>
                                            </h3>
                                            <div class="mb-2">${generateStarRating(product.rating)}</div>
                                            <div class="h5 fw-bold text-primary">${formatCurrency(bestPrice)}</div>
                                            <a href="product-detail.html?id=${product.id}" class="btn btn-sm btn-primary w-100 mt-2">
                                                View Details
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        }
        
        // Categories section
        if (categories.length > 0) {
            html += `
                <section class="mb-5">
                    <h2 class="h4 fw-bold mb-3">
                        <i class="bi bi-grid text-success me-2"></i>
                        Categories (${categories.length})
                    </h2>
                    <div class="row g-4">
                        ${categories.map(item => {
                            const category = this.categories.find(c => c.id === item.id);
                            if (!category) return '';
                            
                            return `
                                <div class="col-md-4">
                                    <div class="card border-0 shadow-sm h-100">
                                        <div class="card-body text-center p-4">
                                            <div class="category-icon mb-3">
                                                <i class="bi bi-${category.icon} fs-2 text-${category.color}"></i>
                                            </div>
                                            <h3 class="h5 mb-2">
                                                <a href="category.html?cat=${category.id}" class="text-decoration-none">
                                                    ${this.highlightText(category.name, query)}
                                                </a>
                                            </h3>
                                            <p class="text-muted small">${category.description}</p>
                                            <a href="category.html?cat=${category.id}" class="btn btn-outline-primary btn-sm">
                                                Browse Products
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        }
        
        // Guides section
        if (guides.length > 0) {
            html += `
                <section class="mb-5">
                    <h2 class="h4 fw-bold mb-3">
                        <i class="bi bi-journal-text text-warning me-2"></i>
                        Buying Guides (${guides.length})
                    </h2>
                    <div class="row g-4">
                        ${guides.map(item => {
                            const guide = this.guides.find(g => g.id === item.id);
                            if (!guide) return '';
                            
                            return `
                                <div class="col-md-4">
                                    <div class="card h-100">
                                        <img src="${guide.image}" class="card-img-top" alt="${guide.title}">
                                        <div class="card-body">
                                            <span class="badge bg-primary mb-2">${guide.category}</span>
                                            <h3 class="h6 card-title">
                                                <a href="guide-detail.html?id=${guide.id}" class="text-decoration-none">
                                                    ${this.highlightText(guide.title, query)}
                                                </a>
                                            </h3>
                                            <p class="card-text small text-muted">${guide.excerpt}</p>
                                            <div class="d-flex justify-content-between align-items-center">
                                                <small class="text-muted">${guide.readTime}</small>
                                                <a href="guide-detail.html?id=${guide.id}" class="btn btn-sm btn-outline-primary">Read</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </section>
            `;
        }
        
        // Search history
        const history = this.getSearchHistory();
        if (history.length > 0) {
            html += `
                <section class="mt-5 pt-4 border-top">
                    <h3 class="h5 fw-bold mb-3">Recent Searches</h3>
                    <div class="d-flex flex-wrap gap-2">
                        ${history.slice(0, 5).map(item => `
                            <a href="search.html?q=${encodeURIComponent(item.query)}" 
                               class="badge bg-light text-dark border text-decoration-none">
                                ${item.query}
                            </a>
                        `).join('')}
                        <button class="badge bg-light text-dark border" onclick="clearSearchHistory()">
                            Clear History
                        </button>
                    </div>
                </section>
            `;
        }
        
        container.innerHTML = html;
    }
    
    renderNoResults(query) {
        return `
            <div class="text-center py-5">
                <i class="bi bi-search fs-1 text-muted mb-3"></i>
                <h2 class="h3 fw-bold mb-3">No results found for "${query}"</h2>
                <p class="text-muted mb-4">Try adjusting your search terms or browse our categories.</p>
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body">
                                <h3 class="h5 fw-bold mb-3">Search Tips</h3>
                                <ul class="text-start mb-0">
                                    <li class="mb-2">Check your spelling</li>
                                    <li class="mb-2">Try more general search terms</li>
                                    <li class="mb-2">Use fewer keywords</li>
                                    <li>Browse by category instead</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4">
                    <a href="products.html" class="btn btn-primary">Browse All Products</a>
                    <a href="blog.html" class="btn btn-outline-primary ms-2">Browse Buying Guides</a>
                </div>
            </div>
        `;
    }
}

// Initialize search manager
const searchManager = new SearchManager();

// Global functions
function clearSearchHistory() {
    searchManager.clearSearchHistory();
    location.reload();
}

// Initialize search on page load
document.addEventListener('DOMContentLoaded', function() {
    // If we're on a search page, render results
    if (window.location.pathname.includes('search.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query) {
            searchManager.renderSearchResults(query);
            
            // Update page title
            document.title = `Search: "${query}" - ValueFinder Hub`;
        }
    }
});
