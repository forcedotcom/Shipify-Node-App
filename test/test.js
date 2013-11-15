var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();
var app = require('../app');
var errors = require('../lib/errors.js');
var config = require('../lib/config.js');

var Shipment = require('../lib/shipment.js');
var shipment;

beforeEach(function(done) {
	shipment = new Shipment();
	done();
});

//SETUP..
var test_data = require('./test-data');
var test_signed_request = "V/lsK06wzoefsXdKVc231sIkTxi5zYV2J2FW1hlu0VQ=.eyJ1c2VySWQiOiIwMDVSMDAwMDAwMERnSkEiLCJjbGllbnQiOnsib2F1dGhUb2tlbiI6IjAwRFIwMDAwMDAwOGJQQyFBUThBUVBVSFBrTEpTUEdDVkpYZjBOak5IQzVCRmZUNHJJQ0tmLlpxMWFrRGlHYXZWcTAzel90dnpiMWY2TlVwT1AzVjFrZG1xY2t1bzY4a0w0bDZwUXczNDZkX1Y4ZFEiLCJpbnN0YW5jZUlkIjoiXzpzaGlwbWVudDoiLCJ0YXJnZXRPcmlnaW4iOiJodHRwczovL21vYmlsZTEudC5zYWxlc2ZvcmNlLmNvbSIsImluc3RhbmNlVXJsIjoiaHR0cHM6Ly9tb2JpbGUxLnQuc2FsZXNmb3JjZS5jb20ifSwiaXNzdWVkQXQiOjEzODQ4MTkwNTksImNvbnRleHQiOnsiYXBwbGljYXRpb24iOnsiZGV2ZWxvcGVyTmFtZSI6InNoaXBtZW50IiwicmVmZXJlbmNlSWQiOiIwOUhSMDAwMDAwMDAwTjkiLCJhcHBsaWNhdGlvbklkIjoiMDZQUjAwMDAwMDAwMGNJIiwiY2FudmFzVXJsIjoiaHR0cHM6Ly9sb2NhbGhvc3Qvc2lnbmVkcmVxdWVzdCIsIm5hbWUiOiJzaGlwbWVudCIsInZlcnNpb24iOiIxLjAiLCJuYW1lc3BhY2UiOm51bGwsImF1dGhUeXBlIjoiU0lHTkVEX1JFUVVFU1QifSwib3JnYW5pemF0aW9uIjp7Im9yZ2FuaXphdGlvbklkIjoiMDBEUjAwMDAwMDA4YlBDTUFZIiwiY3VycmVuY3lJc29Db2RlIjoiVVNEIiwibXVsdGljdXJyZW5jeUVuYWJsZWQiOmZhbHNlLCJuYW1lIjoiU2FtJ3MgUzEgVGVzdCBPcmciLCJuYW1lc3BhY2VQcmVmaXgiOm51bGx9LCJlbnZpcm9ubWVudCI6eyJkaW1lbnNpb25zIjp7ImhlaWdodCI6IjkwMHB4IiwibWF4SGVpZ2h0IjoiMjAwMHB4IiwibWF4V2lkdGgiOiIxMDAwcHgiLCJ3aWR0aCI6IjgwMHB4In0sImRpc3BsYXlMb2NhdGlvbiI6IkNoYXR0ZXIiLCJ1aVRoZW1lIjoiVGhlbWUzIiwidmVyc2lvbiI6eyJhcGkiOiIyOS4wIiwic2Vhc29uIjoiV0lOVEVSIn0sImxvY2F0aW9uVXJsIjoiaHR0cHM6Ly9tb2JpbGUxLnQuc2FsZXNmb3JjZS5jb20vX3VpL2NvcmUvY2hhdHRlci91aS9DaGF0dGVyUGFnZSIsInBhcmFtZXRlcnMiOnt9fSwibGlua3MiOnsibG9naW5VcmwiOiJodHRwczovL21vYmlsZTEudC5zYWxlc2ZvcmNlLmNvbS8iLCJjaGF0dGVyRmVlZEl0ZW1zVXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvY2hhdHRlci9mZWVkLWl0ZW1zIiwiY2hhdHRlckZlZWRzVXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvY2hhdHRlci9mZWVkcyIsImNoYXR0ZXJHcm91cHNVcmwiOiIvc2VydmljZXMvZGF0YS92MjkuMC9jaGF0dGVyL2dyb3VwcyIsImNoYXR0ZXJVc2Vyc1VybCI6Ii9zZXJ2aWNlcy9kYXRhL3YyOS4wL2NoYXR0ZXIvdXNlcnMiLCJlbnRlcnByaXNlVXJsIjoiL3NlcnZpY2VzL1NvYXAvYy8yOS4wLzAwRFIwMDAwMDAwOGJQQyIsIm1ldGFkYXRhVXJsIjoiL3NlcnZpY2VzL1NvYXAvbS8yOS4wLzAwRFIwMDAwMDAwOGJQQyIsInBhcnRuZXJVcmwiOiIvc2VydmljZXMvU29hcC91LzI5LjAvMDBEUjAwMDAwMDA4YlBDIiwicXVlcnlVcmwiOiIvc2VydmljZXMvZGF0YS92MjkuMC9xdWVyeS8iLCJyZWNlbnRJdGVtc1VybCI6Ii9zZXJ2aWNlcy9kYXRhL3YyOS4wL3JlY2VudC8iLCJyZXN0VXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvIiwic2VhcmNoVXJsIjoiL3NlcnZpY2VzL2RhdGEvdjI5LjAvc2VhcmNoLyIsInNvYmplY3RVcmwiOiIvc2VydmljZXMvZGF0YS92MjkuMC9zb2JqZWN0cy8iLCJ1c2VyVXJsIjoiLzAwNVIwMDAwMDAwRGdKQUlBMCJ9LCJ1c2VyIjp7InVzZXJJZCI6IjAwNVIwMDAwMDAwRGdKQUlBMCIsImZpcnN0TmFtZSI6IlRlc3QiLCJsYXN0TmFtZSI6IlVzZXIiLCJlbWFpbCI6InNyZWFkeUBzYWxlc2ZvcmNlLmNvbSIsInVzZXJUeXBlIjoiU1RBTkRBUkQiLCJpc0RlZmF1bHROZXR3b3JrIjp0cnVlLCJwcm9maWxlSWQiOiIwMGVSMDAwMDAwMExzWU4iLCJwcm9maWxlUGhvdG9VcmwiOiJodHRwczovL2MubW9iaWxlMS5jb250ZW50LnQuZm9yY2UuY29tL3Byb2ZpbGVwaG90by8wMDUvRiIsIm5ldHdvcmtJZCI6bnVsbCwiY3VycmVuY3lJU09Db2RlIjoiVVNEIiwicm9sZUlkIjpudWxsLCJzaXRlVXJsUHJlZml4IjpudWxsLCJhY2Nlc3NpYmlsaXR5TW9kZUVuYWJsZWQiOmZhbHNlLCJzaXRlVXJsIjpudWxsLCJwcm9maWxlVGh1bWJuYWlsVXJsIjoiaHR0cHM6Ly9jLm1vYmlsZTEuY29udGVudC50LmZvcmNlLmNvbS9wcm9maWxlcGhvdG8vMDA1L1QiLCJsYW5ndWFnZSI6ImVuX1VTIiwidGltZVpvbmUiOiJBbWVyaWNhL0xvc19BbmdlbGVzIiwidXNlck5hbWUiOiJzcmVhZHlAc2ZvbmUubW9iaWxlMSIsImxvY2FsZSI6ImVuX1VTIiwiZnVsbE5hbWUiOiJUZXN0IFVzZXIifX0sImFsZ29yaXRobSI6IkhNQUNTSEEyNTYifQ==";
var access_token_inside_signed_request = '00DR00000008bPC!AQ8AQPUHPkLJSPGCVJXf0NjNHC5BFfT4rICKf.Zq1akDiGavVq03z_tvzb1f6NUpOP3V1kdmqckuo68kL4l6pQw346d_V8dQ';
var instance_url_inside_signed_request = 'https://mobile1.t.salesforce.com';
var warehouse_id = "a00R0000000iMYJIA2";

