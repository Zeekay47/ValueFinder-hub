// Core Configuration
const CONFIG = {
    siteName: 'ValueFinder Hub',
    currency: '$',
    maxCompareItems: 4,
    affiliateDisclosure: 'As an Amazon Associate and affiliate of other retailers, we earn from qualifying purchases.',
    retailerLogos: {
        amazon: '<i class="bi bi-amazon text-warning"></i>',
        walmart: '<i class="bi bi-shop text-primary"></i>',
        target: '<i class="bi bi-bullseye text-danger"></i>',
        bestbuy: '<i class="bi bi-gear text-info"></i>',
        ebay: '<i class="bi bi-cart text-secondary"></i>'
    }
};

// Initialize localStorage if empty
function initStorage() {
    if (!localStorage.getItem('products')) {
        // Load default products from JSON file
        fetch('data/products.json')
            .then(response => response.json())
            .then(products => {
                localStorage.setItem('products', JSON.stringify(products));
            })
            .catch(() => {
                // Fallback to empty array
                localStorage.setItem('products', JSON.stringify([]));
            });
    }
    
    if (!localStorage.getItem('categories')) {
        fetch('data/categories.json')
            .then(response => response.json())
            .then(categories => {
                localStorage.setItem('categories', JSON.stringify(categories));
            })
            .catch(() => {
                localStorage.setItem('categories', JSON.stringify([]));
            });
    }
    
    if (!localStorage.getItem('userData')) {
        localStorage.setItem('userData', JSON.stringify({
            comparisonList: [],
            priceAlerts: [],
            savedProducts: []
        }));
    }
}

// Format currency
function formatCurrency(amount) {
    return CONFIG.currency + amount.toFixed(2);
}

// Calculate price savings
function calculateSavings(originalPrice, salePrice) {
    if (!originalPrice || !salePrice) return null;
    const savings = originalPrice - salePrice;
    const percentage = ((savings / originalPrice) * 100).toFixed(0);
    return {
        amount: savings,
        percentage: percentage
    };
}

// Generate star rating HTML
function generateStarRating(rating, reviewCount = null) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="bi bi-star-fill text-warning"></i>';
    }
    if (halfStar) {
        stars += '<i class="bi bi-star-half text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="bi bi-star text-warning"></i>';
    }
    
    if (reviewCount !== null) {
        stars += `<small class="ms-2 text-muted">(${reviewCount})</small>`;
    }
    
    return stars;
}

// Get best price from retailers
function getBestPrice(retailers) {
    if (!retailers || retailers.length === 0) return null;
    
    return retailers.reduce((best, current) => {
        if (!best || current.price < best.price) return current;
        return best;
    });
}

// Product comparison functions
function addToComparison(productId) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.comparisonList) userData.comparisonList = [];
    
    if (userData.comparisonList.length >= CONFIG.maxCompareItems) {
        showToast('Maximum of 4 products can be compared', 'warning');
        return false;
    }
    
    if (!userData.comparisonList.includes(productId)) {
        userData.comparisonList.push(productId);
        localStorage.setItem('userData', JSON.stringify(userData));
        updateComparisonBadge();
        showToast('Product added to comparison', 'success');
        return true;
    }
    
    return false;
}

function updateComparisonBadge() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const count = userData.comparisonList?.length || 0;
    document.querySelectorAll('.comparison-badge').forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

// Toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    
    const toastHtml = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toast.innerHTML = toastHtml;
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

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initStorage();
    updateComparisonBadge();
    
    // Add affiliate disclosure to product pages
    if (document.querySelector('.product-container')) {
        const disclosure = document.createElement('div');
        disclosure.className = 'affiliate-disclosure alert alert-light border mt-4';
        disclosure.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-info-circle text-primary me-3 fs-5"></i>
                <div>
                    <small class="fw-semibold">Affiliate Disclosure</small>
                    <p class="mb-0 small">${CONFIG.affiliateDisclosure}</p>
                </div>
            </div>
        `;
        document.querySelector('.product-container').appendChild(disclosure);
    }
    
    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Utility function to get URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    });
    
    return params;
}

// Value propositions rotation
function initValuePropsRotation() {
    const props = document.querySelectorAll('.value-prop');
    if (props.length === 0) return;
    
    let current = 0;
    props[0].classList.add('active');
    
    setInterval(() => {
        props[current].classList.remove('active');
        current = (current + 1) % props.length;
        props[current].classList.add('active');
    }, 5000);
}

// Deal countdown timer
function startDealCountdown() {
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    
    if (!hoursEl || !minutesEl || !secondsEl) return;
    
    // Set deal to end in 24 hours
    let totalSeconds = 24 * 60 * 60;
    
    const updateCountdown = () => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
        
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
        } else {
            totalSeconds--;
        }
    };
    
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);
}