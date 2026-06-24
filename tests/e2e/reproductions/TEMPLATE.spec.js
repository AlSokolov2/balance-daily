/**
 * Bug reproduction template.
 *
 * Usage:
 *   1. Copy this file to reproductions/issue-NNN.spec.js
 *   2. Replace placeholders below
 *   3. Run: npx playwright test tests/e2e/reproductions/issue-NNN.spec.js --reporter=list
 *
 * The test MUST fail to confirm the bug exists before fixing.
 * After the fix, the test should pass (keep it as a regression test).
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

// ── Replace these ──────────────────────────────────────────
const ISSUE = '#XXX';           // GitHub issue number
const TITLE = 'Brief description of the bug';
const STEPS = [                 // Steps to reproduce
    '1. Login',
    '2. Navigate to ...',
    '3. Click ...',
];
const EXPECTED = 'What should happen';
const ACTUAL = 'What actually happens';
// ───────────────────────────────────────────────────────────

test.describe(`Reproduction: ${ISSUE} — ${TITLE}`, () => {
    test.skip('reproduces the bug', async ({ page }) => {
        const h = helpers(page);

        // Setup: login
        await h.devLogin();
        await h.waitForApp();

        // ── Reproduction steps ──────────────────────────
        // TODO: Implement the steps from the bug report

        // ── Assertion that MUST fail (confirms the bug) ──
        // TODO: Write the assertion that demonstrates the bug
        // expect(actual).toBe(expected);

        test.fail(); // Remove this line after confirming the bug reproduces
    });
});
