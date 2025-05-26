

export function useUserDeletion(){

  const deleteUserReports = (userId) => {
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
          this.getAllReports();
        }else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      });
    }
    const deleteUser = (self) => {
        let userID= self.split("/").pop();
        deleteUserReports(userID)
        fetch(`${UrlManager()}/authenticatedUsers/${userID}`,{
            method: "DELETE",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            }
        })
        .then(response => console.log(response))
        .then(() => this.showUsers());
    }

  return {
    deleteUserReports,
    deleteUser
  }
}