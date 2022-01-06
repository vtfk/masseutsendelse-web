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

    // // If not, kick of a new login
    const currentAccounts = this.$msal.getAllAccounts();
    // if(currentAccounts.length === 0) return this.$msal.loginRedirect();

    // Check if accessToken exists
    if(!this.$accessToken) {
      const request = {
        scopes: ['ffd9d6ce-d313-4d5d-a758-0affa6dadd0a/.default'],
        account: currentAccounts[0]
      }
      try {
        console.log('Attempt to aquire AccessToken silently');
        const token = await this.$msal.acquireTokenSilent(request);
        console.log('Token:');
        console.log(token);
        localStorage.setItem('accessToken', JSON.stringify(this.$accessToken));
      } catch {
        console.log('Silent token failed, aquire by redirection');
        return this.$msal.acquireTokenRedirect(request)
      }
    }

  }
}
</script>