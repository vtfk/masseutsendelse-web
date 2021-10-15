<template>
    <div style="width: 100%; height:100%;">
        <VTFKButton :passedProps="{onClick: onClick}">Tidligere opplastninger</VTFKButton>
        <VTFKModal title="Tidligere opplastninger" :open="isShowModal" :onDismiss="() => { this.isShowModal = false }" style="z-index: 1000;">
                    <ag-grid-vue style="width: 100px; height:100%;"
                    class="ag-theme-material"
                    :columnDefs="columnDefs"
                    :rowClassRules="rowClassRules"
                    :rowData="rowData"
                    @first-data-rendered="onFirstDataRendered">
                    </ag-grid-vue>
        </VTFKModal>
        
    </div>
</template>



<script>
import { AgGridVue } from "ag-grid-vue";
import { AllCommunityModules } from '@ag-grid-community/all-modules';

import { Button, Modal } from '@vtfk/components'


export default {
    name: 'TableBtnModal',
    components: {
        'VTFKButton': Button,
        'VTFKModal': Modal,
        AgGridVue,
    },
    data() {
        return {
        isShowModal: false,
        columnDefs: null,
        rowData: null,
        rowClassRules: null,
        modules: AllCommunityModules,
        }
    },
    methods: {
        onClick() {
        this.isShowModal = !this.isShowModal;
        }
    },
    beforeMount() {
    this.columnDefs = [
      { field: "Prosjekt", sortable: true, filter: true, checkboxSelection: true},
      { field: "ProsjektNr", sortable: true, filter: true},
      { field: "Dato", sortable: true, filter: true, flex: 1},
     // { field: "Status", sortable: true, filter: true, width: 221},
     // { field: "Oppretshaver", sortable: true, filter: true, width: 221},
     // { field: "Filnavn", sortable: true, filter: true, width: 221},
    ];
    this.rowClassRules = {
    'rag-green-outer': function(params) { return params.data.ProsjektNr === 4 }
    }
    this.rowData = [
        //fetch('https://www.ag-grid.com/example-assets/small-row-data.json')
        //.then(result => result.json())
        //.then(rowData => this.rowData = rowData);
      { Prosjekt: "Ulefoss", ProsjektNr: 1, Dato: "01.01.2021", Status: "Godkjent", Oppretshaver: "Per Pear", Filnavn: "Ulefoss polygon.dfx" },
      { Prosjekt: "Bø", ProsjektNr: 2, Dato: "01.01.2021", Status: "Sendt", Oppretshaver: "Per Pear", Filnavn: "Bø polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 3, Dato: "01.01.2021", Status: "Til Behandling", Oppretshaver: "Per Pear", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "04.01.2021", Status: "Godkjent", Oppretshaver: "Per Pear", Filnavn: "Tønsberg polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "05.01.2021", Status: "Sendt", Oppretshaver: "Per Pear", Filnavn: "Tønsberg_2 polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 5, Dato: "12.01.2021", Status: "Ikke Godkjent", Oppretshaver: "Per Pear", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 6, Dato: "13.01.2021", Status: "Til Behandling", Oppretshaver: "Per Pear", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Gvarv", ProsjektNr: 7, Dato: "15.01.2021", Status: "Godkjent", Oppretshaver: "Per Pear", Filnavn: "Gvarv polygon.dfx" },
    ];
    
  },
}
</script>

<style scoped>
    @import "~ag-grid-community/dist/styles/ag-grid.css";
    @import "~ag-grid-community/dist/styles/ag-theme-material.css";
</style>
