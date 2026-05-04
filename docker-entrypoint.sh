#!/bin/sh
sed -i "s/|| 'https'/|| 'http'/" /app/build/handler.js
npx --yes tsx node_modules/.bin/drizzle-kit push --force
exec node build
