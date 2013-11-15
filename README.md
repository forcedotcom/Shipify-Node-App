<p align="center">
![image](https://raw.github.com/rajaraodv/shipment/master/images/shipment-readme.jpg)


#### Continuous Integration Result
[![Build Status](https://travis-ci.org/rajaraodv/shipment.png?branch=master)](https://travis-ci.org/rajaraodv/shipment)

## About
This is a proof of concept shipment fulfillment app that shows how to tightly integrate a 3rd party app like this one into Salesforce using <b>Force.com Canvas</b>.

## How it Works
On its own it performs 2 tasks:

1. Displays list of `Open Invoice` items. 
2. Allows a Salesforce user to 'Ship' an invoice. i.e. Marks the invoice as `Closed` and also posts a message to that invoice's sccount Chatter feed which indicates that the Invoice has been shipped.

## How to set it up
While the app is fine, the user still has to:

1. Log in to Salesforce
2. Create a Connected App in Salesforce with this apps URL (on Heroku or elsewhere) and add APP_SECRET (Consumer Secret) and RUNNING_ON_HEROKU (true or false) as env vars
3. Create 'Open' (picklist field) invoice records
4. Add Canvas into a global publisher action to Ship Invoices


## Tell me more
Force.com Canvas allows us to pass Salesforce user information and access_token in an encrypted string called: `signed_request`. Further, Canvas also allows embedding third party apps as 'tabs', 'links', 'buttons' etc at various location inside Salesforce.


#### Picture of highly contextual 'Ship It' button

<img src="https://raw.github.com/rajaraodv/shipment/master/images/ship-it-button.png" height="400" width="700px" />

(click to enlarge)


#### Picture of 'Shipment' link in Chatter tab.
<img src="https://raw.github.com/rajaraodv/shipment/master/images/chatter-tab.png" height="400" width="700px" />

(click to enlarge)


## Converting our app to a Force.com Canvas app

To take advantage of Canvas, we need to do the following:


1. Create a new `HTTP POST` endpoint like `https://www.myshipmentapp.com/signed-request`on our 3rd party app. 


```javascript

//Processes signed-request and displays index.ejs
app.post('/signedrequest', processSignedRequest); 

function processSignedRequest(req, res) {
  console.log('in http post');
  try {
    var json = shipment.processSignedRequest(req.body.signed_request, APP_SECRET);
    res.render("index", json);
  } catch (e) {
    res.render("error", {
      "error": errors.SIGNED_REQUEST_PARSING_ERROR
    });
  }
}

```

2.Ask (or login as) Salesforce Administrator and register this app as a Canvas app `[Admin Name] > Setup > Create > apps > Connected Apps > New`.  


3.Provide the end point from #1 as the `Canvas app URL`. The configuration might look like <a href='https://raw.github.com/rajaraodv/shipment/master/images/salesforce-admin-canvas.png' target='_blank'>this</a>.
<img src="https://raw.github.com/rajaraodv/shipment/master/images/salesforce-admin-canvas.png" height="400" width="700px" />

(click to enlarge)


#### Deep Contextual Embedding 
To go one step further, let's contextually embed this app as a button (say 'Ship It' button) inside custom object (say: Warehouse) that look like <a href='https://raw.github.com/rajaraodv/shipment/master/images/ship-it-button.png' target='_blank'>this</a>.



1. Open `[Admin Name] > Setup > Develop > Pages` and create a Visualforce page to wrap around the canvas app. This allows us to pass current page's context like `Warehouse__c.Id` to the 3rd party app.

```
<apex:page standardController="Warehouse__c" sidebar="false" showheader="false">
    <apex:canvasApp developerName="shipment" width="100%" parameters="{'id':'{!Warehouse__c.Id}'}"    />
</apex:page>
```
<img src="https://raw.github.com/rajaraodv/shipment/master/images/visualforcepage-canvas-wrapper.png" height="400" width="700px" /> 
<br>
2.Open `[Admin Name] > Setup > Create > Objects` and open up the custom object. In our case, `Warehouse` object. 

3.Then under `"Buttons, Links, and Actions" > New`, create an action button called `Ship It` that opens up the Visualforce page we had created earlier in Step 1.
<img src="https://raw.github.com/rajaraodv/shipment/master/images/ship-it-button-code.png" height="400" width="700px" /> 

4.That's it. We have now converted our 3rd party app to become a Salesforce Canvas app. Our app will now show up at various places with in Salesforce making it seamless for users to use its functionalities.


#The Server
The server has the following HTTP end points.

```

//Processes signed-request and displays index.ejs
app.post('/signedrequest', processSignedRequest);

//Returns list of invoices based on warehouse context. It first gets list of invoice_ids from 
//line_items and then later gets invoice details of each of those invoice_ids that are not //closed.
app.get('/invoices', getInvoices);

//Posts to Account Chatter feed and also updates Invoices' status to 'Closed'
app.post('/ship/:invoiceId/?', shipInvoice);

//Dont allow direct HTTP requests to "/"
app.all('/', dontAllowDirectRequestsToIndex);

//Dont allow direct HTTP GET (POST is allowed) requests to "/signedrequest"
app.get('/signedrequest', dontAllowDirectRequestsToIndex);


```

#### To Run locally

Pre-requisites:

1. Have the <a href='http://www.salesforce.com/us/developer/docs/workbook/workbook.pdf'>Warehouse app</a> fully built and running in your organization. You can find the tutorial in our workbook. In addition, you need to create a lookup field on Merchandise to a new custom object Warehouse__c. Finally, create a lookup relationship on Invoice__c to the standard Account object.
2. If you are testing on local host, have Self-signed certificate installed and have allowed your browser to accept it. In this case set the RUNNING_ON_HEROKU env var to false.



#####Steps for self-signed certificate and running it locally:

Canvas app needs this server to be using `https`. 

1. First create a self-signed certificate and key by following instructions <a href='https://devcenter.heroku.com/articles/ssl-certificate-self' target='_blank'>here</a> or from anywhere on the internet.
2. Make sure the .key file's name is `host.key` and is located in `/etc/apache2/ssl/host.key` folder.
3. Make sure the .crt file's name is `server.crt` and is located in `/etc/apache2/ssl/server.crt` folder.
4. Run the server using `sudo APP_SECRET="<Your APP Secret>" app.js`
5. Open browser and go to `https://localhost`.
6. Browsers will say that the certificate is not trusted, do you want to continue. Press Continue.
7. Now that you have allowed browser to accept self-signed certificate, you can login to Salesforce and access the app.

<b>Note: Step 6 is a BIG Gotcha. Without forcing browser to accept self-signed certificate, Canvas app simply wont work </b>








####Test

1. Install Mocha, expect, chai & should by running npm install
2. You may want to install Mocha globally by running npm install -g mocha
3. Simply run mocha in the command line.

