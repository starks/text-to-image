/**
 * Options JS
 * Provides the functions to loading/saving user preferences
 */

var prefix     = 'txttoimage';
var prefs      = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(prefix + '.');
var checkboxes = ['Width', 'Height', 'HoverW', 'HoverH'];
var integers   = ['WidthValue', 'HeightValue', 'HoverWV', 'HoverHV'];
var txttoimageStrings;

/*
 * Credit goes to Abdulah A, creator of the GameFOX extension, for the idea of
 * the layout of the InitOps() and SaveOps() functions. And I used most of the
 * functions for the blacklist from the AdBlock extension. I hope the people
 * who make Adblock don't get mad at me stealing a lot of their code...
 */

/**
 * Update option values and set a couple event listeners
 */
function txttoimageInitOps()
{
	txttoimageStrings = document.getElementById('txttoimageStringBundle');
	var imgTypes = prefs.getCharPref('imageTypes').split(' ').sort();
	var cusTypes = new Array();
	var i;

	for (i = 0; i < checkboxes.length;  i++) {
		document.getElementById(prefix + checkboxes[i]).checked = prefs.getBoolPref(checkboxes[i]);
		document.getElementById(prefix + integers[i]).disabled = !prefs.getBoolPref(checkboxes[i]);

		if (!document.getElementById(prefix + integers[i]).disabled) {
			document.getElementById(prefix + integers[i]).value = prefs.getIntPref(integers[i]);
		}
	}

	document.getElementById(prefix + 'Mode').selectedItem = document.getElementById(prefix + 'Mode').getElementsByAttribute('value', prefs.getCharPref('mode'))[0];
	document.getElementById(prefix + 'imageLoader').checked = prefs.getBoolPref('imageLoader');

	if (prefs.getCharPref('filter') != '') {
		var filterList = prefs.getCharPref('filter').split(' ').sort();

		for (i = 0; i < filterList.length; i++) {
			document.getElementById(prefix + 'Listbox1').appendItem(filterList[i], '');
		}

		for (i = 0; i < document.getElementById(prefix + 'Listbox1').childNodes.length; i++) {
			document.getElementById(prefix + 'Listbox1').childNodes[i].setAttribute('ondblclick', 'listClickControl();');
		}
	}

	if (prefs.getCharPref('siteFilter') != '') {
		var filterList = prefs.getCharPref('siteFilter').split(' ').sort();

		for (i = 0; i < filterList.length; i++) {
			document.getElementById(prefix + 'Listbox2').appendItem(filterList[i], '');
		}

		for (i = 0; i < document.getElementById(prefix + 'Listbox2').childNodes.length; i++) {
			document.getElementById(prefix + 'Listbox2').childNodes[i].setAttribute('ondblclick', 'listClickControl();');
		}
	}

	document.getElementById(prefix + 'MaxNumberOfImages').value = prefs.getIntPref('maxNumberOfImages');

	for (i = 0; i < imgTypes.length; i++) {
		switch (imgTypes[i]) {
			case 'jpg':
				document.getElementById(prefix + 'Jpg').checked = true;
				break;

			case 'jpeg':
				document.getElementById(prefix + 'Jpeg').checked = true;
				break;

			case 'jpe':
				document.getElementById(prefix + 'Jpe').checked = true;
				break;

			case 'jfif':
				document.getElementById(prefix + 'Jfif').checked = true;
				break;

			case 'bmp':
				document.getElementById(prefix + 'Bmp').checked = true;
				break;

			case 'dib':
				document.getElementById(prefix + 'Dib').checked = true;
				break;

			case 'gif':
				document.getElementById(prefix + 'Gif').checked = true;
				break;

			case 'png':
				document.getElementById(prefix + 'Png').checked = true;
				break;

			default:
				cusTypes.push(imgTypes[i]);
				break;
		}
	}

	document.getElementById(prefix + 'CustomTypes').value = cusTypes.sort().join(' ').toLowerCase();
	txttoimageUpdateButtons();
}

