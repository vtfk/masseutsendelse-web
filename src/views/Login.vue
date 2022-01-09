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
  data() {
    return {
      rerouteInterval: undefined,
      rerouteIntervalms: 5000
    }
  },
  methods: {
    rerouteIfAuthUnecessary() {
      if(!this.$isAuthenticationRequired()) this.$router.push('/');
    }
  },
  async created() {
    // Create an interval that checks if authentication is necessary or not, if not it will redirect to the main page
    // The reason for this is to handle an issue where redirection don't work as it should when the token has expired
    this.rerouteInterval = setInterval(() => { this.rerouteIfAuthUnecessary() }, this.rerouteIntervalms);

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
  },
  async beforeDestroy() {
    clearInterval(this.rerouteInterval);
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