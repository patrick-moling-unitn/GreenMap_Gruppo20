const ReportType = Object.freeze({
    TRASHCAN_LOCATION_SUGGESTION: 1,
    TRASHCAN_POSITION_MISSING: 2,
    TRASH_OUT_OF_PLACE: 3,
    TRASHCAN_FULL: 4,
});

const ReportTypeStringValue = Object.freeze({
    TRASHCAN_LOCATION_SUGGESTION: "Trashcan location suggestion",
    TRASHCAN_POSITION_MISSING: "Trashcan position missing",
    TRASH_OUT_OF_PLACE: "Trash out of place",
    TRASHCAN_FULL: "Trashcan full"
});

export { ReportType, ReportTypeStringValue };