/**
 * Save any changes and close the window
 */
function txttoimageSaveOps()
{
	var filters1 = new Array();
	var filters2 = new Array();
	var imgTypes = new Array();
	var i;

	for (i = 0; i < checkboxes.length; i++) {
		prefs.setIntPref(integers[i], document.getElementById(prefix + integers[i]).value * 1);
		prefs.setBoolPref(checkboxes[i], document.getElementById(prefix + checkboxes[i]).checked);

		if (document.getElementById(prefix + integers[i]).value == 0) {
			prefs.setBoolPref(checkboxes[i], false);
		}
	}

	prefs.setBoolPref('imageLoader', document.getElementById(prefix + 'imageLoader').checked);
	prefs.setCharPref('mode', document.getElementById(prefix + 'Mode').value);
	var rowCount1 = document.getElementById(prefix + 'Listbox1').getRowCount() - 1;

	for (i = rowCount1; i >= 0; i--) {
		var item = document.getElementById(prefix + 'Listbox1').getItemAtIndex(i);
		filters1.push(item.label);
	}

	prefs.setCharPref('filter', filters1.sort().join(' ').toLowerCase());
	var rowCount2 = document.getElementById(prefix + 'Listbox2').getRowCount() - 1;

	for (i = rowCount2; i >= 0; i--) {
		var item = document.getElementById(prefix + 'Listbox2').getItemAtIndex(i);
		filters2.push(item.label);
	}

	prefs.setCharPref('siteFilter', filters2.sort().join(' ').toLowerCase());
	prefs.setIntPref('maxNumberOfImages', document.getElementById(prefix + 'MaxNumberOfImages').value * 1);

	if (document.getElementById(prefix + 'Jpg').checked) {
		imgTypes.push('jpg');
	}

	if (document.getElementById(prefix + 'Jpeg').checked) {
		imgTypes.push('jpeg');
	}

	if (document.getElementById(prefix + 'Jpe').checked) {
		imgTypes.push('jpe');
	}

	if (document.getElementById(prefix + 'Jfif').checked) {
		imgTypes.push('jfif');
	}

	if (document.getElementById(prefix + 'Bmp').checked) {
		imgTypes.push('bmp');
	}

	if (document.getElementById(prefix + 'Dib').checked) {
		imgTypes.push('dib');
	}

	if (document.getElementById(prefix + 'Gif').checked) {
		imgTypes.push('gif');
	}

	if (document.getElementById(prefix + 'Png').checked) {
		imgTypes.push('png');
	}

	var cusTypes = document.getElementById(prefix + 'CustomTypes').value.toLowerCase().split(' ');
	imgTypes = imgTypes.concat(cusTypes).sort().join(' ').replace(/^[\s]*(.+?)[\s]*$/, '$1');
	prefs.setCharPref('imageTypes', imgTypes);
	window.close();
}

/**
 * Delete selected filters
 */
function txttoimageFilterDeleteSelected(confirmDelete, listId)
{
	var box = document.getElementById(prefix + 'Listbox' + listId);

	if (confirmDelete && !confirm(txttoimageStrings.getString('confirmSelect'))) {
		return;
	}

	while (box.selectedCount) {
		box.removeItemAt(box.selectedIndex);
	}

	txttoimageUpdateButtons();
}

/**
 * Delete all filters
 */
function txttoimageFilterDeleteAll(confirmDelete, listId)
{
	var box = document.getElementById(prefix + 'Listbox' + listId);
	var rowCount = box.getRowCount();

	if (confirmDelete && !confirm(txttoimageStrings.getString('confirmAll'))) {
		return;
	}

	for (var i = rowCount; i >= 0; i--) {
		box.removeItemAt(i);
	}

	txttoimageUpdateButtons();
}

/**
 * Add a filter, taken a step further than what AdBlock does and edits the
 * filter inline
 */
