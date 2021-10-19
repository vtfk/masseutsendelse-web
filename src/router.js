import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

/*
  Import views
*/
import HomeView from './views/Home'
import UtsendelserView from './views/Utsendelser'

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: HomeView
    },
    {
      path: '/utsendelser',
      component: UtsendelserView
    }
  ]
});

// Error handler
router.onError((err) => {
  console.log('Route error:');
  console.log(err);
})

export default router;