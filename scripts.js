document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const username = formData.get('username');
            const password = formData.get('password');
            const email = formData.get('email');
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, email })
                });
                if (response.ok) {
                    const result = await response.json();
                    // Display success message in a dropdown
                    const messageDropdown = document.getElementById('message-dropdown');
                    messageDropdown.innerHTML = `<option>${result.message}</option>`;
                    registerForm.reset(); // Clear the form
                } else {
                    const result = await response.json();
                    if (result.errors) {
                        alert('Registration failed:\n' + result.errors.map(e => `${e.path}: ${e.msg}`).join('\n'));
                    } else {
                        alert('Registration failed: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const username = formData.get('username');
            const password = formData.get('password');
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                if (response.ok) {
                    alert('Login successful');
                    window.location.href = '/dashboard'; // Redirect to dashboard
                } else {
                    alert('Invalid username or password');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again later.');
            }
        });
    }
});
