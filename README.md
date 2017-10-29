----------
DualChess
----------

Web Project from ESIEA

Robin Ferré & Kévin Guinet

----------

To install the CLI you need to have installed npm which typically comes with NodeJS.

To install the CLI run the following npm command:

npm -g install firebase-tools
Doesn't work? You may need to change npm permissions.

To verify that the CLI has been installed correctly open a console and run:

firebase --version
Make sure the Firebase version is above 3.3.0

Authorize the Firebase CLI by running:

firebase login
Make sure you are in the web-start directory then set up the Firebase CLI to use your Firebase Project:

firebase use --add
Then select your Project ID and follow the instructions.

Now that you have imported and configured your project you are ready to run the app for the first time. Open a console at the web-start folder and run firebase serve:

firebase serve
This command should display this in the console:

Listening at http://localhost:5000

tutorial from : https://codelabs.developers.google.com/codelabs/firebase-web/#4

-------------------------------------------
Once it served, you need 2 google accounts to play. you can access our firebase database by asking us to include you as developer 

the mechanics of the game works, one single page, at the time I am writing this, we still have trouble to implement the win loose conditions without crash or bug.
