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
        });
    }
    deleteReport(reportId, successCallback){
        fetch(`${UrlManager()}/reports/${reportId}?type=report`, {
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
        });
    }
}

const reportAPIUtility = new ReportAPIUtility();

export default reportAPIUtility;