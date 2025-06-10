<template>
  <div class="adaptive-margin-body">
    <h1>Verify email</h1>
    <form @submit.prevent="verifyCode" class="p-4 mt-4">
      <p>Insert the code sent on your email</p>
      <div class="row g-3">
        <input class="col-auto input-group-text" name="code" placeholder="Code" v-model="this.code" type="text"/>
        <button class="col-auto ms-2 btn btn-success" type="submit">Confirm Code</button>
      </div>
      
      <div class="d-flex align-items-center mt-5">
        <h5 class="mt-1">or</h5>
        <button class="btn ms-2 btn-danger" @click="resetUserIdCallback()">Cancel registration</button>
      </div>
    </form>
  </div>
</template>

<script template>
import UrlManager from '@/urlManager'
import EventBus from '@/EventBus'
import errors from '@enum/errorCodesDecoded.esm'

export default {
    data() {
        return {
            code:''
        }
    },
    props: {
        userId: String,
        resetUserIdCallback: ''
    },
    methods: {
        verifyCode() {
            console.log(this.userId)
            fetch(`${UrlManager()}/registeringUsers/${this.userId}/code`, {
                method: "POST",
                body: JSON.stringify({
                    code: this.code
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            }).then(response => {
              if(response.ok)
                EventBus.emit('registered')
              else
                return response.json();
            }).then(response => {
              if (response && response.errorCode){
                if (errors[response.errorCode] == "Invalid registration request!")
                  this.resetUserIdCallback(); //the userId is invalid. We need to reset it!
                alert(errors[response.errorCode]);
              }
            }).catch(() =>{
              alert("Network error. Please try again later!")
            });
        }
    }
}
</script>