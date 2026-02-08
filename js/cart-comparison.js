// Cart and Product Comparison System
class ComparisonManager {
    constructor() {
        this.maxComparisonItems = 4;
        this.comparisonKey = 'valuefinder_comparison';
        this.cartKey = 'valuefinder_cart';
        this.init();
    }
    
    init() {
        // Load comparison items
        this.comparisonItems = this.getComparisonItems();
        this.cartItems = this.getCartItems();
        
        // Update UI
        this.updateComparisonBadge();
        this.updateCartBadge();
    }
    
    // Comparison Functions
    getComparisonItems() {
        const items = localStorage.getItem(this.comparisonKey);
        return items ? JSON.parse(items) : [];
    }
    
    saveComparisonItems() {
        localStorage.setItem(this.comparisonKey, JSON.stringify(this.comparisonItems));
    }
    
    addToComparison(productId) {
        if (this.comparisonItems.length >= this.maxComparisonItems) {
            this.showNotification('Maximum of 4 products can be compared', 'warning');
            return false;
        }
        
        if (!this.comparisonItems.includes(productId)) {
            this.comparisonItems.push(productId);
            this.saveComparisonItems();
            this.updateComparisonBadge();
            this.showNotification('Product added to comparison', 'success');
            return true;
        } else {
            this.showNotification('Product already in comparison', 'info');
            return false;
        }
    }
    
    removeFromComparison(productId) {
        const index = this.comparisonItems.indexOf(productId);
        if (index > -1) {
            this.comparisonItems.splice(index, 1);
            this.saveComparisonItems();
            this.updateComparisonBadge();
            this.showNotification('Product removed from comparison', 'info');
            return true;
        }
        return false;
    }
    
    clearComparison() {
        this.comparisonItems = [];
        this.saveComparisonItems();
        this.updateComparisonBadge();
        this.showNotification('Comparison cleared', 'info');
    }
    
    updateComparisonBadge() {
        const badges = document.querySelectorAll('.comparison-badge');
        const count = this.comparisonItems.length;
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }
    
    // Cart Functions
    getCartItems() {
        const items = localStorage.getItem(this.cartKey);
        return items ? JSON.parse(items) : [];
    }
    
    saveCartItems() {
        localStorage.setItem(this.cartKey, JSON.stringify(this.cartItems));
    }
    
    addToCart(productId, quantity = 1, retailer = 'amazon') {
        const existingItem = this.cartItems.find(item => 
            item.productId === productId && item.retailer === retailer
        );
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cartItems.push({
                productId,
                retailer,
                quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCartItems();
        this.updateCartBadge();
        this.showNotification('Added to cart', 'success');
        return true;
    }
    
    removeFromCart(productId, retailer = null) {
        if (retailer) {
            this.cartItems = this.cartItems.filter(item => 
                !(item.productId === productId && item.retailer === retailer)
            );
        } else {
            this.cartItems = this.cartItems.filter(item => item.productId !== productId);
        }
        
        this.saveCartItems();
        this.updateCartBadge();
        this.showNotification('Removed from cart', 'info');
    }
    
    updateCartItemQuantity(productId, retailer, quantity) {
        const item = this.cartItems.find(item => 
            item.productId === productId && item.retailer === retailer
        );
        
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId, retailer);
            } else {
                item.quantity = quantity;
                this.saveCartItems();
            }
            return true;
        }
        return false;
    }
    
    clearCart() {
        this.cartItems = [];
        this.saveCartItems();
        this.updateCartBadge();
        this.showNotification('Cart cleared', 'info');
    }
    
    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = this.cartItems.reduce((total, item) => total + item.quantity, 0);
        
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }
    
    // Comparison View
    renderComparisonView() {
        if (this.comparisonItems.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="bi bi-shuffle fs-1 text-muted mb-3"></i>
                    <h4>No products to compare</h4>
                    <p class="text-muted">Add products to comparison to see them side-by-side.</p>
                    <a href="products.html" class="btn btn-primary">Browse Products</a>
                </div>
            `;
        }
        
        // Load product details
        const productManager = new ProductManager();
        const products = this.comparisonItems
            .map(id => productManager.getProductById(id))
            .filter(p => p !== undefined);
        
        if (products.length === 0) {
            return '<div class="alert alert-warning">Some products could not be loaded.</div>';
        }
        
        // Generate comparison table
        return this.generateComparisonTable(products);
    }
    
    generateComparisonTable(products) {
        // Get all unique specifications
        const allSpecs = new Set();
        products.forEach(product => {
            if (product.specifications) {
                Object.keys(product.specifications).forEach(key => allSpecs.add(key));
            }
        });
        
        const specs = Array.from(allSpecs);
        
        let html = `
            <div class="comparison-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="h4 fw-bold">Compare Products (${products.length})</h3>
                    <button class="btn btn-outline-danger btn-sm" onclick="comparisonManager.clearComparison()">
                        Clear All
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="table comparison-table">
                        <thead>
                            <tr>
                                <th style="width: 200px;">Features</th>
                                ${products.map(product => `
                                    <th style="min-width: 250px;">
                                        <div class="comparison-product-header">
                                            <button class="btn-close float-end" 
                                                    onclick="comparisonManager.removeFromComparison('${product.id}')"></button>
                                            <img src="${product.image}" alt="${product.name}" 
                                                 class="img-fluid mb-2" style="height: 120px; object-fit: contain;">
                                            <h5 class="h6 fw-bold">${product.name}</h5>
                                            <div class="mb-2">${generateStarRating(product.rating)}</div>
                                            <div class="h5 fw-bold text-primary mb-2">
                                                ${formatCurrency(productManager.getBestProductPrice(product))}
                                            </div>
                                            <div class="d-grid gap-2">
                                                <a href="product-detail.html?id=${product.id}" 
                                                   class="btn btn-sm btn-outline-primary">View Details</a>
                                                <button class="btn btn-sm btn-primary"
                                                        onclick="window.openAffiliateLink('${product.id}', 'amazon')">
                                                    Buy Now
                                                </button>
                                            </div>
                                        </div>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <
