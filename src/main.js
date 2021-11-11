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
import Error from './components/Error'; Vue.component('Error', Error);

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

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