function txttoimageFilterAdd(listId)
{
	var list           = document.getElementById(prefix + 'Listbox' + listId);
	var selectedX      = list.appendItem('', '');
	var selectedXcell  = document.getAnonymousNodes(selectedX)[0];
	var selectedXfield = document.getAnonymousNodes(selectedX)[1];
	var filter         = selectedXcell.getAttribute('label');
	list.ensureElementIsVisible(selectedX);
	selectedX.setAttribute('modifying', 'true');
	selectedX.setAttribute('new', 'true');
	selectedXcell.hidden = 'true';
	selectedXfield.value = filter;
	selectedXfield.setAttribute('hidden', 'false');
	list.blur()
	selectedXfield.select();
	selectedXfield.focus();
	selectedXfield.setAttribute('onblur', 'deactivateAdd(event.target);');
}

/**
 * For the added filter, remove it if it's blank
 */
function deactivateAdd(parameter)
{
	var modifying = findElementWithAttribute('listitem', 'modifying', 'true');

	if (modifying) {
		var list          = modifying.control;
		var selectedIndex = list.selectedIndex;
		var selected      = list.selectedItem;
		var disableX      = modifying;
		var disableXcell  = document.getAnonymousNodes(disableX)[0];
		var disableXfield = document.getAnonymousNodes(disableX)[1];
		var disableXindex = list.getIndexOfItem(disableX);
		// note: 'value' needs to be called by method, not property
		var filter        = makePattern(disableXfield.value);

		// if the filter isn't blank, *And* we weren't called by the "esc" key
		if (filter == '' || parameter == 'esc') {
			return list.removeItemAt(disableXindex);
		}

		// save the filter
		disableXcell.setAttribute('label', filter);
		//listitem's label: used for later saving, createListItem does this too.
		disableX.setAttribute('label', filter);
		disableXcell.setAttribute('hidden', 'false');
		disableXfield.setAttribute('hidden', 'true');
		disableXfield.removeAttribute('onblur');
		disableX.setAttribute('ondblclick', 'listClickControl();');
		// restore selection...
		list.selectedIndex = disableXindex;
		// ... and make it the current item
		list.currentItem   = list.getItemAtIndex(list.selectedIndex);
		/*
		 * refocus the list -- doesn't interfere with refocusing on other controls,
		 * but does refocus the *Window* if we were called by losing it to another
		 */
		list.focus();
		/*
		 * keep this for last, so listKeyControl wont accidentally activate the
		 * wrong field (if the user deselects and then presses 'return' fast
		 * enough)
		 */
		disableX.setAttribute('modifying', 'false');
		disableX.removeAttribute('new');
	}

	return null;
}

/**
 * Enable the inline editor for a selected filter
 */
function txttoimageFilterEdit(listId)
{
	var list           = document.getElementById(prefix + 'Listbox' + listId);
	var selectedX      = list.selectedItem;
	var selectedXcell  = document.getAnonymousNodes(selectedX)[0];
	var selectedXfield = document.getAnonymousNodes(selectedX)[1];
	var filter         = selectedXcell.getAttribute('label');
	list.ensureElementIsVisible(selectedX);
	selectedX.setAttribute('modifying', 'true');
	selectedXcell.hidden = 'true';
	selectedXfield.value = filter;
	selectedXfield.setAttribute('hidden', 'false');
	selectedX.removeAttribute('ondblclick');
	list.blur()
	selectedXfield.select();
	selectedXfield.focus();
	selectedXfield.setAttribute('onblur', 'deactivateModify(event.target);');
}

/**
 * deactivates the textbox for filter modification
 */
