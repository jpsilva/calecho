'use strict';

var http = require('http'),
    https = require('https');

function respond(req, res) {
  var calData = '',
      urlParts = req.url.match(/account:([A-z@\.]+)/),
      account = urlParts && urlParts[1];

  if (req.method === 'GET' && account) {
    https.get(
      'https://calendar.google.com/calendar/ical/' + account + '/public/basic.ics?orderby=starttime&sortorder=ascending&futureevents=true&max-results=100',
      function(calRes) {
        calRes.on('data', function(data) { calData += data; });
        calRes.on('end', function() { res.end(calData); });
      }
    ).on('error', function(e) {
      console.error(e);
    });
  } else {
    res.end('Account name required');
  }
}

http.createServer(respond).listen(80);
