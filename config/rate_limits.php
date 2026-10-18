<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rate Limits
    |--------------------------------------------------------------------------
    |
    | Requests per minute, per client, for the two throttled groups of the API.
    | Both are deliberately low in production and both are raised by the e2e
    | suite, which drives a real server far harder than a person can: it logs in
    | once per test and shares a single dev user, so every test's traffic lands
    | in the same bucket. Raising the ceiling here keeps the middleware in place
    | in test environments instead of bypassing it.
    |
    */

    /*
     | POST /api/auth/exchange-code, keyed by IP — it is unauthenticated. Low on
     | purpose: it trades a one-time code for a long-lived token, which makes it
     | the cheapest place to brute-force.
     */
    'exchange_code' => env('EXCHANGE_CODE_RATE_LIMIT', 5),

    /*
     | Every route behind auth:sanctum, keyed by user id.
     */
    'api' => env('API_RATE_LIMIT', 60),

];
