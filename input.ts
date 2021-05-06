const core = require("@actions/core");

export function getInput() {
    const appURL = core.getInput('appURL', {required: true}) || "";
    const userName = core.getInput('userName', {required: true}) || "";
    const apiKey = core.getInput('apiKey', {required: true}) || "";
    const tenantCode = core.getInput('tenantCode', {required: true}) || "";
    const jobId = core.getInput('jobId', {required: true}) || "";
    const runParam = core.getInput('runParam') || "";
    const proxyHost = core.getInput('proxyHost') || "";
    const proxyPort = core.getInput('proxyPort') || "";
    return {
        appURL,
        userName,
        apiKey,
        tenantCode,
        jobId,
        runParam,
        proxyHost,
        proxyPort
    };    
}