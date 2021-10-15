<template>
  <div>
    <h2>Last opp polygonet</h2>
    <div :class="dropboxClasses" @click="(e) => onAddFileFromButton(e)" @drop.prevent="onAddFileFromDaD" @dragover.prevent="isDropAreaDraggedOver = true" @dragleave.prevent="isDropAreaDraggedOver = false">
      <input type="file" id="fileInput" ref="filesfrombutton" style="display: none" multiple @change="onFilesChanged">
      <p v-if="error !== undefined" class="typography paragraph error" role="alert" aria-live="assertive">
        En feil har skjedd<br>
        {{error}}
      </p>
      <p v-else-if="files.length == 0">
        Dra filen og slipp den i feltet<br> eller trykk i feltet for å laste opp
      </p>
      <div v-else style="height: 100%;">
        <h2>Filen er lastet opp</h2>
        <VTFKButton style="flex: 0 1 auto;" id="resetBtn" :passedProps="{onClick: (e) => {reset(e)}}">Reset</VTFKButton>
      </div>
    </div>
  </div>
</template>

<script>
// VTFK komponenter
import { Button } from '@vtfk/components'

export default {
  name: 'UploadField',
  components: {
    'VTFKButton': Button
  },
  data() {
    return {
      files: [],
      currentStatus: null,
      uploadFieldName: 'file',
      isUploading: true,
      error: undefined,
      isDropAreaDraggedOver: false
    }
  },
  computed: {
    dropboxClasses() {
      var classes = {}
      if(this.isDropAreaDraggedOver) {
        classes['dropbox'] = true;
        classes['dropbox-dragged-over'] = true;
      } else {
        classes['dropbox'] = true;
        classes['dropbox-dragged-over'] = false;
      }
      return classes;
    },
  },
  methods: {
    reset() {
      this.files = [];
      this.error = undefined;
    },
    AddFiles(files) {
      if(!files) return;

      let foundError = false;
      ([...files]).forEach(file => {
        // Check if the file is already added to the array
        this.files.forEach(existingFile => {
          if(existingFile.name == file.name && existingFile.size == file.size) {
            alert("The file is already added");
            foundError = true;
          }
        })
        if(foundError) { return; }
          var fileObject = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            lastModifiedDate: file.lastModifiedDate,
            progress: 0,
            data: file
          }
          this.files.push(fileObject);
      })

      // Emit the uploaded filedata to the parent
      this.$emit('uploaded', this.files);
    },
    onAddFileFromButton(e) {
      if(!e) { return; }
      if(!e.target) { return;}
      if(e.target.id == 'resetBtn' || e.target.id == 'fileInput') { return; }
      console.log(e)
      // Find input and click it to start the file upload
      let input = document.getElementById('fileInput');
      if(input) {
        input.click();
      }
    },
    onAddFileFromDaD(e) {
    // this.isDropAreaDraggedOver = false;
      if(!e) { return; }
      if(!e.dataTransfer) { return;}
      if(!e.dataTransfer.files) { return;}

      this.AddFiles(e.dataTransfer.files);
    },
    onFilesChanged(e) {
      if(!e) { return; }
      if(!e.target) { return;}
      if(!e.target.files) { return;}

      this.AddFiles(e.target.files);
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
    border-radius: 20px;
  }

  .dropbox-dragged-over {
    background: lightblue; 
  }

  .dropbox p {
    font-size: 1.2em;
    text-align: center;
    padding: 50px 0;
  }
</style>