let url = require('url');
let LDAPProxy = require('./ldapproxy');

module.exports = function(api) {
  // Serve requests to /api/ldap/addheaders
  api.route('/api/ldap/addheaders')
    .get(function(req, res) {
      // Setup our proxy to use the LDAP server using username cookie
      let ldapProxy = new LDAPProxy(req.cookies.username);
      // Execute LDAP search and give us back groups
      ldapProxy.executeLDAPSearch(handleData);

      // Function to handle our LDAP response data
      function handleData(err, groups) {
        if(err) {
          // Log any errors
          console.log(err);
        }
        // Append new headers and send 200
        res.append('Groups', groups);
        res.status(200).end();
      }
    });

  // Serve requests to /api/ldap/groupsasjson
  api.route('/api/ldap/groupsasjson')
    .get(function(req, res) {
      let username = req.cookies.username;
      // Setup our proxy to use the LDAP server using username cookie
      let ldapProxy = new LDAPProxy(username);
      // Execute LDAP search and give us back username and groups
      ldapProxy.executeLDAPSearch(handleData);

      // Function to handle our LDAP response data
      function handleData(err, groups) {
        // Instantiate our user object
        let userObj = {
          "username": username,
          "groups": groups
        };

        if(err) {
            // Log any errors
            console.log(err);
        }
        // Return the user object as JSON
        res.jsonp(userObj);
      }
    });

  // Serve the redirect API
  api.route('/api/ldap/redirect')
    .get(function(req, res) {
      // Get the returnPath value from the query string
      // Parse out the path (www.test.com/path -> /path)
      let returnPath = (url.parse(req.query.returnPath)).pathname;
      // Redirect to said path with HTTP 302
      res.redirect(returnPath);
    });
};
