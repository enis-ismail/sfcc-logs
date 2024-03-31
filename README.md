# Salesforce Commerce Cloud Logs Analyzer

> Download and analyze given SFCC instance logs. The report is generated in an html file with all the errors exceeding the threshold, sorted by severity.

## Features

- Authentication using API Client _(recommended)_ OR Business Manager _(deprecated)_
- Builds a report that developers can work on to fix and reduce the number of errors
- Possibility to automate the task so the report is generated on a weekly basis for example

## Installation

```bash
$ npm i
```

## Requirements

- Node >= 10

## Configuration

Requires the following configuration files:

- a `dwconfig.json` file with containing instance credentials to be used when connecting to WebDAV. Use `dwconfig.sample.json` as a template.
- a `config.json` file containing the error thresholds, folder where the logs will be downloaded, and the file name of the report

`sfcc-logs` requires a correctly configured API client id/secret OR Business Manager username/password for accessing logs via webdav. **API client authentication is recommended, because it is faster after the initial authorization, and Business Manager authentication to WebDAV has been _deprecated_ by Salesforce.**

### Sample configuration files

Sample dwconfig.json:
```json
{
    "hostname": "zzzz-001.dx.commercecloud.salesforce.com",
    "profiles": {
        "capiprofile": {
            "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            "client_secret": "clientsecret123"
        },
        "bmprofile": {
            "username": "bmuser@salesforce.com",
            "password": "bmuserpassword123"
        }
    }
}
```

Sample config.json:
```json
{
    "LOGSDIR": "./logs",
    "SUMMARY_FILENAME": "sfcc-logs-report-[DATE]",
    "MINIMUM_ERRORS_TRESHOLD": 50,
    "CRITICAL_ERRORS_TRESHOLD": 500
}
```

### API client configuration

The API client ID must be created in the account.demandware.com console. Before being able to use `sfcc-logs` you must grant the required permissions to that client ID for accessing the logs folder through WebDAV in any target SFCC instance.

To do so, access Business Manager and add the following to Administration -> Organization -> WebDAV Client Permissions, replacing the client_id value with your client id. **Note:** you may need to merge these settings with existing ones.

```json
{
  "clients": [
    {
      "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "permissions": [
        {
          "path": "/logs",
          "operations": ["read"]
        }
      ]
    }
  ]
}
```

## Usage

```bash
$ npm run start
```
Check `/logs/sfcc-logs-report-[CURRENT_DATE].html` to see the generated report.

## License

Released under the MIT license.