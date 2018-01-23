/**
 * Interpolates a text string by replacing {_xxx_} tokens with snippets taken from Module._textInterpolators
 * For future use: translates the string using a translation table
 * @param {string} txt - Text to be translated and interpolated
 * @returns {string} - Result text
 * @private
 * @global
 */
/*global _TRL*/
export default function _TRL(txt) {
  var reg = new RegExp(/{_.*?_}/g);
  var tokens = [];
  var match;
  while ((match = reg.exec(txt))) tokens.push(match[0]);
  $.each(tokens, function(idx, token) {
    if (token.length < 5) {
      //Module.Test.reportBug('Invalid token: '+token);
    }
    var tokenString = token.substring(2, token.length - 2);
    var isCapital = tokenString[0] != tokenString[0].toLowerCase();
    tokenString = tokenString.toLowerCase();
    var replacement = Module._textInterpolators[tokenString];
    if (!replacement) {
      //Module.Test.reportBug('Invalid token: '+token);
      replacement = tokenString;
    }
    if (isCapital)
      replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
    //if (Module._useTextDecoration())
    //    replacement = '|' + replacement + '|';
    txt = txt.replace(token, replacement);
  });
  // if (Module._useTextDecoration()) txt = "‘" + txt + "’";
  return txt;
};
