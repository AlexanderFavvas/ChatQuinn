document.getElementById('google-signin-button').addEventListener('click', function() {
    // Define OAuth 2.0 parameters
    const oauthParams = {
        client_id: '413388646063-vo0ilu59dq40lm45l8b3h2494sds151q.apps.googleusercontent.com',
        redirect_uri: 'https://staging.ddw9r8stoik0t.amplifyapp.com/callback.html',
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent'
    };

    // Construct the authorization URL
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
        Object.entries(oauthParams)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

    // Redirect to Google's OAuth consent screen
    window.location.href = authUrl;
});