function deactivateModify(parameter)
{
	var modifying = findElementWithAttribute('listitem', 'modifying', 'true');

	if (modifying) {
		var list          = modifying.control;
		var selectedIndex = list.selectedIndex;
		var selected      = list.selectedItem;
		var disableX      = modifying;
		var disableXcell  = document.getAnonymousNodes(disableX)[0];
		var disableXfield = document.getAnonymousNodes(disableX)[1];
		var disableXindex = list.getIndexOfItem(disableX);
		// note:  'value' needs to be called by method, not property
		var filter        = makePattern(disableXfield.value);

		// if the filter isn't blank, *And* we weren't called by the "esc" key
		if (filter != '' && parameter != 'esc') { 
			// save the filter
			disableXcell.setAttribute('label', filter);
			// listitem's label: used for later saving, createListItem does this too.
			disableX.setAttribute('label', filter);
		}

		disableXcell.setAttribute('hidden', 'false');
		disableXfield.setAttribute('hidden', 'true');
		disableXfield.removeAttribute('onblur');
		disableX.setAttribute('ondblclick', 'listClickControl();');
		// restore selection...
		list.selectedIndex = disableXindex;
		// ... and make it the current item
		list.currentItem   = list.getItemAtIndex(list.selectedIndex);
		/*
		 * refocus the list -- doesn't interfere with refocusing on other controls,
		 * but does refocus the *Window* if we were called by losing it to another
		 */
		list.focus();
		/*
		 * keep this for last, so listKeyControl wont accidentally activate the
		 * wrong field (if the user deselects and then presses 'return' fast
		 * enough)
		 */
		disableX.setAttribute('modifying', 'false');
	}
}

/**
 * receives mouseClicks from the list-area and makes decisions
 */
function listClickControl()
{
	var list1     = document.getElementById(prefix + 'Listbox1');
	var selected1 = list1.selectedItem;
	var list2     = document.getElementById(prefix + 'Listbox2');
	var selected2 = list2.selectedItem;
	var modifying = findElementWithAttribute('listitem', 'modifying', 'true');

	// if we have a filter selected and in-focus
	if (selected1 && selected1.focus) {
		// if we're not modifying anything already
		if (!modifying) {
			txttoimageFilterEdit(1);
		} else if (modifying != selected1) { // we're already modifying something
			// if we want to activate a different item
			deactivateModify(modifying);
			txttoimageFilterEdit(1);
		}
	} else if (modifying && !modifying.focused) {
		// the listbox lost focus
		deactivateModify(modifying);
	}

	// if we have a filter selected and in-focus
	if (selected2 && selected2.focus) {
		// if we're not modifying anything already
		if (!modifying) {
			txttoimageFilterEdit(2);
		} else if (modifying != selected2) { // we're already modifying something
			// if we want to activate a different item
			deactivateModify(modifying);
			txttoimageFilterEdit(2);
		}
	} else if (modifying && !modifying.focused) {
		// the listbox lost focus
		deactivateModify(modifying);
	}
}

/**
 * Checks all elements of the specified tagname for an attribute match --
 * returns first match
 */
function findElementWithAttribute(elementTagName, attributeX, valueX)
{
	var elementarrayX = document.getElementsByTagName(elementTagName);

	for (var i = 0 ; i < elementarrayX.length ; i++) {
		var element = elementarrayX[i];

		if (element.hasAttribute(attributeX) && element.getAttribute(attributeX) == valueX) {
			return element;
		}
	}

	// failure
	return false;
}

/**
 * This function removes illegal characters (at the moment, space) from the
 * patterns.
 */
function makePattern(pat)
{
	var res = '';

	for (var i = 0 ; i < pat.length ; i++) {
		switch (pat[i]) {
			case ' ': 
				break;

			default:
				res += pat[i];
				break;
		}
	}

	return res;
}

/**
 * Update the blacklist buttons to disable the ones I don't want people
 * clicking at the time
 */
