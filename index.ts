import AQConstant from './core/AQConstant';
import AQFormValidate from './core/AQFormValidate';
import AQRestClient from './core/AQRestClient';
import { AQUtil } from './core/AQUtil';
const core = require("@actions/core");

async function testConnection(appURL:string, userName:string, apiKey:string, tenantCode:string, jobId:string, 
    runParam:string, proxyHost:string, proxyPort:string, maxWaitTimeInMins: string) {
    AQRestClient.setBaseURL(appURL, tenantCode);
    if (proxyHost && proxyHost.length > 0) {
        AQRestClient.setProxy(proxyHost, +proxyPort);
    } else {
        AQRestClient.setProxy("", 0);
    }
    const runParamJsonPayload = AQUtil.getRunParamJsonPayload(runParam);
    const res = await AQRestClient.testConnection(apiKey, userName, jobId, runParamJsonPayload, getMaxWaitTime(maxWaitTimeInMins));
    return res;
}
function sleep (milliSeconds:number) {
    return new Promise(resolve => setTimeout(resolve, milliSeconds));
}
function isFloat(val: number) {
    return typeof val === "number" && !Number.isNaN(val) && !Number.isInteger(val);
}

function inRange(val: number) {
    return val >= -1 && val <= 100; 
}

function getMaxWaitTime(maxWaitTimeInMins: string) {
    if (!maxWaitTimeInMins) {
        return AQConstant.JOB_PICKUP_RETRY_TIME_THRESHOLD_IN_MINS;
    }
    if (Number.isInteger(+maxWaitTimeInMins)) {
        return +maxWaitTimeInMins;
    }
    return AQConstant.JOB_PICKUP_RETRY_TIME_THRESHOLD_IN_MINS;
}

async function executeJob(appURL:string, userName:string, apiKey:string, tenantCode:string, jobId:string, 
    runParam:string, proxyHost:string, proxyPort:string, stepFailureThreshold: string, maxWaitTimeInMins: string, waitForJobCompletion: boolean) {
    let summaryObj = null;
    let realJobPid = 0;
    let failureThreshold = +stepFailureThreshold;

    try {
        AQRestClient.setBaseURL(appURL, tenantCode);
        if (proxyHost && proxyHost.length > 0) {
            AQRestClient.setProxy(proxyHost, +proxyPort);
        } else {
            AQRestClient.setProxy("", 0);
        }
        console.log("******************************************");
        console.log("*** Begin: ACCELQ Test Automation Step ***");
        console.log("******************************************");
        console.log();
        const runParamJsonPayload = AQUtil.getRunParamJsonPayload(runParam);
        const maxWaitTime = getMaxWaitTime(maxWaitTimeInMins);
        const realJobObj = await AQRestClient.triggerJob(apiKey, userName, jobId, runParamJsonPayload, maxWaitTime);
        if (realJobObj == null) {
            throw new Error("Unable to submit the Job, check plugin log stack");
        }
        if (realJobObj["cause"] != null) {
            throw new Error(realJobObj["cause"]);
        }
        realJobPid = realJobObj["pid"];
        let passCount = 0, failCount = 0, totalCount = 0, notRunCount = 0;
        let jobStatus = "";
        let attempt = 0;
        const startTime = Date.now();
        const resultAccessURL = AQRestClient.getResultExternalAccessURL(realJobPid.toString(), tenantCode);
        let error = false;
        let hasLoggedLinks = false;
        console.log("Wait for job completion: " + waitForJobCompletion)
        while(waitForJobCompletion) {
            try {
                summaryObj = await AQRestClient.getJobSummary(realJobPid, apiKey, userName);
                error = false;
            }catch(e: any) {
                error = true;
                console.warn("Warn: Issue fetching Job Summary: ", e.message);
            }
            if (!error) {
                if (summaryObj["cause"] != null) {
                    throw new Error(summaryObj["cause"]);
                }
                if (summaryObj["summary"] != null) {
                    summaryObj = summaryObj["summary"];
                }
                passCount = +summaryObj["pass"];
                failCount = +summaryObj["fail"];
                notRunCount = +summaryObj["notRun"];
                if (attempt == 0) {
                    attempt = 1;
                    const jobPurpose = summaryObj["purpose"];
                    const scenarioName = summaryObj["scnName"];
                    const testSuiteName = summaryObj["testSuiteName"];
                    const totalTestCases = summaryObj["testcaseCount"];
                    if (testSuiteName != null && testSuiteName.length > 0) {
                        console.log("Test Suite Name: " + testSuiteName);
                    } else {
                        console.log("Scenario Name: " + scenarioName);
                    }
                    console.log("Purpose: " + jobPurpose);
                    console.log("Total Test Cases: " + totalTestCases);
                    console.log("Step Failure threshold: " + stepFailureThreshold);
                    console.log("Max Wait Time in Minutes: " + maxWaitTime);
                    console.log();
                    if (isFloat(failureThreshold)) {
                        failureThreshold = Math.trunc(failureThreshold);
                        console.log(`Warning: Invalid value (${failureThreshold}) passed for Step Failure Threshold. Truncating the value to ${failureThreshold} (Only integers between 0 and 100, and -1 are allowed).`);
                    }
                    if (!inRange(failureThreshold)) {
                        console.log(`Warning: Ignoring the Step Failure threshold. Invalid value (${failureThreshold}) passed. Valid values are 0 to 100, or -1 to ignore threshold.`);
                        failureThreshold = 0;
                    }
                }
                jobStatus = summaryObj["status"].toUpperCase();
                if (jobStatus !== AQConstant.TEST_JOB_STATUS.SCHEDULED.toUpperCase() && !hasLoggedLinks) {
                    hasLoggedLinks = true;
                    console.log("Results Link: " + resultAccessURL);
                    console.log("Need to abort? Click on the link above, login to ACCELQ and abort the run.");
                    console.log();
                }
                if (jobStatus == AQConstant.TEST_JOB_STATUS.COMPLETED.toUpperCase()) {
                    const res = " " + AQUtil.getFormattedTime(summaryObj["startTimestamp"], summaryObj["completedTimestamp"]);
                    console.log("Status: " + summaryObj["status"].toUpperCase() + " ("+res.trim()+")");
                } else {
                    console.log("Status: " + summaryObj["status"].toUpperCase());
                }
                if (hasLoggedLinks) {
                    totalCount = passCount + failCount + notRunCount;
                    console.log("Total " + totalCount + ": "
                            + "" + passCount +" Pass / " + failCount + " Fail");
                    console.log();
                }
                if (jobStatus == AQConstant.TEST_JOB_STATUS.SCHEDULED.toUpperCase() && AQUtil.isWaitTimeExceeded(startTime, maxWaitTime)) {
                    throw new Error (AQConstant.LOG_DELIMITER + "No agent available to pickup the job");
                }
                if((jobStatus == AQConstant.TEST_JOB_STATUS.COMPLETED.toUpperCase()) 
                    || (jobStatus == AQConstant.TEST_JOB_STATUS.ABORTED.toUpperCase()) 
                    || (jobStatus == AQConstant.TEST_JOB_STATUS.FAILED.toUpperCase())
                    || (jobStatus == AQConstant.TEST_JOB_STATUS.ERROR.toUpperCase())){
                  break;
                }
            }
            await sleep(AQConstant.JOB_STATUS_POLL_TIME);
        }
        console.log("Results Link: " + resultAccessURL);
        console.log();
        const failedPercentage = Math.trunc((failCount / totalCount) * 100);

        if (jobStatus == AQConstant.TEST_JOB_STATUS.ABORTED.toUpperCase()
            || jobStatus == AQConstant.TEST_JOB_STATUS.FAILED.toUpperCase()
            || jobStatus == AQConstant.TEST_JOB_STATUS.ERROR.toUpperCase()) {
            throw new Error(AQConstant.LOG_DELIMITER + "Run Failed");
        } else if(failCount > 0) {
            if(failureThreshold != -1 && failedPercentage >= failureThreshold) {
                throw new Error(AQConstant.LOG_DELIMITER + "Automation test step failed (test case failure count exceeds the threshold limit)");
            }
        }
        return  {
            jobId: realJobPid,
            status: true,
            error: null
        };
    } catch(e) {
        summaryObj = await AQRestClient.getJobSummary(realJobPid, apiKey, userName);
        if (summaryObj["cause"] != null) {
            throw new Error(summaryObj["cause"]);
        }
        if (summaryObj["summary"] != null) {
            summaryObj = summaryObj["summary"];
        }
        console.log("Status: " + summaryObj["status"]);
        console.log("Pass: " + summaryObj["pass"]);
        return {
            jobId: realJobPid,
            status: false,
            error: e,
        };
    }
}

