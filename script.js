/* ==========================================================================
   ZARIA FULL-STACK MASTER ENGINE - PRODUCTION GRADE (FROM A TO Z)
   ========================================================================== */

let dbInventory = []; 
let userCart = JSON.parse(localStorage.getItem('zaria_cart')) || [];
let userWishlist = JSON.parse(localStorage.getItem('zaria_wishlist')) || [];
let authenticatedUser = JSON.parse(localStorage.getItem('zaria_auth_user')) || null;
let simulatedOrderPayload = null; 

// Check for persistent session on page load
const storedUser = localStorage.getItem('zaria_auth_user');
if (storedUser) {
    authenticatedUser = JSON.parse(storedUser);
}

const userId = localStorage.getItem('zaria_uid') || Math.random().toString(36).substr(2, 9);
localStorage.setItem('zaria_uid', userId);

document.addEventListener("DOMContentLoaded", async () => {
    updateGlobalHeaderCounts();
    
    // 1. DUAL CHANNEL DATABASE ENGINE INITIALIZATION & SYNC
    try {
        const [prodRes, wishRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'get' })
            })
        ]);
        
        if (prodRes.ok) dbInventory = await prodRes.json();
        if (wishRes.ok) {
            const wishData = await wishRes.json();
            userWishlist = wishData.list || [];
            localStorage.setItem('zaria_wishlist', JSON.stringify(userWishlist));
        }
    } catch (error) {
        console.error("Failed to sync structural dependencies with ZARIA core database:", error);
    }

    // 2. DYNAMIC APPLICATION ROUTING CONTROL
    if (document.getElementById("dynamic-shop-container")) renderShop();
    if (document.getElementById("dynamic-cart-grid")) renderCart();
    if (document.getElementById("dynamic-wishlist-grid")) renderWishlist();
    
    // Auth & Checkout Routing Interceptors
    if (document.getElementById("zaria-login-form")) initAuthInterface();
    if (document.getElementById("zaria-shipping-form")) initCheckoutInterface();
    
    initScrollReveal();
    initContactForm();
});

/* ==========================================================================
   ROBUST GLOBAL HEADER SYNC ENGINE
   ========================================================================== */
window.updateGlobalHeaderCounts = function() {
    const totalItems = userCart.reduce((sum, item) => sum + item.quantity, 0);
    const countDisplay = totalItems < 10 ? `0${totalItems}` : totalItems;
    const counters = document.querySelectorAll('.cart-header-count');
    if (counters.length > 0) {
        counters.forEach(span => {
            span.innerText = countDisplay;
        });
    }
};

/* ==========================================================================
   DYNAMIC SHOP RENDERER (Pulls from MongoDB)
   ========================================================================== */
