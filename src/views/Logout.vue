<template>
  <div class="logoutContainer">
    <div>
      <Loading v-if="!$isAuthenticationRequired()" title="Logger ut" spinnerSize="xlarge"/>
      <div v-else style="display: flex; flex-direction: column; height: 100%; align-items: center; justify-content: center;">
        <h1 style="margin-bottom: 0.2rem">Du er logget ut</h1>
        <div style="margin-bottom: 1rem">Trykk her for å logge inn igjen</div>
        <v-btn @click="() => $router.push('/login')">Logg inn</v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import Loading from '../components/Loading.vue';

export default {
  name: 'LogoutView',
  components: {
    Loading
  },
  async created() {
    if(!this.$isAuthenticationRequired()) {
      this.$accessToken = undefined;
      localStorage.removeItem('accessToken');
      this.$msal.logoutRedirect();
    }
    
  }
}
</script>

<style scoped>
  .logoutContainer {
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
</style>