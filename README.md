<br />
<p align="center">
	<img src="https://www.argentapp.com//assets/img/logos/argent/logo-app.png" width="220">
</p>
<br />
##Application Programming Interface (API)

###Introduction

To get started with Running Argent you will need the following system configuration

Required dependencies

```.bash_profile``` environment variables + view hidden files
<br />
```defaults write com.apple.finder AppleShowAllFiles YES;```
<br />```killall Finder /System/Library/CoreServices/Finder.app```
<br /><br />Request the Argent local ```.bash_profile``` file from a Argent administrator

Other environment variables should shadow production/dev env variables on Heroku

- NodeJS (v.4.2.4)
- Bower
- Gulp
- Mongo express
- MongoDB
- Homebrew
- Nodemon 
- Docco 

```sudo npm i docco -g```
<br />```sudo npm i nodemon -g```

#####Do not do the following unless absolutely necessary, it give files root permissions for installs to run
```sudo chmod -R 0777 argent```  
```sudo chmod -R 0777 argent-api```  

Use Homebrew to install Mongo
<br />```ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"```

Then
<br />```brew install mongodb```


####HOWTO: Create MongoDB instance to run API locally
```sudo mkdir -p data/db```  
```sudo chmod -R 0777 data/db```  
```sudo mongod --dbpath data/db```  
Check ```localhost:27017``` to see mongo running  
```mongo-express -u user -p password -d database``` 
<br />Check ```localhost:8081``` to see mongo database 


####HOWTO: Generate Documentation
```docco *.js```

Run ```nodemon server``` to instantiate API

API will now be running on ```http://localhost:5001```
<br />Local MongoDB will now be running on ```http://localhost:8081```
<br />Mongo Connection open on ```http://localhost:27017/{dbname}```

----------------------------------------------------

##Angular 1.3.8 User Interface (UI)

Run the following commands
<br />```sudo npm i bower -g```
<br />```sudo npm i gulp -g```
<br />```sudo npm i```
<br />```sudo bower i```

SASS
<br />```!important``` Fix for node-sass, lib-sass necessary
<br />```node sassdef``` Compile SASS files to CSS build files

Edit the following in ```src/app/index.js``` to match local settings
<br />
```
.value('appconfig',{
        apiRoot: 'http://localhost:5001',
})
```    
Run ```nodemon server``` to instantiate Angular frontend

App should now be running on ```http://localhost:5000```
<br />Requests will be made to the local API at ```http://localhost:5001```

----------------------------------------------------

##Staging and Deployment

------------------------------
### AWS documentation needed, replace heroku

Download Toolbelt
<br />https://toolbelt.heroku.com/osx

With Two-Factor Authentication
```heroku login``` and enter credentials

Add any domain endpoints necessary
<br />```heroku domains:add {mydomainname}```

Production Ready Checklist:
- Add MongoLab
- Add Expedited SSL
- Add SSL
- Add Librato
- Add Logentries
- Scale Dynos

Since our Heroku instance has two-factor authentication enabled you will need an app such as Google Authenticator to login

------------------------------
###AWS

In order to deploy API instance to AWS it is necessary to have a configured env.config with necessary environment variables.  In addition, the config.yml file must contain a branch default dev and master name such as {instance}-api-stage-v1

------------------------------
###Mongo

For initializing Local DB
<br />```sudo mkdir -p data/db```
<br />```sudo chmod -R 0777 data/db```
<br />```sudo mongod --dbpath data/db```
<br />```mongo-express -u user -p password -d database```

Updating a collection
<br />```show dbs```
<br />```use {db_name}```
<br />```db.users.update({}, {$set: {tenant_id: 123}}, { multi: true })```

Killing a process
<br />```ps -ef | grep mongod```
<br />```sudo kill -9 <pid> // for example sudo kill -9 12912```

<br />https://docs.mongodb.com/manual/tutorial/write-scripts-for-the-mongo-shell/

------------------------------
###Stripe

Be sure to have correct public key and sandbox keys
<br />https://dashboard.stripe.com

*The API Will configure the correct local development environment and production environment*
<br />The Angular frontend will require **configuring client key values in src/app/index.js**

------------------------------
###GitHub

https://help.github.com/articles/set-up-git/

In order to clone with two-factor authentication enabled you must set up an access token
<br /> https://github.com/settings/tokens > generate new token
<br /> Sign in using username and access token as password.

To commit to Github

```git branch {branchname}```
<br />```git add {files to commit}``` **ignore adding src/app/index.js unless absolutely necessary
<br />```git commit -m 'my commit'```
<br />```git push -u origin {branchname}```

To ensure identities for commits
<br />```git config user.name "{githubusername}"```
<br />```git config --global user.email "{your_email@example.com}"```

------------------------------
###BlueHost

In order to connect Heroku to a domain name server you will need to adjust the CNAME entry
- Remove currently existing www CNAME
- To do this add a new www CNAME pointing to ```http://{myapp}.herokuapp.com```
- This will now point the domain to the Heroku instance

Be sure to add a redirect rule (with or without www) to your app instance
- Non-Secured: Add redirect rule (with or without www) to ```http://www.{myapp}.com```
- Secured SSL: Add redirect rule (with or without www) to ```https://www.{myapp}.com```

In order to create a subdomain pointing to an API instance you will need to add a new CNAME Record
- Add CNAME Record api
- Point CNAME Record to ```https://{myapi}.herokuapp.com```

------------------------------
###SSL

To correctly provision the SSL it is recommended to use a service such as Expedited SSL
- Once the third-party SSL Service has been installed, edit your www CNAME to point to the SSL endpoint (e.g. ```https://floatingbreeze8293.herokuapp.com```)

------------------------------
###Push Notifications
Follow this: http://stackoverflow.com/questions/21250510/generate-pem-file-used-to-setup-apple-push-notification
And this: https://github.com/argon/node-apn/wiki/Preparing-Certificates

Useful commands
openssl x509 -in aps.cer -inform DER -outform PEM -out cert.pem
openssl pkcs12 -in key.p12 -out key.pem -nodes

------------------------------
###APP STORE

- Create an archive
- Bump build version
- Upload to the App Store

------------------------------
###VIDEO

- ProRes 422 HQ https://developer.apple.com/library/ios/documentation/LanguagesUtilities/Conceptual/iTunesConnect_Guide/Appendices/Properties.html#//apple_ref/doc/uid/TP40011225-CH26-SW14

------------------------------
###QUESTIONS?

For any questions please email [support](mailto:support@argent-tech.com)


