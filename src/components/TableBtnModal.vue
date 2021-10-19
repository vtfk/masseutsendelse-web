<template>
    <div >
        <VTFKButton :passedProps="{onClick: onClick}">Tidligere opplastninger</VTFKButton>
        <VTFKModal title="Tidligere opplastninger" :open="isShowModal" :onDismiss="() => { this.isShowModal = false }" style="z-index: 1000;">
            <div style="display: flex; flex-direction: row; justify-content: space-between; margin-left: 2rem; margin-right:2rem;">
                <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => clearFilters() }"
                >Reset filter
                </VTFKButton>
                <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => clearSelection() }"
                >Fjern valg
                </VTFKButton>
                <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => saveEdit() }"
                >Lagre Endring
                </VTFKButton>
                <EditBtnModal/>
                <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => viewDocument() }"
                >Se Brev
                </VTFKButton>
                <VTFKButton 
                type='secondary' size='small' style="padding-bottom: 1rem;"
                :passedProps="{ onClick: () => viewMap() }"
                >Se kart
                </VTFKButton>
            </div>
            <div class="typography heading-four" 
                style="padding-bottom: 1rem;">
                    Markerte rader:
                    <span id="selectedRows"></span>
                </div>
            <div class="modal-content" style="margin-top: -4.5rem;"> 
                <!-- <ag-grid-vue style="width: 100%; height:100%; margin-left: 3rem; background-color:blue;"
                class="ag-theme-material"
                id="gamleFiler"
                :overlayLoadingTemplate="overlayLoading"
                :overlayNoRowsTemplate="overlayNoRows"
                :columnDefs="columnDefs"
                :animateRows="true"
                @grid-ready="onGridReady"
                :modules="modules"
                :editType="editType"
                :rowData="rowData"
                :rowSelection="rowSelection"
                @selection-changed="onSelectionChanged"
                @cell-value-changed="onCellValueChanged"
                @row-value-changed="onRowValueChanged"
                >
                </ag-grid-vue> -->
            </div>
        </VTFKModal>
    </div>
</template>

<script>
// AG-Grid 
// import { AgGridVue } from "ag-grid-vue";
// import { AllCommunityModules } from '@ag-grid-community/all-modules';

//VTFK komponenter
import { Button, Modal } from '@vtfk/components'

//Modal
// import EditBtnModal from './EditBtnModal.vue'

