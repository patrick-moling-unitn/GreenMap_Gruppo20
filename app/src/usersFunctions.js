import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'

export default function usersFunctions(){
    const deleteUserReports=(userId)=>{
      fetch(`${UrlManager()}/reports/${userId}?type=userReports`, {
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
      });
    }
    const deleteUserAnswers=(userId)=>{
      fetch(`${UrlManager()}/answers/${userId}`, {
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
      });
    }
    
    const deleteUser = (userID) =>{
        deleteUserReports(userID)
        deleteUserAnswers(userID)
        fetch(`${UrlManager()}/authenticatedUsers/${userID}`,{
            method: "DELETE",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            }
        })
        .then(response => console.log(response))
    }

    const banUnbanUser = (userID) =>{
      deleteUserReports(userID)
      deleteUserAnswers(userID)
      fetch(`${UrlManager()}/authenticatedUsers`,{
          method: "PUT",
          headers: {
              "Content-type": "application/json; charset=UTF-8",
              "x-access-token": TokenManager()
          },
          body: JSON.stringify({
              id: userID,
              editAdmin: false,
              editBan: true
          })
      })
      .then(response => console.log(response))
    }
    return {deleteUser, deleteUserAnswers, deleteUserReports, banUnbanUser };
}