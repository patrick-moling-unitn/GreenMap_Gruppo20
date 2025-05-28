<template>
<DiscountsTable :access="'all'" :admin="administrator"/>
</template>

<script default>
import DiscountsTable from './DiscountsTable.vue'
export default {
    components: {
        DiscountsTable
    },
    data() {
        return {
            administrator: false
        }
    },
    methods : {
        getPersonalData(){
            fetch(`${UrlManager()}/authenticatedUsers?type=personal`, {
                method: "GET",
                headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
                }
            }).then(response => response.json())
            .then(response => { 
                if (!response.error)
                    this.administrator = response.administrator
                else
                    alert(response.message)
            });
        }
    }
}
</script>