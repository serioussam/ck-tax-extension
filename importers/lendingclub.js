var CKI = CKI || {};
CKI.Importers = CKI.Importers || {};

CKI.Importers.lendingclub = {
    textToLines: function(allText) {
    	// return csv text as an array of objects
        var data = new Uint8Array(allText);
        var workbook = XLSX.read(data, {type: 'array'});
        var worksheet = workbook.Sheets["1099-B LC"];
        var json_sheet = XLSX.utils.sheet_to_json(worksheet);
        json_sheet = json_sheet.map(row => {
            var newRow = {};
            Object.keys(row).forEach(key =>  {
                newRow[key.replace('\r\n', ' ').replace('\n', ' ')] = row[key];
            });
            return newRow;
        });
        console.log(json_sheet);
        return json_sheet;
    },

    parseCsvRow: function(sourceObj) {
    	return {
            holdingType: ((sourceObj["(Box 2) Type of Gain or Loss"] || '').toLowerCase() === "lt") ? "2" : "1",
            reportingCategory:((sourceObj["(Box 2) Type of Gain or Loss"] || '').toLowerCase() === "lt") ? "4" : "1", 
            description: sourceObj['(Box 1a) Description'],
            dateAcquired: sourceObj['(Box 1b) Date Acquired'],
            dateSold: sourceObj["(Box 1c) Date Sold or Disposed"],
            salesPrice: sourceObj["(Box 1d) Proceeds"],
            costBasis: sourceObj["(Box 1e) Cost or Other Basis"],
        }
    }
};
