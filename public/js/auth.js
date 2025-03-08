document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const messagesDiv = document.getElementById('messages');

    const showMessage = (message, isError = false) => {
        messagesDiv.innerHTML = `<div class="${isError ? 'error' : 'success'}">${message}</div>`;
        setTimeout(() => messagesDiv.innerHTML = '', 3000); // Clear message after 3 seconds
    };

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
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
                    localStorage.setItem('token', data.token); // Store JWT token
                    window.location.href = 'products.html'; // Redirect to products page
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Login failed. Please try again.', true);
            });
        });
    }

    // Register
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
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
                else showMessage('Registration successful. Please check your email for verification.');
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Registration failed. Please try again.', true);
            });
        });
    }

    // Forgot Password
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotPasswordEmail').value;

            fetch('/api/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) showMessage(data.error, true);
                else showMessage('Password reset email sent. Please check your email.');
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Failed to send password reset email.', true);
            });
        });
    }

    // Reset Password
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showMessage('Passwords do not match.', true);
                return;
            }

            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                showMessage('Invalid reset token.', true);
                return;
            }

            fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) showMessage(data.error, true);
                else {
                    showMessage('Password reset successful. Please login with your new password.');
                    setTimeout(() => window.location.href = 'login.html', 3000); // Redirect to login page
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Failed to reset password.', true);
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetTokenInput = document.getElementById('resetToken');
    const messagesDiv = document.getElementById('messages');

    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        resetTokenInput.value = token; // Populate the hidden input field
    } else {
        showMessage('Invalid or missing reset token.', true);
    }

    // Reset Password Form Submission
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showMessage('Passwords do not match.', true);
                return;
            }

            const token = resetTokenInput.value;
            if (!token) {
                showMessage('Invalid reset token.', true);
                return;
            }

            fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showMessage(`Error: ${data.error}. ${data.details || ''}`, true);
                } else {
                    showMessage('Password reset successful. Please login with your new password.');
                    setTimeout(() => window.location.href = 'login.html', 3000); // Redirect to login page
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('Failed to reset password. Please try again.', true);
            });
        });
    }
});