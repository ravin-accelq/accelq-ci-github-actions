# accelq-ci-github-actions

Github Actions ACCELQ CI Plugin

## Inputs

### `appURL`
**Required**
Your ACCELQ application URL in the format: https://hostname:port

### `userName`
**Required**
Your ACCELQ User ID

### `apiKey`
**Required**
API key available in the Profile section of ACCELQ

### `tenantCode`
**Required**
Tenant Code displayed in the Profile section of ACCELQ

### `jobId`
**Required**
This ID should come from the job saved in ACCELQ

### `runParam`
Run parameters in JSON string format. Example:
```
{
    "username": "John Todd",
    "password": "bxW&=UVw"
}
```

### `proxyHost`
Proxy Host

### `proxyPort`
Proxy Port

### `stepFailureThreshold`
Percentage of ACCELQ test case failure, beyond which this step will be marked as a failure in the CI pipeline.
If this is zero, even a single failed test will cause the step to fail. If you never want to fail this step due to failing automation tests, input -1.
Allowed values: integer between 0 and 100 or. Default is -1.

### `maxWaitTimeInMins`
Maximum time to wait for the job to be picked up by an ACCELQ Agent. Default is 15 mins.

### `waitForJobCompletion`
If true, wait for the job to be completed. If false, run the job and exit. Default is true.


## Outputs

### `result-url`
The ACCELQ url to access the job results