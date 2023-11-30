# cal.com

Local setup:
  - Pre-requisites:
    - Nodejs/yarn: Node version >= 18
    - Postgres server: Version >= 13
  - Clone the repo
  - cd cal.com/
  - yarn
  - Create a local postgres DB with name "calendso"
  - Create DB tables: 
     - yarn workspace @calcom/prisma db-deploy

Creating a User and get the auth token:
  - Create a user with an email
    - Create admin jwt token from python shell(or online):
```python
import jwt;import time;jwt.encode({"plivo_admin": "true", "exp": int(time.time()) + 600000000}, 'test')
```
    - Use above token to call Signup API, sample curl is below:
```text
curl --location --request POST 'http://localhost:3000/api/auth/signup' \
--header 'Authorization: Bearer ADMIN_TOKEN_ABOVE' \
--header 'Content-Type: application/json' \
--data-raw '{
"username": "user",
"email": "user@plivo.com"
}'
```
  - Create user jwt token from python shell(or online) where email should be above user's email:
```python
import jwt;import time;jwt.encode({"email": "user@plivo.com", "exp": int(time.time()) + 600000000}, 'test')
```
Note that in above jwt tokens generation, we have used the default key "test" from the env, if you happen to change there, use the same here also.

Running the server:
  - Run the server in dev mode: 
    - yarn run dev
  - Run the server in prod mode:
    - yarn build
    - yarn start

  - Open the web page: http://localhost:3000/auth/login?token=USER_TOKEN_ABOVE  
  
Removing the cache(when env is changed):
  - rm -rf node_modules/.cache .env.example
