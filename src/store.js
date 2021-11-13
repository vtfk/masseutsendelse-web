/*
  Import and setup dependencies
*/
import Vue from 'vue'
import Vuex from 'vuex'

// Configure vue to use Vuex
Vue.use(Vuex)

/*
  Vuex store implementation
*/
const store = new Vuex.Store({
  state: {
    modalError: undefined
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
    resetModalError (state) {
      state.modalError = undefined;
    }
  }
})

// Export the store
export default store;