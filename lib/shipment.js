var decode = require('salesforce-signed-request');
var errors = require('./errors.js');
var events = require('events');
var util = require('util');
var request = require('request');
var config = require('./config.js');

	function Shipment() {
		events.EventEmitter.call(this);
	}

util.inherits(Shipment, events.EventEmitter);

Shipment.prototype.processSignedRequest = function processSignedRequest(signedRequest, APP_SECRET) {
	var sfContext = decode(signedRequest, APP_SECRET);
	//console.log(sfContext);
	return {
		oauthToken: sfContext.client.oauthToken,
		instanceUrl: sfContext.client.instanceUrl,
		warehouseId: sfContext.context.environment.parameters.id //sent as parameters via visualForce parameters
	}
};

Shipment.prototype.getInvoices = function getInvoices(authorization, instanceUrl, warehouseId) {
	var self = this;

	//Listen to 'get-invoices-from-lineItems' event and call getInvoiceDetailsFromIds.
	this.once('get-invoices-from-lineItems', function(response) {
		if (response.err) {//on error
			self.emit('invoices', response);
		} else {
			self.getInvoiceDetailsFromIds(authorization, instanceUrl, response.data);
		}
	});

	//Listen to 'get-invoices-from-ids' event and emit 'invoices' back to browser.
	this.once('get-invoices-from-ids', function(response) {
			self.emit('invoices', response);
	});

	//Start with getOpenInvoiceIdsFromLineItems
	this.getOpenInvoiceIdsFromLineItems(authorization, instanceUrl, warehouseId);
};

/**
 * Performs multiple operations to 'ship' the invoice.
 *
 * Pass shippingObject = so = {
 *   authorization: req.headers.authorization,
 *    instanceUrl: req.headers.instance_url,
 *    invAccountId: req.body.ParentId,
 *    invoiceName: req.body.Name,
 *    invoiceId: req.params.invoiceId,
 *	 warehouseId: req.headers.warehouseId
 *  }
 **/
Shipment.prototype.ship = function ship(so) {
	var self = this;

	/* Decorate shipping object (so) with more shipping related info. */

	//Add orderNumber to shippingObject
	this._setOrderNumber(so);

	// Add chatterMsg to shippingObject
	this._setShipmentChatterMsg(so);

	// add 18 & 15 chars warehouseId to SO
	so.warehouseId = this._formatWarehouseId(so.warehouseId);


	//Listen to 'add-shipping-info-to-account-chatter' event and call closeInvoice.
	this.once('add-shipping-info-to-account-chatter', function(response) {
		if (response.err) {
			self.emit('shipped', response);
		} else {
			self.closeInvoice(so);
		}
	});

	//Listen to 'close-invoice' event and call createDelivery.
	this.once('close-invoice', function(response) {
		if (response.err) {
			self.emit('shipped', response);
		} else {
			self.createDelivery(so);
		}
	});

	//Listen to 'create-delivery' event and (finally) emit 'shipped'.
	this.once('create-delivery', function(response) {
		self.emit('shipped', response);
	});

	this.addShippingInfoToAccountChatter(so);
};

Shipment.prototype.getOpenInvoiceIdsFromLineItems = function getOpenInvoiceIdsFromLineItems(authorization, instanceUrl, warehouseId) {
	var self = this;
	var q = 'SELECT Invoice__c From Line_Item__C';
	var wId = this._formatWarehouseId(warehouseId);
	if (wId) {
		q += " where Warehouse__C = '" + wId.chars18 + "' OR Warehouse__C = '" + wId.chars15 + "'";
	}

	var reqOptions = {
		url: instanceUrl + '/services/data/v28.0/query?q=' + q,
		headers: {
			'Authorization': this._formatAuthHeader(authorization)
		}
	}
	//Call Salesforce and emit 'get-invoices-from-lineItems' with result (that includes data or Error)
	request(reqOptions, this.handleAJAXResponse('get-invoices-from-lineItems'));
};

Shipment.prototype.getInvoiceDetailsFromIds = function getInvoiceDetailsFromIds(authorization, instanceUrl, invoices) {
	var idsClause = this._getIdsWhereClause(invoices);
	var q = "SELECT Id, Name, Account__c, Account__r.Name, Invoice_Total__c, Status__c FROM Invoice__c Where Status__c !='Closed' AND " + idsClause;
	var authorization = this._formatAuthHeader(authorization);
	var reqOptions = {
		url: instanceUrl + '/services/data/v28.0/query?q=' + q,
		headers: {
			'Authorization': authorization
		}
	};

	request(reqOptions, this.handleAJAXResponse('get-invoices-from-ids'));
};


