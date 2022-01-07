<template>
  <div class="loginContainer">
    <div>
      <Loading title="Logger inn" spinnerSize="xlarge"/>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Loading from '../components/Loading.vue';

export default {
  name: 'LoginView',
  components: {
    Loading
  },
  async created() {
    // Attempt to handle the redirection of applicable
    let response = await this.$msal.handleRedirectPromise();
    if(response) {
      this.$accessToken = JSON.parse(JSON.stringify(response));
      Vue.prototype.$accessToken = JSON.parse(JSON.stringify(response));
      localStorage.setItem('accessToken', JSON.stringify(response));
      this.$router.push('/')
      return;
    }

    // Start a new authentication if necessary
    if(this.$isAuthenticationRequired()) return this.$acquireTokenRedirect();
    this.$router.push('/');
  }
}
</script>

<style scoped>
  .loginContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
</style>