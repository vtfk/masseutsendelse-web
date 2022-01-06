<template>
  <div>
    You must login to proceede
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  async created() {
    // Attempt to handle the redirection of applicable
    let response = await this.$msal.handleRedirectPromise();
    if(response) {
      console.log('== Attempt to handle redirection ==');
      console.log(response);
      this.$accessToken = response;
      localStorage.setItem('accessToken', JSON.stringify(response));
      
      this.$router.push('/');
      return;
    }

    // Start a new authentication if necessary
    if(this.$isAuthenticationRequired()) await this.$acquireTokenRedirect();
  }
}
</script>