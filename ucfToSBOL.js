var fs = require('fs');
var SBOLDocument = require('sboljs');
var terms = SBOLDocument.terms;

var ucf = JSON.parse(fs.readFileSync('Eco1C1G1T0.UCF.json') + '');

var partsArr = [];
var gate_partsArr = [];
var response_funcArr = [];

const version = '1-Eco1C1G1T0';
const derivedFrom = 'https://github.com/CIDARLAB/cello/blob/master/resources/UCF/Eco1C1G1T0.UCF.json';

ucf.forEach(function(collection) {
    switch(collection.collection){
        case 'parts':
            partsArr.push(collection);
            break;
        case 'gate_parts':
            gate_partsArr.push(collection);
            break;
        case 'response_functions':
            response_funcArr.push(collection);
            break;
    }
    
}, this);

console.log(partsArr);
convertPartsToSBOL(partsArr);


function convertPartsToSBOL(partCollection){

    partCollection.forEach(function(part){

            var sbol = new SBOLDocument();
            const componentDefinition = sbol.componentDefinition()
            componentDefinition.version = version;
            componentDefinition.displayId = part.name;
            componentDefinition.name = part.name;
            componentDefinition.persistentIdentity = "http://cellocad.org/" + componentDefinition.displayId;
            componentDefinition.uri = componentDefinition.persistentIdentity + '/' + componentDefinition.version;
            componentDefinition.wasDerivedFrom = derivedFrom;

            const sequence = sbol.sequence()
            sequence.version = version;
            sequence.displayId = part.name + '_sequence';
            sequence.name = part.name + '_sequence';
            sequence.version = version;
            sequence.elements = part.dnasequence;
            sequence.persistentIdentity = "http://cellocad.org/" + sequence.displayId;
            sequence.uri = sequence.persistentIdentity + '/' + sequence.version;
            sequence.wasDerivedFrom = derivedFrom;
            componentDefinition.addSequence(sequence)
            
            
    }, this);    

};