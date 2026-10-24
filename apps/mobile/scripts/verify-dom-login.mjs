import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\kteja\\.gemini\\antigravity-ide\\brain\\08c9cd40-40c2-4e77-aad2-e52e66631e39';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;
console.log(`Using browser executable: ${executablePath}`);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDomVerification() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    console.log('\n============================================================');
    console.log('PART 1: MOBILE APP DOM VERIFICATION (http://localhost:8085/)');
    console.log('============================================================');

    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 412, height: 915, isMobile: true });

    // Enable console logging from page
    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('Auth') || msg.text().includes('api')) {
        console.log(`[Mobile Page Console] ${msg.type()}: ${msg.text()}`);
      }
    });

    console.log('Navigating to http://localhost:8085/ ...');
    await mobilePage.goto('http://localhost:8085/', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    // If already logged in, let's clear storage and reload to test fresh login
    const initialText = await mobilePage.evaluate(() => document.body.innerText);
    console.log('Initial page text summary:', initialText.split('\n').filter(Boolean).slice(0, 5).join(' | '));

    if (initialText.includes('Account Pending Approval') || initialText.includes('Sign Out') || initialText.includes('Dashboard')) {
      console.log('Clearing existing session to test fresh DOM login...');
      await mobilePage.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await mobilePage.reload({ waitUntil: 'networkidle0' });
      await sleep(2000);
    }

    // Capture initial login screen
    const loginScreenShotPath = path.join(ARTIFACTS_DIR, 'mobile_dom_01_login_empty.png');
    await mobilePage.screenshot({ path: loginScreenShotPath });
    console.log(`📸 Saved screenshot: ${loginScreenShotPath}`);

    // Find email and password inputs
    const inputs = await mobilePage.$$('input');
    console.log(`Found ${inputs.length} input elements on mobile page.`);

    let emailInput = null;
    let passwordInput = null;

    for (const input of inputs) {
      const type = await input.evaluate((el) => el.getAttribute('type') || '');
      const placeholder = await input.evaluate((el) => el.getAttribute('placeholder') || '');
      const name = await input.evaluate((el) => el.getAttribute('name') || '');
      console.log(`  Input: type="${type}", placeholder="${placeholder}", name="${name}"`);

      if (type === 'password' || placeholder.includes('••') || placeholder.toLowerCase().includes('password')) {
        passwordInput = input;
      } else if (type === 'email' || placeholder.includes('@') || placeholder.toLowerCase().includes('email')) {
        emailInput = input;
      }
    }

    // Fallbacks if not identified by type
    if (!emailInput && inputs.length >= 1) emailInput = inputs[0];
    if (!passwordInput && inputs.length >= 2) passwordInput = inputs[1];

    if (!emailInput || !passwordInput) {
      throw new Error('Could not locate email and password inputs on login page');
    }

    console.log('\nFilling in credentials...');
    console.log('  Email: ktejaswanth@gmail.com');
    console.log('  Password: [REDACTED]');

    await emailInput.click({ clickCount: 3 });
    await emailInput.type('ktejaswanth@gmail.com', { delay: 30 });

    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type('123456', { delay: 30 });

    const filledScreenShotPath = path.join(ARTIFACTS_DIR, 'mobile_dom_02_login_filled.png');
    await mobilePage.screenshot({ path: filledScreenShotPath });
    console.log(`📸 Saved screenshot: ${filledScreenShotPath}`);

    // Find and click the Sign In button
    console.log('Locating Sign In button by innerText...');
    const clicked = await mobilePage.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const target = allElements.find((el) => {
        const text = el.innerText ? el.innerText.trim() : '';
        return text === 'Sign In to Portal →' || text === 'Sign In to Portal';
      });

      if (target) {
        // Trigger both mousedown, mouseup, and click
        target.scrollIntoView();
        target.click();
        // Also click closest parent if target is a text node container
        if (target.parentElement) target.parentElement.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      throw new Error('Sign In to Portal button not found in DOM');
    }
    console.log('Successfully triggered click on "Sign In to Portal →"');

    console.log('Waiting for authentication response and DOM update...');
    await sleep(5000);

    const postLoginScreenShotPath = path.join(ARTIFACTS_DIR, 'mobile_dom_03_authenticated_screen.png');
    await mobilePage.screenshot({ path: postLoginScreenShotPath });
    console.log(`📸 Saved screenshot: ${postLoginScreenShotPath}`);

    // Extract DOM inspection details
    const domDetails = await mobilePage.evaluate(() => {
      const bodyText = document.body.innerText;
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, div[role="heading"]')).map((el) => el.innerText.trim());
      const buttons = Array.from(document.querySelectorAll('div[role="button"], button')).map((el) => el.innerText.trim());
      const paragraphs = Array.from(document.querySelectorAll('p, span, div')).map((el) => el.innerText.trim()).filter((t) => t.length > 0 && t.length < 200);

      return {
        url: window.location.href,
        bodyTextSnippet: bodyText.split('\n').filter(Boolean),
        headings,
        buttons: Array.from(new Set(buttons)),
      };
    });

    console.log('\n--- MOBILE POST-LOGIN DOM DETAILS ---');
    console.log('URL:', domDetails.url);
    console.log('Headings:', domDetails.headings);
    console.log('Buttons:', domDetails.buttons);
    console.log('Rendered Content Lines:');
    domDetails.bodyTextSnippet.forEach((line) => console.log('  |', line));

    // Locate and click "Check Approval Status 🔄"
    console.log('Testing interactive click on "Check Approval Status 🔄" button...');
    const refreshClicked = await mobilePage.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const target = allElements.find((el) => {
        const text = el.innerText ? el.innerText.trim() : '';
        return text.includes('Check Approval Status');
      });
      if (target) {
        target.scrollIntoView();
        target.click();
        if (target.parentElement) target.parentElement.click();
        return true;
      }
      return false;
    });
    console.log('Refresh button clicked:', refreshClicked);
    await sleep(3000);

    const refreshedScreenShotPath = path.join(ARTIFACTS_DIR, 'mobile_dom_04_status_checked.png');
    await mobilePage.screenshot({ path: refreshedScreenShotPath });
    console.log(`📸 Saved screenshot after status check: ${refreshedScreenShotPath}`);

    const refreshedText = await mobilePage.evaluate(() => document.body.innerText);
    console.log('Post-refresh page text:\n', refreshedText);

    console.log('\n============================================================');
    console.log('PART 2: WEB APP DOM VERIFICATION (http://localhost:5173/login)');
    console.log('============================================================');

    const webPage = await browser.newPage();
    await webPage.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to http://localhost:5173/login ...');
    await webPage.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);

    const webLoginEmptyShotPath = path.join(ARTIFACTS_DIR, 'web_dom_01_login_empty.png');
    await webPage.screenshot({ path: webLoginEmptyShotPath });
    console.log(`📸 Saved screenshot: ${webLoginEmptyShotPath}`);

    const webInputs = await webPage.$$('input');
    console.log(`Found ${webInputs.length} input elements on web login page.`);

    let webEmail = null;
    let webPass = null;
    for (const input of webInputs) {
      const type = await input.evaluate((el) => el.getAttribute('type') || '');
      const placeholder = await input.evaluate((el) => el.getAttribute('placeholder') || '');
      if (type === 'password' || placeholder.toLowerCase().includes('password')) {
        webPass = input;
      } else if (type === 'email' || placeholder.includes('@') || placeholder.toLowerCase().includes('email')) {
        webEmail = input;
      }
    }

    if (!webEmail && webInputs.length >= 1) webEmail = webInputs[0];
    if (!webPass && webInputs.length >= 2) webPass = webInputs[1];

    if (webEmail && webPass) {
      console.log('Filling credentials in Web Login...');
      await webEmail.click({ clickCount: 3 });
      await webEmail.type('ktejaswanth@gmail.com', { delay: 25 });
      await webPass.click({ clickCount: 3 });
      await webPass.type('123456', { delay: 25 });

      const webLoginFilledShotPath = path.join(ARTIFACTS_DIR, 'web_dom_02_login_filled.png');
      await webPage.screenshot({ path: webLoginFilledShotPath });
      console.log(`📸 Saved screenshot: ${webLoginFilledShotPath}`);

      // Specifically locate the modal's form submit button
      let webSubmitBtn = await webPage.$('form button[type="submit"]');
      if (!webSubmitBtn) {
        const allBtns = await webPage.$$('button');
        for (const b of allBtns) {
          const t = await b.evaluate(el => el.innerText || '');
          if (t.includes('Continue with email code')) {
            webSubmitBtn = b;
            break;
          }
        }
      }

      if (webSubmitBtn) {
        console.log('Clicking Web submit button...');
        await webSubmitBtn.click();
        await sleep(6000);

        const webPostLoginShotPath = path.join(ARTIFACTS_DIR, 'web_dom_03_authenticated_screen.png');
        await webPage.screenshot({ path: webPostLoginShotPath });
        console.log(`📸 Saved screenshot: ${webPostLoginShotPath}`);

        const webDomDetails = await webPage.evaluate(() => {
          return {
            url: window.location.href,
            title: document.title,
            bodyTextSnippet: document.body.innerText.split('\n').filter(Boolean).slice(0, 25),
          };
        });

        console.log('\n--- WEB POST-LOGIN DOM DETAILS ---');
        console.log('URL:', webDomDetails.url);
        console.log('Title:', webDomDetails.title);
        console.log('Body Text Snippet:');
        webDomDetails.bodyTextSnippet.forEach((line) => console.log('  |', line));
      }
    }

    console.log('\n============================================================');
    console.log('DOM VERIFICATION COMPLETED SUCCESSFULLY');
    console.log('============================================================\n');

  } catch (error) {
    console.error('Error during DOM verification:', error);
  } finally {
    await browser.close();
  }
}

runDomVerification();
