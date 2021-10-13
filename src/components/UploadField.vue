<template>
<div class="container">
      <form enctype="multipart/form-data" novalidate v-if="isInitial">
        <h2>Last opp polygonet</h2>
        <div class="dropbox">
          <input type="file" 
          :name="uploadFieldName"
             class="input-file">
            <p v-if="isInitial">
              Dra filen og slipp den i feltet<br> eller trykk i feltet for å laste opp
            </p>
        </div>
          <div v-if="isSuccess">
          <h2>Filen er lastet opp</h2>
          <p>
          <a href="javascript:void(0)" @click="reset()">Last opp en ny fil.</a>
        </p>
      </div>
      </form>
</div>
</template>

<script>


const STATUS_INITIAL = 0, STATUS_SUCCESS = 1
export default {
  name: 'UploadField',
  data() {
    return {
      uploadedFiles: [],
      currentStatus: null,
      uploadFieldName: 'file',
    }
  },
  computed: {
      isInitial() {
        return this.currentStatus === STATUS_INITIAL;
      },
      isSuccess() {
        return this.currentStatus === STATUS_SUCCESS;
      },
    },
    methods: {
      reset() {
        // reset form to initial state
        this.currentStatus = STATUS_INITIAL;
        this.uploadedFiles = [];
        this.uploadError = null;
      },
    },
    mounted() {
      this.reset();
    },
}

</script>

<style scoped>
.dropbox {
    outline: 2px dashed grey; /* dash box */
    outline-offset: -10px;
    background: #D1EAE9;
    color: dimgray;
    padding: 10px 10px;
    min-height: 200px; 
    position: relative;
    cursor: pointer;
  }

  .input-file {
    opacity: 0; 
    width: 100%;
    height: 200px;
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    
  }

  .dropbox:hover {
    background: lightblue; 
  }

  .dropbox p {
    font-size: 1.2em;
    text-align: center;
    padding: 50px 0;
  }
</style>