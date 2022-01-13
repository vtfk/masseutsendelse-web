export default {
    MASSEUTSENDELSEAPI_BASEURL: process.env.VUE_APP_MASSEUTSENDELSEAPI_BASE_URL,
    MASSEUTSENDELSEAPI_APICODE: process.env.VUE_APP_MASSEUTSENDELSEAPI_API_CODE,
    MATRIKKELPROXY_CLIENTID: process.env.VUE_APP_MATRIKKELPROXY_CLIENTID,
    EXCLUDED_OWNER_IDS: process.env.VUE_APP_EXCLUDED_OWNER_IDS ? process.env.VUE_APP_EXCLUDED_OWNER_IDS.split(',') : undefined,
    MOCK_MATRIKKEL_API: process.env.VUE_APP_MOCK_MATRIKKEL_API || false,
    MOCK_MASSEUTSENDELSE_API: process.env.VUE_APP_MOCK_MASSEUTSENDELSE_API || false,
    MOCK_ENABLED: process.env.VUE_APP_MOCK_MATRIKKEL_API === 'true' || process.env.VUE_APP_MOCK_MASSEUTSENDELSE_API === 'true',
    AZUREAD_CLIENTID: process.env.VUE_APP_AZUREAD_CLIENTID,
    AZUREAD_AUTHORITYURL: process.env.VUE_APP_AZUREAD_AUTHORITYURL,
    VTFK_PDFGENERATOR_ENDPOINT: process.env.VUE_APP_VTFK_PDFGENERATOR_ENDPOINT,
    SENTRY_DSN: process.env.VUE_APP_SENTRY_DSN,
    SENTRY_TRACINGORIGINS: process.env.VUE_APP_SENTRY_TRACINGORIGINS || ['localhost']
}
