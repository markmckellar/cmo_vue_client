# Home Cams

Web app for browsing the motion events recorded by the home cameras. Each event shows a thumbnail, the
time it happened, and what ollama found in it (cat, dog, person, ...). Click a tile to play the video full screen.
You can browse by date or search every date for one classification.

The app is a static site. All of its data comes from [cmo_server](../cmo_server), which also hosts the built app.

## Versions

| What | Version | Notes |
|---|---|---|
| Node | 22.20.0 | pinned in `.nvmrc`; Vite needs node >= 22.12 |
| npm | 10.9.3 | comes with node 22.20.0 |
| Vue | 3.5.43 | `<script setup>` + TypeScript |
| Vite | 8.3.3 | dev server and build |
| TypeScript | 6.0.3 | type-checked with vue-tsc 3.3.12 |
| cmo_server | commit `c33c602` or later | needs the `/catcam/search` endpoint; Spring Boot 2.7.3, Java 17 |

There are no UI libraries. The styles are plain CSS (`src/styles.css` plus each component's `<style scoped>`).

## Setup

Get the right node with [nvm](https://github.com/nvm-sh/nvm):

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

nvm install      # reads .nvmrc
nvm use          # reads .nvmrc -- do this in every new terminal
node -v          # v22.20.0
npm -v           # 10.9.3

npm install
```

If `npm` fails with errors like `Unexpected token '??='`, the shell is on an old node. Run `nvm use`.

## Run it

Dev server with hot reload, on http://localhost:8080:

```
npm run dev        # same as: npm run serve
```

To try it on your phone, add `--host` and open the "Network" address it prints (phone on the same Wi-Fi):

```
npm run dev -- --host
#  ➜  Local:   http://localhost:8080/
#  ➜  Network: http://192.168.1.167:8080/
```

Even in dev, the app talks to the real server at `http://173.255.215.223:9090/`.

Other commands:

```
npm run build        # type-check, then build to dist/
npm run preview      # serve the dist/ build locally
npm run type-check   # type-check only
```

## Deploy into cmo_server

cmo_server serves the app from its static resources, at `src/main/resources/static/cmo_client/`. After a deploy that folder looks like:

```
cmo_server/src/main/resources/static/cmo_client/
├── index.html
├── favicon.ico
├── assets/
│   ├── index-<hash>.js
│   └── index-<hash>.css
└── movie.html        (older standalone page, not part of this app; left in place)
```

The `deploy` script builds the app and copies `dist/` there. It first removes the previous build's
`assets/` folder, plus the `js/` and `css/` folders left by the old vue-cli build:

```
nvm use
./deploy                                   # expects cmo_server at ~/dev/cmo_server
CMO_SERVER=/path/to/cmo_server ./deploy    # or say where it is
```

To do the same by hand:

```
npm run build
cd ~/dev/cmo_server/src/main/resources/static/cmo_client
rm -rf assets js css index.html favicon.ico
cp -R ~/dev/cmo_vue_client_newdev/dist/* .
```

Then commit cmo_server, rebuild it and restart it on the server (`mvn spring-boot:run`, see its README). The app is then at:

**http://173.255.215.223:9090/cmo_client/index.html**

Include `index.html` in the link; the server doesn't serve `/cmo_client/` by itself.

The build uses relative paths (`base: './'` in `vite.config.ts`), so it works from that sub-folder. Don't remove that setting,
or the page loads blank.

## How it talks to the server

The server address `http://173.255.215.223:9090/` is written directly into the components
(`MeGroupList.vue`, `MeEventGroupList.vue`, `MeEventList.vue`, `MeEventDetail.vue`). Change it there if the server moves.

| Endpoint | Used for |
|---|---|
| `GET /catcam/megroups` | the camera groups (e.g. `pet_door`) |
| `GET /catcam/meeventgroup/{group}?howMayRecords=` | the dates for a group (the "Event group" picker) |
| `GET /catcam/meeventgroup/{group}/{date}?howMayRecords=&startRecord=&minimumDuration=` | the events on one date |
| `GET /catcam/search/{group}?label=&howMayRecords=&minimumDuration=&before=` | events on any date that ollama tagged with `label`, newest first; `before` = the `me_name` of the last event already shown, for the next page |
| `GET /catcam/data/{group}/{date}/{event}/{file}` | an event's files: `me_rep_image.jpg` (thumbnail), `me_movie.mp4` (video), `me_ollama.json` (classification) |

`me_ollama.json` is written by the ollama scripts (`cmo_ollama`). It holds true/false flags:

```json
{ "legs": false, "person": false, "cat": true, "dog": false, "raccoon": false, "animal": true }
```

Every true flag shows as a tag on the tile. "animal" is hidden when a specific animal is tagged, and "legs" is hidden when a person is.
A new label from ollama appears automatically. To give it its own color, add a `.tag_<label>` style in `MeEventList.vue`.

## Project layout

```
index.html                    page shell (Vite entry)
vite.config.ts                Vite config (port 8080, base './')
deploy                        build + copy into cmo_server
src/
  main.ts                     starts the app, loads styles.css
  styles.css                  colors, fonts, shared button/select styles
  App.vue                     header + page
  components/
    MeGroupList.vue           one section per camera group
    MeEventGroupList.vue      group header: search box + date picker
    MeEventList.vue           grid of event tiles, tags, load more, full-screen player
    MeEventDetail.vue         the video player
  ts/
    catcamservices.ts         all calls to cmo_server
    meevent.ts, meollama.ts…  types for the server's JSON
```
