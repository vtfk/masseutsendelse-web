/*
  Import dependencies
*/
import Vue from 'vue'
import App from './App.vue'
import { VuePlugin } from 'vuera'
import config from '../config';
import vuetify from './plugins/vuetify'
import * as msal from '@azure/msal-browser';

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
      navigateToLoginRequestUrl: false
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
  }
  Vue.prototype.$msalConfig = msalConfig;
  Vue.prototype.$msal = new msal.PublicClientApplication(Vue.prototype.$msalConfig);
  Vue.prototype.$accessToken = undefined;
  let existingToken = localStorage.getItem('accessToken');
  if(existingToken) Vue.prototype.$accessToken = JSON.parse(existingToken);
  Vue.prototype.$authenticatedUser = () => {
    const accounts = Vue.prototype.$msal.getAllAccounts();
    if(!accounts || accounts.length === 0) return undefined;
    return accounts[0];
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
