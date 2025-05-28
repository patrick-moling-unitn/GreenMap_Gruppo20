const errorCodes = Object.freeze([
    "SUCCESS",
    "UNAUTHORIZED",
    "MISSING_QUERY_PARAMETER",
    "ID_NOT_FOUND",
    "USER_NOT_FOUND",
    "INFUFFICIENT_POINTS",
    "OUT_OF_STOCK",
    "INTERNAL_ERROR",
    "WRONG_DATA",
    "ALL_ANSWERED",
    "MISSING_QUESTION",
    "NO_MATCHING_ID",
    "ALREADY_RESOLVED_REPORT",
    "BANNED",
    "MISSING_TOKEN",
    "INVALID_TOKEN"
    
]);

const getError = (errorToSearch) => (errorCodes.indexOf(errorToSearch));

module.exports = getError;