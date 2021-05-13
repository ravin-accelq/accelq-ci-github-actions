import AQConstant from "./AQConstant";
import HttpsProxyAgent from 'https-proxy-agent';
import axios from "axios";
import { AQUtil } from "./AQUtil";

const AQRestClient = {
    BASE_URL: "",
    API_ENDPOINT: "",
    PROXY_HOST: "",
    PROXY_PORT: 80,
    setProxy: function (proxyHost:string, proxyPort:number) {
        this.PROXY_HOST = proxyHost;
        this.PROXY_PORT = proxyPort == 0 ? 80 : proxyPort;
    },
    isProxySet: function () {
        return (this.PROXY_HOST && this.PROXY_HOST.length > 0);
    },
    getProxyConfig: function () {
        let protocol = this.BASE_URL.split("://")[0];
        return new HttpsProxyAgent(`${protocol}://${this.PROXY_HOST}:${this.PROXY_PORT}`);
    },
    testConnection: async function (apiKey:string, userId:string, jobId:string, runParam:string|undefined) {
        const jsonObj = AQUtil.getRunParam(jobId, runParam);
        try {
            let proxyConfig;
            if (this.isProxySet()) {
                proxyConfig = this.getProxyConfig();
            }
            const res = await axios.request({
                method: 'POST',
                url: `${this.API_ENDPOINT}/jobs/${jobId}/validate-ci-job`,
                httpsAgent: proxyConfig,
                headers: {
                    "User-Agent": AQConstant.USER_AGENT,
                    "API_KEY": apiKey,
                    "USER_ID": userId,
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(jsonObj)
            });
            if (res.status == 200 || res.status == 204) {
                return "";
            }
            return "";
        }catch (e){
            const res = e.response;
            if (!res || res.status == 404) {
                return "Connection request failed. Please check the URL and Tenant Code.";
            }
            if (res.status == 401) {
                return "Connection request failed. Please check connection parameters.";
            }
            if (res.status >= 500) {
                return "Server Error: " + res.data.message;
            }
            if (res.status != 200) {
                return "Template Job ID does not exist.";
            }
            return null;
        }  
    },
    triggerJob: async function (apiKey:string, userId:string, jobId:string, runParam:string|undefined) {
        const jsonObj = AQUtil.getRunParam(jobId, runParam);
        try {
            let proxyConfig;
            if (this.isProxySet()) {
                proxyConfig = this.getProxyConfig();
            }
            const res = await axios.request({
                method: 'PUT',
                url: `${this.API_ENDPOINT}/jobs/${jobId}/trigger-ci-job`,
                httpsAgent: proxyConfig,
                headers: {
                    "User-Agent": AQConstant.USER_AGENT,
                    "API_KEY": apiKey,
                    "USER_ID": userId,
                    "Content-Type": "application/json"
                },
                data: JSON.stringify(jsonObj)
            });
            
            const resJson = res.data;
            if (res.status == 200 || res.status == 204) {
                return {
                    "pid": resJson[0]
                };
            } else {
                return resJson;
            }
        }catch (e){
            console.log("Error is: " + e.response.data.message);
            return null;
        }  
    },
    setBaseURL: function (baseURL:string, tenantCode:string) {
        this.BASE_URL = baseURL.charAt(baseURL.length - 1) == '/' ? baseURL : (baseURL + '/');
        this.API_ENDPOINT =  this.BASE_URL + "awb/api/" + AQConstant.API_VERSION + "/" + tenantCode;
    },
    getResultExternalAccessURL: function (jobPid:string, tenantCode:string) {
        let extLink = AQConstant.EXT_JOB_WEB_LINK;
        extLink = extLink.replace("{0}", tenantCode);
        extLink = extLink.replace("{1}", jobPid);
        return this.BASE_URL + extLink;
    },
    getJobSummary: async function (runPid:number, apiKey:string, userId:string) {
        let proxyConfig;
        if (this.isProxySet()) {
            proxyConfig = this.getProxyConfig();
        }
        const res = await axios.request({
            method: 'GET',
            httpsAgent: proxyConfig,
            url: `${this.API_ENDPOINT}/runs/${runPid}`,
            headers: {
                "User-Agent": AQConstant.USER_AGENT,
                "API_KEY": apiKey,
                "USER_ID": userId,
                "Content-Type": "application/json"
            },
        });
        const resJson = res.data;
        return resJson;
    }
};

export default AQRestClient;