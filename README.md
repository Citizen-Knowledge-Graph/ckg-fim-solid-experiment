# CKG FIM Solid Experiment

## FIM

```sh
node fim.js # comment methods at the bottom in or out as needed
```

## Solid

### Setup

Start the Community Solid Server:

```shell
npx @solid/community-server -c @css:config/file.json -f .solid
```

At first start, go to `localhost:3000` in the browser and:
- *Sign up for an account* ...
- *Create pod*, name it **ckg-pod**

### Run

```sh
node solid.js # this will trigger a browser authorization
```

You may check your pod content using [penny.vincenttunru.com](https://penny.vincenttunru.com) or your local file system.