config.APP_SECRET = "6375554712652875436";



//SERVER MOCKS..
var nock = require('nock');
var mockGetLineItemsWithWarehouseId = function() {
	nock('https://mobile1.t.salesforce.com')
		.get("/services/data/v28.0/query?q=SELECT%20Invoice__c%20From%20Line_Item__C%20where%20Warehouse__C%20=%20%27a00R0000000iMYJIA2%27%20OR%20Warehouse__C%20=%20%27a00R0000000iMYJ%27")
		.reply(200, test_data.lineItems);
};

var mockInvoicesDetailsFromListOfInvoiceIds = function() {
	nock('https://mobile1.t.salesforce.com')
		.get("/services/data/v28.0/query?q=SELECT%20Id,%20Name,%20Account__c,%20Account__r.Name,%20Invoice_Total__c,%20Status__c%20FROM%20Invoice__c%20Where%20Status__c%20!=%27Closed%27%20AND%20(Id%20=%20%27a02R0000000wCH5IAM%27%20%20OR%20Id%20=%20%27a02R0000000wCHKIA2%27%20%20OR%20Id%20=%20%27a02R0000000wCHPIA2%27%20%20OR%20Id%20=%20%27a02R0000000wCREIA2%27%20%20OR%20Id%20=%20%27a02R0000000UvEOIA0%27%20%20OR%20Id%20=%20%27a02R0000000wCHAIA2%27%20%20OR%20Id%20=%20%27a02R0000000wCHFIA2%27%20%20OR%20Id%20=%20%27a02R0000000UvETIA0%27%20)")
		.reply(200, test_data.invoices);
};

