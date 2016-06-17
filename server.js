'use strict';

var http = require('http'),
    https = require('https'),
    ical = require('ical');

require('sugar');

function respond(req, res) {
  var calData = '',
      urlParts = req.url.match(/\/([A-z@\.]+)\/calendar\.(html|ical|js)/),
      account = urlParts && urlParts[1],
      format = urlParts && urlParts[2];

  if (req.method === 'GET' && account) {
    https.get(
      'https://calendar.google.com/calendar/ical/' + account + '/public/basic.ics?orderby=starttime&sortorder=ascending&futureevents=true&max-results=100',
      function(calRes) {
        calRes.on('data', function(data) { calData += data; });

        calRes.on('end', function() {
          switch(format) {
            case 'ical':
              res.end(calData);
              break;
            case 'html':
              res.end(renderHTML(calData));
              break;
            case 'js':
              res.end(wrapJS(renderHTML(calData)));
              break;
          }
        });
      }
    ).on('error', function(e) {
      console.error(e);
    });
  } else {
    res.end('Account name required');
  }
}

function renderHTML(rawData) {
  var data = ical.parseICS(rawData),
      gigs = [],
      output = '<table>',
      k;

  for (k in data) {
    if (data.hasOwnProperty(k) && data[k].start && (data[k].start > new Date()) && data[k].summary !== 'Private') {
      gigs.push(data[k]);
    }
  }

  gigs.sort(function(a, b) {
    return a.start - b.start;
  });

  gigs.forEach(function (gig) {
    var address;

    if (gig['APPLE-STRUCTURED-LOCATION']) {
      address = gig['APPLE-STRUCTURED-LOCATION'].params[1].slice(11, -1);
    }

    output +=
      '<tr><td>' + gig.summary + '</td><td>' + gig.start.format('{Dow}') +
      ', <span class="keep-together">' + gig.start.format('{Mon} {date}, {year}') +
      '</span> &nbsp; ' + gig.start.format('{h}:{mm}{t}') + '</td></tr><tr><td class="address-cell">' +
      (address ? address.match(/[^,\d]*, [A-Z]{2}(?=\s*\d{0,5}-?\d{0,4},\sUnited States)/)[0] : '') +
      '</td><td class="map-cell">' + (address ? '<a href="https://www.google.com/maps/?q=' + address + '">Map</a>' : '') +
      '</td></tr>';
  });

  output += '</table>';

  return output;
}

function wrapJS(html) {
  return 'document.write(\'' + html + '\');';
}

http.createServer(respond).listen(process.env.PORT);
