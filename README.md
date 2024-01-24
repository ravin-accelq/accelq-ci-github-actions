# accelq-ci-github-actions

Github Actions ACCELQ CI Plugin

## Inputs

### `appURL`
**Required** Your ACCELQ Application URL in the exact following format: https://<hostname>:<port_num>

### `userName`
**Required** Your ACCELQ User ID

### `apiKey`
**Required** API key available in Profile section of ACCELQ

### `tenantCode`
**Required** Tenant Code displayed in the Profile section of ACCELQ

### `jobId`
**Required** This ID should come from the CI job you saved in ACCELQ application

### `runParam`
Run Params(optional) should be JSON string form example: '{\"username\": \"John Todd\", \"password\": \"bxW&=UVw\"}'

### `proxyHost`
Proxy Host (optional)

### `proxyPort`
Proxy Port (optional)

### `stepFailureThreshold`
Percentage ACCELQ test case failure (Optional), beyond which this Step in the Pipeline will be marked as a failure. If this is zero, even a single failed test will cause the Step to fail. If you never want to fail the Pipeline Step due to failing Automation tests, input -1. Input a valid integer between 0 and 100 or, -1.

### `maxWaitTimeInMins`
Maximum time to wait for the job to be picked up by an ACCELQ Agent (optional). Default is 15 mins.

### `waitForJobCompletion`
If true, wait for the job to be completed. If false, run the job and exit (optional). Default is true.


## Outputs

### `result-url`
The ACCELQ url to access the job results