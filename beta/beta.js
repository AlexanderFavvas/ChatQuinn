document.addEventListener('DOMContentLoaded', function() {
    const continueButton = document.getElementById('continueButton');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const betaCheckbox = document.getElementById('betaCheckbox');

    function updateButtonState() {
        continueButton.disabled = !(termsCheckbox.checked && betaCheckbox.checked);
    }

    termsCheckbox.addEventListener('change', updateButtonState);
    betaCheckbox.addEventListener('change', updateButtonState);

    continueButton.addEventListener('click', function() {
        if (!continueButton.disabled) {
            window.location.href = '../signin/signin.html';
        }
    });
});
