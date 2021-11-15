/*
  Import dependencies
*/
import Vue from 'vue'
import App from './App.vue'
import { VuePlugin } from 'vuera'
import Config from '../config';
import vuetify from './plugins/vuetify'

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
Vue.prototype.$config = Config;

// Setup the mock listner
if(process.env.VUE_APP_USE_MOCK === 'true') {
  const { worker } = require('./mocks/browser');
  worker.start();
}

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

new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')
