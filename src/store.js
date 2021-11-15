/*
  Import and setup dependencies
*/
import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import AppError from './lib/vtfk-errors/AppError';

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
    async getPDFPreview(context, data) {
      // Define the requiest
      const request = {
        url: 'http://localhost:3001/api/v1/generatepdf',
        method: 'post',
        data: data
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
          url: 'https://test-func-masseutsendelse.azurewebsites.net/api/getdispatches',
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
    async getTemplates(context) {
      try {
        // Define the request
        const request = {
          url: 'http://templates.vtfk.no/api/v1/templates',
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
      
    }
  }
})

// Export the store
export default store;