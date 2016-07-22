/* globals NodeFilter: false */
/* globals MutationObserver: false */

var json = null;

// simple chrome ajax helper
function ajaxGet (url, callback) {
  console.log('get');
  var ajaxCallback;
  ajaxCallback = (typeof callback === 'function' ? callback : false);
  var xhr = null;
  try {
    xhr = new window.XMLHttpRequest();
  } catch (e) {
    console.log('oops');
  }
  if (!xhr) {
    return null;
  }
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && ajaxCallback) {
      ajaxCallback(xhr.responseText);
    }
  };

  xhr.send(null);
  return xhr;
}

function loadJson (ajaxResponse) {
  json = JSON.parse(ajaxResponse);
  walkAndObserve(document);
}

function walk (rootNode) {
  // Find all the text nodes in rootNode
  var walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
  var node = walker.nextNode();

  // Modify each text node's value
  while (node) {
    handleText(node);
    node = walker.nextNode();
  }
}

function handleText (textNode) {
  textNode.nodeValue = replaceText(textNode.nodeValue);
}

function replaceText (v) {
  if (json !== null) {
    var supporters = json.supporters;
    for (var i in supporters) {
      var names = supporters[i].text_to_replace;
      for (var j in names) {
        var text = names[j];
        var regEx = new RegExp(text, 'gi');
        if (v.match(regEx)) {
          v = v.replace(regEx, addDisclosure(text));
        }
      }
    }
  } else {
    console.log('json not found!');
  }

  return v;
}

function addDisclosure (name) {
  var nameWithDisclosure = name + ' (who supported the Iraq War)';
  return nameWithDisclosure;
}

// The callback used for the document body and title observers
function observerCallback (mutations) {
  var i;

  mutations.forEach(function (mutation) {
    for (i = 0; i < mutation.addedNodes.length; i++) {
      if (mutation.addedNodes[i].nodeType === 3) {
        // Replace the text for text nodes
        handleText(mutation.addedNodes[i]);
      } else {
        // Otherwise, find text nodes within the given node and replace text
        walk(mutation.addedNodes[i]);
      }
    }
  });
}

// Walk the doc (document) body, replace the title, and observe the body and title
function walkAndObserve (doc) {
  var docTitle = doc.getElementsByTagName('title')[0];
  var observerConfig = {
    characterData: true,
    childList: true,
    subtree: true
  };
  var bodyObserver, titleObserver;

  // Do the initial text replacements in the document body and title
  walk(doc.body);
  doc.title = replaceText(doc.title);

  // Observe the body so that we replace text in any added/modified nodes
  bodyObserver = new MutationObserver(observerCallback);
  bodyObserver.observe(doc.body, observerConfig);

  // Observe the title so we can handle any modifications there
  if (docTitle) {
    titleObserver = new MutationObserver(observerCallback);
    titleObserver.observe(docTitle, observerConfig);
  }
}

ajaxGet('https://raw.githubusercontent.com/BrianHubble/IraqWarDisclosure/master/supporter_list.json', loadJson);
