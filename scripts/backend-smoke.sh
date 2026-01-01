#!/usr/bin/env bash
set -euo pipefail

# Simple smoke test for generated backend (REST)
# Assumes:
# - Backend server running on localhost:3000 (npm start in generated backend)
# - jwt secret matches generator default (CHANGE_ME_SUPER_SECRET_MIN_16_CHARS)
# - jq available for JSON parsing

BASE="${BASE:-http://localhost:3000/api}"
SECRET="${SECRET:-CHANGE_ME_SUPER_SECRET_MIN_16_CHARS}"

function make_token() {
  node -e "console.log(require('jsonwebtoken').sign({sub:'smoke', roles:['admin']}, '${SECRET}', {algorithm:'HS256'}))"
}

TOKEN=$(make_token)
AUTH=(-H "Authorization: Bearer ${TOKEN}")
JSON=(-H "Content-Type: application/json")
PARSE=${PARSE:-jq}

function parse_id() {
  local json="$1" path="$2"
  if command -v "$PARSE" >/dev/null 2>&1; then
    echo "$json" | "$PARSE" -r "$path"
  else
    echo "$json" | node - "$path" <<'NODE'
const fs = require("fs");
const pathExpr = process.argv[2] || "";
const input = fs.readFileSync(0, "utf8");
const obj = JSON.parse(input);
const sel = pathExpr.replace(/^\./, "").split(".");
const val = sel.reduce((o, k) => (o ? o[k] : undefined), obj);
console.log(val ?? "");
NODE
  fi
}

function pretty() {
  local json="$1"
  if command -v "$PARSE" >/dev/null 2>&1; then
    echo "$json" | "$PARSE" .
  else
    echo "$json"
  fi
}

echo "[1] Create user"
CREATE_USER=$(curl -s -w "\n%{http_code}" "${AUTH[@]}" "${JSON[@]}" -d '{"name":"Alice","email":"alice@example.com","isActive":true}' "${BASE}/user")
HTTP_CODE=$(echo "$CREATE_USER" | tail -n1)
BODY=$(echo "$CREATE_USER" | sed '$d')
echo "$BODY"
USER_ID=$(parse_id "$BODY" '.data.id' || true)
if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "HTTP error $HTTP_CODE, aborting."
  exit 1
fi
if [ -z "$USER_ID" ] || [ "$USER_ID" = "null" ]; then
  echo "Failed to create user, aborting."
  exit 1
fi

echo "[2] Get user ${USER_ID}"
pretty "$(curl -s "${AUTH[@]}" "${BASE}/user/${USER_ID}")"

echo "[3] Update user ${USER_ID}"
pretty "$(curl -s "${AUTH[@]}" "${JSON[@]}" -X PATCH -d '{"name":"Alice v2"}' "${BASE}/user/${USER_ID}")"

echo "[4] List users"
pretty "$(curl -s "${AUTH[@]}" "${BASE}/user?page=1&limit=10")"

echo "[5] Create post"
CREATE_POST=$(curl -s "${AUTH[@]}" "${JSON[@]}" -d "{\"title\":\"Hello\",\"content\":\"Lorem ipsum\",\"published\":true,\"viewCount\":0,\"authorId\":\"${USER_ID}\"}" "${BASE}/post")
echo "$CREATE_POST"
POST_ID=$(parse_id "$CREATE_POST" '.data.id')
if [ -z "$POST_ID" ] || [ "$POST_ID" = "null" ]; then
  echo "Failed to create post, aborting."
  exit 1
fi

echo "[6] Get post ${POST_ID}"
pretty "$(curl -s "${AUTH[@]}" "${BASE}/post/${POST_ID}")"

echo "[7] Delete post ${POST_ID}"
pretty "$(curl -s "${AUTH[@]}" -X DELETE "${BASE}/post/${POST_ID}")"

echo "[8] Create comment"
pretty "$(curl -s "${AUTH[@]}" "${JSON[@]}" -d "{\"text\":\"Nice post!\",\"postId\":\"${POST_ID}\",\"userId\":\"${USER_ID}\"}" "${BASE}/comment")"

echo "[9] List comments"
pretty "$(curl -s "${AUTH[@]}" "${BASE}/comment")"

echo "Smoke test finished."
