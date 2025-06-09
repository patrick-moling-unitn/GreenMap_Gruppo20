<template>
    <div class="adaptive-margin-body">
        <h1>Manage Discounts</h1>
        <DiscountsTable :access="'all'" :admin="admin" :accountId="accountId"/>
    </div>
</template>

<script default>
import DiscountsTable from './DiscountsTable.vue'
import errors from '@enum/errorCodesDecoded.esm';

export default {
    components: {
        DiscountsTable
    },
    props:{
        accountId: String,
        admin: String
    },
    data() {
    },
    methods : {
        //
    }
}
</script>