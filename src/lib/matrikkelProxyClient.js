/*
  Import dependencies
*/
import config from '../../config';
import axios from "axios";
import AppError from './vtfk-errors/AppError';
import { removeKeys } from '@vtfk/utilities';

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
    if(options && options.query) {
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

  async getMatrikkelEnheterFromPolygon(polygon, matrikkelContext) {
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
        koordinatsystemKodeId: 10,
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
      data: {
        items: items
      }
    }

    // Make the request
    let response =  await this.makeRequest(request, options, matrikkelContext)

    // Return the respose
    return response.data;
  }

  /**
    * Will attempt to get the type of a provided object if it is not flattened
    * @param {Item} Item - An object returned from the MatrikkelAPI
  */ 
   static getItemType(Item) {
    if(!Item) { return undefined; }

    if(Item._type || Item.type) {
      return Item._type || Item.type;
    }

    return 'unknown';
  }

  /**
    * Will attempt to get the real value of a property
    * Example test: { value: 'actual value' } will return 'actual value'
    * @param {Item} Item - An object returned from the MatrikkelAPI
  */ 
  static getItemValue(Item) {
    if(!Item) { return; }
    
    if(Item.value) {
      return Item.value
    }
    else if(Object.keys(Item).length === 1) {
      return Item[Object.keys(Item)[0]]
    } else if (Object.keys(Item).length === 3 && Item._type && Item._namespace) {
      let key = Object.keys(Item).find((k) => k !== '$');
      if(key) { return Item[key]; }
    }
    
    return Item;
  }
  
  /**
   * 
   * @param {Object} data Data object containing MatrikkelEnheter
   */
  static getMatrikkelEnheterOwnerCentric(matrikkelUnits, matrikkelOwners) {
    if(!matrikkelUnits) throw new AppError('MatrikkelEnheter missing', 'No MatrikkelEnheter is provided');

    // Object to store
    let returnedOwners = {};

    // Loop through units as they contains the owner information
    for(let unit of matrikkelUnits) {
      if(unit.eierforhold) {
        unit.eierforhold.forEach((ownership) => {

          // Retreive the owner for the ownership
          const owner = matrikkelOwners.find((o) => o.id.value === ownership.eierId);
          if(!owner) throw new AppError('Kunne ikke finne eier til eierskap', `Eier med id ${ownership.eierforhold} kunne ikke finnes for ${unit.bruksnavn}`)
  
          // Add the owner to the returnedOwners object if not already exists
          if(!returnedOwners[ownership.eierId]) {
            returnedOwners[ownership.eierId] = {...owner, ownerships: [] }
            if(owner.id.value) returnedOwners[ownership.eierId].id = owner.id.value;
          }
  
          // Push the ownership to the owner
          returnedOwners[ownership.eierId].ownerships.push({
            ...ownership,
            unit: removeKeys(unit, ['eierforhold'])
          })
        })
      }
    }

    // Convert from object to array
    let ownerArray = [];
    for(const key in returnedOwners) ownerArray.push(returnedOwners[key]);

    // Return the array
    return ownerArray;
  }
} 