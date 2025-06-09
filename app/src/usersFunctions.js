import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'

export default function usersFunctions(){
    const deleteUserReports=(userId)=>{
      return fetch(`${UrlManager()}/reports?type=userReports&issuerId=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => {
        if (response.ok){
          console.log("Deleted all user reports!");
        }else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      }).catch(() =>{
        alert("Network error. Please try again later!")
      });
    }
    const deleteUserAnswers=(userId)=>{
      return fetch(`${UrlManager()}/questionnaires/answers?issuerId=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => {
        if (response.ok){
          console.log("Deleted all user answers!");
        }else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      }).catch(() =>{
        alert("Network error. Please try again later!")
      });
    }
    
    const deleteUser = (userId) =>{
      return Promise.all([
        deleteUserReports(userId),
        deleteUserAnswers(userId)
      ]).then(() => {
        return fetch(`${UrlManager()}/authenticatedUsers/${userId}`,{
            method: "DELETE",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            }
        })
      }).catch(() =>{
        alert("Network error. Please try again later!")
      });
    }

    const banUnbanUser = (userId) =>{
      return Promise.all([
        deleteUserReports(userId),
        deleteUserAnswers(userId)
      ])
      .then(() => {
        return fetch(`${UrlManager()}/authenticatedUsers/${userId}`,{
            method: "PUT",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            },
            body: JSON.stringify({
                editAdmin: false,
                editBan: true
            })
        })
      }).catch(() =>{
        alert("Network error. Please try again later!")
      });
    }
    return {deleteUser, deleteUserAnswers, deleteUserReports, banUnbanUser };
}