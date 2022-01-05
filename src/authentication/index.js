/*
  Import services
*/
const azure = require('./services/azure.service');

/*
  Declarations
*/
const availableServices = ['azure'];       // Array of all supported services
// let tokens = [];                        // Array that will store all tokens

/*
  Private functions
*/
function setToken (service, type, cacheLocation, value) {
  // Input validation
  if(!service) throw new Error('service cannot be empty');
  if(!type) throw new Error('type cannot be empty');
  if(!cacheLocation) throw new Error('cacheLocation cannot be empty');
  if(!value) throw new Error('value cannot be empty');
  if(typeof value !== 'object') throw new Error('value must be of type object');
  if(Object.keys(value).length == 0) throw new Error('value object cannot have 0 keys');

  // Set the value
  if(cacheLocation === 'localStorage') {
    localStorage.setItem(`auth_${service}_${type}`.toLowerCase(), JSON.stringify(value));
  } else {
    sessionStorage.setItem(`auth_${service}_${type}`.toLowerCase(), JSON.stringify(value));
  }

  // Return the value
  return value;
}

/**
 * Find the service to use for the request
 * @param {string} service 
 * @returns 
 */
function getServiceObject(service) {
  // Input validation
  if(!service) throw new Error('service cannot be empty');

  // Find the service
  switch(service) {
    case 'azure':
      return azure;
    default:
      throw new Error(`Could not find a suitable login method for service '${service}'`);
  }
}


/*
  Public functions
*/
module.exports = class Auth {
  /**
   * 
   * @param {string} service The id of service to use. Example: azure
   * @param {object} loginOptions The login options for the service. Example for azure https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
   * @param {object} tokenOptions The options for the request to access services
   * @param {string=} [cacheLocation=localStorage] Where should the tokens be stored? localStorage or sessionStorage. Default: localStorage
   */
  constructor(service, loginOptions, tokenOptions, cacheLocation = 'localStorage') {
    this.service = service;
    this.loginOptions = loginOptions;
    this.tokenOptions = tokenOptions;
    this.cacheLocation = cacheLocation;
  }

  /**
   * Get a token from the cache
   * @param {string} service 
   * @param {string} type 
   */
  getToken (service, type, cacheLocation) {
    // Determine what to get
    service = service || this.service;
    cacheLocation = cacheLocation || this.cacheLocation;

    // Validation
    if(!service) throw new Error('service cannot be empty');
    if(!type) throw new Error('type cannot be empty');
    if(!cacheLocation) throw new Error('cacheLocation cannot be empty');

    // Retreive the token if it exists
    let token = undefined;
    if(cacheLocation === 'localStorage') {
      token = localStorage.getItem(`auth_${service}_${type}`);
    } else {
      token = sessionStorage.getItem(`auth_${service}_${type}`);
    }
    if(token) token = JSON.parse(token);

    // Return the token
    return token;
  }

  /**
   * Attempt to find a valid token in the cache.
   * @param {string} service 
   * @param {string} type 
   * @param {string} cacheLocation 
   * @returns {object | undefined}
   */
  getValidToken(service, type, cacheLocation) {
    // Determine what to get
    service = service || this.service;
    cacheLocation = cacheLocation || this.cacheLocation;

    // Validation
    if(!service) throw new Error('service cannot be empty');
    if(!type) throw new Error('type cannot be empty');
    if(!cacheLocation) throw new Error('cacheLocation cannot be empty');

    // Attempt to get an existing token
    const existingToken = this.getToken(service, type, cacheLocation);

    // No token exist, then it must be refreshed
    if(!existingToken) return undefined;

    // Check the token for expiration information
    let expiration = undefined;
    if(existingToken.expires) expiration = existingToken.expires;
    else if(existingToken.expiration) expiration = existingToken.expiration;
    else if(existingToken.exp) expiration = existingToken.exp;
    else if(existingToken.expiresOn) expiration = existingToken.expiresOn;
    else if(existingToken.extExpiresOn) expiration = existingToken.extExpiresOn;

    // If no expiration-property was found, return that a refresh is necessary
    if(!expiration) return undefined;

    // Parse and attempt to find out of if the exipiration data is passed
    try {
      let date = new Date(expiration);
      if(date < Date.now()) return undefined;
    } catch {
      return true;
    }

    return existingToken;
  }

  /**
   * Attempt to silently login, if that does not work show a popup
   * @param {string=} service Override the system to use? 
   * @param {object=} options Override the login options?
   * @returns 
   */
  async login (service, loginOptions) {
    service = service || this.service;
    loginOptions = loginOptions || this.loginOptions;

    if(!service) throw new Error('service is not set');
    if(!loginOptions) throw new Error('loginOptions is not set');
    if(!availableServices.includes(service))throw new Error(`The service ${service} is not supported`);

    // Check if the service and tokentype is available or must be refreshed
    const existing = this.getValidToken(service, 'login');
    if(existing) return token;

    // Find the service and attempt the login
    let token = '';
    const serviceObject = getServiceObject(service);
    console.log('== Logging in with options ==');
    console.log(loginOptions);
    console.log(serviceObject);
    if(loginOptions.loginMethod === 'redirect' && serviceObject.loginRedirect) {
      token = await serviceObject.loginRedirect(loginOptions);
    } else {
      token = await serviceObject.login(loginOptions);
    }

    if(!token) throw new Error('Login was attempted but no token was received');
    console.log('Got token');
    console.log(token);

    // Save the token to the cache
    setToken(service, 'login', this.cacheLocation, token);

    // Return the token
    return token;
  }

  async loginRedirection(service, loginOptions) {
    service = service || this.service;
    loginOptions = loginOptions || this.loginOptions;

    if(!service) throw new Error('service is not set');
    if(!loginOptions) throw new Error('loginOptions is not set');
    if(!availableServices.includes(service))throw new Error(`The service ${service} is not supported`);

    loginOptions.loginMethod = 'redirect';

    return await this.login(service, loginOptions);
  }

  async handleRedirection(service, loginOptions) {
    service = service || this.service;
    loginOptions = loginOptions || this.loginOptions;
    
    // Input validation
    if(!service) throw new Error('service cannot be empty');

    // Get the serviceObject
    const serviceObject = getServiceObject(service);

    // Attempt to handle a redirection event
    if(serviceObject.handleRedirection) {
      // Get the token
      const token = await serviceObject.handleRedirection(loginOptions);
      if(!token) throw new Error('Login was attempted but no token was received');

      // Save the token to the cache
      setToken(service, 'login', this.cacheLocation, token);
      return token;
    }
  }
}