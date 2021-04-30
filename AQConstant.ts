enum TEST_CASE_STATUS {
    PASS = "pass",
    FAIL = "fail",
    NOT_RUN = "notRun",
    RUNNING = "running",
    INFO = "info",
    FATAL = "fatal",
    WARN = "warn",
    ALL = "all"
};
enum TEST_JOB_STATUS {
    NOT_APPLICABLE = "Not Applicable",
    SCHEDULED = "Scheduled",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
    ABORTED = "Aborted",
    FAILED = "Failed To Start",
    RECURRING = "Recurring",
    ERROR = "Error",
    CONTINUOUS_INTEGRATION = "Continuous Integration"

};
const AQConstants = {
    LOG_DELIMITER : ">>> ",
    USER_AGENT : "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
    JOB_STATUS_POLL_TIME : 30 * 1000,
    JOB_PICKUP_RETRY_COUNT: 30,

    JOB_WEB_LINK: "#/forward?entityType=9&resultId={0}",
    EXT_JOB_WEB_LINK: "#/resultext?tenant={0}&resultId={1}",
    API_VERSION: "1.0",
    AQ_RESULT_INFO_KEY: "AQReportInfo",
    TEST_CASE_STATUS: TEST_CASE_STATUS,
    TEST_JOB_STATUS: TEST_JOB_STATUS
}

export default AQConstants;