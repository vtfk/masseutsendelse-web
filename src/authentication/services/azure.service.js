/*
  Import dependencies
*/
import * as msal from "@azure/msal-browser";

/*
  Declarations
*/
let _instance = undefined;   // The msal instance, it is reused if already created

/*
  Private functions
*/
/**
 * 
 * @param {*} options 
 * @returns {msal.PublicClientApplication}
 */
function createInstance(options) {
  console.log('Creating instance');
  console.log(_instance);
  // Just return the instance if already created
  if(_instance && options.force !== true) return _instance;

  console.log('Creating instance with options');
  console.log(options);

  // Create the instance
  _instance = new msal.PublicClientApplication(options);

  // Return the instance
  return _instance;
}

/*
  Public functions
*/
/**
 * Logs in with this provider
 * @param {object} options 
 */
export async function login (options) {
  // Input validation
  if(!options) throw new Error('Options cannot be empty');

  // Create the instance
  const client = createInstance(options);

  try {
    return await client.ssoSilent(options);
  } catch {
    return await client.loginPopup(options);
  }
}

/**
 * Login by redirecting
 */
 export async function loginRedirect (options) {
  // Input validation
  if(!options) throw new Error('Options cannot be empty');

  // Create the instance
  const client = createInstance(options);
  console.log('== Login by redirection ==');
  try {
    return await client.ssoSilent(options);
  } catch {
    return await client.loginRedirect(options);
  }
}

/**
 * Handle redirection event
 */
 export async function handleRedirection (loginOptions) {
  if(!loginOptions) throw new Error('loginOptions cannot be empty');
  
  // Create the instance
  const client = createInstance(loginOptions);
  const result = await client.handleRedirectPromise();
  return result;
}