Shipment.prototype.addShippingInfoToAccountChatter = function addShippingInfoToAccountChatter(so) {
	var body = {
		ParentId: so.invAccountId,
		Body: so.chatterMsg
	}

	var authorization = this._formatAuthHeader(so.authorization);

	var reqOptions = {
		url: so.instanceUrl + '/services/data/v28.0/sobjects/FeedItem/',
		method: 'POST',
		headers: {
			'Authorization': authorization,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	};

	//make ajax request and emit 'add-shipping-info-to-account-chatter' with result data or error back to listner.
	request(reqOptions, this.handleAJAXResponse('add-shipping-info-to-account-chatter', so));
}

Shipment.prototype.closeInvoice = function closeInvoice(so) {
	var authorization = this._formatAuthHeader(so.authorization);

	var body = {
		'Status__C': 'Closed'
	};

	var reqOptions = {
		url: so.instanceUrl + '/services/data/v28.0/sobjects/Invoice__C/' + so.invoiceId,
		method: 'PATCH',
		headers: {
			'Authorization': authorization,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	};

	//make ajax request and emit 'close-invoice' with result data or error back to listner.
	request(reqOptions, this.handleAJAXResponse('close-invoice', so));
};


Shipment.prototype.createDelivery = function createDelivery(so) {
	var self = this;
	var authorization = this._formatAuthHeader(so.authorization);
	if(!so.invoiceId) {
		var err = new Error("Must Pass InvoiceId to Ship!");
		err.statusCode = '400';
		err.err = err.message;
		this.emit('create-delivery', err);
		return;
	}
	var quickActionBody = {
		contextId: so.invoiceId,
		record: {
			Order_Number__c: so.orderNumber
		}
	};

	var deliveryReq = {
		url: so.instanceUrl + '/services/data/v28.0/sobjects/Invoice__c/quickActions/Create_Delivery/',
		method: 'POST',
		headers: {
			'Authorization': authorization,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(quickActionBody)
	};

	//make ajax request and emit 'create-delivery' with result data or error back to listner.	
	request(deliveryReq, this.handleAJAXResponse('create-delivery'));
};

Shipment.prototype.handleAJAXResponse = function(successEventName, so) {
	var self = this;
	var successEventName = successEventName;
	var so = so || {};

	return function(err, response, body) {

		var statusCode = response.statusCode;
		so.data = body ? JSON.parse(body) : {};

		so.statusCode = so.data.statusCode = statusCode;
		if (err) {
			so.successEventName = "FAIL";
			so.err = {
				statusCode: statusCode,
				err: err
			};
		} else if (statusCode != 200 && statusCode != 201 && statusCode != 204) {
			so.successEventName = "FAIL";
			so.err = {
				statusCode: statusCode,
				err: so.data
			}
		} else {
			so.successEventName = "OK";
		}
		self.emit(successEventName, so);
	}
};

Shipment.prototype._setShipmentChatterMsg = function _setShipmentChatterMsg(so) {
	so.chatterMsg = "Invoice: " + so.invoiceName + " has been shipped! Your order number is #" + so.orderNumber + " " + so.instanceUrl + "/" + so.invoiceId
};

Shipment.prototype._setOrderNumber = function _setOrderNumber(so) {
	so.orderNumber = Math.floor(Math.random() * 90000) + 10000;
};

//Validates and returns either null, OR, {chars18: First_18_chars_of_warehouseId, chars15: First_15_chars_of_warehouseId}
Shipment.prototype._formatWarehouseId = function _formatWarehouseId(warehouseId) {
	if (warehouseId && warehouseId != 'undefined' && warehouseId != '' && (warehouseId.length == 15 || warehouseId.length == 18)) {
		return {
			chars18: warehouseId,
			chars15: warehouseId.substr(0, 15)
		}
	}
};

Shipment.prototype._getIdsWhereClause = function _getIdsWhereClause(invoices) {
	var items = invoices.records;
	var str = '';
	var ids = [];
	for (var i = 0; i < items.length; i++) {
		var id = items[i]['Invoice__c'];
		if (id && str.indexOf(id) == -1) {
			var formattedId = "Id = '" + id + "' ";
			str += formattedId + " ";
			ids.push(formattedId);
		}
	}
	return "(" + ids.join(' OR ') + ")";
};

Shipment.prototype._formatAuthHeader = function _formatAuthHeader(header) {
	var h = header.toLowerCase(header);
	return h.indexOf('oauth ') == 0 ? header : 'OAuth ' + header;
};


Shipment.prototype.__test = function __test(count) {
	var self = this;
	setTimeout(function() {
		self.emit('__test', count);
	}, 1);
};


exports = module.exports = Shipment;