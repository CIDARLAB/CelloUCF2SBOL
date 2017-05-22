//Dependencies
var fs = require('fs');
var SBOLDocument = require('sboljs');


//IO Locations
var ucfFilepath = 'ucf/Eco1C1G1T0.UCF.json';
var resultFolder = 'result/';
var cytometryFolder = resultFolder + 'cytometry/';
var toxicityFolder = resultFolder + 'toxicity/';
var resultSBOL = resultFolder + 'cello.xml';


//Constant Terms
const version = '1-Eco1C1G1T0';
const urlprefix = 'http://cellocad.org/';
const derivedFrom = 'https://github.com/CIDARLAB/cello/blob/master/resources/UCF/Eco1C1G1T0.UCF.json';

const datecreated = new Date("April 1, 2016 00:00:00");
const today = new Date();

var terms = SBOLDocument.terms;
var so = 'http://identifiers.org/so/'
var sbo = 'http://identifiers.org/biomodels.sbo/';
const provNS = 'http://www.w3.org/ns/prov#';
const dcNS = 'http://purl.org/dc/elements/1.1/';
const ownedBy = 'http://wiki.synbiohub.org/wiki/Terms/synbiohub#/ownedBy';
const productionSO = sbo + 'SBO:0000589';
const inhibitionSO = sbo + 'SBO:0000169';
const inhibitorSO = sbo + 'SBO:0000020';
const inhibitedSO = sbo + 'SBO:0000642';
const templateSO = sbo + 'SBO:0000645';
const productSO = sbo + 'SBO:0000011';
const regulatorSO = sbo + 'SBO:0000369';
//const tetrFamilySO = so + 'SO:0000187'; //SO for repeat sequences.


var celloSO = 'https://github.com/CIDARLAB/cello/wiki/Cello-SBOL-Description#';
const ymax = celloSO + 'ymax';
const ymin = celloSO + 'ymin';
const n = celloSO + 'n';
const kd = celloSO + 'K';
const eqn = celloSO + 'response-function';
const gate_type = celloSO + 'gate_type';
const color_hexcode = celloSO + 'gate-color-hexcode';
const group_name = celloSO + 'group-name';
const tetR_family = celloSO + 'family'
const gate_parts_so = 'http://identifiers.org/so/SO:0000804';
//var activityURI = 'https://synbiohub.programmingbiology.org/public/Cello_Parts/cello2sbol/1';

//Create a new SBOL Document
var sbol = new SBOLDocument();

//Only Required while creating this the first time.
//Create an Activity - A conversion script
var actVersion = 1;
var actDisplayId = 'cello2sbol';
var actPersistantIdentity = urlprefix + actDisplayId;
var activityURI = actPersistantIdentity + '/' + actVersion;

const activity = sbol.genericTopLevel(activityURI, provNS + 'Activity');
activity.version = actVersion;
activity.displayId = actDisplayId;
activity.name = 'Cello UCF to SBOL conversion';
activity.description = 'Conversion of the Cello UCF parts and metadata to SBOL2.1';
activity.addStringAnnotation(dcNS + 'creator', 'Prashant Vaidyanathan');
activity.addStringAnnotation(dcNS + 'creator', 'Chris J. Myers');
activity.addStringAnnotation('http://purl.org/dc/terms/created', today.toISOString() + '');
activity.persistentIdentity = actPersistantIdentity;
activity.uri = activityURI;



//Load the Cello UCF File
var ucf = JSON.parse(fs.readFileSync(ucfFilepath) + '');

//Arrays and Maps to store each JSON collection object in the UCF
var gate_partsArr = [];
var response_funcMap = {};
var partsMap = {};
var partsSBOL = {}
var moduleDefnMap = {}
var cytometryMap = {};
var toxicityMap = {};
var gatesMap = {};

var motif_library = [];
var logicConstraints;
var eugeneRules;
var geneticLocations;
var measurementstd;
var header;

