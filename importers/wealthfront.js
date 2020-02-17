var CKI = CKI || {};
CKI.Importers = CKI.Importers || {};

CKI.Importers.wealthfront = {
    textToLines: function(allText) {
    	// return csv text as an array of objects
        var data = new Uint8Array(allText);
        var workbook = XLSX.read(data, {type: 'array'});
        var worksheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(worksheet);
    },

    parseCsvRow: function(sourceObj) {
    	return {
            holdingType: ((sourceObj["Holding period"] || '').toLowerCase() === "long-term") ? "2" : "1",
            reportingCategory:((sourceObj["Holding period"] || '').toLowerCase() === "long-term") ? "4" : "1", 
            description: sourceObj['Description of property'],
            dateAcquired: sourceObj["Date acquired"],
            dateSold: sourceObj["Date sold"],
            salesPrice: sourceObj["Sales price"],
            costBasis: sourceObj["Cost"],
        }
    }
};
