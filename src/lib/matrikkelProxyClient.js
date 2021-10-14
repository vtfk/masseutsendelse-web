/*
  Import dependencies
*/
import config from '../../config';
import axios from "axios";

export default class MatrikkelProxyClient {
  constructor(APIBaseURL, APIKey, ClientId) {
    this.apiBaseUrl = APIBaseURL || config.MATRIKKELPROXYAPI_BASE_URL;
    this.apiKey = APIKey || config.MATRIKKELPROXYAPI_APIKEY;
    this.clientId = ClientId || config.MATRIKKELPROXYAPI_CLIENTID;

    // Create a matrikkelContext that can be used if none is provided to the functions
    this.matrikkelContext = {
      klientIdentifikasjon: this.clientId
    }

    if(!this.apiBaseUrl) { throw new Error('APIBaseURL cannot be empty'); }
    if(!this.apiKey) { throw new Error('APIKey cannot be empty'); }
    if(!this.clientId) { throw new Error('Client ID cannot be empty'); }
  }

  async makeRequest(request, options, matrikkelContext) {
    // Input validation
    if(!request) { throw new Error('request cannot be empty'); }

    // Apply query options to the request if specified
    if(options.query) {
      let addingFirstQuery = false;
      if(!request.url.includes('?')) {
        request.url += '?';
        addingFirstQuery = true;
      }
      
      for(let query in options.query) {
        if(options.query[query] !== undefined) {
          let add = '';
          if(!addingFirstQuery) { add = '&' }
          if(addingFirstQuery) { addingFirstQuery = false; }
          add += query + '=' + options.query[query];
          request.url += add;
        }
      }
    }

    // Determine what MatrikkelContext to use
    if(matrikkelContext) {
      request.data.matrikkelContext = matrikkelContext
    } else {
      request.data.matrikkelContext = this.matrikkelContext;
    }

    // Make the request
    let response =  await axios.request(request);

    // Return the full response
    return response;
  }

  async getMatrikkelEnheter(polygon, matrikkelContext) {
    if(!polygon) { throw new ('Polygon cannot be empty'); }
    
    // Construct the request
    let request = {
      method: 'post',
      url: this.apiBaseUrl + 'api/v1/matrikkelenheter',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      data: {
        polygon: polygon,
      }
    }

    // Make the request
    let response =  await this.makeRequest(request, matrikkelContext)

    // Return the respose
    return response.data;
  }

  async getStoreItems(items, options, matrikkelContext) {
    // Input validation
    if(!items) { throw new ('items cannot be empty'); }

    // Construct the request
    let request = {
      method: 'post',
      url: this.apiBaseUrl + 'api/v1/store',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json'
      },
      data: items
    }

    // Make the request
    let response =  await this.makeRequest(request, options, matrikkelContext)

    // Return the respose
    return response.data;
  }

}