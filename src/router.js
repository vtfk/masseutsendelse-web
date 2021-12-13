import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

/*
  Import views
*/
import HomeView from './views/Home'
import UtsendelserView from './views/Utsendelser'
import TemplateView from './views/Templates'
import DevelopmentView from './views/Development'

/*
  Setup routes
*/
let routes = [
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

if(process.env.NODE_ENV === 'development') {
  routes.push({
    path: '/dev',
    component: DevelopmentView
  })
}

/*
  Setup the router
*/
let router = new VueRouter({
  mode: 'history',
  routes: routes
});

// Error handler
router.onError((err) => {
  console.log('Route error:');
  console.log(err);
})

export default router;