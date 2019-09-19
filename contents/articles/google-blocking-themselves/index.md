---
title: Google blocking themselves?
date: 2019-09-18 22:00
author: brnrd
template: article.pug
---

As a good concerned netcitizen here I was reading the cookies policy on a website I was on, as you do, living my best life when I noticed a footnote at the bottom that said:

> We also use Google Analytics Advertising Features. Read more about it and how you can opt out here: [https://tools.google.com/dlpage/gaoptout/](https://tools.google.com/dlpage/gaoptout/)

<span class="more"></span>

Now you got me interested. Just to think that there was a hidden thing somewhere to completely opt-out of Google Analytics got me all reved up.

> Google Analytics Opt-out Browser Add-on

What now? A browser extension? Supported by Chrome, Internet Explorer 11, Safari, Firefox and Opera?
I have to admit I'm a bit disappointed. I was expecting a setting on my Google account, a browser extension is a bit lazy Google.

But let's check this out: last updated April 2019, 4 out of 5 stars, 1M+ users. Wow, just wow. I mean, you have to be pretty motivated to just block GA and that's it. And by blocking I mean, loading the script, running it, just not pushing the data to Google.

How does it work?

I had to extract the code from the `.xpi` (which is just a renamed `.zip`) and have a peek.
The only thing it does is make the page run an extra bit of JS through a content script applied on all pages:

```javascript
window["_gaUserPrefs"] = { ioo : function() { return true; } }
```

So it does not communicated with Google or anything, but my guess is that when GA excutes, it checks the existence of this key on the window object, calls the function and doesn't send the data or doesn't run if the `ioo` function returns true.

That something I guess right? RIGHT?

Oh wait, what do I see now?

[IBA Opt-out (by Google)](https://addons.mozilla.org/en-US/firefox/addon/interest-advertising-opt-out/)! An extension, made by Google, to opt-out the Interest Based Advertising. Only half a million users for the Chrome version (3365 for the Firefox one), 3 out of 5 stars. Ouch.

Does it mean you're not going to get ads? No of course not. They just won't be "pertinent", not be based on your activity. And it apparently breaks the web too, since it was last updated in August 2013 for Chrome, but updated in December 2018 for Firefox (it seems it broke when Firefox Quantum was released), and people dropping reviews are not too happy about it (but who leaves positive feedback amirite?).
That might be nice if you don't want to block ads on your favourite websites and still block Google from knowing everything about you.

How does this one work?

Google was a bit kidner for that one, as the code is open-source on [Google Code](https://code.google.com/archive/p/google-opt-out-plugin/source/default/source).

It asks us for permission for `http://doubleclick.net/` and the cookies.

The solution was a cookie

```javascript
{
	name: 'id',
	value: 'OPT_OUT',
	domain: '.doubleclick.net',
	url: 'http://doubleclick.net',
	expirationDate: 1920499146
}
```

What happens after 1920499146/Sat, 09 Nov 2030 23:59:06 GMT? I'll let you know when we get there.

Thank you Google, I'll stick with [uBlock Origin](https://github.com/gorhill/uBlock) and [Pi-hole](https://pi-hole.net/).
