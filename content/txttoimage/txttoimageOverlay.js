/**
 * Overlay JS
 * Provides the main functions for replacing the image links based on user's
 * preferences provided.
 */

var TxttoImage = new function()
{
	var txttoimagePrefsClass         = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("txttoimage.");
	var txttoimageDisabled           = new Boolean();
	var txttoimageImageLoader        = new Boolean();
	var txttoimageRegular            = new Array(2);
	var txttoimageRegularv           = new Array(2);
	var txttoimageMouse              = new Array(2);
	var txttoimageMousev             = new Array(2);
	var txttoimageBlacklist          = new Array();
	var txttoimageSiteBlacklist      = new Array();
	var txttoimageValidDocTypes      = new RegExp("^(text/html|application/xhtml\\+xml|text/xml|application/xml)$", "i");
	var txttoimagegContext           = this;
	var txttoimageImgmode, txttoimageStrings, txttoimageImgRegExp, txttoimageImgReplaceRegExp, txttoimageImgDetectRegExp, txttoimageMaxImages, txttoimageImgsonpage, txttoimageCurrImg;

	/**
	 * Preference observer
	 */
	var txttoimagePrefObserver = {
		register: function()
		{
			this._branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("txttoimage.");

			if (Components.interfaces.nsIPrefBranch2) {
				this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
			} else {
				this._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			}

			this._branch.addObserver("", this, false);
		},

		unregister: function()
		{
			if (!this._branch) {
				return;
			}

			this._branch.removeObserver("", this);
		},

		observe: function(aSubject, aTopic, aData)
		{
			if (aTopic != "nsPref:changed") {
				return;
			}

			txttoimagePrefs();
		}
	};

	/**
	 * exention initiation: doing some configuration stuff
	 */
	this.Init = function()
	{
		txttoimagePrefObserver.register();
		txttoimagePrefs();
		this.removeEventListener("load", TxttoImage.Init, false);
		Image.prototype._txttoimageData = new txttoimageData();
		Image.constructor = function() { this._txttoimageData = new txttoimageData(); };
		//HTMLImageElement.prototype._txttoimageData = new txttoimageData();
		//HTMLImageElement.constructor = function() { this._txttoimageData = new txttoimageData(); };
		XMLHttpRequest.prototype._txttoimageData = null;
		txttoimageStrings = document.getElementById("txttoimageStringBundle");

		if (!txttoimageDisabled) {
			document.getElementById("txttoimagePanel").setAttribute("disabled", "true");
		}

		document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", txttoimagePopup, false);
		window.addEventListener("DOMContentLoaded", txttoimageCheckImageLoad, false);
		window.addEventListener("blur", txttoimageWindowBlur, false);
	}

	/**
	 * Opens the options menu, simple enough (now focuses the current active
	 * window if it's already open)
	 */
	function txttoimageOpen()
	{
		var windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var prefWindow = windowMediator.getEnumerator("txttoimage:options");

		if (prefWindow && prefWindow.focus) {
			prefWindow.focus();
		} else {
			window.open("chrome://txttoimage/content/txttoimageOptions.xul", "", "chrome, resizable, centerscreen");
		}
	}

	this.Open = txttoimageOpen;

	/**
	 * Update the preferences in case they were changed
	 */
	function txttoimagePrefs()
	{
		txttoimageDisabled           = txttoimagePrefsClass.getBoolPref("disabled");
		txttoimageImageLoader        = txttoimagePrefsClass.getBoolPref("imageLoader");
		txttoimageRegular            = [txttoimagePrefsClass.getBoolPref("Width"), txttoimagePrefsClass.getBoolPref("Height")];
		txttoimageRegularv           = [txttoimagePrefsClass.getIntPref("WidthValue"), txttoimagePrefsClass.getIntPref("HeightValue")];
		txttoimageImgmode            = txttoimagePrefsClass.getCharPref("mode");
		txttoimageMouse              = [txttoimagePrefsClass.getBoolPref("HoverW"), txttoimagePrefsClass.getBoolPref("HoverH")];
		txttoimageMousev             = [txttoimagePrefsClass.getIntPref("HoverWV"), txttoimagePrefsClass.getIntPref("HoverHV")];
		txttoimageBlacklist          = [];
		txttoimageSiteBlacklist      = [];
		var blackitems               = txttoimagePrefsClass.getCharPref("filter").split(" ");
		var blacksites               = txttoimagePrefsClass.getCharPref("siteFilter").split(" ");
		var regexpRegexp             = new RegExp("^/.*/[gim]*$", "i");

		for (var i = 0; i < blackitems.length; i++) {
			try {
				// check to make sure there are blacklisted items
				if (!blackitems[i].length) {
					continue;
				}

				// check for use of regexp
				if (regexpRegexp.test(blackitems[i])) {
					var regexp = blackitems[i].substr(1, blackitems[i].length - 2);
				} else {
					// otherwise, remove special characters
					var regexp = blackitems[i].replace(/^[\*]*(.(?:[^\*]|[\*]+[^\*])*)[\*]*$/, "$1").replace(/[\*]+/, "*").replace(/([^\w\*])/g, "\\$1").replace(/\*/g, ".*") + "(?:\\n)?";
				}

				// add the blacklisted item
				txttoimageBlacklist.push(new RegExp(regexp, "i"));
			} catch (e) {}
		}

		for (var i = 0; i < blacksites.length; i++) {
			try {
				// check to make sure there are blacklisted items
				if (!blacksites[i].length) {
					continue;
				}

				// check for use of regexp
				if (regexpRegexp.test(blacksites[i])) {
					var regexp = blacksites[i].substr(1, blacksites[i].length - 2);
				} else {
					// otherwise, remove special characters
					var regexp = blacksites[i].replace(/^[\*]*(.(?:[^\*]|[\*]+[^\*])*)[\*]*$/, "$1").replace(/[\*]+/, "*").replace(/([^\w\*])/g, "\\$1").replace(/\*/g, ".*") + "(?:\\n)?";
				}

				// add the blacklisted item
				txttoimageSiteBlacklist.push(new RegExp(regexp, "i"));
			} catch (e) {}
		}

		var imageTypesRegExpString = txttoimagePrefsClass.getCharPref("imageTypes").replace(/^[ ]+/, "").replace(/[ ]+$/, "").replace(/[ ]+/g, "|").split("|").sort().reverse().join("|");
		txttoimageImgRegExp = new RegExp("^[^\\?]+?(?:\\.|%2E)(?:" + imageTypesRegExpString + ")$", "i");
		txttoimageImgReplaceRegExp = new RegExp("^([-\\s\\(\\)\\[\\]\\{\\}=+_.!@#$%^&*<>?;'\"\\|/:a-z0-9]*?)(https?://[^\\?]+(?:\\.|%2E)(?:" + imageTypesRegExpString + "))([-\\s\\(\\)\\[\\]\\{\\}=+_.!@#$%^&*<>?;\"'\\|/:a-z0-9]*)$", "i");
		txttoimageImgDetectRegExp = new RegExp("http[s]?://[^\\?]+(?:\\.|%2E)(?:" + imageTypesRegExpString + ")", "i")
		// maximum number of images to display at any given time on a page
		txttoimageMaxImages = txttoimagePrefsClass.getIntPref("maxNumberOfImages");

		if (txttoimageMaxImages <= 0) {
			txttoimageMaxImages = 999999 // disables limit; I really doubt a single web page exists that has a million image links on it
		}
	}

	/**
	 * Update the statusbar icon and set the event listener for the extension
	 */
	function txttoimageCheckImageLoad(e)
	{
		if (txttoimageDisabled) {
			document.getElementById("txttoimagePanel").removeAttribute("disabled");
			setTimeout(txttoimageCheckDoc, 1, e.originalTarget);
		}
	}

	/**
	 * Toggle the status bar icon status and set or remove event listeners
	 */
	function txttoimageToggle()
	{
		txttoimageDisabled = !txttoimageDisabled;

		if (txttoimageDisabled) {
			txttoimagePrefsClass.setBoolPref("disabled", true);
			document.getElementById("txttoimagePanel").removeAttribute("disabled");
			setTimeout(txttoimageCheckDoc, 1, window.content.document);
		} else {
			txttoimagePrefsClass.setBoolPref("disabled", false);
			document.getElementById("txttoimagePanel").setAttribute("disabled", "true");
			setTimeout(txttoimageUndo, 1);
		}
	}

	this.Toggle = txttoimageToggle;

	/**
	 * Remove all images made by Text-to-Image (broken, needs fixing)
	 */
	function txttoimageUndo()
	{
		var imgs = window.content.document.images;

		for (var i in imgs) {
			if (!imgs[i]._txttoimageData || !imgs[i]._txttoimageData.isValid) {
				continue;
			}

			imgs[i].parentNode.replaceChild(imgs[i]._txttoimageData.origNode, imgs[i]);
		}
	}

	/**
	 * Sets the _txttoimageData object for images
	 */
	function txttoimageData()
	{
		var data = {
			isValid   : false,
			isLoader  : false,
			origNode  : null,
			loaderImg : null
		};

		return data;
	}

	/**
	 * The main function: replaces the links on the page to the images
	 */
	function txttoimageCheckDoc(aDoc)
	{
		// don"t do anything if the page isn't an actual (X)HTML or XML document
		if (!txttoimageValidDocTypes.test(aDoc.contentType)) {
			return;
		}

		var i = 0;
		// skip blacklisted sites
		for (i = 0; i < txttoimageSiteBlacklist.length; i++) {
			if (txttoimageSiteBlacklist[i].test(aDoc.URL)) {
				return;
			}
		}

		try {
			var gBody = aDoc.body;
		} catch(e) {}

		txttoimageImgsonpage = i = 0;
		var anchorNodes      = gBody.getElementsByTagName("a");

		// now, to loop through (and up to) the max amount of images
		while (i < anchorNodes.length && txttoimageImgsonpage < txttoimageMaxImages) {
			// if the link matches the image regexp and isn't blacklisted...
			if (txttoimageImgRegExp.test(anchorNodes[i].href) && txttoimageBlacklistPass(anchorNodes[i].href)) {
				txttoimageLink2Img(anchorNodes[i]);
				txttoimageImgsonpage++;
				// since we replace an anchor node, it gets removed dynamically from the HTML Collection variable
			} else {
				i++; // move on to the next item
			}
		}

		var textNodes = txttoimageGetTextNodes(gBody);
		i = 0;

		while (i < textNodes.length && txttoimageImgsonpage < txttoimageMaxImages) {
			txttoimageTxt2Img(textNodes[i]);
			// end loop through textNodes
			i++;
		}

		txttoimageImgsonpage = 0;
	}

	this.CheckDoc = txttoimageCheckDoc;

	/**
	 * Replace link with an image, assumes the link links to an image
	 */
	function txttoimageLink2Img(aNode)
	{
		var gDoc         = aNode.ownerDocument;
		var gDimensions  = new Array(2);

		if (txttoimageRegular[0]) {
			gDimensions[0] = txttoimageRegularv[0] + "px";
		} else {
			gDimensions[0] = "auto";
		}

		if (txttoimageRegular[1]) {
			gDimensions[1] = txttoimageRegularv[1] + "px";
		} else {
			gDimensions[1] = "auto";
		}

		var img                      = new Image();
		img._txttoimageData          = new txttoimageData();
		img._txttoimageData.isValid  = true;
		img._txttoimageData.origNode = aNode.cloneNode(1);
		img.src                      = aNode.href;
		img.className                = "txttoimage_image";
		img.style.setProperty("max-width", gDimensions[0], "important");
		img.style.setProperty("max-height", gDimensions[1], "important");
		img.alt                      = aNode.textContent;
		img.title                    = aNode.textContent;

		// if the image is loading, use the image loader GIF; else, put the image in
		if (txttoimageImageLoader) {
			var loader                       = new Image();
			loader._txttoimageData           = new txttoimageData();
			loader._txttoimageData.isValid   = true;
			loader._txttoimageData.isLoader  = true;
			loader._txttoimageData.loaderImg = img;
			img._txttoimageData.loadingImg   = loader;
			loader.src                       = "chrome://txttoimage/skin/txttoimageLoader.gif";
			loader.className                 = "txttoimage_loader";
			loader.title                     = txttoimageStrings.getString("loadingText");
			txttoimageStateChange(aNode.href, loader);
			aNode.parentNode.replaceChild(loader, aNode);
		} else {
			img.addEventListener("error", txttoimageBrokenImage, false);
			img.addEventListener("load", txttoimagePicFunc, false);
			aNode.parentNode.replaceChild(img, aNode);
		}
	}

	this.Link2Img = txttoimageLink2Img;

	/**
	 * Replace text URL with image(s). Currently no way of limiting which URLs
	 * are effected if there are multiple URLs in the same node
	 */
	function txttoimageTxt2Img(aNode)
	{
		var gDimensions  = new Array(2);

		if (txttoimageRegular[0]) {
			gDimensions[0] = txttoimageRegularv[0] + "px";
		} else {
			gDimensions[0] = "auto";
		}

		if (txttoimageRegular[1]) {
			gDimensions[1] = txttoimageRegularv[1] + "px";
		} else {
			gDimensions[1] = "auto";
		}

		var gDoc = aNode.ownerDocument;
		var i    = 0;
		var j    = 0;
		// get individual words contained in text
		var split    = aNode.textContent.split(" ");
		var newNodes = new Array();

		// loop through words to check for textual links to images
		while (i < split.length && txttoimageImgsonpage < txttoimageMaxImages) {
			// we need the results from the regexp, not just whether the URI passes or not
			var match = split[i].match(txttoimageImgReplaceRegExp);

			// if the word is a text link to an image that passes the blacklist test, imagify it
			if (match && txttoimageBlacklistPass(match[2])) {
				var img                      = new Image();
				img._txttoimageData          = new txttoimageData();
				img._txttoimageData.isValid  = true;
				img._txttoimageData.origNode = gDoc.createTextNode(match[2]);
				img.src                      = match[2];
				img.className                = "txttoimage_image";
				img.style.setProperty("max-width", gDimensions[0], "important");
				img.style.setProperty("max-height", gDimensions[1], "important");
				img.alt                      = match[2];
				img.title                    = match[2];

				// if the image isn't loaded yet, put the image loader GIF in its place
				if (txttoimageImageLoader) {
					var loader                       = new Image();
					loader._txttoimageData           = new txttoimageData();
					loader._txttoimageData.isValid   = true;
					loader._txttoimageData.isLoader  = true;
					loader._txttoimageData.loaderImg = img;
					img._txttoimageData.loadingImg   = loader;
					loader.src                       = "chrome://txttoimage/skin/txttoimageLoader.gif";
					loader.className                 = "txttoimage_loader";
					loader.title                     = txttoimageStrings.getString("loadingText");
					txttoimageStateChange(match[2], loader);
				} else {
					img.addEventListener("error", txttoimageBrokenImage, false);
					img.addEventListener("load", txttoimagePicFunc, false);
				}

				/*
				 * create the three nodes for repacing; one for the text before the
				 * URL, one for the image, and one for the text after the URL
				 */
				if (match[1] != "" || match[3] != "") {
					var holdingArray = new Array(3);
					holdingArray[0]  = gDoc.createTextNode(match[1]);
					holdingArray[1]  = txttoimageImageLoader ? loader : img;
					holdingArray[2]  = gDoc.createTextNode(match[3]);
					newNodes[i]      = holdingArray;
				} else {
					newNodes[i] = img;
				}

				j++;
				txttoimageImgsonpage++;
			} else {
				newNodes[i] = gDoc.createTextNode(split[i]);
			}

			i++;
			// end loop for checking words
		}

		// FIXME: WAAAAAAAAAAAAAY too complicated and can easily run into an error
		var theParent = aNode.parentNode;

		if (j > 0 && split.length == 1) {
			var insertedNode = newNodes[0];

			if (!insertedNode.nodeName) {
				theParent.replaceChild(insertedNode[2], aNode);
				theParent.insertBefore(insertedNode[1], insertedNode[2]);
				theParent.insertBefore(insertedNode[0], insertedNode[1]);
			} else if (txttoimageImageLoader) {
				theParent.replaceChild(loader, aNode);
			} else {
				theParent.replaceChild(img, aNode);
			}
		} else if (j > 0) {
			var insertNode = newNodes[i - 1];
			var lastNode;

			if (!insertNode.nodeName) {
				theParent.replaceChild(insertNode[2], aNode);
				theParent.insertBefore(insertNode[1], insertNode[2]);
				theParent.insertBefore(insertNode[0], insertNode[1]);
				lastNode = insertNode[0];
			} else {
				theParent.replaceChild(insertNode, aNode);
				lastNode = insertNode;
			}

			var newLength = i;

			for (i = newLength - 2; i >= 0; i--) {
				var space        = gDoc.createTextNode(" ");
				var insertedNode = newNodes[i];

				if (!insertedNode.nodeName) {
					var filler = insertedNode[1];
					theParent.insertBefore(space, lastNode);
					theParent.insertBefore(insertedNode[2], space);
					theParent.insertBefore(insertedNode[1], insertedNode[2]);
					theParent.insertBefore(insertedNode[0], insertedNode[1]);
					lastNode = insertedNode[0];
				} else {
					theParent.insertBefore(space, lastNode);
					theParent.insertBefore(insertedNode, space);
					lastNode = insertedNode;
				}
			}
		}
	}

	this.Txt2Img = txttoimageTxt2Img;

	/**
	 * Get all the text nodes in a document. Even filters out the ones without any
	 * image file extensions
	 */
	function txttoimageGetTextNodes(aNode)
	{
		var children  = aNode.childNodes;
		var textArray = new Array();

		/*
		 * loop through child nodes and push text into array if it is not a
		 * form-based item and whatnot
		 */
		for (var i = 0; i < children.length; i++) {
			if(children[i].nodeName.toLowerCase() == "#text" && children[i].parentNode.nodeName.toLowerCase() != "button" && children[i].parentNode.nodeName.toLowerCase() != "textarea" && children[i].parentNode.nodeName.toLowerCase() != "script" && txttoimageImgDetectRegExp.test(children[i].textContent)) {
				textArray.push(children[i]);
			} else if (children[i].nodeName.toLowerCase() != "button" && children[i].nodeName.toLowerCase() != "textarea" && children[i].nodeName.toLowerCase() != "script" && txttoimageImgDetectRegExp.test(children[i].textContent) && children[i].hasChildNodes()) {
				// check this child's nodes as well
				// FIXME: this should just be done using a better recursive algorithm
				var array2 = txttoimageGetTextNodes(children[i]);

				for (var j = 0; j < array2.length; j++) {
					textArray.push(array2[j]);
				}
			}
		}

		return textArray;
	}

	/**
	 * Test if the URL passes all the blacklist filters
	 */
	function txttoimageBlacklistPass(aUrl)
	{
		for (var i = 0; i < txttoimageBlacklist.length; i++) {
			try {
				// test the URL against the blacklist
				if (txttoimageBlacklist[i].test(aUrl)) {
					return false;
				}
			} catch(e) {}
		}

		return true;
	}

	function txttoimagePicFunc()
	{
		txttoimageSetEvents(this);
	}

	/**
	 * Set all the extra functions after the image finishes loading. Plus, it will
	 * replace the loader if loader images are activated
	 */
	function txttoimageSetEvents(aImg)
	{
		if (!aImg.naturalWidth || !aImg.naturalHeight) {
			txttoimageBrokenImage({ currentTarget : aImg });
		}

		var gDimensions  = new Array(2);

		if (txttoimageRegular[0]) {
			gDimensions[0] = txttoimageRegularv[0] + "px";
		} else {
			gDimensions[0] = "auto";
		}

		if (txttoimageRegular[1]) {
			gDimensions[1] = txttoimageRegularv[1] + "px";
		} else {
			gDimensions[1] = "auto";
		}

		// hovering over large images (if enabled) will resize them according to preferences
		aImg.addEventListener("mouseover", txttoimagePicHover, false);
		aImg.addEventListener("mouseout", txttoimagePicOut, false);
		aImg.addEventListener("dblclick", txttoimageOpenWindow, true);

		// if image resizing is enabled, resize the image proportionally
		if (txttoimageRegular[0] && txttoimageRegular[1]) {
			var imgRatio = aImg.naturalHeight / aImg.naturalWidth;
			var maxRatio = txttoimageRegularv[1] / txttoimageRegularv[0];

			if (imgRatio >= maxRatio) {
				aImg.style.setProperty("max-width", (txttoimageRegularv[1] / imgRatio) + "px", "important");
				aImg.style.setProperty("max-height", gDimensions[1], "important");
			} else {
				aImg.style.setProperty("max-width", gDimensions[0], "important");
				aImg.style.setProperty("max-height", (txttoimageRegularv[0] * imgRatio) + "px", "important");
			}
		} else {
			aImg.style.setProperty("max-width", gDimensions[0], "important");
			aImg.style.setProperty("max-height", gDimensions[1], "important");
		}
	}

	/**
	 * Replaces loader image with acutal image after XMLHttpRequest finished
	 */
	function txttoimageStateChange(aUrl, aNode)
	{
		var request                = new XMLHttpRequest();
		request.open("GET", aUrl);
		request._txttoimageData    = aNode;
		request.onreadystatechange = function()
		{
			if (request.readyState == 4 && request.status >= 200) {
				if (!request._txttoimageData.parentNode) {
					request._txttoimageData = request._txttoimageData._txttoimageData.loaderImg;
					txttoimageSetEvents(request._txttoimageData);
				} else {
					request._txttoimageData._txttoimageData.loaderImg.addEventListener("error", txttoimageBrokenImage, true);
					request._txttoimageData.parentNode.replaceChild(request._txttoimageData._txttoimageData.loaderImg, request._txttoimageData);

					if (request._txttoimageData._txttoimageData.loaderImg.complete) {
						txttoimageSetEvents(request._txttoimageData._txttoimageData.loaderImg);
					} else {
						request._txttoimageData._txttoimageData.loaderImg.addEventListener("load", txttoimagePicFunc, true);
					}
				}
			}
		};

		request.send(null);
	}

	/**
	 * if we're over an image made by Text-to-Image, display some special items in
	 * the context menu
	 */
	function txttoimagePopup()
	{
		txttoimageImgsonpage = 0;
		var img              = gContextMenu.target._txttoimageData;
		var hide             = (!img || !img.isValid);
		var link2img         = (!txttoimageImgRegExp.test(gContextMenu.linkURL));

		if (document.getElementById("txttoimageSeparatorOne").previousSibling.tagName.toLowerCase() == "menuseparator") {
			document.getElementById("txttoimageSeparatorOne").hidden = true;
		} else {
			document.getElementById("txttoimageSeparatorOne").hidden = hide;
		}

		document.getElementById("txttoimageOpen").hidden           = hide;
		document.getElementById("txttoimageRemove").hidden         = hide;
		document.getElementById("txttoimageBlacklist").hidden      = hide;
		//document.getElementById("txttoimageTxt-Img").hidden        = hide; // I doubt I'll ever get this to work
		document.getElementById("txttoimageLink-Img").hidden       = link2img;

		if (document.getElementById("txttoimageSeparatorTwo").nextSibling.tagName.toLowerCase() == "menuseparator") {
			document.getElementById("txttoimageSeparatorTwo").hidden = true;
		} else {
			document.getElementById("txttoimageSeparatorTwo").hidden = hide;
		}
	}

	/**
	 * Open the add filter dialog
	 */
	this.AddFilter = function(aUrl, aType)
	{
		window.openDialog("chrome://txttoimage/content/txttoimageAddFilter.xul", txttoimageStrings.getString("addFilterText"), "chrome, modal, centerscreen, dialog", aUrl, aType);
	}

	/**
	 * Open a window to view the image in at full size
	 */
	function txttoimageOpenWindow(e)
	{
		if (txttoimageImgmode == "new") {
			window.openDialog("chrome://txttoimage/content/view.xhtml", "", "chrome, resizable, location=no, menubar=no, directories=no, toolbar=no, status=no", e.target.src);
		}
	}

	this.OpenWindow = txttoimageOpenWindow;

	/**
	 * resize the image on hover over and other stuff
	 */
	function txttoimagePicHover(e)
	{
		var dimensions = new Array(2);
		var img        = e.target;
		txttoimageCurrImg = img;

		if (txttoimageMouse[0]) {
			dimensions[0] = txttoimageMousev[0] + "px";
		} else {
			dimensions[0] = "auto";
		}

		if (txttoimageMouse[1]) {
			dimensions[1] = txttoimageMousev[1] + "px";
		} else {
			dimensions[1] = "auto";
		}

		if (txttoimageMouse[0] && txttoimageMouse[1]) {
			var imgRatio = img.naturalHeight / img.naturalWidth;
			var maxRatio = txttoimageMousev[1] / txttoimageMousev[0];

			if (imgRatio >= maxRatio) {
				img.style.setProperty("max-width", (txttoimageMousev[1] / imgRatio) + "px", "important");
				img.style.setProperty("max-height", dimensions[1], "important");
			} else {
				img.style.setProperty("max-width", dimensions[0], "important");
				img.style.setProperty("max-height", (txttoimageMousev[0] * imgRatio) + "px", "important");
			}
		} else {
			img.style.setProperty("max-width", dimensions[0], "important");
			img.style.setProperty("max-height", dimensions[1], "important");
		}

		if (txttoimageImgmode == "new") {
			// for Firefox 1.4 and up, window.status just won't cut it for some reason
			window.content.document.defaultView.status = txttoimageStrings.getString("dblClick");
			img.style.setProperty("cursor", "pointer", "important");
		} else {
			img.style.removeProperty("cursor");
		}
	}

	/**
	 * undoes anything the previous function did
	 */
	function txttoimagePicOut(e)
	{
		txttoimageCurrImg = null;
		var dimensions    = new Array(2)
		var img           = e.target;

		if (txttoimageRegular[0]) {
			dimensions[0] = txttoimageRegularv[0] + "px";
		} else {
			dimensions[0] = "auto";
		}

		if (txttoimageRegular[1]) {
			dimensions[1] = txttoimageRegularv[1] + "px";
		} else {
			dimensions[1] = "auto";
		}

		if (txttoimageRegular[0] && txttoimageRegular[1]) {
			var imgRatio = img.naturalHeight / img.naturalWidth;
			var maxRatio = txttoimageRegularv[1] / txttoimageRegularv[0];

			if (imgRatio >= maxRatio) {
				img.style.setProperty("max-width", (txttoimageRegularv[1] / imgRatio) + "px", "important");
				img.style.setProperty("max-height", dimensions[1], "important");
			} else {
				img.style.setProperty("max-width", dimensions[0], "important");
				img.style.setProperty("max-height", (txttoimageRegularv[0] * imgRatio) + "px", "important");
			}
		} else {
			img.style.setProperty("max-width", dimensions[0], "important");
			img.style.setProperty("max-height", dimensions[1], "important");
		}

		window.content.document.defaultView.status = "";
	}

	/**
	 * remove the targeted image; for the context menu only
	 */
	this.RemoveImage = function(gCM)
	{
		var img      = gCM.target;
		var origNode = img._txttoimageData.origNode;

		if (!origNode) {
			img.parentNode.removeChild(img);
			return;
		}

		img.parentNode.replaceChild(origNode, img);
	}

	/**
	 * Removes the image if it was a bad link and replaces it with its original
	 * text/link
	 */
	function txttoimageBrokenImage(e)
	{
		var img      = e.currentTarget;
		var origNode = img._txttoimageData.origNode;

		if (!origNode) {
			img.parentNode.removeChild(img);
			return;
		}

		img.parentNode.replaceChild(origNode, img);
	}

	/**
	 * Fixes the bug with the image still staying at the hover-over size when
	 * opening it in a pop-up by double-clicking it
	 */
	function txttoimageWindowBlur()
	{
		if (txttoimageCurrImg) {
			txttoimagePicOut({ target : txttoimageCurrImg });
		}
	}
};

window.addEventListener("load", TxttoImage.Init, false);
