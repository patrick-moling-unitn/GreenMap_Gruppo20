import UrlManager from './urlManager'
import TokenManager from './tokenManager'

class TrashcanAPIUtility {
    deleteTrashcan(trashcanId, successCallback){
        console.log("delete: "+trashcanId)
        fetch(`${UrlManager()}/trashcans/${trashcanId}`, {
            method: "DELETE",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            }
            })
            .then(response => {
                if (response.ok){
                    console.log("Deleted trashcan!");
                    successCallback();
                }
                else
                    return response.json()
                })
            .then(response => { 
                if (response)
                    alert(response.message)
            });
    }
    updateTrashcan(trashcanId, trashcanTypeParam, successCallback){
        fetch(`${UrlManager()}/trashcans/${trashcanId}`, {
          method: "PUT",
          body: JSON.stringify({
            trashcanType: trashcanTypeParam
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok){
            console.log("Updated trashcan!")
            successCallback();
          }
          else
            return response.json()
        })
        .then(response => { 
          if (response)
            alert(response.message)
        });
    }
}

const trashcanAPIUtility = new TrashcanAPIUtility();

export default trashcanAPIUtility;