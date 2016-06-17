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
      output = '<table class="gig-table">',
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
    var address, addressParts;

    if (gig['location']) {
      address = gig['location'];
      addressParts = address.match(/[^,\d]*, [A-Z]{2}(?=\s*\d{0,5}-?\d{0,4}(,\s(United States|USA|US))?)/);
    }

    output +=
      '<tr class="gig-row-1">' +
        '<td class="gig-summary">' + gig.summary + '</td>' +
        '<td class="gig-date">' +
          '<span class="gig-date-day">' + gig.start.format('{Dow}') + '</span>, ' +
          '<span class="gig-date-date">' + gig.start.format('{Mon} {date}, {year}') + '</span>' +
          ' &nbsp; <span class="gig-date-time">' + gig.start.format('{h}:{mm}{t}') + '</span>' +
        '</td>' +
      '</tr>' +
      '<tr class="gig-row-2">' +
        '<td class="gig-address">' + (addressParts ? addressParts[0] : '') + '</td>' +
        '<td class="gig-address-link-cell">' +
          (address ? '<a class="gig-address-link" href="https://www.google.com/maps/?q=' + address + '">Map</a>' : '') +
        '</td>' +
      '</tr>';
  });

  output += '</table>' +
    '<style>' +
      '.gig-table { width: 100%; } ' +
      '.gig-address { padding-bottom: 1em; } ' +
    '</style>';

  return output;
}

function wrapJS(html) {
  return 'document.write(\'' + html + '\');';
}

http.createServer(respond).listen(process.env.PORT);
