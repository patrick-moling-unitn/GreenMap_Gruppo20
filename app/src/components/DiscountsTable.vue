<template>
    <div class="mb-4 d-flex flex-wrap gap-2">
    <div class="container-fluid" style="max-width: 5000px; margin: auto;">
    <table class="table table-bordered table-hover w-100 text-center align-middle">
      <thead class="table-primary">
        <tr>
          <th>Tipo</th>
          <th>Valore</th>
          <th>Metodo</th>
          <th>Codice</th>
          <th v-if="admin">Operazione</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="access == 'all'">
          <td>
            <select class="form-select" v-model="addDiscount.discountType">
                <option :value="''">Select</option>
                <option :value='0'>Fragrance</option>
                <option :value="1">Toys</option>
                <option :value="2">Steam</option>
                <option :value="3">Amazon</option>
                <option :value="4">Supermarket</option>
            </select></td>
          <td><input type="number" class="form-control" v-model="addDiscount.amount" placeholder="0"/></td>
          <td>
            <select class="form-select" v-model="addDiscount.isPercentage">
                <option :value="''">Any</option>
                <option :value='true'>Percent</option>
                <option :value="false">Euros</option>
            </select></td>
          <td v-if="admin"><input type="text" class="form-control" v-model="addDiscount.code" placeholder="write"/></td>
          <td v-if="admin"><button type="button" class="btn btn-success" @click="addNewDiscount()">Add</button></td>
          <td v-else><button type="button" class="btn btn-success" @click="getNewDiscount()">Get new</button></td>
        </tr>
        <tr>
          <td>
            <select class="form-select" v-model="searchDiscount.discountType" @change="getAllDiscounts">
                <option :value="''">Select</option>
                <option :value='0'>Fragrance</option>
                <option :value="1">Toys</option>
                <option :value="2">Steam</option>
                <option :value="3">Amazon</option>
                <option :value="4">Supermarket</option>
            </select></td>
          <td><input type="number" class="form-control" v-model="searchDiscount.amount" @input="getAllDiscounts" placeholder="0"/></td>
          <td>
            <select class="form-select" v-model="searchDiscount.isPercentage" @change="getAllDiscounts">
                <option :value="''">Any</option>
                <option :value='true'>Percent</option>
                <option :value="false">Euros</option>
            </select></td>
          <td></td>
          <td v-if="admin"><p>-</p></td>
        </tr>
        <tr v-for="discount in discounts">
          <td>{{ discountTypes[discount.discountType] }}</td>
          <td>{{ discount.amount.$numberDecimal }}</td>
          <td>{{ discount.isPercentage?"%":"€" }}</td>
          <td>{{ discount.code }}</td>
          <td v-if="admin"><button type="button" class="btn btn-danger" @click="deleteDiscount(discount.self)">Delete</button></td>
        </tr>
      </tbody>
    </table>
    </div>
    </div>
</template>

<script default>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import { ErrorCodes } from 'vue';
import errors from '@enum/errorCodesDecoded.esm';

export default {
    data() {
      return {
        discounts: [],
        discountTypes: ["Fragrance","Toys","Steam","Amazon","Supermarket"],
        addDiscount: {discountType:'', amount:'', isPercentage:'', code:''},
        searchDiscount: {discountType:'', amount:'', isPercentage:'', code:''}
      }
    },
    props: {
        access: {
            type: String,
            required: true
        },
        admin: Boolean
    },
    methods : {
        getAllDiscounts(){
            this.$nextTick(() => {
                console.log('Dati richiesti');
                fetch(`${UrlManager()}/discounts?type=${this.access}&discountType=${this.searchDiscount.discountType}&amount=${this.searchDiscount.amount}&isPercentage=${this.searchDiscount.isPercentage}`, {
                    method: "GET",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                })
                .then(response => response.json())
                .then(discounts => {
                if(discounts){
                    this.discounts=discounts
                }
                else
                    alert(errors[discounts.errorCode])
                });
            });
        },
        deleteDiscount(self){
            let discountId= self.split("/").pop();
            console.log("delete: "+discountId)
            fetch(`${UrlManager()}/discounts/${discountId}`, {
            method: "DELETE",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            }
            })
            .then(response => {
            if (response.ok){
                console.log("Deleted discount!");
                this.getAllDiscounts()
            }else
                return response.json()
            })
            .then(response => { 
            if (response)
                alert(errors[response.errorCode])
            });
        },
        addNewDiscount(){
            fetch(`${UrlManager()}/discounts`, {
                method: "POST",
                body: JSON.stringify({
                    discountType: this.addDiscount.discountType,
                    amount: this.addDiscount.amount,
                    isPercentage: this.addDiscount.isPercentage,
                    code: this.addDiscount.code
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => {
                if (response.ok){
                    alert("Discount added!")
                    this.getAllDiscounts()
                }else
                    return response.json()
            })
            .then(response => {
            if (response)
                alert(errors[response.errorCode])
            });
        },
        getNewDiscount(){
            console.log('Dati richiesti');
            fetch(`${UrlManager()}/discounts?type=new&discountType=${this.addDiscount.discountType}&amount=${this.addDiscount.amount}&isPercentage=${this.addDiscount.isPercentage}`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => {
                if (response.ok){
                    alert("Discount added!")
                    this.getAllDiscounts()
                }else
                    return response.json()
            })
            .then(response => {
            if (response)
                alert(errors[response.errorCode])
            });
        }
    },
    mounted(){
        this.getAllDiscounts()
    },
    activated(){
        this.getAllDiscounts()
    }
}
</script>