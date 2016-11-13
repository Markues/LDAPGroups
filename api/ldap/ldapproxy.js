// Includes
let ldap = require('ldapjs');
let async = require('async');
let ldapInfo = require('./ldapInfo');

// Constructors
function LDAPProxy(username) {
	// Copy the defaults into the object config
	this.config = _copy(ldapInfo);
	// Copy the passed-in username into the object config
	this.config.username = username;
}

LDAPProxy.prototype.executeLDAPSearch = function(callback) {
	// The 'this' object
	let thisObj = this;
	// Create the LDAP client
	let client = ldap.createClient({
		url: thisObj.config.ldaphost
	});

	// Bind to the LDAP server
	client.bind(thisObj.config.ldaprdn, thisObj.config.ldappass, (err) => {
		// If error, throw it
		if(err) {
			callback(err)
		}

		let userGroups = '';

    if(thisObj.config.username !== null) {
			// Setup our search options
			let searchOpts = {
				filter: 'uniquemember=' + thisObj.config.username,
				scope: 'sub'
			};

			// Iterate over the ldapgroupinfo array
			async.forEachOf(thisObj.config.ldapgroupinfo, (value, index, cb) => {
				// Search using the groupDN and search options
				client.search(value, searchOpts, (err, res) => {
					// If there's an error head to the callback!
					if(err) {
						return cb(err);
					}

				  res.on('searchEntry', (entry) => {
						// Entry was found: add group to list
						// console.log('entry: ' + JSON.stringify(entry.object));
						userGroups += thisObj.config.ldapgroupvalue[index] + ',';
				  });
				  res.on('searchReference', (referral) => {
						// Referral found: do nothing
				    // console.log('referral: ' + referral.uris.join());
				  });
				  res.on('error', (err) => {
						// Error: hit callback with error info
				    // console.error('error: ' + err.message);
						cb(err);
				  });
				  res.on('end', (result) => {
						// End status: hit callback
				    // console.log('status: ' + result.status);
						cb();
				  });
				});
				// Callback for the forEach loop
			}, (err) => {
				client.unbind(function(err) {
					// If error, throw it
					if(err) {
						callback(err)
					}
					// Trim the comma at the end of the string
					userGroups = userGroups.slice(0, -1);
					// Return the userGroup list after the connection is unbound
					callback(null, userGroups);
				});
			});
		}
	});
};

// Private Functions
function _copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

// Module
module.exports = LDAPProxy;
