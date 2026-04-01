/**
 * One-time OAuth2 flow to get a Gmail refresh token.
 * Run with: npx ts-node --skip-project scripts/auth.ts
 *
 * Prerequisites:
 *   GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { google } from 'googleapis';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  }
}

const REDIRECT_URI = 'http://localhost:3000/api/auth/callback';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('\n❌  GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local\n');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n─────────────────────────────────────────────────────');
  console.log('  Gmail OAuth2 Setup');
  console.log('─────────────────────────────────────────────────────');
  console.log('\n1. Open this URL in your browser:\n');
  console.log(`   ${authUrl}\n`);
  console.log('2. Sign in with your Google account and grant access.');
  console.log('3. You will be redirected back and the token will be saved.\n');

  // Start a local server to catch the callback
  await new Promise<void>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith('/api/auth/callback')) return;

      const url = new URL(req.url, 'http://localhost:3000');
      const code = url.searchParams.get('code');

      if (!code) {
        res.end('No code received. Please try again.');
        reject(new Error('No code in callback'));
        return;
      }

      try {
        const { tokens } = await oauth2Client.getToken(code);
        const refreshToken = tokens.refresh_token;

        if (!refreshToken) {
          res.end(
            '<h2>No refresh token received.</h2><p>Revoke app access at myaccount.google.com/permissions and try again.</p>'
          );
          reject(new Error('No refresh token'));
          return;
        }

        // Append to .env.local
        const envLine = `\nGOOGLE_REFRESH_TOKEN=${refreshToken}\n`;
        fs.appendFileSync(envPath, envLine, 'utf-8');

        console.log('✅  Refresh token saved to .env.local!');
        console.log('\nYou can now start the app with: npm run dev\n');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(
          '<h2 style="font-family:sans-serif;color:green">✅ Authentication successful!</h2><p>You can close this tab and return to the terminal.</p>'
        );
        server.close();
        resolve();
      } catch (err) {
        res.end('Error exchanging code for tokens.');
        reject(err);
      }
    });

    server.listen(3000, () => {
      console.log('Waiting for Google to redirect back to localhost:3000...\n');
    });

    server.on('error', reject);
  });
}

main().catch((err) => {
  console.error('Auth failed:', err.message);
  process.exit(1);
});
