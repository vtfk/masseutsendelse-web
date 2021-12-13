<template>
  <div class="wrapper">
    <table v-if="$props.files" style="width: 100%; border-collapse: collapse;">
      <tbody>
        <tr v-for="(file, i) in $props.files" :key="i" class="tableRow">
          <td style="width: 3rem; padding-top: 0.3rem; padding-left: 0.5rem;">
            <file-icon :filename="file.name" />
          </td>
          <td style="padding-left: 0.5rem; text-align: left;">
            {{file.name}}
          </td>
          <td>
            <button class="iconBtn" @click="removeFile(file)"><v-icon>mdi-delete</v-icon></button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import FileIcon from './FileIcon.vue'

export default {
  components: { FileIcon },
  name: 'FileList',
  props: {
    value: {
      type: Array,
    },
    files: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    removeFile(file) {
      if(!file) return;
      if(!confirm(`Er du helt sikker på at du ønsker å fjerne filen ${file.name}?`)) return;

      let tmpFiles = this.$props.value || this.$props.files;
      console.log('Before')
      tmpFiles = tmpFiles.filter((f) => f.name !== file.name);
      console.log('after');

      // Emit what file that should be removed
      this.$emit('removeFiles', file);
      // Update v-model
      this.$emit('input', tmpFiles);
    }
  }
}
</script>

<style>
  .wrapper {
    background-color: #D5E1E5;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
  .iconBtn {
    width: 1.9rem;
    max-width: 1.9rem!important;
    height: 1.9rem;
    font-size: 0.8rem;
    border-radius: 50%;
    background-color: #FAFAFA;
    box-shadow: 0 3px 1px -2px rgba(0,0,0,.2),0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12)!important;
    transition: background-color 0.1s;
  }

  .iconBtn:hover {
    background-color: #EFEFEF;
  }

  table {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  table tr:last-child td:first-child {
    border-bottom-left-radius: 10px;
  }

  table tr:last-child td:last-child {
    border-bottom-right-radius: 10px;
  }

  .tableRow:nth-child(even) {
    background-color: #BACDD4;
  }

</style>