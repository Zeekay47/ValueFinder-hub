// Admin Product Management Interface
class ProductAdmin {
    constructor() {
        this.productManager = new ProductManager();
        this.initAdminPanel();
    }
    
    initAdminPanel() {
        // Password protection for admin panel
        const adminPassword = localStorage.getItem('adminPassword') || 'admin123';
        
        if (!window.location.hash.includes('#admin')) {
            const password = prompt('Enter admin password:');
            if (password !== adminPassword) {
                alert('Invalid password');
                window.location.href = 'index.html';
                return;
            }
            localStorage.setItem('adminPassword', password);
        }
        
        this.loadAdminUI();
    }
    
    loadAdminUI() {
        document.body.innerHTML = `
            <nav class="navbar navbar-dark bg-dark">
                <div class="container">
                    <span class="navbar-brand">ValueFinder Admin</span>
                    <button class="btn btn-outline-light" onclick="location.href='index.html'">
                        Back to Site
                    </button>
                </div>
            </nav>
            
            <div class="container-fluid mt-4">
                <div class="row">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">Admin Panel</h5>
                                <div class="list-group">
                                    <button class="list-group-item list-group-item-action active" onclick="admin.showTab('products')">
                                        Manage Products
                                    </button>
                                    <button class="list-group-item list-group-item-action" onclick="admin.showTab('add')">
                                        Add New Product
                                    </button>
                                    <button class="list-group-item list-group-item-action" onclick="admin.showTab('categories')">
                                        Manage Categories
                                    </button>
                                    <button class="list-group-item list-group-item-action" onclick="admin.showTab('analytics')">
                                        Analytics
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mt-4">
                            <div class="card-body">
                                <h6>Quick Stats</h6>
                                <p class="mb-1">Total Products: <span id="totalProducts">0</span></p>
                                <p class="mb-1">Total Views: <span id="totalViews">0</span></p>
                                <p class="mb-1">Best Sellers: <span id="bestSellers">0</span></p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-9">
                        <div id="adminContent">
                            <!-- Content loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.showTab('products');
        this.updateStats();
    }
    
    showTab(tabName) {
        const content = document.getElementById('adminContent');
        
        switch(tabName) {
            case 'products':
                content.innerHTML = this.getProductsTab();
                this.loadProductsTable();
                break;
            case 'add':
                content.innerHTML = this.getAddProductTab();
                this.initAddProductForm();
                break;
            case 'categories':
                content.innerHTML = this.getCategoriesTab();
                this.loadCategoriesTable();
                break;
            case 'analytics':
                content.innerHTML = this.getAnalyticsTab();
                this.loadAnalytics();
                break;
        }
        
        // Update active tab
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`button[onclick="admin.showTab('${tabName}')"]`).classList.add('active');
    }
    
    getProductsTab() {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Manage Products</h5>
                    <button class="btn btn-primary btn-sm" onclick="admin.showTab('add')">
                        <i class="bi bi-plus"></i> Add Product
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover" id="productsTable">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Views</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Products loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    loadProductsTable() {
        const tbody = document.querySelector('#productsTable tbody');
        const products = this.productManager.getAllProducts();
        
        tbody.innerHTML = products.map(product => {
            const bestPrice = this.productManager.getBestProductPrice(product);
            
            return `
                <tr>
                    <td>${product.id}</td>
                    <td>
                        <img src="${product.image}" style="width: 50px; height: 50px; object-fit: cover;">
                    </td>
                    <td>
                        <strong>${product.name}</strong><br>
                        <small class="text-muted">${product.brand}</small>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark">${product.category}</span>
                    </td>
                    <td>${formatCurrency(bestPrice)}</td>
                    <td>${product.views || 0}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="admin.editProduct('${product.id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="admin.deleteProduct('${product.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    getAddProductTab() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Add New Product</h5>
                </div>
                <div class="card-body">
                    <form id="addProductForm">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Product Name</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Brand</label>
                                    <input type="text" class="form-control" name="brand" required>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Category</label>
                                    <select class="form-select" name="category" required>
                                        <option value="">Select Category</option>
                                        ${this.productManager.categories.map(cat => 
                                            `<option value="${cat.id}">${cat.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Subcategory</label>
                                    <input type="text" class="form-control" name="subcategory">
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" name="description" rows="3" required></textarea>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Main Image URL</label>
                                    <input type="url" class="form-control" name="image" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Additional Images (comma separated)</label>
                                    <input type="text" class="form-control" name="additionalImages">
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Features (one per line)</label>
                            <textarea class="form-control" name="features" rows="3"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Rating (0-5)</label>
                            <input type="number" class="form-control" name="rating" min="0" max="5" step="0.1">
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="isBestSeller">
                                    <label class="form-check-label">Best Seller</label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="isNew">
                                    <label class="form-check-label">New Product</label>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <h5>Retailer Information</h5>
                        <div id="retailerForms">
                            <div class="retailer-form border p-3 mb-3">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Retailer Name</label>
                                            <select class="form-select" name="retailers[0][name]">
                                                <option value="Amazon">Amazon</option>
                                                <option value="Walmart">Walmart</option>
                                                <option value="Target">Target</option>
                                                <option value="Best Buy">Best Buy</option>
                                                <option value="eBay">eBay</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Price ($)</label>
                                            <input type="number" class="form-control" name="retailers[0][price]" step="0.01">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Original Price ($)</label>
                                            <input type="number" class="form-control" name="retailers[0][originalPrice]" step="0.01">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Affiliate URL</label>
                                            <input type="url" class="form-control" name="retailers[0][affiliateUrl]">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check mt-4">
                                            <input class="form-check-input" type="checkbox" name="retailers[0][inStock]" checked>
                                            <label class="form-check-label">In Stock</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button type="button" class="btn btn-outline-secondary mb-3" onclick="admin.addRetailerForm()">
                            <i class="bi bi-plus"></i> Add Another Retailer
                        </button>
                        
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary btn-lg">Add Product</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
    
    initAddProductForm() {
        const form = document.getElementById('addProductForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct(new FormData(form));
        });
    }
    
    addRetailerForm() {
        const container = document.getElementById('retailerForms');
        const count = container.children.length;
        
        const form = document.createElement('div');
        form.className = 'retailer-form border p-3 mb-3';
        form.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Retailer Name</label>
                        <select class="form-select" name="retailers[${count}][name]">
                            <option value="Amazon">Amazon</option>
                            <option value="Walmart">Walmart</option>
                            <option value="Target">Target</option>
                            <option value="Best Buy">Best Buy</option>
                            <option value="eBay">eBay</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Price ($)</label>
                        <input type="number" class="form-control" name="retailers[${count}][price]" step="0.01">
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="mb-3">
                        <label class="form-label">Original Price ($)</label>
                        <input type="number" class="form-control" name="retailers[${count}][originalPrice]" step="0.01">
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Affiliate URL</label>
                        <input type="url" class="form-control" name="retailers[${count}][affiliateUrl]">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-check mt-4">
                        <input class="form-check-input" type="checkbox" name="retailers[${count}][inStock]" checked>
                        <label class="form-check-label">In Stock</label>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">
                Remove Retailer
            </button>
        `;
        
        container.appendChild(form);
    }
    
    saveProduct(formData) {
        const product = {
            name: formData.get('name'),
            brand: formData.get('brand'),
            category: formData.get('category'),
            subcategory: formData.get('subcategory'),
            description: formData.get('description'),
            image: formData.get('image'),
            rating: parseFloat(formData.get('rating')) || 4.0,
            isBestSeller: formData.get('isBestSeller') === 'on',
            isNew: formData.get('isNew') === 'on',
            features: formData.get('features') ? formData.get('features').split('\n').filter(f => f.trim()) : [],
            retailers: []
        };
        
        // Process retailer data
        for (let i = 0; formData.get(`retailers[${i}][name]`); i++) {
            const retailer = {
                name: formData.get(`retailers[${i}][name]`),
                price: parseFloat(formData.get(`retailers[${i}][price]`)) || 0,
                originalPrice: parseFloat(formData.get(`retailers[${i}][originalPrice]`)) || null,
                affiliateUrl: formData.get(`retailers[${i}][affiliateUrl]`),
                inStock: formData.get(`retailers[${i}][inStock]`) === 'on'
            };
            
            if (retailer.name && retailer.affiliateUrl) {
                product.retailers.push(retailer);
            }
        }
        
        // Add additional images
        const additionalImages = formData.get('additionalImages');
        if (additionalImages) {
            product.additionalImages = additionalImages.split(',').map(url => url.trim());
        }
        
        this.productManager.addProduct(product);
        alert('Product added successfully!');
        this.showTab('products');
    }
    
    editProduct(productId) {
        const product = this.productManager.getProductById(productId);
        if (!product) return;
        
        // Pre-fill form and switch to add tab
        this.showTab('add');
        
        setTimeout(() => {
            const form = document.getElementById('addProductForm');
            form.querySelector('[name="name"]').value = product.name;
            form.querySelector('[name="brand"]').value = product.brand;
            form.querySelector('[name="category"]').value = product.category;
            form.querySelector('[name="subcategory"]').value = product.subcategory || '';
            form.querySelector('[name="description"]').value = product.description || '';
            form.querySelector('[name="image"]').value = product.image;
            
            // Add retailer forms
            product.retailers.forEach((retailer, index) => {
                if (index > 0) this.addRetailerForm();
            });
        }, 100);
    }
    
    deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            const products = this.productManager.getAllProducts();
            const filtered = products.filter(p => p.id != productId);
            localStorage.setItem('products', JSON.stringify(filtered));
            this.loadProductsTable();
            this.updateStats();
        }
    }
    
    updateStats() {
        const products = this.productManager.getAllProducts();
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalViews').textContent = products.reduce((sum, p) => sum + (p.views || 0), 0);
        document.getElementById('bestSellers').textContent = products.filter(p => p.isBestSeller).length;
    }
}

// Initialize admin panel when admin.html is loaded
if (window.location.pathname.includes('admin.html') || window.location.hash.includes('#admin')) {
    const admin = new ProductAdmin();
    window.admin = admin;
}