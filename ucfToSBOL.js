var fs = require('fs');
var SBOLDocument = require('sboljs');
var terms = SBOLDocument.terms;

//Constant Terms
var so = 'http://identifiers.org/so/'
const version = '1-Eco1C1G1T0';
const derivedFrom = 'https://github.com/CIDARLAB/cello/blob/master/resources/UCF/Eco1C1G1T0.UCF.json';
const datecreated = new Date("April 1, 2016 00:00:00");
const urlsuffix = 'http://cellocad.org/';


const ymax = 'http://mathworld.wolfram.com/Maximum.html';
const ymin = 'http://mathworld.wolfram.com/Minimum.html';
const n = 'http://mathworld.wolfram.com/Slope.html';
const kd = 'https://en.wikipedia.org/wiki/Dissociation_constant';
const eqn = 'https://en.wikipedia.org/wiki/Equation';

const gate_parts_so = 'http://identifiers.org/so/SO:0000804';

//Cello UCF File
var ucf = JSON.parse(fs.readFileSync('Eco1C1G1T0.UCF.json') + '');

//Arrays to store each JSON collection object in the UCF
var gate_partsArr = [];
var response_funcMap = {};

var partsMap = {};

ucf.forEach(function (collection) {
    switch (collection.collection) {
        case 'parts':
            //partsArr.push(collection);
            partsMap[collection.name] = collection;
            break;
        case 'gate_parts':
            gate_partsArr.push(collection);
            break;
        case 'response_functions':
            response_funcMap[collection.gate_name] = collection;
            break;
    }

}, this);

var partsSBOL = {}
var sbol = new SBOLDocument();

//console.log(partsArr);
convertPartsToSBOL();
convertGatePartsToSBOL();


//console.log(sbol.serializeXML());

fs.writeFile("cello.xml", sbol.serializeXML(), function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("Cello SBOL file created!");
});


function convertPartsToSBOL() {

    Object.keys(partsMap).forEach(function(partkey){
        var part = partsMap[partkey];
        var partName = part.name;

        if (!(partName in partsSBOL)) {
            const componentDefinition = sbol.componentDefinition()
            componentDefinition.version = version;
            componentDefinition.displayId = part.name;
            componentDefinition.name = part.name;
            componentDefinition.persistentIdentity = urlsuffix + componentDefinition.displayId;
            componentDefinition.uri = componentDefinition.persistentIdentity + '/' + componentDefinition.version;
            componentDefinition.wasDerivedFrom = derivedFrom;

            const sequence = sbol.sequence()
            sequence.displayId = part.name + '_sequence';
            sequence.name = part.name + '_sequence';
            sequence.version = version;
            sequence.elements = part.dnasequence;
            sequence.persistentIdentity = urlsuffix + sequence.displayId;
            sequence.uri = sequence.persistentIdentity + '/' + sequence.version;
            sequence.wasDerivedFrom = derivedFrom;
            componentDefinition.addSequence(sequence)

            componentDefinition.addType(getPartType(part.type));
            componentDefinition.addStringAnnotation('http://purl.org/dc/terms/created', datecreated.toISOString() + '');
            var uriVal = componentDefinition.uri;
            partsSBOL[partName] = uriVal;
        }
    },this);
    

};

function convertGatePartsToSBOL(){
    
    gate_partsArr.forEach(function (gpart){
        var gpartName = gpart.gate_name;
        const componentDefinition = sbol.componentDefinition();
        componentDefinition.version = version;
        componentDefinition.displayId = gpartName;
        componentDefinition.name = gpartName;
        componentDefinition.persistentIdentity = urlsuffix + componentDefinition.displayId;
        componentDefinition.uri = componentDefinition.persistentIdentity + '/' + componentDefinition.version;
        componentDefinition.wasDerivedFrom = derivedFrom;
        
        //Parts in Cassette
        
        console.log('Cassettes in ' + gpartName);
        gpart.expression_cassettes.forEach(function(expression_cassettesArr){
            var seq = "";
            var annotationCount = 0;
            var start = 1;
            
            expression_cassettesArr.cassette_parts.forEach(function(cassette){
                var cass_seq = partsMap[cassette].dnasequence;
                seq += cass_seq;
                
                const sa = sbol.sequenceAnnotation();
                sa.displayId = 'annotation' + annotationCount;
                annotationCount++;
                sa.name = cassette;
                sa.version = version;
                sa.persistentIdentity = componentDefinition.persistentIdentity + '/' + sa.displayId;
                sa.uri = sa.persistentIdentity + '/' + sa.version;
                sa.addRole(getPartType(partsMap[cassette].type))
                sa.description = partsMap[cassette].type;
                
                const range = sbol.range();
                range.displayId = 'range';
                range.persistentIdentity = sa.persistentIdentity + '/' + range.displayId;
                range.version = version;
                range.uri = range.persistentIdentity + '/' + range.version;
                range.start = start;
                var end = start + cass_seq.length-1;
                range.end = end;
                
                sa.addLocation(range);
                
                componentDefinition.addSequenceAnnotation(sa);
                console.log("For " +  cassette + " URI is " + partsSBOL[cassette]);
                componentDefinition.addComponent(partsSBOL[cassette].toString());

                start += cass_seq.length;

            });
            const sequence = sbol.sequence()
            sequence.displayId = gpartName + '_sequence';
            sequence.name = gpartName + '_sequence';
            sequence.version = version;
            sequence.elements = seq;
            sequence.persistentIdentity = urlsuffix + sequence.displayId;
            sequence.uri = sequence.persistentIdentity + '/' + sequence.version;
            sequence.wasDerivedFrom = derivedFrom;
            componentDefinition.addSequence(sequence);

            componentDefinition.addType(gate_parts_so);
            componentDefinition.addStringAnnotation('http://purl.org/dc/terms/created', datecreated.toISOString() + '');
            
            response_funcMap[gpartName].parameters.forEach(function(param){
                switch(param.name){
                    case 'ymax':
                        componentDefinition.addStringAnnotation(ymax, param.value);
                        break;
                    case 'ymin':
                       componentDefinition.addStringAnnotation(ymin, param.value);
                        break;
                    case 'K':
                        componentDefinition.addStringAnnotation(kd, param.value);
                        break;
                    case 'n':
                        componentDefinition.addStringAnnotation(n, param.value);
                        break;
                }
            }, this);
            componentDefinition.addStringAnnotation(eqn, response_funcMap[gpartName].equation);

        }, this);
        

    }, this);
};

function getPartType(part) {
    if (part === 'ribozyme') {
        return so + 'SO:0000374';
    }
    else if (part === 'scar') {
        return so + 'SO:0001953';
    }
    else if (part === 'cds') {
        return so + 'SO:0000316';
    }
    else if (part === 'promoter') {
        return so + 'SO:0000167';
    }
    else if (part === 'rbs') {
        return so + 'SO:0000139';
    }
    else if (part === 'terminator') {
        return so + 'SO:0000141';
    } else {
        console.log('Part Type not found');
    }
}