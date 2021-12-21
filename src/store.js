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

console.log('== Configuration ==');
console.log(config);

/*
  Vuex store implementation
*/
const store = new Vuex.Store({
  state: {
    modalError: undefined,
    previewPDFBase64: undefined,
    isShowGuideModal: false,
    dispatches: undefined,
    templates: undefined,
    loading: undefined,
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
    setLoadingModal (state, loading) {
      if(!loading) return;
      if(!loading.title) loading.title = 'Laster';
      if(!loading.message) loading.message = 'Dette kan ta noen sekunder'
      
      Vue.set(state, 'loading', loading);
    },
    resetLoadingModal (state) {
      state.loading = false;
    },
    setPreviewPDF(state, pdfBase64) {
      state.previewPDFBase64 = pdfBase64
    },
    resetModalError (state) {
      state.modalError = undefined;
    },
    setGuideModal (state) {
      state.isShowGuideModal = true;
    },
    resetGuideModal (state) {
      state.isShowGuideModal = false;
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
      try {
        // Merge data
        let data = merge({attachments: req.attachments}, req.template.data)
        data = merge(data, req.template.documentData)
        // Define the data to send
        let requestData = {
          preview: true,
          attachments: req.attachments,
          template: req.template.template,
          documentDefinitionId: req.template.documentDefinitionId,
          data: data
        }

        context.commit('setLoadingModal', {
          title: 'Laster PDF forhåndsvisning',
          message: 'Dette kan ta noen sekunder'
        })

        // Define the requiest
        const request = {
          url: 'https://api.vtfk.dev/pdf/v1/generatev2',
          method: 'post',
          data: requestData
        }
        // Make the request
        const response = await axios.request(request);
        context.commit('setPreviewPDF', response.data.base64);
        context.commit('resetLoadingModal');
      } catch (err) {
        context.commit('resetLoadingModal');
        context.commit('setModalError', err);
      }
    },
    async getDispatches(context) {
      try {
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches',
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
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/templates?code=DKvd3StKyeztdebOCoDl2bosOg3X2whqFynsG/3T7zHQZp2E6HgHfg==',
          method: 'post',
          data: template
        }
        
        // Set the loading modal
        context.commit('setLoadingModal', {
          title: 'Lagrer',
          message: 'Dette kan ta noen sekunder'
        })
        // Make the request
        await axios.request(request);
        // Get the updated templates
        await context.dispatch('getTemplates');
        // Clear the loading modal
        context.commit('resetLoadingModal');
      } catch (err) {
        context.commit('resetLoadingModal');
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
        // Set the loading modal
        context.commit('setLoadingModal', {
          title: 'Lagrer',
          message: 'Dette kan ta noen sekunder'
        })
        // Make the request
        await axios.request(request);
        // Get the updated templates
        await context.dispatch('getTemplates');
        // Clear the loading modal
        context.commit('resetLoadingModal');
      } catch (err) {
        context.commit('resetLoadingModal');
        return Promise.reject(err);
      }
    },
    async postDispatches(context, data) {
      try {
        // Define the request
        const request = {
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches?code=zxjm63HhIg6ZqUOE8xdHN8NnJmYh9ocBeFMXVxeBjYVFHEjI9amBFw==',
          method: 'post',
          data: data
        }
        // Set the loading modal
        context.commit('setLoadingModal', {
          title: 'Lagrer',
          message: 'Dette kan ta noen sekunder'
        })
        // Make the request
        await axios.request(request);
        // Clear the loading modal
        context.commit('resetLoadingModal');
        context.dispatch('getDispatches');
        return Promise.resolve();
      } catch (err) {
        context.commit('resetLoadingModal');
        context.commit('setModalError', err);
        return Promise.reject(err);
      }
    },
    async editDispatches(context, data) {
      try {
        //Define the request 
        const request = {
          // url:'http://localhost:7071/api/dispatches/' + data._id, 
          url: config.MASSEUTSENDELSEAPI_BASEURL + 'api/dispatches/'+ data._id +'?code=SejmUBQQsdqaduLS0mIBR3MFluZTGdyvxCVkZJibQ6J/bMPaAE4ZqA==',
          method: 'put',
          data: data
        }
        // Set the loading modal
        context.commit('setLoadingModal', {
          title: 'Lagrer',
          message: 'Dette kan ta noen sekunder'
        })
        // Make the request
        await axios.request(request);
        await context.dispatch('getDispatches');
        // Clear the loading modal
        context.commit('resetLoadingModal');
      } catch (err) {
        context.commit('setModalError', err);
        return Promise.reject(err);
      }
    },
    async downloadBlob(context, options) {
      try {
        if(!options) throw new AppError('Options ikke satt', 'Du kan ikke laste ned en fil uten å sende med innstillinger');
        if(!options.dispatchId) throw new AppError('options.dispatchId', 'Du kan ikke laste ned en fil uten å sende med dispatchId');
        if(!options.blobId) throw new AppError('options.dispatchId', 'Du kan ikke laste ned en fil uten å sende med blodId');

        let url = options.url || `${config.MASSEUTSENDELSEAPI_BASEURL}api/blobs/${options.dispatchId}/${options.blobId}/?code=${config.MASSEUTSENDELSEAPI_APICODE}`;
        
        const request = {
          method: 'get',
          url: url,
        }

        const response = await axios.request(request);
        return response.data;
        
      } catch(err) {
        context.commit('setModalError', err);
        return Promise.reject(err);
      }
    }
  }
})

// Export the store
export default store;