var Shipment = require('./shipment.js');
var errors = require('./errors.js');
var config = require('./config.js');


function RestEndPoints() {}


RestEndPoints.prototype.addToApp = function(app) {
  //End points..
  app.all('/', dontAllowDirectRequestsToIndex);
  app.post('/signedrequest', processSignedRequest);
  app.get('/signedrequest', dontAllowDirectRequestsToIndex);
  app.get('/invoices', getInvoices);
  app.post('/ship/:invoiceId/?', shipInvoice);
};


RestEndPoints.prototype.setAppSecret = function(secret) {
  console.log('setting secret..' + secret);
  APP_SECRET = secret;
};

exports = module.exports = new RestEndPoints;

//------------------------------------------ HANDLERS ---------------------------------------------
//-------------------------------------------------------------------------------------------------

//HTTP GET to / (not allowed)
function dontAllowDirectRequestsToIndex(req, res) {
  res.render("error", {
    error: errors.HTTP_GET_POST_NOT_SUPPORTED
  });
}

//Processes signed-request and displays index.ejs

function processSignedRequest(req, res) {
  var shipment = new Shipment();
  try {
    var json = shipment.processSignedRequest(req.body.signed_request, config.APP_SECRET);
    res.render("index", json);
  } catch (e) {
    res.render("error", {
      "error": errors.SIGNED_REQUEST_PARSING_ERROR
    });
  }
}

//returns list of invoices based on warehouse context. It first gets list of invoice_ids from line_items 
// and then later gets invoice details of each of those invoice_ids that are not closed.

function getInvoices(req, res) {
  if (!req.headers.authorization || !req.headers.instance_url) {
    res.json(400, {
      'Error': errors.MUST_PASS_AUTH_INSTANCE_URL
    });
    return;
  }
  var shipment = new Shipment();
  shipment.on('invoices', function(result) {
    var data = result.err ? result.err : result.data;
    res.json(result.statusCode, data);
  });

  shipment.getInvoices(req.headers.authorization, req.headers.instance_url, req.headers.warehouse_id);
}

//Posts to Account Chatter feed and also updates Invoices' status to 'Closed'

function shipInvoice(req, res) {
  var shipment = new Shipment();
  var so = _getShippingDetails(req);
  //console.log(so);
  if (!so.authorization || !so.instanceUrl || !so.invAccountId || !so.invoiceName || !so.invoiceId) {
    return res.json(400, {
      'Error': errors.MISSING_REQUIRED_SHIPPING_PARAMETERS
    })
  }


  shipment.on('shipped', function(result) {
    var data = result.err ? result.err : result.data;
    res.json(result.statusCode, data);
  });

  shipment.ship(so);
};

function _getShippingDetails(req) {
  return {
    authorization: req.headers.authorization,
    instanceUrl: req.headers.instance_url,
    invAccountId: req.body.ParentId,
    invoiceName: req.body.Name,
    invoiceId: req.params.invoiceId,
    warehouseId: req.headers.warehouse_id /*optional*/
  }
};