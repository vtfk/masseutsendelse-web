import Vue from 'vue';
import VueRouter from 'vue-router';

Vue.use(VueRouter);

/*
  Import views
*/
import HomeView from './views/Home'
import LoginView from './views/Login'
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
    path: '/login',
    component: LoginView
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

// Add the dev route if in development mode
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

/*
  Handle authentication
*/
router.beforeEach(async (to, from, next) => {
  // If logging in, just proceed
  if(to && to.path === '/login') return next();
  if(to.hash && to.hash.startsWith('#code=')) return next();

  // Check if re-authentication is necessary
  if(!Vue.prototype.$authenticatedUser() || !Vue.prototype.$accessToken || !Vue.prototype.$accessToken.expiresOn || Date.parse(Vue.prototype.$accessToken.expiresOn) < Date.now()) {
    console.log('Must re-authenticate');
    await Vue.prototype.$msal.loginRedirect();
  }
  
  // Proceed
  next();
})

// Error handler
router.onError((err) => {
  console.log('Route error:');
  console.log(err);
})

export default router;