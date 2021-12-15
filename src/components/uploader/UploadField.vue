<template>
  <div>
    <div :class="dropboxClasses" @click="(e) => onAddFileFromButton(e)" @drop.prevent="onAddFileFromDaD" @dragover.prevent="isDropAreaDraggedOver = true" @dragleave.prevent="isDropAreaDraggedOver = false">
      <input type="file" id="fileInput" ref="filesfrombutton" style="display: none" multiple @change="onFilesChanged">
      <div v-if="error !== undefined" class="typography paragraph error" role="alert" aria-live="assertive">
        En feil har skjedd<br>
        {{error}}
      </div>
      <div style="display: flex; align-items: center; flex-direction: column; margin-top: 1rem; margin-bottom: 0.5rem; gap: 1rem">
        <img :src="require('@/assets/icons/upload.svg')" style="width: 100px;" />
        Dra og slipp eller trykk i feltet for å laste opp fil
        <VTFKButton v-if="availableFiles.length > 0 && $props.showReset" style="flex: 0 1 auto;" id="resetBtn" :passedProps="{onClick: (e) => {reset(e)}}">Reset</VTFKButton>
      </div>
    </div>
    <!-- File list -->
    <file-list v-if="availableFiles.length > 0 && $props.showList"
      :files="availableFiles"
      :downloadBaseUrl="$props.downloadBaseUrl"
      style="margin-top: -1rem; padding-top: 1.5rem"
      @removeFiles="(e) => removeFiles(e)"
      @downloadBlob="(e) => $emit('downloadBlob', e)"
    />
  </div>
</template>

<script>
// VTFK komponenter
import { Button } from '@vtfk/components'
import FileList from './FileList.vue';

/*
  Function
*/
async function readFile(file) {
  // Always return a Promise
  return new Promise((resolve, reject) => {
    let content = '';
    const reader = new FileReader();
    // Wait till complete
    reader.onloadend = function(e) {
      content = e.target.result;
      // const result = content.split(/\r\n|\n/);
      resolve(content);
    };
    // Make sure to handle error states
    reader.onerror = function(e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}

async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();                  // Create the reader
    reader.onloadend = () => resolve(reader.result);  // onLoaded event for the reader
    reader.onerror = (e) => reject(e);                // onError event for the reader
    reader.readAsDataURL(file);                       // Start the reader
  });
}

export default {
  name: 'UploadField',
  components: {
    'VTFKButton': Button,
    FileList
  },
  props: {
    value: {
      type: Array,
    },
    files: {
      type: Array,
    },
    multiple: {
      type: Boolean,
      default: false
    },
    showReset: {
      type: Boolean,
      default: false
    },
    showList: {
      type: Boolean,
      default: true
    },
    downloadBaseUrl: {
      type: String
    }
  },
  data() {
    return {
      currentStatus: null,
      uploadFieldName: 'file',
      isUploading: true,
      error: undefined,
      isDropAreaDraggedOver: false
    }
  },
  computed: {
    availableFiles() {
      return this.$props.value || this.$props.files || [];
    },
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
      this.$emit('input', [])
      this.error = undefined;
    },
    async AddFiles(files) {
      if(!files) return;
      // If the files is an FileList, convert it to an array so it can be iterated
      if(files.constructor && files.constructor.name === 'FileList') files = [...files];
      // If files is not an array
      if(!Array.isArray(files)) files = [files];

      let tmpFiles = [];
      if(this.$props.value) JSON.parse(JSON.stringify(this.$props.value));
      else if(this.$props.files) JSON.parse(JSON.stringify(this.$props.files));

      let foundError = false;
      for(const file of files) {
        // Check if the file is already added to the array
        this.availableFiles.forEach(existingFile => {
          if(existingFile.name == file.name) {
            alert("The file is already added");
            foundError = true;
          }
        })
        if(foundError) { return; }

        // Read the file
        let fileData = await readFile(file);
        let fileDataUrl = await readFileAsDataURL(file);

        var fileObject = {
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          lastModifiedDate: file.lastModifiedDate,
          base64: Buffer.from(fileData).toString('base64'),
          data: fileData,
          dataUrl: fileDataUrl,
        }
        tmpFiles.push(fileObject);
      }
      
      // Reset dragged over
      this.isDropAreaDraggedOver = false;
      // Emit the uploaded filedata to the parent
      this.$emit('uploaded', tmpFiles);
      // Update the v-model
      this.$emit('input', tmpFiles);
    },
    onAddFileFromButton(e) {
      if(!e) { return; }
      if(!e.target) { return;}
      if(e.target.id == 'resetBtn' || e.target.id == 'fileInput') { return; }
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
    },
    removeFiles(files) {
      if(!files) return;
      if(!Array.isArray(files)) { files = [files]; }

      let idsToRemove = files.map((f) => f.name);

      let currentFiles = this.$props.value || this.files;

      let newFiles = currentFiles.filter((f) => !idsToRemove.includes(f.name));

      this.$emit('removeFiles', files);
      this.$emit('input', newFiles);
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
    display: flex;
    justify-content: center;
    box-shadow: 0px 1px 5px -1px #888888;
  }

  .dropbox-dragged-over {
    background: lightblue;
    outline-color: aliceblue;
  }

  .dropbox p {
    font-size: 1.2em;
    text-align: center;
    padding: 50px 0;
  }

  .filesList {
    display: flex;
    gap: 1rem;
  }
</style>