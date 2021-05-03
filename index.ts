import core from '@actions/core';
import AQConstant from './AQConstant';
import AQFormValidate from './AQFormValidate';
import AQRestClient from './AQRestClient';
import { AQUtil } from './AQUtil';

async function testConnection(appURL:string, userName:string, apiKey:string, tenantCode:string, jobId:string, runParam:string, proxyHost:string, proxyPort:string) {
    AQRestClient.setBaseURL(appURL, tenantCode);
    if (proxyHost && proxyHost.length > 0) {
        AQRestClient.setProxy(proxyHost, +proxyPort);
    } else {
        AQRestClient.setProxy("", 0);
    }
    const runParamJsonPayload = AQUtil.getRunParamJsonPayload(runParam);
    const res = await AQRestClient.testConnection(apiKey, userName, jobId, runParamJsonPayload);
    return res;
}
function sleep (milliSeconds:number) {
    return new Promise(resolve => setTimeout(resolve, milliSeconds));
}
async function executeJob(appURL:string, userName:string, apiKey:string, tenantCode:string, jobId:string, runParam:string, proxyHost:string, proxyPort:string) {
    let summaryObj = null;
    let realJobPid = 0;
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
        const realJobObj = await AQRestClient.triggerJob(apiKey, userName, jobId, runParamJsonPayload);
        if (realJobObj == null) {
            throw new Error("Unable to submit the Job, check plugin log stack");
        }
        if (realJobObj["cause"] != null) {
            throw new Error(realJobObj["cause"]);
        }
        realJobPid = realJobObj["pid"];
        let passCount = 0, failCount = 0, runningCount = 0, totalCount = 0, notRunCount = 0;
        let jobStatus = "";
        let attempt = 0;
        const resultAccessURL = AQRestClient.getResultExternalAccessURL(realJobPid.toString(), tenantCode);
        while(true) {
            summaryObj = await AQRestClient.getJobSummary(realJobPid, apiKey, userName);
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
                console.log();
                console.log("Results Link: " + resultAccessURL);
                console.log("Need to abort? Click on the link above, login to ACCELQ and abort the run.");
                console.log();
            }
            jobStatus = summaryObj["status"].toUpperCase();
            if (jobStatus == AQConstant.TEST_JOB_STATUS.COMPLETED.toUpperCase()) {
                const res = " " + AQUtil.getFormattedTime(summaryObj["startTimestamp"], summaryObj["completedTimestamp"]);
                console.log("Status: " + summaryObj["status"].toUpperCase() + " ("+res.trim()+")");
            } else {
                console.log("Status: " + summaryObj["status"].toUpperCase());
            }
            totalCount = passCount + failCount + notRunCount;
            console.log("Total " + totalCount + ": "
                    + "" + passCount +" Pass / " + failCount + " Fail");
            console.log();
            if (jobStatus == AQConstant.TEST_JOB_STATUS.SCHEDULED.toUpperCase())
                ++attempt;
            if (attempt == AQConstant.JOB_PICKUP_RETRY_COUNT) {
                throw new Error ("No agent available to pickup the job");
            }
            if(jobStatus == AQConstant.TEST_JOB_STATUS.SCHEDULED.toUpperCase()){
                attempt = attempt + 1;
            }
            if(attempt == AQConstant.JOB_PICKUP_RETRY_COUNT) {
                throw new Error("No agent available to pickup the job");
            }
            if((jobStatus == AQConstant.TEST_JOB_STATUS.COMPLETED.toUpperCase()) 
                || (jobStatus == AQConstant.TEST_JOB_STATUS.ABORTED.toUpperCase()) 
                || (jobStatus == AQConstant.TEST_JOB_STATUS.FAILED.toUpperCase())
                || (jobStatus == AQConstant.TEST_JOB_STATUS.ERROR.toUpperCase())){
              break;
            }        
            await sleep(AQConstant.JOB_STATUS_POLL_TIME);
        }
        console.log("Results Link: " + resultAccessURL);
        console.log();
        if (failCount > 0 
            || jobStatus == AQConstant.TEST_JOB_STATUS.ABORTED.toUpperCase()
            || jobStatus == AQConstant.TEST_JOB_STATUS.FAILED.toUpperCase()
            || jobStatus == AQConstant.TEST_JOB_STATUS.ERROR.toUpperCase()) {
            throw new Error(AQConstant.LOG_DELIMITER + "Run Failed");
        }
        console.log("**********************************************");
        console.log("*** Completed: ACCELQ Test Automation Step ***");
        console.log("**********************************************");
        console.log();
        return {
            status: true
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
            status: false,
            error: e
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
        // validateFORM
        let res: string | null | {status: boolean, error?: Error };
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
        res = await testConnection(appURL, userName, apiKey, tenantCode, jobId, runParam, proxyHost, proxyPort);
        
        if (res === null) {
            core.setFailed("Something went wrong in extension");
            return;
        } else if (res) {
            console.log('here', res);
            core.setFailed(res);
            return;
        }
        // executeJob
        res = await executeJob(appURL, userName, apiKey, tenantCode, jobId, runParam, proxyHost, proxyPort);
        if (res.status) {
            console.log('Run Completed!!!');
        } else {
            res.error?.message ? core.setFailed(res.error.message) : core.setFailed("Job failed!!!");
        }
    }
    catch (err) {
        core.setFailed(err.message);
    }
}

run();