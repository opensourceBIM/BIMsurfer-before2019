# A utility to escape special regular expression characters from a string

# See http://www.regular-expressions.info/charclass.html for details on what special characters may be used in what order inside a [] character class
# Used http://www.javascriptkit.com/jsref/regexp.shtml for a reference list of special characters
# Sometimes this function is called RexExp.quote. See also http://stackoverflow.com/questions/2593637/how-to-escape-regular-expression-in-javascript
RegExp.escape = (str) -> str.replace /[[\]\\$().{},?*+|^-]/g, "\\$&"
