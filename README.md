# Notes App (WIP)

- [Development](#development)
- [Docker](#docker)
- [Local HTTPS](#local-https)
- [Logging](#logging)

---

## Development

**NOTE** - Aliases to speed up workflow:
| Alias | Command          |
| ----- | ---------------- |
| `d`   | `docker`         |
| `dc`  | `docker compose` |
| `nr`  | `npm run`        |

Install dependencies
```sh
npm i
```

Run the App
```sh
# Prod mode
nr start

# Dev mode
nr start:dev
```

---

## Docker

```sh
# Compile Production code (required since the assets are copied over)
nr build
# Build and start the container
dc up --build notes

# Or just start the container if you have 'dist' mapped or you just want to use the old build
dc up notes
```

---

## Local HTTPS

Follow instructions from:
- https://github.com/the0neWhoKnocks/docker-examples/tree/main/examples/cert-auth#run
- https://github.com/the0neWhoKnocks/generate-certs

Generated `localhost` and `tests.lan` certs for Dev and Tests.

---

## Logging

This App utilizes [ulog](https://www.npmjs.com/package/ulog).

On the Server you can enable logging via:
```sh
# setting an env var of `log` with a log level value
log=debug nr start:dev
log=error nr start:dev
log=info nr start:dev
```

On the Client you can enable logging via:
- A query param: `?log=debug` (for temporary logging)
- Local Storage: `localStorage.setItem('log', 'debug');` (to enable permanently).
