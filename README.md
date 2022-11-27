# pagemind

gRPC API for accessibility insights and metrics

## Getting Started

For more information checkout [pagemind](https://a11ywatch.github.io/docs/documentation/pagemind)

## Installation

```
npm install
```

## Start

```
npm run dev
```

## ENV

Add a http/https load balancer url using the env `CHROME_LB` to enable high performance load balancing.

```
AI_DISABLED=false
CHROME_LB=
```

## Healthcheck

You can generate a health check client by running `cargo build`. It requires that you first installed the app via `npm i`.

## LICENSE

check the license file in the root of the project.
