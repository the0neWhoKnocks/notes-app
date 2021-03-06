# Notes App (WIP)

- [Development](#development)
- [Docker](#docker)
- [Local HTTPS](#local-https)
   - [Generate Certs for localhost](#generate-certs-for-localhost)
   - [Generate Certs for Apps running on your LAN](#generate-certs-for-apps-running-on-your-lan)
   - [Install the Certificate Authority in Chrome](#install-the-certificate-authority-in-chrome)
   - [Install the Certificate Authority in Firefox](#install-the-certificate-authority-in-firefox)
   - [Install the Certificate Authority on Android](#install-the-certificate-authority-on-android)
   - [Run your App with the certs](#run-your-app-with-the-certs)
- [Logging](#logging)

---

## Development

**NOTE** - Aliases to speed up workflow:
| Alias | Command          |
| ----- | ---------------- |
| `d`   | `docker`         |
| `dc`  | `docker-compose` |
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

Some experiences will complain if your App isn't run over `https`. To allow for secure Local development (and LAN Apps over IP), follow the below instructions to generate and install certs.

**NOTE**: If you've already generated and added certs for a specific domain or IP, there's no need to generate and add a new cert. Either delete the old one, or reuse it in your new App.

Run `./bin/gen-certs.sh --help` if you want to see the full list of options.

### Generate Certs for localhost

Run `./bin/gen-certs.sh -f "localhost" -d "localhost"`
- This'll create a `certs.localhost` folder with these files:
   ```sh
   /certs.localhost
     localhost.crt
     localhost.key
     localhost-CA.crt
     localhost-CA.key
   ```

You can then copy, move, or rename the generated folder. Wherever the folder ends up, that location will now be referred to as `<CERTS>`.

### Generate Certs for Apps running on your LAN

Creating certs for Apps running on an IP instead of a domain is pretty much the same as above, except you'll use the `-i` flag instead of `-d`, and provide an IP instead of a domain.

Run `./bin/gen-certs.sh -f "lan-apps" -i "192.168.1.337"`

### Install the Certificate Authority in Chrome

**Windows**
- Settings > In the top input, filter by `cert` > Click `Security`
- Click on `Manage certificates`
- Go the `Trusted Root Certification Authorities` tab
- Choose `Import`
- Find the `<CERTS>/localhost-CA.crt` file, and add it.

**OSX**
- One-liner: `sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" "./certs.localhost/localhost-CA.crt"`
- One-liner (vhost): `sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" "./certs.app.local/app.local.crt"`
   - Open Spotlight (`CMD + SPACE`), select Keychain, go to System. You should see `localhost (CA)` listed, and with a blue plus icon.
   
If the above doesn't work, follow the manual instructions below.
- In a terminal, run `open certs.localhost`
- Double-click on `localhost-CA.crt`
- An Add Certificates dialog should open.
   - Select `System` in the Keychain dropdown and click Add.
- Double-click `localhost (CA)` under Keychains > System
   - Expand the Trust section
   - Choose `Always Trust` for the `When using this certificate` dropdown. Close the pop-up.

**NOTE**: If the cert doesn't seem to be working, try in Incognito first. If it's working there, then just restart Chrome to get it to work in non-Incognito.

### Install the Certificate Authority in Firefox

- Options > In the top input, filter by `cert` > Click `View Certificates...`
- Go to the `Authorities` tab
- Click on `Import`
- Find the `<CERTS>/localhost-CA.crt` file, and add it.
- Check `Trust this CA to identify websites`.

### Install the Certificate Authority on Android

- Copy the CA `.crt` & `.key` to the device
- Go to `Settings` > `Security` > Click on `Install from storage`
- Select the `.crt` file
- Give it a name

### Run your App with the certs

**Non-VHost**

The non-`-CA` files will be used for the App. When starting the App via Node or Docker, you'll need to set this environment variable:
```sh
`NODE_EXTRA_CA_CERTS="$PWD/<CERTS>/localhost.crt"`
```
- Note that `$PWD` expands to an absolute file path.
- The App automatically determines the `.key` file so long as the `.key` & `.crt` files have the same name.

**With a VHost**

```sh
# Start the Proxy and the App
dc up
```

Then go to https://app.local:3000/

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
