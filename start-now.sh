#!/bin/bash
cd /e/ByGagoos-Ink/backend && npm run dev &
sleep 2
cd /e/ByGagoos-Ink/frontend && npm run dev &
wait
