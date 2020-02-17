var CKI = CKI || {};

CKI.enabledImporters = {
	"Default CSV": CKI.Importers.default,
	"Fidelity Consolidated 1099 CSV": CKI.Importers.fidelity,
	"Bitcoin.tax": CKI.Importers.bitcoinTax,
	"Wealthfront xls": CKI.Importers.wealthfront,
	"lendingclub xls": CKI.Importers.lendingclub,
	"Cointracking.info CSV": CKI.Importers.coinTrackingInfo,
};

CKI.xls = ["Wealthfront xls","lendingclub xls"];

CKI.init = function(evt) {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
	  CKI.currentIndex = 0;
	  CKI.ckAddRowsBtn = document.getElementById('addRows');
	  CKI.render(evt);
	} else {
	  console.log('The File APIs are not fully supported in this browser.');
	}
}

CKI.render = function(evt) {
	const referenceNode =  document.getElementsByClassName('subPageExplain')[0];

	CKI.wrapperEl = document.createElement("div");
	CKI.wrapperEl.style.padding = "10px 20px";
	CKI.wrapperEl.style.marginBottom = "10px";
	CKI.wrapperEl.style.backgroundColor = "#f5f6f7";
	var title = document.createElement('h3');
	title.innerHTML = "Import from CSV file:";

	CKI.wrapperEl.appendChild(title);
	referenceNode.appendChild(CKI.wrapperEl);
	CKI.renderBelongsToSelect();
	CKI.renderImportTypeSelect();
	CKI.renderFileInput(evt);

	var aNode = document.createElement('a');
	aNode.style.float = "right";
	aNode.innerHTML = "Clear all entries";
	aNode.onclick = function() {
			var el = document.getElementById('capitalGainsTable');
			el.remove();
	};
	CKI.wrapperEl.appendChild(aNode);
}

CKI.renderImportTypeSelect = function(evt) {
	CKI.selectImportTypeNode = document.createElement("select");
	CKI.placeholder = "Choose an import type...";

	var placeholder = document.createElement('option');
	placeholder.disabled = true;
	placeholder.selected = true;
	placeholder.innerHTML = "Choose an import type...";
	CKI.selectImportTypeNode.appendChild(placeholder);

	var types = Object.keys(CKI.enabledImporters);
	for (var i = 0; i<types.length; i++){
	    var opt = document.createElement('option');
	    opt.value = types[i];
	    opt.innerHTML = types[i];
	    CKI.selectImportTypeNode.appendChild(opt);
	}

	CKI.wrapperEl.appendChild(CKI.selectImportTypeNode);
}

CKI.renderBelongsToSelect = function(evt) {
	CKI.selectBelongsToNode = document.createElement("select");
	CKI.placeholder = "Choose Belongs to";

	var placeholder = document.createElement('option');
	placeholder.disabled = true;
	placeholder.selected = true;
	placeholder.innerHTML = "Choose Belongs to"
	CKI.selectBelongsToNode.appendChild(placeholder);

	var bt = document.querySelector('[name="capitalGains[0].belongsTo"]');
	var types = Object.keys(CKI.enabledImporters);
	for (var i = 1; i<bt.options.length; i++){
	    var opt = document.createElement('option');
	    opt.value = bt.options[i].value;
	    opt.innerHTML = bt.options[i].innerHTML;
	    CKI.selectBelongsToNode.appendChild(opt);
	}

	CKI.wrapperEl.appendChild(CKI.selectBelongsToNode);
}


CKI.renderFileInput = function(evt) {
	var aNode = document.createElement("input");
	aNode.style.display = "inline";
	aNode.style.marginLeft = "20px";
	aNode.type="file"
	aNode.id = "files";
	aNode.name = "files[]";
	aNode.className = "tk-button tk-button--secondary";

	CKI.wrapperEl.appendChild(aNode);

	document.getElementById('files').addEventListener('change', CKI.handleFileSelect, false);
}

CKI.readFile = function(reader,file) {
   var select = CKI.selectImportTypeNode;
   var dataSource = select.options[select.selectedIndex].value;

   if(CKI.xls.includes(dataSource)) {
       reader.readAsArrayBuffer(file);
   } else {
       reader.readAsText(f);
   }
}

CKI.handleFileSelect = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();

    var files = evt.target.files; // FileList object
    // Loop through the FileList and process csv files.
    for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();
      // Closure to capture the file information.
      reader.onload = (function(theFile) {
        return function(e) {
          var select = CKI.selectImportTypeNode;
          var dataSource = select.options[select.selectedIndex].value;
          var csvArray = CKI.processCsvData(dataSource, e.target.result);
          CKI.addCsvDataToTable(dataSource, csvArray);
        };
      })(f);

      CKI.readFile(reader, f);
    }
}

CKI.processCsvData = function(dataSource, allText) {
	if(CKI.enabledImporters.hasOwnProperty(dataSource) && typeof CKI.enabledImporters[dataSource].textToLines === 'function') {
		return CKI.enabledImporters[dataSource].textToLines(allText);
	}

	return CKI.Importers.default.textToLines(allText);
}

CKI.addCsvDataToTable = function(dataSource, csvArray) {
	var i = 0;

	function loop() {
		var row = csvArray[i];
		if(row){
			CKI.inputRowData(dataSource, row).then(function(){
				i++;
				loop();
			});
		}
	}

	loop();
}


