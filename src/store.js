/*
  Import and setup dependencies
*/
import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import AppError from './lib/vtfk-errors/AppError';
import config from '../config';
import merge from 'lodash.merge';

// Configure vue to use Vuex
Vue.use(Vuex)

/*
  Vuex store implementation
*/
const store = new Vuex.Store({
  state: {
    modalError: undefined,
    previewPDFBase64: undefined,
    dispatches: undefined,
    templates: undefined
  },
  mutations: {
    setModalError (state, error) {
      let err = error;
      // Unpack the error object
      Object.getOwnPropertyNames(err).forEach((key) => {
        err[key] = error[key];
      })

      if(error.response && error.response.data) err = err.response.data;
      state.modalError = err;
    },
    setPreviewPDF(state, pdfBase64) {
      state.previewPDFBase64 = pdfBase64
    },
    resetModalError (state) {
      state.modalError = undefined;
    },
    setDispatches (state, dispatches) {
      state.dispatches = dispatches;
    },
    setTemplates (state, templates) {
      state.templates = templates;
    }
  },
  actions: {
    async getPDFPreview(context, req) {
      // Define the data to send
      let requestData = {
        preview: true,
        template: req.template.template,
        documentDefinitionId: req.template.documentDefinitionId,
        data: {
          test: 'test',
          ...merge(req.template.data, req.template.documentData),
        }
      }

      console.log('== Requesting PDF ==');
      console.log(requestData)
      // Define the requiest
      const request = {
        url: 'https://api.vtfk.dev/pdf/v1/generatev2',
        method: 'post',
        data: requestData
      }
      // Make the request
      axios.request(request)
      .then((response) => {
        context.commit('setPreviewPDF', response.data.base64)
      })
      .catch((err) => {
        context.commit('setModalError', err)
      })
    },
    async getDispatches(context) {
      try {
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches/',
          method: 'GET',
        }
        // Reset the data
        context.commit('setDispatches', undefined);
        // Make the request
        const response = await axios.request(request);

        if(!response || !response.data) throw new AppError('Kunne ikke laste utsendelser', 'Serveren svarte, men finner ikke data i svaret');

        // Commit and return the data
        context.commit('setDispatches', response.data);
        return response.data;
      } catch (err) {
        return Promise.reject(err)
      }
    },
    async getDispatchesById(context, id) {
      try {
        //Define the request
        const request= {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches/' + id + '?code=1pcYSPPawrq0FGkzGTwsaLkgmmy3fvRej9ujdDfwXZ17/9bDvFZspQ==',
          method: 'GET',
          data: id,
        }
        //Make the request
        const response = await axios.request(request)
        if (!response || !response.data) throw new AppError ('Kunne ikke laste utsendelse', 'Serveren svarte med finner ikke utsendelsen i svaret')
        //Return the data
        return response.data
      } catch(err) {
        return Promise.reject(err)
      }
    },
    async getTemplates(context) {
      try {
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/templates?code=DKvd3StKyeztdebOCoDl2bosOg3X2whqFynsG/3T7zHQZp2E6HgHfg==',
          method: 'get'
        }
        // Reset the data
        context.commit('setTemplates', undefined);
        // Make the request
        const response = await axios.request(request);
        if(!response || !response.data) throw new AppError('Kunne ikke laste maler', 'Serveren svarte, men finner ingen maler i svaret');
        // Commit and return the data
        context.commit('setTemplates', response.data);
        return response.data;
      } catch (err) {
        return Promise.reject(err);
      }
    },
    async postTemplate(context, template) {
      try {
        console.log('== Posting template ==');
        console.log(template);
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/templates?code=DKvd3StKyeztdebOCoDl2bosOg3X2whqFynsG/3T7zHQZp2E6HgHfg==',
          method: 'post',
          data: template
        }
        // Make the request
        await axios.request(request);
        // Get the updated templates
        await context.dispatch('getTemplates');
      } catch (err) {
        return Promise.reject(err);
      }
    },
    async putTemplate(context, template) {
      try {
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/templates/' + template._id + '?code=DKvd3StKyeztdebOCoDl2bosOg3X2whqFynsG/3T7zHQZp2E6HgHfg==',
          method: 'put',
          data: template
        }
        // Make the request
        await axios.request(request);
        // Get the updated templates
        await context.dispatch('getTemplates');
      } catch (err) {
        return Promise.reject(err);
      }
    },
    async postDispatches(context, data) {
      // Define the request
      const request = {
        url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches?code=zxjm63HhIg6ZqUOE8xdHN8NnJmYh9ocBeFMXVxeBjYVFHEjI9amBFw==',
        method: 'post',
        data: data
      }
      // Make the request
      try {
        await axios.request(request);
        context.dispatch('getDispatches');
      } catch (err) {
        context.commit('setModalError', err);
        return Promise.reject(err);
      }
    },
    async editDispatches(context, data) {
      //Define the request 
      const request = {
        // url:'http://localhost:7071/api/dispatches/' + data._id, 
        url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches/'+ data._id +'?code=SejmUBQQsdqaduLS0mIBR3MFluZTGdyvxCVkZJibQ6J/bMPaAE4ZqA==',
        method: 'put',
        data: data
      }
      console.log(data._id)
      // Make the request
      try {
        await axios.request(request);
        await context.dispatch('getDispatches');
      } catch (err) {
        context.commit('setModalError', err);
        return Promise.reject(err);
      }
    }
  }
})

// Export the store
export default store;