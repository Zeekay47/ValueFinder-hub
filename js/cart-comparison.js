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
                        <tbody>
                            <!-- Prices -->
                            <tr>
                                <th>Prices</th>
                                ${products.map(product => `
                                    <td>
                                        <div class="price-comparison-small">
                                            ${(product.retailers || []).slice(0, 3).map(retailer => `
                                                <div class="d-flex justify-content-between small mb-1">
                                                    <span>${retailer.name}</span>
                                                    <span class="fw-bold">${formatCurrency(retailer.price)}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                            
                            <!-- Ratings -->
                            <tr>
                                <th>Rating</th>
                                ${products.map(product => `
                                    <td>
                                        ${generateStarRating(product.rating)}
                                        <div class="small text-muted">${product.reviewCount || 0} reviews</div>
                                    </td>
                                `).join('')}
                            </tr>
                            
                            <!-- Brand -->
                            <tr>
                                <th>Brand</th>
                                ${products.map(product => `<td>${product.brand}</td>`).join('')}
                            </tr>
                            
                            <!-- Category -->
                            <tr>
                                <th>Category</th>
                                ${products.map(product => `<td>${product.category}</td>`).join('')}
                            </tr>
                            
                            <!-- Specifications -->
                            ${specs.map(spec => `
                                <tr>
                                    <th>${spec}</th>
                                    ${products.map(product => `
                                        <td>${product.specifications?.[spec] || 'N/A'}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                            
                            <!-- Key Features -->
                            <tr>
                                <th>Key Features</th>
                                ${products.map(product => `
                                    <td>
                                        <ul class="list-unstyled mb-0">
                                            ${(product.features || []).slice(0, 5).map(feature => `
                                                <li class="mb-1">
                                                    <i class="bi bi-check text-success me-2"></i>
                                                    ${feature}
                                                </li>
                                            `).join('')}
                                        </ul>
                                    </td>
                                `).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-outline-primary" onclick="window.print()">
                        <i class="bi bi-printer me-2"></i>Print Comparison
                    </button>
                    <button class="btn btn-outline-secondary ms-2" onclick="exportComparison()">
                        <i class="bi bi-download me-2"></i>Export as PDF
                    </button>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Cart View
    renderCartView() {
        if (this.cartItems.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="bi bi-cart fs-1 text-muted mb-3"></i>
                    <h4>Your cart is empty</h4>
                    <p class="text-muted">Add products to your cart to see them here.</p>
                    <a href="products.html" class="btn btn-primary">Continue Shopping</a>
                </div>
            `;
        }
        
        // Load product details
        const productManager = new ProductManager();
        const cartProducts = this.cartItems.map(item => {
            const product = productManager.getProductById(item.productId);
            return {
                ...item,
                product: product,
                retailerInfo: product?.retailers?.find(r => r.name.toLowerCase() === item.retailer)
            };
        }).filter(item => item.product !== undefined);
        
        let total = 0;
        
        const html = `
            <div class="cart-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="h4 fw-bold">Your Cart (${cartProducts.length} items)</h3>
                    <button class="btn btn-outline-danger btn-sm" onclick="comparisonManager.clearCart()">
                        Clear Cart
                    </button>
                </div>
                
                <div class="cart-items">
                    ${cartProducts.map(item => {
                        const price = item.retailerInfo?.price || 0;
                        const subtotal = price * item.quantity;
                        total += subtotal;
                        
                        return `
                            <div class="cart-item card border-0 shadow-sm mb-3">
                                <div class="card-body">
                                    <div class="row align-items-center">
                                        <div class="col-md-2 col-4">
                                            <img src="${item.product.image}" alt="${item.product.name}" 
                                                 class="img-fluid rounded">
                                        </div>
                                        <div class="col-md-4 col-8">
                                            <h5 class="h6 fw-bold mb-1">${item.product.name}</h5>
                                            <p class="text-muted small mb-2">${item.product.brand}</p>
                                            <div class="small">
                                                <span class="badge bg-light text-dark">${item.retailer}</span>
                                                <span class="badge bg-light text-dark ms-1">${item.product.category}</span>
                                            </div>
                                        </div>
                                        <div class="col-md-3 col-6 mt-3 mt-md-0">
                                            <div class="input-group input-group-sm">
                                                <button class="btn btn-outline-secondary" type="button"
                                                        onclick="updateCartQuantity('${item.productId}', '${item.retailer}', ${item.quantity - 1})">
                                                    <i class="bi bi-dash"></i>
                                                </button>
                                                <input type="text" class="form-control text-center" 
                                                       value="${item.quantity}" readonly>
                                                <button class="btn btn-outline-secondary" type="button"
                                                        onclick="updateCartQuantity('${item.productId}', '${item.retailer}', ${item.quantity + 1})">
                                                    <i class="bi bi-plus"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="col-md-2 col-3 text-end mt-3 mt-md-0">
                                            <div class="fw-bold">${formatCurrency(price)}</div>
                                            <div class="small text-muted">each</div>
                                        </div>
                                        <div class="col-md-1 col-3 text-end mt-3 mt-md-0">
                                            <div class="h6 fw-bold">${formatCurrency(subtotal)}</div>
                                            <button class="btn btn-link text-danger p-0" 
                                                    onclick="comparisonManager.removeFromCart('${item.productId}', '${item.retailer}')">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="cart-summary card border-0 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title mb-3">Order Summary</h5>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Subtotal</span>
                            <span>${formatCurrency(total)}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Estimated Shipping</span>
                            <span class="text-success">Free</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Tax</span>
                            <span>Calculated at checkout</span>
                        </div>
                        <hr>
                        <div class="d-flex justify-content-between fw-bold fs-5">
                            <span>Total</span>
                            <span>${formatCurrency(total)}</span>
                        </div>
                        
                        <div class="d-grid gap-2 mt-4">
                            <button class="btn btn-primary btn-lg" onclick="checkout()">
                                Proceed to Checkout
                            </button>
                            <a href="products.html" class="btn btn-outline-primary">
                                Continue Shopping
                            </a>
                        </div>
                        
                        <div class="alert alert-light border mt-3">
                            <p class="small mb-0">
                                <i class="bi bi-info-circle me-2"></i>
                                You'll complete your purchase on the retailer's website. Each item in your cart will be purchased separately from its respective retailer.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // Utility Functions
    showNotification(message, type = 'info') {
        // Create toast notification
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
    
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }
    
    exportComparison() {
        // This would typically export to PDF or CSV
        // For now, we'll create a simple text export
        const productManager = new ProductManager();
        const products = this.comparisonItems
            .map(id => productManager.getProductById(id))
            .filter(p => p !== undefined);
        
        let exportText = 'Product Comparison - ValueFinder Hub\n';
        exportText += 'Generated on: ' + new Date().toLocaleDateString() + '\n\n';
        
        products.forEach((product, index) => {
            exportText += `Product ${index + 1}: ${product.name}\n`;
            exportText += `Brand: ${product.brand}\n`;
            exportText += `Price: ${formatCurrency(productManager.getBestProductPrice(product))}\n`;
            exportText += `Rating: ${product.rating}/5 (${product.reviewCount || 0} reviews)\n`;
            exportText += '---\n';
        });
        
        // Create download link
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product-comparison.txt';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Comparison exported successfully', 'success');
    }
}

// Global comparison manager instance
const comparisonManager = new ComparisonManager();

// Global functions for HTML onclick handlers
function addToComparison(productId) {
    return comparisonManager.addToComparison(productId);
}

function removeFromComparison(productId) {
    return comparisonManager.removeFromComparison(productId);
}

function clearComparison() {
    comparisonManager.clearComparison();
}

function addToCart(productId, retailer = 'amazon') {
    return comparisonManager.addToCart(productId, 1, retailer);
}

function removeFromCart(productId, retailer) {
    return comparisonManager.removeFromCart(productId, retailer);
}

function updateCartQuantity(productId, retailer, quantity) {
    return comparisonManager.updateCartItemQuantity(productId, retailer, quantity);
}

function clearCart() {
    comparisonManager.clearCart();
}

function checkout() {
    // In a real implementation, this would redirect to retailer checkout pages
    // For demo purposes, we'll show a message
    comparisonManager.showNotification('You would now be redirected to complete your purchases on the respective retailer websites.', 'info');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // If we're on a comparison page, render it
    if (window.location.pathname.includes('comparison')) {
        const container = document.getElementById('comparisonContainer');
        if (container) {
            container.innerHTML = comparisonManager.renderComparisonView();
        }
    }
    
    // If we're on a cart page, render it
    if (window.location.pathname.includes('cart')) {
        const container = document.getElementById('cartContainer');
        if (container) {
            container.innerHTML = comparisonManager.renderCartView();
        }
    }
});