CKI.inputRowData = function(dataSource, row) {
	return new Promise(function(resolve, reject) {
		var data = CKI.sourceRowToCKData(dataSource, row);

		if(!data) {
			return resolve();
		}

		CKI.getNextEmptyRow().then(function(rowResp) {
			var element = rowResp.element;
			var formIndex = rowResp.formIndex;

			var bt = element.querySelector('[name="capitalGains['+formIndex+'].belongsTo"]');
			bt.value = CKI.selectBelongsToNode.value;

			var rc = element.querySelector('[name="capitalGains['+formIndex+'].reportingCategory"]');
			rc.value = data.reportingCategory;

			var desc = element.querySelector('[name="capitalGains['+formIndex+'].description"]');
			desc.value = data.description;

			var da = element.querySelector('[name="capitalGains['+formIndex+'].dateAcquired"]');
			da.value = data.dateAcquired;

			var ds = element.querySelector('[name="capitalGains['+formIndex+'].dateSold"]');
			ds.value = data.dateSold;

			var sp = element.querySelector('[name="capitalGains['+formIndex+'].salesPrice"]');
			sp.focus();
			sp.value = data.salesPrice;
			var evt = document.createEvent("HTMLEvents");
			evt.initEvent("change", false, true);
			sp.dispatchEvent(evt);
			sp.blur();

			var c = element.querySelector('[name="capitalGains['+formIndex+'].cost"]');
			c.focus();
			c.value = data.costBasis;
			sp.dispatchEvent(evt);
			c.blur();

			CKI.updateRowGainLoss(element);

			CKI.currentIndex++;
			resolve();
		});
	});
}

CKI.sourceRowToCKData = function(dataSource, sourceObj) {
	if(CKI.enabledImporters.hasOwnProperty(dataSource)) {
		return CKI.enabledImporters[dataSource].parseCsvRow(sourceObj);
	}

	alert("Importer not found for: " + dataSource);
}

CKI.updateRowGainLoss = function(row){

	var salesPrice = CKI.convertDollarAmount($(row).find(".salesPrice").val());
	var cost = CKI.convertDollarAmount($(row).find(".cost").val());
	var adjustment = CKI.convertDollarAmount($(row).find(".adjustmentAmount").val());
	var gainLoss = parseFloat(salesPrice - cost + adjustment);
	var gainLossClass = "";
	if(gainLoss > 0){
	    gainLossClass = "gain";
	}else if(gainLoss < 0){
	    gainLossClass = "loss";
	}
	$(row).find(".gainLoss").html(gainLoss.toFixed(2)).removeClass("gain loss").addClass(gainLossClass);
	CKI.updateTotalRow();
}


CKI.updateTotalRow = function(){
    var rowCount = CKI.getRowCount();
    var salesPriceTotal = 0.0;
    var costTotal = 0.0;
    var adjustmentTotal = 0.0;
    for(var i = 0; i < rowCount; i++){
        var row = $("#row" + i);
        var salesPrice = CKI.convertDollarAmount($(row).find(".salesPrice").val());
        var cost = CKI.convertDollarAmount($(row).find(".cost").val());
        var adjustment = CKI.convertDollarAmount($(row).find(".adjustmentAmount").val());

        salesPriceTotal += salesPrice;
        costTotal += cost;
        adjustmentTotal += adjustment;
    }
    var gainLossTotal = parseFloat(salesPriceTotal) - parseFloat(costTotal) + parseFloat(adjustmentTotal);
    $("#salesPriceTotal").html(salesPriceTotal.toFixed(2));
    $("#costTotal").html(costTotal.toFixed(2));
    $("#adjustmentTotal").html(adjustmentTotal.toFixed(2));

    var gainLossClass = "";
    if(gainLossTotal > 0){
        gainLossClass = "gain";
    }else if(gainLossTotal < 0){
        gainLossClass = "loss";
    }

    $("#gainLossTotal").html(gainLossTotal.toFixed(2)).removeClass("gain loss").addClass(gainLossClass);
}

CKI.convertDollarAmount = function(value){
    if(value == null || value == '' || value == 'null'){
        value = '0.00';
    }
    return parseFloat(value.replace(/,/g,''));
}

CKI.getRowCount = function(){
    return $(".row").length;
}

CKI.getNextEmptyRow = function() {
	return new Promise(function(resolve, reject) {
        var element = document.querySelector('[name="capitalGains['+CKI.currentIndex+'].salesPrice"]');
		if(!element) {
			CKI.ckAddRowsBtn.click();
			return CKI.getNextEmptyRow().then(function(r){
				setTimeout(function(){
					resolve(r);
				}, 100);
			});
		}else if(document.querySelector('[name="capitalGains['+CKI.currentIndex+'].salesPrice"]').value !== '0.00' ||
				 document.querySelector('[name="capitalGains['+CKI.currentIndex+'].cost"]').value !== '0.00' ||
				 document.querySelector('[name="capitalGains['+CKI.currentIndex+'].description"]').value !== '') {
			CKI.currentIndex++;
			return CKI.getNextEmptyRow().then(resolve);

		}

		return resolve({ element: element.parentElement.parentElement, formIndex: CKI.currentIndex});
	});
}

window.addEventListener ("load", CKI.init, false);