//Go through the UCF file to store collections in local data structures (arrays and maps)
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
        case 'gates':
            gatesMap[collection.gate_name] = collection;
            break;
        case 'gate_cytometry':
            cytometryMap[collection.gate_name] = collection.cytometry_data;
            break;
        case 'gate_toxicity':
            toxicityMap[collection.gate_name] = collection;
            break;
        case 'motif_library':
            motif_library.push(collection);
            break;
        case 'logic_constraints':
            logicConstraints = collection;
            break;
        case 'eugene_rules':
            eugeneRules = collection;
            break;
        case 'genetic_locations':
            geneticLocations = collection;
            break;
        case 'measurement_std':
            measurementstd = collection;
            break;
        case 'header':
            header = collection;
            break;
    }

}, this);

//Function calls to create the SBOL Document
convertPartsToSBOL();
convertGatePartsToSBOL();
//Function calls to create attachments
convertCytometryToAttachments();
covertToxicityToAttachments();
createCircuitConstraintsFile();

//Write the SBOL document to an XML file.
fs.writeFile(resultSBOL, sbol.serializeXML(), function (err) {
    if (err) {
        return console.log(err);
    }

    console.log("Cello SBOL file created!");
});


//Function to convert Cello Parts to SBOL
function convertPartsToSBOL() {

    Object.keys(partsMap).forEach(function (partkey) {
        var part = partsMap[partkey];
        var partName = part.name;

        if (!(partName in partsSBOL)) {
            const componentDefinition = sbol.componentDefinition()
            componentDefinition.version = version;
            componentDefinition.displayId = part.name;
            componentDefinition.name = part.name;
            componentDefinition.persistentIdentity = urlprefix + componentDefinition.displayId;
            componentDefinition.uri = componentDefinition.persistentIdentity + '/' + componentDefinition.version;
            componentDefinition.wasDerivedFrom = derivedFrom;
            componentDefinition.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);

            const sequence = sbol.sequence()
            sequence.displayId = part.name + '_sequence';
            sequence.name = part.name + '_sequence';
            sequence.version = version;
            sequence.elements = part.dnasequence;
            sequence.persistentIdentity = urlprefix + sequence.displayId;
            sequence.uri = sequence.persistentIdentity + '/' + sequence.version;
            sequence.wasDerivedFrom = derivedFrom;
            sequence.encoding = SBOLDocument.terms.dnaSequence;
            sequence.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);
            componentDefinition.addSequence(sequence)

            componentDefinition.addRole(getPartType(part.type));
            componentDefinition.addType(SBOLDocument.terms.dnaRegion);

            // Create a Protein 
            if (part.type === 'cds') {
                const proteinComponentDefinition = sbol.componentDefinition();
                proteinComponentDefinition.version = version;
                proteinComponentDefinition.displayId = componentDefinition.displayId + '_protein';
                proteinComponentDefinition.name = componentDefinition.displayId + '_protein';
                proteinComponentDefinition.persistentIdentity = urlprefix + proteinComponentDefinition.displayId;
                proteinComponentDefinition.uri = proteinComponentDefinition.persistentIdentity + '/' + proteinComponentDefinition.version;
                proteinComponentDefinition.addType(SBOLDocument.terms.protein);
                proteinComponentDefinition.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);
                partsSBOL[partName + '_protein'] = proteinComponentDefinition.uri;

                const moduleDefinition = sbol.moduleDefinition();
                moduleDefinition.name = proteinComponentDefinition.displayId + '_production';
                moduleDefinition.version = version;
                moduleDefinition.displayId = proteinComponentDefinition.displayId + '_production';
                moduleDefinition.persistentIdentity = urlprefix + moduleDefinition.displayId;
                moduleDefinition.uri = moduleDefinition.persistentIdentity + '/' + moduleDefinition.version;
                moduleDefinition.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);

                //Functional Component for Coding sequence
                const functionalComponentCDS = sbol.functionalComponent();
                functionalComponentCDS.version = version;
                functionalComponentCDS.displayId = componentDefinition.displayId + '_functionalComponent';
                functionalComponentCDS.name = componentDefinition.name + '_functionalComponent';
                functionalComponentCDS.persistentIdentity = moduleDefinition.persistentIdentity + '/' + functionalComponentCDS.displayId;
                functionalComponentCDS.uri = functionalComponentCDS.persistentIdentity + '/' + functionalComponentCDS.version;
                functionalComponentCDS.definition = componentDefinition;

                //Functional Component for Protein
                const functionalComponentProt = sbol.functionalComponent();
                functionalComponentProt.version = version;
                functionalComponentProt.displayId = proteinComponentDefinition.displayId + '_functionalComponent';
                functionalComponentProt.name = proteinComponentDefinition.name + '_functionalComponent';
                functionalComponentProt.persistentIdentity = moduleDefinition.persistentIdentity + '/' + functionalComponentProt.displayId;
                functionalComponentProt.uri = functionalComponentProt.persistentIdentity + '/' + functionalComponentProt.version;
                functionalComponentProt.definition = proteinComponentDefinition;

                //CDS to Protein interaction
                const interaction = sbol.interaction();
                interaction.displayId = proteinComponentDefinition.displayId + '_interaction';
                interaction.name = interaction.displayId;
                interaction.version = version;
                interaction.persistentIdentity = moduleDefinition.persistentIdentity + '/' + interaction.displayId;
                interaction.uri = interaction.persistentIdentity + '/' + interaction.version;
                interaction.addType(productionSO);

                //CDS Participation
                const participationCDS = sbol.participation();
                participationCDS.version = version;
                participationCDS.name = componentDefinition.displayId + '_participation';
                participationCDS.displayId = componentDefinition.displayId + '_participation';
                participationCDS.persistentIdentity = interaction.persistentIdentity + '/' + participationCDS.displayId;
                participationCDS.uri = participationCDS.persistentIdentity + '/' + participationCDS.version;
                participationCDS.addRole(templateSO);
                participationCDS.participant = functionalComponentCDS;

                //Protein Participation
                const participationProt = sbol.participation();
                participationProt.version = version;
                participationProt.name = proteinComponentDefinition.displayId + '_participation';
                participationProt.displayId = proteinComponentDefinition.displayId + '_participation';
                participationProt.persistentIdentity = interaction.persistentIdentity + '/' + participationProt.displayId;
                participationProt.uri = participationProt.persistentIdentity + '/' + participationProt.version;
                participationProt.addRole(productSO);
                participationProt.participant = functionalComponentProt;

                interaction.addParticipation(participationCDS);
                interaction.addParticipation(participationProt);

                moduleDefinition.addFunctionalComponent(functionalComponentCDS);
                moduleDefinition.addFunctionalComponent(functionalComponentProt);
                moduleDefinition.addInteraction(interaction);

            }

            componentDefinition.addStringAnnotation('http://purl.org/dc/terms/created', datecreated.toISOString() + '');
            var uriVal = componentDefinition.uri;
            partsSBOL[partName] = uriVal;
        }
    }, this);


};

