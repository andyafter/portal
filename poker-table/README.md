# Poker Table

Simple Next.js client to play heads-up poker against the `/blueprint` AI.
Small blind is 1 chip and big blind is 2 chips.

## Running locally

```bash
npm install
npm run dev
```

The UI sends your actions and the current game state to `http://127.0.0.1:8888/blueprint`.
Ensure the server from the root documentation is running with the `analyze` feature.

Run `npm run build` to create a production build.
