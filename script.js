document.addEventListener('DOMContentLoaded', () => {
    // ---------------------- Global Variables ----------------------
    const header = document.querySelector('.header'); // Get header for scroll offset
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    // ---------------------- Hamburger Menu & Dropdown Logic ----------------------
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.dropdown');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when a navigation link (not dropdown) is clicked
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active') && !link.closest('.dropdown')) {
                navLinks.classList.remove('active');
            }
        });
    });

    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');
        dropbtn.addEventListener('click', (e) => {
            e.preventDefault();
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            // Close other dropdowns if open
            dropdowns.forEach(otherDropdown => {
                const otherDropdownContent = otherDropdown.querySelector('.dropdown-content');
                if (otherDropdown !== dropdown && otherDropdownContent && otherDropdownContent.style.display === 'block') {
                    otherDropdownContent.style.display = 'none';
                }
            });
            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Close dropdowns if clicked outside
    window.addEventListener('click', (e) => {
        if (!e.target.matches('.dropbtn') && !e.target.closest('.dropdown-content')) {
            dropdowns.forEach(dropdown => {
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent && dropdownContent.style.display === 'block') {
                    dropdownContent.style.display = 'none';
                }
            });
        }
    });

    // ---------------------- Shopping Cart Logic ----------------------
    const cartCountElement = document.getElementById('cartCount');
    const cartIconLink = document.getElementById('cartIconLink');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const emptyCartMessage = cartItemsContainer.querySelector('.empty-cart-message');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Checkout overlay elements
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
    const checkoutSummaryDetails = document.getElementById('checkoutSummary');
    const checkoutTotalElement = document.getElementById('checkoutTotal');
    const paymentForm = document.getElementById('paymentForm');

    // Helper function to update cart state (count, total, localStorage)
    function updateAndPersistCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        updateCartTotal(); // Also ensure total is always updated
    }

    function updateCartTotal() {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalElement.textContent = total.toFixed(2);
        checkoutTotalElement.textContent = total.toFixed(2); // Update checkout total as well
    }

    function renderCart() {
        cartItemsContainer.innerHTML = ''; // Clear existing items

        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            // Ensure the empty message is actually appended if it's not already
            if (!cartItemsContainer.contains(emptyCartMessage)) {
                cartItemsContainer.appendChild(emptyCartMessage);
            }
            checkoutBtn.disabled = true; // Disable checkout if cart is empty
            checkoutBtn.classList.add('disabled-btn'); // Add a class for styling disabled state
        } else {
            emptyCartMessage.style.display = 'none';
            checkoutBtn.disabled = false; // Enable checkout
            checkoutBtn.classList.remove('disabled-btn'); // Remove disabled styling
            cart.forEach(item => {
                const cartItemDiv = document.createElement('div');
                cartItemDiv.classList.add('cart-item');
                const uniqueId = `${item.id}-${item.priceType || 'default'}`;
                cartItemDiv.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>${item.priceType ? `${item.priceType}: ` : ''}${item.price.toFixed(2)} ريال</p>
                        ${item.platform ? `<p class="item-platform">المنصة: ${item.platform}</p>` : ''} </div>
                    <div class="cart-item-actions">
                        <input type="number" value="${item.quantity}" min="1" data-unique-id="${uniqueId}">
                        <button class="remove-btn" data-unique-id="${uniqueId}">إزالة</button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemDiv);
            });
        }
        updateCartTotal(); // Always update total after rendering
    }

    // Add to Cart for standard products (Digital Cards only now)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const button = e.target;
            const productCard = button.closest('.product-card');
            if (!productCard) return;

            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const productImage = productCard.querySelector('img').src;
            const price = parseFloat(productCard.dataset.productPrice);
            const priceType = ''; // No specific price type for these
            // Get platform text, handle cases where platform-info might not exist
            const platformElement = productCard.querySelector('.platform-info p');
            const platform = platformElement ? platformElement.textContent.replace('المنصة: ', '') : '';

            const uniqueId = `${productId}-default`;

            const existingItemIndex = cart.findIndex(item => `${item.id}-${item.priceType || 'default'}` === uniqueId);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    image: productImage,
                    price: price,
                    priceType: priceType,
                    platform: platform, // Store platform
                    quantity: 1
                });
            }

            updateAndPersistCart();
            alert(`تم إضافة "${productName}" إلى السلة!`);
        }
    });

    // Add to Cart for multi-price products (PlayStation/Xbox/PC games and all Subscriptions)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-multi')) {
            const button = e.target;
            const productCard = button.closest('.product-card');
            if (!productCard) return;

            const productId = productCard.dataset.productId;
            const productName = productCard.dataset.productName;
            const productImage = productCard.querySelector('img').src;
            // Get platform text, handle cases where platform-info might not exist
            const platformElement = productCard.querySelector('.platform-info p');
            const platform = platformElement ? platformElement.textContent.replace('المنصة: ', '') : '';

            const selectedPriceRadio = productCard.querySelector(`input[name="price-${productId}"]:checked`);

            if (!selectedPriceRadio) {
                alert('الرجاء اختيار نوع السعر أولاً.');
                return;
            }

            const price = parseFloat(selectedPriceRadio.value);
            const priceLabel = selectedPriceRadio.dataset.priceLabel; // Use data-price-label for display

            const uniqueId = `${productId}-${priceLabel}`; // Unique ID includes priceLabel

            const existingItemIndex = cart.findIndex(item => `${item.id}-${item.priceType || 'default'}` === uniqueId);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].quantity += 1;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    image: productImage,
                    price: price,
                    priceType: priceLabel, // Store priceLabel as priceType
                    platform: platform, // Store platform
                    quantity: 1
                });
            }

            updateAndPersistCart();
            alert(`تم إضافة "${productName} (${priceLabel})" إلى السلة!`);
        }
    });

    // Open Cart Overlay
    cartIconLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderCart(); // Render cart items every time it's opened
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling body
    });

    // Close Cart Overlay
    closeCartBtn.addEventListener('click', () => {
        cartOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    });

    // Close cart if clicked outside content
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) {
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Handle quantity change in cart
    cartItemsContainer.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
            const uniqueId = e.target.dataset.uniqueId;
            const newQuantity = parseInt(e.target.value);

            const itemToUpdate = cart.find(item => `${item.id}-${item.priceType || 'default'}` === uniqueId);
            
            if (itemToUpdate) { // Ensure item exists
                if (newQuantity >= 1) {
                    itemToUpdate.quantity = newQuantity;
                } else { // If quantity goes below 1, remove item
                    const confirmed = confirm('هل أنت متأكد من رغبتك في إزالة هذا المنتج من السلة؟');
                    if (confirmed) {
                        cart = cart.filter(item => `${item.id}-${item.priceType || 'default'}` !== uniqueId);
                    } else {
                        e.target.value = itemToUpdate.quantity; // Revert to old quantity if not confirmed
                    }
                }
            }
            renderCart(); // Re-render to reflect changes
            updateAndPersistCart();
        }
    });

    // Handle remove button in cart
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const uniqueId = e.target.dataset.uniqueId;
            const confirmed = confirm('هل أنت متأكد من رغبتك في إزالة هذا المنتج من السلة؟');

            if (confirmed) {
                cart = cart.filter(item => `${item.id}-${item.priceType || 'default'}` !== uniqueId);
                renderCart();
                updateAndPersistCart();
            }
        }
    });

    // ---------------------- Checkout Logic ----------------------

    // Open Checkout Overlay
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('سلة التسوق فارغة! لا يمكن إتمام الشراء.');
            return;
        }
        cartOverlay.classList.remove('active'); // Close cart overlay
        populateCheckoutSummary(); // Fill checkout summary
        checkoutOverlay.classList.add('active'); // Open checkout overlay
        document.body.style.overflow = 'hidden';
    });

    // Close Checkout Overlay
    closeCheckoutBtn.addEventListener('click', () => {
        checkoutOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close checkout if clicked outside content
    checkoutOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutOverlay) {
            checkoutOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Function to populate checkout summary
    function populateCheckoutSummary() {
        checkoutSummaryDetails.innerHTML = '<h3>ملخص الطلب</h3>';
        if (cart.length === 0) {
            checkoutSummaryDetails.innerHTML += '<p>سلة التسوق فارغة.</p>';
            return;
        }

        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('checkout-summary-item');
            itemDiv.innerHTML = `
                <p>${item.name} ${item.priceType ? `(${item.priceType})` : ''} x ${item.quantity}</p>
                ${item.platform ? `<p class="item-platform">المنصة: ${item.platform}</p>` : ''} <p class="item-price">${(item.price * item.quantity).toFixed(2)} ريال</p>
            `;
            checkoutSummaryDetails.appendChild(itemDiv);
        });

        const totalRow = document.createElement('div');
        totalRow.classList.add('checkout-summary-item');
        totalRow.innerHTML = `
            <p><strong>الإجمالي الكلي:</strong></p>
            <p class="item-price"><strong>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)} ريال</strong></p>
        `;
        checkoutSummaryDetails.appendChild(totalRow);
    }

    // Handle payment form submission (simulated)
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent actual form submission

        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const notes = document.getElementById('notes').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const totalAmount = parseFloat(checkoutTotalElement.textContent);

        // Basic validation
        if (!fullName || !email || !phoneNumber) {
            alert('الرجاء تعبئة الاسم الكامل، البريد الإلكتروني، ورقم الهاتف.');
            return;
        }
        if (!validateEmail(email)) {
            alert('الرجاء إدخال بريد إلكتروني صحيح.');
            return;
        }
        if (cart.length === 0) { // Double check if cart is empty
            alert('سلة التسوق فارغة! لا يمكن إتمام الشراء.');
            return;
        }

        // Building WhatsApp message
        let whatsappMessage = `مرحباً! أود إتمام طلب شراء من موقعكم.\n`;
        whatsappMessage += `*تفاصيل الطلب:*\n`;
        cart.forEach(item => {
            whatsappMessage += `- ${item.name} ${item.priceType ? `(${item.priceType})` : ''} ${item.platform ? `[المنصة: ${item.platform}]` : ''} x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)} ريال\n`;
        });
        whatsappMessage += `*الإجمالي: ${totalAmount.toFixed(2)} ريال*\n`;
        whatsappMessage += `*طريقة الدفع المختارة:* ${paymentMethod}\n\n`; // ضفنا سطرين فاضيين هنا للفصل

        // إضافة بيانات الدفع بناءً على الطريقة المختارة
        whatsappMessage += `*يرجى تحويل المبلغ إلى البيانات التالية:*\n`;
        if (paymentMethod === 'InstaPay') {
            whatsappMessage += `اسم المستلم: Ahmed Atia\n`;
            whatsappMessage += `رقم الحساب/ID إنستاباي: 01080416547 أو اليوزر ahmedatia2006\n`;
            whatsappMessage += `(بعد التحويل، يرجى إرسال لقطة شاشة لإثبات الدفع.)\n`;
        } else if (paymentMethod === 'ElectronicWallet') {
            whatsappMessage += `رقم المحفظة الإلكترونية (فودافون كاش/اتصالات كاش/اورانج موني): 01080416547\n`;
            whatsappMessage += `(يرجى إرسال رسالة تأكيد التحويل أو لقطة شاشة.)\n`;
        }
        else if (paymentMethod === 'Binance') {
            whatsappMessage += `Binance ID: 796926233\n`;
            whatsappMessage += `(يرجى إرسال لقطة شاشة للتحويل بعد إتمامه على Binance P2P أو تحويل USDT باستخدام الـ ID.)\n`;
        }

        whatsappMessage += `\n*معلومات العميل:*\n`;
        whatsappMessage += `الاسم: ${fullName}\n`;
        whatsappMessage += `البريد الإلكتروني: ${email}\n`;
        whatsappMessage += `رقم الهاتف: ${phoneNumber}\n`;
        if (notes) {
            whatsappMessage += `ملاحظات: ${notes}\n`;
        }
        whatsappMessage += `\nالرجاء إرسال تفاصيل الدفع لإتمام عملية الشراء. شكراً!`;

        // رقم الواتساب الخاص بك
        const whatsappNumber = '201061210922'; // تم التحديث لرقمك

        // إنشاء رابط الواتساب
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

        alert('تم تسجيل طلبك بنجاح! سيتم توجيهك الآن إلى الواتساب لتأكيد الدفع.');

        // Clear cart after successful order (simulation)
        cart = [];
        updateAndPersistCart(); // Use the consolidated function
        renderCart(); // Update cart display to show it's empty
        
        // Close checkout overlay
        checkoutOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Open WhatsApp link in a new tab
        window.open(whatsappLink, '_blank');
    });

    // Basic email validation
    function validateEmail(email) {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    // Initial load of cart count
    updateAndPersistCart(); // Use the consolidated function for initial load

    // ---------------------- "See More" Products Logic within sections ----------------------
    document.querySelectorAll('.see-more-btn, .see-less-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetCategoryId = this.dataset.targetCategory; // This is the ID of the product-category-section
            const targetSection = document.getElementById(targetCategoryId);
            
            if (targetSection) {
                const moreProductItems = targetSection.querySelectorAll('.more-product-item');
                const isSeeMore = this.classList.contains('see-more-btn');
                const seeMoreBtn = this.closest('.more-products-container').querySelector('.see-more-btn');
                const seeLessBtn = this.closest('.more-products-container').querySelector('.see-less-btn');

                if (isSeeMore) {
                    targetSection.classList.add('expanded'); // Add class to show more items
                    moreProductItems.forEach(item => item.style.display = 'flex'); // Ensure they are displayed
                    seeMoreBtn.style.display = 'none';
                    seeLessBtn.style.display = 'inline-block';
                    
                    // Scroll to the top of the expanded section
                    setTimeout(() => {
                        const headerOffset = header.offsetHeight;
                        const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;
                        const offsetPosition = elementPosition - headerOffset - 20;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 50);

                } else {
                    targetSection.classList.remove('expanded'); // Remove class to hide more items
                    moreProductItems.forEach(item => item.style.display = 'none'); // Hide them
                    seeMoreBtn.style.display = 'inline-block';
                    seeLessBtn.style.display = 'none';
                }
            }
        });
    });

    // ---------------------- Smooth Scroll for Navigation ----------------------
    const navLi = document.querySelectorAll('nav .nav-links li a:not(.dropbtn)'); // Select all nav links except dropdown buttons

    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = header.offsetHeight; // Get dynamic header height
                // For main sections, add a bit more offset to show the heading clearly
                let extraOffset = 0;
                if (targetId === '#categories' || targetId === '#products' || targetId === '#how-it-works' || targetId === '#contact') {
                    extraOffset = 20; // Adjust as needed
                }
                
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset - extraOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }

            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
            // Close dropdown if it was open
            dropdowns.forEach(dropdown => {
                const dropdownContent = dropdown.querySelector('.dropdown-content');
                if (dropdownContent && dropdownContent.style.display === 'block') {
                    dropdownContent.style.display = 'none';
                }
            });
        });
    });

    // Highlight active section in navigation
    const sections = document.querySelectorAll('section[id]'); // Only main sections for highlighting nav links

    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const headerHeight = header.offsetHeight; // Get header height dynamically
        const scrollPosition = window.scrollY + headerHeight + 50; // Add some buffer for active state

        sections.forEach(section => {
            const sectionTop = section.offsetTop; 
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLi.forEach(link => {
            link.classList.remove('active'); // Remove active from all
            const linkHref = link.getAttribute('href');

            if (linkHref === `#${currentSectionId}`) {
                link.classList.add('active');
            } 
            // Special handling for the "Products" link to be active if any product category is in view
            // No need to check for specific product sub-categories here, as "products" section itself is the target
            else if (currentSectionId === 'products' && linkHref === '#products') {
                link.classList.add('active');
            }
             // Highlight Categories if any category card is visible or if products is active (since products often follow categories)
             else if (currentSectionId === 'categories' && linkHref === '#categories') {
                link.classList.add('active');
            }
        });

        // Special handling for home section when at the very top of the page
        if (window.scrollY === 0) {
            navLi.forEach(link => {
                link.classList.remove('active');
            });
            const homeLink = document.querySelector('nav a[href="#home"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    });
});