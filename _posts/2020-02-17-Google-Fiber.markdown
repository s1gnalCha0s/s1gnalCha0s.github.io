---
layout: post
title:  "Plan Change Logic in Google Fiber (Webpass)"
date:   2020-02-17 10:00:00
categories: logic
---

> "Distracted from Distraction by Distraction" - T.S. Eliot

TLDR; Found a simple logic bug when paying my annual Google Fiber bill (Webpass). 

I initially added a $50 payment to my Google Fiber (WebPass) annual subscription, and then switched from annual to monthly billing, and saw that $550 (the annual amount) was credited to the account, and $60 was billed to the account for the new subscription. 

{% highlight js %}
POST /api/plan_changes HTTP/1.1
Host: webpass.net
Content-Type: application/x-www-form-urlencoded; charset=UTF-8

from_subscription_id=12345&cashier=
{% endhighlight %}

I then replayed the same API operation that was initially called to change the subscription about six more times and saw that each time I called it $550 was credited to the account, and $60 was billed to the account. 

![Image](/assets/webpass/1.png)

At this point there was $2,450 credited to the account, and it showed that the previously invoiced amount had been paid. It would have been fun to call that API operation 100+ more times to see what would happen 😅, but I just reported it instead.  

![Image](/assets/webpass/2.png)

It was covered under the Google VRP because Webpass is a 2016 Google Fiber acquisition. A few days later someone took the credits out of my account which reset my account balance back to $0. 

Thanks to the Google VRP team. 👋

[@signalchaos](https://twitter.com/signalchaos)

Disclosure timeline stuff:
* Nov 2019: Reported the plan_changes bug to the Google VRP
* Jan 2020: Reported an authorization bug in some API operations that allowed customer subscriptions to be changed.