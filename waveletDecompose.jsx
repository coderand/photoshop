// https://github.com/coderand/photoshop/waveletDecompose.jsx
// Wavelet decompose for Photoshop.
// Inspired by GIMP's Wavelet plug-in.
// Created by Dmitry "AND" Andreev 2016.
// License Creative Commons Zero v1.0 Universal.

#target photoshop
app;

function openUrl( url ) {
	if ( $.os.indexOf( "Windows" ) != -1 ) {
		// Windows
		app.system( "start " + url );
	} else {
		// Mac
		system.callSystem( "open " + url );
	}
}

function addBrightnessContrastLayer() {
	var idMk = charIDToTypeID( "Mk  " );
		var desc2 = new ActionDescriptor();
		var idnull = charIDToTypeID( "null" );
			var ref1 = new ActionReference();
			var idAdjL = charIDToTypeID( "AdjL" );
			ref1.putClass( idAdjL );
		desc2.putReference( idnull, ref1 );
		var idUsng = charIDToTypeID( "Usng" );
			var desc3 = new ActionDescriptor();
			var idType = charIDToTypeID( "Type" );
				var desc4 = new ActionDescriptor();
				var iduseLegacy = stringIDToTypeID( "useLegacy" );
				desc4.putBoolean( iduseLegacy, true );
			var idBrgC = charIDToTypeID( "BrgC" );
			desc3.putObject( idType, idBrgC, desc4 );
		var idAdjL = charIDToTypeID( "AdjL" );
		desc2.putObject( idUsng, idAdjL, desc3 );
	executeAction( idMk, desc2, DialogModes.NO );

	var idDlt = charIDToTypeID( "Dlt " );
		var desc5 = new ActionDescriptor();
		var idnull = charIDToTypeID( "null" );
			var ref2 = new ActionReference();
			var idChnl = charIDToTypeID( "Chnl" );
			var idOrdn = charIDToTypeID( "Ordn" );
			var idTrgt = charIDToTypeID( "Trgt" );
			ref2.putEnumerated( idChnl, idOrdn, idTrgt );
		desc5.putReference( idnull, ref2 );
	executeAction( idDlt, desc5, DialogModes.NO );
}

function generateDocWavelets( waveletDoc, levelCount, addExtraControls ) {
	waveletDoc.paste();
	waveletDoc.activeLayer.name = "Original";

	var original = waveletDoc.activeLayer;

	for ( var i = 0; i < levelCount; i++ ) {
		var src = waveletDoc.activeLayer;
		var octave1 = original.duplicate()
		octave1.move( src, ElementPlacement.PLACEBEFORE );
		octave1.applyGaussianBlur( Math.pow( 2.0, i ) - 0.5 );
		octave1.name = "Blurred " + String(i + 1);
		var octave1_blr = octave1.duplicate();
		octave1_blr.visible = false;

		octave1.mixChannels( [[50, 0, 0, 0], [0, 50, 0, 0], [0, 0, 50, 0]], false );

		var src2 = src.duplicate();
		src2.move( src, ElementPlacement.PLACEBEFORE );
		src2.mixChannels( [[50, 0, 0, 50], [0, 50, 0, 50], [0, 0, 50, 50]], false );

		octave1.move( src2, ElementPlacement.PLACEBEFORE );
		octave1.blendMode = BlendMode.SUBTRACT;

		waveletDoc.selection.selectAll();
		waveletDoc.selection.copy( true );

		var res = waveletDoc.paste();
		res.name = "Scale " + String(i + 1);
		res.move( src2, ElementPlacement.PLACEBEFORE );
		res.blendMode = BlendMode.LINEARLIGHT;

		src2.remove();
		octave1.remove();

		if ( i > 0 ) {
			src.remove();
		}

		octave1_blr.visible = true;
		waveletDoc.activeLayer = octave1_blr;
	}

	var residual = waveletDoc.activeLayer;
	residual.name = "Residual";

	var group = app.activeDocument.layerSets.add();
	group.name = "Wavelet";

	if ( addExtraControls ) {
		app.activeDocument.artLayers[ 0 ].move( group, ElementPlacement.INSIDE );

		for ( var i = 0; i < levelCount; i++ ) {
			var groupScale = group.layerSets.add();
			groupScale.blendMode = BlendMode.LINEARLIGHT;
			groupScale.name = "Scale " + String(levelCount - i);
			app.activeDocument.artLayers[ 0 ].move( groupScale, ElementPlacement.INSIDE );
			addBrightnessContrastLayer();
			waveletDoc.activeLayer.name = "Adjust";
		}
	} else {
		for ( var i = 0; i <= levelCount; i++ ) {
			app.activeDocument.artLayers[ 0 ].move( group, ElementPlacement.INSIDE );
		}
	}
}

function generateWavelets( levelCount, addExtraControls ) {
	levelCount = parseInt( levelCount, 10 );
	var activeLayer = app.activeDocument.activeLayer;

	app.activeDocument.selection.selectAll();

	try { app.activeDocument.selection.copy( true ); }
	catch (e) {
		try { app.activeDocument.selection.copy(); }
		catch (e) { alert(e); }
	}

	var waveletDoc = app.documents.add(
		app.activeDocument.width,
		app.activeDocument.height,
		app.activeDocument.resolution,
		app.activeDocument.name + "-" + activeLayer.name + "-Wavelet",
		NewDocumentMode.RGB, DocumentFill.TRANSPARENT,
		app.activeDocument.pixelAspectRatio,
		BitsPerChannelType.SIXTEEN
		);

	try { app.activeDocument.suspendHistory("Wavelet", "generateDocWavelets( waveletDoc, levelCount, addExtraControls )") }
	catch(e) { alert(e); } 
}

function showDialog() {
	var dlg = new Window( "dialog", "Wavelet decompose for Photoshop" );

	dlg.main = dlg.add( "group", undefined, );

	dlg.group = dlg.main.add( "panel", undefined );
	dlg.group.alignment  = "top";
	dlg.group.orientation = "column";
	dlg.group3 = dlg.group.add( "group", undefined, );
	dlg.group3.orientation = "row";
	dlg.panel_text = dlg.group3.add( "statictext", undefined, "Number of wavelet detail scales:" );
	dlg.panel_list = dlg.group3.add( "dropdownlist", undefined, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] );
	dlg.panel_list.selection = 4;
	dlg.panel_chk_extra = dlg.group.add( "checkbox", undefined, "Add extra Brightness/Contrast controls" );

	dlg.group2 = dlg.main.add( "group", undefined, );
	dlg.group2.orientation = "column";

	dlg.btn_ok = dlg.group2.add( "button", undefined, "OK", {name:'ok'} );
	dlg.btn_cancel = dlg.group2.add( "button", undefined, "Cancel", {name:"close"} );
	dlg.btn_help = dlg.group2.add( "button", undefined, "Help", {name:"help"} );

	dlg.btn_ok.onClick = function() {
		dlg.close();
		generateWavelets( dlg.panel_list.selection + 1, dlg.panel_chk_extra.value );
	}

	dlg.btn_help.onClick = function() {
		openUrl( "http://registry.gimp.org/node/11742" );
	}

	dlg.show();
}

showDialog();