function txttoimageUpdateButtons()
{
	var box1 = document.getElementById(prefix + 'Listbox1');

	if (!box1.getRowCount()) {
		document.getElementById(prefix + 'EditFilter1').disabled     = true;
		document.getElementById(prefix + 'DeleteSelected1').disabled = true;
		document.getElementById(prefix + 'DeleteAll1').disabled      = true;
	} else if (!box1.selectedCount) {
		document.getElementById(prefix + 'EditFilter1').disabled     = true;
		document.getElementById(prefix + 'DeleteSelected1').disabled = true;
		document.getElementById(prefix + 'DeleteAll1').disabled      = false;
	} else if (box1.selectedCount == 1) {
		document.getElementById(prefix + 'EditFilter1').disabled     = false;
		document.getElementById(prefix + 'DeleteSelected1').disabled = false;
		document.getElementById(prefix + 'DeleteAll1').disabled      = false;
	} else if (box1.selectedCount > 1) {
		document.getElementById(prefix + 'EditFilter1').disabled     = true;
		document.getElementById(prefix + 'DeleteSelected1').disabled = false;
		document.getElementById(prefix + 'DeleteAll1').disabled      = false;
	}

	var box2 = document.getElementById(prefix + 'Listbox2');

	if (!box2.getRowCount()) {
		document.getElementById(prefix + 'EditFilter2').disabled     = true;
		document.getElementById(prefix + 'DeleteSelected2').disabled = true;
		document.getElementById(prefix + 'DeleteAll2').disabled      = true;
	} else if (!box2.selectedCount) {
		document.getElementById(prefix + 'EditFilter2').disabled     = true;
		document.getElementById(prefix + 'DeleteSelected2').disabled = true;
		document.getElementById(prefix + 'DeleteAll2').disabled      = false;
	} else if (box2.selectedCount == 1) {
		document.getElementById(prefix + 'EditFilter2').disabled     = false;
		document.getElementById(prefix + 'DeleteSelected2').disabled = false;
		document.getElementById(prefix + 'DeleteAll2').disabled      = false;
	} else if (box2.selectedCount > 1) {
		document.getElementById(prefix + 'EditFilter2').disabled     = true;
		document.getElementById(prefix + 'DeleteSelected2').disabled = false;
		document.getElementById(prefix + 'DeleteAll2').disabled      = false;
	}
}

/**
 * Key events for the window
 */
function txttoimageBlacklistEvents(e)
{
	var list1      = document.getElementById(prefix + 'Listbox1');
	var listpress1 = (e.target.id == prefix + 'Listbox1' && list1.selectedItem);
	var list2      = document.getElementById(prefix + 'Listbox2');
	var listpress2 = (e.target.id == prefix + 'Listbox2' && list2.selectedItem);
	var modifying  = findElementWithAttribute('listitem', 'modifying', 'true');
	var newAdd     = modifying ? modifying.getAttribute('new') : false;

	switch (e.keyCode) {
		case e.DOM_VK_BACK_SPACE:
		case e.DOM_VK_DELETE:
			if (listpress1 && !modifying) {
				txttoimageFilterDeleteSelected(false, 1);
			} else if (listpress2 && !modifying) {
				txttoimageFilterDeleteSelected(false, 2);
			}

			break;

		case e.DOM_VK_RETURN:
		case e.DOM_VK_ENTER:
			if (modifying && !newAdd) {
				deactivateModify('return');
			} else if (modifying && newAdd) {
				deactivateAdd('return');
			} else if (listpress1) {
				txttoimageFilterEdit(1);
			} else if (listpress2) {
				txttoimageFilterEdit(2);
			} else {
				txttoimageSaveOps();
			}

			break;

		case e.DOM_VK_ESCAPE:
		case e.DOM_VK_CANCEL:
			if (modifying && !newAdd) {
				deactivateModify('esc');
			} else if (modifying && newAdd) {
				deactivateAdd('esc');
			} else {
				window.close();
			}

			break;
	}
}

/**
 * Simple function to disable the textboxes in the first tab
 */
function txttoimageDisableTextBoxes(id)
{
	var box = document.getElementById(prefix + id).disabled;
	document.getElementById(prefix + id).disabled = !box;
}
