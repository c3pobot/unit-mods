#!/bin/bash
echo updating data-cache
npm i --package-lock-only github:c3pobot/data-cache
echo updating rqlite-cache
npm i --package-lock-only github:c3pobot/rqlite-cache
echo updating mongo-cache
npm i --package-lock-only github:c3pobot/mongo-cache
echo updating mongo-cache-local
npm i --package-lock-only github:c3pobot/mongo-cache-local
