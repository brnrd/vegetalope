---
layout: "../../layouts/BlogPost.astro"
title: "Google blocking itself?"
description: "Are we in 2030 yet?"
pubDate: "2019-09-18"
---

As a good concerned netcitizen here I was reading the cookies policy on a website I was on, as you do, living my best life when I noticed a footnote that said:

> We also use Google Analytics Advertising Features. Read more about it and how you can opt out here: [https://tools.google.com/dlpage/gaoptout/](https://tools.google.com/dlpage/gaoptout/)

Now you got me interested. Just to think that there was a hidden thing somewhere to completely opt-out of Google Analytics got me all reved up.

> Google Analytics Opt-out Browser Add-on

What now? A browser extension? Supported by Chrome, Internet Explorer 11, Safari, Firefox and Opera?
I have to admit I'm a bit disappointed. I was expecting a setting on my Google account, a browser extension is a bit lazy Google.

But let's check this out: last updated April 2019, 4 out of 5 stars, 1M+ users. Wow, just wow. I mean, you have to be pretty motivated to just block GA and that's it. And by blocking I mean, loading the script, running it, just not pushing the data to Google.

How does it work?

I had to extract the code from the `.xpi` (which is just a renamed `.zip`) and have a peek.
The only thing it does is make the page run an extra bit of JS through a content script applied on all pages:

```javascript
window['_gaUserPrefs'] = {
	ioo: function () {
		return true
	},
}
```

It does not communicate with Google or anything. My guess is that when GA executes, it checks the existence of this `_gaUserPrefs` key on the window object, calls the function and doesn't send the data or doesn't run if the `ioo` function returns true.

That's something I guess right? RIGHT!

Oh wait, what do I see now?

[IBA Opt-out (by Google)](https://addons.mozilla.org/en-US/firefox/addon/interest-advertising-opt-out/)! Another extension, also made by Google, to opt-out the Interest Based Advertising. Only half a million users for the Chrome version, 3365 for the Firefox one, 3 out of 5 stars. Ouch!

Does it mean I'm not going to get ads? No, of course not. They just won't be "pertinent", not be based on my activity. And it apparently breaks the web too: it seems that some website don't work too well if doubleclick is not allowed to perform. Since it was last updated in August 2013 for Chrome, and in December 2018 for Firefox (it broke when Firefox Quantum was released) people dropping reviews are not too happy about it. But who leaves positive feedback amirite?
That might be nice if I don't want to block ads on my favourite websites and still block Google from knowing everything about me.

How does this one work?

Google was a bit kinder for that one, as the code is open-source on [Google Code](https://code.google.com/archive/p/google-opt-out-plugin/source/default/source).

It asks me for permission for `http://doubleclick.net/` and the cookies.

The solution was a cookie.

```javascript
{
	name: 'id',
	value: 'OPT_OUT',
	domain: '.doubleclick.net',
	url: 'http://doubleclick.net',
	expirationDate: 1920499146
}
```

What happens after 1920499146/Sat, 09 Nov 2030 23:59:06 GMT? I'll let you know when I get there.

Thank you Google but I'll stick with [uBlock Origin](https://github.com/gorhill/uBlock) and [Pi-hole](https://pi-hole.net/).

Why you ask? That's a story for another time.
