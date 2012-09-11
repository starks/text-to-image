var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('txttoimage.');

// save TTI options
function txttoimageSaveOps()
{
  var pattern = document.getElementById("txttoimageTbox").value;
  if (pattern.length) {
    txttoimageApply(pattern);
  }
}

// apply a new filter
function txttoimageApply(filter)
{
  var pref = window.arguments[1];
  if (filter.charAt(0) == '/' && filter.charAt(filter.length - 1) == '/') {
    filter = filter.replace(/\s/g, "\\s");
  } else {
    filter = filter.replace(/\s/g, "*");
  }
  var current = prefs.getCharPref(pref).length ? prefs.getCharPref(pref) + ' ' : '';
  prefs.setCharPref(pref, current + filter);
}

// load options
function txttoimageInitOps()
{
  document.getElementById("txttoimageTbox").setAttribute("value", window.arguments[0]
  );
}