# Fitness App Mobile

A fitness mobile app built with JavaScript and React Native that tracks steps, calories, and more, powered by an Express.js backend with Node.js and MongoDB as a database.

## 📝 Requirements

- <a href="https://nodejs.org/en" target="_blank">Node.js</a> installed on your computer.

## ⚙️ Setup
1. Clone the repository:
 	```bash
 	git clone https://github.com/Benonki/Fitness-mobile-app.git
 	```
2. Enter into frontend:
    ```bash
    cd frontend
     ```
3. Install dependencies:
   ```bash
   npm i
   ```
   - In case of any `high` vulnerabilities:
      ```bash
      npm audit fix
       ```
4. Enter into backend:
	```bash
	cd ../backend
	 ```
5. Install Server dependencies:
	```bash
	npm i
	```
6. Create `.env` file in `/backend` with the following content:
    ```env
    MONGODB_URI=mongodb://localhost:27017/fitnessApp
    PORT=3000
    JWT_SECRET=default_key
    JWT_EXPIRES_IN=1d
    OPENFOODFACTS_API_URL=https://world.openfoodfacts.org
    ```
7. Select one of the following database usage versions:
### - MongoDB Version
1. Install <a href="https://www.mongodb.com/try/download/community" target="_blank"> MongoDB </a>on your PC.
2. After installation you need to add `/bin` path to environment PATH variables, default path to `/bin` should be:
   ```bash
    C:\Program Files\MongoDB\Server\<version>\bin
    ```

### - Docker Version
1. Install  [Docker](https://www.docker.com/get-started/) on your PC.
2. Open console and type:
   ```bash
    docker run --name fitness-mongo -d -p 27017:27017 -v mongo_data:/data/db mongo:latest
    ```
   - To stop docker type:
   ```bash
   docker stop fitness-mongo
   ```
   - To start docker again type:
   ```bash
   docker start fitness-mongo
   ```
## 🚀 Running the App
1. Change the IP in `src/api/axiosInstance.js` to your computer's local IPv4 (You have to be in the same network on your phone and computer for this to work).
2. You can change default key, key expiration date, server port and mongoDB connection in `.env` file in `/backend`
3. Open console nr 1 and get into `/backend`:
	```bash
	cd backend
    ```
4. Start Server (in console nr 1):
	```bash
	node server.js
    ```
5. Open console nr 2 and get into `/frontend`:
   ```bash
   cd frontend
   ```
6. Start Expo (in console nr 2):
	```bash
	npx expo start
    ```
7. You can either open http://localhost:8081/ on your PC, use the phone emulator, or scan the QR code (Recommended!!!) with Expo Go app on your phone (it needs to be SDK 51).
8. API Documentation is available after starting the server at: http://localhost:3000/api-docs/.

## 🖼️ Showcase

<div align="center">
  <img src="https://github.com/Benonki/Portfolio/blob/main/StronaGlowna/sc/FitApp.png" alt="Preview of My Project">
</div>

