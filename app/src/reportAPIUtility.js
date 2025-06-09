import UrlManager from './urlManager'
import TokenManager from './tokenManager'
import errors from '@enum/errorCodesDecoded.esm';

class ReportAPIUtility {
    resolveReport(reportId, successCallback){
        fetch(`${UrlManager()}/reports/${reportId}`, {
          method: "PUT",
          body: JSON.stringify({
            resolved: true
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok){
            console.log("Report resolved!")
            successCallback()
          }
          else
            return response.json()
        })
        .then(response => { 
          if (response)
            alert(errors[response.errorCode])
        }).catch(() =>{
          alert("Network error. Please try again later!")
        });
    }
    deleteReport(reportId, successCallback){
        fetch(`${UrlManager()}/reports/${reportId}`, {
          method: "DELETE",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok){
            console.log("Deleted report!");
            successCallback()
          }else
            return response.json()
        })
        .then(response => { 
          if (response)
            alert(errors[response.errorCode])
        }).catch(() =>{
          alert("Network error. Please try again later!")
        });
    }
}

const reportAPIUtility = new ReportAPIUtility();

export default reportAPIUtility;