var mockGetLineItemsWITHOUTWarehouseId = function() {
	nock('https://mobile1.t.salesforce.com')
		.get("/services/data/v28.0/query?q=SELECT%20Invoice__c%20From%20Line_Item__C")
		.reply(200, test_data.lineItems);
};

var mockPostShipInvoice = function() {
	nock('https://mobile1.t.salesforce.com')
		.filteringRequestBody(function(path) {
			return '*';
		})
		.post("/services/data/v28.0/sobjects/FeedItem/", '*')
		.reply(200, test_data.postToAccntChatterPostResult)
}

var mockPostCloseInvoice = function() {
	nock('https://mobile1.t.salesforce.com')
		.filteringRequestBody(function(path) {
			return '*';
		})
		.patch("/services/data/v28.0/sobjects/Invoice__C/a02R0000000UvETIA0", '*')
		.reply(204, {});
}

var mockCreateDelivery = function() {
	nock('https://mobile1.t.salesforce.com')
		.filteringRequestBody(function(path) {
			return '*';
		})
		.post("/services/data/v28.0/sobjects/Invoice__c/quickActions/Create_Delivery/", '*')
		.reply(201, test_data.createDeliveryResult);
}


//TESTS...
describe('+ve and -ve Tests for HTTP POST /ship/:invoiceId End point -->', function() {
	it('Testing POST /ship/:invoiceId End point ', function(done) {
		//mock..
		mockPostShipInvoice();
		mockPostCloseInvoice();
		mockCreateDelivery();

		request(app).post('/ship/a02R0000000UvETIA0')
			.set('Authorization', access_token_inside_signed_request)
			.set('warehouse_id', warehouse_id)
			.set('instance_url', instance_url_inside_signed_request)
			.send({
				"ParentId": "001R0000001mxHEIAY",
				"Name": "INV-0054"
			})
			.end(function(err, response) {
				var json = JSON.parse(response.text);
				expect(response.statusCode).to.equal(201);
				expect(json.created).to.equal(true);
				done();
			});
	});
});



