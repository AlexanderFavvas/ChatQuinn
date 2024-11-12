document.addEventListener('DOMContentLoaded', () => {
    const getCodeBtn = document.getElementById('getCodeBtn');
    const spinner = document.getElementById('spinner');
    const verificationCode = document.getElementById('verificationCode');
    const errorMessage = document.getElementById('errorMessage');
    const confirmButton = document.getElementById('confirmButton');

    getCodeBtn.addEventListener('click', () => {
        // Show spinner and disable button
        spinner.style.display = 'block';
        getCodeBtn.disabled = true;
        // Clear previous messages
        verificationCode.textContent = '';
        errorMessage.textContent = '';
        confirmButton.style.display = 'none';

        fetch('https://us-central1-movie-thing-439716.cloudfunctions.net/test_function', {
            credentials: 'include' // Include cookies in the request
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide spinner and enable button
                spinner.style.display = 'none';
                getCodeBtn.disabled = false;
                // Display the verification code
                verificationCode.textContent = `Your verification code is: ${data.code}\nPlease send this code to @QUINN_THE_BOT on Telegram`;
                // Show confirm button
                confirmButton.style.display = 'block';
            })
            .catch(error => {
                // Hide spinner and enable button
                spinner.style.display = 'none';
                getCodeBtn.disabled = false;
                // Display error message
                errorMessage.textContent = `Error: ${error.message}`;
            });
    });

    confirmButton.addEventListener('click', () => {
        // Show spinner and disable buttons
        spinner.style.display = 'block';
        getCodeBtn.disabled = true;
        confirmButton.disabled = true;
        
        fetch('https://us-central1-movie-thing-439716.cloudfunctions.net/checkForVerification', {
            method: 'POST',
            credentials: 'include' // Include cookies in the request
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide spinner and enable buttons
                spinner.style.display = 'none';
                getCodeBtn.disabled = false;
                confirmButton.disabled = false;
                // Hide confirm button after successful confirmation
                confirmButton.style.display = 'none';
                // Display success message
                verificationCode.textContent = 'Telegram verification successful!';
                // Clear any previous error messages
                errorMessage.textContent = '';
                // Redirect to dashboard after short delay
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            })
            .catch(error => {
                // Hide spinner and enable buttons
                spinner.style.display = 'none';
                getCodeBtn.disabled = false;
                confirmButton.disabled = false;
                // Display error message
                errorMessage.textContent = `Error during confirmation: ${error.message}`;
            });
    });
});