window.renderShop = function() {
    const shopContainer = document.getElementById("dynamic-shop-container");
    const dotsContainer = document.getElementById("shop-dots-nav");
    if (!shopContainer) return;

    shopContainer.innerHTML = "";
    dotsContainer.innerHTML = "";

    dbInventory.forEach((item, index) => {
        const isActive = index === 0 ? "active-snap-view" : "";
        const isDotActive = index === 0 ? "active" : "";
        
        dotsContainer.innerHTML += `<div class="dot-indicator ${isDotActive}" data-target="${index}"><span class="dot-label">${item.title}</span></div>`;

        const sectionHTML = `
            <section class="technical-product-section ${isActive}">
                <div class="showcase-split-matrix">
                    <div class="tech-specifications-column animate-reveal-left">
                        <span class="spec-edition-tag">// ${item.meta.toUpperCase()}</span>
                        <ul class="luxury-tech-list">
                            <li>Bespoke luxury velvet inner lining</li>
                            <li>Hand-dyed 25mm double-faced silk ribbon</li>
                            <li>Signature hand-poured custom ZARIA wax emblem seal</li>
                        </ul>
                        <div class="showcase-action-block">
                            <h2 class="showcase-product-title">${item.title}</h2>
                            <div class="price-bag-row">
                                <span class="showcase-price">₹${item.price}.00</span>
                                <div class="wishlist-action-group">
                                    <button class="nike-add-bag-btn" onclick="addToBag(${item.id})">Add To Bag</button>
                                    <button class="wishlist-remove-btn ${userWishlist.includes(item.id) ? 'in-wishlist' : ''}" style="font-size: 1rem; margin-left: 1rem;" onclick="toggleWishlist(${item.id}, this)" title="Add to Wishlist">♥</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tech-visual-centerpiece-column animate-reveal-right">
                        <div class="centerpiece-frame-wrapper">
                            <img src="${item.img}" alt="${item.title}" class="centerpiece-showcase-img" loading="lazy" decoding="async">
                            <div class="centerpiece-lighting-glow"></div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        shopContainer.innerHTML += sectionHTML;
    });

    initShopScroll();
};

/* ==========================================================================
   PREMIUM NOTIFICATION ENGINE
   ========================================================================== */
window.showPremiumAlert = function(message) {
    let container = document.getElementById('zaria-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'zaria-toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'zaria-toast';
    toast.innerHTML = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500); 
    }, 3500);
};

/* ==========================================================================
   CORE E-COMMERCE FUNCTIONS (Persistent Database Logic)
   ========================================================================== */
window.addToBag = function(productId) {
    const existingItem = userCart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        userCart.push({ id: productId, quantity: 1 });
    }
    localStorage.setItem('zaria_cart', JSON.stringify(userCart));
    updateGlobalHeaderCounts();
    showPremiumAlert("Suite securely added to your bag.");
    if (document.getElementById("dynamic-cart-grid")) renderCart();
};

window.toggleWishlist = async function(productId, btnEl) {
    const action = userWishlist.includes(productId) ? 'remove' : 'add';
    const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, action })
    });
    const data = await res.json();
    if(data.success) {
        userWishlist = data.list;
        localStorage.setItem('zaria_wishlist', JSON.stringify(userWishlist));
        showPremiumAlert(action === 'add' ? "Suite added to your private curation." : "Removed from curation portfolio.");
        if (btnEl) btnEl.classList.toggle('in-wishlist');
        if (document.getElementById("dynamic-wishlist-grid")) renderWishlist();
    }
};

window.initiateCheckout = function() {
    if(userCart.length === 0) {
        showPremiumAlert("Your dynamic collection portfolio is currently empty.");
        return;
    }
    
    // Check global variable which is now synced with localStorage
    if (!authenticatedUser) {
        showPremiumAlert("Identity clearance required.");
        setTimeout(() => { window.location.href = "auth.html"; }, 1500);
        return;
    }
    window.location.href = "checkout.html";
};

/* ==========================================================================
   AUTHENTICATION CAPABILITY MODULE ENGINE
   ========================================================================== */
window.toggleAuthState = function(showRegister) {
    const loginBox = document.getElementById("login-box");
    const registerBox = document.getElementById("register-box");
    if(showRegister) {
        loginBox.style.display = "none";
        registerBox.style.display = "block";
    } else {
        loginBox.style.display = "block";
        registerBox.style.display = "none";
    }
};

function initAuthInterface() {
    const loginForm = document.getElementById("zaria-login-form");
    const registerForm = document.getElementById("zaria-register-form");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById("login-email").value,
            password: document.getElementById("login-password").value
        };

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.success) {
            localStorage.setItem('zaria_auth_user', JSON.stringify(data.user));
            authenticatedUser = data.user;
            showPremiumAlert(`Identity cleared. Welcome back, ${data.user.name}.`);
            setTimeout(() => { window.location.href = "cart.html"; }, 1500);
        } else {
            showPremiumAlert(`Clearance Error: ${data.error}`);
        }
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("register-name").value,
            email: document.getElementById("register-email").value,
            password: document.getElementById("register-password").value
        };

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if(data.success) {
            showPremiumAlert("Account registered securely. Please log in.");
            toggleAuthState(false);
        } else {
            showPremiumAlert(`Registration Failed: ${data.error}`);
        }
    });
}

/* ==========================================================================
   CHECKOUT INTERFACE LOGIC MODULE
   ========================================================================== */
function initCheckoutInterface() {
    const shippingForm = document.getElementById("zaria-shipping-form");
    
    // Auto populate details from auth user index trace if found
    if(authenticatedUser) {
        document.getElementById("chk-name").value = authenticatedUser.name || "";
        document.getElementById("chk-email").value = authenticatedUser.email || "";
    }

    shippingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Construct transaction format requirements exactly as requested: name-dev item-curated box address-xyz ph number- 00000000
        const itemsString = userCart.map(cartItem => {
            const prod = dbInventory.find(p => p.id === cartItem.id);
            return prod ? `${prod.title} (Qty: ${cartItem.quantity})` : `Item ID: ${cartItem.id}`;
        }).join(', ');

        simulatedOrderPayload = {
            clientName: document.getElementById("chk-name").value,
            clientEmail: document.getElementById("chk-email").value,
            clientPhone: document.getElementById("chk-phone").value,
            clientAddress: document.getElementById("chk-address").value,
            itemsSummary: `name-${document.getElementById("chk-name").value} item-${itemsString} address-${document.getElementById("chk-address").value} ph number- ${document.getElementById("chk-phone").value}`,
            items: userCart,
            totalAmount: userCart.reduce((sum, item) => {
                const p = dbInventory.find(i => i.id === item.id);
                return sum + (p ? (p.price * item.quantity) : 0);
            }, 0)
        };

        // Transition layout matrix UI toward Payment selection plate
        document.getElementById("shipping-details-plate").style.display = "none";
        document.getElementById("payment-gateway-plate").style.display = "block";
        showPremiumAlert("Delivery target verified. Ready for checkout payment panel.");
    });
}

window.executeFinalOrderPayment = async function() {
    if(!simulatedOrderPayload) return;

    showPremiumAlert("Transmitting dynamic transaction details to vault...");

    const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulatedOrderPayload)
    });
    
    const result = await res.json();
    if(result.success) {
        showPremiumAlert(`Order Secured via COD! Track ID: ${result.orderId}`);
        userCart = [];
        localStorage.setItem('zaria_cart', JSON.stringify(userCart));
        simulatedOrderPayload = null;
        setTimeout(() => { window.location.href = "index.html"; }, 3000);
    } else {
        showPremiumAlert("Transaction dispatch pipeline failure. Retry.");
    }
};

/* ==========================================================================
   CART RENDERER
   ========================================================================== */
window.renderCart = function() {
    const cartGrid = document.getElementById("dynamic-cart-grid");
    const cartLayout = document.getElementById("cart-layout-container");
    const cartEmptyNotice = document.getElementById("cart-empty-notice");
    const subtotalEl = document.getElementById("summary-subtotal");
    const totalEl = document.getElementById("summary-total");

    if (!cartGrid) return; 
    cartGrid.innerHTML = "";
    
    if (userCart.length === 0) {
        if (cartLayout) cartLayout.style.display = "none";
        if (cartEmptyNotice) cartEmptyNotice.style.display = "flex";
        return;
    }

    if (cartEmptyNotice) cartEmptyNotice.style.display = "none";
    if (cartLayout) cartLayout.style.display = "grid";

    let runningTotal = 0;

    userCart.forEach((cartItem, index) => {
        const productData = dbInventory.find(p => p.id === cartItem.id);
        if (!productData) return;

        runningTotal += (productData.price * cartItem.quantity);
        const delay = index * 0.15;

        const rowHTML = `
            <div class="cart-item-row" data-id="${productData.id}" style="animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards; opacity: 0;">
                <div class="cart-item-image-box">
                    <img src="${productData.img}" alt="${productData.title}" class="cart-item-img" loading="lazy" decoding="async">
                </div>
                <div class="cart-item-details">
                    <h2 class="cart-item-title">${productData.title}</h2>
                    <span class="cart-item-meta">${productData.meta}</span>
                    <div class="cart-quantity-controls">
                        <button class="qty-btn" onclick="updateQuantity(${productData.id}, -1)">−</button>
                        <span class="qty-display">${cartItem.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${productData.id}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">₹${productData.price}.00</span>
                    <button class="cart-remove-btn" onclick="removeCartItem(${productData.id})">Remove</button>
                </div>
            </div>
        `;
        cartGrid.innerHTML += rowHTML;
    });

    // Change single quotes to backticks for these lines:
        if (subtotalEl) subtotalEl.innerText = `₹${runningTotal}.00`;
        if (totalEl) totalEl.innerText = `₹${runningTotal}.00`;
};

window.updateQuantity = function(id, change) {
    const item = userCart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            window.removeCartItem(id);
        } else {
            localStorage.setItem('zaria_cart', JSON.stringify(userCart));
            renderCart();
            updateGlobalHeaderCounts();
        }
    }
};

window.removeCartItem = function(id) {
    const targetedRow = document.querySelector(`.cart-item-row[data-id="${id}"]`);
    if (targetedRow) {
        targetedRow.style.transition = "all 0.5s ease";
        targetedRow.style.opacity = "0";
        targetedRow.style.transform = "translateX(-50px)";
        setTimeout(() => {
            userCart = userCart.filter(item => item.id !== id);
            localStorage.setItem('zaria_cart', JSON.stringify(userCart));
            renderCart();
            updateGlobalHeaderCounts();
        }, 400);
    } else {
        userCart = userCart.filter(item => item.id !== id);
        localStorage.setItem('zaria_cart', JSON.stringify(userCart));
        renderCart();
        updateGlobalHeaderCounts();
    }
};

/* ==========================================================================
   WISHLIST RENDERER
   ========================================================================== */
window.renderWishlist = function() {
    const gridContainer = document.getElementById("dynamic-wishlist-grid");
    const emptyNotice = document.getElementById("empty-state-notice");
    if (!gridContainer) return;
    
    gridContainer.innerHTML = "";

    if (userWishlist.length === 0) {
        gridContainer.style.display = "none";
        if (emptyNotice) emptyNotice.style.display = "flex";
        return;
    }

    if (emptyNotice) emptyNotice.style.display = "none";
    gridContainer.style.display = "grid";

    userWishlist.forEach((wishId, index) => {
        const item = dbInventory.find(p => p.id === wishId);
        if(!item) return;

        const delay = index * 0.15; 
        const cardHTML = `
            <article class="wishlist-luxury-card" data-id="${item.id}" style="animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards; opacity: 0;">
                <div class="wishlist-visual-box">
                    <img src="${item.img}" alt="${item.title}" class="wishlist-img-element" loading="lazy" decoding="async">
                    <button class="wishlist-remove-trigger" onclick="removeWishlistItem(${item.id})">×</button>
                </div>
                <div class="wishlist-details-row">
                    <h2 class="wishlist-item-title">${item.title}</h2>
                    <span class="wishlist-item-price">₹${item.price}.00</span>
                </div>
                <button class="nike-add-bag-btn" style="width: 100%; transform: translateZ(30px);" onclick="addToBag(${item.id})">Move To Bag</button>
            </article>
        `;
        gridContainer.innerHTML += cardHTML;
    });
    
    init3DHoverPhysics();
};

window.removeWishlistItem = async function(id) {
    const targetedCard = document.querySelector(`.wishlist-luxury-card[data-id="${id}"]`);
    if (targetedCard) {
        targetedCard.style.transition = "all 0.5s ease";
        targetedCard.style.opacity = "0";
        targetedCard.style.transform = "scale(0.8) rotateX(-20deg)";
    }
    
    const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId: id, action: 'remove' })
    });
    const data = await res.json();
    if(data.success) {
        userWishlist = data.list;
        localStorage.setItem('zaria_wishlist', JSON.stringify(userWishlist));
        setTimeout(renderWishlist, 400);
        updateGlobalHeaderCounts();
    }
};

/* ==========================================================================
   PHYSICS & INTERACTION LOGIC ARCHITECTURE
   ========================================================================== */
function init3DHoverPhysics() {
    const cards = document.querySelectorAll('.wishlist-luxury-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;

            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.borderColor = "rgba(201, 160, 84, 0.4)";
            card.style.boxShadow = `0 35px 70px rgba(0,0,0,0.8), ${-rotateY}px ${rotateX}px 20px rgba(201, 160, 84, 0.1)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = "transform 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease";
            card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.borderColor = "rgba(255, 255, 255, 0.08)";
            card.style.boxShadow = "0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
            setTimeout(() => { card.style.transition = "transform 0.1s"; }, 600);
        });
    });
}

