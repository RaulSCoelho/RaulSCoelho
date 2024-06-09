# RaulSCoelho ESLint config

## Setup

### React (with Next.js)

Install dependencies:
```
npm i -D eslint @raulscoelho/eslint-config
```
Inside `.eslintrc.json`
```
{
  "extends": [
    "@raulscoelho/eslint-config/next", 
    "next/core-web-vitals"
  ]
}
```

### Node.js

Install dependencies:
```
npm i -D eslint @raulscoelho/eslint-config
```
Inside `.eslintrc.json`
```
{
  "extends": "@raulscoelho/eslint-config/node"
}
```