//Function to convert Cello Gate Parts to SBOL
function convertGatePartsToSBOL() {

    gate_partsArr.forEach(function (gpart) {
        var gpartName = gpart.gate_name;
        const componentDefinition = sbol.componentDefinition();
        componentDefinition.version = version;
        componentDefinition.displayId = gpartName;
        componentDefinition.name = gpartName;
        componentDefinition.persistentIdentity = urlprefix + componentDefinition.displayId;
        componentDefinition.uri = componentDefinition.persistentIdentity + '/' + componentDefinition.version;
        componentDefinition.wasDerivedFrom = derivedFrom;
        componentDefinition.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);

        //add information from Gates Collection
        componentDefinition.addUriAnnotation(tetR_family, gatesMap[gpartName].system);
        //componentDefinition.addUriAnnotation(regulatorSO, gatesMap[gpartName].regulator);
        componentDefinition.addUriAnnotation(group_name, gatesMap[gpartName].group_name);
        componentDefinition.addUriAnnotation(gate_type, gatesMap[gpartName].gate_type );
        componentDefinition.addUriAnnotation(color_hexcode, gatesMap[gpartName].color_hexcode);

        //Cassette parts in Gate
        gpart.expression_cassettes.forEach(function (expression_cassettesArr) {
            var seq = "";
            var annotationCount = 0;
            var start = 1;

            expression_cassettesArr.cassette_parts.forEach(function (cassette) {

                const component = sbol.component();
                component.version = version;
                component.displayId = cassette;
                component.name = cassette;
                component.persistentIdentity = componentDefinition.persistentIdentity + '/' + component.displayId;
                component.uri = component.persistentIdentity + '/' + component.version;
                component.definition = sbol.lookupURI(partsSBOL[cassette]);
                componentDefinition.addComponent(component);

                var cass_seq = partsMap[cassette].dnasequence;
                seq += cass_seq;

                const sa = sbol.sequenceAnnotation();
                sa.displayId = 'annotation' + annotationCount;
                annotationCount++;
                sa.name = cassette;
                sa.version = version;
                sa.persistentIdentity = componentDefinition.persistentIdentity + '/' + sa.displayId;
                sa.uri = sa.persistentIdentity + '/' + sa.version;
                sa.component = component;
                sa.description = partsMap[cassette].type;

                const range = sbol.range();
                range.displayId = 'range';
                range.persistentIdentity = sa.persistentIdentity + '/' + range.displayId;
                range.version = version;
                range.uri = range.persistentIdentity + '/' + range.version;
                range.start = start;
                var end = start + cass_seq.length - 1;
                range.end = end;
                range.orientation = 'http://sbols.org/v2#inline';

                sa.addLocation(range);
                componentDefinition.addSequenceAnnotation(sa);

                //Create Protein -> Promoter repression Module definition
                if (partsMap[cassette].type === 'cds') {
                    if (!(cassette in moduleDefnMap)) {

                        const moduleDefinition = sbol.moduleDefinition();
                        moduleDefinition.version = version;
                        moduleDefinition.name = cassette + '_' + gpart.promoter + '_repression';
                        moduleDefinition.displayId = cassette + '_' + gpart.promoter + '_repression';
                        moduleDefinition.persistentIdentity = urlprefix + moduleDefinition.displayId;
                        moduleDefinition.uri = moduleDefinition.persistentIdentity + '/' + moduleDefinition.version;
                        moduleDefinition.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);

                        //Functional Component for Protein
                        const functionalComponentCDS = sbol.functionalComponent();
                        functionalComponentCDS.version = version;
                        functionalComponentCDS.name = cassette + '_protein_functionalComponent';
                        functionalComponentCDS.displayId = cassette + '_protein_functionalComponent';
                        functionalComponentCDS.persistentIdentity = moduleDefinition.persistentIdentity + '/' + functionalComponentCDS.displayId;
                        functionalComponentCDS.uri = functionalComponentCDS.persistentIdentity + '/' + functionalComponentCDS.version;
                        functionalComponentCDS.definition = sbol.lookupURI(partsSBOL[cassette + '_protein']);

                        //Functional Component for Promoter
                        const functionalComponentProm = sbol.functionalComponent();
                        functionalComponentProm.version = version;
                        functionalComponentProm.name = gpart.promoter + '_functionalComponent';
                        functionalComponentProm.displayId = gpart.promoter + '_functionalComponent';
                        functionalComponentProm.persistentIdentity = moduleDefinition.persistentIdentity + '/' + functionalComponentProm.displayId;
                        functionalComponentProm.uri = functionalComponentProm.persistentIdentity + '/' + functionalComponentProm.version;
                        functionalComponentProm.definition = sbol.lookupURI(partsSBOL[gpart.promoter]);

                        //Protein -> Promoter Interaction
                        const interaction = sbol.interaction();
                        interaction.version = version;
                        interaction.name = cassette + '_' + gpart.promoter + '_interaction';
                        interaction.displayId = cassette + '_' + gpart.promoter + '_interaction';
                        interaction.persistentIdentity = moduleDefinition.persistentIdentity + '/' + interaction.displayId;
                        interaction.uri = interaction.persistentIdentity + '/' + interaction.version;
                        interaction.addType(inhibitionSO);

                        //Protein participation
                        const participantProt = sbol.participation();
                        participantProt.version = version;
                        participantProt.name = cassette + '_protein_participation';
                        participantProt.displayId = cassette + '_protein_participation';
                        participantProt.persistentIdentity = interaction.persistentIdentity + '/' + participantProt.displayId;
                        participantProt.uri = participantProt.persistentIdentity + '/' + participantProt.version;
                        participantProt.addRole(inhibitorSO);
                        participantProt.participant = functionalComponentCDS;

                        //Promoter participation
                        const participantProm = sbol.participation();
                        participantProm.version = version;
                        participantProm.name = gpart.promoter + '_participation';
                        participantProm.displayId = gpart.promoter + '_participation';
                        participantProm.persistentIdentity = interaction.persistentIdentity + '/' + participantProm.displayId;
                        participantProm.uri = participantProm.persistentIdentity + '/' + participantProm.version;
                        participantProm.addRole(inhibitedSO);
                        participantProm.participant = functionalComponentProm;

                        interaction.addParticipation(participantProt);
                        interaction.addParticipation(participantProm);

                        moduleDefinition.addFunctionalComponent(functionalComponentCDS);
                        moduleDefinition.addFunctionalComponent(functionalComponentProm);
                        moduleDefinition.addInteraction(interaction);


                        moduleDefnMap[cassette] = gpart.promoter;
                    }
                }

                start += cass_seq.length;

            });
            const sequence = sbol.sequence()
            sequence.displayId = gpartName + '_sequence';
            sequence.name = gpartName + '_sequence';
            sequence.version = version;
            sequence.elements = seq;
            sequence.persistentIdentity = urlprefix + sequence.displayId;
            sequence.uri = sequence.persistentIdentity + '/' + sequence.version;
            sequence.wasDerivedFrom = derivedFrom;
            sequence.encoding = SBOLDocument.terms.dnaSequence;
            sequence.addUriAnnotation(provNS + 'wasGeneratedBy', activityURI);
            componentDefinition.addSequence(sequence);

        }, this);

        response_funcMap[gpartName].parameters.forEach(function (param) {
            switch (param.name) {
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

        componentDefinition.addType(SBOLDocument.terms.dnaRegion);
        componentDefinition.addRole(gate_parts_so);
        componentDefinition.addStringAnnotation('http://purl.org/dc/terms/created', datecreated.toISOString() + '');
    }, this);
};

function convertCytometryToAttachments() {
    Object.keys(cytometryMap).forEach(function (cytometry) {
        var cytometry_filepath = cytometryFolder + cytometry + '_cytometry.json';
        fs.writeFile(cytometry_filepath, JSON.stringify(cytometryMap[cytometry], null, 2), function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("Cytometry file for " + cytometry + " created!");
        });
    }, this);
}

function covertToxicityToAttachments() {
    Object.keys(toxicityMap).forEach(function (toxicity) {
        var toxicity_filepath = toxicityFolder + toxicity + '_toxicity.json';
        var toxMap = {};
        toxMap['input'] = toxicityMap[toxicity].input;
        toxMap['growth'] = toxicityMap[toxicity].growth;
        fs.writeFile(toxicity_filepath, JSON.stringify(toxMap, null, 2), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("Toxicity file for " + toxicity + " created!");
        });
    }, this);
}

function createCircuitConstraintsFile() {
    var constraints = {};
    constraints['logic_constraints'] = logicConstraints;
    constraints['motif_library'] = motif_library;
    constraints['eugene_rules'] = eugeneRules;
    constraints['genetic_locations'] = geneticLocations;
    constraints['measurement_std'] = measurementstd;
    constraints['header'] = header;
    var circuitConstraintsFilepath = resultFolder + 'circuitConstraints.json'
    fs.writeFile(circuitConstraintsFilepath, JSON.stringify(constraints, null, 2), function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Circuit constraints file created!");
    });
}

//Map from Cello Part Type to SO term
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