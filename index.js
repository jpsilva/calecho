'use strict';

var http = require('http');
var https = require('https');

http.createServer(respond).listen(8080);

function respond(req, res) {
  var calData = '',
      urlParts = req.url.match(/account:([A-z@\.]+)/),
      account = urlParts && urlParts[1];

  if (req.method === 'GET' && account) {
    https.get(`https://calendar.google.com/calendar/ical/${account}/public/basic.ics?orderby=starttime&sortorder=ascending&futureevents=true&max-results=100`, (calRes) => {
      calRes.on('data', (data) => { calData += data; });
      calRes.on('end', () => { res.end(calData); });
    });
  }
}
