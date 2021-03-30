# pagemind

accessibility detector and page insights

## Getting Started

For more information checkout [pagemind](https://a11ywatch.github.io/docs/documentation/pagemind)

## Docker

if using this service in a docker env make sure to create a .env file and add the env var DOCKER_ENV=true

## Installation

```
npm install
```

## Start

```
npm run dev
```

The server will run on port 8080.

### Example

```
curl --location --request POST 'http://localhost:8040/api/getPageIssues' \
--header 'Content-Type: application/json' \
--data-raw '{ "url": "https://www.drake.com", "userId": 0 }'
```
output
```
{
    "webPage": {
        "domain": "drake.com",
        "url": "https://www.drake.com",
        "adaScore": 64,
        "cdnConnected": false,
        "screenshot": "http://127.0.0.1:8090/screenshots/drake.com/www-drake-com-ada-fix-0.png",
        "screenshotStill": "http://127.0.0.1:8090/screenshots/drake.com/www-drake-com-ada-fix-0-still.png",
        "pageLoadTime": {
            "duration": 1272,
            "durationFormated": "Standard",
            "color": "#A5D6A7"
        },
        "html": "<omited>",
        "htmlIncluded": true,
        "issuesInfo": {
            "possibleIssuesFixedByCdn": 10,
            "totalIssues": 25,
            "issuesFixedByCdn": 0,
            "errorCount": 11,
            "warningCount": 14,
            "noticeCount": 0,
            "adaScore": 64,
            "issueMeta": {
                "skipContentIncluded": false
            }
        },
        "lastScanDate": "Tue, 30 Mar 2021 21:55:38 GMT",
        "userId": 0
    },
    "issues": {
        "documentTitle": "Drake Industries | Custom, Durable, High-Quality Labels, Asset Tags and Custom Server Bezels",
        "pageUrl": "https://www.drake.com",
        "issues": [
            {
                "code": "WCAG2A.Principle1.Guideline2.4",
                "type": "warning",
                "typeCode": 2,
                "message": "Skip to content link not found. Use skip to content links to help shortcut to the main content.",
                "context": "<a id=\"content\">Skip Content</a>",
                "selector": "a",
                "runner": "a11yWatch",
                "runnerExtras": {}
            }
        ],
        "domain": "drake.com",
        "userId": 0
    },
    "script": {
        "pageUrl": "https://www.drake.com",
        "domain": "drake.com",
        "script": "<omited>"
        "cdnUrlMinified": "drake.com/www-drake-com-ada-fix-0.min.js",
        "cdnUrl": "drake.com/www-drake-com-ada-fix-0.js",
        "cdnConnected": false,
        "userId": 0,
        "issueMeta": {
            "skipContentIncluded": false
        }
    }
}
```

## LICENSE

check the license file in the root of the project.
