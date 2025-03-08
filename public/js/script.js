document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            const productsContainer = document.getElementById('products');
            products.forEach(product => {
                const productElement = document.createElement('div');
                productElement.className = 'product';
                productElement.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p>$${product.price}</p>
                `;
                productsContainer.appendChild(productElement);
            });
        })
        .catch(error => console.error('Error fetching products:', error));
});

// Function to display messages
const showMessage = (message, isError = false) => {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = `<div class="${isError ? 'error' : 'success'}">${message}</div>`;
    setTimeout(() => messagesDiv.innerHTML = '', 3000); // Clear message after 3 seconds
};

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) showMessage(data.error, true);
        else {
            showMessage('Login successful');
            // Redirect or update UI
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Login failed. Please try again.', true);
    });
});

// Register
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) showMessage(data.error, true);
        else showMessage('Registration successful');
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage('Registration failed. Please try again.', true);
    });
});

// Add to Cart
// Add to Cart
const addToCart = (productId, userId) => {
    fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity: 1 })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) alert(data.error);
        else alert('Added to cart');
    })
    .catch(error => console.error('Error:', error));
};

// Display Cart Items
const displayCart = (userId) => {
    fetch(`/api/cart/${userId}`)
        .then(response => response.json())
        .then(items => {
            const cartItems = document.getElementById('cartItems');
            cartItems.innerHTML = items.map(item => `
                <div class="cart-item">
                    <h3>${item.name}</h3>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: $${item.price}</p>
                </div>
            `).join('');
        })
        .catch(error => console.error('Error:', error));
};