function initShopScroll() {
    const sections = document.querySelectorAll(".technical-product-section");
    const dots = document.querySelectorAll(".dot-indicator");
    const container = document.querySelector(".showcase-scroll-container");

    if (!container || sections.length === 0) return;

    const observerOptions = { root: container, threshold: 0.5 };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                sections.forEach(s => s.classList.remove("active-snap-view"));
                dots.forEach(d => d.classList.remove("active"));
                
                entry.target.classList.add("active-snap-view");
                const index = Array.from(sections).indexOf(entry.target);
                if(dots[index]) dots[index].classList.add("active");
            }
        });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            const targetIndex = parseInt(dot.getAttribute("data-target"));
            if(sections[targetIndex]) {
                sections[targetIndex].scrollIntoView({ behavior: "smooth" });
            }
        });
    });
}

function initScrollReveal() {
    const revealTargets = document.querySelectorAll(".scroll-reveal-target");
    if (revealTargets.length === 0) return;

    const revealOptions = { threshold: 0.2, rootMargin: "0px 0px -50px 0px" };

    const editorialObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealTargets.forEach(target => editorialObserver.observe(target));
}

function initContactForm() {
    const conciergeForm = document.getElementById("zaria-concierge-form");
    if (conciergeForm) {
        conciergeForm.addEventListener("submit", async function(event) {
            event.preventDefault(); 
            const payload = {
                clientName: document.getElementById("client-name").value,
                clientEmail: document.getElementById("client-email").value,
                inquiryType: document.getElementById("inquiry-type").value,
                message: document.getElementById("client-message").value
            };
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if(data.success) {
                    showPremiumAlert(`Thank you, ${payload.clientName}. Your inquiry has been saved.`);
                    conciergeForm.reset();
                } else {
                    showPremiumAlert("Error: Secure transmission failed. Please try again.");
                }
            } catch (error) {
                console.error("Transmission Error:", error);
                showPremiumAlert("Network error. Could not connect to ZARIA servers.");
            }
        });
    }
}