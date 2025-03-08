document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
        return;
    }

    const logoutButton = document.getElementById('logoutButton');
    const cartItemsDiv = document.getElementById('cartItems');
    const totalItemsSpan = document.getElementById('totalItems');
    const totalPriceSpan = document.getElementById('totalPrice');
    const productListDiv = document.getElementById('productList');

    // Fetch Products
    const fetchProducts = () => {
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                productListDiv.innerHTML = products.map(product => `
                    <div class="product">
                        <img src="${product.image_url}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>${product.description}</p>
                        <p>$${product.price}</p>
                        <button class="addToCartButton" data-product-id="${product.id}">Add to Cart</button>
                    </div>
                `).join('');

                // Add event listeners to "Add to Cart" buttons
                document.querySelectorAll('.addToCartButton').forEach(button => {
                    button.addEventListener('click', () => {
                        const productId = button.getAttribute('data-product-id');
                        addToCart(productId);
                    });
                });
            })
            .catch(error => console.error('Error fetching products:', error));
    };

    // Fetch Cart
    const fetchCart = () => {
        fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(cartItems => {
            cartItemsDiv.innerHTML = cartItems.map(item => `
                <div class="cart-item">
                    <h3>${item.name}</h3>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: $${item.price}</p>
                    <button class="removeFromCartButton" data-cart-id="${item.cartId}">Remove</button>
                </div>
            `).join('');

            // Add event listeners to "Remove" buttons
            document.querySelectorAll('.removeFromCartButton').forEach(button => {
                button.addEventListener('click', () => {
                    const cartId = button.getAttribute('data-cart-id');
                    if (!cartId) {
                        console.error('Cart ID is undefined');
                        alert('Failed to remove item: Cart ID is missing.');
                        return;
                    }
                    removeFromCart(cartId);
                });
            });

            // Update Cart Summary
            updateCartSummary(cartItems);
        })
        .catch(error => console.error('Error fetching cart:', error));
    };

    // Add to Cart
    const addToCart = (productId) => {
        fetch('/api/cart', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) alert(data.error);
            else {
                alert('Added to cart');
                fetchCart(); // Refresh cart
            }
        })
        .catch(error => console.error('Error:', error));
    };

    // Remove from Cart
    const removeFromCart = (cartId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You are not logged in. Please login to manage your cart.');
            window.location.href = 'login.html';
            return;
        }
    
        if (!cartId || isNaN(cartId)) {
            alert('Invalid cart ID. Please try again.');
            return;
        }
    
        fetch(`/api/cart/${cartId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error); // Show error message
                if (data.error === 'Invalid token') {
                    localStorage.removeItem('token'); // Clear invalid token
                    window.location.href = 'login.html'; // Redirect to login
                }
            } else {
                alert('Item removed from cart');
                fetchCart(); // Refresh cart
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to remove item. Please try again.');
        });
    };

    // Update Cart Summary
    const updateCartSummary = (cartItems) => {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

        totalItemsSpan.textContent = totalItems;
        totalPriceSpan.textContent = totalPrice;
    };

    // Logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token'); // Clear token
        window.location.href = 'login.html'; // Redirect to login page
    });

    // Initial Fetch
    fetchProducts();
    fetchCart();
});