async function run() {
    try {
        const appURL = core.getInput('appURL', {required: true}) || "";
        const userName = core.getInput('userName', {required: true}) || "";
        const apiKey = core.getInput('apiKey', {required: true}) || "";
        const tenantCode = core.getInput('tenantCode', {required: true}) || "";
        const jobId = core.getInput('jobId', {required: true}) || "";
        const runParam = core.getInput('runParam') || "";
        const proxyHost = core.getInput('proxyHost') || "";
        const proxyPort = core.getInput('proxyPort') || "";
        const stepFailureThreshold = core.getInput('stepFailureThreshold') || "";
        const maxWaitTimeInMins = core.getInput('maxWaitTimeInMins') || "";
        const waitForJobCompletion = (core.getInput('waitForJobCompletion') || "true").toLowerCase() === "true";

        // validateFORM
        let res: string | null | {
            jobId: number; status: boolean, error?: any };
        res = AQFormValidate.validateAppURL(appURL);
        if (res != null) {
            throw new Error('ACCELQ App URL: ' + res);
        }
        res = AQFormValidate.validateUserId(userName);
        if (res != null) {
            throw new Error('ACCELQ User ID: ' + res);
        }
        res = AQFormValidate.validateAPIKey(apiKey);
        if (res != null) {
            throw new Error('API Key: ' + res);
        }
        res = AQFormValidate.validateTenantCode(tenantCode);
        if (res != null) {
            throw new Error('Tenant Code: ' + res);
        }
        res = AQFormValidate.validateJobID(jobId);
        if (res != null) {
            throw new Error('ACCELQ CI Job ID: ' + res);
        }

        // test connection
        res = await testConnection(appURL, userName, apiKey, tenantCode, jobId, runParam, proxyHost, proxyPort, maxWaitTimeInMins);
        
        if (res === null) {
            throw new Error("Something went wrong in extension");
        } else if (res) {
            throw new Error(res);
        }
        // executeJob
        res = await executeJob(appURL, userName, apiKey, tenantCode, jobId, runParam, proxyHost, proxyPort, stepFailureThreshold, maxWaitTimeInMins, waitForJobCompletion);
        if (res.status) {
            console.log('Run Completed!!!');
        } else {
            core.setFailed(res.error?.message || "Job Failed!!!");
        }
    }
    catch (err: any) {
        core.setFailed(err.message);
    } finally {
        console.log("**********************************************");
        console.log("*** Completed: ACCELQ Test Automation Step ***");
        console.log("**********************************************");
    }
}

run();