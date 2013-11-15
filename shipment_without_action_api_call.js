var decode = require('salesforce-signed-request');
var errors = require('./errors.js');
var events = require('events');
var util = require('util');
var request = require('request')

	function Shipment() {
		events.EventEmitter.call(this);
	}
util.inherits(Shipment, events.EventEmitter);

/* this verifies and decodes the signed request */
Shipment.prototype.processSignedRequest = function processSignedRequest(signedRequest, APP_SECRET) {
	var sfContext = decode(signedRequest, APP_SECRET);
	return {
		oauthToken: sfContext.client.oauthToken,
		instanceUrl: sfContext.client.instanceUrl,
		warehouseId: sfContext.context.environment.parameters.id //sent as parameters via visualForce parameters
	}
};

Shipment.prototype.getInvoices = function getInvoices(authorization, instanceUrl, warehouseId) {
	// Start building query on all invoices
	var q = 'SELECT Invoice__c From Line_Item__C';

	/* if a parameter is specified with the warehouse id from a VF page, this will grab that warehouseId and filter the list of line items
	* to only show line items related to merchandise from that particular warehouse */
	if (warehouseId && warehouseId != 'undefined' && warehouseId != '' && (warehouseId.length == 15 || warehouseId.length == 18)) {
		var warehouseId15Chars = warehouseId.substr(0, 15);
		q += " where Warehouse__C = '" + warehouseId + "' OR Warehouse__C = '" + warehouseId15Chars + "'";
	}

	//this starts building the REST call to query for the list of line items
	var reqOptions = {
		url: instanceUrl + '/services/data/v28.0/query?q=' + q,
		headers: {
			'Authorization': this._formatAuthHeader(authorization)
		}
	}

	var self = this;
	request(reqOptions, function(err, response, body) {
		if (err) {
			return self.emit('error', err);
		}
		//once the request returns a response it sends the body to query for invoices based off of the Invoice id's related to these line items
		self._getInvoicesFromIds(authorization, instanceUrl, JSON.parse(body));
	});
};

Shipment.prototype._getInvoicesFromIds = function getInvoicesFromIds(authorization, instanceUrl, invoices) {
	//_getIdsWhereClause stores the Ids to a list var that contains a bunch of Invoice id's
	var idsClause = this._getIdsWhereClause(invoices);

	//this query will grab all open invoices and if is part of the invoices related to merchandise in the warehouse specified
	var q = "SELECT Id, Name, Account__c, Account__r.Name, Invoice_Total__c, Status__c FROM Invoice__c Where Status__c !='Closed' " + idsClause;

	var authorization = this._formatAuthHeader(authorization);
	var reqOptions = {
		url: instanceUrl + '/services/data/v28.0/query?q=' + q,
		headers: {
			'Authorization': authorization
		}
	};
	var self = this;
	request(reqOptions, function(err, response, body) {
		if (err) {
			return self.emit('error', err);
		} else {
			return self.emit('invoices', JSON.parse(body));
		}
	});
};

//  {
//     authorization: req.headers.authorization,
//     instanceUrl: req.headers.instance_url,
//     invAccountId: req.body.ParentId,
//     invoiceName: req.body.Name,
//     invoiceId: req.params.invoiceId
//   }
Shipment.prototype.ship = function ship(so) {
	/* once the app is told to ship, it creates a post to post to the Account chatter feed */
	var body = {
		ParentId: so.invAccountId,
		Body: this._getShipmentChatterMsg(so)
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

	var self = this;
	request(reqOptions, function(err, response, body) {
		var statusCode = response.statusCode;
		if (!err && (statusCode == 200 || statusCode == 201)) {
			// if the chatter post goes through without an error, Shipify then closes the invoice
			self._closeInvoice(so);
		} else {
			self.emit('error', err);
		}
	});
}

Shipment.prototype._closeInvoice = function _closeInvoice(so) {
	var authorization = this._formatAuthHeader(so.authorization);
	var body = {
		'Status__C': 'Closed'
	}
	var reqOptions = {
		url: so.instanceUrl + '/services/data/v28.0/sobjects/Invoice__C/' + so.invoiceId,
		method: 'PATCH',
		headers: {
			'Authorization': authorization,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	};

	var self = this;
	request(reqOptions, function(err, response, body) {
		var statusCode = response.statusCode;
		if (!err && (statusCode == 200 || statusCode == 204)) {
			//if the invoice status changes to closed without an error, Shipify notifies the end user it is shipped
			self.emit('shipped', {
				'result': 'OK'
			});
		} else {
			self.emit('error', err);
		}
	});
};

Shipment.prototype._getShipmentChatterMsg = function _getShipmentChatterMsg(so) {
	// This is a randomly generated number, but in reality would be a real number grabbed from this back end system 
	var orderNumber = Math.floor(Math.random() * 90000) + 10000;
	return "Invoice: " + so.invoiceName + " has been shipped! Your order number is #" + orderNumber + " " + so.instanceUrl + "/" + so.invoiceId
}

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
	/*********/
	if(ids.length > 0){
		return "AND (" + ids.join(' OR ') + ")";
	} else {
		return '';
	}
}

Shipment.prototype._formatAuthHeader = function _formatAuthHeader(header) {
	var h = header.toLowerCase(header);
	return h.indexOf('oauth ') == 0 ? header : 'OAuth ' + header;
}

exports = module.exports = new Shipment();