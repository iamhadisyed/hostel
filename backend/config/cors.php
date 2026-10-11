<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The frontend is a separate static site on its own domain/subdomain and
    | authenticates with a bearer token (Sanctum personal access tokens), not
    | cookies, so credentials support is left off and only the origins that
    | should be allowed to call this API need to be listed here.
    |
    | Set CORS_ALLOWED_ORIGINS in .env to a comma-separated list of the exact
    | origins allowed to call this API, e.g.:
    |   CORS_ALLOWED_ORIGINS=https://hostel.aethercampus.com
    | '*' allows any origin — fine for local development, not for production.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', '*'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
