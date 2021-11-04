import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

/*
  Import views
*/
import HomeView from './views/Home'
import UtsendelserView from './views/Utsendelser'
import TemplateView from './views/Templates'

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
    },
    {
      path: '/maler',
      component: TemplateView
    }
  ]
});

// Error handler
router.onError((err) => {
  console.log('Route error:');
  console.log(err);
})

export default router;