describe('Test EventEmitter parallelizm __test -->', function() {

	it('should call __test binding 100 times if we QUICKLY call a method (that triggers an event) 10 times use Shipment obj as singleton', function(done) {
		var singletonShipmentCallCnt = 0;
		var count = 10;
		var doneCnt = 0;

		function callTest(index) {
			//var shipment = new Shipment(); //Comment this so that we can use it as a singleton (1 obj is create at beforetest)	
			shipment.on('__test', function(cntFrmTest) {
				singletonShipmentCallCnt++;
				if (++doneCnt == count) {
					setTimeout(function() {
						console.log(singletonShipmentCallCnt);
						expect(singletonShipmentCallCnt).to.equal(100);
						done();
					}, 1);
				}

			});
			shipment.__test(index);
		};

		//call 1o times
		for (var i = 0; i < count; i++) {
			callTest(i);
		}

	});

	it('should call __test binding 10 times if we QUICKLY call a method (that triggers an event) 10 times and create Shipment object everytime', function(done) {
		var singletonShipmentCallCnt = 0;
		var count = 10;
		var doneCnt = 0;

		function callTest(index) {
			var shipment = new Shipment();// new Shipment object		
			shipment.on('__test', function(cntFrmTest) {
				singletonShipmentCallCnt++;
				if (++doneCnt == count) {
					setTimeout(function() {
						console.log(singletonShipmentCallCnt);
						expect(singletonShipmentCallCnt).to.equal(10);
						done();
					}, 1);
				}

			});
			shipment.__test(index);
		};

		//call 10 times
		for (var i = 0; i < count; i++) {
			callTest(i);
		}

	});	

});
describe('Testing GET /invoices End point -->', function() {
	it('Should return invoices when valid requests are made to /invoices ', function(done) {
		//mock..
		mockGetLineItemsWithWarehouseId();
		mockInvoicesDetailsFromListOfInvoiceIds();


		request(app).get('/invoices')
			.set('Authorization', access_token_inside_signed_request)
			.set('warehouse_id', warehouse_id)
			.set('instance_url', instance_url_inside_signed_request)
			.send()
			.end(function(err, response) {
				var json = JSON.parse(response.text);
				expect(response.statusCode).to.equal(200);
				expect(json.totalSize).to.equal(4);
				expect(json.records[0].Id).to.equal("a02R0000000UvEOIA0");
				done();
			});
	});

	it('Should return invoices when valid requests are made to /invoices WITHOUT warehouse_id ', function(done) {
		//mock..
		mockGetLineItemsWITHOUTWarehouseId();
		mockInvoicesDetailsFromListOfInvoiceIds();

		request(app).get('/invoices')
			.set('Authorization', access_token_inside_signed_request)
			.set('instance_url', instance_url_inside_signed_request)
			.send()
			.end(function(err, response) {
				var json = JSON.parse(response.text);
				expect(response.statusCode).to.equal(200);
				expect(json.totalSize).to.equal(4);
				expect(json.records[0].Id).to.equal("a02R0000000UvEOIA0");
				done();
			});
	});

});

describe('Testing /signedrequest End point --> ', function() {
	it('Should have access_token and instance_url in index.html for valid HTTP POST to /signedrequest', function(done) {
		request(app).post('/signedrequest').
		send({
			"signed_request": test_signed_request,
			"text": " from rajaraodv"
		}).end(function(err, response) {
			var body = response.text;
			expect(response.statusCode).to.equal(200);
			expect(body).to.contain(access_token_inside_signed_request);
			expect(body).to.contain(instance_url_inside_signed_request);
			done();
		});
	});

	it('Throw error for invalid HTTP POST to /signedrequest', function(done) {
		request(app).post('/signedrequest').
		send({
			"signed_request": "invalid_signed_request",
			"text": " from rajaraodv"
		}).end(function(err, response) {
			var body = response.text;
			expect(response.statusCode).to.equal(200);
			expect(body).to.contain('There was an error');
			expect(body).to.not.contain(access_token_inside_signed_request);
			expect(body).to.not.contain(instance_url_inside_signed_request);
			done();
		});
	});
});

describe('Testing / End point -->', function() {
	it('Should have not allow HTTP GET to / ', function(done) {
		request(app).get('/').
		send().end(function(err, response) {
			var body = response.text;
			expect(response.statusCode).to.equal(200);
			expect(body).to.contain(errors.HTTP_GET_POST_NOT_SUPPORTED);
			expect(body).to.not.contain(access_token_inside_signed_request);
			expect(body).to.not.contain(instance_url_inside_signed_request);
			done();
		});
	});

	it('Should have not allow HTTP POST to /', function(done) {
		request(app).post('/').
		send({
			"signed_request": "invalid_signed_request",
			"text": " from rajaraodv"
		}).end(function(err, response) {
			var body = response.text;
			expect(response.statusCode).to.equal(200);
			expect(body).to.contain(errors.HTTP_GET_POST_NOT_SUPPORTED);
			expect(body).to.not.contain('https://mobile1.t.salesforce.com');
			done();
		});
	});
});


describe('Test _formatWarehouseId  -->', function() {
	it('should format WarehouseId', function(done) {
		var wId = shipment._formatWarehouseId();
		if (wId) {
			q += " where Warehouse__C = '" + wId.chars18 + "' OR Warehouse__C = '" + wId.chars15 + "'";
		}
		done();
	});
});