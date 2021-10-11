import Vue from 'vue'
import App from './App.vue'
import { VuePlugin } from 'vuera'

// Use Vuera to use react components in Vue
Vue.use(VuePlugin)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
