export const AQUtil = {
    getRunParam: (jobId:string, runParam: string|undefined) => {
        let jsonObj = {} as any;
        if (runParam && runParam.length > 0) {
            jsonObj["runProperties"] = JSON.parse(runParam);
        }
        jsonObj["jobPid"] = +jobId;
        return jsonObj;
    },
    getRunParamJsonPayload: (runParamStr: string) => {
        if(runParamStr == null || runParamStr.trim().length == 0)
            return;
        const splitOnAmp = runParamStr.split("&");
        let jsonObject = {} as any;
        splitOnAmp.forEach(split => {
            const splitOnEquals = split.split("=");
            if(splitOnEquals.length == 2) {
                const key = splitOnEquals[0].trim(), value = splitOnEquals[1].trim();
                if(key !== "" && value !== "") {
                    jsonObject[key] = value;
                }
            }
        });
        return JSON.stringify(jsonObject);
    },
    getFormattedTime:(a: string | number | Date, b: string | number | Date) => {
        const startDate = new Date(a);
        const endDate = new Date(b);
        const difference_In_Time
            = endDate.getTime() - startDate.getTime();
        const difference_In_Seconds
            = +((difference_In_Time
            / 1000)
            % 60).toFixed();
        const difference_In_Minutes
            = +((difference_In_Time
            / (1000 * 60))
            % 60).toFixed();
        const difference_In_Hours
            = +((difference_In_Time
            / (1000 * 60 * 60))
            % 24).toFixed();
        const difference_In_Days
            = +((difference_In_Time
            / (1000 * 60 * 60 * 24))
            % 365).toFixed();
        let res = "";
        if (difference_In_Days != 0) {
            res += (difference_In_Days > 1 ? (difference_In_Days + " days") : (difference_In_Days + " day"));
        }
        if (difference_In_Hours != 0) {
            res += (difference_In_Hours > 1 ? (difference_In_Hours + " hrs") : (difference_In_Hours + " hr"));
        }
        if (difference_In_Minutes != 0) {
            res += " " + (difference_In_Minutes > 1 ? (difference_In_Minutes + " mins") : (difference_In_Minutes + " min"));
        }
        if (difference_In_Seconds != 0) {
            res += " " + (difference_In_Seconds > 1 ? (difference_In_Seconds + " seconds") : (difference_In_Seconds + " second"));
        }
        return res;
    }
}
