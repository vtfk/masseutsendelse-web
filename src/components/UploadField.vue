<template>
<div class="container">
      <!--UPLOAD-->
      <form enctype="multipart/form-data" novalidate v-if="!isInitial || isSaving">
        <h2>Last opp polygonet</h2>
        <div class="dropbox">
          <input type="file" :name="uploadFieldName" :disabled="isSaving" @change="filesChange($event.target.name, $event.target.files);"
             class="input-file">
            <p v-if="!isInitial">
              Dra filen og slipp den i feltet<br> eller trykk i feltet for å laste opp
            </p>
            <p v-if="isSaving">
              Laster opp {{ uploadFieldName }} fil...
            </p>
        </div>
        <div v-if="isSuccess">
        <h2>Filen er lastet opp</h2>
        <p>
          <a href="javascript:void(0)" @click="reset()">Last opp en ny fil.</a>
        </p>
        <ul class="list-unstyled">
            <img :src="item.url" class="img-responsive img-thumbnail" :alt="item.originalName">
        </ul>
      </div>
      <!--FAILED-->
      <div v-if="isFailed">
        <h2>Obs noe gikk galt :(</h2>
        <p>
          <a href="javascript:void(0)" @click="reset()">Prøv igjen</a>
        </p>
        <pre>{{ uploadError }}</pre>
      </div>
      </form>
</div>
</template>

<script>


export default {
  name: 'UploadField',
  data() {
    return {
    }
  }
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