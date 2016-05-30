// currencyFormat.js
var accounting = require('accounting');
module.exports = {
	//
	getCommaSeparatedFormat: function(currencyType, amount) {
		var formattedString = accounting.formatMoney(amount,[symbol = currencyType],[precision = 2],[thousand = ","],[decimal = "."],[format = "%s %v"])
		return formattedString;
	},
	//
	getDotSeparatedFormat: function(currencyType, amount) {
		var formattedString = accounting.formatMoney(amount,[symbol = currencyType],[precision = 2],[thousand = "."],[decimal = ","],[format = "%s %v"])
		return formattedString;
	}
}