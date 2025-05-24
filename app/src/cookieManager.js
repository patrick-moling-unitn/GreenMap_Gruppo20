export default class CookieManager {
    createCookie(cookieName, value, expiresIn) { //expiresIn: espresso in millisecondi
        let expireDate;
        if (expiresIn) {
            let date = new Date();
            date.setTime(date.getTime() + expiresIn);
            expireDate = date.toUTCString();
        }
        
        let cookie = cookieName + "=" + value + ";";
        if (expireDate) cookie += " expires=" + expireDate + ";"
        document.cookie = cookie;
    }
    getCookie(cookieName) {
        if (document.cookie.length > 0) {
            const cookies = document.cookie.split(";");
            for (let i=0; i < cookies.length; i++)
                if (cookies[i].startsWith(cookieName)){
                    let startPoint = cookies[i].indexOf(cookieName + "=");
                    return cookies[i].substring(startPoint, cookies[i].length)
                }
        }
        return null;
    }
    deleteCookie(cookieName){
        document.cookie = cookieName + "=; expires=" + new Date(0).toUTCString() + ";";
    }
}