exports = module.exports = {
	HTTP_GET_POST_NOT_SUPPORTED: 'You can only access this app from within Salesforce. Direct HTTP GET or POST to Index is not allowed. Instead make HTTP POST to /signedrequest with valid signed-request from Salesforce to see Index page',
	SIGNED_REQUEST_PARSING_ERROR:  "Either signed Request was not correct or, one of the following was missing from signed request: oauthToken or instanceUrl or warehouseId",
	MUST_PASS_AUTH_INSTANCE_URL: "Must pass 'instance_url', 'warehouse_id' and 'Authorization'(= session_id) in the header.",
	MISSING_REQUIRED_SHIPPING_PARAMETERS: 'One of the following shipping related parameters is missing: authorization, instanceUrl, invAccountId, invoiceName, or invoiceId'
}