/**
 * One-time helper to obtain a Dropbox refresh token.
 *
 *   node scripts/dropbox-auth.js
 *
 * Walks through Dropbox's no-redirect OAuth flow and prints the three values
 * to paste into GitHub as repository secrets. Run it once; the refresh token
 * is long-lived. Run it again if the token is ever revoked.
 *
 * Nothing is written to disk. The values are printed to your terminal and go
 * straight into GitHub's encrypted secret store — they must never be committed
 * to the repository or pasted into a file.
 */
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = question => new Promise(resolve => rl.question(question, a => resolve(a.trim())));

(async () => {
  console.log(`
Dropbox setup
=============

First, create the app (once):

  1. Go to  https://www.dropbox.com/developers/apps
  2. "Create app"
  3. Choose API:          Scoped access
  4. Choose access type:  App folder     <-- IMPORTANT, not "Full Dropbox"
  5. Name it:             Planetary Meeting
  6. On the Permissions tab tick ONLY:
         files.metadata.read
         files.content.read
     then click Submit.

App folder access confines this to /Apps/Planetary Meeting/ — it can never
see, let alone touch, anything else in the Dropbox account. Read-only scopes
mean it cannot modify even that folder.
`);

  const appKey = await ask('App key: ');
  const appSecret = await ask('App secret: ');

  if (!appKey || !appSecret) {
    console.error('\nBoth values are required. Find them on the app\'s Settings tab.');
    rl.close();
    process.exit(1);
  }

  const authUrl =
    'https://www.dropbox.com/oauth2/authorize' +
    `?client_id=${encodeURIComponent(appKey)}` +
    '&response_type=code' +
    '&token_access_type=offline';

  console.log(`
Now authorise it:

  1. Open this URL in a browser signed in to the Dropbox account:

${authUrl}

  2. Click "Allow".
  3. Copy the access code Dropbox shows you.
`);

  const code = await ask('Access code: ');
  rl.close();

  if (!code) {
    console.error('\nNo code entered.');
    process.exit(1);
  }

  const basic = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
  const res = await fetch('https://api.dropbox.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code }),
  });

  if (!res.ok) {
    console.error(`\nDropbox rejected that (HTTP ${res.status}): ${await res.text()}`);
    console.error('Access codes are single-use and expire quickly — try again from step 1.');
    process.exit(1);
  }

  const data = await res.json();

  if (!data.refresh_token) {
    console.error('\nNo refresh token came back. Make sure the authorise URL included');
    console.error('token_access_type=offline, then try again.');
    process.exit(1);
  }

  console.log(`
Done.

Add these three as repository secrets:
  GitHub -> your repo -> Settings -> Secrets and variables -> Actions -> New repository secret

  DROPBOX_APP_KEY         ${appKey}
  DROPBOX_APP_SECRET      ${appSecret}
  DROPBOX_REFRESH_TOKEN   ${data.refresh_token}

Secrets are encrypted by GitHub and are never part of the repository's
contents. Do not paste them into any file in the repo.

To revoke later: Dropbox -> Settings -> Connected apps -> remove the app,
then re-run this script to issue a fresh token.
`);
})().catch(err => {
  console.error('\n' + err.message);
  process.exit(1);
});
