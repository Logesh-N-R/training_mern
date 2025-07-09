
// Environment variables required for Google OAuth
// Add these to your Replit Secrets:
// 
// GOOGLE_CLIENT_ID=your_google_client_id
// GOOGLE_CLIENT_SECRET=your_google_client_secret
// GOOGLE_REDIRECT_URI=https://your-repl-name.your-username.repl.co/api/auth/google/callback
//
// To get these credentials:
// 1. Go to https://console.developers.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
// 5. Set application type to "Web application"
// 6. Add your redirect URI to "Authorized redirect URIs"

export const requiredSecrets = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI'
];