export default {
    name: 'TableBtnModal',
    components: {
        'VTFKButton': Button,
        'VTFKModal': Modal,
        // AgGridVue,
        // EditBtnModal
    },
    data() {
        return {
        isShowModal: false,
        columnDefs: null,
        rowData: null,
        rowClassRules: null,
        rowSelection: null,
        // modules: AllCommunityModules,
        }
    },
    methods: {
        onClick() {
            this.isShowModal = !this.isShowModal;
        },
        clearFilters() {
            if (this.gridApi.isColumnFilterPresent() != true){
                console.log("Det er ikke satt noen filter")
            }
            else{
                this.gridApi.setFilterModel(null);
            }
        },

        //Funksjnoer som kan være nyttige men som ikke har fått en knapp.
        clearSelection() {
            this.gridApi.deselectAll()
        },
        //Returnere alle valgte rader i en array. 
        getSelection() {
            console.log(this.gridApi.getSelectedRows())
        },

        //Redigerer en rad
        saveEdit() {
            this.gridApi.stopEditing();
        },
        onCellValueChanged(event) {
            console.log(
                'onCellValueChanged: ' + event.colDef.field + ' = ' + event.newValue
            );
        },
        onRowValueChanged(event) {
        var data = event.data;
            console.log(
                'onRowValueChanged: (' +
                data.Prosjekt +
                ', ' +
                data.ProsjektNr +
                ', ' +
                data.Dato +
                ', ' +
                data.Status +
                ', ' +
                data.Oppretshaver +
                ', ' +
                data.Filnavn +
                ')'
            );
        },

        viewDocument() {
            //TODO
        },

        viewMap(){
            //TODO
        },

        onSelectionChanged() {
        var selectedRows = this.gridApi.getSelectedRows();
        var selectedRowsString = ''
        var maxToShow = 5
        selectedRows.forEach(function (selectedRow, index) {
            if (index >= maxToShow) {
            return;
            }
            if (index > 0) {
            selectedRowsString += ', '
            }
            selectedRowsString += selectedRow.Prosjekt;
        });
        if (selectedRows.length > maxToShow) {
            var othersCount = selectedRows.length - maxToShow;
            selectedRowsString +=
            ' og ' + othersCount + ' til. ' // (othersCount !== 1 ? 's' : '')
        }
        document.querySelector('#selectedRows').innerHTML = selectedRowsString;
        },
        onGridReady(params) {
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        }
    },

    beforeMount() {
    this.rowSelection = 'multiple';
    this.editType = 'fullRow';
    this.overlayLoading =
        '<span class="ag-overlay-loading-center">Vennligst vent mens radene lastes inn.</span>'; //Spinner?
    this.overlayNoRows = 
        '<span class="typography heading-four" style="padding: 10px; border: 2px solid #444; background: #D1EAE9;">Det finnes ingen rader</span>';
  
    this.columnDefs = [
      { field: "Prosjekt", sortable: true, filter: true, flex: 1, editable: true, minWidth: 200},
      { field: "ProsjektNr", sortable: true, filter: true, flex: 1, editable: true, minWidth: 200},
      { field: "Dato", sortable: true, filter: true, flex: 1, minWidth: 200},
      { field: "Status", sortable: true, filter: true, flex: 1, editable: true, minWidth: 200, 
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["Godkjent", "Sendt", "Til Behandling", "Ikke Godkjent"]
        },
        cellStyle: params => {
            if (params.value === "Godkjent") {
                //mark godkjent cells as green
                return {backgroundColor: '#91B99F'};
            }
             if (params.value === "Sendt") {
                //mark sendt cells as orange
                return {backgroundColor: '#D0C788'};
            }
             if (params.value === "Til Behandling") {
                //mark til behandling cells as yellow
                return {backgroundColor: '#E0C38B'};
            }
             if (params.value === "Ikke Godkjent") {
                //mark ikke godkjent cells as red
                return {backgroundColor: '#E7827E'};
            }
            return null;
        },},
      { field: "Oppretshaver", sortable: true, filter: true, flex: 1, editable: true, minWidth: 200},
      { field: "Filnavn", sortable: true, filter: true, flex: 1, minWidth: 200},
    ];
    this.rowData = [
        //fetch('https://www.ag-grid.com/example-assets/small-row-data.json')
        //.then(result => result.json())
        //.then(rowData => this.rowData = rowData);
      { Prosjekt: "Ulefoss", ProsjektNr: 1, Dato: "01.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Ulefoss polygon.dfx" },
      { Prosjekt: "Bø", ProsjektNr: 2, Dato: "01.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Bø polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 3, Dato: "01.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "04.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Tønsberg polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "05.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Tønsberg_2 polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 5, Dato: "12.01.2021", Status: "Ikke Godkjent", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 6, Dato: "13.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Gvarv", ProsjektNr: 7, Dato: "15.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Gvarv polygon.dfx" },
      { Prosjekt: "Ulefoss", ProsjektNr: 1, Dato: "01.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Ulefoss polygon.dfx" },
      { Prosjekt: "Bø", ProsjektNr: 2, Dato: "01.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Bø polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 3, Dato: "01.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "04.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Tønsberg polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "05.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Tønsberg_2 polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 5, Dato: "12.01.2021", Status: "Ikke Godkjent", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 6, Dato: "13.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Gvarv", ProsjektNr: 7, Dato: "15.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Gvarv polygon.dfx" },
      { Prosjekt: "Ulefoss", ProsjektNr: 1, Dato: "01.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Ulefoss polygon.dfx" },
      { Prosjekt: "Bø", ProsjektNr: 2, Dato: "01.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Bø polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 3, Dato: "01.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "04.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Tønsberg polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "05.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Tønsberg_2 polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 5, Dato: "12.01.2021", Status: "Ikke Godkjent", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 6, Dato: "13.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Gvarv", ProsjektNr: 7, Dato: "15.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Gvarv polygon.dfx" },
      { Prosjekt: "Ulefoss", ProsjektNr: 1, Dato: "01.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Ulefoss polygon.dfx" },
      { Prosjekt: "Bø", ProsjektNr: 2, Dato: "01.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Bø polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 3, Dato: "01.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "04.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Tønsberg polygon.dfx" },
      { Prosjekt: "Tønsberg", ProsjektNr: 4, Dato: "05.01.2021", Status: "Sendt", Oppretshaver: "Per", Filnavn: "Tønsberg_2 polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 5, Dato: "12.01.2021", Status: "Ikke Godkjent", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Skien", ProsjektNr: 6, Dato: "13.01.2021", Status: "Til Behandling", Oppretshaver: "Per", Filnavn: "Skien polygon.dfx" },
      { Prosjekt: "Gvarv", ProsjektNr: 7, Dato: "15.01.2021", Status: "Godkjent", Oppretshaver: "Per", Filnavn: "Gvarv polygon.dfx" },
    ];
  },
}
</script>

<style scoped>
    /* @import "~ag-grid-community/dist/styles/ag-grid.css";
    @import "~ag-grid-community/dist/styles/ag-theme-material.css"; */

    /* .ag-theme-material {
        outline: 1px solid lightgrey;
    }

    @media (max-width: 1000px) {
        .ag-theme-material {
            margin-top: 3.5rem;
        }
    } */
</style>
