# Running the Cello UCF to SBOL script

## With default configurations
Once you have installed all dependencies (listed in [INSTALL.md](INSTALL.md), go to the folder where you have downloaded the source code. 
Then type the following in a terminal:
```sh
node ucfToSBOL.js
```
If you are using the default UCF file, this will create the following files: 
- **cello.xml** - in the `/result/` folder.
- **circuitConstraints.json** - in the `/result/` folder.
- **14 cytometry json files** - in the `/result/cytometry/` folder.
- **14 toxicity json files** - in the `/result/toxicity/` folder.

## Using custom files and configurations
The default UCF file used by the script is `/ucf/Eco1C1G1T0.UCF.json`. You can use the script for any Cello UCF file. Replace the value of the `ucfFilepath` variable in `/ucfToSBOL.js`. 

You can also change the filepath of the folder where the result files are created by changing the value of the `resultFolder` variable of the main result folder, the `cytometryFolder` variable to change where the cytometry json files are created, the `toxicityFolder` to change where the toxicity json files are created and the `resultSBOL` variable to change the name and filepath of the resulting SBOL file.


# Uploading the SBOL file to Synbiohub. 
- In a browser, type the address of the desired synbiohub instance.
- Log in (or sign up if you do not have an account). 
- Click on the Submit button in the top right.
- In the submission form, fill in the ID, VERSION, NAME, DESCRIPTION, CITATIONS (Pubmed IDs if any). 
- Upload the **cello.xml** (or the name of the xml file if you changed the output file) in the SBOL/GENBANK/FASTA FILE. 
- Click submit. 

Once the file has been submitted, you can make the collection public by clicking the **Make Public** button. 

## Uploading attachments
- Once the SBOL file has been submitted, click on the newly created Collection.
- Upload the **circuitConstraints.json** as an attachment. 
- Search for each ComponentDefinition for the following gates (if you are using the default Cello UCF file):
1. A1_AmtR
2. B1_BM3R1
3. B2_BM3R1
4. B3_BM3R1
5. E1_BetI
6. F1_AmeR
7. H1_HlyIIR
8. P1_PhlF
9. P2_PhlF
10. P3_PhlF
11. S1_SrpR
12. S2_SrpR
13. S3_SrpR
14. S4_SrpR
- For each such Component Definition, attach the corresponding cytometry and toxicity json file. 
