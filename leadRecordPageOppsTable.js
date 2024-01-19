import { LightningElement, track, api, wire } from 'lwc';
import displayOpps from '@salesforce/apex/LeadController.displayOpps';
import Name_Field from '@salesforce/schema/Opportunity.Name';
import StageName_Field from '@salesforce/schema/Opportunity.StageName';
import Amount_Field from '@salesforce/schema/Opportunity.Amount';
import CloseDate_Field from '@salesforce/schema/Opportunity.CloseDate';
import Email_Field from '@salesforce/schema/Opportunity.Email__c';
import { NavigationMixin } from 'lightning/navigation';
import Id from '@salesforce/schema/Opportunity.Id';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const actions = [
    {label : 'View', name: 'view'},
    {label : 'Edit', name:'edit'}
];


const columns = [
    {label:'Name', fieldName: 'ClickId', type:'url', typeAttributes: {label: {fieldName: Name_Field.fieldApiName}, target:'_blank'}},
    {label:'Stage', fieldName: StageName_Field.fieldApiName, editable: true, hideLabel: true},
    {label: 'Amount', fieldName: Amount_Field.fieldApiName, editable: true},
    {label: 'Close Date', fieldName: CloseDate_Field.fieldApiName, editable: true},
    {
        type:'action',
        typeAttributes: { rowActions: actions}
    },
    {
      label:'HardId', fieldName: 'HardId'
    }
]

export default class LeadRecordPageOppsTable extends NavigationMixin(LightningElement) {

    @track oppName;
    @track filteredOpps = [];
    @api recordId;
    columns = columns;
    @track data = [];
    @track allOpps = [];
    @track draftValues = [];
    @track wiredResult
    @track refreshWireResult

    connectedCallback(){

    }

    @wire(displayOpps, { recordId : '$recordId'} )
    wiredData( result ) {

      this.refreshWireResult = result;
        if(result.data) {

            result.data=result.data.map( item => ({...item, HardId: `${item.Id}`, ClickId:`/${item.Id}`}));
            this.data = result.data;
            this.allOpps = result.data;
            this.error = undefined;
            this.wiredResult = result.data;
        }

        else if(result.error) {
            this.data = undefined;
            this.error = error;
            console.log('There is an issue');
        }
    }

    handleInputChange(event) {
        this.oppName = event.detail.value;

        this.wiredResult = this.allOpps.filter( item => item['Name'].toLowerCase().includes(this.oppName));

    }

    async handleSave(event) {
      // Convert datatable draft values into record objects
      const records = event.detail.draftValues.slice().map((draftValue) => {
        const fields = Object.assign({}, draftValue);
        return { fields };
      });
  
      // Clear all datatable draft values
      this.draftValues = [];
  
      try {
        // Update all records in parallel thanks to the UI API
        const recordUpdatePromises = records.map((record) => updateRecord(record));
        await Promise.all(recordUpdatePromises);
  
        // Report success with a toast
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Success",
            message: "Contacts updated",
            variant: "success",
          }),
        );
  

      await refreshApex(this.refreshWireResult);
      } catch (error) {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error updating or reloading contacts",
            message: error.body.message,
            variant: "error",
          }),
        );
      }
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;

        const rowData = event.detail.row;

        if(actionName == 'view') {

            this[NavigationMixin.Navigate]({
                type:'standard__recordPage',
                attributes: {
                    recordId: rowData.Id,
                    actionName:'view'
                }
            });
        }

    }

}
