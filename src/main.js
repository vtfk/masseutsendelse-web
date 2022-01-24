/*
  Import dependencies
*/
import Vue from 'vue'
import App from './App.vue'
import { VuePlugin } from 'vuera'
import config from '../config';
import vuetify from './plugins/vuetify'
import * as msal from '@azure/msal-browser';
import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";

/*
  Async function for setting up mocking if applicable, this will be called before VUE is initialized
*/
async function prepareEnvironment() {
  // Setup the MSW mocking if applicable
  if(config.MOCK_ENABLED) {
    console.log('== Starting MSW mocking ==')
    const { worker } = require('./mocks/browser');
    await worker.start();
  }

  // Create msal
  const msalConfig = {
    auth: {
      clientId: config.AZUREAD_CLIENTID,
      authority: config.AZUREAD_AUTHORITYURL,
      redirectUri: "/login",
      postLogoutRedirectUri: '/logout',
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
  }
  /*
    Sentry
  */
  if(config.SENTRY_DSN)
  if(config.SENTRY_TRACINGORIGINS && typeof config.SENTRY_TRACINGORIGINS === 'string') config.SENTRY_TRACINGORIGINS = config.SENTRY_TRACINGORIGINS.split(',');
  // ["localhost", "my-site-url.com", /^\//]
  Sentry.init({
    Vue,
    dsn: config.SENTRY_DSN,
    integrations: [
      new Integrations.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        tracingOrigins: config.SENTRY_TRACINGORIGINS,
      }),
    ],
    tracesSampleRate: 1.0,
  });
  /*
    Authentication / Authorization
    This is in no way a idéal way to handle this, but was necessary due to timecontstraints.
  */
  Vue.prototype.$msalConfig = msalConfig;
  Vue.prototype.$msal = new msal.PublicClientApplication(Vue.prototype.$msalConfig);

  Vue.prototype.$accessToken = undefined;
  let accessToken = localStorage.getItem('accessToken');
  if(accessToken) Vue.prototype.$accessToken = JSON.parse(accessToken);

  Vue.prototype.$authenticatedUser = () => {
    const accounts = Vue.prototype.$msal.getAllAccounts();
    if(!accounts || accounts.length === 0) return undefined;
    return accounts[0];
  }

  Vue.prototype.$isAuthenticationRequired = () => {
    if(!Vue.prototype.$authenticatedUser()) return true;
    if(!Vue.prototype.$accessToken) return true;
    if(!Vue.prototype.$accessToken.expiresOn || Date.parse(Vue.prototype.$accessToken.expiresOn) < Date.now()) return true;
    return false;
  }

  Vue.prototype.$acquireTokenRedirect = async () => {
    // Check if re-authentication is necessary or not first
    if(!Vue.prototype.$isAuthenticationRequired()) return Vue.prototype.$accessToken;

    // Define the request
    const currentAccounts = Vue.prototype.$msal.getAllAccounts();
    const request = {
      scopes: ['ffd9d6ce-d313-4d5d-a758-0affa6dadd0a/.default'],
      account: currentAccounts && currentAccounts[0] ? currentAccounts[0] : undefined
    }

    // Attempt to acquire token silently, if that fails attempt with a popup
    try {
      const token = await Vue.prototype.$msal.acquireTokenSilent(request);
      Vue.prototype.$accessToken = token;
      localStorage.setItem('accessToken', JSON.stringify(token));
      return;
    } catch {
      return Vue.prototype.$msal.acquireTokenRedirect(request)
    }
  }

  Vue.prototype.$acquireTokenPopup = async () => {
    // Check if re-authentication is necessary or not first
    if(!Vue.prototype.$isAuthenticationRequired()) return Vue.prototype.$accessToken;

    // Define the request
    const currentAccounts = Vue.prototype.$msal.getAllAccounts();
    const request = {
      scopes: ['ffd9d6ce-d313-4d5d-a758-0affa6dadd0a/.default'],
      account: currentAccounts && currentAccounts[0] ? currentAccounts[0] : undefined
    }

    // Attempt to acquire token silently, if that fails attempt with a popup
    try {
      const token = await Vue.prototype.$msal.acquireTokenSilent(request);
      Vue.prototype.$accessToken = token;
      localStorage.setItem('accessToken', JSON.stringify(token));
    } catch {
      const token = await Vue.prototype.$msal.acquireTokenPopup(request);
      Vue.prototype.$accessToken = token;
      localStorage.setItem('accessToken', JSON.stringify(token));
    }
  }
}

/*
  Import CSS
*/
import 'leaflet/dist/leaflet.css';                    // Used by leaflet for displaying maps
import '@toast-ui/editor/dist/toastui-editor.css';    // Used by the ToastUI markdown editor

/*
  Setup
*/
// Register globally available components
import ErrorField from './components/errors/ErrorField'; Vue.component('ErrorField', ErrorField);
import ErrorModal from './components/errors/ErrorModal'; Vue.component('ErrorModal', ErrorModal);

// Add global accessible object
Vue.prototype.$config = config;

// Use Vuera to use react components in Vue
Vue.use(VuePlugin)
Vue.config.productionTip = false

// Setup the routes
import router from './router'

// Import the Vuex store
import store from './store'

// Global error handler, any uncaught errors will be sent here
Vue.config.errorHandler = function(err, vm, info) {
  // TODO: Implement Sentry
  console.log('Uncaught error');
  console.log(err);
  console.log(vm);
  console.log(info);
}

prepareEnvironment().then(() => {
  new Vue({
    vuetify,
    router,
    store,
    render: h => h(App)
  }).$mount('#app')  
})
